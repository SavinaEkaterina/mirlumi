import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { LumiAsset } from './LumiAsset';
import { LumiAssetColor } from '../visualSystem/LumiAssetRegistry';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { playSound } from '../utils/audio';

const nameToAssetType = (name: string): string => {
  const map: Record<string, string> = {
    'диван': 'sofa',
    'мяч': 'ball',
    'книжка': 'book',
    'мишка': 'teddy',
    'машинка': 'car',
    'кружка': 'cup',
    'цветок': 'flower',
    'картина': 'picture',
    'подушка': 'pillow',
    'зайчик': 'bunny',
    'заяц': 'bunny',
    'лампа': 'lamp',
    'часы': 'clock',
    'рюкзак': 'backpack',
    'звезда': 'star',
    'звёздочка': 'star',
  };
  return map[name.toLowerCase()] || name.toLowerCase();
};

export type GameColor = 'red' | 'blue' | 'yellow' | 'green';

export interface ColorMeta {
  id: GameColor;
  name: string; // Красный
  adjectiveOne: string; // красное
  adjectiveTwo: string; // красных
  emoji: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hex: string;
}

const COLOR_MAP: Record<GameColor, ColorMeta> = {
  red: {
    id: 'red',
    name: 'Красный',
    adjectiveOne: 'красное',
    adjectiveTwo: 'красных',
    emoji: '🔴',
    bgClass: 'bg-red-500',
    borderClass: 'border-red-600',
    textClass: 'text-red-600',
    hex: '#EF4444',
  },
  blue: {
    id: 'blue',
    name: 'Синий',
    adjectiveOne: 'синее',
    adjectiveTwo: 'синих',
    emoji: '🔵',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-600',
    textClass: 'text-blue-600',
    hex: '#3B82F6',
  },
  yellow: {
    id: 'yellow',
    name: 'Жёлтый',
    adjectiveOne: 'жёлтое',
    adjectiveTwo: 'жёлтых',
    emoji: '🟡',
    bgClass: 'bg-amber-400',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-600',
    hex: '#EAB308',
  },
  green: {
    id: 'green',
    name: 'Зелёный',
    adjectiveOne: 'зелёное',
    adjectiveTwo: 'зелёных',
    emoji: '🟢',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-600',
    textClass: 'text-emerald-600',
    hex: '#10B981',
  },
};

export interface RoomItem {
  id: string;
  name: string; // диван, мяч, книжка, и т.д.
  color: GameColor;
  icon: string; // emoji icon
  top: string; // CSS position in room
  left: string;
  locationLabel: string;
}

export interface MemoryChoiceItem {
  id: string;
  name: string;
  color: GameColor;
  icon: string;
  isTarget: boolean; // whether this item was one of the 3 target items found in the room
}

export interface Level3RoundData {
  targetColor: GameColor;
  items: RoomItem[]; // 5 room items
  distractors: MemoryChoiceItem[]; // 3 distractor items for memory test
}

// Preset rounds for Level 1, 2, and 3
const LEVEL_1_ROUNDS: { targetColor: GameColor; items: RoomItem[] }[] = [
  {
    targetColor: 'red',
    items: [
      { id: '1-1', name: 'диван', color: 'red', icon: '🛋️', top: '22%', left: '18%', locationLabel: 'у стены' },
      { id: '1-2', name: 'мяч', color: 'blue', icon: '⚽', top: '70%', left: '72%', locationLabel: 'на коврике' },
      { id: '1-3', name: 'книжка', color: 'yellow', icon: '📚', top: '35%', left: '78%', locationLabel: 'на полке' },
    ],
  },
  {
    targetColor: 'blue',
    items: [
      { id: '2-1', name: 'мишка', color: 'blue', icon: '🧸', top: '65%', left: '22%', locationLabel: 'на полу' },
      { id: '2-2', name: 'машинка', color: 'red', icon: '🚗', top: '38%', left: '48%', locationLabel: 'на столе' },
      { id: '2-3', name: 'часы', color: 'green', icon: '⏰', top: '18%', left: '75%', locationLabel: 'на стене' },
    ],
  },
  {
    targetColor: 'yellow',
    items: [
      { id: '3-1', name: 'лампа', color: 'yellow', icon: '💡', top: '32%', left: '18%', locationLabel: 'на тумбочке' },
      { id: '3-2', name: 'диван', color: 'green', icon: '🛋️', top: '55%', left: '75%', locationLabel: 'у стены' },
      { id: '3-3', name: 'кружка', color: 'blue', icon: '☕', top: '42%', left: '50%', locationLabel: 'на столе' },
      { id: '3-4', name: 'мяч', color: 'red', icon: '⚽', top: '72%', left: '45%', locationLabel: 'на ковре' },
    ],
  },
  {
    targetColor: 'green',
    items: [
      { id: '4-1', name: 'цветок', color: 'green', icon: '🪴', top: '25%', left: '80%', locationLabel: 'на подоконнике' },
      { id: '4-2', name: 'книжка', color: 'red', icon: '📚', top: '28%', left: '18%', locationLabel: 'на полке' },
      { id: '4-3', name: 'рюкзак', color: 'yellow', icon: '🎒', top: '68%', left: '25%', locationLabel: 'у двери' },
      { id: '4-4', name: 'мишка', color: 'blue', icon: '🧸', top: '62%', left: '55%', locationLabel: 'на ковре' },
    ],
  },
  {
    targetColor: 'red',
    items: [
      { id: '5-1', name: 'картина', color: 'red', icon: '🖼️', top: '15%', left: '48%', locationLabel: 'на стене' },
      { id: '5-2', name: 'лампа', color: 'blue', icon: '💡', top: '35%', left: '22%', locationLabel: 'на столе' },
      { id: '5-3', name: 'цветок', color: 'yellow', icon: '🪴', top: '68%', left: '75%', locationLabel: 'на полу' },
      { id: '5-4', name: 'мяч', color: 'green', icon: '⚽', top: '72%', left: '32%', locationLabel: 'на ковре' },
    ],
  },
];

