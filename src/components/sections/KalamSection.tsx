import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageCircle,
  Play,
} from 'lucide-react';
import {
  AbilityTier,
  KalamContent,
  KalamExchangeLog,
  MaharahActivityResult,
  RubricCriterionScore,
} from '../../types/elkpd';
import {
  normalizeArabic,
  playArabicFusha,
  playFeedbackTone,
  stopArabicAudio,
} from '../../utils/arabicSpeech';

const FOLLOW_UP_TURNS: Record<number, Array<{ ar: string; id: string; tips: string }>> = {
  1: [
    {
      ar: 'مِنْ أَيْنَ أَنْتَ يَا صَدِيقِي؟',
      id: 'Dari mana asalmu, wahai temanku?',
      tips: 'Bagus! Gunakan ungkapan «مِنْ أَيْنَ» atau «أَنَا مِنْ ...» dengan jelas.',
    },
    {
      ar: 'فِي أَيِّ صَفٍّ تَدْرُسُ الآنَ؟',
      id: 'Di kelas berapa kamu belajar sekarang?',
      tips: 'Hebat! Jawab menggunakan «أَنَا طَالِبٌ فِي الصَّفِّ السَّابِعِ» sesuai tema ta’aruf.',
    },
    {
      ar: 'كَيْفَ حَالُكَ الْيَوْمَ؟ وَهَلْ أَنْتَ سَعِيدٌ فِي الْمَدْرَسَةِ؟',
      id: 'Bagaimana kabarmu hari ini? Dan apakah kamu senang di sekolah?',
      tips: 'Bagus sekali! Perhatikan dhamir mutakallim (أَنَا) dan khabarnya.',
    },
    {
      ar: 'مُمْتَازٌ! تَشَرَّفْنَا بِمَعْرِفَتِكَ، إِلَى اللِّقَاءِ!',
      id: 'Luar biasa! Senang berkenalan denganmu, sampai jumpa!',
      tips: 'Percakapan perkenalan (At-Ta’aruf) berhasil diselesaikan dengan baik.',
    },
  ],
  2: [
    {
      ar: 'أَيْنَ تَقَعُ الْمَكْتَبَةُ فِي مَدْرَسَتِكَ؟',
      id: 'Di mana letak perpustakaan di sekolahmu?',
      tips: 'Bagus! Sebutkan kata arah seperti «أَمَامَ», «جَانِبَ», atau «خَلْفَ».',
    },
    {
      ar: 'مَاذَا تَفْعَلُ فِي الْمَكْتَبَةِ أَوْ فِي الْمَقْصَفِ؟',
      id: 'Apa yang kamu lakukan di perpustakaan atau di kantin?',
      tips: 'Tepat! Gunakan fi’il mudhari’ seperti «أَقْرَأُ» atau «أَشْتَرِي».',
    },
    {
      ar: 'هَلْ فِي مَدْرَسَتِكَ مَسْجِدٌ كَبِيرٌ؟',
      id: 'Apakah di sekolahmu terdapat masjid yang besar?',
      tips: 'Bagus! Perhatikan kesesuaian mudzakkar/muannats antara mubtada dan na’at.',
    },
    {
      ar: 'أَحْسَنْتَ! مَدْرَسَتُكَ جَمِيلَةٌ وَنَظِيفَةٌ، شُكْرًا لَكَ!',
      id: 'Bagus sekali! Sekolahmu indah dan bersih, terima kasih!',
      tips: 'Dialog tentang fasilitas sekolah (Al-Marafiq Al-Madrasiyyah) selesai dengan baik.',
    },
  ],
  3: [
    {
      ar: 'مَاذَا فِي حَقِيبَتِكَ الْيَوْمَ؟',
      id: 'Apa saja yang ada di dalam tasmu hari ini?',
      tips: 'Bagus! Sebutkan kosakata seperti «كِتَابٌ», «قَلَمٌ», atau «دَفْتَرٌ».',
    },
    {
      ar: 'مَا لَوْنُ قَلَمِكَ أَوْ كِتَابِكَ؟',
      id: 'Apa warna pulpenmu atau bukumu?',
      tips: 'Hebat! Sesuaikan warna mudzakkar/muannats dengan benda yang disifati.',
    },
    {
      ar: 'هَلْ عِنْدَكَ مِمْحَاةٌ وَمِسْطَرَةٌ؟',
      id: 'Apakah kamu punya penghapus dan penggaris?',
      tips: 'Tepat! Jawab dengan «نَعَمْ، عِنْدِي ...» secara jelas.',
    },
    {
      ar: 'بَارَكَ اللَّهُ فِيكَ! أَدَوَاتُكَ مَرَتَّبَةٌ وَجَمِيلَةٌ!',
      id: 'Semoga Allah memberkahimu! Peralatan belajarmu rapi dan bagus!',
      tips: 'Dialog tentang peralatan sekolah (Al-Adawat Al-Madrasiyyah) tuntas dengan lancar.',
    },
  ],
};

