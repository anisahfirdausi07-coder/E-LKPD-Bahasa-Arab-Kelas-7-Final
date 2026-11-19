import React, { useEffect, useState } from 'react';
import {
  Headphones,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Users,
  Sparkles,
} from 'lucide-react';
import { AbilityTier, IstimaContent, MaharahActivityResult } from '../../types/elkpd';
import {
  pauseArabicAudio,
  playArabicFusha,
  playFeedbackTone,
  playMultiSpeakerArabicHiwar,
  resumeArabicAudio,
  stopArabicAudio,
} from '../../utils/arabicSpeech';

interface IstimaSectionProps {
  tier: AbilityTier;
  darsImage: string;
  content: IstimaContent;
  existingResult?: MaharahActivityResult;
  onComplete: (result: MaharahActivityResult) => void;
}

export const IstimaSection: React.FC<IstimaSectionProps> = ({
  tier,
  darsImage,
  content,
  existingResult,
  onComplete,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingResult?.completed));
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [hiwarPaused, setHiwarPaused] = useState(false);

  useEffect(() => {
    setSubmitted(Boolean(existingResult?.completed));
    setAnswers({});
    setPlayingId(null);
    return () => stopArabicAudio();
  }, [content, existingResult?.completed]);

  const allAnswered = content.questions.every((q) => Boolean(answers[q.id]));

  const handlePlayQuestionAudio = (qId: string, audioTextAr: string) => {
    setHiwarPaused(false);
    playArabicFusha(audioTextAr, {
      rate: 0.92,
      callbacks: {
        onStart: () => setPlayingId(qId),
        onEnd: () => setPlayingId((cur) => (cur === qId ? null : cur)),
        onError: () => setPlayingId((cur) => (cur === qId ? null : cur)),
      },
    });
  };

  const handlePlayHiwar = () => {
    if (!content.hiwar) return;
    setHiwarPaused(false);
    playMultiSpeakerArabicHiwar(
      content.hiwar.turns,
      content.hiwar.speaker1Name,
      content.hiwar.speaker2Name,
      {
        rate: 0.94,
        callbacks: {
          onStart: () => setPlayingId('hiwar'),
          onEnd: () => {
            setPlayingId((cur) => (cur === 'hiwar' ? null : cur));
            setHiwarPaused(false);
          },
          onError: () => {
            setPlayingId((cur) => (cur === 'hiwar' ? null : cur));
            setHiwarPaused(false);
          },
        },
      }
    );
  };

  const handleToggleHiwarPause = () => {
    if (playingId !== 'hiwar') return;
    if (hiwarPaused) {
      resumeArabicAudio();
      setHiwarPaused(false);
    } else {
      pauseArabicAudio();
      setHiwarPaused(true);
    }
  };

  const handleCheckAnswers = () => {
    if (!allAnswered) return;
    let correct = 0;
    content.questions.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) correct += 1;
    });
    const score = Math.max(20, Math.round((correct / content.questions.length) * 100));
    setSubmitted(true);
    playFeedbackTone(score >= 70);
    onComplete({
      completed: true,
      score,
      details: `Benar ${correct} dari ${content.questions.length} soal menyimak audio (${tier})`,
      completedAt: new Date().toISOString(),
    });
  };

  const handleRetry = () => {
    stopArabicAudio();
    setAnswers({});
    setSubmitted(false);
    setPlayingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Operational Objective Header */}
      <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Tujuan Maharah Istima&apos; ({tier})
          </p>
          <p className="font-arabic text-xl font-bold text-sky-950 text-right sm:text-left" dir="rtl" lang="ar">
            {content.objectiveAr}
          </p>
          <p className="text-sm text-slate-700">{content.objectiveId}</p>
        </div>
        {existingResult?.completed && (
          <div className="bg-white border border-sky-200 rounded-2xl px-4 py-2.5 text-center shrink-0">
            <p className="text-xs text-slate-500">Nilai Istima&apos;</p>
            <p className="text-2xl font-extrabold text-sky-700 tabular-nums">{existingResult.score}</p>
          </div>
        )}
      </div>

      {/* Audio-only notice */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <img
          src={darsImage}
          alt="Ilustrasi tema Dars"
          referrerPolicy="no-referrer"
          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-sky-100"
        />
        <div>
          <h3 className="text-base font-bold text-slate-900">Petunjuk Menyimak (الِاسْتِمَاعُ)</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{content.instruction}</p>
        </div>
      </div>

      {/* HIGH Tier Only: 6-Turn Dual-Speaker Hiwar Player */}
      {content.hiwar && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                <Users className="w-4 h-4" />
                <span>Hiwar 6 Giliran (2 Penutur Berbeda)</span>
              </span>
              <h4 className="font-arabic text-2xl font-bold text-indigo-950 mt-1" dir="rtl" lang="ar">
                {content.hiwar.titleAr}
              </h4>
              <p className="text-sm font-semibold text-indigo-900">{content.hiwar.titleId}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handlePlayHiwar}
                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>{playingId === 'hiwar' ? 'Putar Ulang Hiwar' : 'Putar Hiwar 6 Giliran'}</span>
              </button>

              {playingId === 'hiwar' && (
                <button
                  type="button"
                  onClick={handleToggleHiwarPause}
                  className="inline-flex items-center gap-1.5 px-4 py-3 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {hiwarPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{hiwarPaused ? 'Lanjutkan' : 'Jeda'}</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-indigo-800">
            Simak percakapan antara <strong>{content.hiwar.speaker1Name}</strong> dan{' '}
            <strong>{content.hiwar.speaker2Name}</strong> (6 giliran dialog) dengan baik sebelum menjawab 5 soal di bawah ini.
          </p>
        </div>
      )}

      {/* 5 Audio-Only Questions (NO written question text displayed!) */}
      <div className="space-y-4">
        {content.questions.map((q) => {
          const userAnswer = answers[q.id];
          const isPlayingThis = playingId === q.id;
          const isCorrect = userAnswer === q.correctOptionId;

          return (
            <div
              key={q.id}
              className={`bg-white border rounded-3xl p-5 sm:p-6 space-y-4 transition-colors ${
                submitted
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-rose-300 bg-rose-50/20'
                  : 'border-sky-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm tabular-nums">
                    {q.number}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Soal Audio Nomor {q.number}</p>
                    <p className="text-xs text-slate-500">
                      Dengarkan rekaman pertanyaan lalu pilih jawaban Arab yang tepat
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayQuestionAudio(q.id, q.audioTextAr)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      isPlayingThis
                        ? 'bg-amber-500 text-white'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                    <span>{isPlayingThis ? 'Sedang Memutar...' : 'Putar Audio Soal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayQuestionAudio(q.id, q.audioTextAr)}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
                    title="Ulangi audio soal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ulangi</span>
                  </button>
                </div>
              </div>

              {/* Arabic Options Only (2 for LOW, 3 for MIDDLE, 4 for HIGH) */}
              <div
                className={`grid gap-3 ${
                  q.optionsAr.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : q.optionsAr.length === 3
                      ? 'grid-cols-1 md:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                }`}
                dir="rtl"
              >
                {q.optionsAr.map((opt) => {
                  const selected = userAnswer === opt.id;
                  const isCorrectOpt = opt.id === q.correctOptionId;

                  let btnTone =
                    'bg-slate-50/70 hover:bg-sky-50 border-slate-200 text-slate-900';
                  if (submitted) {
                    if (isCorrectOpt) {
                      btnTone = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                    } else if (selected) {
                      btnTone = 'bg-rose-50 border-rose-400 text-rose-900';
                    } else {
                      btnTone = 'bg-white border-slate-100 text-slate-400';
                    }
                  } else if (selected) {
                    btnTone = 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-100';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className={`text-right px-4 py-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${btnTone}`}
                    >
                      <span className="font-arabic text-xl sm:text-[1.35rem] leading-loose" lang="ar">
                        {opt.textAr}
                      </span>
                      {submitted && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {submitted && selected && !isCorrectOpt && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="pt-2 text-xs sm:text-sm text-slate-700 bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 space-y-1">
                  <p>
                    <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {isCorrect ? 'Benar!' : 'Kurang tepat.'}
                    </strong>{' '}
                    {q.explanationId}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {!submitted ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleCheckAnswers}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {allAnswered
                ? "Periksa Jawaban & Simpan Nilai Istima'"
                : `Jawab Semua 5 Soal Audio (${Object.keys(answers).length}/5)`}
            </span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Nilai Istima&apos; tersimpan: {existingResult?.score}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Latihan Ulang</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
