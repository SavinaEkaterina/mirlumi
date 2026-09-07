import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { playSound } from '../utils/audio';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';

export interface Game3DebugData {
  game3CurrentWorld: 1 | 2 | 3;
  game3CurrentStage: string;
  game3CurrentTask: string;
  game3Attempts: number;
  game3Correct: number;
  game3Errors: number;
  game3Hints: number;
  game3ResponseTimeMs: number;
  game3AdaptationLevel: number;
  game3SimplificationUsed: boolean;
  game3MaximumStageReached: number;
  game3BlueIntroduced: boolean;
  game3BlueRecognized: boolean;
  game3FruitStageCompleted: boolean;
  game3DeliveryCompleted: boolean;
  game3BuildingStarted: boolean;
  game3HouseCompleted: boolean;
}

interface ColorWorldGameProps {
  soundEnabled: boolean;
  onReturnToLumiWorld: () => void;
  onDebugDataUpdate?: (data: Game3DebugData) => void;
}

export type Color3 = 'red' | 'yellow' | 'green' | 'blue';
export type Shape3 = 'circle' | 'square' | 'rectangle' | 'triangle' | 'star' | 'ball' | 'cube';

// Pure HEX color map ensuring vivid, clear, child-friendly colors
export const COLOR_HEX_MAP: Record<Color3, { fill: string; stroke: string; nameRu: string }> = {
  red: { fill: '#ef4444', stroke: '#b91c1c', nameRu: 'красный' },
  green: { fill: '#22c55e', stroke: '#15803d', nameRu: 'зелёный' },
  yellow: { fill: '#eab308', stroke: '#a16207', nameRu: 'жёлтый' },
  blue: { fill: '#2563eb', stroke: '#1d4ed8', nameRu: 'синий' }, // Pure clear blue (no purple!)
};

export const SHAPE_NAMES_RU: Record<Shape3, string> = {
  circle: 'круг',
  square: 'квадрат',
  rectangle: 'прямоугольник',
  triangle: 'треугольник',
  star: 'звезда',
  ball: 'шар',
  cube: 'кубик',
};

export function getDynamicItemLabel(color: Color3, shape?: Shape3): string {
  if (shape && SHAPE_NAMES_RU[shape]) {
    return `${COLOR_HEX_MAP[color].nameRu} ${SHAPE_NAMES_RU[shape]}`;
  }
  return COLOR_HEX_MAP[color].nameRu;
}

