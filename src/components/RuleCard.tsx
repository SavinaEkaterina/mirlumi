import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { RuleMapping } from '../types';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';

interface RuleCardProps {
  rule: RuleMapping;
  title?: string;
  isHint?: boolean;
  onClose?: () => void;
  showClapRule?: boolean;
  soundEnabled?: boolean;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  title = 'Правило светофора',
  isHint = false,
  onClose,
  showClapRule = false,
  soundEnabled = true,
}) => {
  // Voice big card contents upon mount
  useEffect(() => {
    const greenAction = rule.green === 'GO' ? 'иди' : 'стоп';
    const redAction = rule.red === 'GO' ? 'иди' : 'стоп';
    
    let spokenText = `Посмотри! Зелёный — ${greenAction}. Красный — ${redAction}.`;
    if (showClapRule || rule.yellow) {
      spokenText += ' Жёлтый — хлопни.';
    }

    speakLumi(spokenText, { soundEnabled, force: true, speechKey: 'rule_card_' + spokenText });

    return () => {
      stopLumiVoice();
    };
  }, [rule, showClapRule, soundEnabled]);

  const handleClose = () => {
    // Voice prompt after closing card (Section 6.3 & 17)
    speakLumi('Запомнил? Давай попробуем.', { soundEnabled, force: true });
    if (onClose) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 10 }}
      className={`p-4 sm:p-5 rounded-2xl shadow-lg border-2 max-w-md mx-auto my-3 text-center ${
        isHint
          ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400'
          : 'bg-white border-amber-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 pb-2">
        <h3 className="text-amber-950 font-bold text-lg sm:text-xl flex items-center gap-2">
          <span>{isHint ? '💡 Подсказка Луми' : '📌 ' + title}</span>
        </h3>
        {onClose && (
          <button
            onClick={handleClose}
            className="text-amber-800 hover:text-amber-950 font-bold text-sm bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Понятно!</span>
            <span>➔</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* GREEN MAPPING */}
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 shadow-xs inline-block border-2 border-emerald-300" />
            <span className="text-emerald-950">Зелёный</span>
          </div>
          <span className="text-amber-800 font-black">➔</span>
          <div className="flex items-center gap-1.5 bg-emerald-200 text-emerald-950 px-3 py-1 rounded-lg">
            <span>{rule.green === 'GO' ? '🚶 ИДИ' : '✋ СТОП'}</span>
          </div>
        </div>

        {/* RED MAPPING */}
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-bold text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 shadow-xs inline-block border-2 border-red-300" />
            <span className="text-rose-950">Красный</span>
          </div>
          <span className="text-amber-800 font-black">➔</span>
          <div className="flex items-center gap-1.5 bg-rose-200 text-rose-950 px-3 py-1 rounded-lg">
            <span>{rule.red === 'GO' ? '🚶 ИДИ' : '✋ СТОП'}</span>
          </div>
        </div>

        {/* YELLOW MAPPING (Optional) */}
        {(showClapRule || rule.yellow) && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-300 p-2.5 rounded-xl font-bold text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 shadow-xs inline-block border-2 border-amber-200" />
              <span className="text-amber-950">Жёлтый</span>
            </div>
            <span className="text-amber-800 font-black">➔</span>
            <div className="flex items-center gap-1.5 bg-amber-200 text-amber-950 px-3 py-1 rounded-lg">
              <span>👏 ХЛОПНИ</span>
            </div>
          </div>
        )}
      </div>

      {onClose && (
        <div className="mt-4">
          <button
            onClick={handleClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-lg py-3 rounded-xl shadow-md border-2 border-emerald-600 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ПОНЯТНО! НАЧАТЬ</span>
            <span>➔</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};
