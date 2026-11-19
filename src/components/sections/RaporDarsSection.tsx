import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Send,
  RefreshCw,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { DarsProgressRecord, StudentProfile } from '../../types/elkpd';
import { calculatePredicate } from '../../utils/arabicSpeech';

interface RaporDarsSectionProps {
  student: StudentProfile;
  darsNumber: number;
  darsTitleAr: string;
  darsTitleId: string;
  record: DarsProgressRecord;
  spreadsheetConnected: boolean;
  hasNextDars: boolean;
  onSaveAndComplete: () => Promise<{ ok: boolean; message: string; savedMode?: 'spreadsheet' | 'local' }>;
  onGoToNextDars: () => void;
  onBackToDashboard: () => void;
  onJumpToStep: (step: 'istima' | 'kalam' | 'qiraah' | 'kitabah' | 'mahfudzat' | 'evaluasi') => void;
}

export const RaporDarsSection: React.FC<RaporDarsSectionProps> = ({
  student,
  darsNumber,
  darsTitleAr,
  darsTitleId,
  record,
  spreadsheetConnected,
  hasNextDars,
  onSaveAndComplete,
  onGoToNextDars,
  onBackToDashboard,
  onJumpToStep,
}) => {
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    savedMode?: 'spreadsheet' | 'local';
  } | null>(
    record.status === 'SELESAI'
      ? {
          type: 'success',
          message: record.savedToSpreadsheet
            ? 'Nilai telah tersimpan di Google Spreadsheet dan dars ini berstatus SELESAI.'
            : 'Nilai telah tersimpan dan dars ini berstatus SELESAI.',
          savedMode: record.savedMode,
        }
      : null
  );

  const istima = record.maharah.istima;
  const kalam = record.maharah.kalam;
  const qiraah = record.maharah.qiraah;
  const kitabah = record.maharah.kitabah;
  const evaluasi = record.evaluation;

  const missingComponents: Array<{ label: string; step: 'istima' | 'kalam' | 'qiraah' | 'kitabah' | 'mahfudzat' | 'evaluasi' }> = [];
  if (!istima?.completed) missingComponents.push({ label: "Maharah Istima'", step: 'istima' });
  if (!kalam?.completed) missingComponents.push({ label: 'Maharah Kalam', step: 'kalam' });
  if (!qiraah?.completed) missingComponents.push({ label: "Maharah Qira'ah", step: 'qiraah' });
  if (!kitabah?.completed) missingComponents.push({ label: 'Maharah Kitabah', step: 'kitabah' });
  if (!record.mahfudzatCompleted) missingComponents.push({ label: 'Mahfudzat', step: 'mahfudzat' });
  if (!evaluasi?.completed) missingComponents.push({ label: 'Evaluasi 10 Soal', step: 'evaluasi' });

  const allReady = missingComponents.length === 0;

  const sIstima = istima?.score ?? 0;
  const sKalam = kalam?.score ?? 0;
  const sQiraah = qiraah?.score ?? 0;
  const sKitabah = kitabah?.score ?? 0;
  const sEval = evaluasi?.score ?? 0;

  const finalScore = allReady
    ? Math.round(((sIstima + sKalam + sQiraah + sKitabah + sEval) / 5) * 10) / 10
    : 0;
  const predicate = allReady ? calculatePredicate(finalScore) : 'Belum Lengkap';

  const rows = [
    { no: 1, name: "Maharah Istima' (الِاسْتِمَاعُ)", score: istima?.score, completed: Boolean(istima?.completed), step: 'istima' as const },
    { no: 2, name: 'Maharah Kalam (الْكَلَامُ)', score: kalam?.score, completed: Boolean(kalam?.completed), step: 'kalam' as const },
    { no: 3, name: "Maharah Qira'ah (الْقِرَاءَةُ)", score: qiraah?.score, completed: Boolean(qiraah?.completed), step: 'qiraah' as const },
    { no: 4, name: 'Maharah Kitabah (الْكِتَابَةُ)', score: kitabah?.score, completed: Boolean(kitabah?.completed), step: 'kitabah' as const },
    { no: 5, name: 'Evaluasi Akhir Dars (10 Soal)', score: evaluasi?.score, completed: Boolean(evaluasi?.completed), step: 'evaluasi' as const },
  ];

  const handleSave = async () => {
    if (!allReady || saving) return;
    setSaving(true);
    setSaveFeedback(null);
    const res = await onSaveAndComplete();
    setSaving(false);
    setSaveFeedback({
      type: res.ok ? 'success' : 'error',
      message: res.message,
      savedMode: res.savedMode,
    });
  };

  const todayFormatted = new Date(record.savedAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Incomplete Alert */}
      {!allReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Aktivitas Belum Lengkap untuk Mengirim Rapor
              </h4>
              <p className="text-xs sm:text-sm text-amber-800 mt-1">
                Selesaikan seluruh komponen berikut agar sistem dapat menghitung nilai asli dan membuka tombol SIMPAN &amp; SELESAI:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-8">
            {missingComponents.map((mc) => (
              <button
                key={mc.step}
                type="button"
                onClick={() => onJumpToStep(mc.step)}
                className="px-3.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kerjakan {mc.label} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Official Digital Report Card */}
      <div className="print-container bg-white border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Rapor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="font-arabic text-2xl sm:text-3xl font-bold text-sky-900" dir="rtl" lang="ar">
              تَقْرِيرُ نَتَائِجِ التَّعَلُّمِ
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              RAPOR HASIL BELAJAR
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              E-LKPD Bahasa Arab Kelas VII MTs · MTsN 4 Sidoarjo
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer self-start"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor</span>
          </button>
        </div>

        {/* Student Identity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-sky-50/50 border border-sky-100 rounded-2xl p-4 sm:p-5 text-sm">
          <div>
            <p className="text-xs text-slate-500">Nama Siswa</p>
            <p className="font-bold text-slate-900">{student.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Kelas / Nomor Absen</p>
            <p className="font-bold text-slate-900 tabular-nums">
              {student.className} · Absen {student.absenNumber} ({student.studentId})
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Kategori Kemampuan</p>
            <p className="font-bold text-sky-800">{student.tier}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Nama Dars</p>
            <p className="font-bold text-slate-900">
              Dars {darsNumber}: {darsTitleId}{' '}
              <span className="font-arabic text-base text-sky-900">({darsTitleAr})</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Tanggal Pengerjaan</p>
            <p className="font-bold text-slate-900">{todayFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Status Penyelesaian</p>
            <p
              className={`font-bold ${
                record.status === 'SELESAI' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {record.status === 'SELESAI' ? 'SELESAI' : 'MENUNGGU SIMPAN & SELESAI'}
            </p>
          </div>
        </div>

        {/* Score Table + Visual Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 pr-3">No.</th>
                  <th className="py-3 px-3">Komponen Penilaian</th>
                  <th className="py-3 px-3 text-right">Rentang</th>
                  <th className="py-3 pl-3 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((r) => (
                  <tr key={r.no}>
                    <td className="py-3.5 pr-3 font-semibold text-slate-500 tabular-nums">{r.no}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-3.5 px-3 text-right text-xs text-slate-500 tabular-nums">1–100</td>
                    <td className="py-3.5 pl-3 text-right font-bold text-slate-900 tabular-nums">
                      {r.completed && typeof r.score === 'number' ? r.score : 'Belum'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sky-200 bg-sky-50/50">
                  <td colSpan={3} className="py-3.5 px-3 font-bold text-slate-900">
                    Nilai Akhir Dars (Rata-rata 5 Komponen)
                  </td>
                  <td className="py-3.5 pl-3 text-right text-xl font-extrabold text-sky-800 tabular-nums">
                    {allReady ? finalScore : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual Bar Chart & Predicate Box */}
          <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Predikat Hasil Belajar</p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{predicate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Skor Akhir</p>
                <p className="text-2xl font-extrabold text-sky-700 tabular-nums">
                  {allReady ? finalScore : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((r) => {
                const val = r.completed && typeof r.score === 'number' ? r.score : 0;
                return (
                  <div key={r.no} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate pr-2">
                        {r.name.split(' (')[0]}
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">{val}</span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          val >= 90
                            ? 'bg-emerald-500'
                            : val >= 80
                              ? 'bg-sky-600'
                              : val >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                        }`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 pt-1">
              Keterangan Predikat: 90–100 Sangat Baik · 80–89 Baik · 70–79 Cukup · 1–69 Perlu Bimbingan
            </p>
          </div>
        </div>
      </div>

      {/* Primary SIMPAN & SELESAI Action Zone */}
      <div className="no-print bg-white border border-sky-200 rounded-3xl p-6 space-y-4 text-center">
        {!spreadsheetConnected && (
          <p className="text-xs text-slate-500">
            Catatan: URL Google Apps Script Web App belum diatur oleh guru di Dashboard Guru. Nilai akan tersimpan di
            penyimpanan browser (localStorage) hingga Spreadsheet dihubungkan.
          </p>
        )}

        {saveFeedback && (
          <div
            className={`max-w-2xl mx-auto p-4 rounded-2xl border text-sm font-medium flex items-center justify-center gap-2.5 ${
              saveFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {saveFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{saveFeedback.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          {saveFeedback?.type === 'error' ? (
            <button
              type="button"
              disabled={!allReady || saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold tracking-wider text-sm sm:text-base rounded-2xl shadow-sm transition-colors cursor-pointer"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              <span>{saving ? 'MENGIRIM ULANG...' : 'COBA LAGI'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!allReady || saving}
              onClick={handleSave}
              className="inline-flex items-center gap-3 px-8 py-4 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold tracking-widest text-sm sm:text-base rounded-2xl shadow-sm transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span>
                {saving
                  ? 'MENYIMPAN NILAI...'
                  : record.status === 'SELESAI'
                    ? 'PERBARUI & SIMPAN ULANG'
                    : 'SIMPAN & SELESAI'}
              </span>
            </button>
          )}

          {record.status === 'SELESAI' && hasNextDars && (
            <button
              type="button"
              onClick={onGoToNextDars}
              className="inline-flex items-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
            >
              <span>Lanjut ke Dars {darsNumber + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-2xl transition-colors cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
