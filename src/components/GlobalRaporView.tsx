import React from 'react';
import { ArrowLeft, Award, ClipboardCheck, Lock, Printer } from 'lucide-react';
import { DarsProgressRecord, StudentProfile } from '../types/elkpd';
import { CURRICULUM_DARS, TIER_META } from '../data/curriculum';

interface GlobalRaporViewProps {
  student: StudentProfile | null;
  darsProgress: Record<number, DarsProgressRecord>;
  onBack: () => void;
  onOpenDarsEvaluasi: (darsNum: number) => void;
}

export const GlobalRaporView: React.FC<GlobalRaporViewProps> = ({
  student,
  darsProgress,
  onBack,
  onOpenDarsEvaluasi,
}) => {
  const completedRecords = CURRICULUM_DARS.map((d) => darsProgress[d.darsNumber]).filter(
    (r): r is DarsProgressRecord => Boolean(r && r.status === 'SELESAI')
  );
  const avgAll =
    completedRecords.length > 0
      ? Math.round(
          (completedRecords.reduce((sum, r) => sum + r.finalScore, 0) / completedRecords.length) * 10
        ) / 10
      : 0;

  const isUnlocked = (darsNum: number) =>
    darsNum === 1 || darsProgress[darsNum - 1]?.status === 'SELESAI';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="no-print flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pembelajaran</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Rekap Rapor</span>
        </button>
      </div>

      {/* Quick Per-Dars Evaluation Launcher */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        {CURRICULUM_DARS.map((d) => {
          const rec = darsProgress[d.darsNumber];
          const unlocked = isUnlocked(d.darsNumber);
          const evalDone = Boolean(rec?.evaluation?.completed);
          return (
            <div
              key={d.darsNumber}
              className="bg-white border border-sky-100 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div>
                <p className="text-xs font-bold text-sky-700">Evaluasi Dars {d.darsNumber}</p>
                <p className="font-arabic text-xl font-bold text-slate-900 text-right mt-1" dir="rtl" lang="ar">
                  {d.titleAr}
                </p>
                <p className="text-sm font-bold text-slate-800">{d.titleId}</p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {evalDone
                    ? `Nilai Evaluasi: ${rec?.evaluation?.score} (${rec?.evaluation?.correctCount}/${rec?.evaluation?.totalObjective ?? 10} benar)`
                    : 'Belum dikerjakan'}
                </p>
              </div>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onOpenDarsEvaluasi(d.darsNumber)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  unlocked
                    ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {unlocked ? (
                  <>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>{evalDone ? 'Lihat Pembahasan / Ulangi' : 'Buka Evaluasi Dars'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Terkunci</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Unified Digital Rapor Card */}
      <div className="print-container bg-white border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="font-arabic text-2xl font-bold text-sky-900" dir="rtl" lang="ar">
              سِجِلُّ النَّتَائِجِ الدِّرَاسِيَّةِ
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              EVALUASI &amp; REKAP RAPOR DIGITAL (SEMESTER 1)
            </h1>
            {student && (
              <p className="text-sm text-slate-600 mt-1">
                {student.fullName} · Kelas {student.className} · ID {student.studentId} ·{' '}
                <strong>{student.tier ? TIER_META[student.tier].groupLabel : ''}</strong>
              </p>
            )}
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-3 text-center">
            <p className="text-xs font-semibold text-sky-800">Rata-rata Semester</p>
            <p className="text-2xl font-extrabold text-sky-950 tabular-nums">
              {completedRecords.length > 0 ? avgAll : '—'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 pr-3">Dars</th>
                <th className="py-3 px-2 text-right">Istima&apos;</th>
                <th className="py-3 px-2 text-right">Kalam</th>
                <th className="py-3 px-2 text-right">Qira&apos;ah</th>
                <th className="py-3 px-2 text-right">Kitabah</th>
                <th className="py-3 px-2 text-right">Evaluasi</th>
                <th className="py-3 px-2 text-right">Nilai Akhir</th>
                <th className="py-3 px-2">Predikat</th>
                <th className="py-3 pl-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CURRICULUM_DARS.map((d) => {
                const rec = darsProgress[d.darsNumber];
                const done = rec?.status === 'SELESAI';
                const unlocked = isUnlocked(d.darsNumber);
                return (
                  <tr key={d.darsNumber}>
                    <td className="py-4 pr-3">
                      <p className="font-bold text-slate-900">
                        Dars {d.darsNumber}: {d.titleId}
                      </p>
                      <p className="font-arabic text-base text-slate-600" dir="rtl" lang="ar">
                        {d.titleAr}
                      </p>
                    </td>
                    <td className="py-4 px-2 text-right tabular-nums">{rec?.maharah.istima?.score ?? '—'}</td>
                    <td className="py-4 px-2 text-right tabular-nums">{rec?.maharah.kalam?.score ?? '—'}</td>
                    <td className="py-4 px-2 text-right tabular-nums">{rec?.maharah.qiraah?.score ?? '—'}</td>
                    <td className="py-4 px-2 text-right tabular-nums">{rec?.maharah.kitabah?.score ?? '—'}</td>
                    <td className="py-4 px-2 text-right tabular-nums">{rec?.evaluation?.score ?? '—'}</td>
                    <td className="py-4 px-2 text-right font-bold text-sky-800 tabular-nums">
                      {done ? rec.finalScore : '—'}
                    </td>
                    <td className="py-4 px-2 font-medium text-slate-700">{done ? rec.predicate : '—'}</td>
                    <td className="py-4 pl-2">
                      {done ? (
                        <span className="text-xs font-bold text-emerald-700">SELESAI</span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onOpenDarsEvaluasi(d.darsNumber)}
                          className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                        >
                          Buka Evaluasi
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Terkunci</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>
            Seluruh nilai dihitung secara nyata dari pengerjaan 4 Maharah dan Evaluasi masing-masing Dars serta tersimpan ke Google Spreadsheet.
          </span>
        </div>
      </div>
    </div>
  );
};
