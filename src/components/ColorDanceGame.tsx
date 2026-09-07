import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Volume2, VolumeX, Sparkles, Check, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { LumiDanceFinale } from './LumiDanceFinale';
import { LumiAsset } from './LumiAsset';
import { speakLumi, stopLumiVoice } from '../utils/voiceManager';
import { playSound, stopDanceCelebrationMusic } from '../utils/audio';
import { LumiState } from '../visualSystem/LumiAssetRegistry';

export interface ColorDanceGameProps {
  onBackToLumiWorld: () => void;
}

type DanceColor = 'red' | 'blue' | 'yellow';
type DanceAction = 'clap' | 'stomp' | 'squat';

interface RuleMapping {
  red: DanceAction;
  blue: DanceAction;
  yellow: DanceAction;
}

const BASE_RULES: RuleMapping = {
  red: 'clap',
  blue: 'stomp',
  yellow: 'squat',
};

const INVERTED_RULES: RuleMapping = {
  red: 'stomp',
  blue: 'clap',
  yellow: 'squat',
};

const COLOR_INFO: Record<
  DanceColor,
  { name: string; hex: string; bgClass: string; textClass: string; borderClass: string; emoji: string }
> = {
  red: { name: 'Красный', hex: '#EF4444', bgClass: 'bg-red-500', textClass: 'text-red-500', borderClass: 'border-red-500', emoji: '🔴' },
  blue: { name: 'Синий', hex: '#3B82F6', bgClass: 'bg-blue-500', textClass: 'text-blue-500', borderClass: 'border-blue-500', emoji: '🔵' },
  yellow: { name: 'Жёлтый', hex: '#EAB308', bgClass: 'bg-yellow-400', textClass: 'text-yellow-500', borderClass: 'border-yellow-400', emoji: '🟡' },
};

const ACTION_INFO: Record<DanceAction, { label: string; icon: string; verb: string }> = {
  clap: { label: 'Хлопок', icon: '👏', verb: 'Хлопни в ладоши' },
  stomp: { label: 'Топот', icon: '👣', verb: 'Топни ногой' },
  squat: { label: 'Приседание', icon: '🧘', verb: 'Присядь' },
};

