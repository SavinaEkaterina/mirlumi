import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { LumiAsset } from './LumiAsset';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { playSound } from '../utils/audio';

export type OddItemType =
  | 'apple'
  | 'pear'
  | 'banana'
  | 'orange'
  | 'watermelon'
  | 'carrot'
  | 'cucumber'
  | 'tomato'
  | 'dog'
  | 'cat'
  | 'rabbit'
  | 'fish'
  | 'bird'
  | 'car'
  | 'bus'
  | 'bicycle'
  | 'plane'
  | 'ball'
  | 'bear'
  | 'kite'
  | 'balloon'
  | 'sun'
  | 'moon'
  | 'star'
  | 'cloud'
  | 'tree'
  | 'flower';

export interface OddItem {
  id: string;
  name: string;
  type: OddItemType;
  isGroupMember: boolean; // true if belongs to main group, false if odd item
  ballColor?: string;
}

export interface OddRoundConfig {
  categoryName: string; // e.g. "Фрукты"
  groupDescription: string; // e.g. "Яблоко, груша — это фрукты"
  oddDescription: string; // e.g. "Машина — это транспорт, а остальные — фрукты"
  items: OddItem[];
}

interface OddOneOutGameProps {
  onReturnToLumiWorld: () => void;
}

// Vector Graphics Renderer for Items connected to LumiAsset Registry
const ItemVector: React.FC<{ type: OddItemType; ballColor?: string; className?: string }> = ({
  type,
  ballColor,
  className = 'w-20 h-20 sm:w-24 sm:h-24',
}) => {
  let mappedType: string = type;
  if (type === 'bear') mappedType = 'teddy';
  if (type === 'plane') mappedType = 'airplane';
  if (type === 'rabbit') mappedType = 'bunny';

  let color: 'red' | 'blue' | 'yellow' | 'green' = 'yellow';
  if (ballColor) {
    const bc = ballColor.toLowerCase();
    if (bc.includes('3b82f6') || bc.includes('blue') || bc.includes('синий') || bc.includes('голубой')) color = 'blue';
    else if (bc.includes('eab308') || bc.includes('yellow') || bc.includes('f59e0b') || bc.includes('желт') || bc.includes('жёлт')) color = 'yellow';
    else if (bc.includes('10b981') || bc.includes('green') || bc.includes('22c55e') || bc.includes('зелен') || bc.includes('зелён')) color = 'green';
    else if (bc.includes('ef4444') || bc.includes('red') || bc.includes('красн')) color = 'red';
  } else if (type === 'star') {
    color = 'yellow';
  }

  return (
    <div className={`${className} flex items-center justify-center p-1`}>
      <LumiAsset type={mappedType} color={color} size="medium" className="w-full h-full object-contain" />
    </div>
  );
};

