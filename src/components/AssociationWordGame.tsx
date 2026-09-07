import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { LumiAsset } from './LumiAsset';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { playSound } from '../utils/audio';
import { LumiState } from '../visualSystem/LumiAssetRegistry';

export type ItemColor = 'red' | 'green' | 'yellow' | 'blue';

export interface GameItem {
  id: string;
  name: string;               // e.g. "Яблоко"
  nameQuestion: string;       // e.g. "яблоко" ("Какого цвета яблоко?")
  color: ItemColor;
  colorName: string;          // e.g. "красное" / "красный"
  colorNameNominative: string; // e.g. "Красный"
  colorEmoji: string;         // 🔴, 🟢, 🟡, 🔵
  type: 'apple' | 'banana' | 'ball' | 'car' | 'sun' | 'leaf' | 'flower' | 'carrot' | 'snowman' | 'orange';
}

interface AssociationWordGameProps {
  onReturnToLumiWorld: () => void;
}

// 3D Visual Item Graphics connected to LumiAsset Registry
const ItemVector: React.FC<{ type: GameItem['type']; color: ItemColor; className?: string }> = ({
  type,
  color,
  className = 'w-20 h-20 sm:w-24 sm:h-24',
}) => {
  return (
    <div className={`${className} flex items-center justify-center p-1`}>
      <LumiAsset type={type} color={color} size="medium" className="w-full h-full object-contain" />
    </div>
  );
};

// Item Database
const GAME_ITEMS: GameItem[] = [
  { id: 'red_apple', name: 'Яблоко', nameQuestion: 'яблоко', color: 'red', colorName: 'красный', colorNameNominative: 'Красный', colorEmoji: '🔴', type: 'apple' },
  { id: 'green_apple', name: 'Яблоко', nameQuestion: 'яблоко', color: 'green', colorName: 'зелёное', colorNameNominative: 'Зелёный', colorEmoji: '🟢', type: 'apple' },
  { id: 'yellow_banana', name: 'Банан', nameQuestion: 'банан', color: 'yellow', colorName: 'жёлтый', colorNameNominative: 'Жёлтый', colorEmoji: '🟡', type: 'banana' },
  { id: 'red_ball', name: 'Мяч', nameQuestion: 'мячик', color: 'red', colorName: 'красный', colorNameNominative: 'Красный', colorEmoji: '🔴', type: 'ball' },
  { id: 'blue_ball', name: 'Мяч', nameQuestion: 'мячик', color: 'blue', colorName: 'синий', colorNameNominative: 'Синий', colorEmoji: '🔵', type: 'ball' },
  { id: 'green_ball', name: 'Мяч', nameQuestion: 'мячик', color: 'green', colorName: 'зелёный', colorNameNominative: 'Зелёный', colorEmoji: '🟢', type: 'ball' },
  { id: 'yellow_sun', name: 'Солнышко', nameQuestion: 'солнышко', color: 'yellow', colorName: 'жёлтое', colorNameNominative: 'Жёлтый', colorEmoji: '🟡', type: 'sun' },
  { id: 'green_leaf', name: 'Листик', nameQuestion: 'листик', color: 'green', colorName: 'зелёный', colorNameNominative: 'Зелёный', colorEmoji: '🟢', type: 'leaf' },
  { id: 'blue_car', name: 'Машинка', nameQuestion: 'машинка', color: 'blue', colorName: 'синяя', colorNameNominative: 'Синий', colorEmoji: '🔵', type: 'car' },
  { id: 'red_car', name: 'Машинка', nameQuestion: 'машинка', color: 'red', colorName: 'красная', colorNameNominative: 'Красный', colorEmoji: '🔴', type: 'car' },
  { id: 'red_flower', name: 'Цветок', nameQuestion: 'цветок', color: 'red', colorName: 'красный', colorNameNominative: 'Красный', colorEmoji: '🔴', type: 'flower' },
];

