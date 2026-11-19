import React from 'react';
import {
  Lock,
  CheckCircle2,
  PlayCircle,
  FileBarChart2,
  Award,
  User,
} from 'lucide-react';
import { DarsProgressRecord, StudentProfile } from '../types/elkpd';
import { CURRICULUM_DARS, TIER_META } from '../data/curriculum';

interface StudentDashboardProps {
  student: StudentProfile;
  darsProgress: Record<number, DarsProgressRecord>;
  onOpenDars: (darsNumber: number) => void;
  onOpenEvaluasiHub: () => void;
  onChangeGroup: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  darsProgress,
  onOpenDars,
  onOpenEvaluasiHub,
  onChangeGroup,
}) => {
  const tier = student.tier || 'LOW';
  const tierInfo = TIER_META[tier];

  const completedDarsCount = CURRICULUM_DARS.filter(
    (d) => darsProgress[d.darsNumber]?.status === 'SELESAI'
  ).length;

  const progressPercent = Math.round((completedDarsCount / CURRICULUM_DARS.length) * 100);

  const completedScores = CURRICULUM_DARS.map((d) => darsProgress[d.darsNumber])
    .filter((r): r is DarsProgressRecord => Boolean(r && r.status === 'SELESAI'))
    .map((r) => r.finalScore);

  const averageScore =
    completedScores.length > 0
      ? Math.round((completedScores.reduce((a, b) => a + b, 0) / completedScores.length) * 10) / 10
      : 0;

  const isDarsUnlocked = (darsNum: number) => {
    if (darsNum === 1) return true;
    const prev = darsProgress[darsNum - 1];
    return Boolean(prev && prev.status === 'SELESAI');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Student Profile & Overview Strip */}
      <section className="bg-white rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-sky-700">
                Kelas {student.className} · Nomor Absen {student.absenNumber}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                <span className="font-arabic text-sky-900 ml-1" dir="rtl" lang="ar">أَهْلًا وَسَهْلًا!</span>{' '}
                Selamat belajar, {student.fullName}!
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Kelompok Belajar: <span className="font-semibold text-slate-800">{tierInfo.titleId}</span>{' '}
                <span className="font-arabic text-base text-sky-800" dir="rtl" lang="ar">
                  ({tierInfo.titleAr})
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onChangeGroup}
              className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Ganti Kelompok
            </button>
            <button
              type="button"
              onClick={onOpenEvaluasiHub}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              <FileBarChart2 className="w-4 h-4" />
              <span>Menu Evaluasi &amp; Rapor</span>
            </button>
          </div>
        </div>

        {/* Metrics & Progress Bar */}
        <div className="mt-7 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-slate-700">Progress Pembelajaran Semester 1</span>
              <span className="font-bold text-sky-700 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-sky-50 rounded-full overflow-hidden border border-sky-100">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="md:col-span-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Dars Diselesaikan</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {completedDarsCount} / {CURRICULUM_DARS.length} Dars
            </p>
          </div>

          <div className="md:col-span-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Nilai Rata-rata</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {completedScores.length > 0 ? averageScore : '—'}
              </p>
            </div>
            <Award className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </section>

      {/* Dars List */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Pembelajaran (الدُّرُوسُ)</h2>
            <p className="text-sm text-slate-600">
              Setiap Dars memuat Tujuan, Materi, Mufradat, 4 Maharah, Mahfudzat, dan Evaluasi. Selesaikan hingga SIMPAN &amp; SELESAI untuk membuka Dars berikutnya.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CURRICULUM_DARS.map((dars) => {
            const unlocked = isDarsUnlocked(dars.darsNumber);
            const record = darsProgress[dars.darsNumber];
            const isCompleted = record?.status === 'SELESAI';
            const inProgress = !isCompleted && Boolean(record && record.visitedSteps?.length > 0);

            return (
              <div
                key={dars.darsNumber}
                className={`bg-white rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
                  unlocked
                    ? 'border-sky-100 hover:border-sky-300 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 opacity-85'
                }`}
              >
                <div>
                  <div className="relative h-44 bg-sky-50 overflow-hidden">
                    <img
                      src={dars.imageUrl}
                      alt={dars.titleId}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${!unlocked ? 'grayscale opacity-70' : ''}`}
                    />
                    {!unlocked && (
                      <div className="absolute inset-0 bg-slate-900/35 flex flex-col items-center justify-center text-white p-4 text-center">
                        <Lock className="w-7 h-7 mb-1.5" />
                        <span className="text-xs font-semibold">
                          Selesaikan Dars {dars.darsNumber - 1} Terlebih Dahulu
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-sky-700">Dars {dars.darsNumber}</span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isCompleted
                            ? 'text-emerald-700'
                            : inProgress
                              ? 'text-amber-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>SELESAI</span>
                          </>
                        ) : inProgress ? (
                          <span>SEDANG BELAJAR</span>
                        ) : (
                          <span>BELUM DIMULAI</span>
                        )}
                      </span>
                    </div>

                    <h3 className="font-arabic text-2xl font-bold text-slate-900 text-right" dir="rtl" lang="ar">
                      {dars.titleAr}
                    </h3>
                    <p className="text-base font-bold text-slate-800 mt-1">{dars.titleId}</p>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{dars.subtitle}</p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 tabular-nums">
                    {isCompleted ? (
                      <span>
                        Nilai Akhir: <strong className="text-slate-900">{record.finalScore}</strong> ({record.predicate})
                      </span>
                    ) : (
                      <span>4 Maharah · Mahfudzat · Evaluasi</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onOpenDars(dars.darsNumber)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                      unlocked
                        ? isCompleted
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer'
                          : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {unlocked ? (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        <span>{isCompleted ? 'Lihat / Ulangi' : inProgress ? 'Lanjutkan' : 'Buka Dars'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Terkunci</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
