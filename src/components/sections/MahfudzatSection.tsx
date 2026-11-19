import React, { useEffect, useState } from 'react';
import {
  Volume2,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  BookMarked,
} from 'lucide-react';
import { MahfudzatContent } from '../../types/elkpd';
import { playArabicFusha, playFeedbackTone, stopArabicAudio } from '../../utils/arabicSpeech';

interface MahfudzatSectionProps {
  darsTitleId: string;
  content: MahfudzatContent;
  completed: boolean;
  onComplete: () => void;
}

export const MahfudzatSection: React.FC<MahfudzatSectionProps> = ({
  darsTitleId,
  content,
  completed,
  onComplete,
}) => {
  const [hideTranslation, setHideTranslation] = useState(false);
  const [hasListened, setHasListened] = useState(completed);
  const [missingChoice, setMissingChoice] = useState<string>(
    completed ? content.missingWordExercise.missingWord : ''
  );
  const [checked, setChecked] = useState(completed);

  useEffect(() => {
    setMissingChoice(completed ? content.missingWordExercise.missingWord : '');
    setChecked(completed);
    setHasListened(completed);
    return () => stopArabicAudio();
  }, [content, completed]);

  const handleListen = () => {
    setHasListened(true);
    playArabicFusha(content.ar, { rate: 0.9 });
  };

  const missingCorrect = missingChoice === content.missingWordExercise.missingWord;

  const handleVerifyMemorization = () => {
    if (!missingChoice) return;
    setChecked(true);
    playFeedbackTone(missingCorrect);
    if (missingCorrect) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Mahfudzat (<span className="font-arabic">الْمَحْفُوظَاتُ</span>) — {darsTitleId}
          </h3>
          <p className="text-sm text-slate-700 mt-0.5">
            Kata mutiara penguatan karakter siswa sebelum memasuki Evaluasi Akhir Dars.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
          <BookMarked className="w-4 h-4" />
          <span>Pengayaan &amp; Hafalan</span>
        </span>
      </div>

      {/* Motivational Mahfudzat Card */}
      <div className="bg-white border border-amber-200 rounded-3xl overflow-hidden shadow-2xs grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-amber-50 min-h-[220px]">
          <img
            src="/src/assets/images/mahfudzat_scroll_1795087183288.jpg"
            alt="Ilustrasi buku terbuka dan lentera untuk Mahfudzat"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold text-amber-700">Mutiara Hikmah</span>
              <button
                type="button"
                onClick={() => setHideTranslation((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
              >
                {hideTranslation ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{hideTranslation ? 'Tampilkan Terjemahan' : 'Uji Baca Tanpa Terjemahan'}</span>
              </button>
            </div>

            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 text-center">
              <p className="font-arabic text-3xl sm:text-4xl font-bold text-sky-950 leading-loose" dir="rtl" lang="ar">
                {content.ar}
              </p>
              {!hideTranslation && (
                <p className="text-base font-semibold text-slate-700 mt-3">&ldquo;{content.id}&rdquo;</p>
              )}
            </div>

            <div className="mt-4 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-1">Makna &amp; Pesan Moral</p>
              <p className="text-sm text-slate-700 leading-relaxed">{content.moral}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleListen}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Dengarkan Pelafalan Fusha</span>
            </button>
            <button
              type="button"
              onClick={handleListen}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-sm font-semibold rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi</span>
            </button>
            {hasListened && (
              <span className="text-xs font-semibold text-emerald-700">Sudah disimak</span>
            )}
          </div>
        </div>
      </div>

      {/* Memorization Drill: Missing Word */}
      <div className="bg-white border border-sky-100 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900">Uji Hafalan: Lengkapi Kata yang Hilang</h4>
        <p className="font-arabic text-2xl sm:text-3xl font-bold text-center text-sky-900 py-4 bg-slate-50 rounded-xl" dir="rtl" lang="ar">
          {content.missingWordExercise.sentenceWithBlank}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" dir="rtl">
          {content.missingWordExercise.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setMissingChoice(opt);
                setChecked(false);
              }}
              className={`py-3 px-4 rounded-xl border font-arabic text-xl font-semibold cursor-pointer transition-colors ${
                missingChoice === opt
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {checked && (
          <p className={`text-xs sm:text-sm font-semibold ${missingCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
            {missingCorrect
              ? 'Benar! Kata yang melengkapi mahfudzat sudah tepat.'
              : `Belum tepat. Pilih kata yang sesuai dengan bunyi mahfudzat di atas.`}
          </p>
        )}
      </div>

      {/* Completion Bar */}
      {completed ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">
            Aktivitas Mahfudzat selesai! Kamu siap melanjutkan ke Evaluasi Akhir Dars.
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={!missingChoice}
          onClick={handleVerifyMemorization}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Periksa Hafalan &amp; Selesaikan Mahfudzat</span>
        </button>
      )}
    </div>
  );
};
