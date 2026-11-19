import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Volume2,
  Pause,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AbilityTier, MaharahActivityResult, QiraahContent } from '../../types/elkpd';
import {
  pauseArabicAudio,
  playArabicFusha,
  playFeedbackTone,
  resumeArabicAudio,
  stopArabicAudio,
} from '../../utils/arabicSpeech';

interface QiraahSectionProps {
  tier: AbilityTier;
  darsImage: string;
  content: QiraahContent;
  existingResult?: MaharahActivityResult;
  onComplete: (result: MaharahActivityResult) => void;
}

export const QiraahSection: React.FC<QiraahSectionProps> = ({
  tier,
  darsImage,
  content,
  existingResult,
  onComplete,
}) => {
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, 'صَحِيحٌ' | 'خَطَأٌ'>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingResult?.completed));

  useEffect(() => {
    setSubmitted(Boolean(existingResult?.completed));
    setMatchingAnswers({});
    setTfAnswers({});
    setMcqAnswers({});
    setAudioState('idle');
    return () => stopArabicAudio();
  }, [content, existingResult?.completed]);

  const shuffledColB = useMemo(() => {
    if (!content.matchingPairs) return [];
    const list = content.matchingPairs.map((p) => p.colBAr);
    // Deterministic shuffle
    return [...list].sort((a, b) => a.localeCompare(b, 'ar'));
  }, [content.matchingPairs]);

  const handlePlayPassage = () => {
    const fullText = `${content.passageTitleAr}. ${content.paragraphsAr.join(' ')}`;
    playArabicFusha(fullText, {
      rate: 0.92,
      callbacks: {
        onStart: () => setAudioState('playing'),
        onEnd: () => setAudioState('idle'),
        onError: () => setAudioState('idle'),
      },
    });
  };

  const handlePauseOrResume = () => {
    if (audioState === 'playing') {
      pauseArabicAudio();
      setAudioState('paused');
    } else if (audioState === 'paused') {
      resumeArabicAudio();
      setAudioState('playing');
    }
  };

  const handleStopAudio = () => {
    stopArabicAudio();
    setAudioState('idle');
  };

  const allAnswered = useMemo(() => {
    if (content.mode === 'matching' && content.matchingPairs) {
      return content.matchingPairs.every((p) => Boolean(matchingAnswers[p.id]));
    }
    if (content.mode === 'true-false' && content.trueFalseQuestions) {
      return content.trueFalseQuestions.every((q) => Boolean(tfAnswers[q.id]));
    }
    if (content.mode === 'mcq' && content.mcqQuestions) {
      return content.mcqQuestions.every((q) => Boolean(mcqAnswers[q.id]));
    }
    return false;
  }, [content, matchingAnswers, tfAnswers, mcqAnswers]);

  const handleSubmit = () => {
    if (!allAnswered) return;
    let correct = 0;
    let total = 5;

    if (content.mode === 'matching' && content.matchingPairs) {
      total = content.matchingPairs.length;
      content.matchingPairs.forEach((p) => {
        if (matchingAnswers[p.id] === p.colBAr) correct += 1;
      });
    } else if (content.mode === 'true-false' && content.trueFalseQuestions) {
      total = content.trueFalseQuestions.length;
      content.trueFalseQuestions.forEach((q) => {
        if (tfAnswers[q.id] === q.correctAnswer) correct += 1;
      });
    } else if (content.mode === 'mcq' && content.mcqQuestions) {
      total = content.mcqQuestions.length;
      content.mcqQuestions.forEach((q) => {
        if (mcqAnswers[q.id] === q.correctOptionId) correct += 1;
      });
    }

    const score = Math.max(20, Math.round((correct / total) * 100));
    setSubmitted(true);
    playFeedbackTone(score >= 70);
    onComplete({
      completed: true,
      score,
      details: `Benar ${correct} dari ${total} soal Qira'ah (${content.mode}, ${tier})`,
      completedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    setMatchingAnswers({});
    setTfAnswers({});
    setMcqAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Operational Objective Header */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Tujuan Maharah Qira&apos;ah ({tier})
          </p>
          <p className="font-arabic text-xl font-bold text-amber-950 text-right sm:text-left" dir="rtl" lang="ar">
            {content.objectiveAr}
          </p>
          <p className="text-sm text-slate-700">{content.objectiveId}</p>
        </div>
        {existingResult?.completed && (
          <div className="bg-white border border-amber-200 rounded-2xl px-4 py-2.5 text-center shrink-0">
            <p className="text-xs text-slate-500">Nilai Qira&apos;ah</p>
            <p className="text-2xl font-extrabold text-amber-700 tabular-nums">{existingResult.score}</p>
          </div>
        )}
      </div>

      {/* Full Harakat Arabic Passage + Fusha Audio Controls */}
      <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={darsImage}
              alt={content.passageTitleId}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover border border-sky-100"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Teks Bacaan Berharakat Lengkap</span>
              </span>
              <h3 className="font-arabic text-2xl font-bold text-slate-900" dir="rtl" lang="ar">
                {content.passageTitleAr}
              </h3>
              <p className="text-xs text-slate-500">{content.passageTitleId}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePlayPassage}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>{audioState === 'idle' ? 'Putar Bacaan Fusha' : 'Ulangi'}</span>
            </button>
            {audioState !== 'idle' && (
              <>
                <button
                  type="button"
                  onClick={handlePauseOrResume}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {audioState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{audioState === 'playing' ? 'Jeda' : 'Lanjut'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopAudio}
                  className="inline-flex items-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-sky-50/40 border border-sky-100 rounded-2xl p-5 sm:p-6 space-y-4" dir="rtl" lang="ar">
          {content.paragraphsAr.map((p, idx) => (
            <p key={idx} className="font-arabic text-2xl sm:text-[1.7rem] text-slate-900 leading-[2.3] text-right">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Tier-Specific Activity */}
      <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
        <div>
          <h4 className="text-base font-bold text-slate-900">
            Latihan Pemahaman Bacaan (
            {content.mode === 'matching'
              ? 'Menjodohkan 5 Pasangan Arab'
              : content.mode === 'true-false'
                ? '5 Pernyataan صَحِيحٌ / خَطَأٌ'
                : '5 Soal Analisis Pilihan Ganda Arab'}
            )
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{content.instruction}</p>
        </div>

        {/* LOW: 5 Matching Pairs */}
        {content.mode === 'matching' && content.matchingPairs && (
          <div className="space-y-3">
            {content.matchingPairs.map((pair, idx) => {
              const selected = matchingAnswers[pair.id] || '';
              const isCorrect = selected === pair.colBAr;
              return (
                <div
                  key={pair.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border ${
                    submitted
                      ? isCorrect
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-rose-50/40 border-rose-300'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3" dir="rtl">
                    <span className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="font-arabic text-2xl font-bold text-sky-950" lang="ar">
                      {pair.colAAr}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-1 md:max-w-md">
                    <select
                      disabled={submitted}
                      dir="rtl"
                      value={selected}
                      onChange={(e) =>
                        setMatchingAnswers((prev) => ({ ...prev, [pair.id]: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white border border-sky-200 rounded-xl font-arabic text-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="" dir="ltr">
                        -- Pilih pasangan Arab --
                      </option>
                      {shuffledColB.map((choice) => (
                        <option key={choice} value={choice} dir="rtl">
                          {choice}
                        </option>
                      ))}
                    </select>
                    {submitted && (isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    ))}
                  </div>
                </div>
              );
            })}
            {submitted && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-950 space-y-1">
                <p className="font-bold">Kunci Pasangan yang Tepat:</p>
                {content.matchingPairs.map((p) => (
                  <p key={p.id} dir="rtl" className="font-arabic text-lg text-right">
                    {p.colAAr} ← {p.colBAr}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MIDDLE: 5 Arabic True/False (صَحِيحٌ / خَطَأٌ) */}
        {content.mode === 'true-false' && content.trueFalseQuestions && (
          <div className="space-y-4">
            {content.trueFalseQuestions.map((q, idx) => {
              const selected = tfAnswers[q.id];
              const isCorrect = selected === q.correctAnswer;
              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    submitted
                      ? isCorrect
                        ? 'bg-emerald-50/30 border-emerald-300'
                        : 'bg-rose-50/30 border-rose-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <p className="flex-1 font-arabic text-2xl font-bold text-slate-900 text-right leading-loose" dir="rtl" lang="ar">
                      {q.statementAr}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3" dir="rtl">
                    {(['صَحِيحٌ', 'خَطَأٌ'] as const).map((choice) => {
                      const isPicked = selected === choice;
                      const isRight = q.correctAnswer === choice;
                      let cls = 'bg-white border-slate-200 text-slate-800 hover:bg-sky-50';
                      if (submitted) {
                        if (isRight) cls = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                        else if (isPicked) cls = 'bg-rose-100 border-rose-400 text-rose-900';
                      } else if (isPicked) {
                        cls = 'bg-sky-600 border-sky-600 text-white';
                      }
                      return (
                        <button
                          key={choice}
                          type="button"
                          disabled={submitted}
                          onClick={() => setTfAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                          className={`px-6 py-2.5 rounded-xl border font-arabic text-xl font-bold transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-100">
                      <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {isCorrect ? 'Benar!' : `Jawaban yang benar: ${q.correctAnswer}.`}
                      </strong>{' '}
                      {q.explanationId}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HIGH: 5 Arabic 4-Option MCQ */}
        {content.mode === 'mcq' && content.mcqQuestions && (
          <div className="space-y-4">
            {content.mcqQuestions.map((q, idx) => {
              const selected = mcqAnswers[q.id];
              const isCorrect = selected === q.correctOptionId;
              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border space-y-3 ${
                    submitted
                      ? isCorrect
                        ? 'bg-emerald-50/30 border-emerald-300'
                        : 'bg-rose-50/30 border-rose-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums mt-1">
                      {idx + 1}
                    </span>
                    <p className="flex-1 font-arabic text-xl sm:text-2xl font-bold text-slate-900 text-right leading-loose" dir="rtl" lang="ar">
                      {q.questionAr}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" dir="rtl">
                    {q.optionsAr.map((opt) => {
                      const isPicked = selected === opt.id;
                      const isRight = q.correctOptionId === opt.id;
                      let cls = 'bg-white border-slate-200 text-slate-900 hover:bg-sky-50';
                      if (submitted) {
                        if (isRight) cls = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                        else if (isPicked) cls = 'bg-rose-50 border-rose-400 text-rose-900';
                        else cls = 'bg-white border-slate-100 text-slate-400';
                      } else if (isPicked) {
                        cls = 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-100';
                      }
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={submitted}
                          onClick={() => setMcqAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                          className={`text-right px-4 py-3 rounded-xl border font-arabic text-lg sm:text-xl transition-all cursor-pointer disabled:cursor-default flex items-center justify-between gap-2 ${cls}`}
                        >
                          <span lang="ar">{opt.textAr}</span>
                          {submitted && isRight && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {submitted && isPicked && !isRight && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-100">
                      <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {isCorrect ? 'Benar!' : 'Kurang tepat.'}
                      </strong>{' '}
                      {q.explanationId}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit / Retry Controls */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {!submitted ? (
            <button
              type="button"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Periksa &amp; Simpan Nilai Qira&apos;ah</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kerjakan Ulang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
