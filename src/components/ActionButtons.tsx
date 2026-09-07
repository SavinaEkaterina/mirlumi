import React from 'react';
import { motion } from 'motion/react';
import { ActionType } from '../types';

interface ActionButtonsProps {
  onAction: (action: ActionType) => void;
  showClapButton?: boolean;
  disabled?: boolean;
  highlightedAction?: ActionType | null;
  wrongActionSelected?: ActionType | null;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAction,
  showClapButton = false,
  disabled = false,
  highlightedAction = null,
  wrongActionSelected = null,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto my-2 sm:my-4 px-2">
      <div
        className={`grid gap-2.5 sm:gap-4 ${
          showClapButton ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {/* BUTTON 1: ИДИ (GO) */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.03 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          animate={
            wrongActionSelected === 'GO'
              ? { x: [-8, 8, -6, 6, 0] }
              : highlightedAction === 'GO'
              ? { scale: [1, 1.06, 1] }
              : {}
          }
          onClick={() => !disabled && onAction('GO')}
          disabled={disabled}
          className={`relative py-3.5 sm:py-7 px-2 sm:px-4 rounded-2xl sm:rounded-3xl font-black text-lg xs:text-xl sm:text-3xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 transition-all shadow-md select-none cursor-pointer border-3 sm:border-4 min-h-[60px] sm:min-h-[84px] ${
            wrongActionSelected === 'GO'
              ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-rose-200 ring-4 ring-rose-400'
              : highlightedAction === 'GO'
              ? 'bg-emerald-400 border-emerald-600 text-emerald-950 shadow-emerald-300 ring-4 ring-emerald-300'
              : 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-emerald-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {/* Walking Icon SVG */}
          <svg className="w-7 h-7 sm:w-12 sm:h-12 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
          </svg>
          <span className="tracking-wide text-center">ИДИ</span>

          {wrongActionSelected === 'GO' && (
            <span className="absolute -top-3 bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              Ещё раз!
            </span>
          )}
        </motion.button>

        {/* BUTTON 2: СТОП (STOP) */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.03 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          animate={
            wrongActionSelected === 'STOP'
              ? { x: [-8, 8, -6, 6, 0] }
              : highlightedAction === 'STOP'
              ? { scale: [1, 1.06, 1] }
              : {}
          }
          onClick={() => !disabled && onAction('STOP')}
          disabled={disabled}
          className={`relative py-3.5 sm:py-7 px-2 sm:px-4 rounded-2xl sm:rounded-3xl font-black text-lg xs:text-xl sm:text-3xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 transition-all shadow-md select-none cursor-pointer border-3 sm:border-4 min-h-[60px] sm:min-h-[84px] ${
            wrongActionSelected === 'STOP'
              ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-rose-200 ring-4 ring-rose-400'
              : highlightedAction === 'STOP'
              ? 'bg-red-400 border-red-600 text-red-950 shadow-red-300 ring-4 ring-red-300'
              : 'bg-red-500 border-red-600 text-white hover:bg-red-600 active:bg-red-700 shadow-red-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {/* Stop Hand Icon SVG */}
          <svg className="w-7 h-7 sm:w-12 sm:h-12 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          <span className="tracking-wide text-center">СТОП</span>

          {wrongActionSelected === 'STOP' && (
            <span className="absolute -top-3 bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              Ещё раз!
            </span>
          )}
        </motion.button>

        {/* BUTTON 3: ХЛОПНИ (CLAP) - Optional for Level 3 */}
        {showClapButton && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: disabled ? 1 : 1.03 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => !disabled && onAction('CLAP')}
            disabled={disabled}
            className={`relative py-3.5 sm:py-7 px-2 sm:px-4 rounded-2xl sm:rounded-3xl font-black text-lg xs:text-xl sm:text-3xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 transition-all shadow-md select-none cursor-pointer border-3 sm:border-4 min-h-[60px] sm:min-h-[84px] ${
              wrongActionSelected === 'CLAP'
                ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-rose-200 ring-4 ring-rose-400'
                : highlightedAction === 'CLAP'
                ? 'bg-amber-300 border-amber-500 text-amber-950 shadow-amber-300 ring-4 ring-amber-300'
                : 'bg-amber-400 border-amber-500 text-amber-950 hover:bg-amber-500 active:bg-amber-600 shadow-amber-200'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* Clapping Hands Icon SVG */}
            <svg className="w-7 h-7 sm:w-12 sm:h-12 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-2h2zm0-4h-2V7h2z" />
            </svg>
            <span className="tracking-wide text-center">ХЛОП</span>

            {wrongActionSelected === 'CLAP' && (
              <span className="absolute -top-3 bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                Ещё раз!
              </span>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};