export const ColorDanceGame: React.FC<ColorDanceGameProps> = ({ onBackToLumiWorld }) => {
  const [level, setLevel] = useState<number>(1);
  const [round, setRound] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Current rule mapping
  const [currentRule, setCurrentRule] = useState<RuleMapping>(BASE_RULES);

  // Sequences and user input
  const [sequence, setSequence] = useState<DanceColor[]>([]);
  const [userActions, setUserActions] = useState<DanceAction[]>([]);

  // States: 'RULE_INTRO' | 'MEMO' | 'INPUT' | 'SUCCESS_FEEDBACK' | 'ERROR_FEEDBACK' | 'RULE_CHANGE_ANNOUNCE' | 'LEVEL_COMPLETE' | 'VICTORY_REPLICA' | 'DANCE_FINALE' | 'GAME_COMPLETE' | 'REST_PROMPT' | 'RESTING' | 'PAUSE_BEFORE_ROUND'
  const [gameState, setGameState] = useState<string>('RULE_INTRO');

  // Unified Lumi visual state
  const [lumiState, setLumiState] = useState<LumiState>('neutral');

  // Error tracking & hint
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [showRuleHint, setShowRuleHint] = useState<boolean>(false);

  // Lumi message
  const [lumiMessage, setLumiMessage] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Central voice trigger helper with state update and callback
  const triggerVoice = (
    text: string,
    force = false,
    onEnd?: () => void,
    targetLumiState: LumiState = 'speaking',
    postLumiState: LumiState = 'attention'
  ) => {
    setLumiMessage(text);
    setLumiState(targetLumiState);

    speakLumi(text, {
      soundEnabled,
      force,
      onEnd: () => {
        setLumiState(postLumiState);
        if (onEnd) onEnd();
      },
    });
  };

  // Generate sequences for level and round
  const generateSequence = (lvl: number, rnd: number): DanceColor[] => {
    if (lvl === 1) {
      const colors: DanceColor[] = ['red', 'blue', 'red', 'blue', 'red'];
      return [colors[(rnd - 1) % colors.length]];
    } else if (lvl === 2) {
      const pool: DanceColor[] = ['red', 'blue', 'yellow'];
      let len = 1;
      if (rnd === 2 || rnd === 3) len = 2;
      if (rnd === 4 || rnd === 5) len = 3;

      const seq: DanceColor[] = [];
      for (let i = 0; i < len; i++) {
        const randColor = pool[Math.floor(Math.random() * pool.length)];
        seq.push(randColor);
      }
      return seq;
    } else {
      const pool: DanceColor[] = ['red', 'blue', 'yellow'];
      let len = 3;
      if (rnd === 3 || rnd === 4) len = 4;
      if (rnd === 5) len = 5;

      const seq: DanceColor[] = [];
      for (let i = 0; i < len; i++) {
        const randColor = pool[Math.floor(Math.random() * pool.length)];
        seq.push(randColor);
      }
      return seq;
    }
  };

  // Start round
  const startRound = (lvl: number, rnd: number, rule: RuleMapping, skipIntroPrompt = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUserActions([]);
    setConsecutiveErrors(0);
    setShowRuleHint(false);

    // Rule change on Level 3 Round 3
    if (lvl === 3 && rnd === 3 && rule !== INVERTED_RULES) {
      setCurrentRule(INVERTED_RULES);
      setGameState('RULE_CHANGE_ANNOUNCE');
      triggerVoice('Внимание. Правила изменились. Запомни новое правило.', true, () => {
        timerRef.current = setTimeout(() => {
          setGameState('PAUSE_BEFORE_ROUND');
          timerRef.current = setTimeout(() => {
            startRound(lvl, rnd, INVERTED_RULES, false);
          }, 600);
        }, 5000);
      }, 'surprised', 'attention');
      playSound('bell', soundEnabled);
      return;
    }

    const newSeq = generateSequence(lvl, rnd);
    setSequence(newSeq);

    if (lvl === 1) {
      // Level 1: Single stimulus input
      setGameState('INPUT');
      triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
      playSound('click', soundEnabled);
    } else {
      // Level 2 & 3: MEMO phase
      setGameState('MEMO');
      setLumiState('attention');
      if (!skipIntroPrompt) {
        triggerVoice('Запоминай.', false, undefined, 'speaking', 'attention');
      }
      playSound('bell', soundEnabled);

      const memoDuration = 2200 + newSeq.length * 450;
      timerRef.current = setTimeout(() => {
        setGameState('INPUT');
        triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
      }, memoDuration);
    }
  };

  // Init or reset game
  const resetGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopDanceCelebrationMusic();
    stopLumiVoice();
    setLevel(1);
    setRound(1);
    setCurrentRule(BASE_RULES);
    setConsecutiveErrors(0);
    setShowRuleHint(false);
    setUserActions([]);
    setLumiState('neutral');

    // Initial instruction phase
    setGameState('RULE_INTRO');
    triggerVoice('Красный — хлопок. Синий — топот.', true, () => {
      timerRef.current = setTimeout(() => {
        startRound(1, 1, BASE_RULES, false);
      }, 800);
    }, 'speaking', 'attention');
  };

  useEffect(() => {
    resetGame();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stopDanceCelebrationMusic();
      stopLumiVoice();
    };
  }, []);

  // Handle action selection by child
  const handleSelectAction = (action: DanceAction) => {
    if (gameState !== 'INPUT') return;
    playSound('click', soundEnabled);

    const nextActions = [...userActions, action];
    setUserActions(nextActions);

    const expectedActions = sequence.map((c) => currentRule[c]);

    // Check progress
    const currentIndex = nextActions.length - 1;
    if (nextActions[currentIndex] !== expectedActions[currentIndex]) {
      // ERROR
      playSound('wrong', soundEnabled);
      const newErrCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrCount);

      if (newErrCount >= 5) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowRuleHint(false);
        setUserActions([]);
        setGameState('REST_PROMPT');
        triggerVoice('Ты хорошо постарался. Давай немного отдохнём?', false, undefined, 'rest', 'rest');
        return;
      }

      setGameState('ERROR_FEEDBACK');

      if (newErrCount >= 2) {
        setLumiState('support');
        triggerVoice('Давай посмотрим ещё раз.', false, undefined, 'support', 'support');
        setShowRuleHint(true);
        timerRef.current = setTimeout(() => {
          setShowRuleHint(false);
          setUserActions([]);
          if (level === 1) {
            setGameState('INPUT');
            triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
          } else {
            setGameState('MEMO');
            triggerVoice('Запоминай.', false, undefined, 'speaking', 'attention');
            timerRef.current = setTimeout(() => {
              setGameState('INPUT');
              triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
            }, 2500);
          }
        }, 3200);
      } else {
        setLumiState('retry');
        triggerVoice('Попробуй ещё раз.', false, undefined, 'retry', 'retry');
        timerRef.current = setTimeout(() => {
          setUserActions([]);
          if (level === 1) {
            setGameState('INPUT');
            triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
          } else {
            setGameState('MEMO');
            triggerVoice('Запоминай.', false, undefined, 'speaking', 'attention');
            timerRef.current = setTimeout(() => {
              setGameState('INPUT');
              triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
            }, 2500);
          }
        }, 1400);
      }
      return;
    }

    // Check if entire sequence matched
    if (nextActions.length === expectedActions.length) {
      playSound('correct', soundEnabled);
      setConsecutiveErrors(0);
      setShowRuleHint(false);
      setGameState('SUCCESS_FEEDBACK');

      if (round < 5) {
        setLumiState('clap');
        triggerVoice('Получилось!', false, undefined, 'speaking', 'clap');

        timerRef.current = setTimeout(() => {
          const nextRnd = round + 1;
          setRound(nextRnd);
          startRound(level, nextRnd, currentRule);
        }, 1200);
      } else {
        // Round 5 completed
        if (level < 3) {
          setLumiState('happy');
          setGameState('LEVEL_COMPLETE');
          triggerVoice('Уровень пройден!', false, undefined, 'speaking', 'victory');
        } else {
          // Level 3 Round 5 completed! Complete game victory!
          // 1. Show victory state on Lumi
          setLumiState('victory');
          setGameState('VICTORY_REPLICA');
          
          // 2. Speak replica «Получилось! А теперь танцуем!» completely!
          triggerVoice(
            'Получилось! А теперь танцуем!',
            true,
            () => {
              // 3. ONLY AFTER the replica finishes completely, launch dance.mp4 video!
              setGameState('DANCE_FINALE');
            },
            'speaking',
            'victory'
          );
        }
      }
    }
  };

  // Continue to next level
  const handleNextLevel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopDanceCelebrationMusic();
    stopLumiVoice();

    const nextLvl = level + 1;
    setLevel(nextLvl);
    setRound(1);

    if (nextLvl === 2) {
      setGameState('RULE_INTRO');
      triggerVoice('Добавим жёлтый. Жёлтый — приседание.', true, () => {
        timerRef.current = setTimeout(() => {
          startRound(nextLvl, 1, currentRule, false);
        }, 800);
      }, 'speaking', 'attention');
    } else {
      setGameState('PAUSE_BEFORE_ROUND');
      triggerVoice('Ты уже знаешь движения. Теперь попробуем запомнить их порядок.', true, () => {
        timerRef.current = setTimeout(() => {
          startRound(nextLvl, 1, currentRule, true);
        }, 600);
      }, 'speaking', 'attention');
    }
  };

  // Rest & retry handlers
  const handleTryAgainChoice = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setConsecutiveErrors(0);
    setUserActions([]);
    setShowRuleHint(false);
    if (level === 1) {
      setGameState('INPUT');
      triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
    } else {
      setGameState('MEMO');
      triggerVoice('Запоминай.', false, undefined, 'speaking', 'attention');
      timerRef.current = setTimeout(() => {
        setGameState('INPUT');
        triggerVoice('Теперь повтори.', false, undefined, 'speaking', 'attention');
      }, 2500 + sequence.length * 400);
    }
  };

  const handleRestChoice = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState('RESTING');
    triggerVoice('Хорошо. Немного отдохнём и потом продолжим.', false, undefined, 'rest', 'rest');
  };

  const activeColors: DanceColor[] = level === 1 ? ['red', 'blue'] : ['red', 'blue', 'yellow'];

  const handleBackToLumiWorld = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopDanceCelebrationMusic();
    stopLumiVoice();
    onBackToLumiWorld();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={handleBackToLumiWorld}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>В Мир Луми</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-amber-300">Цветной танец</h1>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-3">
            <span>Уровень {level} из 3</span>
            <span>•</span>
            <span>Раунд {round} из 5</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (!next) {
                stopDanceCelebrationMusic();
                stopLumiVoice();
              }
            }}
            className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            title="Заново"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 max-w-2xl mx-auto w-full">
        {/* Lumi Character - Uses LumiAssetRegistry WebP assets */}
        {gameState !== 'DANCE_FINALE' && (
          <div className="w-full my-1">
            <LumiCharacter
              state={lumiState}
              message={lumiMessage || 'Выполни движение!'}
              soundEnabled={soundEnabled}
              size="medium"
            />
          </div>
        )}

        {/* Central Stage Display */}
        <div className="flex-1 w-full flex flex-col items-center justify-center py-4">
          <AnimatePresence mode="wait">
            {/* SPECIAL FINALE: DANCE OF LUMI (dance.mp4 video) */}
            {gameState === 'DANCE_FINALE' && (
              <motion.div
                key="dance-finale-stage"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg bg-slate-800/80 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm"
              >
                <LumiDanceFinale
                  soundEnabled={soundEnabled}
                  onFinishDance={() => {
                    setGameState('GAME_COMPLETE');
                  }}
                />
              </motion.div>
            )}

            {/* Rule Change Announcement Banner */}
            {gameState === 'RULE_CHANGE_ANNOUNCE' && (
              <motion.div
                key="rule-change"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-amber-500/20 border-2 border-amber-400 rounded-3xl p-6 text-center max-w-md w-full shadow-2xl"
              >
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
                <h2 className="text-2xl font-bold text-amber-300 mb-2">Внимание! Правила изменились</h2>
                <p className="text-sm text-slate-300 mb-4">Запомни новое правило:</p>
                <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
                  {activeColors.map((col) => {
                    const act = INVERTED_RULES[col];
                    return (
                      <div key={col} className="flex flex-col items-center p-2 rounded-xl bg-slate-800/60">
                        <span className="text-3xl mb-1">{COLOR_INFO[col].emoji}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-2xl mt-1">{ACTION_INFO[act].icon}</span>
                        <span className="text-[11px] font-semibold text-slate-200 mt-1">{ACTION_INFO[act].label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Level Complete Dialog */}
            {gameState === 'LEVEL_COMPLETE' && (
              <motion.div
                key="level-complete"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-emerald-500/20 border-2 border-emerald-400 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
              >
                <div className="text-5xl mb-3">🌟</div>
                <h2 className="text-2xl font-bold text-emerald-300 mb-2">Уровень {level} пройден!</h2>
                <p className="text-sm text-slate-300 mb-6">Отличная работа! Продолжаем танец!</p>
                <button
                  type="button"
                  onClick={handleNextLevel}
                  className="w-full py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                >
                  Продолжить 👍
                </button>
              </motion.div>
            )}

            {/* Game Complete Dialog (Shown after Lumi's finale dance video) */}
            {gameState === 'GAME_COMPLETE' && (
              <motion.div
                key="game-complete"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-purple-950/80 border-2 border-purple-400/80 rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl"
              >
                <div className="text-6xl mb-3">🎉</div>
                <h2 className="text-2xl font-bold text-purple-200 mb-3 leading-snug">
                  🎉 Ты научился танцевать по цветам!
                </h2>
                <p className="text-sm text-purple-200/90 mb-6 font-medium leading-relaxed">
                  Теперь ты знаешь: цвет подсказывает движение.
                </p>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={resetGame}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Сыграть ещё раз</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToLumiWorld}
                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-base transition active:scale-95 cursor-pointer"
                  >
                    В Мир Луми
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5 Consecutive Errors - Rest Prompt Dialog */}
            {gameState === 'REST_PROMPT' && (
              <motion.div
                key="rest-prompt"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-indigo-950/90 border-2 border-indigo-400 rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl"
              >
                <div className="text-5xl mb-3">🌤️</div>
                <h2 className="text-xl font-bold text-indigo-200 mb-2">Ты хорошо постарался.</h2>
                <p className="text-base text-slate-300 mb-6 font-medium">Давай немного отдохнём?</p>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRestChoice}
                    className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Отдохнуть</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTryAgainChoice}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Попробовать ещё</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Resting State Screen */}
            {gameState === 'RESTING' && (
              <motion.div
                key="resting-screen"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-slate-800/90 border-2 border-teal-400/60 rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl"
              >
                <div className="text-6xl mb-3 animate-pulse">🌿</div>
                <h2 className="text-xl font-bold text-teal-300 mb-2">Хорошо.</h2>
                <p className="text-base text-slate-200 mb-6 font-medium leading-relaxed">
                  Немного отдохнём и потом продолжим.
                </p>
                <button
                  type="button"
                  onClick={handleTryAgainChoice}
                  className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-lg shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Продолжить 👍</span>
                </button>
              </motion.div>
            )}

            {/* Rules Intro Mode */}
            {gameState === 'RULE_INTRO' && (
              <motion.div
                key="rule-intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-800/90 border border-indigo-500/40 rounded-3xl p-6 text-center max-w-md w-full shadow-xl"
              >
                <h3 className="text-lg font-bold text-indigo-300 mb-3">Запомни правила движений:</h3>
                <div className="grid grid-cols-3 gap-3">
                  {activeColors.map((col) => {
                    const act = currentRule[col];
                    return (
                      <div key={col} className="p-3 rounded-2xl bg-slate-700/50 border border-slate-600/40 flex flex-col items-center">
                        <LumiAsset type="circle" color={col} size="small" className="w-8 h-8 object-contain mb-1" />
                        <span className="text-xs text-slate-400 my-1">↓</span>
                        <span className="text-3xl mb-1">{ACTION_INFO[act].icon}</span>
                        <span className="text-xs font-bold text-slate-200">{ACTION_INFO[act].label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Stimulus Presentation (Single or Sequence) */}
            {(gameState === 'MEMO' || gameState === 'INPUT' || gameState === 'SUCCESS_FEEDBACK' || gameState === 'ERROR_FEEDBACK') && (
              <motion.div key="stimulus-display" className="flex flex-col items-center justify-center w-full">
                {/* Level 1: Single Big Circle */}
                {level === 1 && sequence.length === 1 && (
                  <motion.div
                    key={sequence[0] + round}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="relative flex flex-col items-center"
                  >
                    <div
                      className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20 transition-all ${
                        COLOR_INFO[sequence[0]].bgClass
                      }`}
                    >
                      <span className="text-white text-3xl font-extrabold tracking-wider drop-shadow-md">
                        {COLOR_INFO[sequence[0]].name}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Level 2 & 3: Sequence Presentation or Memory Phase */}
                {level > 1 && (
                  <div className="flex flex-col items-center">
                    {gameState === 'MEMO' ? (
                      <div className="flex flex-col items-center">
                        <div className="text-amber-400 text-sm font-semibold mb-3 flex items-center gap-1.5 animate-pulse">
                          <Sparkles className="w-4 h-4" />
                          <span>Запомни последовательность:</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                          {sequence.map((col, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.15 }}
                              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 ${
                                COLOR_INFO[col].bgClass
                              }`}
                            >
                              <span className="text-2xl">{COLOR_INFO[col].emoji}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="text-indigo-300 text-sm font-medium mb-3">
                          Выполни танец из {sequence.length} {sequence.length === 1 ? 'действия' : 'действий'}:
                        </div>
                        {/* Slots for performed sequence */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                          {sequence.map((_, idx) => {
                            const performedAction = userActions[idx];
                            return (
                              <div
                                key={idx}
                                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl transition-all ${
                                  performedAction
                                    ? 'bg-slate-800 border-indigo-400 text-white shadow-md'
                                    : 'bg-slate-800/40 border-slate-700/60 text-slate-500 border-dashed'
                                }`}
                              >
                                {performedAction ? ACTION_INFO[performedAction].icon : `${idx + 1}`}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Feedback Banners */}
                {gameState === 'SUCCESS_FEEDBACK' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 px-6 py-2.5 bg-emerald-500/20 border border-emerald-400/50 rounded-2xl flex items-center gap-2 text-emerald-300 font-bold text-lg"
                  >
                    <Check className="w-6 h-6" />
                    <span>✨ Последовательность выполнена!</span>
                  </motion.div>
                )}

                {gameState === 'ERROR_FEEDBACK' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 px-6 py-2.5 bg-rose-500/20 border border-rose-400/50 rounded-2xl flex items-center gap-2 text-rose-300 font-bold text-base"
                  >
                    <span>Попробуй ещё раз</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Rule Hint after 2 consecutive errors */}
          <AnimatePresence>
            {showRuleHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 bg-amber-500/20 border border-amber-400/60 rounded-2xl max-w-sm w-full text-center"
              >
                <div className="text-xs text-amber-300 font-bold mb-2 flex items-center justify-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>Подсказка движения:</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  {activeColors.map((col) => {
                    const act = currentRule[col];
                    return (
                      <div key={col} className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
                        <LumiAsset type="circle" color={col} size="small" className="w-5 h-5 object-contain" />
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xl">{ACTION_INFO[act].icon}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Controls Area (Physical Action Input Buttons) */}
        {gameState !== 'DANCE_FINALE' && gameState !== 'GAME_COMPLETE' && (
          <div className="w-full pt-2 pb-4">
            <div className="text-center text-xs text-slate-400 mb-2">
              Сделай движение и нажми соответствующую кнопку:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
              {/* Clap Button */}
              <button
                type="button"
                onClick={() => handleSelectAction('clap')}
                disabled={gameState !== 'INPUT'}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition shadow-lg active:scale-95 ${
                  gameState === 'INPUT'
                    ? 'bg-slate-800 hover:bg-slate-700 border-indigo-500/50 hover:border-indigo-400 text-white cursor-pointer'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span className="text-4xl">👏</span>
                <span className="text-sm font-bold text-slate-200">Хлопок</span>
              </button>

              {/* Stomp Button */}
              <button
                type="button"
                onClick={() => handleSelectAction('stomp')}
                disabled={gameState !== 'INPUT'}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition shadow-lg active:scale-95 ${
                  gameState === 'INPUT'
                    ? 'bg-slate-800 hover:bg-slate-700 border-indigo-500/50 hover:border-indigo-400 text-white cursor-pointer'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span className="text-4xl">👣</span>
                <span className="text-sm font-bold text-slate-200">Топот</span>
              </button>

              {/* Squat Button (Shown in Level 2 and 3) */}
              {level >= 2 && (
                <button
                  type="button"
                  onClick={() => handleSelectAction('squat')}
                  disabled={gameState !== 'INPUT'}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition shadow-lg active:scale-95 col-span-2 sm:col-span-1 ${
                    gameState === 'INPUT'
                      ? 'bg-slate-800 hover:bg-slate-700 border-indigo-500/50 hover:border-indigo-400 text-white cursor-pointer'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span className="text-4xl">🧘</span>
                  <span className="text-sm font-bold text-slate-200">Приседание</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorDanceGame;
