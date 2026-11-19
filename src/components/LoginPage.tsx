import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Layers,
  Pencil,
  Star,
  RotateCcw,
} from 'lucide-react';
import { AbilityTier, DarsProgressRecord, StudentProfile } from '../types/elkpd';
import { CLASS_OPTIONS, TIER_META } from '../data/curriculum';
import {
  loginStudentLocal,
  sendIdentityToAppsScript,
  setStudentTierLocal,
} from '../utils/clientStorage';

interface LoginPageProps {
  existingStudent: StudentProfile | null;
  onLoginSuccess: (
    student: StudentProfile,
    darsProgress: Record<number, DarsProgressRecord>
  ) => void;
  onTierConfirmed: (tier: AbilityTier) => void;
  onGoToLearning: () => void;
  onResetSession: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  existingStudent,
  onLoginSuccess,
  onTierConfirmed,
  onGoToLearning,
  onResetSession,
}) => {
  const [fullName, setFullName] = useState(existingStudent?.fullName || '');
  const [className, setClassName] = useState(existingStudent?.className || '');
  const [absenNumber, setAbsenNumber] = useState(existingStudent?.absenNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Per-field validation messages
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    className?: string;
    absenNumber?: string;
  }>({});

  const [loggedInStudent, setLoggedInStudent] = useState<StudentProfile | null>(existingStudent);
  const [selectedTier, setSelectedTier] = useState<AbilityTier | null>(existingStudent?.tier || null);
  const [tierLoading, setTierLoading] = useState(false);
  const [showFormOverride, setShowFormOverride] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nextErrors: { fullName?: string; className?: string; absenNumber?: string } = {};
    if (!fullName.trim()) {
      nextErrors.fullName = 'Silakan isi nama lengkapmu terlebih dahulu.';
    }
    if (!className.trim()) {
      nextErrors.className = 'Silakan pilih kelas terlebih dahulu.';
    }
    if (!absenNumber.trim() || Number(absenNumber) <= 0 || !Number.isFinite(Number(absenNumber))) {
      nextErrors.absenNumber = 'Silakan masukkan nomor absen dengan angka.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    const cleanName = fullName.trim();
    const cleanClass = className.trim();
    const cleanAbsen = String(Math.floor(Number(absenNumber.trim())));

    // 1. Simpan ke localStorage browser siswa terlebih dahulu
    const { student: localStudent, darsProgress: restoredProgress } = loginStudentLocal(
      cleanName,
      cleanClass,
      cleanAbsen
    );

    // 2. Kirim { nama, kelas, absen } ke Google Apps Script dengan mode: 'no-cors' (tanpa response.json)
    await sendIdentityToAppsScript(cleanName, cleanClass, cleanAbsen);

    setLoggedInStudent(localStudent);
    setSelectedTier(localStudent.tier || null);
    setShowFormOverride(false);
    setLoading(false);
    onLoginSuccess(localStudent, restoredProgress);
  };

  const handleSelectAndEnterGroup = async (tierCode: AbilityTier) => {
    if (!loggedInStudent) return;
    setError('');
    setSelectedTier(tierCode);
    setTierLoading(true);

    const updatedStudent =
      setStudentTierLocal(loggedInStudent.studentId, tierCode) || {
        ...loggedInStudent,
        tier: tierCode,
      };

    // Kirim data identitas siswa ke Google Apps Script saat lanjut pilih kelompok (tanpa response.json)
    await sendIdentityToAppsScript(
      updatedStudent.fullName,
      updatedStudent.className,
      updatedStudent.absenNumber
    );

    setLoggedInStudent(updatedStudent);
    setTierLoading(false);
    onTierConfirmed(tierCode);
  };

  const handleReenterIdentity = () => {
    onResetSession();
    setLoggedInStudent(null);
    setSelectedTier(null);
    setFullName('');
    setClassName('');
    setAbsenNumber('');
    setFieldErrors({});
    setError('');
    setShowFormOverride(true);
  };

  // Screen 2: Post-Login Greeting + Small Identity Card + Immediate Group Choice (LOW / MIDDLE / HIGH)
  if (loggedInStudent && !showFormOverride) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
        {/* Greeting + Small Identity Header */}
        <div
          className="relative rounded-3xl border-2 border-white shadow-sm p-6 sm:p-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E0F4FF 0%, #FFF8DE 52%, #EFE8FF 100%)',
          }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <p
                className="font-arabic-display text-3xl sm:text-4xl font-bold text-sky-900"
                dir="rtl"
                lang="ar"
              >
                أَهْلًا وَسَهْلًا!
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Selamat belajar, {loggedInStudent.fullName}!
              </h1>

              {/* Compact Identity Box */}
              <div className="pt-2 flex flex-wrap gap-3 text-xs sm:text-sm">
                <div className="bg-white/90 border border-sky-200 rounded-xl px-3.5 py-2">
                  <span className="text-slate-500">Nama:</span>{' '}
                  <strong className="text-slate-900">{loggedInStudent.fullName}</strong>
                </div>
                <div className="bg-white/90 border border-sky-200 rounded-xl px-3.5 py-2">
                  <span className="text-slate-500">Kelas:</span>{' '}
                  <strong className="text-slate-900">{loggedInStudent.className}</strong>
                </div>
                <div className="bg-white/90 border border-sky-200 rounded-xl px-3.5 py-2">
                  <span className="text-slate-500">Nomor Absen:</span>{' '}
                  <strong className="text-slate-900 tabular-nums">{loggedInStudent.absenNumber}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {loggedInStudent.tier && (
                <button
                  type="button"
                  onClick={onGoToLearning}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Lanjutkan Sesi ({loggedInStudent.tier})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleReenterIdentity}
                className="inline-flex items-center gap-1.5 px-4 py-3.5 bg-white/95 hover:bg-white text-slate-700 border border-sky-200 rounded-2xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Isi Identitas Kembali</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Group Choice (LOW / MIDDLE / HIGH) */}
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Pilih Kelompok Pembelajaran
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Klik salah satu kelompok sesuai arahan gurumu untuk langsung masuk ke Dars 1–3.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['LOW', 'MIDDLE', 'HIGH'] as AbilityTier[]).map((code) => {
              const meta = TIER_META[code];
              const isCurrent = loggedInStudent.tier === code;
              return (
                <button
                  key={code}
                  type="button"
                  disabled={tierLoading}
                  onClick={() => handleSelectAndEnterGroup(code)}
                  className={`text-left rounded-3xl p-6 bg-white border-2 transition-all flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                    isCurrent
                      ? 'border-sky-600 ring-4 ring-sky-100 shadow-sm'
                      : 'border-sky-100 hover:border-sky-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${meta.softBgClass} ${meta.textClass}`}
                      >
                        {meta.groupLabel}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aktif</span>
                        </span>
                      )}
                    </div>

                    <p className="font-arabic text-2xl font-bold text-slate-900 text-right mb-1" dir="rtl" lang="ar">
                      {meta.titleAr}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">{meta.titleId}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{meta.description}</p>

                    <ul className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      {meta.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2">
                          <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-sky-700">
                    <span>
                      {tierLoading && selectedTier === code
                        ? 'Membuka Kelompok...'
                        : `Masuk Kelompok ${code}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Screen 1: Cheerful, Compact, Kid-Friendly Login Card (Only 3 Fields)
  return (
    <div className="relative overflow-hidden py-8 sm:py-12 px-4 sm:px-6">
      {/* Gentle drifting sky clouds & twinkling stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          className="hidden sm:block absolute top-8 left-8 w-28 h-14 text-white/90 animate-drift-slow"
          viewBox="0 0 120 60"
          fill="currentColor"
        >
          <path d="M25 48h68c10 0 17-7 17-16s-8-15-17-15c-2 0-4 0-6 1C83 8 73 2 61 2 47 2 35 11 33 24c-2-1-5-1-8-1-10 0-18 6-18 13s8 12 18 12z" />
        </svg>
        <svg
          className="hidden sm:block absolute top-12 right-10 w-32 h-16 text-white/85 animate-drift-slow"
          style={{ animationDelay: '2s' }}
          viewBox="0 0 120 60"
          fill="currentColor"
        >
          <path d="M25 48h68c10 0 17-7 17-16s-8-15-17-15c-2 0-4 0-6 1C83 8 73 2 61 2 47 2 35 11 33 24c-2-1-5-1-8-1-10 0-18 6-18 13s8 12 18 12z" />
        </svg>
        <Star className="hidden md:block absolute top-24 left-1/4 w-4 h-4 text-amber-400 fill-amber-300 animate-twinkle" />
        <Star
          className="hidden md:block absolute bottom-20 right-1/4 w-4 h-4 text-sky-400 fill-sky-300 animate-twinkle"
          style={{ animationDelay: '1.2s' }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        <div className="bg-white rounded-[2rem] border-2 border-sky-100 shadow-md overflow-hidden">
          {/* Cheerful Pastel Header with Student Illustration & Ornaments */}
          <div
            className="relative px-6 pt-7 pb-6 text-center"
            style={{
              background: 'linear-gradient(135deg, #DCF2FF 0%, #FFF6D6 55%, #FFE8DC 100%)',
            }}
          >
            {/* Book & Pencil Ornaments */}
            <div
              className="hidden sm:flex items-center justify-center absolute top-4 left-5 w-10 h-10 rounded-xl bg-white/90 border border-sky-200 text-sky-600 shadow-2xs animate-float-slow"
              aria-hidden="true"
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div
              className="hidden sm:flex items-center justify-center absolute top-4 right-5 w-10 h-10 rounded-xl bg-white/90 border border-amber-200 text-amber-500 shadow-2xs animate-float-gentle"
              aria-hidden="true"
            >
              <Pencil className="w-5 h-5" />
            </div>

            {/* Small Cute Student Illustration Avatar */}
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white">
              <img
                src="/src/assets/images/cover_mts_cheerful_1795090007885.jpg"
                alt="Ilustrasi siswa MTs"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <p
              className="font-arabic-display text-3xl sm:text-4xl font-bold text-sky-950"
              dir="rtl"
              lang="ar"
            >
              مَرْحَبًا بِكَ!
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Selamat Datang di E-LKPD Bahasa Arab
            </h1>
            <p className="text-sm text-slate-700 mt-1.5">
              Silakan isi identitasmu terlebih dahulu untuk memulai pembelajaran.
            </p>
          </div>

          {/* Simple 3-Field Form */}
          <div className="p-6 sm:p-7">
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
              {/* Field A: Nama Lengkap */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  placeholder="Ketik nama lengkapmu"
                  className={`w-full px-4 py-3.5 rounded-2xl border bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 text-slate-900 text-base ${
                    fieldErrors.fullName
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-sky-200 focus:ring-sky-400'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Field B: Kelas Dropdown (VII A - VII I) */}
              <div>
                <label htmlFor="className" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Kelas
                </label>
                <select
                  id="className"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    if (fieldErrors.className) {
                      setFieldErrors((prev) => ({ ...prev, className: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3.5 rounded-2xl border bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 text-slate-900 text-base ${
                    fieldErrors.className
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-sky-200 focus:ring-sky-400'
                  }`}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                {fieldErrors.className && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">{fieldErrors.className}</p>
                )}
              </div>

              {/* Field C: Nomor Absen (angka) */}
              <div>
                <label htmlFor="absenNumber" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Nomor Absen
                </label>
                <input
                  id="absenNumber"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  inputMode="numeric"
                  value={absenNumber}
                  onChange={(e) => {
                    setAbsenNumber(e.target.value);
                    if (fieldErrors.absenNumber) {
                      setFieldErrors((prev) => ({ ...prev, absenNumber: undefined }));
                    }
                  }}
                  placeholder="Contoh: 7"
                  className={`w-full px-4 py-3.5 rounded-2xl border bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 text-slate-900 text-base tabular-nums ${
                    fieldErrors.absenNumber
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-sky-200 focus:ring-sky-400'
                  }`}
                />
                {fieldErrors.absenNumber && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">{fieldErrors.absenNumber}</p>
                )}
              </div>

              {/* Big Main Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2.5 py-4 px-6 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-extrabold tracking-wide text-base rounded-2xl shadow-sm transition-colors cursor-pointer"
              >
                <span>{loading ? 'MEMPROSES...' : 'MASUK DAN MULAI BELAJAR'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
