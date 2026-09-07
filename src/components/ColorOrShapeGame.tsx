import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { playSound } from '../utils/audio';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';

interface ColorOrShapeGameProps {
  onBackToWorld: () => void;
  soundEnabled?: boolean;
}

type ShapeType = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star';
type ColorType = 'red' | 'yellow' | 'green' | 'blue';
type RuleType = 'COLOR' | 'SHAPE';
type SignalType = 'BELL' | 'DRUM';

interface GameObject {
  id: string;
  shape: ShapeType;
  color: ColorType;
  isSelected: boolean;
  isTarget: boolean;
}

const COLOR_CONFIG: Record<ColorType, { nameSingular: string; namePlural: string; fill: string; stroke: string; borderClass: string; bgClass: string }> = {
  red: {
    nameSingular: 'красный',
    namePlural: 'красные',
    fill: '#ef4444',
    stroke: '#b91c1c',
    borderClass: 'border-red-500',
    bgClass: 'bg-red-50 text-red-700',
  },
  yellow: {
    nameSingular: 'жёлтый',
    namePlural: 'жёлтые',
    fill: '#eab308',
    stroke: '#a16207',
    borderClass: 'border-yellow-500',
    bgClass: 'bg-yellow-50 text-yellow-700',
  },
  green: {
    nameSingular: 'зелёный',
    namePlural: 'зелёные',
    fill: '#22c55e',
    stroke: '#15803d',
    borderClass: 'border-green-500',
    bgClass: 'bg-green-50 text-green-700',
  },
  blue: {
    nameSingular: 'синий',
    namePlural: 'синие',
    fill: '#3b82f6',
    stroke: '#1d4ed8',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-50 text-blue-700',
  },
};

const SHAPE_CONFIG: Record<ShapeType, { nameSingular: string; namePlural: string }> = {
  circle: { nameSingular: 'круг', namePlural: 'круги' },
  square: { nameSingular: 'квадрат', namePlural: 'квадраты' },
  triangle: { nameSingular: 'треугольник', namePlural: 'треугольники' },
  rectangle: { nameSingular: 'прямоугольник', namePlural: 'прямоугольники' },
  star: { nameSingular: 'звезда', namePlural: 'звёзды' },
};

import { LumiAsset } from './LumiAsset';

// SVG Shape Component connected to LumiAsset Registry
const ShapeSVG: React.FC<{ shape: ShapeType; color: ColorType; size?: number }> = ({
  shape,
  color,
  size = 72,
}) => {
  return <LumiAsset type={shape} color={color} size="large" className="w-14 h-14 sm:w-20 sm:h-20" />;
};