const COLOR_DETAILS: Record<ItemColor, { name: string; bgClass: string; borderClass: string; emoji: string; hex: string }> = {
  red: { name: 'Красный', bgClass: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white', borderClass: 'border-red-600', emoji: '🔴', hex: '#EF4444' },
  green: { name: 'Зелёный', bgClass: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white', borderClass: 'border-emerald-600', emoji: '🟢', hex: '#10B981' },
  yellow: { name: 'Жёлтый', bgClass: 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950', borderClass: 'border-amber-500', emoji: '🟡', hex: '#F59E0B' },
  blue: { name: 'Синий', bgClass: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white', borderClass: 'border-blue-600', emoji: '🔵', hex: '#3B82F6' },
};

// Rounds Configuration per Level
interface Level1Round {
  item: GameItem;
  options: ItemColor[];
}

interface Level2Round {
  item: GameItem;
  colorOptions: ItemColor[];
}

interface Level3Round {
  targetColor: ItemColor;
  itemChoices: GameItem[]; // 4 items displayed, 1 or more matching targetColor
}

const LEVEL1_ROUNDS: Level1Round[] = [
  { item: GAME_ITEMS[0], options: ['red', 'blue', 'yellow'] },         // Red Apple
  { item: GAME_ITEMS[6], options: ['green', 'yellow', 'blue'] },       // Yellow Sun
  { item: GAME_ITEMS[5], options: ['red', 'green', 'blue'] },         // Green Ball
  { item: GAME_ITEMS[8], options: ['blue', 'red', 'yellow'] },         // Blue Car
  { item: GAME_ITEMS[3], options: ['green', 'yellow', 'red'] },        // Red Ball (Same object, different color!)
];

const LEVEL2_ROUNDS: Level2Round[] = [
  { item: GAME_ITEMS[0], colorOptions: ['red', 'blue', 'yellow'] },    // Red Apple
  { item: GAME_ITEMS[2], colorOptions: ['green', 'yellow', 'red'] },  // Yellow Banana
  { item: GAME_ITEMS[7], colorOptions: ['green', 'blue', 'yellow'] },  // Green Leaf
  { item: GAME_ITEMS[4], colorOptions: ['red', 'blue', 'green'] },    // Blue Ball
  { item: GAME_ITEMS[9], colorOptions: ['yellow', 'red', 'blue'] },   // Red Car
];

const LEVEL3_ROUNDS: Level3Round[] = [
  {
    targetColor: 'red',
    itemChoices: [GAME_ITEMS[0], GAME_ITEMS[3], GAME_ITEMS[2], GAME_ITEMS[7]], // Red Apple (match), Red Ball (match), Yellow Banana, Green Leaf
  },
  {
    targetColor: 'yellow',
    itemChoices: [GAME_ITEMS[6], GAME_ITEMS[2], GAME_ITEMS[8], GAME_ITEMS[5]], // Yellow Sun (match), Yellow Banana (match), Blue Car, Green Ball
  },
  {
    targetColor: 'green',
    itemChoices: [GAME_ITEMS[7], GAME_ITEMS[5], GAME_ITEMS[0], GAME_ITEMS[8]], // Green Leaf (match), Green Ball (match), Red Apple, Blue Car
  },
  {
    targetColor: 'blue',
    itemChoices: [GAME_ITEMS[8], GAME_ITEMS[4], GAME_ITEMS[2], GAME_ITEMS[0]], // Blue Car (match), Blue Ball (match), Yellow Banana, Red Apple
  },
  {
    targetColor: 'red',
    itemChoices: [GAME_ITEMS[9], GAME_ITEMS[10], GAME_ITEMS[7], GAME_ITEMS[6]], // Red Car (match), Red Flower (match), Green Leaf, Yellow Sun
  },
];

export const AssociationWordGame: React.FC<AssociationWordGameProps> = ({ onReturnToLumiWorld }) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [roundIndex, setRoundIndex] = useState<number>(0);

  // Level 3 Subphase: 'IDENTIFY_COLOR' (Part 1) or 'ASSOCIATE_OBJECT' (Part 2)
  const [level3SubPhase, setLevel3SubPhase] = useState<'IDENTIFY_COLOR' | 'ASSOCIATE_OBJECT'>('IDENTIFY_COLOR');

  // Game UI state
  const [viewState, setViewState] = useState<
    'INTRO' | 'LEVEL_PLAY' | 'LEVEL_SUCCESS' | 'REST_PROPOSAL' | 'GAME_COMPLETE'
  >('INTRO');

  // Error tracking
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [roundErrorCount, setRoundErrorCount] = useState<number>(0);
  const [showVisualHint, setShowVisualHint] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [objectButtonHighlight, setObjectButtonHighlight] = useState<boolean>(false);

  // Character state and speech message
  const [lumiState, setLumiState] = useState<LumiState>('neutral');
  const [lumiMessage, setLumiMessage] = useState<string>('Привет! Давай поиграем с предметами и цветами!');

  const visualHintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track whether initial intro/instruction speech is active
  const isIntroSpeakingRef = useRef<boolean>(false);

  // Helper to trigger voice and set matching visual state cleanly
  const triggerVoice = (
    text: string,
    force = false,
    onEndCallback?: () => void,
    speakingState: LumiState = 'speaking',
    finalState: LumiState = 'neutral',
    isIntro = false
  ) => {
    stopLumiVoice();
    if (isIntro) {
      isIntroSpeakingRef.current = true;
    }
    setLumiState(speakingState);
    setLumiMessage(text);
    speakLumi(text, {
      force,
      onEnd: () => {
        if (isIntro) {
          isIntroSpeakingRef.current = false;
        }
        setLumiState(finalState);
        if (onEndCallback) onEndCallback();
      },
    });
  };

  // Clean up speech and timers on unmount
  useEffect(() => {
    return () => {
      stopLumiVoice();
      if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
    };
  }, []);

  // Initialize round prompt when starting or advancing round
  const startRound = (lvl: 1 | 2 | 3, rIdx: number) => {
    setShowVisualHint(false);
    setRoundErrorCount(0);
    setFeedbackMessage(null);
    setObjectButtonHighlight(false);
    setViewState('LEVEL_PLAY');

    if (lvl === 1) {
      const rData = LEVEL1_ROUNDS[rIdx];
      const msg = `Посмотри на ${rData.item.nameQuestion}. Покажи такой же цвет.`;
      triggerVoice(`${rData.item.name}. Покажи такой же цвет.`, false, undefined, 'speaking', 'attention', true);
      setLumiMessage(msg);
    } else if (lvl === 2) {
      const rData = LEVEL2_ROUNDS[rIdx];
      const msg = `Какого цвета ${rData.item.nameQuestion}?`;
      triggerVoice(msg, false, undefined, 'speaking', 'thinking', true);
    } else if (lvl === 3) {
      setLevel3SubPhase('IDENTIFY_COLOR');
      const rData = LEVEL3_ROUNDS[rIdx];
      const msg = `Какой это цвет?`;
      triggerVoice(msg, false, undefined, 'speaking', 'thinking', true);
    }
  };

  // Start level from intro banner
  const handleStartLevel = (lvl: 1 | 2 | 3) => {
    setLevel(lvl);
    setRoundIndex(0);
    startRound(lvl, 0);
  };

  // Trigger Visual Hint (4 seconds display)
  const triggerVisualHint = () => {
    setShowVisualHint(true);
    const msg = 'Давай посмотрим еще раз внимательно!';
    triggerVoice('Давай посмотрим еще раз.', true, undefined, 'support', 'support');
    setLumiMessage(msg);

    if (visualHintTimerRef.current) clearTimeout(visualHintTimerRef.current);
    visualHintTimerRef.current = setTimeout(() => {
      setShowVisualHint(false);
    }, 4000);
  };

  // Handle Error Count Logic
  const registerError = () => {
    playSound('wrong');
    const newConsecutive = consecutiveErrors + 1;
    const newRoundErr = roundErrorCount + 1;
    setConsecutiveErrors(newConsecutive);
    setRoundErrorCount(newRoundErr);

    // Check 5 consecutive errors -> Rest Proposal
    if (newConsecutive >= 5) {
      setViewState('REST_PROPOSAL');
      const restMsg = 'Ты хорошо постарался. Давай немного отдохнём?';
      triggerVoice(restMsg, true, undefined, 'rest', 'rest');
      return;
    }

    // 2nd error in round -> Visual Hint for 4 sec
    if (newRoundErr >= 2) {
      triggerVisualHint();
    } else {
      // 1st error in round -> Verbal Hint
      const errPrompt = level === 1 ? 'Посмотри на цвет.' : 'Попробуй ещё раз.';
      triggerVoice(errPrompt, true, undefined, 'speaking', 'retry');
    }
  };

  // LEVEL 1 ANSWER HANDLING
  const handleLevel1ColorSelect = (selectedColor: ItemColor) => {
    if (showVisualHint || isIntroSpeakingRef.current) return;
    const targetItem = LEVEL1_ROUNDS[roundIndex].item;

    if (selectedColor === targetItem.color) {
      // Correct!
      playSound('correct');
      setConsecutiveErrors(0);
      const praise = `Молодец! Это ${targetItem.colorName} цвет!`;
      triggerVoice(`Молодец! Это ${targetItem.colorName} цвет!`, false, undefined, 'speaking', 'clap');

      setTimeout(() => {
        if (roundIndex < 4) {
          setRoundIndex(roundIndex + 1);
          startRound(1, roundIndex + 1);
        } else {
          // Level 1 Completed
          setViewState('LEVEL_SUCCESS');
          triggerVoice('Уровень 1 пройден!', false, undefined, 'speaking', 'happy');
        }
      }, 1400);
    } else {
      registerError();
    }
  };

  // LEVEL 2 ANSWER HANDLING
  const handleLevel2Select = (selection: ItemColor | 'OBJECT_BUTTON') => {
    if (showVisualHint || isIntroSpeakingRef.current) return;
    const targetItem = LEVEL2_ROUNDS[roundIndex].item;

    if (selection === 'OBJECT_BUTTON') {
      // Child picked the object name ("Яблоко").
      // CRITICAL REQUIREMENT: THIS IS NOT AN ERROR!
      playSound('click');
      setObjectButtonHighlight(true);
      const softHelp = `Да, ${targetItem.nameQuestion}. А цвет какой?`;
      setFeedbackMessage(`Да, это ${targetItem.name}! А какого оно цвета?`);
      triggerVoice(softHelp, false, undefined, 'speaking', 'thinking');
      return;
    }

    if (selection === targetItem.color) {
      // Correct color selected!
      playSound('correct');
      setConsecutiveErrors(0);
      const praise = `Правильно! ${targetItem.name} — ${targetItem.colorName}!`;
      triggerVoice(praise, false, undefined, 'speaking', 'clap');

      setTimeout(() => {
        if (roundIndex < 4) {
          setRoundIndex(roundIndex + 1);
          startRound(2, roundIndex + 1);
        } else {
          // Level 2 Completed
          setViewState('LEVEL_SUCCESS');
          triggerVoice('Уровень 2 пройден!', false, undefined, 'speaking', 'happy');
        }
      }, 1400);
    } else {
      registerError();
    }
  };

  // LEVEL 3 PART 1: IDENTIFY COLOR
  const handleLevel3ColorIdentify = (selectedColor: ItemColor) => {
    if (showVisualHint || isIntroSpeakingRef.current) return;
    const targetColor = LEVEL3_ROUNDS[roundIndex].targetColor;

    if (selectedColor === targetColor) {
      playSound('correct');
      setConsecutiveErrors(0);

      // Move to Part 2: Associate Object
      setLevel3SubPhase('ASSOCIATE_OBJECT');
      setRoundErrorCount(0);
      const msg = `Правильно! Назови или покажи предмет такого цвета.`;
      triggerVoice(`Правильно, ${COLOR_DETAILS[targetColor].name}! Назови предмет такого цвета.`, false, undefined, 'speaking', 'attention');
      setLumiMessage(msg);
    } else {
      registerError();
    }
  };

  // LEVEL 3 PART 2: ASSOCIATE OBJECT
  const handleLevel3ObjectSelect = (item: GameItem) => {
    if (showVisualHint || isIntroSpeakingRef.current) return;
    const targetColor = LEVEL3_ROUNDS[roundIndex].targetColor;

    // Check if selected item matches the target color
    if (item.color === targetColor) {
      // Correct association!
      playSound('correct');
      setConsecutiveErrors(0);
      const praise = `Отлично! ${item.name} — ${item.colorName}!`;
      triggerVoice(`Здорово! ${item.name} — ${item.colorName}!`, false, undefined, 'speaking', 'clap');
      setLumiMessage(praise);

      setTimeout(() => {
        if (roundIndex < 4) {
          setRoundIndex(roundIndex + 1);
          startRound(3, roundIndex + 1);
        } else {
          // Level 3 & Whole Game Completed!
          setViewState('GAME_COMPLETE');
          triggerVoice('Ты научился замечать цвет! Молодец!', false, undefined, 'speaking', 'victory');
        }
      }, 1500);
    } else {
      registerError();
    }
  };

  // Handle Level Continue Button
  const handleContinueNextLevel = () => {
    if (level === 1) {
      handleStartLevel(2);
    } else if (level === 2) {
      handleStartLevel(3);
    }
  };

  // Rest proposal retry
  const handleRetryAfterRest = () => {
    setConsecutiveErrors(0);
    startRound(level, roundIndex);
  };

  // Restart whole game
  const handleRestartGame = () => {
    setConsecutiveErrors(0);
    handleStartLevel(1);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none py-2 px-2 sm:px-4 box-border">
      {/* Top Header & Navigation */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={onReturnToLumiWorld}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-sm px-3.5 py-2 rounded-2xl border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <span>◀</span>
          <span>В Мир Луми</span>
        </button>

        <div className="bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-2xl font-black text-xs sm:text-sm border border-amber-500 shadow-xs">
          🎯 ИГРА: АССОЦИАЦИЯ
        </div>
      </div>

      {/* Lumi Character Speech Box */}
      <div className="w-full mb-3">
        <LumiCharacter state={lumiState} message={lumiMessage} />
      </div>

      {/* VIEW STATE: INTRO (Level Title) */}
      {viewState === 'INTRO' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-lg text-center my-4"
        >
          <div className="text-4xl mb-2">🍎 ➔ 🔴</div>
          <h2 className="text-2xl font-black text-amber-950 mb-2">Ассоциация: Предмет и Цвет</h2>
          <p className="text-stone-700 text-sm sm:text-base font-semibold mb-6">
            Учимся находить цвета у знакомых предметов и называть их вместе с Луми!
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

      {/* VIEW STATE: ACTIVE LEVEL PLAY */}
      {viewState === 'LEVEL_PLAY' && (
        <div className="w-full flex flex-col items-center">
          {/* Level Progress Bar */}
          <div className="w-full bg-stone-200 h-3 rounded-full mb-4 overflow-hidden border border-stone-300">
            <div
              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((roundIndex + 1) / 5) * 100}%` }}
            />
          </div>

          <div className="text-xs font-black text-amber-900 mb-2 uppercase tracking-wider">
            Уровень {level} • Раунд {roundIndex + 1} из 5
          </div>

          {/* VISUAL HINT OVERLAY (Active for 4s on 2nd error) */}
          <AnimatePresence>
            {showVisualHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full bg-amber-100 border-2 border-amber-400 rounded-3xl p-4 my-2 text-center shadow-md flex flex-col items-center gap-2"
              >
                <div className="text-xs font-black text-amber-900 uppercase">💡 Подсказка Луми</div>
                <div className="flex items-center justify-center gap-4 text-3xl font-black">
                  {level === 1 && (
                    <>
                      <ItemVector
                        type={LEVEL1_ROUNDS[roundIndex].item.type}
                        color={LEVEL1_ROUNDS[roundIndex].item.color}
                        className="w-16 h-16"
                      />
                      <span>➔</span>
                      <span>{COLOR_DETAILS[LEVEL1_ROUNDS[roundIndex].item.color].emoji}</span>
                    </>
                  )}
                  {level === 2 && (
                    <>
                      <ItemVector
                        type={LEVEL2_ROUNDS[roundIndex].item.type}
                        color={LEVEL2_ROUNDS[roundIndex].item.color}
                        className="w-16 h-16"
                      />
                      <span>➔</span>
                      <span>{COLOR_DETAILS[LEVEL2_ROUNDS[roundIndex].item.color].emoji}</span>
                    </>
                  )}
                  {level === 3 && (
                    <div className="flex gap-3">
                      {LEVEL3_ROUNDS[roundIndex].itemChoices
                        .filter((it) => it.color === LEVEL3_ROUNDS[roundIndex].targetColor)
                        .map((it) => (
                          <ItemVector key={it.id} type={it.type} color={it.color} className="w-14 h-14" />
                        ))}
                    </div>
                  )}
                </div>
                <div className="text-xs font-bold text-amber-800">Выбери ответ ниже 👇</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LEVEL 1: OBJECT -> COLOR CIRCLES */}
          {level === 1 && (
            <div className="w-full flex flex-col items-center my-2">
              {/* Target Object Display */}
              <motion.div
                key={LEVEL1_ROUNDS[roundIndex].item.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-md flex flex-col items-center mb-6 w-52 sm:w-60"
              >
                <ItemVector
                  type={LEVEL1_ROUNDS[roundIndex].item.type}
                  color={LEVEL1_ROUNDS[roundIndex].item.color}
                  className="w-24 h-24 sm:w-28 sm:h-28"
                />
                <span className="text-xl font-black text-stone-800 mt-2">
                  {LEVEL1_ROUNDS[roundIndex].item.name}
                </span>
              </motion.div>

              {/* Color Options */}
              <div className="text-sm font-extrabold text-stone-700 mb-3">Покажи такой же цвет:</div>
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {LEVEL1_ROUNDS[roundIndex].options.map((col) => {
                  const details = COLOR_DETAILS[col];
                  return (
                    <button
                      key={col}
                      onClick={() => handleLevel1ColorSelect(col)}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-4 ${details.borderClass} ${details.bgClass} shadow-lg cursor-pointer flex flex-col items-center justify-center transition-all active:scale-90 min-w-[56px] min-h-[56px]`}
                    >
                      <span className="text-3xl">{details.emoji}</span>
                      <span className="text-xs font-black uppercase mt-1">{details.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 2: OBJECT -> "КАКОГО ЦВЕТА?" (OBJECT BUTTON IS NOT AN ERROR!) */}
          {level === 2 && (
            <div className="w-full flex flex-col items-center my-2">
              {/* Target Object Card */}
              <motion.div
                key={LEVEL2_ROUNDS[roundIndex].item.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-md flex flex-col items-center mb-4 w-52 sm:w-60"
              >
                <ItemVector
                  type={LEVEL2_ROUNDS[roundIndex].item.type}
                  color={LEVEL2_ROUNDS[roundIndex].item.color}
                  className="w-24 h-24 sm:w-28 sm:h-28"
                />
                <span className="text-lg font-black text-stone-800 mt-2">
                  {LEVEL2_ROUNDS[roundIndex].item.name}
                </span>
              </motion.div>

              {/* Gentle Object Naming Feedback Banner */}
              {feedbackMessage && (
                <div className="bg-amber-100 border-2 border-amber-300 text-amber-950 font-black text-sm px-4 py-2.5 rounded-2xl mb-3 text-center animate-pulse">
                  {feedbackMessage}
                </div>
              )}

              {/* Options: Colors + Object Button */}
              <div className="text-sm font-extrabold text-stone-700 mb-3">
                Какого цвета {LEVEL2_ROUNDS[roundIndex].item.nameQuestion}?
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-md">
                {/* Color Buttons */}
                {LEVEL2_ROUNDS[roundIndex].colorOptions.map((col) => {
                  const details = COLOR_DETAILS[col];
                  return (
                    <button
                      key={col}
                      onClick={() => handleLevel2Select(col)}
                      className={`flex-1 min-w-[90px] h-20 sm:h-22 rounded-2xl border-3 ${details.borderClass} ${details.bgClass} shadow-md cursor-pointer flex flex-col items-center justify-center transition-all active:scale-95 min-h-[56px]`}
                    >
                      <span className="text-2xl">{details.emoji}</span>
                      <span className="text-xs font-black uppercase mt-0.5">{details.name}</span>
                    </button>
                  );
                })}

                {/* Object Button ("Яблоко") - Tapping this is NOT AN ERROR! */}
                <button
                  onClick={() => handleLevel2Select('OBJECT_BUTTON')}
                  className={`w-full py-3.5 px-4 rounded-2xl border-2 font-black text-base shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95 min-h-[44px] ${
                    objectButtonHighlight
                      ? 'bg-amber-300 border-amber-500 text-amber-950 ring-4 ring-amber-200'
                      : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-800'
                  }`}
                >
                  <span>💬</span>
                  <span>«Это {LEVEL2_ROUNDS[roundIndex].item.name}»</span>
                </button>
              </div>
            </div>
          )}

          {/* LEVEL 3: COLOR -> OBJECT (PART 1: IDENTIFY COLOR, PART 2: ASSOCIATE OBJECT) */}
          {level === 3 && (
            <div className="w-full flex flex-col items-center my-2">
              {/* PART 1: IDENTIFY COLOR */}
              {level3SubPhase === 'IDENTIFY_COLOR' && (
                <div className="w-full flex flex-col items-center">
                  <div className="text-sm font-extrabold text-stone-700 mb-3">Какой это цвет?</div>

                  {/* Pure Color Circle (No Object!) */}
                  <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-md mb-6 flex items-center justify-center">
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-inner border-4 border-white"
                      style={{ backgroundColor: COLOR_DETAILS[LEVEL3_ROUNDS[roundIndex].targetColor].hex }}
                    />
                  </div>

                  {/* Color Name Choices */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    {(['red', 'green', 'yellow', 'blue'] as ItemColor[]).map((col) => {
                      const details = COLOR_DETAILS[col];
                      return (
                        <button
                          key={col}
                          onClick={() => handleLevel3ColorIdentify(col)}
                          className={`py-4 px-3 rounded-2xl border-3 ${details.borderClass} ${details.bgClass} shadow-md font-black text-base cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[56px]`}
                        >
                          <span>{details.emoji}</span>
                          <span>{details.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PART 2: ASSOCIATE OBJECT */}
              {level3SubPhase === 'ASSOCIATE_OBJECT' && (
                <div className="w-full flex flex-col items-center">
                  <div className="text-sm font-extrabold text-stone-700 mb-2">
                    Назови или выбери предмет такого цвета:
                  </div>

                  {/* Target Color Banner */}
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-300 shadow-xs mb-4">
                    <span className="text-xl">
                      {COLOR_DETAILS[LEVEL3_ROUNDS[roundIndex].targetColor].emoji}
                    </span>
                    <span className="font-extrabold text-stone-800 text-sm">
                      {COLOR_DETAILS[LEVEL3_ROUNDS[roundIndex].targetColor].name} цвет
                    </span>
                  </div>

                  {/* 4 Object Cards Choices */}
                  <div className="grid grid-cols-2 gap-3.5 w-full max-w-md">
                    {LEVEL3_ROUNDS[roundIndex].itemChoices.map((itemChoice) => {
                      return (
                        <button
                          key={itemChoice.id}
                          onClick={() => handleLevel3ObjectSelect(itemChoice)}
                          className="bg-white hover:bg-stone-50 active:bg-amber-50 rounded-2xl p-4 border-2 border-stone-200 hover:border-amber-400 shadow-sm flex flex-col items-center justify-between cursor-pointer transition-all active:scale-95 min-h-[110px]"
                        >
                          <ItemVector type={itemChoice.type} color={itemChoice.color} className="w-16 h-16" />
                          <span className="text-sm font-black text-stone-800 mt-2">
                            {itemChoice.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW STATE: LEVEL SUCCESS BANNER */}
      {viewState === 'LEVEL_SUCCESS' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-b from-amber-400 to-amber-500 rounded-3xl p-6 border-4 border-amber-600 shadow-xl text-center text-amber-950 my-4"
        >
          <div className="text-5xl mb-2">🌟 🎉 🌟</div>
          <h2 className="text-2xl font-black mb-2">Уровень {level} пройден!</h2>
          <p className="text-sm font-bold text-amber-900 mb-6">
            Ты отличный помощник! Пойдём дальше?
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

      {/* VIEW STATE: REST PROPOSAL (OFFERED AFTER 5 ERRORS IN A ROW) */}
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

      {/* VIEW STATE: GAME COMPLETE (FINALE) */}
      {viewState === 'GAME_COMPLETE' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 text-white p-6 rounded-3xl shadow-2xl border-4 border-pink-300 text-center my-4"
        >
          <div className="text-5xl mb-2 animate-bounce">🌈 🏆 🎨</div>
          <h2 className="text-2xl font-black mb-2">Ты научился замечать цвет!</h2>
          <p className="text-indigo-100 font-extrabold text-sm mb-6">
            Теперь ты умеешь находить цвет у всех предметов вокруг!
          </p>

          {/* Association Cards Summary */}
          <div className="bg-white/20 backdrop-blur-xs rounded-2xl p-4 border border-white/30 mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-around font-black text-lg">
              <span>🍎 ➔ 🔴</span>
              <span>⚽ ➔ 🔵</span>
              <span>🟡 ➔ 🍌</span>
            </div>
          </div>

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
