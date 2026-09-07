import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { LumiAsset } from './LumiAsset';
import { playSound } from '../utils/audio';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star';
export type ColorType = 'red' | 'blue' | 'green' | 'yellow';

export interface GameObject {
  id: string;
  shape: ShapeType;
  color: ColorType;
  size: number;
}

interface RobotMistakeGameProps {
  soundEnabled: boolean;
  onReturnToLumiWorld: () => void;
}

// 3D Visual Item rendering connected to LumiAsset Registry
const ShapeItem: React.FC<{ shape: ShapeType; color: ColorType; size: number }> = ({ shape, color, size }) => {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center">
      <LumiAsset type={shape} color={color} size="medium" className="w-full h-full object-contain" />
    </div>
  );
};

// Friendly Robot Avatar SVG
const RobotAvatar: React.FC<{ isSpeaking?: boolean; isCelebrating?: boolean }> = ({ isSpeaking, isCelebrating }) => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.svg
        width="110"
        height="110"
        viewBox="0 0 120 120"
        className="drop-shadow-lg"
        animate={
          isCelebrating
            ? { y: [0, -8, 0, -8, 0], rotate: [0, -4, 4, -4, 0] }
            : isSpeaking
            ? { y: [0, -4, 0] }
            : {}
        }
        transition={{ repeat: Infinity, duration: isCelebrating ? 0.5 : 0.6 }}
      >
        {/* Antenna */}
        <line x1="60" y1="20" x2="60" y2="5" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="5" r="7" fill={isCelebrating ? '#10b981' : '#ef4444'} className="animate-pulse" />

        {/* Head */}
        <rect x="25" y="20" width="70" height="55" rx="14" fill="#38bdf8" stroke="#0284c7" strokeWidth="4" />

        {/* Visor Screen */}
        <rect x="33" y="28" width="54" height="28" rx="8" fill="#0f172a" />

        {/* Eyes */}
        <circle cx="48" cy="42" r="6" fill="#38bdf8" />
        <circle cx="72" cy="42" r="6" fill="#38bdf8" />

        {/* Mouth */}
        {isCelebrating ? (
          <path d="M 46 54 Q 60 66 74 54" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <rect x="48" y="58" width="24" height="6" rx="3" fill="#0f172a" />
        )}

        {/* Ears / Side Bolts */}
        <circle cx="20" cy="48" r="6" fill="#64748b" />
        <circle cx="100" cy="48" r="6" fill="#64748b" />

        {/* Body */}
        <rect x="35" y="78" width="50" height="36" rx="10" fill="#94a3b8" stroke="#475569" strokeWidth="4" />
        <circle cx="60" cy="96" r="8" fill="#eab308" />

        {/* Celebrating Clapping Arms */}
        {isCelebrating && (
          <>
            <motion.path
              d="M 35 90 Q 20 75 48 82"
              stroke="#64748b"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              animate={{ d: ["M 35 90 Q 20 75 48 82", "M 35 90 Q 15 75 56 82", "M 35 90 Q 20 75 48 82"] }}
              transition={{ repeat: Infinity, duration: 0.35 }}
            />
            <motion.path
              d="M 85 90 Q 100 75 72 82"
              stroke="#64748b"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              animate={{ d: ["M 85 90 Q 100 75 72 82", "M 85 90 Q 105 75 64 82", "M 85 90 Q 100 75 72 82"] }}
              transition={{ repeat: Infinity, duration: 0.35 }}
            />
          </>
        )}
      </motion.svg>

      {/* Floating Sparkles for Robot Claps */}
      {isCelebrating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.2, 0.9], y: [-5, -12, -5] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="absolute -top-3 font-black text-2xl select-none pointer-events-none"
        >
          👏✨
        </motion.div>
      )}
    </div>
  );
};

