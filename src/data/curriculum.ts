import { DARS_1 } from './dars1';
import { DARS_2 } from './dars2';
import { DARS_3 } from './dars3';
import { AbilityTier, DarsDefinition } from '../types/elkpd';

export const CURRICULUM_DARS: DarsDefinition[] = [DARS_1, DARS_2, DARS_3];

export const TIER_META: Record<
  AbilityTier,
  {
    code: AbilityTier;
    groupLabel: string;
    titleAr: string;
    titleId: string;
    tagline: string;
    description: string;
    highlights: string[];
    accentClass: string;
    softBgClass: string;
    borderClass: string;
    textClass: string;
  }
> = {
  LOW: {
    code: 'LOW',
    groupLabel: 'Kelompok 1 (LOW)',
    titleAr: 'المُسْتَوَى الْمُنْخَفِضُ',
    titleId: 'Kelompok 1 · Tingkat Dasar (LOW)',
    tagline: 'Fondasi Kosakata & Kalimat Sederhana',
    description:
      'Dirancang bertahap dengan kalimat pendek berharakat lengkap, latihan menyimak 2 pilihan, menjodohkan bacaan, dan menulis dengan bantuan gambar.',
    highlights: [
      "Istima': 5 soal audio pendek dengan 2 pilihan jawaban Arab",
      'Kalam: Dialog suara sederhana dengan asisten AI (maks. 4 giliran)',
      "Qira'ah & Kitabah: Menjodohkan 5 pasangan dan menulis terbimbing gambar",
    ],
    accentClass: 'bg-sky-600 text-white',
    softBgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-700',
  },
  MIDDLE: {
    code: 'MIDDLE',
    groupLabel: 'Kelompok 2 (MIDDLE)',
    titleAr: 'المُسْتَوَى الْمُتَوَسِّطُ',
    titleId: 'Kelompok 2 · Tingkat Menengah (MIDDLE)',
    tagline: 'Variasi Kalimat & Struktur Dialog',
    description:
      'Menghadirkan informasi audio lebih panjang, dialog tanya jawab bervariasi, soal Benar/Salah bahasa Arab, serta menyusun kalimat dari stimulus kosakata.',
    highlights: [
      "Istima': 5 soal audio informatif dengan 3 pilihan jawaban Arab",
      'Kalam: Dialog suara tanya jawab kontekstual dengan AI (maks. 4 giliran)',
      "Qira'ah & Kitabah: 5 soal صَحِيحٌ / خَطَأٌ dan menyusun kalimat berpola",
    ],
    accentClass: 'bg-emerald-600 text-white',
    softBgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-700',
  },
  HIGH: {
    code: 'HIGH',
    groupLabel: 'Kelompok 3 (HIGH)',
    titleAr: 'المُسْتَوَى الْمُرْتَفِعُ',
    titleId: 'Kelompok 3 · Tingkat Lanjut (HIGH)',
    tagline: 'Hiwar Mendalam & Produksi Bahasa Mandiri',
    description:
      'Menantang siswa menyimak hiwar 6 giliran dua penutur, berdialog aktif dengan AI, menganalisis makna tersirat, dan menulis paragraf Arab mandiri.',
    highlights: [
      "Istima': Hiwar 6 giliran (2 tokoh) + 5 soal audio 4 pilihan Arab",
      'Kalam: Percakapan suara mendalam bersama AI dengan evaluasi 5 kriteria',
      "Qira'ah & Kitabah: 5 soal pemahaman tersurat/tersirat & menulis paragraf",
    ],
    accentClass: 'bg-indigo-600 text-white',
    softBgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    textClass: 'text-indigo-700',
  },
};

export const CLASS_OPTIONS = [
  'VII A',
  'VII B',
  'VII C',
  'VII D',
  'VII E',
  'VII F',
  'VII G',
  'VII H',
  'VII I',
];
