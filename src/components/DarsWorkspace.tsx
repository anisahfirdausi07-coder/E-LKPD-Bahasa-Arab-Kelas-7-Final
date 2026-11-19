import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Volume2,
  RotateCcw,
  Target,
  Sparkles,
  User,
  Sun,
  MapPin,
  Smile,
  School,
  Award,
  Users,
  Home,
  Utensils,
  Compass,
  Droplet,
  Maximize2,
  Headphones,
  Heart,
  BookMarked,
  Pencil,
  Ruler,
  Eraser,
  Box,
  Clock,
  Palette,
  Layers,
  Shield,
  Star,
  Calendar,
  Folder,
  Scissors,
  Building2,
  FlaskConical,
  Laptop,
  Trophy,
  Bike,
  Check,
  Briefcase,
  ArrowUp,
  ArrowDown,
  Columns,
} from 'lucide-react';
import {
  DarsDefinition,
  DarsProgressRecord,
  DarsStepId,
  EvaluationResult,
  MaharahActivityResult,
  StudentProfile,
} from '../types/elkpd';
import { calculatePredicate, playArabicFusha, stopArabicAudio } from '../utils/arabicSpeech';
import { IstimaSection } from './sections/IstimaSection';
import { KalamSection } from './sections/KalamSection';
import { QiraahSection } from './sections/QiraahSection';
import { KitabahSection } from './sections/KitabahSection';
import { MahfudzatSection } from './sections/MahfudzatSection';
import { EvaluasiSection } from './sections/EvaluasiSection';
import { RaporDarsSection } from './sections/RaporDarsSection';

interface DarsWorkspaceProps {
  student: StudentProfile;
  dars: DarsDefinition;
  record: DarsProgressRecord;
  spreadsheetConnected: boolean;
  hasNextDars: boolean;
  initialStep?: DarsStepId;
  onUpdateRecord: (updated: DarsProgressRecord) => void;
  onCompleteDars: (
    finalRecord: DarsProgressRecord
  ) => Promise<{ ok: boolean; message: string; savedMode?: 'spreadsheet' | 'local'; record?: DarsProgressRecord }>;
  onBackToDashboard: () => void;
  onGoToNextDars: () => void;
}

const STEPS: Array<{ id: DarsStepId; number: number; label: string }> = [
  { id: 'tujuan', number: 1, label: 'Tujuan Pembelajaran' },
  { id: 'materi', number: 2, label: 'Materi' },
  { id: 'mufradat', number: 3, label: 'Mufradat' },
  { id: 'istima', number: 4, label: "Istima'" },
  { id: 'kalam', number: 5, label: 'Kalam' },
  { id: 'qiraah', number: 6, label: "Qira'ah" },
  { id: 'kitabah', number: 7, label: 'Kitabah' },
  { id: 'mahfudzat', number: 8, label: 'Mahfudzat' },
  { id: 'evaluasi', number: 9, label: 'Evaluasi' },
  { id: 'rapor', number: 10, label: 'Rapor & Simpan' },
];

function renderVocabIcon(iconKey: string) {
  const cls = 'w-6 h-6 text-sky-700';
  switch (iconKey) {
    case 'hand':
    case 'smile':
      return <Smile className={cls} />;
    case 'sun':
    case 'sunset':
      return <Sun className={cls} />;
    case 'user':
    case 'boy':
    case 'girl':
      return <User className={cls} />;
    case 'idcard':
      return <Briefcase className={cls} />;
    case 'map':
      return <MapPin className={cls} />;
    case 'teacher':
    case 'users':
      return <Users className={cls} />;
    case 'award':
      return <Award className={cls} />;
    case 'home':
      return <Home className={cls} />;
    case 'school':
      return <School className={cls} />;
    case 'book':
    case 'notebook':
      return <BookMarked className={cls} />;
    case 'shield':
      return <Shield className={cls} />;
    case 'heart':
      return <Heart className={cls} />;
    case 'sparkles':
      return <Sparkles className={cls} />;
    case 'star':
      return <Star className={cls} />;
    case 'utensils':
      return <Utensils className={cls} />;
    case 'compass':
      return <Compass className={cls} />;
    case 'droplet':
      return <Droplet className={cls} />;
    case 'maximize':
      return <Maximize2 className={cls} />;
    case 'headphones':
      return <Headphones className={cls} />;
    case 'arrowUp':
      return <ArrowUp className={cls} />;
    case 'arrowDown':
      return <ArrowDown className={cls} />;
    case 'arrowRight':
      return <ArrowRight className={cls} />;
    case 'columns':
      return <Columns className={cls} />;
    case 'building':
      return <Building2 className={cls} />;
    case 'flask':
      return <FlaskConical className={cls} />;
    case 'laptop':
      return <Laptop className={cls} />;
    case 'trophy':
      return <Trophy className={cls} />;
    case 'bike':
      return <Bike className={cls} />;
    case 'layers':
      return <Layers className={cls} />;
    case 'check':
      return <Check className={cls} />;
    case 'bag':
      return <Briefcase className={cls} />;
    case 'pen':
    case 'pencil':
      return <Pencil className={cls} />;
    case 'ruler':
      return <Ruler className={cls} />;
    case 'eraser':
      return <Eraser className={cls} />;
    case 'box':
      return <Box className={cls} />;
    case 'clock':
      return <Clock className={cls} />;
    case 'palette':
      return <Palette className={cls} />;
    case 'scissors':
      return <Scissors className={cls} />;
    case 'folder':
      return <Folder className={cls} />;
    case 'calendar':
      return <Calendar className={cls} />;
    default:
      return <BookOpen className={cls} />;
  }
}

