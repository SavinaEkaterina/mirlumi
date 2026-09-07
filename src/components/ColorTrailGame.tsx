import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { playSound } from '../utils/audio';

export type TrailColor = 'red' | 'yellow' | 'green' | 'blue';

export interface ColorTrailGameProps {
  soundEnabled: boolean;
  onReturnToLumiWorld: () => void;
}

interface ColorConfig {
  id: TrailColor;
  name: string;
  bgClass: string;
  borderClass: string;
  shadowClass: string;
  textClass: string;
  hex: string;
  freq: number;
}

const COLOR_CONFIGS: Record<TrailColor, ColorConfig> = {
  red: {
    id: 'red',
    name: 'Красный',
    bgClass: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    borderClass: 'border-red-600',
    shadowClass: 'shadow-red-500/40',
    textClass: 'text-red-950',
    hex: '#EF4444',
    freq: 261.63, // C4
  },
  yellow: {
    id: 'yellow',
    name: 'Жёлтый',
    bgClass: 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600',
    borderClass: 'border-amber-500',
    shadowClass: 'shadow-amber-400/40',
    textClass: 'text-amber-950',
    hex: '#EAB308',
    freq: 329.63, // E4
  },
  green: {
    id: 'green',
    name: 'Зелёный',
    bgClass: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700',
    borderClass: 'border-emerald-600',
    shadowClass: 'shadow-emerald-500/40',
    textClass: 'text-emerald-950',
    hex: '#22C55E',
    freq: 392.00, // G4
  },
  blue: {
    id: 'blue',
    name: 'Синий',
    bgClass: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    borderClass: 'border-blue-600',
    shadowClass: 'shadow-blue-500/40',
    textClass: 'text-blue-950',
    hex: '#3B82F6',
    freq: 523.25, // C5
  },
};

const ALL_COLORS: TrailColor[] = ['red', 'yellow', 'green', 'blue'];

const FOOTPRINT_ASSETS: Record<TrailColor, string> = {
  red: '/lumi/objects/footprint/lumi_footprint_red.png',
  yellow: '/lumi/objects/footprint/lumi_footprint_yellow.png',
  green: '/lumi/objects/footprint/lumi_footprint_green.png',
  blue: '/lumi/objects/footprint/lumi_footprint_blue.png',
};

