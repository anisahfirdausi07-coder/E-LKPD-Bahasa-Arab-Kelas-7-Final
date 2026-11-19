import React, { useState } from 'react';
import { Delete, Space, Keyboard } from 'lucide-react';

interface ArabicKeyboardProps {
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
}

const ARABIC_ROWS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط', 'ذ'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'أ', 'إ'],
];

const HARAKAT_ROW = [
  { char: 'َ', label: 'فَتْحَة' },
  { char: 'ِ', label: 'كَسْرَة' },
  { char: 'ُ', label: 'ضَمَّة' },
  { char: 'ْ', label: 'سُكُون' },
  { char: 'ّ', label: 'شَدَّة' },
  { char: 'ً', label: 'تَنْوِين' },
  { char: 'ٰ', label: 'أَلِف' },
  { char: '،', label: '،' },
  { char: '؟', label: '؟' },
  { char: '.', label: '.' },
];

export const ArabicKeyboard: React.FC<ArabicKeyboardProps> = ({
  onInsert,
  onBackspace,
  onClear,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3 sm:p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
          <Keyboard className="w-4 h-4 text-sky-600" />
          <span>Papan Ketik Bahasa Arab & Harakat</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-sky-700 hover:text-sky-900 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
        >
          {expanded ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2" dir="rtl">
          {/* Harakat & punctuation row */}
          <div className="flex flex-wrap gap-1.5 justify-center pb-2 border-b border-sky-200/70">
            {HARAKAT_ROW.map((h) => (
              <button
                key={h.char}
                type="button"
                onClick={() => onInsert(h.char)}
                title={h.label}
                className="min-w-[38px] h-9 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-arabic text-lg font-semibold transition-colors active:scale-95 cursor-pointer"
              >
                {h.char === 'َ' || h.char === 'ِ' || h.char === 'ُ' || h.char === 'ْ' || h.char === 'ّ' || h.char === 'ً'
                  ? `ـ${h.char}`
                  : h.char}
              </button>
            ))}
          </div>

          {/* Letter rows */}
          {ARABIC_ROWS.map((row, idx) => (
            <div key={idx} className="flex flex-wrap gap-1.5 justify-center">
              {row.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onInsert(ch)}
                  className="min-w-[34px] sm:min-w-[40px] h-10 px-2 bg-white hover:bg-sky-100 text-slate-800 border border-sky-200 rounded-lg font-arabic text-xl font-medium shadow-2xs transition-colors active:scale-95 cursor-pointer"
                >
                  {ch}
                </button>
              ))}
            </div>
          ))}

          {/* Control row */}
          <div className="flex items-center justify-center gap-2 pt-1" dir="ltr">
            <button
              type="button"
              onClick={onBackspace}
              className="flex items-center gap-1.5 px-4 h-10 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Delete className="w-4 h-4" />
              <span>Hapus</span>
            </button>
            <button
              type="button"
              onClick={() => onInsert(' ')}
              className="flex-1 max-w-xs flex items-center justify-center gap-2 h-10 bg-white hover:bg-sky-100 text-slate-700 border border-sky-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Space className="w-4 h-4" />
              <span>Spasi (مَسَافَة)</span>
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="px-3 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Bersihkan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