const LEVEL_2_ROUNDS: { targetColor: GameColor; items: RoomItem[] }[] = [
  {
    targetColor: 'red',
    items: [
      { id: 'l2-1-1', name: 'диван', color: 'red', icon: '🛋️', top: '22%', left: '20%', locationLabel: 'у стены' },
      { id: 'l2-1-2', name: 'книжка', color: 'blue', icon: '📚', top: '32%', left: '78%', locationLabel: 'на полке' },
      { id: 'l2-1-3', name: 'машинка', color: 'red', icon: '🚗', top: '68%', left: '55%', locationLabel: 'на коврике' },
      { id: 'l2-1-4', name: 'мяч', color: 'yellow', icon: '⚽', top: '72%', left: '22%', locationLabel: 'на полу' },
    ],
  },
  {
    targetColor: 'blue',
    items: [
      { id: 'l2-2-1', name: 'мишка', color: 'blue', icon: '🧸', top: '62%', left: '18%', locationLabel: 'на полу' },
      { id: 'l2-2-2', name: 'кружка', color: 'red', icon: '☕', top: '38%', left: '50%', locationLabel: 'на столе' },
      { id: 'l2-2-3', name: 'рюкзак', color: 'blue', icon: '🎒', top: '65%', left: '72%', locationLabel: 'на ковре' },
      { id: 'l2-2-4', name: 'часы', color: 'green', icon: '⏰', top: '18%', left: '75%', locationLabel: 'на стене' },
      { id: 'l2-2-5', name: 'диван', color: 'yellow', icon: '🛋️', top: '25%', left: '22%', locationLabel: 'у стены' },
    ],
  },
  {
    targetColor: 'yellow',
    items: [
      { id: 'l2-3-1', name: 'книжка', color: 'yellow', icon: '📚', top: '28%', left: '18%', locationLabel: 'на полке' },
      { id: 'l2-3-2', name: 'мяч', color: 'yellow', icon: '⚽', top: '70%', left: '42%', locationLabel: 'на ковре' },
      { id: 'l2-3-3', name: 'машинка', color: 'blue', icon: '🚗', top: '65%', left: '78%', locationLabel: 'на полу' },
      { id: 'l2-3-4', name: 'цветок', color: 'green', icon: '🪴', top: '25%', left: '80%', locationLabel: 'на подоконнике' },
      { id: 'l2-3-5', name: 'картина', color: 'red', icon: '🖼️', top: '15%', left: '48%', locationLabel: 'на стене' },
    ],
  },
  {
    targetColor: 'green',
    items: [
      { id: 'l2-4-1', name: 'цветок', color: 'green', icon: '🪴', top: '22%', left: '20%', locationLabel: 'на подоконнике' },
      { id: 'l2-4-2', name: 'диван', color: 'red', icon: '🛋️', top: '55%', left: '75%', locationLabel: 'у стены' },
      { id: 'l2-4-3', name: 'мишка', color: 'green', icon: '🧸', top: '68%', left: '48%', locationLabel: 'на ковре' },
      { id: 'l2-4-4', name: 'лампа', color: 'yellow', icon: '💡', top: '35%', left: '48%', locationLabel: 'на столе' },
      { id: 'l2-4-5', name: 'кружка', color: 'blue', icon: '☕', top: '38%', left: '78%', locationLabel: 'на полке' },
    ],
  },
  {
    targetColor: 'blue',
    items: [
      { id: 'l2-5-1', name: 'часы', color: 'blue', icon: '⏰', top: '18%', left: '48%', locationLabel: 'на стене' },
      { id: 'l2-5-2', name: 'мяч', color: 'red', icon: '⚽', top: '72%', left: '20%', locationLabel: 'на полу' },
      { id: 'l2-5-3', name: 'кружка', color: 'blue', icon: '☕', top: '38%', left: '22%', locationLabel: 'на столе' },
      { id: 'l2-5-4', name: 'книжка', color: 'yellow', icon: '📚', top: '30%', left: '78%', locationLabel: 'на полке' },
      { id: 'l2-5-5', name: 'диван', color: 'green', icon: '🛋️', top: '62%', left: '72%', locationLabel: 'у стены' },
    ],
  },
];

