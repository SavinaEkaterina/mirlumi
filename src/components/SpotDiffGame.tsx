import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { LumiCharacter } from './LumiCharacter';
import { LumiAsset } from './LumiAsset';

export type ObjColor = 'red' | 'yellow' | 'green' | 'blue';
export type ObjShape = 'circle' | 'square' | 'rectangle' | 'triangle' | 'star';
export type ObjType = 'ball' | 'cube' | 'car' | 'star' | 'bunny' | 'book' | 'teddy';

export interface SceneItem {
  id: string;
  color: ObjColor;
  shape: ObjShape;
  type: ObjType;
  xPercent: number;
  yPercent: number;
  rotation: number;
  scale: number;
  // Attributes after change
  changedColor?: ObjColor;
  changedShape?: ObjShape;
  isChanged?: boolean; // True if this item changed (or was removed)
  changeType?: 'color' | 'shape' | 'removed';
  isFound?: boolean; // True if child correctly clicked this changed item
}

interface SpotDiffGameProps {
  soundEnabled: boolean;
  onReturnToLumiWorld: () => void;
}

// 3D Asset Item Component for SpotDiffGame
const VectorItemGraphic: React.FC<{
  shape: ObjShape;
  type?: ObjType;
  color: ObjColor;
}> = ({ shape, type, color }) => {
  // Determine asset type: prioritize star if shape or type is star,
  // otherwise prioritize registered object types or fallback to shape
  let assetType: string = shape;
  if (shape === 'star' || type === 'star') {
    assetType = 'star';
  } else if (
    type &&
    ['ball', 'cube', 'car', 'bunny', 'book', 'teddy', 'cup', 'pillow', 'flower', 'picture'].includes(type)
  ) {
    assetType = type;
  }

  return (
    <LumiAsset
      type={assetType}
      color={color}
      size="medium"
      className="w-full h-full object-contain"
    />
  );
};

type RoundPhase = 'memorize' | 'curtain' | 'interact' | 'round_complete';

// Calculate memorization time based on exact object count
const getMemorizationDuration = (itemCount: number): number => {
  if (itemCount <= 2) return 5;
  if (itemCount === 3) return 7;
  if (itemCount === 4) return 9;
  if (itemCount === 5) return 11;
  if (itemCount === 6) return 13;
  return 15; // 7 or more objects
};