export function getShapeColorHint(
  target: { color: Color3; shape: Shape3 },
  selected: { color: Color3; shape?: Shape3 },
  consecutiveCount: number = 1
): string {
  const targetColorRu = COLOR_HEX_MAP[target.color].nameRu;
  const targetShapeRu = SHAPE_NAMES_RU[target.shape];

  const selectedColor = selected.color;
  const selectedShape = selected.shape;

  // 1. Color is CORRECT, but shape is INCORRECT
  if (selectedColor === target.color && selectedShape && selectedShape !== target.shape) {
    if (consecutiveCount >= 2) {
      return `Посмотри только на форму. Нам нужен ${targetShapeRu}.`;
    }
    return `Цвет правильный! Посмотри на форму. Нам нужен ${targetShapeRu}.`;
  }

  // 2. Shape is CORRECT, but color is INCORRECT
  if (selectedShape === target.shape && selectedColor !== target.color) {
    if (consecutiveCount >= 2) {
      return `Посмотри только на цвет. Нам нужен ${targetColorRu}.`;
    }
    return `Форма правильная! Посмотри на цвет. Нам нужен ${targetColorRu}.`;
  }

  // 3. BOTH color and shape are INCORRECT
  if (consecutiveCount >= 2) {
    return `Посмотри ещё раз на цвет и форму: нам нужен ${targetColorRu} ${targetShapeRu}.`;
  }
  return `Посмотри на цвет и форму. Нам нужен ${targetColorRu} ${targetShapeRu}.`;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Stage layout grid coordinates (% left, % top)
const STAGE_POSITIONS = [
  { x: 18, y: 28 },
  { x: 42, y: 20 },
  { x: 65, y: 35 },
  { x: 85, y: 22 },
  { x: 30, y: 52 },
  { x: 72, y: 48 },
];

export interface FruitConfig {
  fruitType: 'apple' | 'banana' | 'plum' | 'pear' | 'strawberry' | 'cherry';
  color: Color3;
  label: string;
  labelPlural: string;
  emoji: string;
}

// APPROVED FRUITS ONLY - Red Apple, Yellow Banana, Green Pear, Blue Plum
export const FRUIT_CATALOG: Record<Color3, FruitConfig[]> = {
  red: [
    { fruitType: 'apple', color: 'red', label: 'красное яблоко', labelPlural: 'красные яблоки', emoji: '🍎' },
  ],
  yellow: [
    { fruitType: 'banana', color: 'yellow', label: 'жёлтый банан', labelPlural: 'жёлтые бананы', emoji: '🍌' },
  ],
  green: [
    { fruitType: 'pear', color: 'green', label: 'зелёная груша', labelPlural: 'зелёные груши', emoji: '🍐' },
  ],
  blue: [
    { fruitType: 'plum', color: 'blue', label: 'синяя слива', labelPlural: 'синие сливы', emoji: '🫐' },
  ],
};

export const APPROVED_LEVEL_2_OBJECTS = [
  FRUIT_CATALOG.red[0],
  FRUIT_CATALOG.yellow[0],
  FRUIT_CATALOG.green[0],
  FRUIT_CATALOG.blue[0],
] as const;

import { LumiAsset } from './LumiAsset';

// Shape Renderer using LumiAsset Registry 3D PNG shape assets
export function RenderShapeSVG({ shape, color, size = 38 }: { shape: string; color: Color3; size?: number }) {
  const assetSize = size < 30 ? 'small' : 'medium';
  const assetType = shape === 'square' ? 'cube' : shape;
  return <LumiAsset type={assetType} color={color} size={assetSize} className="object-contain" />;
}

// Fruit Renderer using LumiAsset Registry
export function RenderFruitSVG({ fruitType, color, size = 44 }: { fruitType: string; color: Color3; size?: number }) {
  return <LumiAsset type={fruitType} color={color} size="medium" />;
}

export interface InteractiveItem3 {
  id: string;
  type: 'circle' | 'fruit' | 'block';
  color: Color3;
  shape?: Shape3;
  fruitType?: 'apple' | 'banana' | 'plum' | 'pear' | 'strawberry' | 'cherry';
  label: string;
  emoji: string;
  x: number; // % left
  y: number; // % top
}

export type StageCode3 =
  | '1.1_CIRCLES_RED_GREEN'
  | '1.2_CIRCLES_SHUFFLED'
  | '1.3_CIRCLES_THREE'
  | '1.4_CIRCLES_COMPLETE'
  | '2.1_FRUITS_TRANSITION'
  | '2.2_FRUITS_RED'
  | '2.3_FRUITS_YELLOW'
  | '2.4_FRUITS_ALL'
  | '2.5_FRUITS_SHUFFLED'
  | '2.6_HARVEST_DONE'
  | '2.7_TRUCK_LOAD'
  | '2.8_TRUCK_DRIVE'
  | '2.9_TRUCK_UNLOAD'
  | '3.1_BUILDING_INTRO'
  | '3.2_WALL_1'
  | '3.3_WALL_2'
  | '3.4_WALL_3'
  | '3.5_WALL_4'
  | '3.6_ROOF'
  | '3.7_HOUSE_COMPLETE';

export const ColorWorldGame: React.FC<ColorWorldGameProps> = ({
  soundEnabled,
  onReturnToLumiWorld,
  onDebugDataUpdate,
}) => {
  const lastInputTimestampRef = useRef<number>(0);

  // Overall State
  const [currentWorld, setCurrentWorld] = useState<1 | 2 | 3>(1);
  const [stageCode, setStageCode] = useState<StageCode3>('1.1_CIRCLES_RED_GREEN');

  // Lumi
  const [lumiMessage, setLumiMessage] = useState<string>('Смотри, сколько цветов! Давай соберём их вместе.');
  const [lumiState, setLumiState] = useState<'happy' | 'encouraging' | 'thinking'>('happy');

  // Metrics & Adaptation
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [hintsCount, setHintsCount] = useState<number>(0);
  const [lastResponseTimeMs, setLastResponseTimeMs] = useState<number>(0);
  const [adaptationLevel, setAdaptationLevel] = useState<number>(1);
  const [simplificationUsed, setSimplificationUsed] = useState<boolean>(false);
  const [maxStageReached, setMaxStageReached] = useState<number>(1);
  const [isFirstGameSession, setIsFirstGameSession] = useState<boolean>(true);
  const [hasReachedMinimumLevel, setHasReachedMinimumLevel] = useState<boolean>(false);

  // Milestone flags
  const [fruitStageCompleted, setFruitStageCompleted] = useState<boolean>(false);
  const [deliveryCompleted, setDeliveryCompleted] = useState<boolean>(false);
  const [buildingStarted, setBuildingStarted] = useState<boolean>(false);
  const [houseCompleted, setHouseCompleted] = useState<boolean>(false);

  // Items currently on stage
  const [items, setItems] = useState<InteractiveItem3[]>([]);
  const [targetColor, setTargetColor] = useState<Color3 | null>('red');
  const [targetFruitType, setTargetFruitType] = useState<string | null>(null);
  const [targetShape, setTargetShape] = useState<Shape3 | null>(null);

  // Blue discovery tracking
  const [blueIntroduced, setBlueIntroduced] = useState<boolean>(false);
  const [blueRecognized, setBlueRecognized] = useState<boolean>(false);

  // Harvest Baskets (Starts EMPTY)
  const [harvestBaskets, setHarvestBaskets] = useState<Record<Color3, number>>({
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  });

  // Level 2 Multi-Round State
  const [level2RoundIndex, setLevel2RoundIndex] = useState<number>(0);
  const level2RoundIndexRef = useRef<number>(0);
  const level2SequenceRef = useRef<Color3[]>([]);

  // Truck Animation State
  const [truckState, setTruckState] = useState<'IDLE' | 'LOADING' | 'DRIVING' | 'ARRIVED'>('IDLE');

  // House Construction Progress (stores color of built wall or null)
  const [houseIndex, setHouseIndex] = useState<1 | 2 | 3>(1);
  const houseIndexRef = useRef<1 | 2 | 3>(1);
  const usedLevel3CombosRef = useRef<Set<string>>(new Set());

  const [houseWalls, setHouseWalls] = useState<{
    wall1: Color3 | null;
    wall2: Color3 | null;
    wall3: Color3 | null;
    wall4: Color3 | null;
    roof: Color3 | null;
  }>({
    wall1: null,
    wall2: null,
    wall3: null,
    wall4: null,
    roof: null,
  });

  // Visual cues
  const [shakingItemId, setShakingItemId] = useState<string | null>(null);
  const [showHighlightHint, setShowHighlightHint] = useState<boolean>(false);
  const [showRestModal, setShowRestModal] = useState<boolean>(false);

  // Level 1 specific sorting state
  const [selectedCircle, setSelectedCircle] = useState<InteractiveItem3 | null>(null);
  const [level1BasketItems, setLevel1BasketItems] = useState<Record<Color3, InteractiveItem3[]>>({
    red: [],
    yellow: [],
    green: [],
    blue: [],
  });
  const [bouncingBasketColor, setBouncingBasketColor] = useState<Color3 | null>(null);
  const [shakingBasketColor, setShakingBasketColor] = useState<Color3 | null>(null);
  const [hasLearnedLevel1Mechanic, setHasLearnedLevel1Mechanic] = useState<boolean>(false);
  const isLevel2TransitioningRef = useRef<boolean>(false);

  // Level 2 Demonstration State
  const [demonstratedTargets, setDemonstratedTargets] = useState<string[]>([]);
  const [demoHighlightItemId, setDemoHighlightItemId] = useState<string | null>(null);
  const [isDemonstrating, setIsDemonstrating] = useState<boolean>(false);
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const demoTimerRef2 = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    if (demoTimerRef2.current) {
      clearTimeout(demoTimerRef2.current);
      demoTimerRef2.current = null;
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  };

  // Debug callback sync
  useEffect(() => {
    if (onDebugDataUpdate) {
      onDebugDataUpdate({
        game3CurrentWorld: currentWorld,
        game3CurrentStage: stageCode,
        game3CurrentTask: lumiMessage,
        game3Attempts: attemptsCount,
        game3Correct: correctCount,
        game3Errors: errorsCount,
        game3Hints: hintsCount,
        game3ResponseTimeMs: lastResponseTimeMs,
        game3AdaptationLevel: adaptationLevel,
        game3SimplificationUsed: simplificationUsed,
        game3MaximumStageReached: maxStageReached,
        game3BlueIntroduced: blueIntroduced,
        game3BlueRecognized: blueRecognized,
        game3FruitStageCompleted: fruitStageCompleted,
        game3DeliveryCompleted: deliveryCompleted,
        game3BuildingStarted: buildingStarted,
        game3HouseCompleted: houseCompleted,
      });
    }
  }, [
    currentWorld,
    stageCode,
    lumiMessage,
    attemptsCount,
    correctCount,
    errorsCount,
    hintsCount,
    lastResponseTimeMs,
    adaptationLevel,
    simplificationUsed,
    maxStageReached,
    blueIntroduced,
    blueRecognized,
    fruitStageCompleted,
    deliveryCompleted,
    buildingStarted,
    houseCompleted,
    onDebugDataUpdate,
  ]);

  // Session targets store for Level 3 to prevent repeating target pairs
  const level3SessionTargetsRef = useRef<Record<string, { color: Color3; shape: Shape3 }>>({});

  // Level 3 Generator Helper
  const buildLevel3WallItems = (code: StageCode3, wallLabel: string, hIdxOverride?: 1 | 2 | 3) => {
    const currentHIdx = hIdxOverride || houseIndexRef.current;
    const allColors: Color3[] = ['red', 'green', 'yellow', 'blue'];
    const wallShapes: Shape3[] = code === '3.6_ROOF' ? ['triangle'] : ['square', 'rectangle', 'circle'];

    let tColor: Color3 = 'red';
    let tShape: Shape3 = code === '3.6_ROOF' ? 'triangle' : 'square';

    const used = usedLevel3CombosRef.current;
    const candidates: Array<{ color: Color3; shape: Shape3 }> = [];

    for (const c of shuffleArray(allColors)) {
      for (const s of shuffleArray(wallShapes)) {
        if (!used.has(`${c}_${s}`)) {
          candidates.push({ color: c, shape: s });
        }
      }
    }

    if (candidates.length > 0) {
      tColor = candidates[0].color;
      tShape = candidates[0].shape;
    } else {
      used.clear();
      const sc = shuffleArray(allColors)[0];
      const ss = shuffleArray(wallShapes)[0];
      tColor = sc;
      tShape = ss;
    }

    used.add(`${tColor}_${tShape}`);

    setTargetColor(tColor);
    setTargetShape(tShape);

    const targetLabelText = getDynamicItemLabel(tColor, tShape);
    let msg = '';
    if (code === '3.6_ROOF') {
      msg = `Ух ты! Стены готовы, осталась крыша! Найди ${targetLabelText}!`;
    } else if (code === '3.2_WALL_1' || code === '3.1_BUILDING_INTRO') {
      if (currentHIdx === 1) {
        msg = `А теперь построим наш дом! Давай построим первую стену. Найди ${targetLabelText}!`;
      } else if (currentHIdx === 2) {
        msg = `Давай построим второй дом! Найдём первую стену: ${targetLabelText}!`;
      } else {
        msg = `Давай построим третий дом! Найдём первую стену: ${targetLabelText}!`;
      }
    } else if (code === '3.3_WALL_2') {
      msg = `Отлично! Теперь построим вторую стену. Найди ${targetLabelText}!`;
    } else if (code === '3.4_WALL_3') {
      msg = `Здорово! Теперь построим третью стену. Найди ${targetLabelText}!`;
    } else if (code === '3.5_WALL_4') {
      msg = `Замечательно! Построим четвёртую стену. Найди ${targetLabelText}!`;
    } else {
      msg = `Для ${wallLabel} найди ${targetLabelText}!`;
    }

    setLumiMessage(msg);
    setLumiState('happy');
    speakLumi(msg, { soundEnabled, force: true, speechKey: `lvl3_h${currentHIdx}_${code}_${tColor}_${tShape}` });

    // Target Item (100% matches instruction)
    const targetItem: InteractiveItem3 = {
      id: `w_h${currentHIdx}_${code}_target_${Math.random().toString(36).substring(2, 6)}`,
      type: 'block',
      color: tColor,
      shape: tShape,
      label: targetLabelText,
      emoji: '',
      x: 0,
      y: 0,
    };

    // Distractor 1: Same shape, different color
    const otherColors1 = shuffleArray(allColors.filter((c) => c !== tColor));
    const dist1Color = otherColors1[0];
    const dist1Shape = tShape;
    const dist1: InteractiveItem3 = {
      id: `w_${code}_d1_${Math.random().toString(36).substring(2, 6)}`,
      type: 'block',
      color: dist1Color,
      shape: dist1Shape,
      label: getDynamicItemLabel(dist1Color, dist1Shape),
      emoji: '',
      x: 0,
      y: 0,
    };

    // Distractor 2: Different shape, same color
    const allShapes: Shape3[] = ['circle', 'square', 'rectangle', 'triangle', 'star'];
    const otherShapes2 = shuffleArray(allShapes.filter((s) => s !== tShape));
    const dist2Color = tColor;
    const dist2Shape = otherShapes2[0];
    const dist2: InteractiveItem3 = {
      id: `w_${code}_d2_${Math.random().toString(36).substring(2, 6)}`,
      type: 'block',
      color: dist2Color,
      shape: dist2Shape,
      label: getDynamicItemLabel(dist2Color, dist2Shape),
      emoji: '',
      x: 0,
      y: 0,
    };

    // Distractor 3: Unique remaining color & shape pair guaranteed to not duplicate target, dist1, or dist2
    const remainingPairs: Array<{ color: Color3; shape: Shape3 }> = [];
    for (const c of allColors) {
      for (const s of allShapes) {
        const isTarget = c === tColor && s === tShape;
        const isDist1 = c === dist1Color && s === dist1Shape;
        const isDist2 = c === dist2Color && s === dist2Shape;
        if (!isTarget && !isDist1 && !isDist2) {
          remainingPairs.push({ color: c, shape: s });
        }
      }
    }
    const dist3Pair = shuffleArray(remainingPairs)[0] || {
      color: otherColors1[1] || 'blue',
      shape: otherShapes2[1] || 'rectangle',
    };

    const dist3: InteractiveItem3 = {
      id: `w_${code}_d3_${Math.random().toString(36).substring(2, 6)}`,
      type: 'block',
      color: dist3Pair.color,
      shape: dist3Pair.shape,
      label: getDynamicItemLabel(dist3Pair.color, dist3Pair.shape),
      emoji: '',
      x: 0,
      y: 0,
    };

    // Shuffle 4 options & randomize position among STAGE_POSITIONS
    const rawOptions = shuffleArray([targetItem, dist1, dist2, dist3]);
    const shuffledPositions = shuffleArray(STAGE_POSITIONS).slice(0, 4);

    const itemsWithPos = rawOptions.map((opt, idx) => ({
      ...opt,
      x: shuffledPositions[idx].x,
      y: shuffledPositions[idx].y,
    }));

    setItems(itemsWithPos);
  };

  // Helper for Level 2 Demonstration Flow
  const triggerTargetDemonstration = (
    targetColorKey: Color3,
    targetFruit: FruitConfig,
    stageItems: InteractiveItem3[]
  ) => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    if (demoTimerRef2.current) clearTimeout(demoTimerRef2.current);

    const comboKey = `${targetColorKey}_${targetFruit.fruitType}`;

    // Check if ALREADY demonstrated
    if (demonstratedTargets.includes(comboKey)) {
      setDemoHighlightItemId(null);
      setIsDemonstrating(false);
      const msg = `Собери ${targetFruit.labelPlural}!`;
      setLumiMessage(msg);
      setLumiState('happy');
      speakLumi(msg, { soundEnabled, force: true });
      return;
    }

    // FIRST TIME ENCOUNTER: Run demonstration
    const sampleItem = stageItems.find(
      (item) => item.color === targetColorKey && item.fruitType === targetFruit.fruitType
    );

    if (!sampleItem) {
      const msg = `Собери ${targetFruit.labelPlural}!`;
      setLumiMessage(msg);
      setLumiState('happy');
      speakLumi(msg, { soundEnabled, force: true });
      return;
    }

    // Highlight sample item and lock input during demo
    setDemoHighlightItemId(sampleItem.id);
    setIsDemonstrating(true);

  // Phase 1: Lumi points at sample item and names it
    const msg1 = `Смотри, вот ${targetFruit.label}.`;
    setLumiMessage(msg1);
    setLumiState('happy');
    speakLumi(msg1, {
      soundEnabled,
      force: true,
      speechKey: `demo1_${comboKey}`,
      onEnd: () => {
        // Phase 2: Lumi asks to remember and find matching
        const msg2 = `Запомни: ${targetFruit.label}. Теперь найди такие же.`;
        setLumiMessage(msg2);
        setLumiState('happy');
        speakLumi(msg2, {
          soundEnabled,
          force: true,
          speechKey: `demo2_${comboKey}`,
          onEnd: () => {
            // Phase 3: Remove highlight and enable user search
            setDemoHighlightItemId(null);
            setIsDemonstrating(false);
            setDemonstratedTargets((prev) =>
              prev.includes(comboKey) ? prev : [...prev, comboKey]
            );
            const msg3 = `Собери ${targetFruit.labelPlural}!`;
            setLumiMessage(msg3);
          },
        });
      },
    });
  };

  // Helper: Generate an 8-round sequence ensuring each of the 4 colors appears twice
  const generateLevel2Sequence = (): Color3[] => {
    const base: Color3[] = ['red', 'yellow', 'green', 'blue', 'red', 'yellow', 'green', 'blue'];
    const shuffled = shuffleArray(base);
    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i] === shuffled[i - 1]) {
        const swapIdx = (i + 2) % shuffled.length;
        [shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i]];
      }
    }
    return shuffled;
  };

  const startLevel2Sequence = (startRound: number = 0) => {
    if (startRound === 0) {
      level2SequenceRef.current = generateLevel2Sequence();
      setHarvestBaskets({ red: 0, yellow: 0, green: 0, blue: 0 });
      setBlueIntroduced(true);
      setFruitStageCompleted(false);
    }
    startLevel2Round(startRound);
  };

  const startLevel2Round = (roundIdx: number) => {
    isLevel2TransitioningRef.current = false;
    level2RoundIndexRef.current = roundIdx;
    setLevel2RoundIndex(roundIdx);

    if (!level2SequenceRef.current || level2SequenceRef.current.length < 8) {
      level2SequenceRef.current = generateLevel2Sequence();
    }

    const targetCol = level2SequenceRef.current[roundIdx] || 'red';
    const targetFruit = FRUIT_CATALOG[targetCol][0];

    setTargetColor(targetCol);
    setTargetFruitType(targetFruit.fruitType);
    setStageCode('2.1_FRUITS_TRANSITION');

    // Progressive difficulty:
    // Rounds 0-2 (1-3): 4 items (2 target + 2 distractors)
    // Rounds 3-5 (4-6): 5 items (2 target + 3 distractors)
    // Rounds 6-7 (7-8): 5-6 items (3 target + 2-3 distractors)
    const targetCount = roundIdx >= 6 ? 3 : 2;
    const distractorCount = roundIdx <= 2 ? 2 : roundIdx <= 5 ? 3 : 2;

    const rawFruits: InteractiveItem3[] = [];

    // Target fruits
    for (let i = 0; i < targetCount; i++) {
      rawFruits.push({
        id: `l2_r${roundIdx}_t${i}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'fruit',
        color: targetCol,
        fruitType: targetFruit.fruitType,
        label: targetFruit.label,
        emoji: targetFruit.emoji,
        x: 0,
        y: 0,
      });
    }

    // Distractor fruits
    const remainingColors = (['red', 'yellow', 'green', 'blue'] as Color3[]).filter((c) => c !== targetCol);
    const shuffledDistColors = shuffleArray([...remainingColors, ...remainingColors]);

    for (let i = 0; i < distractorCount; i++) {
      const distCol = shuffledDistColors[i];
      const distFruit = FRUIT_CATALOG[distCol][0];
      rawFruits.push({
        id: `l2_r${roundIdx}_d${i}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'fruit',
        color: distCol,
        fruitType: distFruit.fruitType,
        label: distFruit.label,
        emoji: distFruit.emoji,
        x: 0,
        y: 0,
      });
    }

    const shuffledFruits = shuffleArray(rawFruits);
    const pos = shuffleArray(STAGE_POSITIONS).slice(0, shuffledFruits.length);
    const positionedItems = shuffledFruits.map((f, i) => ({ ...f, x: pos[i].x, y: pos[i].y }));

    setItems(positionedItems);

    const promptMap: Record<Color3, string> = {
      red: 'Собери всё красное.',
      green: 'Собери всё зелёное.',
      yellow: 'Собери всё жёлтое.',
      blue: 'Собери всё синее.',
    };

    const msg = promptMap[targetCol];
    setLumiMessage(msg);
    setLumiState('happy');
    speakLumi(msg, { soundEnabled, force: true });
  };

  // Stage Setup Engine
  const setupStage = (world: 1 | 2 | 3, code: StageCode3) => {
    isLevel2TransitioningRef.current = false;
    clearAllTimers();
    setDemoHighlightItemId(null);
    setIsDemonstrating(false);

    setCurrentWorld(world);
    setStageCode(code);
    setMaxStageReached((prev) => Math.max(prev, world));
    if (world >= 2) {
      setHasReachedMinimumLevel(true);
    }
    setShowHighlightHint(false);
    setShakingItemId(null);
    setConsecutiveErrors(0);

    // ==========================================
    // WORLD 1: CIRCLES (LEVEL 1: 3 COLORS - RED, YELLOW, GREEN)
    // ==========================================
    if (world === 1) {
      setSelectedCircle(null);
      setLevel1BasketItems({ red: [], yellow: [], green: [], blue: [] });
      setBouncingBasketColor(null);
      setShakingBasketColor(null);

      // Reset onboarding hint only when starting level 1 from the very first stage
      if (code === '1.1_CIRCLES_RED_GREEN') {
        setHasLearnedLevel1Mechanic(false);
      }

      let itemCount = 5;
      if (code === '1.1_CIRCLES_RED_GREEN') itemCount = 5;
      if (code === '1.2_CIRCLES_SHUFFLED') itemCount = 5;
      if (code === '1.3_CIRCLES_THREE') itemCount = 6;
      if (code === '1.4_CIRCLES_COMPLETE') itemCount = 6;

      // Always guarantee red, green, yellow are all present
      const baseColors: Color3[] = ['red', 'green', 'yellow'];
      const extraColorsPool: Color3[] = ['red', 'green', 'yellow', 'red', 'green', 'yellow'];
      const shuffledExtra = shuffleArray(extraColorsPool);
      const combinedColors = shuffleArray([...baseColors, ...shuffledExtra.slice(0, itemCount - 3)]);

      const emojiMap: Record<Color3, string> = { red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵' };

      const generatedItems: InteractiveItem3[] = combinedColors.map((col, idx) => ({
        id: `c1_${code}_${col}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'circle',
        color: col,
        shape: 'circle',
        label: COLOR_HEX_MAP[col].nameRu,
        emoji: emojiMap[col],
        x: 0,
        y: 0,
      }));

      setItems(generatedItems);

      let msg = '';
      let spokenMsg = '';
      if (code === '1.1_CIRCLES_RED_GREEN') {
        msg = 'Давай разложим всё по корзинкам.';
        spokenMsg = 'Давай разложим всё по корзинам.';
      } else if (code === '1.2_CIRCLES_SHUFFLED') {
        msg = 'Снова разложим кружочки по корзинкам!';
        spokenMsg = 'Снова разложим всё по корзинам.';
      } else if (code === '1.3_CIRCLES_THREE') {
        msg = 'Отлично получается! Разложим новые кружочки.';
        spokenMsg = 'Отлично получается. Разложим новые кружочки.';
      } else {
        msg = 'Ещё одно задание! Собери кружочки по корзинкам.';
        spokenMsg = 'Ещё одно задание. Собери всё по корзинам.';
      }

      setLumiMessage(msg);
      setLumiState('happy');
      speakLumi(spokenMsg, { soundEnabled, force: true });
    }

    // ==========================================
    // WORLD 2: FRUITS HARVEST (LEVEL 2: RED, YELLOW, GREEN, BLUE)
    // ==========================================
    else if (world === 2) {
      if (code === '2.6_HARVEST_DONE') {
        setItems([]);
        setFruitStageCompleted(true);
        const msg = 'Ура! Мы отлично собрали урожай!';
        setLumiMessage(msg);
        setLumiState('happy');
        speakLumi(msg, { soundEnabled, force: true, speechKey: 'lvl2_harvest_done_complete' });
      } else {
        startLevel2Sequence(0);
      }
    }

    // ==========================================
    // WORLD 3: HOUSE BUILDING (COLOR + SHAPE)
    // ==========================================
    else if (code === '3.1_BUILDING_INTRO') {
      setBuildingStarted(true);
      houseIndexRef.current = 1;
      setHouseIndex(1);
      usedLevel3CombosRef.current.clear();
      level3SessionTargetsRef.current = {};
      setHouseWalls({ wall1: null, wall2: null, wall3: null, wall4: null, roof: null });
      setStageCode('3.2_WALL_1');
      buildLevel3WallItems('3.2_WALL_1', 'первой стены', 1);
    } else if (code === '3.2_WALL_1') {
      buildLevel3WallItems('3.2_WALL_1', 'первой стены', houseIndexRef.current);
    } else if (code === '3.3_WALL_2') {
      buildLevel3WallItems('3.3_WALL_2', 'второй стены', houseIndexRef.current);
    } else if (code === '3.4_WALL_3') {
      buildLevel3WallItems('3.4_WALL_3', 'третьей стены', houseIndexRef.current);
    } else if (code === '3.5_WALL_4') {
      buildLevel3WallItems('3.5_WALL_4', 'четвёртой стены', houseIndexRef.current);
    } else if (code === '3.6_ROOF') {
      buildLevel3WallItems('3.6_ROOF', 'крыши', houseIndexRef.current);
    } else if (code === '3.7_HOUSE_COMPLETE') {
      setHouseCompleted(true);
      const msg = 'Ура! Мы построили три дома! Ты отлично справился!';
      setLumiMessage(msg);
      setLumiState('happy');
      speakLumi(msg, { soundEnabled, force: true, speechKey: 'house3_complete_final' });
      setItems([]);
    }
  };

  // Guard against empty items state on Level 3
  useEffect(() => {
    if (currentWorld === 3 && stageCode !== '3.7_HOUSE_COMPLETE') {
      if (!items || items.length === 0) {
        console.warn('Level 3 opened with empty items! Generating Wall items immediately.');
        const codeToBuild = stageCode.startsWith('3.') && stageCode !== '3.1_BUILDING_INTRO' ? stageCode : '3.2_WALL_1';
        const wallLabelMap: Record<string, string> = {
          '3.2_WALL_1': 'первой стены',
          '3.3_WALL_2': 'второй стены',
          '3.4_WALL_3': 'третьей стены',
          '3.5_WALL_4': 'четвёртой стены',
          '3.6_ROOF': 'крыши',
        };
        const wallLabel = wallLabelMap[codeToBuild] || 'первой стены';
        if (stageCode === '3.1_BUILDING_INTRO') {
          setStageCode('3.2_WALL_1');
        }
        buildLevel3WallItems(codeToBuild, wallLabel, houseIndexRef.current);
      }
    }
  }, [currentWorld, stageCode, items]);

  // Helper: Restart the entire Game #3 from Level 1 with fresh randomized elements
  const restartWholeGame = () => {
    stopLumiVoice();
    clearAllTimers();
    setSelectedCircle(null);
    setLevel1BasketItems({ red: [], yellow: [], green: [], blue: [] });
    setHasLearnedLevel1Mechanic(false);

    setHarvestBaskets({ red: 0, yellow: 0, green: 0, blue: 0 });
    setBlueIntroduced(false);
    setFruitStageCompleted(false);
    setBlueRecognized(false);
    setDeliveryCompleted(false);
    setTruckState('IDLE');

    houseIndexRef.current = 1;
    setHouseIndex(1);
    usedLevel3CombosRef.current.clear();
    level3SessionTargetsRef.current = {};
    setHouseWalls({ wall1: null, wall2: null, wall3: null, wall4: null, roof: null });
    setBuildingStarted(false);
    setHouseCompleted(false);

    setIsFirstGameSession(false);
    setHasReachedMinimumLevel(true);

    setAttemptsCount(0);
    setCorrectCount(0);
    setErrorsCount(0);
    setConsecutiveErrors(0);
    setMaxStageReached(1);

    setupStage(1, '1.1_CIRCLES_RED_GREEN');
  };

  // Helper: Proceed from Level 2 to Level 3
  const handleContinueToLevel3 = () => {
    stopLumiVoice();
    clearAllTimers();
    const msg = 'Готов построить дом? Давай попробуем!';
    setLumiMessage(msg);
    setLumiState('happy');

    let transitioned = false;
    const doTransition = () => {
      if (transitioned) return;
      transitioned = true;
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      setupStage(3, '3.1_BUILDING_INTRO');
    };

    transitionTimerRef.current = setTimeout(() => {
      doTransition();
    }, 2000);

    speakLumi(msg, {
      soundEnabled,
      force: true,
      speechKey: 'start_level3_prompt',
      onEnd: () => {
        doTransition();
      },
    });
  };

  // Initial stage load
  useEffect(() => {
    setupStage(1, '1.1_CIRCLES_RED_GREEN');
    return () => {
      clearAllTimers();
      stopLumiVoice();
    };
  }, []);

  // Progression Flow Logic
  const advanceStage = (nextCodeOverride?: StageCode3) => {
    const sequence: StageCode3[] = [
      '1.1_CIRCLES_RED_GREEN',
      '1.2_CIRCLES_SHUFFLED',
      '1.3_CIRCLES_THREE',
      '1.4_CIRCLES_COMPLETE',
      '2.1_FRUITS_TRANSITION',
      '2.2_FRUITS_RED',
      '2.3_FRUITS_YELLOW',
      '2.4_FRUITS_ALL',
      '2.5_FRUITS_SHUFFLED',
      '2.6_HARVEST_DONE',
      '3.1_BUILDING_INTRO',
      '3.2_WALL_1',
      '3.3_WALL_2',
      '3.4_WALL_3',
      '3.5_WALL_4',
      '3.6_ROOF',
      '3.7_HOUSE_COMPLETE',
    ];

    const targetCode = nextCodeOverride || sequence[sequence.indexOf(stageCode) + 1] || '3.7_HOUSE_COMPLETE';

    let world: 1 | 2 | 3 = 1;
    if (targetCode.startsWith('2.')) world = 2;
    if (targetCode.startsWith('3.')) world = 3;

    setupStage(world, targetCode);
  };

  // Level 1: Circle Selection Handler
  const handleCircleSelect = (item: InteractiveItem3) => {
    const now = Date.now();
    if (now - lastInputTimestampRef.current < 200) return;
    lastInputTimestampRef.current = now;

    setSelectedCircle(item);
    playSound('click', soundEnabled);

    const colorSpeech: Record<Color3, string> = {
      red: 'Красный',
      green: 'Зелёный',
      yellow: 'Жёлтый',
      blue: 'Синий',
    };

    const shortColorText = colorSpeech[item.color] || COLOR_HEX_MAP[item.color].nameRu;

    // First time onboarding: explain mechanism once
    if (!hasLearnedLevel1Mechanic) {
      const fullMsg = `Выбран ${COLOR_HEX_MAP[item.color].nameRu} кружочек. В какую корзинку его положить?`;
      setLumiMessage(fullMsg);
      speakLumi(`Выбран ${COLOR_HEX_MAP[item.color].nameRu} кружочек. В какую корзину его положить?`, { soundEnabled, force: true });
    } else {
      // Regular gameplay: Lumi only speaks the short color name
      setLumiMessage(`${COLOR_HEX_MAP[item.color].nameRu} кружочек`);
      speakLumi(shortColorText, { soundEnabled, force: true });
    }

    setLumiState('happy');
  };

  // Level 1: Basket Click Handler
  const handleBasketClick = (basketColor: Color3) => {
    const now = Date.now();
    if (now - lastInputTimestampRef.current < 200) return;
    lastInputTimestampRef.current = now;

    if (!selectedCircle) {
      playSound('click', soundEnabled);
      const msg = 'Сначала нажми на цветной кружочек!';
      setLumiMessage(msg);
      speakLumi(msg, { soundEnabled });
      return;
    }

    setAttemptsCount((prev) => prev + 1);

    const circleColor = selectedCircle.color;

    // Correct matching: Circle color matches Basket color
    if (circleColor === basketColor) {
      playSound('correct', soundEnabled);
      setCorrectCount((prev) => prev + 1);
      setConsecutiveErrors(0);

      // Mark onboarding completed after the very first correct placement
      if (!hasLearnedLevel1Mechanic) {
        setHasLearnedLevel1Mechanic(true);
      }

      // Bounce animation for basket
      setBouncingBasketColor(basketColor);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => {
        setBouncingBasketColor(null);
        animTimerRef.current = null;
      }, 500);

      // Add circle to basket items inside level1BasketItems
      setLevel1BasketItems((prev) => ({
        ...prev,
        [basketColor]: [...prev[basketColor], selectedCircle],
      }));

      // Remove from top stage items
      const remaining = items.filter((i) => i.id !== selectedCircle.id);
      setItems(remaining);
      setSelectedCircle(null);

      // Check if mini-task or Level 1 is complete
      if (remaining.length === 0) {
        if (stageCode === '1.4_CIRCLES_COMPLETE') {
          let transitioned = false;
          const doTransition = () => {
            if (transitioned) return;
            transitioned = true;
            if (transitionTimerRef.current) {
              clearTimeout(transitionTimerRef.current);
              transitionTimerRef.current = null;
            }
            advanceStage('2.1_FRUITS_TRANSITION');
          };

          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => {
            const finalMsg = 'Здорово! Мы научились раскладывать цвета!';
            setLumiMessage(finalMsg);
            speakLumi(finalMsg, {
              soundEnabled,
              force: true,
              onEnd: () => {
                doTransition();
              },
            });
            // Fallback timeout in case speech end callback doesn't fire
            transitionTimerRef.current = setTimeout(() => {
              doTransition();
            }, 2500);
          }, 600);
        } else {
          const praiseMsg = 'Отлично.';
          setLumiMessage(praiseMsg);
          setLumiState('happy');
          speakLumi(praiseMsg, { soundEnabled });

          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => {
            advanceStage();
          }, 1200);
        }
      }
    } else {
      // Incorrect matching
      playSound('wrong', soundEnabled);
      setErrorsCount((prev) => prev + 1);
      const newConsecutive = consecutiveErrors + 1;
      setConsecutiveErrors(newConsecutive);

      setShakingItemId(selectedCircle.id);
      setShakingBasketColor(basketColor);
      setTimeout(() => {
        setShakingItemId(null);
        setShakingBasketColor(null);
      }, 500);

      const circleColorName = COLOR_HEX_MAP[circleColor].nameRu;

      let wrongMsg = '';
      let spokenWrongMsg = '';
      if (newConsecutive === 1) {
        wrongMsg = `Посмотри внимательно на цвет. Этот кружочек ${circleColorName}. Найди ${circleColorName} корзинку.`;
        spokenWrongMsg = `Посмотри внимательно на цвет. Этот кружочек ${circleColorName}. Найди ${circleColorName} корзину.`;
      } else {
        wrongMsg = `Посмотри ещё раз: этот кружочек ${circleColorName}. Положи его в ${circleColorName} корзинку!`;
        spokenWrongMsg = `Посмотри ещё раз: этот кружочек ${circleColorName}. Положи его в ${circleColorName} корзину!`;
      }

      setLumiMessage(wrongMsg);
      setLumiState('encouraging');
      speakLumi(spokenWrongMsg, { soundEnabled, force: true });

      // Level 1 never shows rest modal — gives child time to learn mechanics
    }
  };

  // Item Interaction Handler (For Level 2 & 3)
  const handleItemClick = (item: InteractiveItem3) => {
    const now = Date.now();
    if (now - lastInputTimestampRef.current < 250) return;
    lastInputTimestampRef.current = now;

    setAttemptsCount((prev) => prev + 1);

    // Level 2: Harvest Fruits
    if (currentWorld === 2) {
      if (isLevel2TransitioningRef.current || isDemonstrating) return;

      const isTarget = item.color === targetColor;

      if (isTarget) {
        playSound('click', soundEnabled);
        setCorrectCount((prev) => prev + 1);
        setConsecutiveErrors(0);
        if (item.color === 'blue') setBlueRecognized(true);

        // Increment basket count for collected fruit
        setHarvestBaskets((prev) => ({
          ...prev,
          [item.color]: prev[item.color] + 1,
        }));

        const remaining = items.filter((i) => i.id !== item.id);
        setItems(remaining);

        // Check if all TARGET items for the current round have been collected
        const remainingTargets = remaining.filter((i) => i.color === targetColor);

        if (remainingTargets.length === 0) {
          isLevel2TransitioningRef.current = true;
          playSound('correct', soundEnabled);

          const praiseMsg = 'Отлично.';
          setLumiMessage(praiseMsg);
          setLumiState('happy');
          speakLumi(praiseMsg, { soundEnabled, force: true });

          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => {
            isLevel2TransitioningRef.current = false;
            const nextRound = level2RoundIndexRef.current + 1;
            if (nextRound < 8) {
              startLevel2Round(nextRound);
            } else {
              // Complete Level 2!
              setFruitStageCompleted(true);
              setStageCode('2.6_HARVEST_DONE');
              setItems([]);
              const finalMsg = 'Ура! Мы отлично собрали урожай!';
              setLumiMessage(finalMsg);
              setLumiState('happy');
              speakLumi(finalMsg, { soundEnabled, force: true, speechKey: 'lvl2_harvest_done_complete' });
            }
          }, 1000);
        }
      } else {
        // Incorrect fruit tap
        playSound('wrong', soundEnabled);
        setErrorsCount((prev) => prev + 1);
        const newConsecutive = consecutiveErrors + 1;
        setConsecutiveErrors(newConsecutive);
        setShakingItemId(item.id);
        if (animTimerRef.current) clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => {
          setShakingItemId(null);
          animTimerRef.current = null;
        }, 500);

        const targetNeuters: Record<Color3, string> = {
          red: 'красное',
          green: 'зелёное',
          yellow: 'жёлтое',
          blue: 'синее',
        };
        const targetAdjectives: Record<Color3, string> = {
          red: 'красный',
          green: 'зелёный',
          yellow: 'жёлтый',
          blue: 'синий',
        };

        const targetCol = targetColor || 'red';

        let msg = '';
        if (newConsecutive === 1) {
          msg = `Посмотри на цвет. Собери всё ${targetNeuters[targetCol]}.`;
        } else {
          msg = `Найди ${targetAdjectives[targetCol]} цвет.`;
        }

        setLumiMessage(msg);
        setLumiState('encouraging');
        speakLumi(msg, { soundEnabled, force: true });

        if (!isFirstGameSession && hasReachedMinimumLevel && newConsecutive >= 2) {
          setShowRestModal(true);
        }
      }
      return;
    }

    // Level 3: House Building Blocks (Color + Shape)
    if (currentWorld === 3) {
      const isCorrect = item.color === targetColor && item.shape === targetShape;

      if (isCorrect) {
        playSound('correct', soundEnabled);
        setCorrectCount((prev) => prev + 1);
        setConsecutiveErrors(0);
        if (item.color === 'blue') setBlueRecognized(true);

        // Update house wall construction state with selected color
        if (stageCode === '3.2_WALL_1' || stageCode === '3.1_BUILDING_INTRO')
          setHouseWalls((prev) => ({ ...prev, wall1: item.color }));
        if (stageCode === '3.3_WALL_2') setHouseWalls((prev) => ({ ...prev, wall2: item.color }));
        if (stageCode === '3.4_WALL_3') setHouseWalls((prev) => ({ ...prev, wall3: item.color }));
        if (stageCode === '3.5_WALL_4') setHouseWalls((prev) => ({ ...prev, wall4: item.color }));
        if (stageCode === '3.6_ROOF') setHouseWalls((prev) => ({ ...prev, roof: item.color }));

        if (stageCode === '3.6_ROOF') {
          const curHIndex = houseIndexRef.current;

          if (curHIndex === 1) {
            const msg = 'Ура! Первый дом готов! А теперь построим ещё один!';
            setLumiMessage(msg);
            setLumiState('happy');
            speakLumi(msg, { soundEnabled, force: true, speechKey: 'house1_done' });

            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = setTimeout(() => {
              houseIndexRef.current = 2;
              setHouseIndex(2);
              setHouseWalls({ wall1: null, wall2: null, wall3: null, wall4: null, roof: null });
              setStageCode('3.2_WALL_1');
              buildLevel3WallItems('3.2_WALL_1', 'первой стены', 2);
            }, 1200);
          } else if (curHIndex === 2) {
            const msg = 'Отлично! Построим ещё один?';
            setLumiMessage(msg);
            setLumiState('happy');
            speakLumi(msg, { soundEnabled, force: true, speechKey: 'house2_done' });

            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = setTimeout(() => {
              houseIndexRef.current = 3;
              setHouseIndex(3);
              setHouseWalls({ wall1: null, wall2: null, wall3: null, wall4: null, roof: null });
              setStageCode('3.2_WALL_1');
              buildLevel3WallItems('3.2_WALL_1', 'первой стены', 3);
            }, 1200);
          } else {
            const msg = 'Ура! Мы построили три дома! Ты отлично справился!';
            setLumiMessage(msg);
            setLumiState('happy');
            speakLumi(msg, { soundEnabled, force: true, speechKey: 'house3_done' });

            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = setTimeout(() => {
              setHouseCompleted(true);
              setIsFirstGameSession(false);
              setHasReachedMinimumLevel(true);
              setStageCode('3.7_HOUSE_COMPLETE');
              setItems([]);
            }, 1200);
          }
        } else {
          const praiseMsg = 'Готово.';
          setLumiMessage(praiseMsg);
          setLumiState('happy');
          speakLumi(praiseMsg, { soundEnabled });

          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => advanceStage(), 1200);
        }
      } else {
        // Incorrect block tap
        playSound('wrong', soundEnabled);
        setErrorsCount((prev) => prev + 1);
        const newConsecutive = consecutiveErrors + 1;
        setConsecutiveErrors(newConsecutive);
        setShakingItemId(item.id);
        setTimeout(() => setShakingItemId(null), 500);

        let msg = '';
        if (targetColor && targetShape) {
          msg = getShapeColorHint(
            { color: targetColor, shape: targetShape },
            { color: item.color, shape: item.shape },
            newConsecutive
          );
        } else {
          const targetLabelText = targetColor && targetShape ? getDynamicItemLabel(targetColor, targetShape) : 'деталь';
          msg = `Посмотри на цвет и форму. Нам нужен ${targetLabelText}.`;
        }

        setLumiMessage(msg);
        setLumiState('encouraging');
        speakLumi(msg, { soundEnabled, force: true });

        // Rest modal ONLY if NOT first game session AND child reached minimum level AND 2+ consecutive errors
        if (!isFirstGameSession && hasReachedMinimumLevel && newConsecutive >= 2) {
          setShowRestModal(true);
        }
      }
    }
  };

  return (
    <div className="relative w-full max-w-full bg-gradient-to-b from-sky-100 via-amber-50 to-orange-100 flex flex-col p-1.5 xs:p-2 sm:p-4 select-none gap-2 sm:gap-4 overflow-x-hidden box-border">
      {/* Top Header Bar */}
      <div className="shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-md border border-amber-200 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onReturnToLumiWorld}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs sm:text-sm active:scale-95 cursor-pointer min-h-[38px]"
          >
            ← В Мир Луми
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-amber-900 bg-amber-100 px-2.5 sm:px-3 py-1 rounded-lg">
              {currentWorld === 3 ? `Уровень 3 • Дом ${houseIndex} из 3` : `Уровень ${currentWorld} из 3`}
            </span>
          </div>
        </div>

        {/* Progress Pills */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${currentWorld >= 1 ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-gray-200'}`} />
          <div className={`w-5 sm:w-8 h-1 rounded ${currentWorld >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`} />
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${currentWorld >= 2 ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-gray-200'}`} />
          <div className={`w-5 sm:w-8 h-1 rounded ${currentWorld >= 3 ? 'bg-amber-500' : 'bg-gray-200'}`} />
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${currentWorld >= 3 ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-gray-200'}`} />
        </div>
      </div>

      {/* Lumi Character & Instruction Box (Dedicated Block in Normal Flow) */}
      <div className="shrink-0 w-full max-w-5xl mx-auto z-10 my-0.5 sm:my-1">
        <LumiCharacter state={lumiState} message={lumiMessage} />
      </div>

      {/* Main Playing Stage Area (Starts Strictly BELOW Lumi Box) */}
      <div className="w-full max-w-5xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 border-amber-200/80 shadow-md p-2.5 xs:p-3 sm:p-6 relative flex flex-col">
        {/* Dynamic Stage Content */}
        <div className="w-full">
          {/* LEVEL 1: CIRCLES SORTING INTO BASKETS */}
          {currentWorld === 1 && (
            <div className="w-full flex flex-col justify-between items-center gap-3 sm:gap-6">
              {/* Active Selection Onboarding Banner (Shown ONLY during first onboarding step) */}
              {selectedCircle && !hasLearnedLevel1Mechanic && (
                <div className="text-xs sm:text-sm font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-3 sm:px-4 py-1.5 rounded-full shadow-xs animate-bounce flex items-center gap-1.5 text-center">
                  <span>Выбран {COLOR_HEX_MAP[selectedCircle.color].nameRu} кружочек!</span>
                  <span>Нажми на {selectedCircle.color === 'red' ? 'красную' : selectedCircle.color === 'yellow' ? 'жёлтую' : 'зелёную'} корзинку 👇</span>
                </div>
              )}

              {/* Interactive Circles Section */}
              <div className="w-full flex flex-wrap items-center justify-center gap-2.5 xs:gap-3 sm:gap-6 py-1.5 sm:py-2">
                {items.map((item) => {
                  const isSelected = selectedCircle?.id === item.id;
                  const isShaking = shakingItemId === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleCircleSelect(item)}
                      animate={
                        isShaking
                          ? { x: [-10, 10, -8, 8, 0] }
                          : isSelected
                          ? { scale: [1, 1.12, 1.08] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.3 }}
                      className={`p-2 xs:p-3 sm:p-4 rounded-2xl bg-white shadow-md border-2 hover:scale-105 active:scale-95 transition-transform flex flex-col items-center justify-center gap-1 sm:gap-1.5 min-w-[85px] xs:min-w-[100px] sm:min-w-[115px] cursor-pointer ${
                        isSelected
                          ? 'ring-4 ring-amber-400 border-amber-500 bg-amber-50 shadow-xl'
                          : 'border-amber-200'
                      } ${isShaking ? 'ring-4 ring-red-400' : ''}`}
                    >
                      <RenderShapeSVG shape="circle" color={item.color} size={56} />
                      <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                        {item.label}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                          Выбран
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Baskets Bar */}
              <div className="w-full pt-3 sm:pt-4 border-t border-amber-200/60 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-6">
                {(['red', 'yellow', 'green'] as Color3[]).map((c) => {
                  const isSelectedTarget = selectedCircle && selectedCircle.color === c;
                  const isBouncing = bouncingBasketColor === c;
                  const isShaking = shakingBasketColor === c;
                  const collectedItems = level1BasketItems[c] || [];

                  return (
                    <motion.button
                      key={c}
                      onClick={() => handleBasketClick(c)}
                      animate={
                        isBouncing
                          ? { scale: [1, 1.15, 1], y: [0, -8, 0] }
                          : isShaking
                          ? { x: [-8, 8, -6, 6, 0] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.3 }}
                      className={`relative flex-1 min-w-0 sm:min-w-[100px] sm:max-w-[140px] flex flex-col items-center justify-between p-2 sm:p-4 rounded-xl sm:rounded-3xl border-3 shadow-md transition-all cursor-pointer ${
                        isSelectedTarget
                          ? 'ring-4 ring-amber-400 bg-amber-50/90 shadow-lg scale-102'
                          : 'bg-white/90 hover:scale-102 active:scale-95'
                      } ${isShaking ? 'ring-4 ring-red-400 bg-red-50' : ''}`}
                      style={{
                        borderColor: COLOR_HEX_MAP[c].fill,
                      }}
                    >
                      {/* Basket Header */}
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-2">
                        <span className="text-lg xs:text-xl sm:text-2xl">🧺</span>
                        <span className="text-[11px] xs:text-xs sm:text-sm font-extrabold capitalize text-gray-800">
                          {c === 'red' ? 'Красная' : c === 'yellow' ? 'Жёлтая' : 'Зелёная'}
                        </span>
                      </div>

                      {/* Collected Circles inside Basket */}
                      <div className="w-full min-h-[44px] sm:min-h-[50px] p-1.5 xs:p-2 bg-white/80 rounded-xl sm:rounded-2xl border border-gray-200/80 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 shadow-inner">
                        {collectedItems.length === 0 ? (
                          <span className="text-[10px] xs:text-[11px] font-bold text-gray-400 italic">Пусто</span>
                        ) : (
                          collectedItems.map((item, idx) => (
                            <motion.div
                              key={item.id || idx}
                              initial={{ scale: 0, y: -10 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              <RenderShapeSVG shape="circle" color={c} size={28} />
                            </motion.div>
                          ))
                        )}
                      </div>

                      {/* Helper indicator when circle is active (ONLY during first onboarding step) */}
                      {selectedCircle && !hasLearnedLevel1Mechanic && (
                        <div
                          className={`mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs ${
                            isSelectedTarget
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isSelectedTarget ? 'Сюда 👇' : 'Сюда'}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 2: FRUITS HARVEST & LEVEL 2 COMPLETION */}
          {currentWorld === 2 && (
            <div className="w-full flex flex-col justify-between items-center gap-6">
              {stageCode === '2.6_HARVEST_DONE' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg flex flex-col items-center justify-center gap-4 sm:gap-5 bg-white/95 p-5 sm:p-7 rounded-3xl shadow-xl border-3 border-amber-300 my-1"
                >
                  {/* Header */}
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="text-4xl sm:text-5xl animate-bounce">🌾 🧺 🎉</div>
                    <h2 className="text-xl sm:text-2xl font-black text-amber-950">
                      УРОВЕНЬ 2 ПРОЙДЕН!
                    </h2>
                    <p className="text-sm sm:text-base font-extrabold text-amber-800">
                      Урожай собран!
                    </p>
                  </div>

                  {/* Harvest Baskets Summary */}
                  <div className="w-full bg-amber-50/90 rounded-2xl border border-amber-200 p-3 sm:p-4 flex flex-wrap justify-center items-center gap-2 sm:gap-3">
                    {(['red', 'yellow', 'green', 'blue'] as Color3[]).map((c) => (
                      <div
                        key={c}
                        className="flex flex-col items-center px-3 py-2 rounded-xl bg-white border border-amber-200 shadow-xs min-w-[75px]"
                      >
                        <RenderFruitSVG fruitType={FRUIT_CATALOG[c][0].fruitType} color={c} size={28} />
                        <span className="text-xs font-bold text-gray-700 capitalize mt-1">
                          {COLOR_HEX_MAP[c].nameRu}
                        </span>
                        <span className="text-xs font-black text-amber-600">
                          📦 {harvestBaskets[c]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-full bg-amber-100/90 rounded-2xl p-2.5 sm:p-3 border border-amber-300 flex items-center justify-around text-xs sm:text-sm font-extrabold text-amber-950">
                    <div className="flex items-center gap-1.5 text-green-700">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      <span>🌈 1</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-700">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      <span>🌾 2</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-800/60">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold">3</span>
                      <span>🏠 3</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1">
                    <button
                      onClick={handleContinueToLevel3}
                      className="w-full sm:w-auto px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Продолжить</span>
                      <span>➔</span>
                    </button>

                    <button
                      onClick={() => startLevel2Sequence(0)}
                      className="w-full sm:w-auto px-5 py-3.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🔄</span>
                      <span>Сыграть ещё раз</span>
                    </button>

                    <button
                      onClick={() => {
                        stopLumiVoice();
                        onReturnToLumiWorld();
                      }}
                      className="w-full sm:w-auto px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer"
                    >
                      В Мир Луми
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Interactive Fruits Section */}
                  <div className="w-full flex flex-wrap items-center justify-center gap-2.5 xs:gap-3 sm:gap-6 py-1.5 sm:py-2">
                    {items.map((item) => {
                      const isDemo = demoHighlightItemId === item.id;
                      const isShaking = shakingItemId === item.id;

                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          animate={
                            isShaking
                              ? { x: [-10, 10, -8, 8, 0] }
                              : isDemo
                              ? { scale: [1, 1.15, 1.08, 1.15, 1.08], y: [0, -6, 0] }
                              : { scale: 1 }
                          }
                          transition={
                            isDemo
                              ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                              : { duration: 0.4 }
                          }
                          className={`p-2.5 xs:p-3 sm:p-4 rounded-2xl bg-white shadow-md border-2 transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 min-w-[85px] xs:min-w-[100px] sm:min-w-[110px] cursor-pointer ${
                            isDemo
                              ? 'ring-4 ring-amber-400 border-amber-500 bg-amber-50 shadow-xl z-20'
                              : 'border-amber-200 hover:scale-105 active:scale-95'
                          } ${isShaking ? 'ring-4 ring-red-400' : ''}`}
                        >
                          <RenderFruitSVG fruitType={item.fruitType || 'apple'} color={item.color} size={54} />
                          <span className="text-xs sm:text-sm font-extrabold text-amber-950">{item.label}</span>
                          {isDemo && (
                            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                              Образец ✨
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Harvest Baskets Bar */}
                  <div className="w-full pt-3 sm:pt-4 border-t border-amber-200/60 grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-4">
                    {(['red', 'yellow', 'green', 'blue'] as Color3[]).map((c) => (
                      <div
                        key={c}
                        className="flex flex-col items-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/90 border-2 shadow-xs min-w-0"
                        style={{ borderColor: COLOR_HEX_MAP[c].fill }}
                      >
                        <div className="text-[11px] xs:text-xs font-bold text-amber-950 capitalize">{COLOR_HEX_MAP[c].nameRu}</div>
                        <div className="text-xs xs:text-sm font-extrabold text-amber-600 mt-0.5">
                          📦 {harvestBaskets[c]}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* LEVEL 3: HOUSE BUILDING (COLOR + SHAPE) */}
          {currentWorld === 3 && (
            <div className="w-full flex flex-col items-center gap-4 sm:gap-5">
              {/* House Building Progress Indicator */}
              <div className="flex items-center justify-between w-full max-w-md bg-amber-100/90 border border-amber-300 px-4 py-2 rounded-2xl shadow-xs">
                <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                  {stageCode === '3.7_HOUSE_COMPLETE' ? '🎉 Все 3 дома построены!' : `🏠 Строим Дом ${houseIndex} из 3`}
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((hIdx) => (
                    <div
                      key={hIdx}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        hIdx < houseIndex || stageCode === '3.7_HOUSE_COMPLETE'
                          ? 'bg-green-500 text-white shadow-xs'
                          : hIdx === houseIndex
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse shadow-md'
                          : 'bg-amber-200 text-amber-700'
                      }`}
                    >
                      {hIdx < houseIndex || stageCode === '3.7_HOUSE_COMPLETE' ? '✓' : hIdx}
                    </div>
                  ))}
                </div>
              </div>

              {/* House Construction Canvas Area */}
              <div className="relative w-64 h-52 bg-sky-50 rounded-2xl border-2 border-sky-200 shadow-inner flex flex-col items-center justify-end p-2 overflow-hidden shrink-0">
                {/* Roof (Only appears when roof task is completed or being placed) */}
                {houseWalls.roof && (
                  <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ borderBottomColor: COLOR_HEX_MAP[houseWalls.roof].fill }}
                    className="w-0 h-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-b-[60px] drop-shadow-md z-10"
                  />
                )}

                {/* House Walls Structure (Progressively built wall-by-wall) */}
                <div className="w-48 h-32 bg-amber-100 border-2 border-amber-300 rounded-b-xl relative flex flex-wrap">
                  {houseWalls.wall1 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ backgroundColor: COLOR_HEX_MAP[houseWalls.wall1].fill }}
                      className="w-1/2 h-1/2 border border-amber-200/50 rounded-tl-lg flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    >
                      🧱 Стена 1
                    </motion.div>
                  )}
                  {houseWalls.wall2 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ backgroundColor: COLOR_HEX_MAP[houseWalls.wall2].fill }}
                      className="w-1/2 h-1/2 border border-amber-200/50 rounded-tr-lg flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    >
                      🧱 Стена 2
                    </motion.div>
                  )}
                  {houseWalls.wall3 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ backgroundColor: COLOR_HEX_MAP[houseWalls.wall3].fill }}
                      className="w-1/2 h-1/2 border border-amber-200/50 rounded-bl-lg flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    >
                      🧱 Стена 3
                    </motion.div>
                  )}
                  {houseWalls.wall4 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ backgroundColor: COLOR_HEX_MAP[houseWalls.wall4].fill }}
                      className="w-1/2 h-1/2 border border-amber-200/50 rounded-br-lg flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    >
                      🧱 Стена 4
                    </motion.div>
                  )}

                  {/* Window */}
                  {(houseWalls.wall1 || houseWalls.wall2 || houseWalls.wall3 || houseWalls.wall4) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-sky-200 border-2 border-amber-800 rounded-md shadow-inner flex items-center justify-center z-10">
                      🪟
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Task Block Options Grid */}
              {items.length > 0 && (
                <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-2 border-t border-amber-200/60">
                  {items.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      animate={shakingItemId === item.id ? { x: [-10, 10, -8, 8, 0] } : { scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`p-2.5 sm:p-3.5 rounded-2xl bg-white shadow-md border-2 border-amber-200 hover:scale-105 active:scale-95 transition-transform flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        shakingItemId === item.id ? 'ring-4 ring-red-400' : ''
                      }`}
                    >
                      <RenderShapeSVG shape={item.shape || 'square'} color={item.color} size={46} />
                      <span className="font-extrabold text-amber-950 text-xs text-center leading-tight">
                        {getDynamicItemLabel(item.color, item.shape)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* House Celebration Completion */}
              {stageCode === '3.7_HOUSE_COMPLETE' && (
                <div className="flex flex-col items-center gap-3.5 bg-white/95 p-5 sm:p-6 rounded-3xl shadow-xl border-3 border-amber-300 w-full max-w-md my-2">
                  <div className="text-4xl sm:text-5xl animate-bounce">🎉 🏡 🌟</div>
                  <h2 className="text-lg sm:text-xl font-black text-amber-950 text-center leading-snug">
                    Ура! Игра №3 полностью пройдена!
                  </h2>
                  <p className="text-sm font-extrabold text-amber-800 text-center">
                    Мы собрали урожай и построили три замечательных дома!
                  </p>

                  {/* Level Progress Indicator */}
                  <div className="w-full bg-amber-100/90 rounded-2xl p-2.5 sm:p-3 border border-amber-300 flex items-center justify-around text-xs sm:text-sm font-extrabold text-amber-950 my-1">
                    <div className="flex items-center gap-1.5 text-green-700">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      <span>🌈 1</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-700">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      <span>🌾 2</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-700">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      <span>🏠 3</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1">
                    <button
                      onClick={restartWholeGame}
                      className="w-full sm:w-auto px-5 py-3.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🔄</span>
                      <span>Сыграть ещё раз</span>
                    </button>

                    <button
                      onClick={() => {
                        stopLumiVoice();
                        onReturnToLumiWorld();
                      }}
                      className="w-full sm:w-auto px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 cursor-pointer"
                    >
                      В Мир Луми
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gentle Rest Modal after 2 consecutive mistakes */}
      <AnimatePresence>
        {showRestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-amber-200 flex flex-col items-center text-center gap-4">
              <LumiCharacter state="rest" size="medium" showBubble={false} />
              <div className="text-lg font-bold text-amber-950">
                Кажется, мы сегодня немного устали. Давай отдохнём и попробуем потом?
              </div>
              <div className="flex gap-3 w-full justify-center mt-2">
                <button
                  onClick={() => {
                    setShowRestModal(false);
                    onReturnToLumiWorld();
                  }}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-sm"
                >
                  В Мир Луми
                </button>
                <button
                  onClick={() => {
                    setShowRestModal(false);
                    setConsecutiveErrors(0);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Попробовать ещё раз
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