const LEVEL_3_ROUNDS: Level3RoundData[] = [
  {
    targetColor: 'red',
    items: [
      { id: 'l3-1-1', name: 'диван', color: 'red', icon: '🛋️', top: '22%', left: '18%', locationLabel: 'у стены' },
      { id: 'l3-1-2', name: 'машинка', color: 'red', icon: '🚗', top: '68%', left: '32%', locationLabel: 'на ковре' },
      { id: 'l3-1-3', name: 'книжка', color: 'red', icon: '📚', top: '30%', left: '78%', locationLabel: 'на полке' },
      { id: 'l3-1-4', name: 'мяч', color: 'blue', icon: '⚽', top: '70%', left: '72%', locationLabel: 'на полу' },
      { id: 'l3-1-5', name: 'мишка', color: 'yellow', icon: '🧸', top: '60%', left: '18%', locationLabel: 'у кровати' },
    ],
    distractors: [
      { id: 'd3-1-1', name: 'мяч', color: 'blue', icon: '⚽', isTarget: false },
      { id: 'd3-1-2', name: 'мишка', color: 'yellow', icon: '🧸', isTarget: false },
      { id: 'd3-1-3', name: 'цветок', color: 'green', icon: '🪴', isTarget: false },
    ],
  },
  {
    targetColor: 'blue',
    items: [
      { id: 'l3-2-1', name: 'мишка', color: 'blue', icon: '🧸', top: '62%', left: '18%', locationLabel: 'на полу' },
      { id: 'l3-2-2', name: 'кружка', color: 'blue', icon: '☕', top: '38%', left: '48%', locationLabel: 'на столе' },
      { id: 'l3-2-3', name: 'рюкзак', color: 'blue', icon: '🎒', top: '68%', left: '72%', locationLabel: 'на ковре' },
      { id: 'l3-2-4', name: 'диван', color: 'red', icon: '🛋️', top: '22%', left: '20%', locationLabel: 'у стены' },
      { id: 'l3-2-5', name: 'лампа', color: 'yellow', icon: '💡', top: '28%', left: '80%', locationLabel: 'на тумбочке' },
    ],
    distractors: [
      { id: 'd3-2-1', name: 'диван', color: 'red', icon: '🛋️', isTarget: false },
      { id: 'd3-2-2', name: 'лампа', color: 'yellow', icon: '💡', isTarget: false },
      { id: 'd3-2-3', name: 'часы', color: 'green', icon: '⏰', isTarget: false },
    ],
  },
  {
    targetColor: 'yellow',
    items: [
      { id: 'l3-3-1', name: 'лампа', color: 'yellow', icon: '💡', top: '32%', left: '18%', locationLabel: 'на тумбочке' },
      { id: 'l3-3-2', name: 'книжка', color: 'yellow', icon: '📚', top: '28%', left: '78%', locationLabel: 'на полке' },
      { id: 'l3-3-3', name: 'мяч', color: 'yellow', icon: '⚽', top: '72%', left: '48%', locationLabel: 'на ковре' },
      { id: 'l3-3-4', name: 'машинка', color: 'green', icon: '🚗', top: '68%', left: '18%', locationLabel: 'на полу' },
      { id: 'l3-3-5', name: 'цветок', color: 'blue', icon: '🪴', top: '22%', left: '48%', locationLabel: 'на окне' },
    ],
    distractors: [
      { id: 'd3-3-1', name: 'машинка', color: 'green', icon: '🚗', isTarget: false },
      { id: 'd3-3-2', name: 'цветок', color: 'blue', icon: '🪴', isTarget: false },
      { id: 'd3-3-3', name: 'диван', color: 'red', icon: '🛋️', isTarget: false },
    ],
  },
  {
    targetColor: 'green',
    items: [
      { id: 'l3-4-1', name: 'цветок', color: 'green', icon: '🪴', top: '22%', left: '18%', locationLabel: 'на подоконнике' },
      { id: 'l3-4-2', name: 'мишка', color: 'green', icon: '🧸', top: '65%', left: '48%', locationLabel: 'на коврике' },
      { id: 'l3-4-3', name: 'часы', color: 'green', icon: '⏰', top: '18%', left: '78%', locationLabel: 'на стене' },
      { id: 'l3-4-4', name: 'диван', color: 'red', icon: '🛋️', top: '55%', left: '78%', locationLabel: 'у стены' },
      { id: 'l3-4-5', name: 'кружка', color: 'yellow', icon: '☕', top: '38%', left: '48%', locationLabel: 'на столе' },
    ],
    distractors: [
      { id: 'd3-4-1', name: 'диван', color: 'red', icon: '🛋️', isTarget: false },
      { id: 'd3-4-2', name: 'кружка', color: 'yellow', icon: '☕', isTarget: false },
      { id: 'd3-4-3', name: 'мяч', color: 'blue', icon: '⚽', isTarget: false },
    ],
  },
  {
    targetColor: 'red',
    items: [
      { id: 'l3-5-1', name: 'картина', color: 'red', icon: '🖼️', top: '15%', left: '48%', locationLabel: 'на стене' },
      { id: 'l3-5-2', name: 'диван', color: 'red', icon: '🛋️', top: '22%', left: '18%', locationLabel: 'у стены' },
      { id: 'l3-5-3', name: 'мяч', color: 'red', icon: '⚽', top: '70%', left: '72%', locationLabel: 'на коврике' },
      { id: 'l3-5-4', name: 'книжка', color: 'blue', icon: '📚', top: '30%', left: '78%', locationLabel: 'на полке' },
      { id: 'l3-5-5', name: 'мишка', color: 'yellow', icon: '🧸', top: '62%', left: '20%', locationLabel: 'на полу' },
    ],
    distractors: [
      { id: 'd3-5-1', name: 'книжка', color: 'blue', icon: '📚', isTarget: false },
      { id: 'd3-5-2', name: 'мишка', color: 'yellow', icon: '🧸', isTarget: false },
      { id: 'd3-5-3', name: 'цветок', color: 'green', icon: '🪴', isTarget: false },
    ],
  },
];