// CATEGORY DEFINITIONS FOR DYNAMIC ROUND GENERATION
export interface CategoryDef {
  id: string;
  name: string; // "Фрукты"
  descriptionType: string; // "фрукты"
  items: {
    name: string;
    type: OddItemType;
    ballColor?: string;
    itemTypeDescription: string; // "фрукт"
  }[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'fruits',
    name: 'Фрукты',
    descriptionType: 'фрукты',
    items: [
      { name: 'Яблоко', type: 'apple', itemTypeDescription: 'фрукт' },
      { name: 'Груша', type: 'pear', itemTypeDescription: 'фрукт' },
      { name: 'Банан', type: 'banana', itemTypeDescription: 'фрукт' },
      { name: 'Апельсин', type: 'orange', itemTypeDescription: 'фрукт' },
      { name: 'Арбуз', type: 'watermelon', itemTypeDescription: 'фрукт' },
    ],
  },
  {
    id: 'animals',
    name: 'Животные',
    descriptionType: 'животные',
    items: [
      { name: 'Собачка', type: 'dog', itemTypeDescription: 'животное' },
      { name: 'Кошка', type: 'cat', itemTypeDescription: 'животное' },
      { name: 'Зайчик', type: 'rabbit', itemTypeDescription: 'животное' },
      { name: 'Птичка', type: 'bird', itemTypeDescription: 'птица' },
      { name: 'Рыбка', type: 'fish', itemTypeDescription: 'рыба' },
    ],
  },
  {
    id: 'transport',
    name: 'Транспорт',
    descriptionType: 'транспорт',
    items: [
      { name: 'Машинка', type: 'car', itemTypeDescription: 'транспорт' },
      { name: 'Автобус', type: 'bus', itemTypeDescription: 'транспорт' },
      { name: 'Велосипед', type: 'bicycle', itemTypeDescription: 'транспорт' },
      { name: 'Самолёт', type: 'plane', itemTypeDescription: 'транспорт' },
    ],
  },
  {
    id: 'toys',
    name: 'Игрушки',
    descriptionType: 'игрушки',
    items: [
      { name: 'Красный мяч', type: 'ball', ballColor: '#EF4444', itemTypeDescription: 'игрушка' },
      { name: 'Синий мяч', type: 'ball', ballColor: '#3B82F6', itemTypeDescription: 'игрушка' },
      { name: 'Мишка', type: 'bear', itemTypeDescription: 'игрушка' },
      { name: 'Воздушный змей', type: 'kite', itemTypeDescription: 'игрушка' },
      { name: 'Шарик', type: 'balloon', itemTypeDescription: 'игрушка' },
    ],
  },
  {
    id: 'vegetables',
    name: 'Овощи',
    descriptionType: 'овощи',
    items: [
      { name: 'Морковка', type: 'carrot', itemTypeDescription: 'овощ' },
      { name: 'Огурец', type: 'cucumber', itemTypeDescription: 'овощ' },
      { name: 'Помидор', type: 'tomato', itemTypeDescription: 'овощ' },
    ],
  },
  {
    id: 'sky',
    name: 'Объекты неба',
    descriptionType: 'объекты неба',
    items: [
      { name: 'Солнце', type: 'sun', itemTypeDescription: 'небесный объект' },
      { name: 'Луна', type: 'moon', itemTypeDescription: 'небесный объект' },
      { name: 'Звезда', type: 'star', itemTypeDescription: 'небесный объект' },
      { name: 'Облако', type: 'cloud', itemTypeDescription: 'облако' },
    ],
  },
  {
    id: 'nature',
    name: 'Растения',
    descriptionType: 'растения',
    items: [
      { name: 'Дерево', type: 'tree', itemTypeDescription: 'растение' },
      { name: 'Цветок', type: 'flower', itemTypeDescription: 'растение' },
    ],
  },
];

// Helper to shuffle array in place cleanly
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Dynamic Round Generator Function
export function generateLevelRounds(level: 1 | 2 | 3, roundCount = 5): OddRoundConfig[] {
  const rounds: OddRoundConfig[] = [];

  // Determine item count range per round based on level
  // Level 1: 3 to 4 items
  // Level 2: 4 to 5 items
  // Level 3: 5 to 6 items
  const minItems = level === 1 ? 3 : level === 2 ? 4 : 5;
  const maxItems = level === 1 ? 4 : level === 2 ? 5 : 6;

  // Shuffle categories to get distinct main categories for rounds
  const availableCategories = shuffleArray(CATEGORIES);

  for (let r = 0; r < roundCount; r++) {
    // Pick main category
    const mainCategory = availableCategories[r % availableCategories.length];

    // Pick odd category (must be different from mainCategory)
    const otherCategories = CATEGORIES.filter((c) => c.id !== mainCategory.id);
    const oddCategory = otherCategories[Math.floor(Math.random() * otherCategories.length)];

    // How many total items in this round?
    const itemCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
    const groupItemCount = itemCount - 1;

    // Pick group items from mainCategory without duplicates
    const shuffledGroupPool = shuffleArray(mainCategory.items);
    const selectedGroupRaw = [];
    for (let i = 0; i < groupItemCount; i++) {
      selectedGroupRaw.push(shuffledGroupPool[i % shuffledGroupPool.length]);
    }

    // Pick 1 odd item from oddCategory
    const shuffledOddPool = shuffleArray(oddCategory.items);
    const selectedOddRaw = shuffledOddPool[0];

    // Build OddItem objects
    const groupItems: OddItem[] = selectedGroupRaw.map((raw, idx) => ({
      id: `group-${r}-${idx}-${Math.random()}`,
      name: raw.name,
      type: raw.type,
      ballColor: raw.ballColor,
      isGroupMember: true,
    }));

    const oddItem: OddItem = {
      id: `odd-${r}-${Math.random()}`,
      name: selectedOddRaw.name,
      type: selectedOddRaw.type,
      ballColor: selectedOddRaw.ballColor,
      isGroupMember: false,
    };

    // Combine and shuffle item order completely
    const allItems = shuffleArray([...groupItems, oddItem]);

    const groupNamesStr = groupItems.map((g) => g.name).join(', ');

    const roundConfig: OddRoundConfig = {
      categoryName: mainCategory.name,
      groupDescription: `${groupNamesStr} — это ${mainCategory.descriptionType}`,
      oddDescription: `${oddItem.name} — это ${selectedOddRaw.itemTypeDescription}, а остальные — ${mainCategory.descriptionType}`,
      items: allItems,
    };

    rounds.push(roundConfig);
  }

  return rounds;
}

