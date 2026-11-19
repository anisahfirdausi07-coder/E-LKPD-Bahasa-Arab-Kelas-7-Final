import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  RotateCcw,
  Volume2,
  AlertTriangle,
} from 'lucide-react';
import {
  AbilityTier,
  EvaluasiQuestion,
  EvaluationQuestionReview,
  EvaluationResult,
  StudentProfile,
} from '../../types/elkpd';
import { playArabicFusha, playFeedbackTone } from '../../utils/arabicSpeech';

interface EvaluasiSectionProps {
  student: StudentProfile;
  darsNumber: number;
  darsTitleId: string;
  tier: AbilityTier;
  questions: EvaluasiQuestion[];
  existingResult?: EvaluationResult;
  onComplete: (result: EvaluationResult) => void;
}

export const EvaluasiSection: React.FC<EvaluasiSectionProps> = ({
  student,
  darsNumber,
  darsTitleId,
  tier,
  questions,
  existingResult,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(existingResult?.userAnswers || {});
  const [matchDrafts, setMatchDrafts] = useState<Record<string, Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(Boolean(existingResult?.completed));
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQ = questions[currentIdx];

  const isQuestionAnswered = (q: EvaluasiQuestion): boolean => {
    if (q.type === 'match' && q.matchPairs) {
      const saved = answers[q.id];
      if (!saved) return false;
      try {
        const parsed = JSON.parse(saved) as Record<string, string>;
        return q.matchPairs.every((p) => Boolean(parsed[p.leftAr]));
      } catch {
        return false;
      }
    }
    return Boolean(answers[q.id]);
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const allAnswered = answeredCount === questions.length;

  const isQuestionCorrect = (q: EvaluasiQuestion, ansMap: Record<string, string>): boolean => {
    const given = ansMap[q.id];
    if (!given) return false;
    if (q.type === 'match' && q.matchPairs) {
      try {
        const parsedGiven = JSON.parse(given) as Record<string, string>;
        const parsedExpected = JSON.parse(q.correctAnswer) as Record<string, string>;
        return q.matchPairs.every((p) => parsedGiven[p.leftAr] === parsedExpected[p.leftAr]);
      } catch {
        return false;
      }
    }
    return given === q.correctAnswer;
  };

  const handleSelectMatch = (qId: string, leftAr: string, rightAr: string) => {
    if (submitted) return;
    const current =
      matchDrafts[qId] ||
      (() => {
        try {
          return answers[qId] ? (JSON.parse(answers[qId]) as Record<string, string>) : {};
        } catch {
          return {};
        }
      })();
    const updated = { ...current, [leftAr]: rightAr };
    setMatchDrafts((prev) => ({ ...prev, [qId]: updated }));
    setAnswers((prev) => ({ ...prev, [qId]: JSON.stringify(updated) }));
  };

  const handleConfirmAndSubmit = () => {
    if (!allAnswered) return;
    setShowConfirmModal(false);

    let correctCount = 0;
    const reviews: EvaluationQuestionReview[] = questions.map((q) => {
      const correct = isQuestionCorrect(q, answers);
      if (correct) correctCount += 1;

      const studentOptText =
        q.options?.find((o) => o.id === answers[q.id])?.text || answers[q.id] || '-';
      const correctOptText =
        q.options?.find((o) => o.id === q.correctAnswer)?.text || q.correctAnswer;

      return {
        questionNumber: q.number,
        prompt: q.question,
        studentAnswer: studentOptText,
        correctAnswer: correctOptText,
        isCorrect: correct,
        explanation: q.explanation,
      };
    });

    const totalObjective = questions.length;
    const wrongCount = totalObjective - correctCount;
    const score = Math.round((correctCount / totalObjective) * 100);
    setSubmitted(true);
    playFeedbackTone(score >= 70);

    onComplete({
      completed: true,
      correctCount,
      wrongCount,
      totalObjective,
      score,
      userAnswers: answers,
      reviews,
      completedAt: new Date().toISOString(),
    });
  };

  const handleRetake = () => {
    setSubmitted(false);
    setAnswers({});
    setMatchDrafts({});
    setCurrentIdx(0);
    setShowConfirmModal(false);
  };

  // Post-submit Review View
  if (submitted && existingResult) {
    const totalObj = existingResult.totalObjective || questions.length;
    return (
      <div className="space-y-6">
        <div className="bg-white border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-arabic text-2xl font-bold text-sky-900" dir="rtl" lang="ar">
              الِاخْتِبَارُ النِّهَائِيُّ
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Hasil Evaluasi Dars {darsNumber}: {darsTitleId} ({tier})
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {student.fullName} · Kelas {student.className} · Rumus: ({existingResult.correctCount} / {totalObj}) × 100 ={' '}
              <strong className="text-sky-700">{existingResult.score}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
              <p className="text-xs font-semibold text-emerald-700">Benar</p>
              <p className="text-2xl font-bold text-emerald-900 tabular-nums">{existingResult.correctCount}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 text-center">
              <p className="text-xs font-semibold text-rose-700">Salah</p>
              <p className="text-2xl font-bold text-rose-900 tabular-nums">{existingResult.wrongCount}</p>
            </div>
            <div className="bg-sky-600 text-white rounded-2xl px-5 py-3 text-center">
              <p className="text-xs font-medium text-sky-100">Nilai Evaluasi</p>
              <p className="text-2xl font-bold tabular-nums">{existingResult.score}</p>
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900">
              Pembahasan Seluruh {questions.length} Soal Evaluasi
            </h4>
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kerjakan Ulang Evaluasi</span>
            </button>
          </div>

          {questions.map((q) => {
            const correct = isQuestionCorrect(q, existingResult.userAnswers);
            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-5 space-y-2.5 ${
                  correct ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Soal {q.number} ({q.maharah}). {q.question}
                  </p>
                  {correct ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Benar</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 shrink-0">
                      <XCircle className="w-4 h-4" />
                      <span>Salah</span>
                    </span>
                  )}
                </div>

                {q.audioPromptAr && (
                  <p className="font-arabic text-lg bg-sky-50/70 p-3 rounded-xl text-sky-950 text-right" dir="rtl" lang="ar">
                    {q.audioPromptAr}
                  </p>
                )}

                {q.readingContextAr && (
                  <p className="font-arabic text-lg bg-slate-50 p-3 rounded-xl text-slate-800 text-right" dir="rtl" lang="ar">
                    {q.readingContextAr}
                  </p>
                )}

                {q.options && (
                  <p className="text-xs text-slate-600">
                    Jawabanmu:{' '}
                    <strong className="text-slate-900">
                      {q.options.find((o) => o.id === existingResult.userAnswers[q.id])?.text || '-'}
                    </strong>{' '}
                    · Kunci:{' '}
                    <strong className="text-emerald-800">
                      {q.options.find((o) => o.id === q.correctAnswer)?.text}
                    </strong>
                  </p>
                )}

                <p className="text-xs text-slate-600 bg-sky-50/60 p-3 rounded-xl">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Exam View
  return (
    <div className="space-y-6">
      {/* Header + Student Identity + Instructions */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-arabic text-2xl font-bold text-sky-900" dir="rtl" lang="ar">
            الِاخْتِبَارُ النِّهَائِيُّ
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Evaluasi Dars {darsNumber}: {darsTitleId} ({questions.length} Soal · {tier})
          </h3>
          <p className="text-xs text-slate-600">
            Peserta: <strong>{student.fullName}</strong> ({student.className}) · Jawab seluruh soal mencakup 4 maharah lalu tekan Selesai.
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-xs font-semibold text-sky-800 tabular-nums">
            Soal {currentIdx + 1} dari {questions.length}
          </p>
          <p className="text-xs text-slate-600 tabular-nums">
            Terjawab: {answeredCount} / {questions.length}
          </p>
        </div>
      </div>

      {/* Question Number Strip */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => {
          const answered = isQuestionAnswered(q);
          const active = idx === currentIdx;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`w-10 h-10 rounded-xl text-xs font-bold tabular-nums border transition-colors cursor-pointer ${
                active
                  ? 'bg-sky-600 text-white border-sky-600'
                  : answered
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50'
              }`}
            >
              {q.number}
            </button>
          );
        })}
      </div>

      {/* Current Question Card */}
      {currentQ && (
        <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Soal {currentQ.number} dari {questions.length} · Maharah {currentQ.maharah.toUpperCase()}
            </span>
          </div>

          {currentQ.audioPromptAr && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-sky-800">Soal Audio Istima&apos;</p>
                <p className="text-xs text-slate-600">Putar audio bahasa Arab berikut untuk menjawab soal.</p>
              </div>
              <button
                type="button"
                onClick={() => playArabicFusha(currentQ.audioPromptAr || '')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Putar Audio Soal</span>
              </button>
            </div>
          )}

          {currentQ.readingContextAr && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1.5">Bacalah teks berikut:</p>
              <p className="font-arabic text-xl sm:text-2xl text-slate-900 text-right leading-loose" dir="rtl" lang="ar">
                {currentQ.readingContextAr}
              </p>
            </div>
          )}

          <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed" dir="auto">
            {currentQ.question}
          </p>

          {/* Options */}
          {currentQ.options && (
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt) => {
                const selected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                    className={`text-left px-5 py-3.5 rounded-2xl border text-base font-medium transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      selected
                        ? 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-100'
                        : 'bg-slate-50/70 hover:bg-sky-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-semibold text-xs text-slate-400 uppercase">{opt.id}.</span>
                    <span className="flex-1 text-right sm:text-left font-arabic text-lg" dir="auto">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Matching Pairs */}
          {currentQ.type === 'match' && currentQ.matchPairs && (
            <div className="space-y-3">
              {(() => {
                const currentMap = (() => {
                  if (matchDrafts[currentQ.id]) return matchDrafts[currentQ.id];
                  try {
                    return answers[currentQ.id]
                      ? (JSON.parse(answers[currentQ.id]) as Record<string, string>)
                      : {};
                  } catch {
                    return {};
                  }
                })();
                const rightChoices = currentQ.matchPairs!.map((p) => p.rightAr).slice().sort();

                return currentQ.matchPairs!.map((pair) => (
                  <div
                    key={pair.leftAr}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <span className="font-arabic text-2xl font-bold text-sky-950 text-right sm:text-left" dir="rtl" lang="ar">
                      {pair.leftAr}
                    </span>
                    <select
                      value={currentMap[pair.leftAr] || ''}
                      onChange={(e) => handleSelectMatch(currentQ.id, pair.leftAr, e.target.value)}
                      className="px-4 py-2.5 bg-white border border-sky-200 rounded-xl font-arabic text-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Pilih pasangan --</option>
                      {rightChoices.map((rc) => (
                        <option key={rc} value={rc}>
                          {rc}
                        </option>
                      ))}
                    </select>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Prev / Next / Submit Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                <span>Soal Berikutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!allAnswered}
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>
                  {allAnswered
                    ? 'Selesai & Hitung Nilai Evaluasi'
                    : `Lengkapi ${questions.length - answeredCount} Soal Lagi`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-sky-100 max-w-md w-full p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Akhiri Evaluasi Dars {darsNumber}?</h4>
                <p className="text-xs text-slate-600">Seluruh {questions.length} soal sudah dijawab.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah kamu yakin ingin menyelesaikan evaluasi sekarang? Nilai akan dihitung dan dimasukkan ke rapor
              digital Dars {darsNumber}.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSubmit}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                Ya, Hitung Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
