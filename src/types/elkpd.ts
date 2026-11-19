export type AbilityTier = 'LOW' | 'MIDDLE' | 'HIGH';

export type MaharahKey = 'istima' | 'kalam' | 'qiraah' | 'kitabah';

export type DarsStepId =
  | 'tujuan'
  | 'materi'
  | 'mufradat'
  | 'istima'
  | 'kalam'
  | 'qiraah'
  | 'kitabah'
  | 'mahfudzat'
  | 'evaluasi'
  | 'rapor';

export interface StudentProfile {
  studentId: string;
  fullName: string;
  className: string;
  absenNumber: string;
  tier: AbilityTier | null;
  loginDate: string;
}

export interface RubricCriterionScore {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface KalamExchangeLog {
  turnNumber: number;
  aiPromptAr: string;
  studentTranscriptAr: string;
  aiCorrectionId?: string;
  aiReplyAr: string;
}

export interface KitabahSubmissionLog {
  taskId: string;
  promptLabel: string;
  studentTextAr: string;
  feedbackId: string;
}

export interface MaharahActivityResult {
  completed: boolean;
  score: number; // 1-100
  rubric?: RubricCriterionScore[];
  details?: string;
  kalamLogs?: KalamExchangeLog[];
  kitabahLogs?: KitabahSubmissionLog[];
  completedAt: string;
}

export interface EvaluationQuestionReview {
  questionNumber: number;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface EvaluationResult {
  completed: boolean;
  correctCount: number;
  wrongCount: number;
  totalObjective: number;
  score: number; // 1-100
  userAnswers: Record<string, string>;
  reviews?: EvaluationQuestionReview[];
  completedAt: string;
}

export interface DarsProgressRecord {
  darsNumber: number;
  darsTitleAr: string;
  darsTitleId: string;
  visitedSteps: DarsStepId[];
  maharah: {
    istima?: MaharahActivityResult;
    kalam?: MaharahActivityResult;
    qiraah?: MaharahActivityResult;
    kitabah?: MaharahActivityResult;
  };
  mahfudzatCompleted: boolean;
  evaluation?: EvaluationResult;
  finalScore: number;
  predicate: string;
  status: 'BELUM DIMULAI' | 'SEDANG BERLANGSUNG' | 'SELESAI';
  savedToSpreadsheet: boolean;
  savedMode?: 'spreadsheet' | 'local';
  savedAt?: string;
}

export interface VocabItem {
  ar: string;
  translit: string;
  id: string;
  iconKey: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  examples: Array<{ ar: string; id: string }>;
}

export interface IstimaAudioQuestion {
  id: string;
  number: number;
  audioTextAr: string; // Spoken ONLY via audio; NEVER displayed as question text before/during answering!
  optionsAr: Array<{ id: string; textAr: string }>; // 2 for LOW, 3 for MIDDLE, 4 for HIGH
  correctOptionId: string;
  explanationId: string;
}

export interface IstimaContent {
  objectiveAr: string;
  objectiveId: string;
  instruction: string;
  // HIGH tier has a 6-turn hiwar between 2 speakers before the 5 audio-only questions
  hiwar?: {
    titleAr: string;
    titleId: string;
    speaker1Name: string;
    speaker2Name: string;
    turns: Array<{ speaker: 1 | 2; nameAr: string; textAr: string }>; // Always 6 turns (3 each)
  };
  questions: IstimaAudioQuestion[]; // Always 5 questions
}

export interface KalamContent {
  objectiveAr: string;
  objectiveId: string;
  instruction: string;
  scenarioTitle: string;
  openingAiPromptAr: string;
  openingAiPromptId: string;
  topicContextForAi: string;
  maxStudentTurns: number; // 4 turns
}

export interface QiraahContent {
  objectiveAr: string;
  objectiveId: string;
  instruction: string;
  passageTitleAr: string;
  passageTitleId: string;
  paragraphsAr: string[];
  mode: 'matching' | 'true-false' | 'mcq';
  // LOW: 5 matching pairs (Column A Arabic <-> Column B Arabic)
  matchingPairs?: Array<{
    id: string;
    colAAr: string;
    colBAr: string;
  }>;
  // MIDDLE: 5 True/False (صَحِيحٌ / خَطَأٌ) all in Arabic
  trueFalseQuestions?: Array<{
    id: string;
    statementAr: string;
    correctAnswer: 'صَحِيحٌ' | 'خَطَأٌ';
    explanationId: string;
  }>;
  // HIGH: 5 MCQ with 4 Arabic options
  mcqQuestions?: Array<{
    id: string;
    questionAr: string;
    optionsAr: Array<{ id: string; textAr: string }>;
    correctOptionId: string;
    explanationId: string;
  }>;
}

export interface KitabahTask {
  id: string;
  mode: 'picture-guided' | 'stimulus-compose' | 'picture-productive';
  instruction: string;
  imageUrl?: string;
  imageCaption?: string;
  helperVocabAr?: string[]; // 1 word for LOW, stimulus words for MIDDLE
  structureHint?: string; // Pattern hint for MIDDLE without full answer
  exampleAr?: string; // Example only for LOW if needed
  expectedAnswersAr?: string[]; // Acceptable normalized Arabic answers for LOW
  rubricTopic: string;
}

export interface KitabahContent {
  objectiveAr: string;
  objectiveId: string;
  instruction: string;
  tasks: KitabahTask[];
}

export interface MahfudzatContent {
  ar: string;
  id: string;
  moral: string;
  missingWordExercise: {
    sentenceWithBlank: string;
    missingWord: string;
    options: string[];
  };
}

export interface EvaluasiQuestion {
  id: string;
  number: number; // 1..8 (or 1..10) covering 4 maharah
  maharah: MaharahKey;
  type: 'mcq' | 'fill' | 'match' | 'reading';
  audioPromptAr?: string; // For Istima-based evaluation questions
  readingContextAr?: string;
  question: string;
  options?: Array<{ id: string; text: string }>;
  matchPairs?: Array<{ leftAr: string; rightAr: string }>;
  correctAnswer: string;
  explanation: string;
}

export interface TierDarsContent {
  objectivesPerMaharah: Record<MaharahKey, string>;
  materiTitle: string;
  materiSummary: string;
  grammar: GrammarPoint;
  vocab: VocabItem[];
  istima: IstimaContent;
  kalam: KalamContent;
  qiraah: QiraahContent;
  kitabah: KitabahContent;
  evaluasi: EvaluasiQuestion[];
}

export interface DarsDefinition {
  darsNumber: number;
  titleAr: string;
  titleId: string;
  subtitle: string;
  imageUrl: string;
  mahfudzat: MahfudzatContent;
  tiers: Record<AbilityTier, TierDarsContent>;
}
