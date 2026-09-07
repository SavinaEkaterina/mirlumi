import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { LumiCharacter } from './LumiCharacter';

export type HiddenColor = 'red' | 'yellow' | 'green' | 'blue';
export type HiddenObjectType = 'ball' | 'cube' | 'car' | 'star' | 'bear' | 'balloon' | 'bunny';

export interface HiddenBoardItem {
  id: string;
  color: HiddenColor;
  objectType: HiddenObjectType;
  isTarget: boolean;
  isForbidden?: boolean;
  isFound: boolean;
  xPercent: number;
  yPercent: number;
  rotation: number;
  scale: number;
}

interface ColorHiddenGameProps {
  soundEnabled: boolean;
  onReturnToLumiWorld: () => void;
}

// Color palettes and SVG styling
const COLOR_CONFIG: Record<
  HiddenColor,
  { fill: string; stroke: string }
> = {
  red: { fill: '#ef4444', stroke: '#b91c1c' },
  yellow: { fill: '#f59e0b', stroke: '#b45309' },
  green: { fill: '#10b981', stroke: '#047857' },
  blue: { fill: '#3b82f6', stroke: '#1d4ed8' },
};

// Grammar & Lexicon Dictionary
const COLOR_NAMES: Record<
  HiddenColor,
  {
    neuter: string;
    masculine: string;
    masculineGen: string;
    feminine: string;
    plural: string;
    pluralGen: string;
  }
> = {
  red: {
    neuter: 'красное',
    masculine: 'красный',
    masculineGen: 'красного',
    feminine: 'красную',
    plural: 'красные',
    pluralGen: 'красных',
  },
  yellow: {
    neuter: 'жёлтое',
    masculine: 'жёлтый',
    masculineGen: 'жёлтого',
    feminine: 'жёлтую',
    plural: 'жёлтые',
    pluralGen: 'жёлтых',
  },
  green: {
    neuter: 'зелёное',
    masculine: 'зелёный',
    masculineGen: 'зелёного',
    feminine: 'зелёную',
    plural: 'зелёные',
    pluralGen: 'зелёных',
  },
  blue: {
    neuter: 'синее',
    masculine: 'синий',
    masculineGen: 'синего',
    feminine: 'синюю',
    plural: 'синие',
    pluralGen: 'синих',
  },
};

const OBJECT_NAMES: Record<
  HiddenObjectType,
  {
    nomSingular: string;
    nomPlural: string;
    accWithColor: (c: HiddenColor) => string;
    accPluralWithColor: (c: HiddenColor) => string;
  }
> = {
  ball: {
    nomSingular: 'мяч',
    nomPlural: 'мячи',
    accWithColor: (c) => `${COLOR_NAMES[c].masculine} мяч`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].plural} мячи`,
  },
  cube: {
    nomSingular: 'кубик',
    nomPlural: 'кубики',
    accWithColor: (c) => `${COLOR_NAMES[c].masculine} кубик`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].plural} кубики`,
  },
  car: {
    nomSingular: 'машинка',
    nomPlural: 'машинки',
    accWithColor: (c) => `${COLOR_NAMES[c].feminine} машинку`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].plural} машинки`,
  },
  star: {
    nomSingular: 'звёздочка',
    nomPlural: 'звёздочки',
    accWithColor: (c) => `${COLOR_NAMES[c].feminine} звёздочку`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].plural} звёздочки`,
  },
  bear: {
    nomSingular: 'мишка',
    nomPlural: 'мишки',
    accWithColor: (c) => `${COLOR_NAMES[c].masculineGen} мишку`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].pluralGen} мишек`,
  },
  balloon: {
    nomSingular: 'шарик',
    nomPlural: 'шарики',
    accWithColor: (c) => `${COLOR_NAMES[c].masculine} шарик`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].plural} шарики`,
  },
  bunny: {
    nomSingular: 'зайчик',
    nomPlural: 'зайчики',
    accWithColor: (c) => `${COLOR_NAMES[c].masculineGen} зайчика`,
    accPluralWithColor: (c) => `${COLOR_NAMES[c].pluralGen} зайчиков`,
  },
};

