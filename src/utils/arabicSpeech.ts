// Client-side Arabic Fusha Audio Engine (Web Speech API) + Harakat-tolerant Arabic normalization

export function normalizeArabic(input: string, stripHarakat = true): string {
  let out = input;
  if (stripHarakat) {
    out = out.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  }
  return out
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[؟،؛.!?,;:"'()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeArabicStrictLetters(input: string): string {
  // Keeps exact letters (differentiating ه vs ة) while tolerating harakat differences!
  return input
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[؟،؛.!?,;:"'()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculatePredicate(score: number): string {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 80) return 'Baik';
  if (score >= 70) return 'Cukup';
  return 'Perlu Bimbingan';
}

export interface AudioPlayCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

let activeAudioEl: HTMLAudioElement | null = null;
let activeSequenceCancelled = false;

export function stopArabicAudio(): void {
  activeSequenceCancelled = true;
  if (activeAudioEl) {
    activeAudioEl.pause();
    activeAudioEl.currentTime = 0;
    activeAudioEl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function pauseArabicAudio(): void {
  if (activeAudioEl && !activeAudioEl.paused) {
    activeAudioEl.pause();
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

export function resumeArabicAudio(): boolean {
  if (activeAudioEl && activeAudioEl.paused && activeAudioEl.src) {
    activeAudioEl.play().catch(() => {});
    return true;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    return true;
  }
  return false;
}

function speakSingleUtterance(
  text: string,
  rate = 0.88,
  pitch = 1.0
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const arVoice =
      voices.find((v) => v.lang.toLowerCase() === 'ar-sa') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
    if (arVoice) utterance.voice = arVoice;
    utterance.lang = arVoice?.lang || 'ar-SA';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export async function playArabicFusha(
  text: string,
  options?: { rate?: number; style?: string; callbacks?: AudioPlayCallbacks }
): Promise<void> {
  stopArabicAudio();
  activeSequenceCancelled = false;
  const cb = options?.callbacks;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    cb?.onError?.('Pemutar suara tidak tersedia di browser ini.');
    cb?.onEnd?.();
    return;
  }

  cb?.onStart?.();
  await speakSingleUtterance(text, options?.rate ?? 0.88, 1.0);
  if (!activeSequenceCancelled) {
    cb?.onEnd?.();
  }
}

export async function playMultiSpeakerArabicHiwar(
  turns: Array<{ speaker: 1 | 2; nameAr: string; textAr: string }>,
  _speaker1Name: string,
  _speaker2Name: string,
  options?: { rate?: number; callbacks?: AudioPlayCallbacks }
): Promise<void> {
  stopArabicAudio();
  activeSequenceCancelled = false;
  const cb = options?.callbacks;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    cb?.onError?.('Pemutar suara tidak tersedia di browser ini.');
    cb?.onEnd?.();
    return;
  }

  cb?.onStart?.();
  for (const turn of turns) {
    if (activeSequenceCancelled) break;
    const pitch = turn.speaker === 1 ? 0.94 : 1.12;
    await speakSingleUtterance(turn.textAr, options?.rate ?? 0.88, pitch);
  }
  if (!activeSequenceCancelled) {
    cb?.onEnd?.();
  }
}

export function playBase64WavAudio(
  base64: string,
  mimeType = 'audio/wav',
  callbacks?: AudioPlayCallbacks
): void {
  stopArabicAudio();
  try {
    const audio = new Audio(`data:${mimeType};base64,${base64}`);
    activeAudioEl = audio;
    callbacks?.onStart?.();
    audio.onended = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      callbacks?.onEnd?.();
    };
    audio.onerror = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      callbacks?.onEnd?.();
    };
    audio.play().catch(() => callbacks?.onEnd?.());
  } catch {
    callbacks?.onEnd?.();
  }
}

export function playFeedbackTone(isSuccess: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = isSuccess ? 'sine' : 'triangle';
    const now = ctx.currentTime;
    if (isSuccess) {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.setValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Ignore
  }
}