export const ColorOrShapeGame: React.FC<ColorOrShapeGameProps> = ({
  onBackToWorld,
  soundEnabled = true,
}) => {
  // Game Navigation & Progress State
  const [currentLevel, setCurrentLevel] = useState<number>(1); // 1, 2, 3
  const [currentRound, setCurrentRound] = useState<number>(1); // Level 1: 1..5, Level 2: 1..5, Level 3: 1..6
  const [phase, setPhase] = useState<'playing' | 'level_complete' | 'game_complete'>('playing');

  // Rule & Trial Data
  const [ruleType, setRuleType] = useState<RuleType>('COLOR');
  const [targetColor, setTargetColor] = useState<ColorType>('red');
  const [targetShape, setTargetShape] = useState<ShapeType>('circle');
  const [objects, setObjects] = useState<GameObject[]>([]);

  // Level 3 Signal State
  const [activeSignal, setActiveSignal] = useState<SignalType | null>(null);
  const [signalPlaying, setSignalPlaying] = useState<boolean>(false);
  const [signalRevealed, setSignalRevealed] = useState<boolean>(false); // Hidden until signal sounds on L3!
  const level3SignalSequenceRef = useRef<SignalType[]>([]);

  // Feedback & Interactions
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [showVisualHint, setShowVisualHint] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [instructionText, setInstructionText] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up voice and timers on unmount
  useEffect(() => {
    return () => {
      stopLumiVoice();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Generate shuffled Level 3 signal sequence (3 BELLs and 3 DRUMs randomly mixed)
  const generateLevel3Signals = useCallback(() => {
    const arr: SignalType[] = ['BELL', 'BELL', 'BELL', 'DRUM', 'DRUM', 'DRUM'];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    level3SignalSequenceRef.current = arr;
  }, []);

  // Generate Trial Objects
  const generateTrial = useCallback(
    (level: number, round: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowVisualHint(false);
      setConsecutiveErrors(0);
      setIsTransitioning(false);

      const allColors: ColorType[] = ['red', 'yellow', 'green', 'blue'];
      const allShapes: ShapeType[] = ['circle', 'square', 'triangle', 'rectangle'];

      let chosenRule: RuleType = 'COLOR';
      let chosenSignal: SignalType | null = null;

      if (level === 1) {
        chosenRule = 'COLOR';
      } else if (level === 2) {
        chosenRule = 'SHAPE';
      } else {
        // Level 3: Auditory Signal
        if (level3SignalSequenceRef.current.length === 0) {
          generateLevel3Signals();
        }
        chosenSignal = level3SignalSequenceRef.current[round - 1] || 'BELL';
        chosenRule = chosenSignal === 'BELL' ? 'COLOR' : 'SHAPE';
      }

      setRuleType(chosenRule);
      setActiveSignal(chosenSignal);

      const tColor = allColors[Math.floor(Math.random() * allColors.length)];
      const tShape = allShapes[Math.floor(Math.random() * allShapes.length)];

      setTargetColor(tColor);
      setTargetShape(tShape);

      // Total count per round:
      // Level 1: [3, 3, 4, 4, 5]
      // Level 2: [4, 4, 5, 5, 6]
      // Level 3: [6, 6, 7, 7, 8, 8]
      let totalCount = 4;
      if (level === 1) {
        const counts = [3, 3, 4, 4, 5];
        totalCount = counts[Math.min(round - 1, counts.length - 1)];
      } else if (level === 2) {
        const counts = [4, 4, 5, 5, 6];
        totalCount = counts[Math.min(round - 1, counts.length - 1)];
      } else {
        const counts = [6, 6, 7, 7, 8, 8];
        totalCount = counts[Math.min(round - 1, counts.length - 1)];
      }

      // Ensure at least 2 target items and at least 1 distractor
      const newObjs: GameObject[] = [];
      const targetCount = Math.max(2, Math.floor(totalCount / 2));
      const distractorCount = totalCount - targetCount;

      // 1) Add Target Items
      for (let i = 0; i < targetCount; i++) {
        let c = tColor;
        let s = tShape;

        if (chosenRule === 'COLOR') {
          // Color is fixed to targetColor, shape varies
          c = tColor;
          s = allShapes[i % allShapes.length];
        } else {
          // Shape is fixed to targetShape, color varies
          s = tShape;
          c = allColors[i % allColors.length];
        }

        newObjs.push({
          id: `target-${i}-${Math.random().toString(36).substr(2, 5)}`,
          shape: s,
          color: c,
          isSelected: false,
          isTarget: true,
        });
      }

      // 2) Add Distractors
      for (let i = 0; i < distractorCount; i++) {
        let c: ColorType;
        let s: ShapeType;

        if (chosenRule === 'COLOR') {
          // Color must NOT be targetColor
          const otherColors = allColors.filter((col) => col !== tColor);
          c = otherColors[i % otherColors.length];
          s = allShapes[Math.floor(Math.random() * allShapes.length)];
        } else {
          // Shape must NOT be targetShape
          const otherShapes = allShapes.filter((sh) => sh !== tShape);
          s = otherShapes[i % otherShapes.length];
          c = allColors[Math.floor(Math.random() * allColors.length)];
        }

        newObjs.push({
          id: `distractor-${i}-${Math.random().toString(36).substr(2, 5)}`,
          shape: s,
          color: c,
          isSelected: false,
          isTarget: false,
        });
      }

      // Shuffle objects for random layout
      for (let i = newObjs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newObjs[i], newObjs[j]] = [newObjs[j], newObjs[i]];
      }

      setObjects(newObjs);

      // Instructions & Sounds
      if (level < 3) {
        setSignalRevealed(true);
        let text = '';
        if (chosenRule === 'COLOR') {
          text = `Найди ${COLOR_CONFIG[tColor].namePlural}.`;
        } else {
          text = level === 2 && round === 1 ? `Теперь ищем ${SHAPE_CONFIG[tShape].namePlural}.` : `Ищем ${SHAPE_CONFIG[tShape].namePlural}.`;
        }
        setInstructionText(text);
        speakLumi(text, { soundEnabled });
      } else {
        // LEVEL 3: MUST PLAY AUDITORY SIGNAL FIRST BEFORE REVEALING RULE!
        setSignalRevealed(false);
        setIsTransitioning(true);
        setInstructionText('Слушай сигнал...');

        timerRef.current = setTimeout(() => {
          if (chosenSignal === 'BELL') {
            playSound('bell', soundEnabled);
          } else {
            playSound('drum', soundEnabled);
          }
          setSignalPlaying(true);

          // After signal sounds, announce the rule!
          timerRef.current = setTimeout(() => {
            setSignalPlaying(false);
            setSignalRevealed(true);
            setIsTransitioning(false);

            let text = '';
            if (chosenSignal === 'BELL') {
              text = `Ищем цвет: ${COLOR_CONFIG[tColor].namePlural}.`;
            } else {
              text = `Ищем форму: ${SHAPE_CONFIG[tShape].namePlural}.`;
            }
            setInstructionText(text);
            speakLumi(text, { soundEnabled });
          }, 800);
        }, 400);
      }
    },
    [generateLevel3Signals, soundEnabled]
  );

  // Initialize Game on Mount
  useEffect(() => {
    generateLevel3Signals();
    generateTrial(1, 1);
  }, [generateLevel3Signals, generateTrial]);

  // Handle Object Click
  const handleObjectClick = (obj: GameObject) => {
    if (isTransitioning || obj.isSelected) return;

    if (obj.isTarget) {
      // CORRECT CLICK!
      playSound('click', soundEnabled);

      // Update object selected state
      const updated = objects.map((o) => (o.id === obj.id ? { ...o, isSelected: true } : o));
      setObjects(updated);
      setConsecutiveErrors(0);
      setShowVisualHint(false);

      // Check if ALL targets are now selected!
      const remainingTargets = updated.filter((o) => o.isTarget && !o.isSelected);

      if (remainingTargets.length === 0) {
        // ROUND COMPLETE!
        setIsTransitioning(true);
        playSound('correct', soundEnabled);

        const lSnap = currentLevel;
        const rSnap = currentRound;
        const maxRounds = lSnap === 3 ? 6 : 5;

        // CRITICAL REQUIREMENT: Keep last correct answer visible for 800-1000ms!
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (rSnap < maxRounds) {
            const nextR = rSnap + 1;
            setCurrentRound(nextR);
            generateTrial(lSnap, nextR);
          } else {
            // LEVEL COMPLETE!
            if (lSnap === 1) {
              setPhase('level_complete');
              playSound('cheer', soundEnabled);
              speakLumi('Уровень 1 пройден!', { soundEnabled });
            } else if (lSnap === 2) {
              setPhase('level_complete');
              playSound('cheer', soundEnabled);
              speakLumi('Уровень 2 пройден!', { soundEnabled });
            } else {
              // Level 3 complete -> GAME COMPLETE!
              setPhase('game_complete');
              playSound('cheer', soundEnabled);
              speakLumi('Ты отлично переключался!', { soundEnabled });
            }
          }
        }, 900);
      }
    } else {
      // INCORRECT CLICK!
      playSound('wrong', soundEnabled);
      const nextErrors = consecutiveErrors + 1;
      setConsecutiveErrors(nextErrors);
      setIsTransitioning(true);

      if (nextErrors === 1) {
        // 1st Error: short phrase, continue
        speakLumi('Посмотри ещё раз.', { soundEnabled });
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 1200);
      } else if (nextErrors === 2) {
        // 2nd Error: Visual hint!
        speakLumi('Посмотри внимательно.', { soundEnabled });
        setShowVisualHint(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowVisualHint(false);
          setIsTransitioning(false);
        }, 2000);
      } else {
        // 3rd+ Error: Repeat rule hint
        speakLumi('Давай посмотрим ещё раз.', { soundEnabled });
        setShowVisualHint(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowVisualHint(false);
          setIsTransitioning(false);
        }, 2000);
      }
    }
  };

  // Next Level Handler
  const handleNextLevel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopLumiVoice();
    if (currentLevel < 3) {
      const nextL = currentLevel + 1;
      setCurrentLevel(nextL);
      setCurrentRound(1);
      setPhase('playing');
      generateTrial(nextL, 1);
    }
  };

  // Restart Entire Game Handler
  const handleRestartGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopLumiVoice();
    setCurrentLevel(1);
    setCurrentRound(1);
    setPhase('playing');
    generateLevel3Signals();
    generateTrial(1, 1);
  };

  const handleReturnToWorld = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopLumiVoice();
    onBackToWorld();
  };

  const totalRounds = currentLevel === 3 ? 6 : 5;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between mb-4 bg-white/90 backdrop-blur-xs px-5 py-3 rounded-2xl shadow-md border-2 border-indigo-200">
        <button
          onClick={handleReturnToWorld}
          className="bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-900 font-extrabold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>◀</span>
          <span>В Мир Луми</span>
        </button>

        <div className="flex flex-col items-center">
          <h1 className="font-black text-xl sm:text-2xl text-indigo-950">
            Цвет или форма?
          </h1>
          {phase === 'playing' && (
            <div className="text-xs sm:text-sm font-bold text-indigo-700">
              Уровень {currentLevel} из 3 &bull; Раунд {currentRound} из {totalRounds}
            </div>
          )}
        </div>

        <div className="w-24 flex justify-end">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
            {currentLevel === 1 && '🎨 Цвет'}
            {currentLevel === 2 && '📐 Форма'}
            {currentLevel === 3 && '🔔/🥁 Сигнал'}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-xl border-2 sm:border-4 border-indigo-200 flex flex-col items-center gap-4 sm:gap-6 relative overflow-hidden box-border">
        {phase === 'playing' && (
          <>
            {/* Top Stage: Lumi Character + Signal Indicator / Instruction */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-indigo-50 border-2 border-indigo-200 p-4 rounded-3xl w-full">
              <LumiCharacter state={showVisualHint ? 'thinking' : 'happy'} size="small" showBubble={false} />

              {/* Signal Badge for Level 3 */}
              {currentLevel === 3 && activeSignal && (
                <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-indigo-300 rounded-2xl shadow-sm min-w-[100px]">
                  <motion.div
                    animate={signalPlaying ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 0.4 }}
                    className="text-4xl"
                  >
                    {activeSignal === 'BELL' ? '🔔' : '🥁'}
                  </motion.div>
                  <div className="text-xs font-black text-indigo-900 mt-1">
                    {activeSignal === 'BELL' ? 'Колокольчик' : 'Барабан'}
                  </div>
                </div>
              )}

              {/* Speech / Instruction Bubble */}
              <div className="relative bg-white border-2 border-indigo-400 p-4 rounded-2xl shadow-md flex-1 text-center sm:text-left w-full">
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                  Правило раунда:
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentLevel === 3 && !signalRevealed ? (
                    <span className="text-indigo-600 animate-pulse">Слушай сигнал...</span>
                  ) : (
                    instructionText
                  )}
                </div>
              </div>
            </div>

            {/* Field with Interactive Figures */}
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 shadow-inner flex flex-wrap justify-center items-center gap-5 sm:gap-8 min-h-[240px]">
              <AnimatePresence>
                {objects.map((obj) => {
                  const isHinted = showVisualHint && obj.isTarget && !obj.isSelected;

                  return (
                    <motion.button
                      key={obj.id}
                      onClick={() => handleObjectClick(obj)}
                      disabled={isTransitioning || obj.isSelected}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: obj.isSelected ? 0.95 : isHinted ? [1, 1.12, 1] : 1,
                        opacity: obj.isSelected ? 0.65 : 1,
                      }}
                      transition={{
                        scale: isHinted ? { repeat: Infinity, duration: 0.8 } : { duration: 0.2 },
                      }}
                      whileHover={!isTransitioning && !obj.isSelected ? { scale: 1.08 } : {}}
                      whileTap={!isTransitioning && !obj.isSelected ? { scale: 0.92 } : {}}
                      className={`relative p-4 rounded-2xl border-4 transition-all flex items-center justify-center cursor-pointer select-none ${
                        obj.isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-inner'
                          : isHinted
                          ? 'bg-amber-100 border-amber-400 shadow-xl ring-4 ring-amber-300'
                          : 'bg-white border-slate-200 shadow-md hover:shadow-lg hover:border-indigo-300'
                      }`}
                    >
                      <ShapeSVG shape={obj.shape} color={obj.color} size={84} />

                      {/* Selected Checkmark Badge */}
                      {obj.isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-2 shadow-lg border-2 border-white text-xl font-bold"
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* LEVEL COMPLETE SCREEN */}
        {phase === 'level_complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center p-6 my-auto gap-5"
          >
            <LumiCharacter state="victory" size="large" showBubble={false} />
            <div className="bg-emerald-100 text-emerald-950 border-2 border-emerald-400 font-black text-2xl sm:text-3xl px-8 py-3 rounded-2xl shadow-md">
              Уровень {currentLevel} пройден! 🎉
            </div>
            <p className="text-slate-700 font-bold text-lg max-w-md">
              {currentLevel === 1 && 'Отлично! Ты хорошо находишь цвет. Теперь переходим к форме!'}
              {currentLevel === 2 && 'Супер! Ты научился искать форму. Впереди главное испытание — сигналы!'}
            </p>
            <button
              onClick={handleNextLevel}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xl px-10 py-4 rounded-2xl shadow-lg border-2 border-emerald-600 transition-all cursor-pointer flex items-center gap-3"
            >
              <span>Продолжить</span>
              <span className="text-2xl">➔</span>
            </button>
          </motion.div>
        )}

        {/* GAME COMPLETE SCREEN */}
        {phase === 'game_complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center p-6 my-auto gap-5"
          >
            <LumiCharacter state="victory" size="large" showBubble={false} />
            <div className="bg-amber-100 text-amber-950 border-2 border-amber-400 font-black text-3xl sm:text-4xl px-8 py-4 rounded-3xl shadow-lg">
              🎉 Игра пройдена!
            </div>
            <p className="text-indigo-950 font-extrabold text-xl sm:text-2xl">
              Ты отлично переключался! 🌟
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full max-w-md justify-center">
              <button
                onClick={handleRestartGame}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-lg border-2 border-indigo-700 transition-all cursor-pointer flex-1 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Сыграть ещё раз</span>
              </button>
              <button
                onClick={onBackToWorld}
                className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-lg border-2 border-emerald-600 transition-all cursor-pointer flex-1 flex items-center justify-center gap-2"
              >
                <span>🏠</span>
                <span>В Мир Луми</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
