import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StimulusColor, ActionType } from '../types';
import { LumiAsset } from './LumiAsset';

interface CarTrafficSceneProps {
  currentColor: StimulusColor | null;
  lastActionEffect: {
    color: StimulusColor;
    action: ActionType;
    message: string;
  } | null;
  completedColors: StimulusColor[];
  repairStepCount: number; // 0 to 9 correct steps
  repairCycle: number;     // 1, 2, or 3
}

export const CarTrafficScene: React.FC<CarTrafficSceneProps> = ({
  currentColor,
  lastActionEffect,
  completedColors,
  repairStepCount,
  repairCycle,
}) => {
  // Calculate car position percentage across the road based on step count (0 to 9)
  const getCarLeftPercent = (step: number) => {
    switch (step) {
      case 0:
        return '4%'; // Initial start
      case 1:
        return '24%'; // Cycle 1: GO completed
      case 2:
        return '24%'; // Cycle 1: STOP completed
      case 3:
        return '24%'; // Cycle 1: CLAP completed
      case 4:
        return '48%'; // Cycle 2: GO completed
      case 5:
        return '48%'; // Cycle 2: STOP completed
      case 6:
        return '48%'; // Cycle 2: CLAP completed
      case 7:
        return '72%'; // Cycle 3: GO completed (before stop line at 78%)
      case 8:
        return '72%'; // Cycle 3: STOP completed (stopped before stop line)
      case 9:
      default:
        return '90%'; // Cycle 3: CLAP completed / Finale drive-through
    }
  };

  const isCarMoving =
    lastActionEffect?.action === 'GO' ||
    (repairStepCount === 9 && lastActionEffect?.action === 'CLAP');

  const isCarStopped =
    lastActionEffect?.action === 'STOP' ||
    currentColor === 'red' ||
    [2, 3, 5, 6, 8].includes(repairStepCount);

  const isFinished = repairStepCount >= 9;

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-800/90 border-2 sm:border-4 border-slate-700 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 my-2 sm:my-3 text-white shadow-xl relative overflow-hidden box-border">
      {/* Scene Header Badge */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
        <span className="text-amber-300 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
          <span>🛠️</span>
          <span>Проверка светофора</span>
        </span>

        {/* 3 Full Cycles Progress Badges */}
        <div className="flex gap-1.5 items-center">
          {[1, 2, 3].map((cycleNum) => {
            const isCycleComplete = repairStepCount >= cycleNum * 3;
            const isCycleActive = repairCycle === cycleNum && !isCycleComplete;

            return (
              <div
                key={cycleNum}
                className={`text-xs px-2 py-0.5 rounded-full font-extrabold border transition-all flex items-center gap-1 ${
                  isCycleComplete
                    ? 'bg-emerald-500 border-emerald-300 text-white shadow-sm'
                    : isCycleActive
                    ? 'bg-amber-400 border-amber-200 text-slate-950 animate-pulse ring-2 ring-amber-300'
                    : 'bg-slate-700 border-slate-600 text-slate-400'
                }`}
              >
                <span>Цикл {cycleNum}</span>
                {isCycleComplete && <span>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Physical Effect Message Banner */}
      <AnimatePresence mode="wait">
        {lastActionEffect ? (
          <motion.div
            key={lastActionEffect.message}
            initial={{ scale: 0.85, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className={`p-2.5 rounded-2xl text-center font-black text-sm sm:text-base shadow-lg my-1 border-2 ${
              lastActionEffect.action === 'GO'
                ? 'bg-emerald-500/90 border-emerald-300 text-white'
                : lastActionEffect.action === 'STOP'
                ? 'bg-red-500/90 border-red-300 text-white'
                : 'bg-amber-400 border-amber-200 text-slate-950'
            }`}
          >
            {lastActionEffect.message}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-2 text-center text-xs sm:text-sm text-slate-300 font-medium"
          >
            Смотри на сигнал светофора и нажимай нужную кнопку!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartoon Road Canvas */}
      <div className="relative h-28 bg-slate-900 rounded-2xl mt-3 overflow-hidden border-2 border-slate-700 flex items-end px-3 pb-3">
        {/* Road Asphalt texture & markings */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-slate-950 border-t-2 border-slate-700" />
        
        {/* Road Lane Center Lines */}
        <div className="absolute bottom-8 left-0 right-0 h-1 border-b-2 border-dashed border-amber-300/40" />

        {/* Traffic Light Stop Line (White Solid) */}
        <div className="absolute bottom-0 top-12 right-20 w-3 bg-white/90 border-r border-slate-400 z-0 shadow-sm" />

        {/* Traffic Light Post Graphic on Roadside using approved 3D Lumi asset */}
        <div className="absolute bottom-12 right-12 flex flex-col items-center pointer-events-none z-10">
          <img
            src="/lumi/special/lumi_traffic_light.webp"
            alt="Светофор"
            className={`h-16 w-auto object-contain transition-all duration-300 select-none ${
              currentColor === 'red'
                ? 'drop-shadow-[0_0_12px_rgba(239,68,68,1)]'
                : currentColor === 'yellow'
                ? 'drop-shadow-[0_0_12px_rgba(245,158,11,1)]'
                : currentColor === 'green'
                ? 'drop-shadow-[0_0_12px_rgba(16,185,129,1)]'
                : 'drop-shadow-md'
            }`}
          />
        </div>

        {/* Single Continuous Cartoon Car Component */}
        <motion.div
          className="absolute bottom-2 text-4xl sm:text-5xl z-20 pointer-events-none flex items-center"
          animate={{ left: getCarLeftPercent(repairStepCount) }}
          transition={{
            duration: isCarMoving ? 1.2 : 0.4,
            ease: 'easeInOut',
          }}
        >
          <div className="-scale-x-100 flex items-center justify-center">
            <LumiAsset type="car" color="red" size="medium" className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>

          {/* Speed Exhaust Animation when Moving */}
          {isCarMoving && (
            <motion.span
              animate={{ opacity: [1, 0], x: [-5, -15] }}
              transition={{ repeat: Infinity, duration: 0.25 }}
              className="absolute -left-5 bottom-2 text-sm"
            >
              💨
            </motion.span>
          )}

          {/* Red STOP Indicator Badge when Stopped */}
          {isCarStopped && !isCarMoving && (
            <motion.span
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: [1, 1.1, 1], y: -20 }}
              className="absolute -top-3 left-0 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md border border-white shadow-md uppercase tracking-wider whitespace-nowrap"
            >
              СТОП 🛑
            </motion.span>
          )}
        </motion.div>

        {/* Lumi Clapping Emoji Feedback on Yellow Light */}
        {lastActionEffect?.action === 'CLAP' && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: [1, 1.3, 1], y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute right-4 top-2 text-3xl z-30 pointer-events-none drop-shadow-md"
          >
            👏✨
          </motion.div>
        )}

        {/* Celebration Sparkles when 3 Cycles are Complete */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.2, 0.9] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 bg-amber-400/20 border-2 border-amber-300 rounded-2xl pointer-events-none z-30 flex items-center justify-center text-4xl"
          >
            🎉✨🚦
          </motion.div>
        )}
      </div>
    </div>
  );
};

