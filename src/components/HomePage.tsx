import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  MessageCircle,
  PenTool,
  Sparkles,
  FileSpreadsheet,
  Award,
  GraduationCap,
  Pencil,
  Star,
  Eraser,
  Backpack,
} from 'lucide-react';
import { StudentProfile } from '../types/elkpd';

interface HomePageProps {
  student: StudentProfile | null;
  onStartLearning: () => void;
  onOpenTeacherPortal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  student,
  onStartLearning,
  onOpenTeacherPortal,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden">
      {/* Moving outer sky clouds (never overlapping centered Arabic typography) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          className="hidden sm:block absolute top-6 left-4 w-32 h-16 text-white/85 animate-drift-slow drop-shadow-xs"
          viewBox="0 0 120 60"
          fill="currentColor"
        >
          <path d="M25 48h68c10 0 17-7 17-16s-8-15-17-15c-2 0-4 0-6 1C83 8 73 2 61 2 47 2 35 11 33 24c-2-1-5-1-8-1-10 0-18 6-18 13s8 12 18 12z" />
        </svg>
        <svg
          className="hidden sm:block absolute top-14 right-6 w-36 h-20 text-white/90 animate-drift-slow drop-shadow-xs"
          style={{ animationDelay: '2.5s' }}
          viewBox="0 0 120 60"
          fill="currentColor"
        >
          <path d="M25 48h68c10 0 17-7 17-16s-8-15-17-15c-2 0-4 0-6 1C83 8 73 2 61 2 47 2 35 11 33 24c-2-1-5-1-8-1-10 0-18 6-18 13s8 12 18 12z" />
        </svg>
      </div>

      {/* Vibrant Pastel Digital Book Cover */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12 lg:pt-10 lg:pb-14">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.25rem] border-2 border-white/90 shadow-md px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16 overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #DCF2FF 0%, #FFF7D6 34%, #FFE8D9 68%, #EFE5FF 100%)',
          }}
        >
          {/* Inner pastel book border frame */}
          <div
            className="pointer-events-none absolute inset-3 sm:inset-5 rounded-[1.6rem] border border-white/80"
            aria-hidden="true"
          />

          {/* Twinkling small stars positioned safely in outer perimeter */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <Star className="hidden md:block absolute top-7 left-1/4 w-4 h-4 text-amber-400 fill-amber-300 animate-twinkle" />
            <Star
              className="hidden md:block absolute top-10 right-1/4 w-3.5 h-3.5 text-sky-400 fill-sky-300 animate-twinkle"
              style={{ animationDelay: '1.1s' }}
            />
            <Star
              className="hidden md:block absolute bottom-12 left-1/5 w-4 h-4 text-purple-400 fill-purple-300 animate-twinkle"
              style={{ animationDelay: '1.8s' }}
            />
            <Star
              className="hidden md:block absolute bottom-14 right-1/5 w-3.5 h-3.5 text-orange-400 fill-orange-300 animate-twinkle"
              style={{ animationDelay: '0.6s' }}
            />
          </div>

          {/* Neat 2D Educational Stationery Ornaments (Strictly clear of center RTL typography) */}
          <div
            className="pointer-events-none hidden md:flex items-center justify-center absolute top-8 left-8 w-12 h-12 rounded-2xl bg-white/90 border border-sky-200 text-sky-600 shadow-xs animate-float-slow"
            aria-hidden="true"
          >
            <BookOpen className="w-6 h-6" />
          </div>

          <div
            className="pointer-events-none hidden md:flex items-center justify-center absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/90 border border-amber-200 text-amber-500 shadow-xs animate-float-gentle"
            aria-hidden="true"
          >
            <Pencil className="w-5 h-5" />
          </div>

          <div
            className="pointer-events-none hidden md:flex items-center justify-center absolute bottom-9 left-9 w-11 h-11 rounded-2xl bg-white/90 border border-rose-200 text-rose-500 shadow-xs animate-float-gentle"
            aria-hidden="true"
          >
            <Eraser className="w-5 h-5" />
          </div>

          <div
            className="pointer-events-none hidden md:flex items-center justify-center absolute bottom-9 right-9 w-11 h-11 rounded-2xl bg-white/90 border border-indigo-200 text-indigo-600 shadow-xs animate-float-slow"
            aria-hidden="true"
          >
            <Backpack className="w-5 h-5" />
          </div>

          {/* Centerpiece: Exact Verbatim 4-Line Arabic Cover Typography */}
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="text-xs sm:text-sm font-bold text-sky-900 mb-6 tracking-wide">
              E-LKPD Bahasa Arab Berdiferensiasi · Kelas VII MTs Semester 1
            </p>

            {/* Exact 4 Arabic Lines — Verbatim with full Harakat, RTL, Center Aligned */}
            <div dir="rtl" lang="ar" className="text-center flex flex-col items-center">
              <h1 className="font-arabic-display text-4xl sm:text-6xl lg:text-[4.5rem] font-bold text-sky-950 drop-shadow-[0_3px_12px_rgba(255,255,255,0.9)] px-2 py-2">
                هَيَّا نَتَعَلَّمُ!
              </h1>

              <p className="font-arabic-classic text-2xl sm:text-4xl lg:text-[2.6rem] font-bold text-indigo-950 mt-3 sm:mt-4 px-2">
                الْكِتَابُ الإِضَافِيُّ الْإِلِكْتُرُونِيُّ
              </p>

              <p className="font-arabic-classic text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mt-2.5 sm:mt-3 px-2">
                لِتَعْلِيمِ اللُّغَةِ الْعَرَبِيَّةِ
              </p>

              <p className="font-arabic-classic text-lg sm:text-xl lg:text-2xl font-semibold text-sky-900 mt-2 sm:mt-2.5 px-2">
                لِلصَّفِّ السَّابِعِ بِالْمَدْرَسَةِ الْمُتَوَسِّطَةِ
              </p>
            </div>

            {/* Subtle Geometric Divider */}
            <div className="my-7 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-sky-400" />
              <span className="w-2.5 h-2.5 rotate-45 border border-amber-500 bg-amber-200" />
              <span className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-indigo-400" />
            </div>

            <p className="text-slate-700 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8 font-medium">
              Bahan ajar elektronik interaktif berbasis pembelajaran berdiferensiasi (Kelompok 1 LOW, Kelompok 2
              MIDDLE, Kelompok 3 HIGH) dengan audio Bahasa Arab Fusha, dialog suara AI, latihan empat maharah,
              Mahfudzat, evaluasi akhir, serta rapor digital Google Spreadsheet.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={onStartLearning}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>{student?.tier ? 'LANJUTKAN BELAJAR' : 'LOGIN & MULAI BELAJAR'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onOpenTeacherPortal}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/95 hover:bg-white text-sky-900 font-semibold text-sm rounded-2xl border border-sky-200 shadow-2xs transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Dashboard Guru</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/80 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-slate-700">
              <span>3 Dars Semester 1</span>
              <span aria-hidden="true">·</span>
              <span>3 Kelompok Kemampuan</span>
              <span aria-hidden="true">·</span>
              <span>Suara Arab Fusha &amp; AI Kalam</span>
              <span aria-hidden="true">·</span>
              <span>Rapor Digital Otomatis</span>
            </div>
          </div>
        </motion.div>

        {/* Supporting Grade 7 MTs Character Illustration Showcase */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 bg-white rounded-3xl border border-sky-100 p-5 sm:p-7 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-sky-50 border border-sky-100 h-60 sm:h-72">
            <img
              src="/src/assets/images/cover_mts_cheerful_1795090007885.jpg"
              alt="Ilustrasi siswa dan siswi kelas VII MTs membawa buku bahasa Arab dan perlengkapan belajar"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-bold text-sky-700">
              Pembelajaran Berdiferensiasi Bahasa Arab · MTsN 4 Sidoarjo
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Satu Platform, Tiga Jalur Kemampuan Belajar Siswa
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Setiap peserta didik mendapatkan pengalaman belajar yang tepat sasaran — mulai dari penguasaan kosakata
              dasar hingga dialog suara aktif dan menulis paragraf Arab secara mandiri.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3.5">
                <p className="font-arabic text-base font-bold text-sky-900" dir="rtl" lang="ar">
                  المُسْتَوَى الْمُنْخَفِضُ
                </p>
                <p className="text-xs font-bold text-sky-800 mt-0.5">Kelompok 1 · LOW</p>
                <p className="text-[11px] text-slate-600 mt-1">Audio 2 opsi, menjodohkan, tulis terbimbing gambar</p>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5">
                <p className="font-arabic text-base font-bold text-emerald-900" dir="rtl" lang="ar">
                  المُسْتَوَى الْمُتَوَسِّطُ
                </p>
                <p className="text-xs font-bold text-emerald-800 mt-0.5">Kelompok 2 · MIDDLE</p>
                <p className="text-[11px] text-slate-600 mt-1">Audio 3 opsi, Benar/Salah Arab, susun kalimat</p>
              </div>
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5">
                <p className="font-arabic text-base font-bold text-indigo-900" dir="rtl" lang="ar">
                  المُسْتَوَى الْمُرْتَفِعُ
                </p>
                <p className="text-xs font-bold text-indigo-800 mt-0.5">Kelompok 3 · HIGH</p>
                <p className="text-[11px] text-slate-600 mt-1">Hiwar 6 giliran, analisis 4 opsi, paragraf mandiri</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Empat Maharah & Sistem Pembelajaran */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
        <div>
          <div className="max-w-2xl mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Empat Maharah dalam Setiap Dars</h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Setiap bab mencakup Tujuan Pembelajaran, Materi, Mufradat interaktif, 4 Maharah, Mahfudzat, dan Evaluasi
              terpadu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                ar: 'الِاسْتِمَاعُ',
                id: "Maharah Istima'",
                desc: 'Menyimak audio Fusha tanpa teks pertanyaan tertulis, melatih pemahaman pendengaran murni.',
                icon: Headphones,
                tone: 'bg-sky-50 text-sky-700 border-sky-100',
              },
              {
                ar: 'الْكَلَامُ',
                id: 'Maharah Kalam',
                desc: 'Latihan berbicara langsung via mikrofon bersama mitra dialog suara AI hingga 4 giliran.',
                icon: MessageCircle,
                tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              },
              {
                ar: 'الْقِرَاءَةُ',
                id: "Maharah Qira'ah",
                desc: 'Teks berharakat lengkap disertai suara, dengan aktivitas bertingkat sesuai kelompok belajar.',
                icon: BookOpen,
                tone: 'bg-amber-50 text-amber-700 border-amber-100',
              },
              {
                ar: 'الْكِتَابَةُ',
                id: 'Maharah Kitabah',
                desc: 'Latihan menulis RTL dengan keyboard Arab (toleran harakat) dan evaluasi rubrik terstruktur.',
                icon: PenTool,
                tone: 'bg-indigo-50 text-indigo-700 border-indigo-100',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-sky-100 p-6 hover:-translate-y-0.5 transition-transform"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${item.tone}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-arabic text-xl font-bold text-slate-900" dir="rtl" lang="ar">
                    {item.ar}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.id}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-sky-100 p-6">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tiga Kelompok Kemampuan</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Kelompok 1 (LOW), Kelompok 2 (MIDDLE), dan Kelompok 3 (HIGH) tersedia lengkap pada seluruh Dars 1–3.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-sky-100 p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mahfudzat &amp; Evaluasi</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Di penghujung setiap Dars terdapat aktivitas Mahfudzat dan Evaluasi akhir lengkap dengan pembahasan.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-sky-100 p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Rapor Digital &amp; Google Sheets</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Rekap nilai seluruh maharah dan evaluasi tersimpan per Dars dan dapat dipantau di Dashboard Guru.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