// Russian name mappings
const COLOR_NAMES_RU: Record<ColorType, { nom: string; adj: string; femAdj: string }> = {
  red: { nom: 'красный', adj: 'красный', femAdj: 'красная' },
  blue: { nom: 'синий', adj: 'синий', femAdj: 'синяя' },
  green: { nom: 'зелёный', adj: 'зелёный', femAdj: 'зелёная' },
  yellow: { nom: 'жёлтый', adj: 'жёлтый', femAdj: 'жёлтая' },
};

const getColorAdj = (color: ColorType, shape?: ShapeType): string => {
  if (shape === 'star') {
    return COLOR_NAMES_RU[color].femAdj;
  }
  return COLOR_NAMES_RU[color].adj;
};

const SHAPE_NAMES_RU: Record<ShapeType, { nom: string; phrase: string }> = {
  circle: { nom: 'круг', phrase: 'круг' },
  square: { nom: 'квадрат', phrase: 'квадрат' },
  triangle: { nom: 'треугольник', phrase: 'треугольник' },
  rectangle: { nom: 'прямоугольник', phrase: 'прямоугольник' },
  star: { nom: 'звезда', phrase: 'звезду' },
};

export const RobotMistakeGame: React.FC<RobotMistakeGameProps> = ({ soundEnabled, onReturnToLumiWorld }) => {
  // Game structure state
  const [currentLevel, setCurrentLevel] = useState<number>(1); // 1, 2, 3
  const [currentRound, setCurrentRound] = useState<number>(1); // 1 to 5
  const [phase, setPhase] = useState<
    'playing' | 'step2_mistake_type' | 'level_complete' | 'game_complete' | 'robot_celebration'
  >('playing');

  // Current Trial Data
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [targetIndex, setTargetIndex] = useState<number>(0);

  // Robot's claim
  const [robotColorClaim, setRobotColorClaim] = useState<ColorType>('red');
  const [robotShapeClaim, setRobotShapeClaim] = useState<ShapeType>('circle');
  const [robotStatementText, setRobotStatementText] = useState<string>('');
  const [isRobotTruth, setIsRobotTruth] = useState<boolean>(true);

  // Level 3 specific mistake details
  const [mistakeType, setMistakeType] = useState<'color' | 'shape' | 'object'>('color');

  // UI state
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [showHighlightHint, setShowHighlightHint] = useState<boolean>(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [showVisualComparisonHint, setShowVisualComparisonHint] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Colors and Shapes arrays
  const allColors: ColorType[] = ['red', 'blue', 'green', 'yellow'];
  const allShapes: ShapeType[] = ['circle', 'square', 'triangle', 'rectangle', 'star'];

  const getOtherColor = (color: ColorType): ColorType => {
    const others = allColors.filter((c) => c !== color);
    return others[Math.floor(Math.random() * others.length)];
  };

  const getOtherShape = (shape: ShapeType): ShapeType => {
    const others = allShapes.filter((s) => s !== shape);
    return others[Math.floor(Math.random() * others.length)];
  };

  // Generate a trial round
  const generateTrial = useCallback((level: number, round: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsTransitioning(false);
    setShowHighlightHint(false);
    setShowVisualComparisonHint(false);
    setConsecutiveErrors(0);
    setFeedbackMsg('');
    setPhase('playing');

    let objectCount = 1;
    if (level === 1) objectCount = 1;
    else if (level === 2) objectCount = round <= 2 ? 2 : 3;
    else objectCount = round <= 2 ? 2 : 3;

    // Create unique random objects
    const newObjects: GameObject[] = [];
    const usedCombos = new Set<string>();

    for (let i = 0; i < objectCount; i++) {
      let color: ColorType;
      let shape: ShapeType;
      let comboKey: string;

      do {
        color = allColors[Math.floor(Math.random() * allColors.length)];
        shape = allShapes[Math.floor(Math.random() * allShapes.length)];
        comboKey = `${color}_${shape}`;
      } while (usedCombos.has(comboKey) && usedCombos.size < allColors.length * allShapes.length);

      usedCombos.add(comboKey);
      newObjects.push({
        id: `obj_${i}_${Date.now()}`,
        color,
        shape,
        size: objectCount === 1 ? 90 : 76,
      });
    }

    setObjects(newObjects);

    // Pick target index
    const targetIdx = Math.floor(Math.random() * newObjects.length);
    setTargetIndex(targetIdx);

    const targetObj = newObjects[targetIdx];

    // Decide if Robot tells truth (50% true, 50% false)
    const isTruth = Math.random() < 0.5;
    setIsRobotTruth(isTruth);

    let claimColor = targetObj.color;
    let claimShape = targetObj.shape;
    let typeOfMistake: 'color' | 'shape' | 'object' = 'color';

    if (!isTruth) {
      if (level === 1) {
        // Level 1: Robot mistakes color
        claimColor = getOtherColor(targetObj.color);
      } else if (level === 2) {
        // Level 2: Robot mistakes color OR shape
        if (Math.random() < 0.5) {
          claimColor = getOtherColor(targetObj.color);
        } else {
          claimShape = getOtherShape(targetObj.shape);
        }
      } else {
        // Level 3: Robot mistakes color, shape, or points to wrong object
        const randType = Math.random();
        if (randType < 0.4) {
          // Color mistake
          typeOfMistake = 'color';
          claimColor = getOtherColor(targetObj.color);
        } else if (randType < 0.7) {
          // Shape mistake
          typeOfMistake = 'shape';
          claimShape = getOtherShape(targetObj.shape);
        } else {
          // Object mistake (both color and shape differ, or different object altogether)
          typeOfMistake = 'object';
          claimColor = getOtherColor(targetObj.color);
          claimShape = getOtherShape(targetObj.shape);
        }
      }
    }

    setRobotColorClaim(claimColor);
    setRobotShapeClaim(claimShape);
    setMistakeType(typeOfMistake);

    // Formulate Robot's spoken phrase
    let statement = '';
    if (level === 1) {
      statement = `Это ${COLOR_NAMES_RU[claimColor].adj}.`;
    } else {
      statement = `Это ${getColorAdj(claimColor, claimShape)} ${SHAPE_NAMES_RU[claimShape].nom}.`;
    }

    setRobotStatementText(statement);

    // Speak statement
    speakLumi(statement, { soundEnabled });
  }, [soundEnabled]);

  // Initial load
  useEffect(() => {
    generateTrial(1, 1);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stopLumiVoice();
    };
  }, [generateTrial]);

  // Advance round or level (ONLY called when answer is correct!)
  const advanceRound = (r = currentRound, l = currentLevel) => {
    if (r < 5) {
      const nextR = r + 1;
      setCurrentRound(nextR);
      generateTrial(l, nextR);
    } else {
      // Level Complete! (Only on round 5 correct answer)
      if (l < 3) {
        setPhase('level_complete');
        playSound('cheer', soundEnabled);
        speakLumi(`Уровень ${l} пройден!`, { soundEnabled });
      } else {
        // Level 3, Round 5 COMPLETE!
        setPhase('robot_celebration');
        setFeedbackMsg('Получилось! 🤖👏');
        playSound('correct', soundEnabled);
        speakLumi('Получилось!', { soundEnabled });

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setPhase('game_complete');
          playSound('cheer', soundEnabled);
          speakLumi('Ты научился проверять робота!', { soundEnabled });
        }, 1800);
      }
    }
  };

  // Handle Step 1 Answer ([ ДА ] or [ НЕТ ])
  const handleAnswerStep1 = (userSaidYes: boolean) => {
    if (isTransitioning) return;

    // Clear any pending error/hint timer and hide hint overlays immediately on answer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowHighlightHint(false);
    setShowVisualComparisonHint(false);

    const isUserCorrect = userSaidYes === isRobotTruth;

    if (isUserCorrect) {
      // CORRECT!
      setConsecutiveErrors(0);
      playSound('correct', soundEnabled);

      if (!isRobotTruth && currentLevel === 3) {
        // Level 3: Robot lied, user correctly said NO -> Proceed to Step 2 ("Что не так?")
        setPhase('step2_mistake_type');
        setFeedbackMsg('Верно! А что именно не так?');
        speakLumi('Что не так?', { soundEnabled });
      } else {
        // Direct round pass
        setFeedbackMsg('Верно!');
        setIsTransitioning(true);

        const rSnap = currentRound;
        const lSnap = currentLevel;

        timerRef.current = setTimeout(() => {
          advanceRound(rSnap, lSnap);
        }, 900);
      }
    } else {
      // INCORRECT!
      const nextErrors = consecutiveErrors + 1;
      setConsecutiveErrors(nextErrors);
      playSound('wrong', soundEnabled);
      setIsTransitioning(true);

      if (nextErrors === 1) {
        // 1st Error: Only voice message + brief glow
        setFeedbackMsg('Посмотри внимательно.');
        speakLumi('Посмотри внимательно.', { soundEnabled });

        setShowHighlightHint(true);
        timerRef.current = setTimeout(() => {
          setShowHighlightHint(false);
          setIsTransitioning(false);
        }, 1500);
      } else {
        // 2nd+ Error: Full visual comparison hint overlay!
        setFeedbackMsg('Посмотри, в чём ошибка!');
        speakLumi('Посмотри внимательно.', { soundEnabled });
        setShowVisualComparisonHint(true);

        timerRef.current = setTimeout(() => {
          setShowVisualComparisonHint(false);
          setIsTransitioning(false);
          setFeedbackMsg('Попробуй ещё раз.');
          speakLumi('Попробуй ещё раз.', { soundEnabled });
        }, 3200);
      }
    }
  };

  // Handle Step 2 Answer ([ ЦВЕТ ], [ ФОРМА ], [ ПРЕДМЕТ ])
  const handleAnswerStep2 = (chosenType: 'color' | 'shape' | 'object') => {
    if (isTransitioning) return;

    // Clear any pending error/hint timer and hide hint overlays immediately on answer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowHighlightHint(false);
    setShowVisualComparisonHint(false);

    if (chosenType === mistakeType) {
      // CORRECT!
      setConsecutiveErrors(0);
      playSound('correct', soundEnabled);
      setFeedbackMsg('Правильно!');
      setIsTransitioning(true);

      const rSnap = currentRound;
      const lSnap = currentLevel;

      timerRef.current = setTimeout(() => {
        advanceRound(rSnap, lSnap);
      }, 900);
    } else {
      // INCORRECT
      const nextErrors = consecutiveErrors + 1;
      setConsecutiveErrors(nextErrors);
      playSound('wrong', soundEnabled);
      setIsTransitioning(true);

      if (nextErrors === 1) {
        setFeedbackMsg('Посмотри ещё раз.');
        speakLumi('Посмотри ещё раз.', { soundEnabled });

        timerRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 1500);
      } else {
        setFeedbackMsg('Посмотри, в чём ошибка!');
        speakLumi('Посмотри внимательно.', { soundEnabled });
        setShowVisualComparisonHint(true);

        timerRef.current = setTimeout(() => {
          setShowVisualComparisonHint(false);
          setIsTransitioning(false);
          setFeedbackMsg('Попробуй ещё раз.');
          speakLumi('Попробуй ещё раз.', { soundEnabled });
        }, 3200);
      }
    }
  };

  // Level Complete modal Continue button
  const handleContinueLevel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopLumiVoice();
    const nextL = currentLevel + 1;
    setCurrentLevel(nextL);
    setCurrentRound(1);
    generateTrial(nextL, 1);
  };

  // Restart game
  const handleRestartGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopLumiVoice();
    setCurrentLevel(1);
    setCurrentRound(1);
    generateTrial(1, 1);
  };

  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return 'Уровень 1: Робот говорит правду или нет?';
    if (lvl === 2) return 'Уровень 2: Проверь робота';
    return 'Уровень 3: Найди ошибку робота';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-6 py-2 sm:py-4 flex flex-col items-center select-none box-border">
      {/* Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-xs p-4 rounded-3xl shadow-lg border-2 border-sky-200 mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-sky-500 text-white font-black text-sm px-3.5 py-1.5 rounded-2xl shadow-xs">
            Уровень {currentLevel} из 3
          </span>
          <span className="bg-amber-400 text-amber-950 font-extrabold text-sm px-3 py-1.5 rounded-2xl shadow-xs">
            Раунд {currentRound} из 5
          </span>
        </div>

        <div className="font-extrabold text-sky-950 text-sm sm:text-base">
          {getLevelTitle(currentLevel)}
        </div>
      </div>

      {/* Lumi Character Guide Header */}
      <div className="w-full mb-4">
        <LumiCharacter
          state={feedbackMsg ? (feedbackMsg.includes('Верно') || feedbackMsg.includes('Правильно') ? 'clap' : 'thinking') : 'neutral'}
          message={feedbackMsg || 'Слушай робота и проверяй, прав он или ошибся!'}
          autoSpeak={false}
        />
      </div>

      {/* MODAL: LEVEL COMPLETE */}
      <AnimatePresence>
        {phase === 'level_complete' && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-sky-50 border-4 border-sky-500 rounded-3xl p-6 shadow-2xl text-center max-w-md mx-auto my-6 z-30"
          >
            <div className="text-5xl mb-3">🤖 ⭐ 🎉</div>
            <h2 className="text-sky-950 font-black text-2xl sm:text-3xl mb-2">
              Уровень {currentLevel} пройден!
            </h2>
            <p className="text-sky-900 font-bold text-base mb-6">
              Отличная работа! Ты внимательно проверяешь робота и не веришь ему на слово!
            </p>
            <button
              onClick={handleContinueLevel}
              className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-xl px-8 py-4 rounded-2xl shadow-lg border-2 border-sky-600 cursor-pointer transition-all w-full flex items-center justify-center gap-2"
            >
              <span>ПРОДОЛЖИТЬ</span>
              <span className="text-2xl">➔</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: GAME COMPLETE */}
      <AnimatePresence>
        {phase === 'game_complete' && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-emerald-50 border-4 border-emerald-500 rounded-3xl p-6 shadow-2xl text-center max-w-lg mx-auto my-6 z-30"
          >
            <div className="text-5xl mb-3">🏆 🤖 🎉</div>
            <h2 className="text-emerald-950 font-black text-2xl sm:text-3xl mb-2">
              🎉 Ты научился проверять робота!
            </h2>
            <p className="text-emerald-900 font-bold text-base mb-6">
              Умничка! Теперь робот ни за что не сможет тебя запутать!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRestartGame}
                className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-amber-950 font-black text-lg py-4 px-6 rounded-2xl shadow-lg border-2 border-amber-600 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>СЫГРАТЬ ЕЩЁ РАЗ</span>
                <span>🔄</span>
              </button>

              <button
                onClick={onReturnToLumiWorld}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-lg border-2 border-emerald-700 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>В МИР ЛУМИ</span>
                <span>🌍</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN GAME FIELD */}
      {(phase === 'playing' || phase === 'step2_mistake_type' || phase === 'robot_celebration') && (
        <div className="w-full bg-white/80 backdrop-blur-xs rounded-3xl p-4 sm:p-6 shadow-xl border-4 border-sky-200 flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Top Robot + Speech Bubble Stage */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-sky-50 border-2 border-sky-200 p-4 rounded-3xl w-full">
            <RobotAvatar
              isSpeaking={!isTransitioning && phase !== 'robot_celebration'}
              isCelebrating={phase === 'robot_celebration'}
            />

            {/* Speech Bubble */}
            <div className="relative bg-white border-2 border-sky-400 p-4 rounded-2xl shadow-md flex-1 text-center sm:text-left">
              <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
                Робот говорит:
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {phase === 'robot_celebration' ? '«Получилось! 🤖👏»' : `«${robotStatementText}»`}
              </div>
            </div>
          </div>

          {/* Game Canvas with Objects & Robot Pointer */}
          <div className="w-full min-h-[200px] bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-8 relative overflow-hidden flex-wrap">
            {objects.map((obj, idx) => {
              const isTargetObj = idx === targetIndex;
              const isDimmed = showVisualComparisonHint && !isTargetObj;

              return (
                <div
                  key={obj.id}
                  className={`relative p-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isDimmed
                      ? 'opacity-20 blur-[1px] scale-90'
                      : isTargetObj
                      ? showHighlightHint || showVisualComparisonHint
                        ? 'ring-4 ring-amber-400 bg-amber-100 scale-110 shadow-2xl z-20'
                        : 'bg-white border-2 border-sky-400 shadow-md scale-105'
                      : 'bg-white/60 border border-slate-200 opacity-80'
                  }`}
                >
                  {/* Robot Pointer Arrow pointing to target object */}
                  {isTargetObj && (
                    <motion.div
                      animate={{ y: [-4, 4, -4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 bg-sky-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 z-10"
                    >
                      <span>🤖 Указывает</span>
                      <span>👇</span>
                    </motion.div>
                  )}

                  <ShapeItem shape={obj.shape} color={obj.color} size={obj.size} />
                </div>
              );
            })}

            {/* VISUAL COMPARISON HINT OVERLAY (After 2 consecutive errors) */}
            <AnimatePresence>
              {showVisualComparisonHint && objects[targetIndex] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 z-40 rounded-2xl"
                >
                  <div className="bg-white border-4 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-2xl max-w-md w-full text-center flex flex-col items-center gap-3">
                    <div className="bg-amber-100 text-amber-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>ПОДСКАЗКА: СРАВНИВАЕМ!</span>
                    </div>

                    {/* Comparison Boxes Row */}
                    <div className="w-full flex items-center justify-center gap-2 sm:gap-4">
                      {/* REAL OBJECT BOX (LEFT) */}
                      <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center flex-1 shadow-sm">
                        <div className="text-[10px] sm:text-xs font-black text-emerald-800 uppercase mb-1">
                          На самом деле:
                        </div>
                        <div className="my-1">
                          <ShapeItem shape={objects[targetIndex].shape} color={objects[targetIndex].color} size={56} />
                        </div>
                        <div className="mt-1 text-xs sm:text-sm font-extrabold text-emerald-950 capitalize">
                          {getColorAdj(objects[targetIndex].color, objects[targetIndex].shape)} {SHAPE_NAMES_RU[objects[targetIndex].shape].nom}
                        </div>
                      </div>

                      {/* SIGN IN THE MIDDLE */}
                      <div className="text-2xl sm:text-3xl font-black flex items-center justify-center">
                        {isRobotTruth ? (
                          <span className="text-emerald-500 font-black">=</span>
                        ) : (
                          <span className="text-rose-600 font-black text-3xl sm:text-4xl">≠</span>
                        )}
                      </div>

                      {/* ROBOT CLAIM BOX (RIGHT) */}
                      <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center flex-1 shadow-sm relative">
                        {!isRobotTruth && (
                          <div className="absolute -top-2.5 -right-2.5 bg-rose-600 text-white font-black text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-md animate-bounce">
                            ✕
                          </div>
                        )}
                        <div className="text-[10px] sm:text-xs font-black text-rose-800 uppercase mb-1">
                          Робот сказал:
                        </div>
                        <div className="my-1 relative">
                          <ShapeItem shape={robotShapeClaim} color={robotColorClaim} size={56} />
                          {!isRobotTruth && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-rose-600 text-5xl font-black opacity-80">✕</span>
                            </div>
                          )}
                        </div>
                        <div className={`mt-1 text-xs sm:text-sm font-extrabold capitalize ${!isRobotTruth ? 'text-rose-950 line-through' : 'text-slate-900'}`}>
                          {getColorAdj(robotColorClaim, robotShapeClaim)} {SHAPE_NAMES_RU[robotShapeClaim].nom}
                        </div>
                      </div>
                    </div>

                    {/* EXPLANATION BADGE AT BOTTOM */}
                    <div className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 text-amber-950 font-extrabold text-xs sm:text-sm">
                      {!isRobotTruth ? (
                        robotColorClaim !== objects[targetIndex].color && robotShapeClaim === objects[targetIndex].shape ? (
                          <span>🎨 Ошибка в <span className="text-rose-700 underline decoration-rose-500">ЦВЕТЕ</span>!</span>
                        ) : robotShapeClaim !== objects[targetIndex].shape && robotColorClaim === objects[targetIndex].color ? (
                          <span>📐 Ошибка в <span className="text-rose-700 underline decoration-rose-500">ФОРМЕ</span>!</span>
                        ) : (
                          <span>🔍 Робот назва́л <span className="text-rose-700 underline decoration-rose-500">ДРУГОЙ ПРЕДМЕТ</span>!</span>
                        )
                      ) : (
                        <span>✅ Робот назвал всё правильно!</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Answer Controls */}
          {phase === 'robot_celebration' ? (
            <div className="w-full flex justify-center py-2">
              <div className="bg-emerald-100 text-emerald-950 border-2 border-emerald-400 font-black text-xl px-8 py-4 rounded-2xl shadow-md flex items-center gap-3 animate-bounce">
                <span>👏</span>
                <span>Получилось!</span>
                <span>✨</span>
              </div>
            </div>
          ) : phase === 'playing' ? (
            /* Step 1 Buttons: [ ДА ] and [ НЕТ ] */
            <div className="w-full flex gap-4 max-w-md">
              <button
                onClick={() => handleAnswerStep1(true)}
                disabled={isTransitioning}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white font-black text-2xl py-5 rounded-2xl shadow-lg border-2 border-emerald-600 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>👍</span>
                <span>ДА</span>
              </button>

              <button
                onClick={() => handleAnswerStep1(false)}
                disabled={isTransitioning}
                className="flex-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-50 text-white font-black text-2xl py-5 rounded-2xl shadow-lg border-2 border-rose-600 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>👎</span>
                <span>НЕТ</span>
              </button>
            </div>
          ) : (
            /* Step 2 Buttons (Level 3): [ ЦВЕТ ], [ ФОРМА ], [ ПРЕДМЕТ ] */
            <div className="w-full flex flex-col items-center gap-3">
              <div className="font-extrabold text-slate-800 text-lg text-center">
                В чём ошибка робота?
              </div>
              <div className="w-full flex flex-wrap sm:flex-nowrap gap-3 max-w-lg">
                <button
                  onClick={() => handleAnswerStep2('color')}
                  disabled={isTransitioning}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-black text-lg py-4 rounded-2xl shadow-md border-2 border-amber-500 cursor-pointer transition-all"
                >
                  🎨 ЦВЕТ
                </button>

                <button
                  onClick={() => handleAnswerStep2('shape')}
                  disabled={isTransitioning}
                  className="flex-1 bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-sky-950 font-black text-lg py-4 rounded-2xl shadow-md border-2 border-sky-500 cursor-pointer transition-all"
                >
                  📐 ФОРМА
                </button>

                <button
                  onClick={() => handleAnswerStep2('object')}
                  disabled={isTransitioning}
                  className="flex-1 bg-purple-400 hover:bg-purple-500 active:bg-purple-600 text-purple-950 font-black text-lg py-4 rounded-2xl shadow-md border-2 border-purple-500 cursor-pointer transition-all"
                >
                  🔍 ПРЕДМЕТ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