// Audio synth generator for color tones
const playColorTone = (color: TrailColor, soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(COLOR_CONFIGS[color].freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
};

export const ColorTrailGame: React.FC<ColorTrailGameProps> = ({
  soundEnabled,
  onReturnToLumiWorld,
}) => {
  // Game Setup & Progression State
  const [currentLevel, setCurrentLevel] = useState<number>(1); // 1, 2, or 3
  const [currentRound, setCurrentRound] = useState<number>(1); // 1..5
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);

  // Phase State: 'showing' | 'interact' | 'success' | 'level_complete' | 'game_complete'
  const [phase, setPhase] = useState<'showing' | 'interact' | 'success' | 'level_complete' | 'game_complete'>('showing');

  // Comparison Mode State for Level 3 Hint
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [lastIncorrectPressed, setLastIncorrectPressed] = useState<TrailColor[]>([]);

  // Sequence Data
  const [sequence, setSequence] = useState<TrailColor[]>([]);
  const [dotPositions, setDotPositions] = useState<{ x: number; y: number }[]>([]);
  const [activeDotIndex, setActiveDotIndex] = useState<number | null>(null);
  const [childPressed, setChildPressed] = useState<TrailColor[]>([]);

  // Lumi UI State
  const [lumiMessage, setLumiMessage] = useState<string>('Смотри внимательно. Запомни цветной след.');
  const [lumiEmotion, setLumiEmotion] = useState<'happy' | 'thinking' | 'surprised' | 'cheering' | 'gentle'>('happy');
  const [showRestModal, setShowRestModal] = useState<boolean>(false);

  // Timers Ref
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isReverseRound = currentLevel === 3 && currentRound >= 4;

  // Compute expected target sequence
  const targetSequence = isReverseRound ? [...sequence].reverse() : sequence;

  // Helper: Generate non-overlapping random positions for level 2 & 3
  const generatePositions = useCallback((count: number, isSpatial: boolean) => {
    if (!isSpatial) {
      // Level 1: Centered horizontal line
      if (count === 2) {
        return [
          { x: 35, y: 50 },
          { x: 65, y: 50 },
        ];
      }
      return Array.from({ length: count }, (_, i) => ({
        x: 20 + (60 / (count - 1)) * i,
        y: 50,
      }));
    }

    // Spatial (Levels 2 & 3): Random positions with minimum distance
    const positions: { x: number; y: number }[] = [];
    const minDistance = 28; // percentage min distance

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let pos = { x: 50, y: 50 };
      let valid = false;

      while (!valid && attempts < 100) {
        attempts++;
        pos = {
          x: Math.floor(Math.random() * 66) + 17, // 17%..83%
          y: Math.floor(Math.random() * 56) + 22, // 22%..78%
        };

        valid = positions.every((p) => {
          const dx = p.x - pos.x;
          const dy = p.y - pos.y;
          return Math.sqrt(dx * dx + dy * dy) >= minDistance;
        });
      }

      positions.push(pos);
    }

    return positions;
  }, []);

  // Generate sequence for a new round
  const startNewRound = useCallback(
    (levelVal: number, roundVal: number, prevSeq: TrailColor[]) => {
      const length = levelVal === 1 ? 2 : levelVal === 2 ? 3 : 4;

      let newSeq: TrailColor[] = [];
      let isDuplicate = true;
      let attempts = 0;

      while (isDuplicate && attempts < 50) {
        attempts++;
        newSeq = [];
        for (let i = 0; i < length; i++) {
          const randomCol = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
          newSeq.push(randomCol);
        }

        if (prevSeq.length !== newSeq.length) {
          isDuplicate = false;
        } else {
          isDuplicate = prevSeq.every((col, idx) => col === newSeq[idx]);
        }
      }

      const isSpatial = levelVal >= 2;
      const newPos = generatePositions(length, isSpatial);

      setSequence(newSeq);
      setDotPositions(newPos);
      setChildPressed([]);
      setActiveDotIndex(null);
      setPhase('showing');
      setConsecutiveErrors(0);
      setAttemptNumber(1);
      setComparisonMode(false);
      setLastIncorrectPressed([]);
    },
    [generatePositions]
  );

  // Flash / Demonstrate sequence dots
  const playSequenceDisplay = useCallback(
    (customMsg?: string) => {
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      setActiveDotIndex(null);
      setChildPressed([]);
      setComparisonMode(false);
      setPhase('showing');

      const reverseNow = currentLevel === 3 && currentRound >= 4;

      let initMsg = customMsg || 'Смотри внимательно. Запомни цветной след.';
      if (!customMsg && reverseNow) {
        initMsg = 'А теперь наоборот.';
        setLumiEmotion('surprised');
      } else {
        setLumiEmotion('thinking');
      }

      setLumiMessage(initMsg);
      speakLumi(initMsg, { soundEnabled });

      let stepIndex = 0;

      const runStep = () => {
        if (stepIndex < sequence.length) {
          const curIndex = stepIndex;
          setActiveDotIndex(curIndex);
          playColorTone(sequence[curIndex], soundEnabled);

          sequenceTimerRef.current = setTimeout(() => {
            setActiveDotIndex(null);
            stepIndex++;
            sequenceTimerRef.current = setTimeout(runStep, 350);
          }, 900);
        } else {
          // Sequence display finished!
          setActiveDotIndex(null);
          setPhase('interact');
          setLumiEmotion('happy');

          const promptMsg = reverseNow ? 'Теперь повтори наоборот!' : 'Теперь повтори.';
          setLumiMessage(promptMsg);
          speakLumi(promptMsg, { soundEnabled });
        }
      };

      // Initial pause before starting dots display
      sequenceTimerRef.current = setTimeout(runStep, 1200);
    },
    [sequence, currentLevel, currentRound, soundEnabled]
  );

  // Initial setup when level/round changes
  useEffect(() => {
    startNewRound(currentLevel, currentRound, sequence);
    // eslint-disable-next-deps
  }, [currentLevel, currentRound]);

  // Whenever new sequence is generated, start display animation
  useEffect(() => {
    if (sequence.length > 0) {
      playSequenceDisplay();
    }
    return () => {
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      stopLumiVoice();
    };
  }, [sequence, playSequenceDisplay]);

  // Handle child clicking a color button
  const handleColorPress = (color: TrailColor) => {
    if (phase !== 'interact' || childPressed.length >= targetSequence.length) return;

    playColorTone(color, soundEnabled);

    const nextPressed = [...childPressed, color];
    setChildPressed(nextPressed);

    const currentStep = nextPressed.length - 1;

    // Check if this tap matches target
    if (nextPressed[currentStep] !== targetSequence[currentStep]) {
      // Wrong tap!
      const nextErrors = consecutiveErrors + 1;
      setConsecutiveErrors(nextErrors);

      // Offer rest modal ONLY if attemptNumber >= 3 AND nextErrors >= 3
      if (attemptNumber >= 3 && nextErrors >= 3) {
        setPhase('showing');
        setShowRestModal(true);
        const restMsg = 'Ты хорошо постарался. Давай немного отдохнём.';
        setLumiMessage(restMsg);
        setLumiEmotion('gentle');
        speakLumi(restMsg, { soundEnabled });
        return;
      }

      if (attemptNumber === 1) {
        // Attempt 1 error: Replay target sequence with hint "Посмотри ещё раз."
        setAttemptNumber(2);
        playSequenceDisplay('Посмотри ещё раз.');
        return;
      } else {
        // Attempt 2 error: Level 3 Hint (Comparison Mode: Muted target sequence vs child's last attempt)
        setPhase('showing');
        setComparisonMode(true);
        setLastIncorrectPressed(nextPressed);

        const hintMsg = 'Посмотри и сравни.';
        setLumiMessage(hintMsg);
        setLumiEmotion('gentle');
        speakLumi(hintMsg, { soundEnabled });

        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => {
          setComparisonMode(false);
          setLastIncorrectPressed([]);
          setChildPressed([]);
          setAttemptNumber((prev) => prev + 1);
          setConsecutiveErrors(0);
          setPhase('interact');
          setLumiEmotion('happy');

          const promptMsg = isReverseRound ? 'Теперь повтори наоборот!' : 'Теперь повтори.';
          setLumiMessage(promptMsg);
          speakLumi(promptMsg, { soundEnabled });
        }, 4200);
        return;
      }
    }

    // Correct tap so far! Check if completed full sequence
    if (nextPressed.length === targetSequence.length) {
      // Leave full correct trail visible for ~900ms so child sees their last correct choice
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      actionTimerRef.current = setTimeout(() => {
        setConsecutiveErrors(0);
        setAttemptNumber(1);
        setPhase('success');
        setLumiEmotion('cheering');
        playSound('correct', soundEnabled);

        actionTimerRef.current = setTimeout(() => {
          if (currentRound < 5) {
            setCurrentRound((prev) => prev + 1);
          } else {
            // Level completed!
            if (currentLevel < 3) {
              setPhase('level_complete');
              playSound('cheer', soundEnabled);
              speakLumi('Уровень пройден!', { soundEnabled });
            } else {
              setPhase('game_complete');
              playSound('cheer', soundEnabled);
              speakLumi('Ура! Игра пройдена!', { soundEnabled });
            }
          }
        }, 1200);
      }, 900);
    }
  };

  const handleNextLevel = () => {
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    stopLumiVoice();
    setCurrentLevel((prev) => prev + 1);
    setCurrentRound(1);
    setConsecutiveErrors(0);
    setAttemptNumber(1);
  };

  const handleRestartGame = () => {
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    stopLumiVoice();
    setCurrentLevel(1);
    setCurrentRound(1);
    setConsecutiveErrors(0);
    setAttemptNumber(1);
    setShowRestModal(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-3 flex flex-col items-center select-none">
      {/* Header Level & Round Bar */}
      <div className="w-full flex items-center justify-between bg-white/90 backdrop-blur-xs px-4 py-2.5 rounded-2xl border-2 border-indigo-200 shadow-sm mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐾</span>
          <span className="font-black text-indigo-950 text-sm sm:text-base">
            Цветной след
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-900 font-extrabold text-xs px-3 py-1 rounded-full border border-indigo-300">
            Уровень {currentLevel} из 3
          </span>
          <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-full border border-amber-300">
            Раунд {currentRound}/5
          </span>
        </div>
      </div>

      {/* Lumi Assistant Speech Bubble */}
      <div className="w-full mb-3">
        <LumiCharacter
          state={lumiEmotion}
          message={lumiMessage}
          autoSpeak={false}
          subText={
            isReverseRound
              ? '🔄 Обратный порядок: повтори от последнего цвета к первому!'
              : undefined
          }
        />
      </div>

      {/* Game Board (Canvas with dots) */}
      <div className="w-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-indigo-400 p-2.5 sm:p-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between box-border">
        {/* Soft starry dots background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        {/* Board Main Canvas: Dots Display Area */}
        <div className="relative w-full h-[180px] sm:h-[210px] my-2">
          {/* Render sequence dots ONLY when phase === 'showing' and activeDotIndex matches */}
          {phase === 'showing' &&
            activeDotIndex !== null &&
            activeDotIndex >= 0 &&
            sequence[activeDotIndex] &&
            (() => {
              const color = sequence[activeDotIndex];
              const pos = dotPositions[activeDotIndex] || { x: 50, y: 50 };
              return (
                <div
                  key={`dot-${activeDotIndex}-${color}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 animate-bounce flex items-center justify-center">
                    <img
                      src={FOOTPRINT_ASSETS[color]}
                      alt={COLOR_CONFIGS[color].name}
                      className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.85)] select-none"
                    />
                    <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-white/95 text-slate-900 font-black text-xs sm:text-sm w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-300">
                      {activeDotIndex + 1}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* Success Overlay Flash */}
          {phase === 'success' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80 backdrop-blur-xs rounded-2xl z-20"
            >
              <div className="text-5xl sm:text-6xl animate-bounce mb-2">🌟</div>
              <span className="text-amber-300 font-black text-2xl sm:text-3xl drop-shadow-lg">
                Отлично!
              </span>
            </motion.div>
          )}

          {/* Comparison Mode Overlay (Level 3 Hint) */}
          {comparisonMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 z-30 px-2 py-1 pointer-events-none bg-slate-950/85 backdrop-blur-xs rounded-2xl">
              {/* Correct Target Sequence (Muted / Semi-transparent) */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-amber-200/90 font-extrabold text-xs sm:text-sm uppercase tracking-wide drop-shadow-sm">
                  Правильный след:
                </span>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {targetSequence.map((color, idx) => (
                    <div key={`comp-target-${idx}-${color}`} className="flex items-center gap-1 sm:gap-2">
                      <div className="relative w-11 h-11 sm:w-14 sm:h-14 opacity-70 flex items-center justify-center">
                        <img
                          src={FOOTPRINT_ASSETS[color]}
                          alt={COLOR_CONFIGS[color].name}
                          className="w-full h-full object-contain select-none filter drop-shadow-md"
                        />
                        <span className="absolute -top-1 -right-1 bg-white/90 text-slate-900 font-black text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow border border-indigo-200">
                          {idx + 1}
                        </span>
                      </div>
                      {idx < targetSequence.length - 1 && (
                        <span className="text-white/40 font-bold text-xs sm:text-sm">➔</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="w-4/5 border-b border-white/15 my-0.5" />

              {/* Child's Last Pressed Attempt (Bright) */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-sky-300 font-extrabold text-xs sm:text-sm uppercase tracking-wide drop-shadow-sm">
                  Твой след:
                </span>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {lastIncorrectPressed.map((color, idx) => (
                    <div key={`comp-child-${idx}-${color}`} className="flex items-center gap-1 sm:gap-2">
                      <div className="relative w-12 h-12 sm:w-15 sm:h-15 flex items-center justify-center">
                        <img
                          src={FOOTPRINT_ASSETS[color]}
                          alt={COLOR_CONFIGS[color].name}
                          className="w-full h-full object-contain select-none filter drop-shadow-lg"
                        />
                        <span className="absolute -top-1 -right-1 bg-white text-slate-900 font-black text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow border border-indigo-200">
                          {idx + 1}
                        </span>
                      </div>
                      {idx < lastIncorrectPressed.length - 1 && (
                        <span className="text-white/80 font-bold text-xs sm:text-sm">➔</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render child's pressed sequence trail during 'interact' or 'success' phase */}
          {(phase === 'interact' || phase === 'success') && childPressed.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-4 pointer-events-none z-10 px-4">
              {childPressed.map((color, idx) => (
                <div key={`child-press-${idx}-${color}`} className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
                  >
                    <img
                      src={FOOTPRINT_ASSETS[color]}
                      alt={COLOR_CONFIGS[color].name}
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none"
                    />
                    <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-white/95 text-slate-900 font-black text-xs sm:text-sm w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md border border-indigo-200">
                      {idx + 1}
                    </span>
                  </motion.div>
                  {idx < childPressed.length - 1 && (
                    <span className="text-white/80 font-black text-xl sm:text-2xl animate-pulse">
                      ➔
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls Area: 4 Large Color Buttons */}
      <div className="w-full mt-4 flex flex-col items-center">
        <div className="text-center font-extrabold text-xs sm:text-sm text-slate-600 mb-2">
          {phase === 'showing'
            ? '👀 Наблюдай за цветным следом...'
            : '👇 Нажми цвета в нужном порядке:'}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
          {ALL_COLORS.map((color) => {
            const cfg = COLOR_CONFIGS[color];
            const isDisabled = phase !== 'interact';

            return (
              <motion.button
                key={color}
                whileHover={isDisabled ? {} : { scale: 1.05 }}
                whileTap={isDisabled ? {} : { scale: 0.92 }}
                disabled={isDisabled}
                onClick={() => handleColorPress(color)}
                className={`py-4 sm:py-5 px-3 rounded-3xl border-b-4 font-black text-lg sm:text-xl text-white shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  cfg.bgClass
                } ${cfg.borderClass} ${cfg.shadowClass} ${
                  isDisabled ? 'opacity-60 cursor-not-allowed border-b-2' : ''
                }`}
              >
                <img
                  src={FOOTPRINT_ASSETS[color]}
                  alt={cfg.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain filter drop-shadow-md select-none"
                />
                <span>{cfg.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modal: Level Complete */}
      <AnimatePresence>
        {phase === 'level_complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-indigo-400 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-3 animate-bounce">🌟</div>
              <h2 className="font-black text-2xl sm:text-3xl text-indigo-950 mb-2">
                Уровень пройден!
              </h2>
              <p className="text-slate-600 font-medium text-sm sm:text-base mb-6">
                Ты отлично запомнил все цветные следы! Попробуем следующий уровень?
              </p>
              <button
                onClick={handleNextLevel}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-2xl shadow-lg border-2 border-indigo-700 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>ПРОДОЛЖИТЬ</span>
                <span className="text-xl">➔</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Game Complete (All 3 Levels Finished) */}
      <AnimatePresence>
        {phase === 'game_complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-3 animate-bounce">🎉 🐾 🎉</div>
              <h2 className="font-black text-2xl sm:text-3xl text-amber-950 mb-2">
                Игра пройдена!
              </h2>
              <p className="text-slate-600 font-medium text-sm sm:text-base mb-6">
                Ура! Ты настоящей мастер цветных следов!
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRestartGame}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-lg py-3.5 rounded-2xl shadow-lg border-2 border-amber-600 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>СЫГРАТЬ ЕЩЁ РАЗ</span>
                </button>

                <button
                  onClick={onReturnToLumiWorld}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-3.5 rounded-2xl shadow-lg border-2 border-indigo-700 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>🌍</span>
                  <span>В МИР ЛУМИ</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Rest Break (After 3 consecutive errors) */}
      <AnimatePresence>
        {showRestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-3 animate-pulse">🌿</div>
              <h2 className="font-black text-2xl sm:text-3xl text-amber-950 mb-2">
                Сделаем перерыв?
              </h2>
              <p className="text-slate-600 font-medium text-sm mb-6">
                Ты хорошо постарался! Давай немного отдохнём и вернёмся в Мир Луми.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowRestModal(false);
                    stopLumiVoice();
                    onReturnToLumiWorld();
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-lg py-3.5 rounded-2xl shadow-lg border-2 border-amber-600 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>🌍</span>
                  <span>ПОЙТИ В МИР ЛУМИ</span>
                </button>

                <button
                  onClick={() => {
                    setShowRestModal(false);
                    setConsecutiveErrors(0);
                    setAttemptNumber(1);
                    playSequenceDisplay();
                  }}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-base py-3 rounded-2xl border border-stone-300 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>Попробовать ещё раз</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