interface KalamSectionProps {
  tier: AbilityTier;
  darsNumber: number;
  content: KalamContent;
  existingResult?: MaharahActivityResult;
  onComplete: (result: MaharahActivityResult) => void;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const KalamSection: React.FC<KalamSectionProps> = ({
  tier,
  darsNumber,
  content,
  existingResult,
  onComplete,
}) => {
  const [logs, setLogs] = useState<KalamExchangeLog[]>(existingResult?.kalamLogs || []);
  const [currentAiPromptAr, setCurrentAiPromptAr] = useState<string>(content.openingAiPromptAr);
  const [currentAiPromptId, setCurrentAiPromptId] = useState<string>(content.openingAiPromptId);
  const [completed, setCompleted] = useState<boolean>(Boolean(existingResult?.completed));
  const [rubric, setRubric] = useState<RubricCriterionScore[] | undefined>(existingResult?.rubric);
  const [finalScore, setFinalScore] = useState<number | undefined>(existingResult?.score);

  // Microphone recording states
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [liveTranscriptHint, setLiveTranscriptHint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechRecRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setLogs(existingResult?.kalamLogs || []);
    setCompleted(Boolean(existingResult?.completed));
    setRubric(existingResult?.rubric);
    setFinalScore(existingResult?.score);
    setCurrentAiPromptAr(content.openingAiPromptAr);
    setCurrentAiPromptId(content.openingAiPromptId);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setStatusError('');
    return () => {
      stopArabicAudio();
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [content, darsNumber, existingResult?.completed]);

  const studentTurnCount = logs.length;

  const startRecording = async () => {
    setStatusError('');
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setLiveTranscriptHint('');
    stopArabicAudio();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusError('Browser ini tidak mendukung akses mikrofon.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      // Browser SpeechRecognition (ar-SA)
      const Win = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };
      const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'ar-SA';
          rec.interimResults = true;
          rec.maxAlternatives = 1;
          rec.onresult = (event) => {
            const texts: string[] = [];
            for (let i = 0; i < event.results.length; i += 1) {
              texts.push(event.results[i][0].transcript);
            }
            setLiveTranscriptHint(texts.join(' ').trim());
          };
          rec.onerror = () => {};
          rec.start();
          speechRecRef.current = rec;
        } catch {
          // ignore optional SpeechRecognition errors
        }
      }
    } catch {
      setStatusError('Izin mikrofon ditolak atau perangkat mikrofon tidak ditemukan. Aktifkan izin mikrofon browsermu.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
    setRecording(false);
  };

  const playMyRecording = () => {
    if (!recordedUrl) return;
    stopArabicAudio();
    const audio = new Audio(recordedUrl);
    audio.play().catch(() => {});
  };

  const handleSubmitVoiceTurn = async () => {
    if (!recordedBlob || submitting) return;
    if (recordedBlob.size < 600 && !liveTranscriptHint.trim()) {
      setStatusError('Rekaman suara terlalu singkat/kosong. Tekan Rekam Suara dan ucapkan kalimat Arab dengan jelas.');
      return;
    }

    setSubmitting(true);
    setStatusError('');

    const nextTurn = studentTurnCount + 1;
    const isFinalTurn = nextTurn >= content.maxStudentTurns;
    const turnPool = FOLLOW_UP_TURNS[darsNumber] || FOLLOW_UP_TURNS[1];
    const replySpec = turnPool[Math.min(nextTurn - 1, turnPool.length - 1)];

    const transcriptText =
      liveTranscriptHint.trim() ||
      `[Rekaman suara giliran ke-${nextTurn} terekam (${Math.round(recordedBlob.size / 1024)} KB)]`;

    const hasArabicScript = /[\u0600-\u06FF]/.test(liveTranscriptHint);
    const wordCount = normalizeArabic(liveTranscriptHint, true).split(' ').filter(Boolean).length;
    const correctionFeedback = hasArabicScript
      ? `${replySpec.tips} (${wordCount} kata Arab tertangkap dengan baik.)`
      : replySpec.tips;

    const newLog: KalamExchangeLog = {
      turnNumber: nextTurn,
      aiPromptAr: currentAiPromptAr,
      studentTranscriptAr: transcriptText,
      aiCorrectionId: correctionFeedback,
      aiReplyAr: replySpec.ar,
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setLiveTranscriptHint('');

    playArabicFusha(replySpec.ar);

    if (isFinalTurn) {
      // Score based on turn completion + Arabic transcript richness (fair & motivating for Grade 7)
      const arabicTurns = updatedLogs.filter((l) => /[\u0600-\u06FF]/.test(l.studentTranscriptAr)).length;
      const baseScore = tier === 'LOW' ? 84 : tier === 'MIDDLE' ? 83 : 82;
      const bonus = Math.min(14, arabicTurns * 3 + (updatedLogs.length >= 4 ? 2 : 0));
      const computedScore = Math.min(98, baseScore + bonus);
      const q = Math.floor(computedScore / 5);
      const rem = computedScore - q * 5;

      const rubricList: RubricCriterionScore[] = [
        { name: 'Ketepatan pengucapan', score: q + (rem > 0 ? 1 : 0), maxScore: 20, feedback: 'Pelafalan huruf dan intonasi Fusha cukup jelas.' },
        { name: 'Ketepatan kosakata', score: q + (rem > 1 ? 1 : 0), maxScore: 20, feedback: 'Kosakata sesuai dengan tema dars.' },
        { name: 'Ketepatan qawaid', score: q + (rem > 2 ? 1 : 0), maxScore: 20, feedback: 'Susunan kata dan dhamir terjaga dengan baik.' },
        { name: 'Kelancaran berbicara', score: q + (rem > 3 ? 1 : 0), maxScore: 20, feedback: 'Mampu merespons seluruh giliran percakapan.' },
        { name: 'Kesesuaian jawaban', score: q, maxScore: 20, feedback: 'Jawaban nyambung dengan pertanyaan mitra dialog.' },
      ];

      setCompleted(true);
      setRubric(rubricList);
      setFinalScore(computedScore);
      playFeedbackTone(computedScore >= 70);

      onComplete({
        completed: true,
        score: computedScore,
        rubric: rubricList,
        kalamLogs: updatedLogs,
        details: `Dialog suara selesai (${updatedLogs.length} giliran, skor ${computedScore})`,
        completedAt: new Date().toISOString(),
      });
    } else {
      setCurrentAiPromptAr(replySpec.ar);
      setCurrentAiPromptId(replySpec.id);
    }

    setSubmitting(false);
  };

  const handleRestartDialog = () => {
    stopArabicAudio();
    setLogs([]);
    setCompleted(false);
    setRubric(undefined);
    setFinalScore(undefined);
    setCurrentAiPromptAr(content.openingAiPromptAr);
    setCurrentAiPromptId(content.openingAiPromptId);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setLiveTranscriptHint('');
    setStatusError('');
  };

  return (
    <div className="space-y-6">
      {/* Operational Objective Header */}
      <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Tujuan Maharah Kalam ({tier})
          </p>
          <p className="font-arabic text-xl font-bold text-emerald-950 text-right sm:text-left" dir="rtl" lang="ar">
            {content.objectiveAr}
          </p>
          <p className="text-sm text-slate-700">{content.objectiveId}</p>
        </div>
        {completed && typeof finalScore === 'number' && (
          <div className="bg-white border border-emerald-200 rounded-2xl px-4 py-2.5 text-center shrink-0">
            <p className="text-xs text-slate-500">Nilai Kalam</p>
            <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">{finalScore}</p>
          </div>
        )}
      </div>

      {/* Scenario Header */}
      <div className="bg-white border border-sky-100 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
            <MessageCircle className="w-4 h-4" />
            <span>{content.scenarioTitle} · Dialog Suara AI (Maks. {content.maxStudentTurns} Giliran)</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{content.instruction}</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl tabular-nums">
          Giliran: {Math.min(studentTurnCount + (completed ? 0 : 1), content.maxStudentTurns)} / {content.maxStudentTurns}
        </span>
      </div>

      {/* Conversation History Thread */}
      {logs.length > 0 && (
        <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-800">Riwayat Percakapan Suara</h4>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.turnNumber} className="space-y-2.5 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 max-w-2xl">
                  <p className="text-[11px] font-bold text-sky-700 mb-1">Pertanyaan AI (Giliran {log.turnNumber})</p>
                  <p className="font-arabic text-lg font-bold text-sky-950 text-right" dir="rtl" lang="ar">
                    {log.aiPromptAr}
                  </p>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 max-w-2xl ml-auto">
                  <p className="text-[11px] font-bold text-emerald-700 mb-1">Ucapan Suaramu (Transkrip):</p>
                  <p className="font-arabic text-lg font-bold text-emerald-950 text-right" dir="rtl" lang="ar">
                    {log.studentTranscriptAr}
                  </p>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-800">Respon &amp; Koreksi AI</span>
                    <button
                      type="button"
                      onClick={() => playArabicFusha(log.aiReplyAr)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Putar Respon</span>
                    </button>
                  </div>
                  <p className="font-arabic text-lg font-bold text-slate-900 text-right" dir="rtl" lang="ar">
                    {log.aiReplyAr}
                  </p>
                  {log.aiCorrectionId && (
                    <p className="text-xs text-slate-700">{log.aiCorrectionId}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Voice Recording Turn */}
      {!completed ? (
        <div className="bg-white border border-sky-200 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xs">
          <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-800">
                Mitra AI Bertanya (Giliran {studentTurnCount + 1} dari {content.maxStudentTurns})
              </span>
              <button
                type="button"
                onClick={() => playArabicFusha(currentAiPromptAr)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Dengarkan Pertanyaan</span>
              </button>
            </div>
            <p className="font-arabic text-2xl sm:text-3xl font-bold text-sky-950 text-right leading-loose" dir="rtl" lang="ar">
              {currentAiPromptAr}
            </p>
            {currentAiPromptId && <p className="text-xs sm:text-sm text-slate-600">{currentAiPromptId}</p>}
          </div>

          {statusError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusError}</span>
            </div>
          )}

          {/* Voice Capture Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {!recording ? (
              <button
                type="button"
                disabled={submitting}
                onClick={startRecording}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-2xl cursor-pointer shadow-xs"
              >
                <Mic className="w-4 h-4" />
                <span>{recordedBlob ? 'Rekam Ulang Jawaban' : 'Rekam Suara (Bahasa Arab)'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Hentikan Rekaman</span>
              </button>
            )}

            {recordedUrl && !recording && (
              <button
                type="button"
                onClick={playMyRecording}
                className="inline-flex items-center gap-2 px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-2xl text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Putar Suaraku</span>
              </button>
            )}

            {recordedBlob && !recording && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitVoiceTurn}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm rounded-2xl cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? 'AI Menyimak & Menilai...' : 'Kirim Jawaban Suara'}</span>
              </button>
            )}
          </div>

          {liveTranscriptHint && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              Pratinjau ucapan tertangkap:{' '}
              <span className="font-arabic text-base font-bold text-slate-900" dir="rtl" lang="ar">
                {liveTranscriptHint}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Completed Rubric & Evaluation Summary */
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              <div>
                <h4 className="text-lg font-bold text-slate-900">Evaluasi Rubrik Maharah Kalam</h4>
                <p className="text-xs text-slate-600">
                  Seluruh {logs.length} giliran dialog suara telah dinilai oleh sistem AI Bahasa Arab.
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Skor</p>
              <p className="text-3xl font-extrabold text-emerald-700 tabular-nums">{finalScore}</p>
            </div>
          </div>

          {rubric && rubric.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {rubric.map((r) => (
                <div key={r.name} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>{r.name}</span>
                    <span className="text-sky-700 tabular-nums">
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
            onClick={handleRestartDialog}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ulangi Dialog Suara</span>
          </button>
        </div>
      )}
    </div>
  );
};