export const SpotDiffGame: React.FC<SpotDiffGameProps> = ({
  soundEnabled,
  onReturnToLumiWorld,
}) => {
  // Progression
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [roundInLevel, setRoundInLevel] = useState<number>(1);

  // Attempt & Error Tracking
  const [levelAttempt, setLevelAttempt] = useState<number>(1); // 1 = first attempt, 2 = second attempt
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);

  // Modals
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState<boolean>(false);
  const [showGameFinalModal, setShowGameFinalModal] = useState<boolean>(false);
  const [showRetryModal, setShowRetryModal] = useState<boolean>(false);
  const [showRestModal, setShowRestModal] = useState<boolean>(false);

  // Round Phase
  const [phase, setPhase] = useState<RoundPhase>('memorize');
  const [memorizeCountdown, setMemorizeCountdown] = useState<number>(5);

  // Items State
  const [initialItems, setInitialItems] = useState<SceneItem[]>([]);
  const [modifiedItems, setModifiedItems] = useState<SceneItem[]>([]);
  const [removedItem, setRemovedItem] = useState<SceneItem | null>(null);
  const [level1Options, setLevel1Options] = useState<SceneItem[]>([]);

  // Interaction State
  const [foundChangesCount, setFoundChangesCount] = useState<number>(0);
  const [targetChangesTotal, setTargetChangesTotal] = useState<number>(1);
  const [shakingItemId, setShakingItemId] = useState<string | null>(null);

  // Lumi State
  const [lumiMessage, setLumiMessage] = useState<string>('');
  const [lumiState, setLumiState] = useState<'happy' | 'neutral' | 'talking'>('talking');

  // Timers ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const LEVEL_MAX_ROUNDS: Record<1 | 2 | 3, number> = {
    1: 5,
    2: 6,
    3: 5,
  };

  // Helper to stop any current speech before speaking new line
  const stopAndSpeak = useCallback(
    (text: string) => {
      stopLumiVoice();
      speakLumi(text, { soundEnabled, force: true });
    },
    [soundEnabled]
  );

  // Clear running timers
  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
  };

  // Generate new round
  const generateRound = useCallback(
    (level: 1 | 2 | 3, roundIdx: number) => {
      clearTimers();
      setPhase('memorize');
      setFoundChangesCount(0);
      setShakingItemId(null);
      setRemovedItem(null);

      const colorsArr: ObjColor[] = ['red', 'yellow', 'green', 'blue'];
      const shapesArr: ObjShape[] = ['circle', 'square', 'rectangle', 'triangle', 'star'];
      const typesArr: ObjType[] = ['ball', 'cube', 'car', 'star', 'bunny', 'book', 'teddy'];

      let count = 2;
      if (level === 1) {
        count = 2;
        setTargetChangesTotal(1);
      } else if (level === 2) {
        count = roundIdx <= 3 ? 3 : 4;
        setTargetChangesTotal(1);
      } else {
        count = roundIdx <= 2 ? 5 : roundIdx <= 4 ? 6 : 7;
        setTargetChangesTotal(2);
      }

      // Single source of truth for memorization timer
      const durationSec = getMemorizationDuration(count);
      setMemorizeCountdown(durationSec);

      // Grid slots for clean placement
      let cols = 2;
      let rows = 1;
      if (count >= 3 && count <= 4) {
        cols = 2;
        rows = 2;
      } else if (count >= 5) {
        cols = 3;
        rows = 3;
      }

      const gridSlots: { x: number; y: number }[] = [];
      const colStep = 100 / cols;
      const rowStep = 100 / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          gridSlots.push({
            x: c * colStep + colStep / 2,
            y: r * rowStep + rowStep / 2,
          });
        }
      }
      const shuffledSlots = gridSlots.sort(() => Math.random() - 0.5);

      // Create Initial Items
      const initItems: SceneItem[] = [];
      const usedCombos = new Set<string>();

      for (let i = 0; i < count; i++) {
        let c: ObjColor;
        let s: ObjShape;
        let t: ObjType;
        let key: string;

        do {
          c = colorsArr[Math.floor(Math.random() * colorsArr.length)];
          s = shapesArr[Math.floor(Math.random() * shapesArr.length)];
          t = typesArr[Math.floor(Math.random() * typesArr.length)];
          key = `${c}_${s}_${t}`;
        } while (usedCombos.has(key) && usedCombos.size < 16);

        usedCombos.add(key);

        const slot = shuffledSlots[i % shuffledSlots.length];
        const jitterX = (Math.random() - 0.5) * (colStep * 0.3);
        const jitterY = (Math.random() - 0.5) * (rowStep * 0.3);

        initItems.push({
          id: `obj_${i}_${Date.now()}_${Math.random()}`,
          color: c,
          shape: s,
          type: t,
          xPercent: Math.max(15, Math.min(85, slot.x + jitterX)),
          yPercent: Math.max(18, Math.min(82, slot.y + jitterY)),
          rotation: Math.floor(Math.random() * 20) - 10,
          scale: 1,
          isChanged: false,
          isFound: false,
        });
      }

      setInitialItems(initItems);

      // Create Modified Items according to Level Rules
      const modItems: SceneItem[] = JSON.parse(JSON.stringify(initItems));

      if (level === 1) {
        // LEVEL 1: ONE OBJECT REMOVED ("Кого нет?")
        const removeIndex = Math.floor(Math.random() * modItems.length);
        const removed = modItems[removeIndex];
        removed.isChanged = true;
        removed.changeType = 'removed';

        setRemovedItem(removed);

        const remainingModItems = modItems.filter((_, idx) => idx !== removeIndex);
        setModifiedItems(remainingModItems);

        // Options: removed item + 2 distractors
        const distractorOptions: SceneItem[] = [];
        const distractorSet = new Set<string>();
        distractorSet.add(`${removed.color}_${removed.shape}`);

        while (distractorOptions.length < 2) {
          const dc = colorsArr[Math.floor(Math.random() * colorsArr.length)];
          const ds = shapesArr[Math.floor(Math.random() * shapesArr.length)];
          const dt = typesArr[Math.floor(Math.random() * typesArr.length)];
          const dKey = `${dc}_${ds}`;

          if (!distractorSet.has(dKey)) {
            distractorSet.add(dKey);
            distractorOptions.push({
              id: `opt_dist_${distractorOptions.length}_${Math.random()}`,
              color: dc,
              shape: ds,
              type: dt,
              xPercent: 0,
              yPercent: 0,
              rotation: 0,
              scale: 1,
              isChanged: false,
              isFound: false,
            });
          }
        }

        const allOptions = [removed, ...distractorOptions].sort(() => Math.random() - 0.5);
        setLevel1Options(allOptions);
      } else if (level === 2) {
        // LEVEL 2: EXACTLY ONE ITEM CHANGES (COLOR OR SHAPE)
        const targetIndex = Math.floor(Math.random() * modItems.length);
        const itemToChange = modItems[targetIndex];
        itemToChange.isChanged = true;

        const changeType: 'color' | 'shape' = Math.random() > 0.5 ? 'color' : 'shape';
        itemToChange.changeType = changeType;

        if (changeType === 'color') {
          const otherColors = colorsArr.filter((c) => c !== itemToChange.color);
          itemToChange.color = otherColors[Math.floor(Math.random() * otherColors.length)];
        } else {
          const otherShapes = shapesArr.filter((s) => s !== itemToChange.shape);
          itemToChange.shape = otherShapes[Math.floor(Math.random() * otherShapes.length)];
        }

        setModifiedItems(modItems);
      } else {
        // LEVEL 3: TWO ITEMS CHANGE (ONE COLOR, ONE SHAPE)
        const indices = Array.from({ length: modItems.length }, (_, k) => k).sort(() => Math.random() - 0.5);
        const idx1 = indices[0];
        const idx2 = indices[1];

        const item1 = modItems[idx1];
        item1.isChanged = true;
        item1.changeType = 'color';
        const otherColors = colorsArr.filter((c) => c !== item1.color);
        item1.color = otherColors[Math.floor(Math.random() * otherColors.length)];

        const item2 = modItems[idx2];
        item2.isChanged = true;
        item2.changeType = 'shape';
        const otherShapes = shapesArr.filter((s) => s !== item2.shape);
        item2.shape = otherShapes[Math.floor(Math.random() * otherShapes.length)];

        setModifiedItems(modItems);
      }

      // Initial prompt
      const startMsg = 'Посмотри внимательно.';
      setLumiMessage(startMsg);
      setLumiState('talking');
      stopAndSpeak(startMsg);
    },
    [stopAndSpeak]
  );

  // Phase transitions driven by countdown
  useEffect(() => {
    if (phase === 'memorize') {
      const interval = setInterval(() => {
        setMemorizeCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase('curtain');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (phase === 'curtain') {
      const t = setTimeout(() => {
        setPhase('interact');

        let qMsg = 'Что стало другим?';
        if (currentLevel === 1) {
          qMsg = 'Кого нет?';
        } else if (currentLevel === 3) {
          qMsg = 'Что изменилось?';
        }

        setLumiMessage(qMsg);
        setLumiState('talking');
        stopAndSpeak(qMsg);
      }, 1200);

      return () => clearTimeout(t);
    } else if (phase === 'hint_flash') {
      const t = setTimeout(() => {
        setPhase('interact');

        let qMsg = 'Что стало другим?';
        if (currentLevel === 1) {
          qMsg = 'Выбери пропавший предмет';
        } else if (currentLevel === 3) {
          qMsg = 'Что изменилось?';
        }

        setLumiMessage(qMsg);
      }, 3000);

      return () => clearTimeout(t);
    }
  }, [phase, currentLevel, stopAndSpeak]);

  // Initial load & round changes
  useEffect(() => {
    if (!showLevelCompleteModal && !showGameFinalModal && !showRetryModal && !showRestModal) {
      generateRound(currentLevel, roundInLevel);
    }
    return () => clearTimers();
  }, [currentLevel, roundInLevel, showLevelCompleteModal, showGameFinalModal, showRetryModal, showRestModal, generateRound]);

  // Handle wrong answer and error tracking
  const handleError = () => {
    playSound('click', soundEnabled);
    const nextErrors = consecutiveErrors + 1;
    setConsecutiveErrors(nextErrors);

    if (nextErrors >= 3) {
      setShowRestModal(true);
      const restMsg = 'Ты хорошо постарался. Давай немного отдохнём.';
      setLumiMessage(restMsg);
      setLumiState('talking');
      stopAndSpeak(restMsg);
      return;
    }

    // Gentle Hint
    let hint = 'Посмотри внимательнее.';

    if (currentLevel === 1) {
      hint = nextErrors === 1 ? 'Посмотри ещё раз.' : 'Вспомни, что было сначала.';
    } else if (currentLevel === 2) {
      const changedItem = modifiedItems.find((i) => i.isChanged);
      if (changedItem?.changeType === 'color') {
        hint = 'Посмотри на цвет.';
      } else if (changedItem?.changeType === 'shape') {
        hint = 'Посмотри на форму.';
      }
    } else if (currentLevel === 3) {
      hint = nextErrors === 1 ? 'Посмотри внимательнее.' : 'Сравни предметы ещё раз.';
    }

    setPhase('hint_flash');
    setLumiMessage(hint);
    setLumiState('talking');
    stopAndSpeak(hint);
  };

  // Handle Level 1 Option Click
  const handleLevel1OptionClick = (option: SceneItem) => {
    if (phase !== 'interact') return;

    if (removedItem && option.id === removedItem.id) {
      // CORRECT CHOICE
      playSound('correct', soundEnabled);
      setConsecutiveErrors(0);
      setLumiState('happy');
      advanceRound();
    } else {
      // INCORRECT CHOICE
      handleError();
    }
  };

  // Handle Level 2/3 Scene Item Click
  const handleSceneItemClick = (item: SceneItem) => {
    if (phase !== 'interact' || item.isFound) return;

    if (item.isChanged) {
      // CORRECT CLICK
      playSound('correct', soundEnabled);
      setConsecutiveErrors(0);

      const updated = modifiedItems.map((i) =>
        i.id === item.id ? { ...i, isFound: true } : i
      );
      setModifiedItems(updated);

      const newFoundCount = foundChangesCount + 1;
      setFoundChangesCount(newFoundCount);

      if (newFoundCount >= targetChangesTotal) {
        setLumiState('happy');
        advanceRound();
      }
    } else {
      // INCORRECT CLICK
      setShakingItemId(item.id);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setShakingItemId(null);
        shakeTimerRef.current = null;
      }, 400);
      handleError();
    }
  };

  // Advance round or finish level
  const advanceRound = () => {
    clearTimers();
    const maxRounds = LEVEL_MAX_ROUNDS[currentLevel];

    if (roundInLevel < maxRounds) {
      // Move to next round silently without mandatory verbal praise
      timerRef.current = setTimeout(() => {
        setRoundInLevel((prev) => prev + 1);
      }, 1000);
    } else {
      // LEVEL FINISHED
      if (currentLevel < 3) {
        const lvlDoneMsg = `Отлично! Уровень ${currentLevel} пройден!`;
        setLumiMessage(lvlDoneMsg);
        stopAndSpeak(lvlDoneMsg);

        timerRef.current = setTimeout(() => {
          setShowLevelCompleteModal(true);
        }, 1000);
      } else {
        const finalDoneMsg = 'Ура! Ты заметил все изменения!';
        setLumiMessage(finalDoneMsg);
        stopAndSpeak(finalDoneMsg);

        timerRef.current = setTimeout(() => {
          setShowGameFinalModal(true);
        }, 1000);
      }
    }
  };

  // Level Progression Handlers
  const handleNextLevel = () => {
    clearTimers();
    stopLumiVoice();
    setShowLevelCompleteModal(false);
    setLevelAttempt(1);
    setConsecutiveErrors(0);
    if (currentLevel === 1) {
      setCurrentLevel(2);
      setRoundInLevel(1);
    } else if (currentLevel === 2) {
      setCurrentLevel(3);
      setRoundInLevel(1);
    }
  };

  // Retry level with new randomized scenes
  const handleRetryCurrentLevel = () => {
    clearTimers();
    stopLumiVoice();
    setShowRetryModal(false);
    setShowRestModal(false);
    setLevelAttempt(2);
    setConsecutiveErrors(0);
    setRoundInLevel(1);
    generateRound(currentLevel, 1);
  };

  const handleRestartWholeGame = () => {
    clearTimers();
    stopLumiVoice();
    setShowGameFinalModal(false);
    setShowLevelCompleteModal(false);
    setShowRetryModal(false);
    setShowRestModal(false);
    setLevelAttempt(1);
    setConsecutiveErrors(0);
    setCurrentLevel(1);
    setRoundInLevel(1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-3 py-2">
      {/* Top Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 bg-white/90 backdrop-blur-xs p-3 rounded-2xl shadow-md border-2 border-indigo-200">
        <button
          onClick={onReturnToLumiWorld}
          className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-extrabold px-3 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition-all border border-stone-300"
        >
          <span>◀️</span>
          <span>В Мир Луми</span>
        </button>

        {/* Level Indicator Badge */}
        <div className="flex items-center gap-2 bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300 font-black text-indigo-950 text-xs sm:text-sm">
          <span>👁️ УРОВЕНЬ {currentLevel} из 3</span>
        </div>

        {/* Round Counter */}
        <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 text-amber-900 font-extrabold text-xs sm:text-sm">
          <span>⭐ Раунд {roundInLevel} / {LEVEL_MAX_ROUNDS[currentLevel]}</span>
        </div>
      </div>

      {/* Lumi Assistant Character & Speech */}
      <div className="w-full mb-3">
        <LumiCharacter state={lumiState} message={lumiMessage} autoSpeak={false} />
      </div>

      {/* Main Game Stage Container */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-indigo-50 via-sky-50 to-amber-50 border-2 sm:border-4 border-indigo-300 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-xl relative flex flex-col items-center justify-center overflow-hidden box-border">
        {/* Background cloud decorations */}
        <div className="absolute top-2 left-4 text-sky-200/50 text-6xl pointer-events-none select-none">☁️</div>
        <div className="absolute top-6 right-8 text-sky-200/50 text-5xl pointer-events-none select-none">☁️</div>

        {/* Memorization Timer Indicator */}
        {phase === 'memorize' && (
          <div className="absolute top-3 right-4 bg-amber-400 text-amber-950 font-black px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-1.5 z-20 animate-pulse">
            <span>⏱️ Запоминаем: {memorizeCountdown} с</span>
          </div>
        )}

        {/* Visual Hint Indicator Badge */}
        {phase === 'hint_flash' && (
          <div className="absolute top-3 right-4 bg-sky-500 text-white font-black px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-1.5 z-20 animate-pulse">
            <span>🔍 Показываем как было...</span>
          </div>
        )}

        {/* Curtain Transition Overlay */}
        <AnimatePresence>
          {phase === 'curtain' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-indigo-900/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-white"
            >
              <div className="text-6xl mb-2 animate-spin">✨</div>
              <p className="font-black text-xl sm:text-2xl text-indigo-100">Что-то изменилось...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board View: Initial (Memorize Phase or Hint Flash) vs Modified (Interact Phase) */}
        <div className="relative w-full h-[300px] sm:h-[360px]">
          {(phase === 'memorize' || phase === 'hint_flash') && (
            <>
              {initialItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    left: `${item.xPercent}%`,
                    top: `${item.yPercent}%`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                  }}
                  className="absolute w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl flex items-center justify-center bg-white/80 shadow-md border-2 border-slate-200/80 select-none"
                >
                  <VectorItemGraphic shape={item.shape} type={item.type} color={item.color} />
                </div>
              ))}
            </>
          )}

          {phase === 'interact' && (
            <>
              {modifiedItems.map((item) => {
                const isShaking = shakingItemId === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleSceneItemClick(item)}
                    disabled={item.isFound || currentLevel === 1}
                    style={{
                      left: `${item.xPercent}%`,
                      top: `${item.yPercent}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                    }}
                    animate={
                      isShaking
                        ? { x: [-10, 10, -8, 8, -4, 4, 0] }
                        : item.isFound
                        ? { scale: [1, 1.15, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: isShaking ? 0.35 : 0.3 }}
                    className={`absolute w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl flex items-center justify-center select-none ${
                      currentLevel === 1 ? 'bg-white/80 border-2 border-slate-200/80 shadow-md' : 'cursor-pointer'
                    } ${
                      item.isFound
                        ? 'ring-4 ring-emerald-400 bg-emerald-100/90 shadow-lg'
                        : currentLevel > 1
                        ? 'hover:scale-105 active:scale-95 bg-white/80 shadow-md hover:shadow-xl border-2 border-slate-200/80'
                        : ''
                    }`}
                  >
                    <div className="w-full h-full relative flex items-center justify-center">
                      <VectorItemGraphic shape={item.shape} type={item.type} color={item.color} />

                      {item.isFound && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center"
                        >
                          <span className="text-emerald-600 font-black text-2xl sm:text-3xl drop-shadow-md">
                            ✓
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </>
          )}
        </div>

        {/* Level 1 Specific Choice Options Bar below the board */}
        {currentLevel === 1 && phase === 'interact' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-2 bg-white/90 backdrop-blur-xs p-3 rounded-2xl border-2 border-indigo-200 shadow-lg flex flex-col items-center gap-2 z-10"
          >
            <p className="font-bold text-xs sm:text-sm text-indigo-950">Выбери пропавший предмет:</p>
            <div className="flex items-center justify-center gap-4">
              {level1Options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleLevel1OptionClick(option)}
                  className="w-16 h-16 sm:w-20 sm:h-20 p-2 bg-indigo-50/90 hover:bg-indigo-100/90 active:scale-95 border-2 border-indigo-300 rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer transition-all"
                >
                  <VectorItemGraphic shape={option.shape} type={option.type} color={option.color} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal: Level Complete */}
      <AnimatePresence>
        {showLevelCompleteModal && (
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
                Уровень {currentLevel} пройден!
              </h2>
              <p className="text-slate-600 font-medium text-sm mb-6">
                {currentLevel === 1
                  ? 'Отлично! Ты точно определил, какой предмет исчез!'
                  : 'Замечательно! Ты заметил все изменения!'}
              </p>
              <button
                onClick={handleNextLevel}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg py-3.5 rounded-2xl shadow-lg border-2 border-indigo-600 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>ПРОДОЛЖИТЬ</span>
                <span>➔</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Rest Break / Return to Lumi World */}
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
                    handleRetryCurrentLevel();
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

      {/* Modal: Final Game Complete */}
      <AnimatePresence>
        {showGameFinalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-rose-400 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-3 animate-bounce">🎉 🏆 🎉</div>
              <h2 className="font-black text-2xl sm:text-3xl text-rose-950 mb-2">
                ИГРА ПРОЙДЕНА!
              </h2>
              <p className="text-slate-600 font-medium text-sm mb-6">
                Ура! Ты заметил абсолютно все изменения!
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRestartWholeGame}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black text-lg py-3.5 rounded-2xl shadow-lg border-2 border-rose-600 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>СЫГРАТЬ ЕЩЁ РАЗ</span>
                </button>
                <button
                  onClick={onReturnToLumiWorld}
                  className="w-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-extrabold text-base py-3 rounded-2xl border border-stone-300 cursor-pointer transition-all"
                >
                  В Мир Луми
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
