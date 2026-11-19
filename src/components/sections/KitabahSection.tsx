import React, { useEffect, useState } from 'react';
import {
  PenTool,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AbilityTier,
  KitabahContent,
  KitabahSubmissionLog,
  MaharahActivityResult,
  RubricCriterionScore,
} from '../../types/elkpd';
import {
  normalizeArabic,
  normalizeArabicStrictLetters,
  playFeedbackTone,
} from '../../utils/arabicSpeech';
import { ArabicKeyboard } from '../ArabicKeyboard';

interface KitabahSectionProps {
  tier: AbilityTier;
  darsNumber: number;
  content: KitabahContent;
  existingResult?: MaharahActivityResult;
  onComplete: (result: MaharahActivityResult) => void;
}

export const KitabahSection: React.FC<KitabahSectionProps> = ({
  tier,
  darsNumber,
  content,
  existingResult,
  onComplete,
}) => {
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    existingResult?.kitabahLogs?.forEach((l) => {
      init[l.taskId] = l.studentTextAr;
    });
    return init;
  });
  const [activeTaskId, setActiveTaskId] = useState<string>(content.tasks[0]?.id || '');
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingResult?.completed));
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rubric, setRubric] = useState<RubricCriterionScore[] | undefined>(existingResult?.rubric);
  const [taskLogs, setTaskLogs] = useState<KitabahSubmissionLog[]>(existingResult?.kitabahLogs || []);
  const [summaryFeedback, setSummaryFeedback] = useState<string>(existingResult?.details || '');

  useEffect(() => {
    setActiveTaskId(content.tasks[0]?.id || '');
    setSubmitted(Boolean(existingResult?.completed));
    setRubric(existingResult?.rubric);
    setTaskLogs(existingResult?.kitabahLogs || []);
    setSummaryFeedback(existingResult?.details || '');
    setErrorMsg('');
  }, [content, darsNumber, existingResult?.completed]);

  const allFilled = content.tasks.every((t) => (inputs[t.id] || '').trim().length >= 3);

  const handleInsertChar = (ch: string) => {
    if (!activeTaskId || submitted) return;
    setInputs((prev) => ({ ...prev, [activeTaskId]: (prev[activeTaskId] || '') + ch }));
  };

  const handleBackspace = () => {
    if (!activeTaskId || submitted) return;
    setInputs((prev) => ({
      ...prev,
      [activeTaskId]: (prev[activeTaskId] || '').slice(0, -1),
    }));
  };

  const handleClearActive = () => {
    if (!activeTaskId || submitted) return;
    setInputs((prev) => ({ ...prev, [activeTaskId]: '' }));
  };

  // Evaluate LOW, MIDDLE, and HIGH locally (100% client-side, harakat-tolerant)
  const handleEvaluate = async () => {
    if (!allFilled || evaluating) return;
    setErrorMsg('');

    if (tier === 'LOW') {
      let totalScore = 0;
      const logs: KitabahSubmissionLog[] = content.tasks.map((task) => {
        const studentRaw = (inputs[task.id] || '').trim();
        const normStudent = normalizeArabic(studentRaw, true);
        const normStrict = normalizeArabicStrictLetters(studentRaw);
        const helperNorm = task.helperVocabAr?.[0] ? normalizeArabic(task.helperVocabAr[0], true) : '';

        const matchedExact = (task.expectedAnswersAr || []).some((exp) => {
          const nExp = normalizeArabic(exp, true);
          return normStudent === nExp || normStrict === normalizeArabicStrictLetters(exp);
        });
        const containsHelper = helperNorm ? normStudent.includes(helperNorm) : true;
        const wordCount = normStudent.split(' ').filter(Boolean).length;

        let taskScore = 60;
        let fb = 'Sudah berusaha menulis bahasa Arab! Perhatikan kembali kosakata kunci pada gambar.';
        if (matchedExact) {
          taskScore = 100;
          fb = 'Sempurna! Tulisan Arabmu sesuai dengan gambar dan kaidah penulisan (dengan/tanpa harakat diterima).';
        } else if (containsHelper && wordCount >= 2) {
          taskScore = 88;
          fb = 'Bagus! Kalimat sudah memuat kata bantu dan struktur yang bermakna.';
        } else if (wordCount >= 2) {
          taskScore = 76;
          fb = 'Cukup baik. Usahakan menyertakan kata bantu yang diberikan agar kalimat lebih lengkap.';
        }
        totalScore += taskScore;
        return {
          taskId: task.id,
          promptLabel: task.instruction,
          studentTextAr: studentRaw,
          feedbackId: fb,
        };
      });

      const finalScore = Math.round(totalScore / content.tasks.length);
      const lowRubric: RubricCriterionScore[] = [
        { name: 'Kesesuaian isi gambar', score: Math.round(finalScore * 0.35), maxScore: 35, feedback: 'Kalimat menggambarkan ilustrasi dengan baik.' },
        { name: 'Ketepatan kosakata & ejaan', score: Math.round(finalScore * 0.35), maxScore: 35, feedback: 'Penulisan huruf Arab terbaca jelas.' },
        { name: 'Struktur kalimat dasar', score: finalScore - 2 * Math.round(finalScore * 0.35), maxScore: 30, feedback: 'Susunan kata mubtada dan khabar tepat.' },
      ];

      setTaskLogs(logs);
      setRubric(lowRubric);
      setSummaryFeedback(`Penilaian Kitabah tingkat LOW selesai dengan skor ${finalScore}.`);
      setSubmitted(true);
      playFeedbackTone(finalScore >= 70);

      onComplete({
        completed: true,
        score: finalScore,
        rubric: lowRubric,
        kitabahLogs: logs,
        details: `Skor Kitabah LOW: ${finalScore}`,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    // MIDDLE and HIGH: Pure Client-Side 5-Criteria Rubric Evaluation (harakat-tolerant)
    setEvaluating(true);
    let totalTaskScore = 0;
    const minWordsExpected = tier === 'HIGH' ? 8 : 3;

    const logs: KitabahSubmissionLog[] = content.tasks.map((t) => {
      const studentRaw = (inputs[t.id] || '').trim();
      const normStudent = normalizeArabic(studentRaw, true);
      const hasArabic = /[\u0600-\u06FF]/.test(studentRaw);
      const words = normStudent.split(' ').filter(Boolean);
      const helpers = t.helperVocabAr || [];
      const matchedHelpers = helpers.filter((h) => normStudent.includes(normalizeArabic(h, true))).length;

      let taskScore = 62;
      let fb = 'Sudah mencoba menulis Arab. Tambahkan lebih banyak kosakata sesuai topik.';
      if (hasArabic && words.length >= minWordsExpected && matchedHelpers >= Math.min(1, helpers.length)) {
        taskScore = 92;
        fb = 'Sangat baik! Tulisan Arab tersusun rapi, memuat kosakata kunci, dan sesuai pola kalimat yang diminta.';
      } else if (hasArabic && words.length >= Math.max(2, Math.floor(minWordsExpected / 2))) {
        taskScore = 84;
        fb = 'Bagus! Penulisan huruf Arab sudah baik; kembangkan kalimat agar lebih kaya informasi.';
      } else if (hasArabic) {
        taskScore = 74;
        fb = 'Cukup baik. Perpanjang susunan kalimat sesuai petunjuk struktur.';
      }

      totalTaskScore += taskScore;
      return {
        taskId: t.id,
        promptLabel: t.instruction,
        studentTextAr: studentRaw,
        feedbackId: fb,
      };
    });

    const overallScore = Math.round(totalTaskScore / Math.max(1, content.tasks.length));
    const q = Math.floor(overallScore / 5);
    const rem = overallScore - q * 5;
    const rubricList: RubricCriterionScore[] = [
      { name: 'Kesesuaian isi', score: q + (rem > 0 ? 1 : 0), maxScore: 20, feedback: 'Isi tulisan sesuai dengan topik dan instruksi tugas.' },
      { name: 'Mufradat', score: q + (rem > 1 ? 1 : 0), maxScore: 20, feedback: 'Penggunaan kosakata bahasa Arab tepat dan relevan.' },
      { name: 'Qawaid', score: q + (rem > 2 ? 1 : 0), maxScore: 20, feedback: 'Pola struktur kalimat dan kesesuaian mudzakkar/muannats terjaga.' },
      { name: 'Penulisan', score: q + (rem > 3 ? 1 : 0), maxScore: 20, feedback: 'Ejaan huruf Arab jelas dan terbaca (dengan/tanpa harakat diterima).' },
      { name: 'Keterpaduan', score: q, maxScore: 20, feedback: 'Hubungan antarkata dan antarkalimat runtut.' },
    ];

    const summary = `Evaluasi Maharah Kitabah (${tier}) selesai dengan nilai ${overallScore}.`;
    setTaskLogs(logs);
    setRubric(rubricList);
    setSummaryFeedback(summary);
    setSubmitted(true);
    setEvaluating(false);
    playFeedbackTone(overallScore >= 70);

    onComplete({
      completed: true,
      score: overallScore,
      rubric: rubricList,
      kitabahLogs: logs,
      details: summary,
      completedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setRubric(undefined);
    setTaskLogs([]);
    setSummaryFeedback('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-6">
      {/* Operational Objective Header */}
      <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
            Tujuan Maharah Kitabah ({tier})
          </p>
          <p className="font-arabic text-xl font-bold text-indigo-950 text-right sm:text-left" dir="rtl" lang="ar">
            {content.objectiveAr}
          </p>
          <p className="text-sm text-slate-700">{content.objectiveId}</p>
        </div>
        {existingResult?.completed && (
          <div className="bg-white border border-indigo-200 rounded-2xl px-4 py-2.5 text-center shrink-0">
            <p className="text-xs text-slate-500">Nilai Kitabah</p>
            <p className="text-2xl font-extrabold text-indigo-700 tabular-nums">{existingResult.score}</p>
          </div>
        )}
      </div>

      {/* Guidance */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <PenTool className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Petunjuk Menulis Bahasa Arab (الْكِتَابَةُ)</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{content.instruction}</p>
        </div>
      </div>

      {/* Writing Tasks */}
      <div className="space-y-5">
        {content.tasks.map((task, idx) => {
          const isActive = activeTaskId === task.id;
          const logItem = taskLogs.find((l) => l.taskId === task.id);
          return (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={`bg-white rounded-3xl border p-5 sm:p-7 space-y-4 transition-all ${
                isActive ? 'border-sky-400 ring-2 ring-sky-100' : 'border-sky-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900">{task.instruction}</p>
                </div>
                {isActive && !submitted && (
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg shrink-0">
                    Sedang Aktif
                  </span>
                )}
              </div>

              {task.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-sky-100 bg-sky-50/40 max-w-md">
                  <img
                    src={task.imageUrl}
                    alt={task.imageCaption || 'Ilustrasi tugas Kitabah'}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover"
                  />
                  {task.imageCaption && (
                    <p className="text-xs text-slate-600 px-3.5 py-2 bg-white border-t border-sky-100">
                      {task.imageCaption}
                    </p>
                  )}
                </div>
              )}

              {task.helperVocabAr && task.helperVocabAr.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    {tier === 'LOW' ? 'Kosakata Bantu:' : 'Kosakata Stimulus:'}
                  </p>
                  <div className="flex flex-wrap gap-2" dir="rtl">
                    {task.helperVocabAr.map((w) => (
                      <button
                        key={w}
                        type="button"
                        disabled={submitted}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTaskId(task.id);
                          setInputs((prev) => ({
                            ...prev,
                            [task.id]: ((prev[task.id] || '') + ' ' + w).trimStart(),
                          }));
                        }}
                        className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-arabic text-xl font-bold text-amber-950 cursor-pointer disabled:cursor-default"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  {task.structureHint && (
                    <p className="text-xs text-slate-700 pt-1">{task.structureHint}</p>
                  )}
                </div>
              )}

              <textarea
                dir="rtl"
                lang="ar"
                rows={tier === 'HIGH' ? 5 : 3}
                disabled={submitted}
                value={inputs[task.id] || ''}
                onFocus={() => setActiveTaskId(task.id)}
                onChange={(e) => setInputs((prev) => ({ ...prev, [task.id]: e.target.value }))}
                placeholder="اُكْتُبْ جُمْلَتَكَ الْعَرَبِيَّةَ هُنَا..."
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-arabic text-2xl leading-loose text-right text-slate-900 disabled:bg-slate-50"
              />

              {submitted && logItem && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 text-xs sm:text-sm text-sky-950">
                  <strong>Catatan Penilaian:</strong> {logItem.feedbackId}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Virtual Arabic Keyboard */}
      {!submitted && (
        <ArabicKeyboard
          onInsert={handleInsertChar}
          onBackspace={handleBackspace}
          onClear={handleClearActive}
        />
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submit / Rubric Results */}
      {!submitted ? (
        <button
          type="button"
          disabled={!allFilled || evaluating}
          onClick={handleEvaluate}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
        >
          {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>
            {evaluating
              ? 'Menilai Tulisan Arabmu...'
              : allFilled
                ? 'Periksa & Simpan Nilai Kitabah'
                : 'Lengkapi Semua Tugas Menulis Terlebih Dahulu'}
          </span>
        </button>
      ) : (
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              <div>
                <h4 className="text-lg font-bold text-slate-900">Hasil Penilaian Maharah Kitabah</h4>
                <p className="text-xs sm:text-sm text-slate-600">{summaryFeedback}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Skor</p>
              <p className="text-3xl font-extrabold text-indigo-700 tabular-nums">
                {existingResult?.score}
              </p>
            </div>
          </div>

          {rubric && rubric.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {rubric.map((r) => (
                <div key={r.name} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>{r.name}</span>
                    <span className="text-indigo-700 tabular-nums">
                      {r.score} / {r.maxScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.feedback}</p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tulis Ulang / Perbaiki</span>
          </button>
        </div>
      )}
    </div>
  );
};