export const DarsWorkspace: React.FC<DarsWorkspaceProps> = ({
  student,
  dars,
  record,
  spreadsheetConnected,
  hasNextDars,
  initialStep,
  onUpdateRecord,
  onCompleteDars,
  onBackToDashboard,
  onGoToNextDars,
}) => {
  const [activeStep, setActiveStep] = useState<DarsStepId>(initialStep || 'tujuan');
  const [playingVocabAr, setPlayingVocabAr] = useState<string | null>(null);
  const tier = student.tier || 'LOW';
  const tierContent = dars.tiers[tier];

  useEffect(() => {
    setActiveStep(initialStep || 'tujuan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => stopArabicAudio();
  }, [dars.darsNumber, initialStep]);

  const markStepVisited = (stepId: DarsStepId, base: DarsProgressRecord = record): DarsProgressRecord => {
    const visited = base.visitedSteps.includes(stepId)
      ? base.visitedSteps
      : [...base.visitedSteps, stepId];
    return {
      ...base,
      visitedSteps: visited,
      status: base.status === 'SELESAI' ? 'SELESAI' : 'SEDANG BERLANGSUNG',
    };
  };

  const goToStep = (stepId: DarsStepId) => {
    stopArabicAudio();
    setPlayingVocabAr(null);
    setActiveStep(stepId);
    const updated = markStepVisited(stepId);
    onUpdateRecord(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentStepIdx = STEPS.findIndex((s) => s.id === activeStep);

  const isStepCompleted = (stepId: DarsStepId): boolean => {
    if (stepId === 'tujuan' || stepId === 'materi' || stepId === 'mufradat') {
      return record.visitedSteps.includes(stepId);
    }
    if (stepId === 'istima') return Boolean(record.maharah.istima?.completed);
    if (stepId === 'kalam') return Boolean(record.maharah.kalam?.completed);
    if (stepId === 'qiraah') return Boolean(record.maharah.qiraah?.completed);
    if (stepId === 'kitabah') return Boolean(record.maharah.kitabah?.completed);
    if (stepId === 'mahfudzat') return record.mahfudzatCompleted;
    if (stepId === 'evaluasi') return Boolean(record.evaluation?.completed);
    if (stepId === 'rapor') return record.status === 'SELESAI';
    return false;
  };

  const handleMaharahComplete = (
    key: 'istima' | 'kalam' | 'qiraah' | 'kitabah',
    result: MaharahActivityResult
  ) => {
    const nextMaharah = { ...record.maharah, [key]: result };
    const updated = markStepVisited(key, {
      ...record,
      maharah: nextMaharah,
    });
    onUpdateRecord(updated);
  };

  const handleMahfudzatComplete = () => {
    const updated = markStepVisited('mahfudzat', {
      ...record,
      mahfudzatCompleted: true,
    });
    onUpdateRecord(updated);
  };

  const handleEvaluationComplete = (evalResult: EvaluationResult) => {
    const s1 = record.maharah.istima?.score ?? 0;
    const s2 = record.maharah.kalam?.score ?? 0;
    const s3 = record.maharah.qiraah?.score ?? 0;
    const s4 = record.maharah.kitabah?.score ?? 0;
    const finalScore = Math.round(((s1 + s2 + s3 + s4 + evalResult.score) / 5) * 10) / 10;

    const updated = markStepVisited('evaluasi', {
      ...record,
      evaluation: evalResult,
      finalScore,
      predicate: calculatePredicate(finalScore),
    });
    onUpdateRecord(updated);
  };

  const handleSaveAndComplete = async () => {
    const s1 = record.maharah.istima?.score ?? 0;
    const s2 = record.maharah.kalam?.score ?? 0;
    const s3 = record.maharah.qiraah?.score ?? 0;
    const s4 = record.maharah.kitabah?.score ?? 0;
    const s5 = record.evaluation?.score ?? 0;
    const finalScore = Math.round(((s1 + s2 + s3 + s4 + s5) / 5) * 10) / 10;

    const payloadRecord: DarsProgressRecord = {
      ...record,
      finalScore,
      predicate: calculatePredicate(finalScore),
    };
    const res = await onCompleteDars(payloadRecord);
    if (res.ok && res.record) {
      onUpdateRecord(res.record);
    }
    return res;
  };

  const playVocabAudio = (arText: string) => {
    playArabicFusha(arText, {
      rate: 0.9,
      callbacks: {
        onStart: () => setPlayingVocabAr(arText),
        onEnd: () => setPlayingVocabAr((cur) => (cur === arText ? null : cur)),
        onError: () => setPlayingVocabAr((cur) => (cur === arText ? null : cur)),
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Dars Title */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Dars</span>
        </button>

        <div className="text-xs sm:text-sm text-slate-600">
          Dars {dars.darsNumber} · {dars.titleId} · Kelompok <strong className="text-sky-800">{tier}</strong>
        </div>
      </div>

      {/* 9 Structured Learning Steps + Rapor & Simpan */}
      <div className="no-print bg-white border border-sky-100 rounded-2xl p-3 sm:p-4 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {STEPS.map((st) => {
            const active = st.id === activeStep;
            const done = isStepCompleted(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => goToStep(st.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white'
                    : done
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                }`}
              >
                {done && !active ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="tabular-nums">{st.number}.</span>
                )}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Content */}
      <div className="min-h-[420px]">
        {/* 1. Tujuan Pembelajaran (1 operational objective per Maharah) */}
        {activeStep === 'tujuan' && (
          <div className="space-y-6">
            <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 bg-sky-50 min-h-[240px]">
                <img
                  src={dars.imageUrl}
                  alt={dars.titleId}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-between space-y-5">
                <div>
                  <p className="text-xs font-bold text-sky-700 mb-1.5">
                    Dars {dars.darsNumber} · Kelompok Kemampuan {tier}
                  </p>
                  <h2 className="font-arabic text-3xl sm:text-4xl font-bold text-sky-950 text-right" dir="rtl" lang="ar">
                    الدَّرْسُ {dars.darsNumber === 1 ? 'الأَوَّلُ' : dars.darsNumber === 2 ? 'الثَّانِي' : 'الثَّالِثُ'}:{' '}
                    {dars.titleAr}
                  </h2>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-2">{dars.titleId}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{dars.subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep('materi')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl cursor-pointer"
                  >
                    <span>Mulai Materi Pembelajaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Operational Objectives Per Maharah */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Tujuan Pembelajaran Operasional ({tier})
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Kompetensi spesifik yang dicapai pada setiap keterampilan bahasa Arab di Dars {dars.darsNumber}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'istima' as const, title: "Maharah Istima' (الِاسْتِمَاعُ)", tone: 'bg-sky-50/70 border-sky-200 text-sky-900' },
                  { key: 'kalam' as const, title: 'Maharah Kalam (الْكَلَامُ)', tone: 'bg-emerald-50/70 border-emerald-200 text-emerald-900' },
                  { key: 'qiraah' as const, title: "Maharah Qira'ah (الْقِرَاءَةُ)", tone: 'bg-amber-50/70 border-amber-200 text-amber-900' },
                  { key: 'kitabah' as const, title: 'Maharah Kitabah (الْكِتَابَةُ)', tone: 'bg-indigo-50/70 border-indigo-200 text-indigo-900' },
                ].map((m) => (
                  <div key={m.key} className={`rounded-2xl border p-4 sm:p-5 space-y-1.5 ${m.tone}`}>
                    <p className="text-xs font-extrabold uppercase tracking-wider">{m.title}</p>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {tierContent.objectivesPerMaharah[m.key]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Materi Pembelajaran */}
        {activeStep === 'materi' && (
          <div className="space-y-6">
            <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 text-sky-800 font-bold text-lg">
                <BookOpen className="w-5 h-5" />
                <span>{tierContent.materiTitle}</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{tierContent.materiSummary}</p>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <Sparkles className="w-5 h-5" />
                <span>{tierContent.grammar.title}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{tierContent.grammar.explanation}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tierContent.grammar.examples.map((ex, idx) => (
                  <div key={idx} className="bg-white border border-amber-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => playArabicFusha(ex.ar)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Dengar</span>
                      </button>
                      <p className="font-arabic text-xl font-bold text-slate-900 text-right" dir="rtl" lang="ar">
                        {ex.ar}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600">{ex.id}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Mufradat Interaktif (Kartu Kosakata Visual + Play/Replay Audio Fusha) */}
        {activeStep === 'mufradat' && (
          <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Mufradat Interaktif (<span className="font-arabic">الْمُفْرَدَاتُ</span>) — Kelompok {tier}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Pelajari setiap kosakata berharakat lengkap beserta ikon visual dan tombol suara Bahasa Arab Fusha.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tierContent.vocab.map((v) => {
                const isPlaying = playingVocabAr === v.ar;
                return (
                  <div
                    key={v.ar}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                      isPlaying
                        ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-100'
                        : 'bg-sky-50/40 border-sky-100 hover:border-sky-300'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-xl bg-white border border-sky-200 flex items-center justify-center shrink-0">
                          {renderVocabIcon(v.iconKey)}
                        </div>
                        <p className="font-arabic text-2xl font-bold text-sky-950 text-right" dir="rtl" lang="ar">
                          {v.ar}
                        </p>
                      </div>
                      <div className="pt-1 border-t border-sky-100/80">
                        <p className="text-xs font-semibold text-sky-700">{v.translit}</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{v.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => playVocabAudio(v.ar)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlaying ? 'Memutar...' : 'Dengar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => playVocabAudio(v.ar)}
                        title="Ulangi pelafalan"
                        className="inline-flex items-center justify-center p-2 bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Maharah Istima' */}
        {activeStep === 'istima' && (
          <IstimaSection
            tier={tier}
            darsImage={dars.imageUrl}
            content={tierContent.istima}
            existingResult={record.maharah.istima}
            onComplete={(res) => handleMaharahComplete('istima', res)}
          />
        )}

        {/* 5. Maharah Kalam */}
        {activeStep === 'kalam' && (
          <KalamSection
            tier={tier}
            darsNumber={dars.darsNumber}
            content={tierContent.kalam}
            existingResult={record.maharah.kalam}
            onComplete={(res) => handleMaharahComplete('kalam', res)}
          />
        )}

        {/* 6. Maharah Qira'ah */}
        {activeStep === 'qiraah' && (
          <QiraahSection
            tier={tier}
            darsImage={dars.imageUrl}
            content={tierContent.qiraah}
            existingResult={record.maharah.qiraah}
            onComplete={(res) => handleMaharahComplete('qiraah', res)}
          />
        )}

        {/* 7. Maharah Kitabah */}
        {activeStep === 'kitabah' && (
          <KitabahSection
            tier={tier}
            darsNumber={dars.darsNumber}
            content={tierContent.kitabah}
            existingResult={record.maharah.kitabah}
            onComplete={(res) => handleMaharahComplete('kitabah', res)}
          />
        )}

        {/* 8. Mahfudzat */}
        {activeStep === 'mahfudzat' && (
          <MahfudzatSection
            darsTitleId={dars.titleId}
            content={dars.mahfudzat}
            completed={record.mahfudzatCompleted}
            onComplete={handleMahfudzatComplete}
          />
        )}

        {/* 9. Evaluasi Akhir */}
        {activeStep === 'evaluasi' && (
          <EvaluasiSection
            student={student}
            darsNumber={dars.darsNumber}
            darsTitleId={dars.titleId}
            tier={tier}
            questions={tierContent.evaluasi}
            existingResult={record.evaluation}
            onComplete={handleEvaluationComplete}
          />
        )}

        {/* 10. Rapor & SIMPAN & SELESAI */}
        {activeStep === 'rapor' && (
          <RaporDarsSection
            student={student}
            darsNumber={dars.darsNumber}
            darsTitleAr={dars.titleAr}
            darsTitleId={dars.titleId}
            record={record}
            spreadsheetConnected={spreadsheetConnected}
            hasNextDars={hasNextDars}
            onSaveAndComplete={handleSaveAndComplete}
            onGoToNextDars={onGoToNextDars}
            onBackToDashboard={onBackToDashboard}
            onJumpToStep={(st) => goToStep(st)}
          />
        )}
      </div>

      {/* Bottom Step Navigation */}
      {activeStep !== 'rapor' && (
        <div className="no-print flex items-center justify-between pt-4 border-t border-sky-100">
          <button
            type="button"
            disabled={currentStepIdx <= 0}
            onClick={() => goToStep(STEPS[currentStepIdx - 1].id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tahap Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={() => goToStep(STEPS[currentStepIdx + 1].id)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            <span>Lanjut: {STEPS[currentStepIdx + 1].label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