import { LumiAsset } from './LumiAsset';

// SVG Renderer Component connected to LumiAsset Registry
const VectorItemGraphic: React.FC<{
  objectType: HiddenObjectType;
  color: HiddenColor;
}> = ({ objectType, color }) => {
  const assetType = objectType === 'bear' ? 'teddy' : objectType;
  return <LumiAsset type={assetType} color={color} size="medium" className="w-full h-full" />;
};

export const ColorHiddenGame: React.FC<ColorHiddenGameProps> = ({
  soundEnabled,
  onReturnToLumiWorld,
}) => {
  // Game Progression States
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [roundInLevel, setRoundInLevel] = useState<number>(1);
  
  // Modals & Completion States
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState<boolean>(false);
  const [showGameFinalModal, setShowGameFinalModal] = useState<boolean>(false);

  // Board Round Items & Rule State
  const [items, setItems] = useState<HiddenBoardItem[]>([]);
  const [targetColor, setTargetColor] = useState<HiddenColor>('red');
  const [targetObjectType, setTargetObjectType] = useState<HiddenObjectType>('ball');
  const [forbiddenObjectType, setForbiddenObjectType] = useState<HiddenObjectType | null>(null);

  // Character Speech & Animations
  const [lumiMessage, setLumiMessage] = useState<string>('');
  const [lumiState, setLumiState] = useState<'happy' | 'neutral' | 'talking'>('talking');
  const [shakingItemId, setShakingItemId] = useState<string | null>(null);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Consecutive Color Error & Visual Hint State
  const [consecutiveColorErrors, setConsecutiveColorErrors] = useState<number>(0);
  const [showVisualColorHint, setShowVisualColorHint] = useState<boolean>(false);
  const visualHintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Round Count Configs
  const LEVEL_MAX_ROUNDS: Record<1 | 2 | 3, number> = {
    1: 5,
    2: 7,
    3: 5,
  };

  // Generate a new round based on (currentLevel, roundInLevel)
  const generateRound = useCallback(
    (level: 1 | 2 | 3, roundIdx: number) => {
      setIsRoundFinished(false);
      setShakingItemId(null);
      setConsecutiveColorErrors(0);
      setShowVisualColorHint(false);
      if (visualHintTimerRef.current) {
        clearTimeout(visualHintTimerRef.current);
        visualHintTimerRef.current = null;
      }

      const colors: HiddenColor[] = ['red', 'yellow', 'green', 'blue'];
      const objects: HiddenObjectType[] = [
        'ball',
        'cube',
        'car',
        'star',
        'bear',
        'balloon',
        'bunny',
      ];

      const selectedTargetColor = colors[Math.floor(Math.random() * colors.length)];
      setTargetColor(selectedTargetColor);

      let generatedItems: HiddenBoardItem[] = [];
      let instruction = '';

      if (level === 1) {
        // =========================================================================
        // LEVEL 1: COLOR + SPECIFIC TOY ("Найди красный мяч")
        // The child learns that target match requires BOTH item + color.
        // Field explicitly contains:
        // 1. Target (e.g. Red Ball)
        // 2. Same item, different color (e.g. Blue Ball)
        // 3. Different item, target color (e.g. Red Car)
        // 4. Different item, different color (e.g. Green Bear)
        // =========================================================================
        const selectedObj = objects[Math.floor(Math.random() * objects.length)];
        setTargetObjectType(selectedObj);
        setForbiddenObjectType(null);

        instruction = `Найди ${OBJECT_NAMES[selectedObj].accWithColor(selectedTargetColor)}.`;

        const otherColors = colors.filter((c) => c !== selectedTargetColor);
        const distColor1 = otherColors[Math.floor(Math.random() * otherColors.length)];
        const remainingOtherColors = otherColors.filter((c) => c !== distColor1);
        const distColor2 =
          remainingOtherColors.length > 0
            ? remainingOtherColors[Math.floor(Math.random() * remainingOtherColors.length)]
            : distColor1;

        const otherObjects = objects.filter((o) => o !== selectedObj);
        const distObj1 = otherObjects[Math.floor(Math.random() * otherObjects.length)];
        const remainingOtherObjects = otherObjects.filter((o) => o !== distObj1);
        const distObj2 =
          remainingOtherObjects.length > 0
            ? remainingOtherObjects[Math.floor(Math.random() * remainingOtherObjects.length)]
            : distObj1;

        // Item 1: TARGET (Target Color + Target Toy)
        generatedItems.push({
          id: `item_target`,
          color: selectedTargetColor,
          objectType: selectedObj,
          isTarget: true,
          isFound: false,
          xPercent: 0,
          yPercent: 0,
          rotation: Math.floor(Math.random() * 16) - 8,
          scale: 1,
        });

        // Item 2: Distractor 1 (Same Toy, Wrong Color)
        generatedItems.push({
          id: `item_dist_same_obj`,
          color: distColor1,
          objectType: selectedObj,
          isTarget: false,
          isFound: false,
          xPercent: 0,
          yPercent: 0,
          rotation: Math.floor(Math.random() * 16) - 8,
          scale: 1,
        });

        // Item 3: Distractor 2 (Same Color, Wrong Toy)
        generatedItems.push({
          id: `item_dist_same_col`,
          color: selectedTargetColor,
          objectType: distObj1,
          isTarget: false,
          isFound: false,
          xPercent: 0,
          yPercent: 0,
          rotation: Math.floor(Math.random() * 16) - 8,
          scale: 1,
        });

        // Item 4: Distractor 3 (Different Color, Different Toy)
        generatedItems.push({
          id: `item_dist_diff`,
          color: distColor2,
          objectType: distObj2,
          isTarget: false,
          isFound: false,
          xPercent: 0,
          yPercent: 0,
          rotation: Math.floor(Math.random() * 16) - 8,
          scale: 1,
        });
      } else if (level === 2) {
        // =========================================================================
        // LEVEL 2: PURE COLOR ISOLATION ACROSS TOYS ("Найди всё красное")
        // Field consists of friendly toys:
        // - Multiple different toys of target color (e.g. Red Ball, Red Car, Red Bear)
        // - Identical toys of different colors (e.g. Blue Ball, Yellow Car, Green Bear)
        // The child learns to separate "What toy is this?" from "What color is it?".
        // =========================================================================
        setForbiddenObjectType(null);
        instruction = `Найди всё ${COLOR_NAMES[selectedTargetColor].neuter}.`;

        let totalCount = 6;
        if (roundIdx >= 4 && roundIdx <= 5) totalCount = 6;
        if (roundIdx >= 6) totalCount = 7;

        const targetCount = 3;
        const distractorCount = totalCount - targetCount;

        // Shuffle objects to pick distinct toy archetypes for this round
        const shuffledToys = [...objects].sort(() => Math.random() - 0.5);
        const roundToys = shuffledToys.slice(0, targetCount);

        // Target items: target color with different toy types
        for (let i = 0; i < targetCount; i++) {
          generatedItems.push({
            id: `lvl2_target_${i}`,
            color: selectedTargetColor,
            objectType: roundToys[i % roundToys.length],
            isTarget: true,
            isFound: false,
            xPercent: 0,
            yPercent: 0,
            rotation: Math.floor(Math.random() * 18) - 9,
            scale: 0.98 + Math.random() * 0.08,
          });
        }

        // Distractor items: other colors, pairing with the SAME toy types as targets!
        const otherColors = colors.filter((c) => c !== selectedTargetColor);
        for (let i = 0; i < distractorCount; i++) {
          const c = otherColors[i % otherColors.length];
          // Use the same toy types to make color the differentiating feature
          const o = roundToys[i % roundToys.length] || objects[(i + 3) % objects.length];
          generatedItems.push({
            id: `lvl2_dist_${i}`,
            color: c,
            objectType: o,
            isTarget: false,
            isFound: false,
            xPercent: 0,
            yPercent: 0,
            rotation: Math.floor(Math.random() * 18) - 9,
            scale: 0.98 + Math.random() * 0.08,
          });
        }
      } else {
        // =========================================================================
        // LEVEL 3: COLOR + FORBIDDEN TOY EXCLUSION
        // ("Найди всё красное, но не трогай красные кубики")
        // Targets: toys of target color (except forbidden toy) -> CLICK
        // Forbidden: forbidden toy of target color -> DO NOT CLICK
        // Distractors: other colors of both allowed and forbidden toys -> DO NOT CLICK
        // =========================================================================
        const fObj = objects[Math.floor(Math.random() * objects.length)];
        setForbiddenObjectType(fObj);

        instruction = `Найди всё ${COLOR_NAMES[selectedTargetColor].neuter}, но не трогай ${OBJECT_NAMES[fObj].accPluralWithColor(selectedTargetColor)}.`;

        const totalCount = 9;
        const targetCount = 3;
        const forbiddenCount = 2;
        const distractorCount = totalCount - targetCount - forbiddenCount;

        const allowedObjects = objects.filter((o) => o !== fObj);

        // Valid targets: target color + allowed toys
        for (let i = 0; i < targetCount; i++) {
          const o = allowedObjects[i % allowedObjects.length];
          generatedItems.push({
            id: `lvl3_target_${i}`,
            color: selectedTargetColor,
            objectType: o,
            isTarget: true,
            isForbidden: false,
            isFound: false,
            xPercent: 0,
            yPercent: 0,
            rotation: Math.floor(Math.random() * 20) - 10,
            scale: 0.95 + Math.random() * 0.1,
          });
        }

        // Forbidden items: target color + forbidden toy (MUST NOT TOUCH!)
        for (let i = 0; i < forbiddenCount; i++) {
          generatedItems.push({
            id: `lvl3_forbidden_${i}`,
            color: selectedTargetColor,
            objectType: fObj,
            isTarget: false,
            isForbidden: true,
            isFound: false,
            xPercent: 0,
            yPercent: 0,
            rotation: Math.floor(Math.random() * 20) - 10,
            scale: 0.95 + Math.random() * 0.1,
          });
        }

        // Distractor items: other colors (including forbidden toy and other toys)
        const otherColors = colors.filter((c) => c !== selectedTargetColor);
        for (let i = 0; i < distractorCount; i++) {
          const c = otherColors[i % otherColors.length];
          const o = i % 2 === 0 ? fObj : allowedObjects[i % allowedObjects.length];
          generatedItems.push({
            id: `lvl3_dist_${i}`,
            color: c,
            objectType: o,
            isTarget: false,
            isForbidden: false,
            isFound: false,
            xPercent: 0,
            yPercent: 0,
            rotation: Math.floor(Math.random() * 20) - 10,
            scale: 0.95 + Math.random() * 0.1,
          });
        }
      }

      // Shuffle items randomly
      generatedItems = generatedItems.sort(() => Math.random() - 0.5);

      // Grid position layout without overlapping
      const itemCount = generatedItems.length;
      let cols = 3;
      let rows = 2;
      if (itemCount <= 4) {
        cols = 2;
        rows = 2;
      } else if (itemCount >= 5 && itemCount <= 7) {
        cols = 3;
        rows = 3;
      } else if (itemCount >= 8) {
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

      generatedItems.forEach((item, index) => {
        const slot = shuffledSlots[index % shuffledSlots.length];
        const jitterX = (Math.random() - 0.5) * (colStep * 0.3);
        const jitterY = (Math.random() - 0.5) * (rowStep * 0.3);
        item.xPercent = Math.max(15, Math.min(85, slot.x + jitterX));
        item.yPercent = Math.max(16, Math.min(84, slot.y + jitterY));
      });

      setItems(generatedItems);
      setLumiMessage(instruction);
      setLumiState('talking');

      // Speak instruction ONCE at the start of the round
      speakLumi(instruction, { soundEnabled, force: true });
    },
    [soundEnabled]
  );

  // Initialize or re-generate round when currentLevel or roundInLevel changes
  useEffect(() => {
    if (!showLevelCompleteModal && !showGameFinalModal) {
      generateRound(currentLevel, roundInLevel);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
      stopLumiVoice();
    };
  }, [currentLevel, roundInLevel, showLevelCompleteModal, showGameFinalModal, generateRound]);

  // Handle User Click on Board Item
  const handleItemClick = (item: HiddenBoardItem) => {
    if (isRoundFinished || item.isFound) return;

    if (item.isTarget) {
      // --- CORRECT CLICK ---
      playSound('correct', soundEnabled);

      // Reset color error tracking & dismiss visual hint
      setConsecutiveColorErrors(0);
      setShowVisualColorHint(false);
      if (visualHintTimerRef.current) {
        clearTimeout(visualHintTimerRef.current);
        visualHintTimerRef.current = null;
      }

      const updatedItems = items.map((i) =>
        i.id === item.id ? { ...i, isFound: true } : i
      );
      setItems(updatedItems);

      // STRICT RULE: No Lumi speech on individual correct taps! Visual feedback only.

      const remainingTargets = updatedItems.filter((i) => i.isTarget && !i.isFound);
      if (remainingTargets.length === 0) {
        // --- ROUND COMPLETE ---
        setIsRoundFinished(true);
        setLumiState('happy');

        // Check if level max rounds reached
        const maxRounds = LEVEL_MAX_ROUNDS[currentLevel];

        if (roundInLevel < maxRounds) {
          // Advance to next round within current level
          const praiseMsg = 'Получилось.';
          setLumiMessage(praiseMsg);
          speakLumi(praiseMsg, {
            soundEnabled,
            force: true,
            onEnd: () => {
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                setRoundInLevel((prev) => prev + 1);
              }, 400);
            },
          });
        } else {
          // --- LEVEL COMPLETED ---
          if (currentLevel < 3) {
            const levelCompleteMsg = `Отлично! Уровень ${currentLevel} пройден!`;
            setLumiMessage(levelCompleteMsg);
            speakLumi(levelCompleteMsg, { soundEnabled, force: true });

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              setShowLevelCompleteModal(true);
            }, 1000);
          } else {
            // --- FINAL GAME COMPLETE ---
            const finalMsg = 'Ура! Ты нашёл все спрятавшиеся цвета!';
            setLumiMessage(finalMsg);
            speakLumi(finalMsg, { soundEnabled, force: true });

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              setShowGameFinalModal(true);
            }, 1000);
          }
        }
      }
    } else {
      // --- INCORRECT CLICK & HINT LOGIC ---
      playSound('click', soundEnabled);

      setShakingItemId(item.id);
      setTimeout(() => setShakingItemId(null), 400);

      let hint = '';

      // Check if error is specifically a COLOR ERROR
      let isColorError = false;

      if (currentLevel === 1) {
        const isColorCorrect = item.color === targetColor;
        const isObjectCorrect = item.objectType === targetObjectType;

        if (isColorCorrect && !isObjectCorrect) {
          // Color is right, wrong toy -> object error
          hint = 'Предмет не тот.';
          isColorError = false;
        } else {
          // Color is wrong
          isColorError = true;
        }
      } else if (currentLevel === 2) {
        // Any error in level 2 is a color error
        isColorError = true;
      } else {
        // Level 3: check if clicked forbidden item (which has the correct color)
        if (item.color === targetColor && item.isForbidden && forbiddenObjectType) {
          hint = `Цвет правильный. Но ${OBJECT_NAMES[forbiddenObjectType].nomPlural} трогать нельзя.`;
          isColorError = false;
        } else {
          // Any other error is a wrong color
          isColorError = true;
        }
      }

      if (isColorError) {
        const nextErrors = consecutiveColorErrors + 1;

        if (nextErrors >= 2) {
          // 2nd consecutive error on color:
          // Lumi says short phrase: "Посмотри на цвет."
          hint = 'Посмотри на цвет.';

          // Show visual color hint (lasts 4.5s)
          setShowVisualColorHint(true);
          if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
          visualHintTimerRef.current = setTimeout(() => {
            setShowVisualColorHint(false);
            visualHintTimerRef.current = null;
          }, 4500);

          // Reset consecutive errors after providing visual help
          setConsecutiveColorErrors(0);
        } else {
          // 1st error on color: verbal hint only
          setConsecutiveColorErrors(1);

          if (currentLevel === 1) {
            hint = `Посмотри на цвет. Нам нужен ${COLOR_NAMES[targetColor].masculine}.`;
          } else {
            hint = `Посмотри на цвет. Нам нужно ${COLOR_NAMES[targetColor].neuter}.`;
          }
        }
      }

      setLumiMessage(hint);
      speakLumi(hint, { soundEnabled, force: true });
    }
  };

  // Level Progression Handlers
  const handleNextLevel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
    stopLumiVoice();
    setShowLevelCompleteModal(false);
    setShowVisualColorHint(false);
    setConsecutiveColorErrors(0);
    if (currentLevel === 1) {
      setCurrentLevel(2);
      setRoundInLevel(1);
    } else if (currentLevel === 2) {
      setCurrentLevel(3);
      setRoundInLevel(1);
    }
  };

  const handleRestartWholeGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
    stopLumiVoice();
    setShowGameFinalModal(false);
    setShowLevelCompleteModal(false);
    setShowVisualColorHint(false);
    setConsecutiveColorErrors(0);
    setCurrentLevel(1);
    setRoundInLevel(1);
  };

  const handleBackToLumiWorld = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
    stopLumiVoice();
    setShowVisualColorHint(false);
    setConsecutiveColorErrors(0);
    onReturnToLumiWorld();
  };

  const totalTargetsCount = items.filter((i) => i.isTarget).length;
  const foundTargetsCount = items.filter((i) => i.isTarget && i.isFound).length;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-3 py-2">
      {/* Top Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 bg-white/90 backdrop-blur-xs p-3 rounded-2xl shadow-md border-2 border-emerald-200">
        <button
          onClick={handleBackToLumiWorld}
          className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-extrabold px-3 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition-all border border-stone-300"
        >
          <span>◀️</span>
          <span>В Мир Луми</span>
        </button>

        {/* Level Indicator Badge */}
        <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 font-black text-emerald-950 text-xs sm:text-sm">
          <span>🎯 УРОВЕНЬ {currentLevel} из 3</span>
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

      {/* Visual Color Hint Banner (Appears on 2nd consecutive color error) */}
      <AnimatePresence>
        {showVisualColorHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: 'spring', damping: 18, stiffness: 300 }}
            className={`w-full max-w-xs mx-auto mb-3 p-2.5 rounded-2xl shadow-lg border-2 flex items-center justify-center gap-3 select-none backdrop-blur-xs ${
              targetColor === 'red'
                ? 'bg-red-50/95 border-red-400 text-red-700 ring-2 ring-red-200'
                : targetColor === 'yellow'
                ? 'bg-amber-50/95 border-amber-400 text-amber-800 ring-2 ring-amber-200'
                : targetColor === 'green'
                ? 'bg-emerald-50/95 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200'
                : 'bg-blue-50/95 border-blue-400 text-blue-800 ring-2 ring-blue-200'
            }`}
          >
            <span className="text-3xl filter drop-shadow-xs animate-bounce">
              {targetColor === 'red' && '🔴'}
              {targetColor === 'yellow' && '🟡'}
              {targetColor === 'green' && '🟢'}
              {targetColor === 'blue' && '🔵'}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
                Ищем цвет
              </span>
              <span className="text-base font-black uppercase tracking-wide">
                {COLOR_NAMES[targetColor].masculine}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl shadow-xs border border-emerald-200 mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-950">
          Найдено: <span className="text-emerald-600 font-black text-sm">{foundTargetsCount}</span> / {totalTargetsCount}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalTargetsCount }).map((_, idx) => (
            <span
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border border-emerald-400 transition-all ${
                idx < foundTargetsCount
                  ? 'bg-emerald-500 scale-110 shadow-xs'
                  : 'bg-emerald-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Game Board */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-sky-100/90 via-emerald-50/80 to-amber-50/90 border-2 sm:border-4 border-emerald-300 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-xl relative overflow-hidden flex items-center justify-center box-border">
        {/* Background cloud decorations */}
        <div className="absolute top-2 left-4 text-sky-200/50 text-6xl pointer-events-none select-none">☁️</div>
        <div className="absolute top-6 right-8 text-sky-200/50 text-5xl pointer-events-none select-none">☁️</div>
        <div className="absolute bottom-2 left-0 right-0 h-16 bg-gradient-to-t from-emerald-200/40 to-transparent pointer-events-none" />

        {/* Board Items */}
        <div className="relative w-full h-[320px] sm:h-[380px]">
          {items.map((item) => {
            const isShaking = shakingItemId === item.id;
            const isDimmed = showVisualColorHint && item.color !== targetColor;
            const isColorHighlighted = showVisualColorHint && item.color === targetColor;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.isFound || isRoundFinished}
                style={{
                  left: `${item.xPercent}%`,
                  top: `${item.yPercent}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                }}
                animate={
                  isShaking
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] }
                    : item.isFound
                    ? { scale: [1, 1.15, 1], filter: 'brightness(1.1)' }
                    : { scale: 1 }
                }
                transition={{ duration: isShaking ? 0.35 : 0.3 }}
                className={`absolute w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl flex items-center justify-center cursor-pointer select-none transition-all duration-300 ${
                  item.isFound
                    ? 'ring-4 ring-emerald-400 bg-emerald-100/90 shadow-lg opacity-90'
                    : isDimmed
                    ? 'opacity-40 grayscale-[35%] bg-white/40 border border-slate-200'
                    : isColorHighlighted
                    ? 'opacity-100 bg-white shadow-xl ring-3 ring-amber-400/80 border-2 border-amber-300 scale-105'
                    : 'hover:scale-105 active:scale-95 bg-white/80 shadow-md hover:shadow-xl border-2 border-slate-200/80'
                }`}
              >
                <div className="w-full h-full relative flex items-center justify-center">
                  <VectorItemGraphic
                    objectType={item.objectType}
                    color={item.color}
                  />

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
        </div>
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
              className="bg-white border-4 border-emerald-400 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-3 animate-bounce">🌟</div>
              <h2 className="font-black text-2xl sm:text-3xl text-emerald-950 mb-2">
                Уровень {currentLevel} пройден!
              </h2>
              <p className="text-slate-600 font-medium text-sm mb-6">
                {currentLevel === 1
                  ? 'Отлично! Ты научился находить предмет заданного цвета.'
                  : 'Замечательно! Ты научился выделять цвет среди разных предметов.'}
              </p>
              <button
                onClick={handleNextLevel}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg py-3.5 rounded-2xl shadow-lg border-2 border-emerald-600 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>ПРОДОЛЖИТЬ</span>
                <span>➔</span>
              </button>
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
                Ура! Ты прошёл все уровни и нашёл все спрятавшиеся цвета!
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
