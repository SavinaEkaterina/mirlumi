import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StimulusColor, RuleMapping } from '../types';

interface TrafficLightProps {
  currentColor: StimulusColor | null;
  isBroken?: boolean;
  showYellowLight?: boolean;
  activeRule?: RuleMapping;
  showRuleAnchors?: boolean;
  isDemo?: boolean;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({
  currentColor,
  isBroken = false,
  showYellowLight = false,
  activeRule,
  showRuleAnchors = false,
  isDemo = false,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center my-2 sm:my-3 max-w-full">
      {/* Broken light alert badge */}
      <AnimatePresence>
        {isBroken && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: [1, 1.08, 1], opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute -top-6 bg-red-500 text-white font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full shadow-lg border-2 border-yellow-300 z-30 flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>СВЕТОФОР СЛОМАЛСЯ!</span>
            <span>⚡</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Traffic Light Clean Image Container (No grey card background) */}
      <div className="relative inline-flex items-center justify-center select-none">
        {/* Main 3D WebP Asset Image */}
        <motion.img
          src="/lumi/special/lumi_traffic_light.webp"
          alt="Светофор 3D"
          className="w-auto h-56 xs:h-64 sm:h-80 md:h-96 max-w-full object-contain drop-shadow-xl pointer-events-none"
          animate={
            isBroken
              ? { rotate: [-2, 2, -2], x: [-1, 1, -1] }
              : currentColor
              ? { scale: [1, 1.015, 1] }
              : { scale: 1 }
          }
          transition={
            isBroken
              ? { repeat: Infinity, duration: 0.25 }
              : currentColor
              ? { repeat: Infinity, duration: 1.2 }
              : { duration: 0.3 }
          }
        />

        {/* Luminous Signal Lamp Overlays Fitted Precisely Inside Lamp Windows */}
        <div className="absolute inset-0 pointer-events-none">
          {/* TOP (RED) LAMP SIGNAL */}
          <div className="absolute top-[22.5%] left-[46.8%] -translate-x-1/2 -translate-y-1/2 w-[9.8%] aspect-square flex items-center justify-center">
            {currentColor === 'red' && (
              <>
                {/* Soft outer halo */}
                <motion.div
                  initial={{ opacity: 0.4, scale: 0.95 }}
                  animate={{ opacity: [0.4, 0.65, 0.4], scale: [0.98, 1.12, 0.98] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 rounded-full bg-red-500/35 blur-[3px]"
                />
                {/* Fitted core glass lens glow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.98)_0%,_rgba(239,68,68,1)_50%,_rgba(239,68,68,0.85)_80%,_rgba(239,68,68,0)_100%)] shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                />
              </>
            )}
            {showRuleAnchors && activeRule?.red && (
              <span className="absolute bg-slate-900/95 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-red-400 whitespace-nowrap shadow-lg z-10">
                {activeRule.red === 'GO' ? '🚶 ИДИ' : '✋ СТОП'}
              </span>
            )}
          </div>

          {/* MIDDLE (YELLOW) LAMP SIGNAL */}
          {showYellowLight && (
            <div className="absolute top-[39.5%] left-[46.8%] -translate-x-1/2 -translate-y-1/2 w-[9.8%] aspect-square flex items-center justify-center">
              {currentColor === 'yellow' && (
                <>
                  {/* Soft outer halo */}
                  <motion.div
                    initial={{ opacity: 0.4, scale: 0.95 }}
                    animate={{ opacity: [0.4, 0.65, 0.4], scale: [0.98, 1.12, 0.98] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute inset-0 rounded-full bg-amber-400/35 blur-[3px]"
                  />
                  {/* Fitted core glass lens glow */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.98)_0%,_rgba(245,158,11,1)_50%,_rgba(245,158,11,0.85)_80%,_rgba(245,158,11,0)_100%)] shadow-[0_0_10px_rgba(245,158,11,0.9)]"
                  />
                </>
              )}
              {showRuleAnchors && activeRule?.yellow && (
                <span className="absolute bg-slate-900/95 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-amber-400 whitespace-nowrap shadow-lg z-10">
                  👏 ХЛОПНИ
                </span>
              )}
            </div>
          )}

          {/* BOTTOM (GREEN) LAMP SIGNAL */}
          <div className="absolute top-[56.5%] left-[46.8%] -translate-x-1/2 -translate-y-1/2 w-[9.8%] aspect-square flex items-center justify-center">
            {currentColor === 'green' && (
              <>
                {/* Soft outer halo */}
                <motion.div
                  initial={{ opacity: 0.4, scale: 0.95 }}
                  animate={{ opacity: [0.4, 0.65, 0.4], scale: [0.98, 1.12, 0.98] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 rounded-full bg-emerald-500/35 blur-[3px]"
                />
                {/* Fitted core glass lens glow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.98)_0%,_rgba(16,185,129,1)_50%,_rgba(16,185,129,0.85)_80%,_rgba(16,185,129,0)_100%)] shadow-[0_0_10px_rgba(16,185,129,0.9)]"
                />
              </>
            )}
            {showRuleAnchors && activeRule?.green && (
              <span className="absolute bg-slate-900/95 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-emerald-400 whitespace-nowrap shadow-lg z-10">
                {activeRule.green === 'GO' ? '🚶 ИДИ' : '✋ СТОП'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isDemo && (
        <span className="mt-3 bg-emerald-100 text-emerald-900 font-semibold text-xs px-3 py-1 rounded-full border border-emerald-300">
          👀 Демонстрация правила
        </span>
      )}
    </div>
  );
};