export const OddOneOutGame: React.FC<OddOneOutGameProps> = ({ onReturnToLumiWorld }) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [rounds, setRounds] = useState<OddRoundConfig[]>(() => generateLevelRounds(1));

  // View phase
  const [viewState, setViewState] = useState<
    'INTRO' | 'PLAY' | 'LEVEL_SUCCESS' | 'REST_PROPOSAL' | 'GAME_COMPLETE'
  >('INTRO');

  // Level 3 verbal explanation state
  const [level3ExplanationPhase, setLevel3ExplanationPhase] = useState<boolean>(false);

  // Error Tracking
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [roundErrorCount, setRoundErrorCount] = useState<number>(0);
  const [showVisualHint, setShowVisualHint] = useState<boolean>(false);
  const [hintTimer, setHintTimer] = useState<number>(5);

  // Lumi state
  const [lumiEmotion, setLumiEmotion] = useState<'happy' | 'thinking' | 'encouraging' | 'cheering'>('happy');
  const [lumiMessage, setLumiMessage] = useState<string>('Привет! Давай найдём предмет, который не подходит!');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopLumiVoice();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start a Round
  const startRound = (lvl: 1 | 2 | 3, rIdx: number, activeRounds?: OddRoundConfig[]) => {
    stopLumiVoice();
    if (timerRef.current) clearInterval(timerRef.current);

    setViewState('PLAY');
    setLevel3ExplanationPhase(false);
    setRoundErrorCount(0);
    setShowVisualHint(false);

    setLumiEmotion('thinking');
    const msg = 'Посмотри внимательно. Что здесь лишнее?';
    setLumiMessage(msg);
    speakLumi(msg);
  };

  // Handle Start Level
  const handleStartLevel = (lvl: 1 | 2 | 3) => {
    const newRounds = generateLevelRounds(lvl);
    setLevel(lvl);
    setRounds(newRounds);
    setRoundIndex(0);
    startRound(lvl, 0, newRounds);
  };

  // Trigger Visual Hint (4-5 seconds grouping of valid items)
  const triggerVisualHint = () => {
    stopLumiVoice();
    if (timerRef.current) clearInterval(timerRef.current);

    setShowVisualHint(true);
    setHintTimer(5);
    setLumiEmotion('encouraging');
    const msg = 'Давай посмотрим вместе. Посмотри, эти предметы похожи!';
    setLumiMessage(msg);
    speakLumi('Давай посмотрим вместе.');

    timerRef.current = setInterval(() => {
      setHintTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowVisualHint(false);
          setConsecutiveErrors(0);
          setLumiEmotion('happy');
          setLumiMessage('Попробуй ещё раз!');
          speakLumi('Попробуй ещё раз.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle Item Selection
  const handleItemSelect = (item: OddItem) => {
    if (showVisualHint || level3ExplanationPhase) return;

    const currentRound = rounds[roundIndex];
    if (!currentRound) return;

    if (!item.isGroupMember) {
      // Correct! Selected the odd item!
      playSound('correct');
      setConsecutiveErrors(0);

      if (level === 3) {
        // LEVEL 3: Transition to Verbal Explanation Prompt ("Почему?")
        setLevel3ExplanationPhase(true);
        setLumiEmotion('thinking');
        const askWhy = `Правильно! А почему ${item.name} лишний?`;
        setLumiMessage(askWhy);
        speakLumi(`Правильно! А почему ${item.name} лишний?`);
      } else {
        // LEVEL 1 & 2: Direct Success Feedback
        setLumiEmotion('cheering');
        const praise = `Отлично! ${currentRound.oddDescription}!`;
        setLumiMessage(praise);
        speakLumi(`Отлично! ${currentRound.oddDescription}!`);

        setTimeout(() => {
          advanceRound();
        }, 1400);
      }
    } else {
      // Wrong item selected!
      playSound('wrong');
      const newConsecutive = consecutiveErrors + 1;
      const newRoundErr = roundErrorCount + 1;
      setConsecutiveErrors(newConsecutive);
      setRoundErrorCount(newRoundErr);

      // 5 errors in a row -> Rest Proposal
      if (newConsecutive >= 5) {
        stopLumiVoice();
        setViewState('REST_PROPOSAL');
        setLumiEmotion('encouraging');
        const restMsg = 'Ты хорошо постарался. Давай немного отдохнём?';
        setLumiMessage(restMsg);
        speakLumi(restMsg);
        return;
      }

      // 2nd error in round -> Visual Hint Overlay (Group Outline) for 4-5s
      if (newRoundErr >= 2) {
        triggerVisualHint();
      } else {
        // 1st error in round -> Verbal Hint
        stopLumiVoice();
        setLumiEmotion('encouraging');
        const hint = 'Посмотри ещё раз. Что объединяет эти предметы?';
        setLumiMessage(hint);
        speakLumi(hint);
      }
    }
  };

  // Handle Level 3 Verbal Explanation Button Click
  const handleLevel3ExplanationSelect = (type: 'EXPLANATION' | 'ITEM_NAME') => {
    playSound('correct');
    const currentRound = rounds[roundIndex];
    if (!currentRound) return;

    setLumiEmotion('cheering');
    const responseMsg = `Да! ${currentRound.oddDescription}`;
    setLumiMessage(responseMsg);
    speakLumi(responseMsg);

    setTimeout(() => {
      advanceRound();
    }, 1600);
  };

  // Advance Round or Finish Level
  const advanceRound = () => {
    if (roundIndex < rounds.length - 1) {
      setRoundIndex(roundIndex + 1);
      startRound(level, roundIndex + 1, rounds);
    } else {
      // Level Passed!
      if (level === 1) {
        setViewState('LEVEL_SUCCESS');
        setLumiEmotion('cheering');
        speakLumi('Уровень 1 пройден!');
      } else if (level === 2) {
        setViewState('LEVEL_SUCCESS');
        setLumiEmotion('cheering');
        speakLumi('Уровень 2 пройден!');
      } else {
        // All Levels Complete -> FINALE!
        setViewState('GAME_COMPLETE');
        setLumiEmotion('cheering');
        speakLumi('Ты научился находить, что объединяет предметы! Молодец!');
      }
    }
  };

  // Level Progression Handlers
  const handleContinueNextLevel = () => {
    if (level === 1) handleStartLevel(2);
    else if (level === 2) handleStartLevel(3);
  };

  const handleRetryAfterRest = () => {
    setConsecutiveErrors(0);
    startRound(level, roundIndex, rounds);
  };

  const handleRestartGame = () => {
    setConsecutiveErrors(0);
    handleStartLevel(1);
  };

  const currentRound = rounds[roundIndex] || rounds[0];
  const oddItem = currentRound?.items.find((it) => !it.isGroupMember);
  const groupItems = currentRound?.items.filter((it) => it.isGroupMember) || [];

  const getItemGridClass = (itemCount: number) => {
    if (itemCount <= 3) return 'grid-cols-3';
    if (itemCount === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (itemCount === 5) return 'grid-cols-3 sm:grid-cols-5';
    return 'grid-cols-3 sm:grid-cols-3';
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none py-2 px-2 sm:px-4 box-border">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={onReturnToLumiWorld}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-sm px-3.5 py-2 rounded-2xl border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <span>◀</span>
          <span>В Мир Луми</span>
        </button>

        <div className="bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-2xl font-black text-xs sm:text-sm border border-amber-500 shadow-xs">
          🧩 ЧТО ЛИШНЕЕ?
        </div>
      </div>

      {/* Lumi Speech Component */}
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
          <div className="text-4xl mb-2">🍎 🍐 🍌 🚗</div>
          <h2 className="text-2xl font-black text-amber-950 mb-2">Что лишнее?</h2>
          <p className="text-stone-700 text-sm sm:text-base font-semibold mb-6">
            Посмотри, что объединяет предметы, и найди тот, который не подходит к группе!
          </p>

          <button
            onClick={() => handleStartLevel(1)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg border-2 border-emerald-600 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>НАЧАТЬ ИГРУ</span>
            <span>➔</span>
          </button>
        </motion.div>
      )}

      {/* VIEW STATE: PLAY */}
      {viewState === 'PLAY' && (
        <div className="w-full flex flex-col items-center">
          {/* Level Progress */}
          <div className="w-full bg-stone-200 h-3 rounded-full mb-3 overflow-hidden border border-stone-300">
            <div
              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((roundIndex + 1) / rounds.length) * 100}%` }}
            />
          </div>

          <div className="text-xs font-black text-amber-900 mb-2 uppercase tracking-wider">
            Уровень {level} • Раунд {roundIndex + 1} из {rounds.length}
          </div>

          {/* VISUAL HINT OVERLAY (Soft outline grouping group items) */}
          <AnimatePresence>
            {showVisualHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full bg-amber-100 border-3 border-amber-400 rounded-3xl p-4 my-2 text-center shadow-md flex flex-col items-center gap-2"
              >
                <div className="text-xs font-black text-amber-900 uppercase">
                  💡 Давай посмотрим вместе ({hintTimer} с)
                </div>
                <div className="text-sm font-extrabold text-amber-950">
                  Эти предметы похожи — они относятся к одной группе!
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-white/80 rounded-2xl border-2 border-dashed border-amber-500">
                  {groupItems.map((gItem) => (
                    <div key={gItem.id} className="flex flex-col items-center">
                      <ItemVector type={gItem.type} ballColor={gItem.ballColor} className="w-12 h-12" />
                      <span className="text-xs font-bold text-amber-900">{gItem.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GAME BOARD: ITEMS DISPLAY */}
          {!level3ExplanationPhase ? (
            <div className="w-full flex flex-col items-center my-3">
              <div className="text-sm font-extrabold text-stone-700 mb-3">Коснись лишнего предмета:</div>

              {/* Items Cards */}
              {currentRound && (
                <div
                  className={`grid ${getItemGridClass(
                    currentRound.items.length
                  )} gap-3 sm:gap-4 w-full max-w-lg`}
                >
                  {currentRound.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      disabled={showVisualHint}
                      className="bg-white hover:bg-stone-50 active:bg-amber-50 rounded-2xl sm:rounded-3xl p-2 sm:p-4 border-2 sm:border-3 border-stone-200 hover:border-amber-400 shadow-md flex flex-col items-center justify-between cursor-pointer transition-all active:scale-95 min-h-[90px] sm:min-h-[110px]"
                    >
                      <ItemVector type={item.type} ballColor={item.ballColor} className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20" />
                      <span className="text-xs sm:text-sm font-black text-stone-800 mt-1 sm:mt-2 text-center">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* LEVEL 3 EXPLANATION PHASE ("Почему?") */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-white rounded-3xl p-5 border-3 border-amber-300 shadow-md flex flex-col items-center my-3 max-w-md text-center"
            >
              <div className="text-xs font-black text-amber-900 uppercase tracking-wide mb-1">
                Объясни вместе с Луми
              </div>
              <div className="text-lg font-black text-stone-800 mb-4">
                Почему {oddItem?.name} не подходит к группе?
              </div>

              {/* Display Odd Item Large */}
              {oddItem && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-5 flex flex-col items-center">
                  <ItemVector type={oddItem.type} ballColor={oddItem.ballColor} className="w-20 h-20" />
                  <span className="font-extrabold text-stone-800 mt-1">{oddItem.name}</span>
                </div>
              )}

              {/* Response Options */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => handleLevel3ExplanationSelect('EXPLANATION')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-md border-2 border-emerald-600 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>💬</span>
                  <span>«Потому что это не {currentRound.categoryName.toLowerCase()}!»</span>
                </button>

                <button
                  onClick={() => handleLevel3ExplanationSelect('ITEM_NAME')}
                  className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 font-extrabold text-sm shadow-xs border border-stone-300 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>«Потому что это {oddItem?.name.toLowerCase()}»</span>
                </button>
              </div>
            </motion.div>
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
          <div className="text-5xl mb-2">🌟 🎉 🌟</div>
          <h2 className="text-2xl font-black mb-2">Уровень {level} пройден!</h2>
          <p className="text-sm font-bold text-amber-900 mb-6">
            Ты отлично умеешь находить предметы! Пойдём дальше?
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

      {/* VIEW STATE: GAME COMPLETE (FINALE WITH DANCING LUMI) */}
      {viewState === 'GAME_COMPLETE' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 text-white p-6 rounded-3xl shadow-2xl border-4 border-pink-300 text-center my-4"
        >
          <div className="text-5xl mb-2 animate-bounce">💃 🏆 🧩</div>
          <h2 className="text-2xl font-black mb-2">
            Ты научился находить, что объединяет предметы!
          </h2>
          <p className="text-indigo-100 font-extrabold text-sm mb-6">
            У тебя отлично получается сравнивать и называть категории!
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