interface ColorCodeGameProps {
  onReturnToLumiWorld: () => void;
}

export const ColorCodeGame: React.FC<ColorCodeGameProps> = ({ onReturnToLumiWorld }) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [roundIndex, setRoundIndex] = useState<number>(0);

  // Main UI View States
  const [viewState, setViewState] = useState<
    'INTRO' | 'PLAY' | 'LEVEL_SUCCESS' | 'REST_PROPOSAL' | 'GAME_COMPLETE'
  >('INTRO');

  // Found items tracking in current round
  const [foundItemIds, setFoundItemIds] = useState<string[]>([]);

  // Level 3 Memory Check Phase
  const [isLevel3MemoryTest, setIsLevel3MemoryTest] = useState<boolean>(false);
  const [memoryChoices, setMemoryChoices] = useState<MemoryChoiceItem[]>([]);
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);

  // Errors & Hint tracking
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [showVisualHint, setShowVisualHint] = useState<boolean>(false);
  const [hintCountdown, setHintCountdown] = useState<number>(5);

  // Level 3 limited hint (showing room for 4 seconds after 2 errors in memory test)
  const [showLevel3MemoryHintRoom, setShowLevel3MemoryHintRoom] = useState<boolean>(false);

  // Animation lock during feedback
  const [isProcessingTap, setIsProcessingTap] = useState<boolean>(false);
  const [lastFoundItemId, setLastFoundItemId] = useState<string | null>(null);

  // Lumi State
  const [lumiEmotion, setLumiEmotion] = useState<'happy' | 'thinking' | 'encouraging' | 'cheering'>('happy');
  const [lumiMessage, setLumiMessage] = useState<string>(
    'Привет! Помоги мне найти потерянные цвета в моём домике!'
  );

  // Speech lock ref to prevent rapid clicks overlapping speech
  const isSpeakingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to safely speak without overlapping rapid clicks
  const safeSpeak = (text: string, force = false, onEndCallback?: () => void) => {
    stopLumiVoice();
    isSpeakingRef.current = true;
    speakLumi(text, {
      force,
      onEnd: () => {
        isSpeakingRef.current = false;
        if (onEndCallback) onEndCallback();
      },
    });
  };

  useEffect(() => {
    return () => {
      stopLumiVoice();
      isSpeakingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentLevel1or2Round = (level === 1 ? LEVEL_1_ROUNDS : LEVEL_2_ROUNDS)[roundIndex] || LEVEL_1_ROUNDS[0];
  const currentLevel3Round = LEVEL_3_ROUNDS[roundIndex] || LEVEL_3_ROUNDS[0];

  const targetColor = level === 3 ? currentLevel3Round.targetColor : currentLevel1or2Round.targetColor;
  const targetColorMeta = COLOR_MAP[targetColor];

  const roomItems = level === 3 ? currentLevel3Round.items : currentLevel1or2Round.items;

  // Target count needed for level
  const targetCount = level === 1 ? 1 : level === 2 ? 2 : 3;

  // Start a Round
  const startRound = (lvl: 1 | 2 | 3, rIdx: number) => {
    stopLumiVoice();
    if (timerRef.current) clearInterval(timerRef.current);

    setViewState('PLAY');
    setFoundItemIds([]);
    setIsLevel3MemoryTest(false);
    setMemoryChoices([]);
    setSelectedMemoryIds([]);
    setShowVisualHint(false);
    setShowLevel3MemoryHintRoom(false);
    setIsProcessingTap(false);
    setLastFoundItemId(null);

    const cColor = lvl === 3 ? LEVEL_3_ROUNDS[rIdx].targetColor : (lvl === 1 ? LEVEL_1_ROUNDS : LEVEL_2_ROUNDS)[rIdx].targetColor;
    const cMeta = COLOR_MAP[cColor];

    setLumiEmotion('thinking');

    let msg = '';
    if (lvl === 1) {
      msg = `Ой! Я потеряла ${cMeta.name.toLowerCase()} цвет. Найди ${cMeta.adjectiveOne} в домике!`;
    } else if (lvl === 2) {
      msg = `Ой! Теперь найди два ${cMeta.adjectiveTwo} предмета в моей комнате!`;
    } else {
      msg = `В моей комнате спрятались три ${cMeta.adjectiveTwo} предмета. Найди их. Запомни, что ты нашёл!`;
    }

    setLumiMessage(msg);
    safeSpeak(msg);
  };

  const handleStartLevel = (lvl: 1 | 2 | 3) => {
    setLevel(lvl);
    setRoundIndex(0);
    setConsecutiveErrors(0);
    startRound(lvl, 0);
  };

  // Trigger 4-5 second visual hint overlay for Level 1 & 2
  const triggerVisualHintOverlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setShowVisualHint(true);
    setHintCountdown(5);
    setLumiEmotion('encouraging');

    const msg = `Давай вспомним, какой цвет мы ищем. Мы ищем ${targetColorMeta.name.toLowerCase()} цвет!`;
    setLumiMessage(msg);
    safeSpeak(`Давай вспомним, какой цвет мы ищем.`);

    timerRef.current = setInterval(() => {
      setHintCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowVisualHint(false);
          setLumiEmotion('happy');
          setLumiMessage(`Ищи ${targetColorMeta.adjectiveOne} в домике!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Setup Level 3 Memory Check Phase
  const prepareLevel3MemoryCheck = () => {
    const l3Data = LEVEL_3_ROUNDS[roundIndex];

    // Collect 3 target found items
    const targetFoundItems: MemoryChoiceItem[] = l3Data.items
      .filter((it) => it.color === l3Data.targetColor)
      .map((it) => ({
        id: it.id,
        name: it.name,
        color: it.color,
        icon: it.icon,
        isTarget: true,
      }));

    // Combine with 3 distractors
    const allChoices = [...targetFoundItems, ...l3Data.distractors];

    // Deterministically/cleanly shuffle choices
    const shuffled = [...allChoices].sort(() => 0.5 - Math.random());

    setMemoryChoices(shuffled);
    setSelectedMemoryIds([]);
    setIsLevel3MemoryTest(true);
    setShowLevel3MemoryHintRoom(false);

    setLumiEmotion('thinking');
    const questionMsg = 'Что ты нашёл? Покажи их!';
    setLumiMessage(questionMsg);
    safeSpeak(questionMsg);
  };

  // Tapping an Item in the Room (Search Phase)
  const handleItemTap = (item: RoomItem) => {
    if (isProcessingTap || showVisualHint || isLevel3MemoryTest || isSpeakingRef.current) return;

    // Already found
    if (foundItemIds.includes(item.id)) return;

    if (item.color === targetColor) {
      // CORRECT ITEM TAPPED!
      playSound('correct');
      const updatedFound = [...foundItemIds, item.id];
      setFoundItemIds(updatedFound);
      setConsecutiveErrors(0);
      setLastFoundItemId(item.id);

      if (updatedFound.length < targetCount) {
        // Need more items in level 2 or 3
        setLumiEmotion('cheering');
        const countWord = updatedFound.length === 1 ? 'один' : 'два';
        const msg = `Нашёл ${countWord}! Ищи ещё!`;
        setLumiMessage(msg);
        safeSpeak(`Нашёл ${countWord}! Ищи ещё!`);
      } else {
        // ALL TARGET ITEMS FOUND FOR THIS ROUND!
        setIsProcessingTap(true);
        setLumiEmotion('cheering');

        if (level === 1) {
          const msg = `Нашёл! Это ${targetColorMeta.adjectiveOne}!`;
          setLumiMessage(msg);
          safeSpeak(msg);

          setTimeout(() => {
            advanceRound();
          }, 1400);
        } else if (level === 2) {
          const msg = `Отлично! Ты нашёл два ${targetColorMeta.adjectiveTwo} предмета!`;
          setLumiMessage(msg);
          safeSpeak(msg);

          setTimeout(() => {
            advanceRound();
          }, 1500);
        } else if (level === 3) {
          // LEVEL 3 transition to Memory Check
          // Step 2: Lumi praises, then prompt to remember
          const msg1 = 'Отлично! Ты нашёл все три.';
          setLumiMessage(msg1);
          safeSpeak(msg1, true, () => {
            setLumiEmotion('thinking');
            const msg2 = 'Запомни их. Сейчас проверим!';
            setLumiMessage(msg2);
            safeSpeak(msg2, true, () => {
              prepareLevel3MemoryCheck();
              setIsProcessingTap(false);
            });
          });
        }
      }
    } else {
      // INCORRECT COLOR ITEM TAPPED!
      playSound('wrong');
      const newErrCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrCount);

      if (newErrCount >= 5) {
        // 5 consecutive errors -> propose rest
        setViewState('REST_PROPOSAL');
        setLumiEmotion('thinking');
        const restMsg = 'Ты хорошо постарался. Давай немного отдохнём?';
        setLumiMessage(restMsg);
        safeSpeak(restMsg);
      } else if (newErrCount === 2) {
        // 2 consecutive errors -> show visual hint swatch
        triggerVisualHintOverlay();
      } else {
        // 1st error -> gentle reminder
        setLumiEmotion('thinking');
        const errMsg = `Этот предмет другого цвета. Посмотри ещё раз, мы ищем ${targetColorMeta.adjectiveOne}.`;
        setLumiMessage(errMsg);
        safeSpeak(`Этот предмет другого цвета. Посмотри ещё раз.`);
      }
    }
  };

  // Level 3 Tapping a Card in 6-Item Memory Choice Phase
  const handleMemoryChoiceTap = (choiceItem: MemoryChoiceItem) => {
    if (isProcessingTap || showLevel3MemoryHintRoom || isSpeakingRef.current) return;

    // Already selected correct item
    if (selectedMemoryIds.includes(choiceItem.id)) return;

    if (choiceItem.isTarget) {
      // CORRECT MEMORY CHOICE!
      playSound('correct');
      const updatedSelected = [...selectedMemoryIds, choiceItem.id];
      setSelectedMemoryIds(updatedSelected);
      setConsecutiveErrors(0);

      if (updatedSelected.length < 3) {
        setLumiEmotion('cheering');
        const msg = 'Правильно! Что ещё ты нашёл?';
        setLumiMessage(msg);
        safeSpeak('Правильно! Что ещё ты нашёл?');
      } else {
        // ALL 3 CORRECT MEMORY ITEMS SELECTED!
        setIsProcessingTap(true);
        setLumiEmotion('cheering');
        const praiseMsg = 'Отлично! Ты всё запомнил!';
        setLumiMessage(praiseMsg);
        safeSpeak(praiseMsg);

        setTimeout(() => {
          advanceRound();
        }, 1600);
      }
    } else {
      // INCORRECT MEMORY CHOICE!
      playSound('wrong');
      const newErrCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrCount);

      if (newErrCount >= 5) {
        setViewState('REST_PROPOSAL');
        setLumiEmotion('thinking');
        const restMsg = 'Ты хорошо постарался. Давай немного отдохнём?';
        setLumiMessage(restMsg);
        safeSpeak(restMsg);
      } else if (newErrCount === 2) {
        // 2 errors in memory test -> show original room with found items for 4 seconds as limited hint
        setShowLevel3MemoryHintRoom(true);
        setLumiEmotion('encouraging');
        const hintMsg = 'Давай вспомним ещё раз.';
        setLumiMessage(hintMsg);
        safeSpeak(hintMsg, true, () => {
          setTimeout(() => {
            setShowLevel3MemoryHintRoom(false);
            setLumiEmotion('thinking');
            const returnMsg = 'Посмотри ещё раз. Вспомни, что ты нашёл.';
            setLumiMessage(returnMsg);
            safeSpeak(returnMsg);
          }, 2500);
        });
      } else {
        setLumiEmotion('thinking');
        const errMsg = 'Посмотри ещё раз. Вспомни, что ты нашёл.';
        setLumiMessage(errMsg);
        safeSpeak(errMsg);
      }
    }
  };

  // Advance to next round or level success
  const advanceRound = () => {
    const roundsList = level === 3 ? LEVEL_3_ROUNDS : level === 1 ? LEVEL_1_ROUNDS : LEVEL_2_ROUNDS;
    if (roundIndex < roundsList.length - 1) {
      setRoundIndex(roundIndex + 1);
      startRound(level, roundIndex + 1);
    } else {
      // LEVEL PASSED!
      if (level === 1) {
        setViewState('LEVEL_SUCCESS');
        setLumiEmotion('cheering');
        speakLumi('Уровень 1 пройден!');
      } else if (level === 2) {
        setViewState('LEVEL_SUCCESS');
        setLumiEmotion('cheering');
        speakLumi('Уровень 2 пройден!');
      } else {
        // GAME FINALE!
        setViewState('GAME_COMPLETE');
        setLumiEmotion('cheering');
        speakLumi(
          'Ты помог мне найти все потерянные цвета! Теперь ты умеешь замечать цвет даже среди разных предметов!'
        );
      }
    }
  };

  const handleContinueNextLevel = () => {
    if (level === 1) handleStartLevel(2);
    else if (level === 2) handleStartLevel(3);
  };

  const handleRetryAfterRest = () => {
    setConsecutiveErrors(0);
    startRound(level, roundIndex);
  };

  const handleRestartGame = () => {
    setConsecutiveErrors(0);
    handleStartLevel(1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center select-none py-2 px-3 sm:px-4">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={onReturnToLumiWorld}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-sm px-3.5 py-2 rounded-2xl border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <span>◀</span>
          <span>В Мир Луми</span>
        </button>

        <div className="bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-2xl font-black text-xs sm:text-sm border border-amber-500 shadow-xs">
          🔎 ЛУМИ ИЩЕТ ЦВЕТ
        </div>
      </div>

      {/* Lumi Character Speech Box */}
      <div className="w-full mb-3">
        <LumiCharacter state={lumiEmotion} message={lumiMessage} />
      </div>

      {/* VIEW STATE: INTRO */}
      {viewState === 'INTRO' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-lg text-center my-4"
        >
          <div className="text-5xl mb-3">🏡 🔎 🛋️</div>
          <h2 className="text-2xl font-black text-amber-950 mb-2">Луми ищет цвет</h2>
          <p className="text-stone-700 text-sm sm:text-base font-semibold mb-3">
            В домике Луми потерялись цвета! Помоги ей внимательно осмотреть комнату и найти нужные предметы.
          </p>
          <p className="text-amber-900 text-xs sm:text-sm font-bold mb-6 bg-amber-50 p-3 rounded-2xl border border-amber-200">
            👀 Ищи предмет именно по цвету, а не по форме!
          </p>

          <button
            onClick={() => handleStartLevel(1)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg border-2 border-emerald-600 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>ПОМОЧЬ ЛУМИ</span>
            <span>➔</span>
          </button>
        </motion.div>
      )}

      {/* VIEW STATE: PLAY (ROOM / MEMORY CHECK CONTAINER) */}
      {viewState === 'PLAY' && (
        <div className="w-full flex flex-col items-center">
          {/* Progress Bar & Header */}
          <div className="w-full bg-stone-200 h-3 rounded-full mb-2 overflow-hidden border border-stone-300">
            <div
              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((roundIndex + 1) / 5) * 100}%` }}
            />
          </div>

          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
              Уровень {level} • Раунд {roundIndex + 1} из 5
            </span>

            {/* Target Badge (Hidden during memory check) */}
            {!isLevel3MemoryTest && (
              <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                <span className="text-xs font-bold text-amber-950">ИЩЕМ:</span>
                <span className={`w-3.5 h-3.5 rounded-full ${targetColorMeta.bgClass}`} />
                <span className="text-xs font-black text-stone-900 uppercase">
                  {targetColorMeta.name}
                </span>
              </div>
            )}
          </div>

          {/* VISUAL HINT OVERLAY (2 Errors Hint on Level 1 & 2) */}
          <AnimatePresence>
            {showVisualHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full bg-white border-4 border-amber-400 rounded-3xl p-5 my-2 text-center shadow-2xl flex flex-col items-center gap-3 z-30"
              >
                <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  💡 Наш цвет ({hintCountdown} с)
                </div>

                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl ${targetColorMeta.bgClass} border-4 ${targetColorMeta.borderClass} shadow-xl flex items-center justify-center`}
                >
                  <LumiAsset type="circle" color={targetColorMeta.id as LumiAssetColor} size="large" className="w-20 h-20 sm:w-24 sm:h-24" />
                </div>

                <div className="text-2xl font-black text-stone-800">
                  {targetColorMeta.name.toUpperCase()} ЦВЕТ
                </div>

                <p className="text-xs font-bold text-stone-600">
                  Посмотри ещё раз на комнату и найди этот цвет!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LEVEL 3 MEMORY TEST: LIMITED ROOM HINT (4 SECONDS) */}
          {isLevel3MemoryTest && showLevel3MemoryHintRoom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-amber-400 shadow-md overflow-hidden p-2 my-1 box-border"
            >
              <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-xl z-20 shadow-xs">
                💡 Вспомни предметы!
              </div>

              {/* Room items showing original found targets */}
              {roomItems.map((item) => {
                const isFound = foundItemIds.includes(item.id);
                const colorMeta = COLOR_MAP[item.color];

                return (
                  <div
                    key={item.id}
                    style={{ top: item.top, left: item.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[56px] min-h-[56px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center ${
                      colorMeta.bgClass
                    } ${colorMeta.borderClass} ${
                      isFound ? 'ring-4 ring-yellow-300 ring-offset-2 scale-110 opacity-100' : 'opacity-40'
                    }`}
                  >
                    <LumiAsset type={nameToAssetType(item.name)} color={item.color as LumiAssetColor} size="small" className="w-10 h-10 sm:w-12 sm:h-12" />
                    <span className="text-[9px] font-extrabold text-white bg-black/40 px-1 rounded mt-0.5">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* LEVEL 3 MEMORY TEST: 6 ITEMS GRID */}
          {isLevel3MemoryTest && !showLevel3MemoryHintRoom && (
            <div className="w-full bg-white rounded-3xl p-4 sm:p-6 border-3 border-amber-300 shadow-md flex flex-col items-center my-2">
              <div className="text-stone-800 font-extrabold text-base sm:text-lg mb-4 text-center">
                🧠 Выбери 3 предмета, которые ты только что нашёл в комнате:
              </div>

              {/* 6 Large Item Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-lg">
                {memoryChoices.map((choice) => {
                  const isSelected = selectedMemoryIds.includes(choice.id);

                  return (
                    <motion.button
                      key={choice.id}
                      onClick={() => handleMemoryChoiceTap(choice)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative min-h-[100px] sm:min-h-[110px] rounded-2xl p-3 border-3 transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-400 shadow-md'
                          : 'bg-stone-50 border-stone-300 hover:border-amber-400 hover:bg-amber-50/50 shadow-xs'
                      }`}
                    >
                      <LumiAsset type={nameToAssetType(choice.name)} color={choice.color as LumiAssetColor} size="medium" className="w-14 h-14 sm:w-16 sm:h-16 mb-1" />
                      <span className="text-xs sm:text-sm font-black text-stone-800 capitalize">
                        {choice.name}
                      </span>

                      {/* Checkmark when selected */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full border-2 border-white font-black text-xs flex items-center justify-center shadow-md"
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEARCH PHASE: INTERACTIVE ROOM STAGE */}
          {!showVisualHint && !isLevel3MemoryTest && (
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-amber-300 shadow-md overflow-hidden p-2 box-border">
              {/* Room Decor Wall & Floor Backdrop */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                {/* Wallpaper Stripes */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#fef3c7_1px,transparent_1px)] bg-[size:24px_100%]" />
                {/* Floor Line */}
                <div className="absolute bottom-0 w-full h-1/3 bg-amber-200/60 border-t-2 border-amber-300" />
                {/* Window */}
                <div className="absolute top-[10%] left-[42%] w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-amber-400 bg-sky-200/80 flex items-center justify-center text-2xl shadow-inner">
                  ☁️
                </div>
                {/* Sofa / Bed */}
                <div className="absolute bottom-[28%] left-[12%] w-36 h-16 rounded-t-2xl bg-amber-300/60 border-2 border-amber-400" />
                {/* Desk / Table */}
                <div className="absolute bottom-[28%] right-[15%] w-32 h-14 bg-amber-200 border-2 border-amber-400 rounded-lg" />
                {/* Rug */}
                <div className="absolute bottom-[8%] left-[25%] w-1/2 h-16 rounded-full bg-orange-200/70 border-2 border-amber-300" />
              </div>

              {/* ROOM ITEMS PLACED SPATIALLY */}
              {roomItems.map((item) => {
                const isFound = foundItemIds.includes(item.id);
                const colorMeta = COLOR_MAP[item.color];
                const isLastFound = lastFoundItemId === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleItemTap(item)}
                    style={{ top: item.top, left: item.left }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    animate={
                      isLastFound
                        ? { scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }
                        : { scale: isFound ? 1.05 : 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[60px] min-h-[60px] p-2.5 rounded-2xl shadow-md border-3 transition-all cursor-pointer flex flex-col items-center justify-center z-10 ${
                      colorMeta.bgClass
                    } ${colorMeta.borderClass} ${
                      isFound
                        ? 'ring-4 ring-yellow-300 ring-offset-2 opacity-95 scale-105'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {/* Item Lumi Asset */}
                    <LumiAsset type={nameToAssetType(item.name)} color={item.color as LumiAssetColor} size="medium" className="w-12 h-12 sm:w-16 sm:h-16" />

                    {/* Item Label */}
                    <span className="text-[10px] font-extrabold text-white bg-black/40 px-1.5 py-0.5 rounded-md mt-0.5 capitalize">
                      {item.name}
                    </span>

                    {/* Found Badge Checkmark */}
                    {isFound && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full border-2 border-white font-black text-xs flex items-center justify-center shadow-md"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW STATE: LEVEL SUCCESS */}
      {viewState === 'LEVEL_SUCCESS' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-b from-amber-400 to-amber-500 rounded-3xl p-6 border-4 border-amber-600 shadow-xl text-center text-amber-950 my-4"
        >
          <div className="text-5xl mb-2">🌟 🎉 🔎</div>
          <h2 className="text-2xl font-black mb-2">Уровень {level} пройден!</h2>
          <p className="text-sm font-bold text-amber-900 mb-6">
            Молодец! Ты отличный помощник для Луми!
          </p>

          <button
            onClick={handleContinueNextLevel}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xl py-4 rounded-2xl shadow-md border-2 border-emerald-700 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>ПРОДОЛЖИТЬ</span>
            <span>➔</span>
          </button>
        </motion.div>
      )}

      {/* VIEW STATE: REST PROPOSAL */}
      {viewState === 'REST_PROPOSAL' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-amber-50 rounded-3xl p-6 border-4 border-amber-300 shadow-xl text-center my-4"
        >
          <div className="text-4xl mb-2">☕ 🌸</div>
          <h2 className="text-xl font-black text-amber-950 mb-2">
            Ты хорошо постарался. Давай немного отдохнём?
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onReturnToLumiWorld}
              className="flex-1 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 font-extrabold text-base py-3.5 rounded-2xl cursor-pointer border border-stone-300"
            >
              Отдохнуть
            </button>
            <button
              onClick={handleRetryAfterRest}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-base py-3.5 rounded-2xl cursor-pointer border border-emerald-600"
            >
              Попробовать ещё
            </button>
          </div>
        </motion.div>
      )}

      {/* VIEW STATE: GAME COMPLETE (FINALE WITH HAPPY DANCING LUMI) */}
      {viewState === 'GAME_COMPLETE' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 text-white p-6 rounded-3xl shadow-2xl border-4 border-pink-300 text-center my-4"
        >
          <div className="text-5xl mb-2 animate-bounce">💃 🏆 🏡</div>
          <h2 className="text-2xl font-black mb-2">
            Ты помог мне найти все потерянные цвета!
          </h2>
          <p className="text-pink-100 font-extrabold text-base mb-6">
            Теперь ты умеешь замечать цвет даже среди разных предметов!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRestartGame}
              className="flex-1 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-black text-lg py-3.5 px-4 rounded-2xl shadow-md border-2 border-amber-500 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>СЫГРАТЬ ЕЩЁ РАЗ</span>
              <span>🔄</span>
            </button>

            <button
              onClick={onReturnToLumiWorld}
              className="flex-1 bg-white hover:bg-slate-100 active:bg-slate-200 text-indigo-950 font-black text-lg py-3.5 px-4 rounded-2xl shadow-md border-2 border-indigo-200 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>В МИР ЛУМИ</span>
              <span>🌍</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
