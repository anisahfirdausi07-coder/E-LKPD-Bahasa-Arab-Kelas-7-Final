import React from 'react';
import {
  UserCheck,
  Layers,
  Headphones,
  MessageCircle,
  BookOpen,
  PenTool,
  Award,
  FileSpreadsheet,
  ArrowRight,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { StudentProfile } from '../types/elkpd';

interface PetunjukPageProps {
  student: StudentProfile | null;
  onGoToLoginOrLearning: () => void;
  onGoToEvaluasi: () => void;
}

export const PetunjukPage: React.FC<PetunjukPageProps> = ({
  student,
  onGoToLoginOrLearning,
  onGoToEvaluasi,
}) => {
  const steps = [
    {
      num: '01',
      title: 'Login & Pilih Kelompok Kemampuan',
      desc: 'Buka menu Login, masukkan Nama Lengkap, Kelas, dan Nomor Absen/ID Siswa. Pilih Kelompok 1 (LOW), Kelompok 2 (MIDDLE), atau Kelompok 3 (HIGH) sesuai arahan guru. Kelompok akan terkunci otomatis untuk seluruh Dars.',
      icon: UserCheck,
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      num: '02',
      title: 'Pelajari Materi & Mufradat Audio',
      desc: 'Masuk ke Dars 1, lalu pelajari Tujuan Pembelajaran, Materi & Qawaid (Tarkib), serta dengarkan kosakata (Mufradat) dengan tombol audio Bahasa Arab Fusha agar pelafalan tepat.',
      icon: Layers,
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      num: '03',
      title: 'Kerjakan Empat Maharah & Mahfudzat',
      desc: "Selesaikan latihan Maharah Istima', Kalam (rekaman suara langsung), Qira'ah, dan Kitabah sesuai kelompok belajarmu, lalu pelajari Mahfudzat dan lengkapi kata rumpang sebelum Evaluasi.",
      icon: Award,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      num: '04',
      title: 'Evaluasi 10 Soal & Simpan Rapor',
      desc: 'Buka tab Evaluasi atau menu Evaluasi untuk mengerjakan 10 soal akhir Dars. Setelah selesai, buka tab Rapor Dars lalu tekan tombol SIMPAN & SELESAI agar nilai terekam dan Dars berikutnya terbuka.',
      icon: FileSpreadsheet,
      tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  ];

  const maharahGuides = [
    {
      ar: 'الِاسْتِمَاعُ',
      title: "Maharah Istima' (Menyimak)",
      desc: 'Soal berbentuk audio murni tanpa teks pertanyaan tertulis. Klik Putar Audio berulang jika diperlukan, lalu pilih jawaban yang sesuai.',
      icon: Headphones,
      tone: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      ar: 'الْكَلَامُ',
      title: 'Maharah Kalam (Berbicara)',
      desc: 'Izinkan akses mikrofon, tekan tombol Rekam, dan ucapkan kalimat bahasa Arab Fusha dengan jelas. Dialog berlangsung hingga 4 giliran dengan koreksi dan rubrik otomatis.',
      icon: MessageCircle,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      ar: 'الْقِرَاءَةُ',
      title: "Maharah Qira'ah (Membaca)",
      desc: 'Dengarkan contoh bacaan Fusha pada teks berharakat lengkap, lalu kerjakan latihan (menjodohkan untuk LOW, Benar/Salah untuk MIDDLE, atau pilihan ganda analisis untuk HIGH).',
      icon: BookOpen,
      tone: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      ar: 'الْكِتَابَةُ',
      title: 'Maharah Kitabah (Menulis)',
      desc: 'Ketik jawaban menggunakan keyboard virtual Arab yang tersedia atau keyboard perangkatmu. Penulisan huruf Arab dengan maupun tanpa harakat tetap diterima.',
      icon: PenTool,
      tone: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl">
              <Compass className="w-4 h-4" />
              <span>Panduan Siswa &amp; Guru</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Petunjuk Penggunaan E-LKPD Bahasa Arab
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
              Ikuti langkah-langkah berikut agar proses belajarmu dari Dars 1 hingga Dars 3 berjalan lancar dan seluruh
              nilai tersimpan rapi ke rapor digital.
            </p>
          </div>
          <p className="font-arabic text-2xl sm:text-3xl font-bold text-sky-900 shrink-0" dir="rtl" lang="ar">
            إِرْشَادَاتُ التَّعَلُّمِ
          </p>
        </div>
      </div>

      {/* 4 Alur Utama */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Alur Penggunaan Website</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white border border-sky-100 rounded-3xl p-6 shadow-2xs flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${step.tone}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-sky-700 tabular-nums">LANGKAH {step.num}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Panduan 4 Maharah */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Petunjuk Empat Maharah</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {maharahGuides.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title} className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${g.tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-arabic text-xl font-bold text-sky-900" dir="rtl" lang="ar">
                    {g.ar}
                  </p>
                </div>
                <h3 className="text-base font-bold text-slate-900">{g.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{g.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ketentuan Penting & Navigasi Lanjut */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-sky-950">Aturan Penting Pengerjaan</h3>
          <ul className="space-y-1.5 text-sm text-sky-900">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Gunakan Kelas dan Nomor Absen yang sama saat login ulang untuk memulihkan progresmu.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Dars 2 dan Dars 3 terbuka otomatis setelah Dars sebelumnya diselesaikan dengan SIMPAN &amp; SELESAI.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Guru dapat memantau nilai seluruh kelompok dan mengekspor rapor melalui menu Dashboard Guru.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={onGoToLoginOrLearning}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
          >
            <span>{student?.tier ? 'Buka Ruang Belajar' : 'Masuk ke Menu Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {student?.tier && (
            <button
              type="button"
              onClick={onGoToEvaluasi}
              className="px-5 py-3.5 bg-white hover:bg-sky-100 text-sky-900 font-semibold text-sm rounded-2xl border border-sky-200 transition-colors cursor-pointer"
            >
              Lihat Evaluasi &amp; Rapor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
