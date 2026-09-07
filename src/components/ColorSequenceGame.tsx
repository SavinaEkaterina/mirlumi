import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SequenceColor, SequenceTrialData } from '../types';
import { playSound } from '../utils/audio';
import { speakLumi, stopLumiVoice, setVoiceSilenceMode } from '../utils/voiceManager';
import { LumiCharacter } from './LumiCharacter';
import { LumiAsset } from './LumiAsset';

interface ColorSequenceGameProps {
  soundEnabled: boolean;
  onSelectGame: (game: 'TRAFFIC_LIGHT' | 'COLOR_SEQUENCE') => void;
  onReturnToLumiWorld: () => void;
  onTrialsUpdate?: (trials: SequenceTrialData[]) => void;
}

type StepPhase =
  | 'INTRO'             // Intro message before level
  | 'SHOW'              // Showing stimulus sequence item by item
  | 'SHOW_FULL'         // Full sequence stays visible together
  | 'DISAPPEAR_PAUSE'   // Sequence disappears; pause before recall
  | 'REPRODUCE'         // Child clicks color buttons in order
  | 'CHECK'             // Evaluating answer
  | 'LEVEL_SUCCESS'     // Intermediate level completion banner
  | 'GAME_COMPLETE'     // Final level 3 completion celebration
  | 'BREAK_PROPOSAL';   // Offer break on 2 consecutive failed attempts on Level 2 or 3

// Neuropsychological timing parameters (in ms)
const DISPLAY_DURATION_PER_ITEM = 1200; // Time per item reveal step (Phase 1)
const MEMORIZATION_DURATION = 8000;     // Time FULL sequence stays visible together (Phase 2 - 8 sec)

const getRecallDelay = (lvl: number): number => {
  if (lvl === 3) return 2000; // Level 3 retention pause after disappearance (Phase 4)
  return 1000;                // Level 1 & 2 retention pause
};

const COLOR_CONFIGS: Record<SequenceColor, { label: string; bgClass: string; borderClass: string; glowClass: string; emoji: string }> = {
  green: {
    label: 'ЗЕЛЁНЫЙ',
    bgClass: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white',
    borderClass: 'border-emerald-600',
    glowClass: 'shadow-emerald-400/80 ring-4 ring-emerald-300',
    emoji: '🟢',
  },
  red: {
    label: 'КРАСНЫЙ',
    bgClass: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
    borderClass: 'border-red-600',
    glowClass: 'shadow-red-400/80 ring-4 ring-red-300',
    emoji: '🔴',
  },
  yellow: {
    label: 'ЖЁЛТЫЙ',
    bgClass: 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950',
    borderClass: 'border-amber-500',
    glowClass: 'shadow-amber-400/80 ring-4 ring-amber-300',
    emoji: '🟡',
  },
};

// Lumi's Glass Progress Flask Component
const LumiFlask: React.FC<{
  recoveredLayers: SequenceColor[][];
  targetCount: number;
  isAnimating: boolean;
}> = ({ recoveredLayers, targetCount, isAnimating }) => {
  const currentCount = Math.min(recoveredLayers.length, targetCount);
  const fillPercent = Math.round((currentCount / targetCount) * 100);

  return (
    <div className="relative flex flex-col items-center select-none my-1">
      {/* Container slot prepared for future 3D Lumi Flask asset */}
      <div className="relative w-28 sm:w-32 h-36 sm:h-40 bg-indigo-900/10 backdrop-blur-xs rounded-3xl border-2 border-dashed border-indigo-300/60 shadow-md overflow-hidden flex flex-col justify-end p-1.5 transition-all">
        {/* Liquid / Colored Layers Fill */}
        <motion.div
          className="w-full rounded-2xl overflow-hidden flex flex-col-reverse gap-1 p-1 transition-all duration-700 relative bg-gradient-to-t from-indigo-500/20 via-purple-500/15 to-transparent"
          animate={{ height: `${Math.max(fillPercent, 12)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {recoveredLayers.map((layer, lIdx) => (
            <motion.div
              key={lIdx}
              initial={{ scale: 0, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: lIdx * 0.1, duration: 0.4 }}
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl bg-white/60 backdrop-blur-xs border border-white/80 shadow-xs"
            >
              {layer.map((col, cIdx) => (
                <motion.div
                  key={cIdx}
                  animate={isAnimating ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-center filter drop-shadow-md"
                >
                  <LumiAsset assetId={`lumi_ball_${col}`} size="small" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </motion.div>

        {/* Particle sparkles during fill animation */}
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.2, 1, 0], scale: [0.8, 1.3, 1.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-amber-300/30 rounded-3xl pointer-events-none z-30 flex items-center justify-center text-3xl"
          >
            ✨
          </motion.div>
        )}

        {/* Celebration shimmer when full */}
        {fillPercent >= 100 && (
          <motion.div
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 bg-amber-200/40 rounded-3xl pointer-events-none z-30 border-2 border-amber-300"
          />
        )}
      </div>

      {/* Flask Label */}
      <div className="mt-2 text-center">
        <span className="bg-white/95 text-indigo-950 text-xs font-black px-3 py-1 rounded-full shadow-md border border-indigo-200 inline-flex items-center gap-1.5">
          <span>🧪</span>
          <span>Колба Луми</span>
          {fillPercent >= 100 && <span>✨</span>}
        </span>
      </div>
    </div>
  );
};

export const ColorSequenceGame: React.FC<ColorSequenceGameProps> = ({
  soundEnabled,
  onSelectGame,
  onReturnToLumiWorld,
  onTrialsUpdate,
}) => {
  // Game Configuration State
  const [level, setLevel] = useState<number>(1); // Level 1, 2, 3
  const [phase, setPhase] = useState<StepPhase>('INTRO');
  
  // Trial & Sequence State
  const [stimulusSequence, setStimulusSequence] = useState<SequenceColor[]>([]);
  const [childSequence, setChildSequence] = useState<SequenceColor[]>([]);
  const [activeShowIndex, setActiveShowIndex] = useState<number | null>(null);

  // Debug & Event Tracking State (Ensures 1 physical click = 1 sequence position)
  const [inputEventCount, setInputEventCount] = useState<number>(0);
  const [sequenceInputCount, setSequenceInputCount] = useState<number>(0);
  const [lastInputDebug, setLastInputDebug] = useState<{
    eventId: string;
    inputEventCount: number;
    currentPositionBefore: number;
    selectedColor: SequenceColor;
    expectedColor: SequenceColor;
    currentPositionAfter: number;
    childSequenceBefore: SequenceColor[];
    childSequenceAfter: SequenceColor[];
    correctForPosition: boolean;
    attemptCompleted: boolean;
    attemptCorrect: boolean;
  } | null>(null);

  const inputEventCountRef = useRef<number>(0);
  const sequenceInputCountRef = useRef<number>(0);
  const childSequenceRef = useRef<SequenceColor[]>([]);
  const lastInputTimestampRef = useRef<number>(0);
  
  // Feedback & Hints
  const [lumiMessage, setLumiMessage] = useState<string>('');
  const [lumiState, setLumiState] = useState<'happy' | 'thinking' | 'encouraging'>('happy');
  const [wrongSelectionIndex, setWrongSelectionIndex] = useState<number | null>(null);
  const [isSimplifiedMode, setIsSimplifiedMode] = useState<boolean>(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [hasReachedMinimumLevel, setHasReachedMinimumLevel] = useState<boolean>(false);
  const [successfulLevel2To3Transitions, setSuccessfulLevel2To3Transitions] = useState<number>(0);
  const [hintActive, setHintActive] = useState<boolean>(false);
  const [isVoiceInstructionPlaying, setIsVoiceInstructionPlaying] = useState<boolean>(false);
  const [game2IntroPlayed, setGame2IntroPlayed] = useState<boolean>(false);
  const introPlayedRef = useRef<boolean>(false);

  // History & Debug
  const [allTrials, setAllTrials] = useState<SequenceTrialData[]>([]);
  const [seriesTrials, setSeriesTrials] = useState<SequenceTrialData[]>([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());

  // Lumi's Glass Flask level progress state
  const [recoveredColorLayers, setRecoveredColorLayers] = useState<SequenceColor[][]>([]);
  const [isFillingFlask, setIsFillingFlask] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to clear pending timers and voice on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stopLumiVoice();
    };
  }, []);

  // Sync trials to parent for DevPanel debug logging
  useEffect(() => {
    if (onTrialsUpdate) {
      onTrialsUpdate(allTrials);
    }
  }, [allTrials, onTrialsUpdate]);

  // Generate sequence helper
  const generateSequence = (length: number): SequenceColor[] => {
    const colors: SequenceColor[] = ['green', 'red', 'yellow'];
    if (length >= 4) {
      // Must contain all 3 available colors ('green', 'red', 'yellow') at least once
      let seq: SequenceColor[] = [];
      let valid = false;
      while (!valid) {
        seq = [];
        for (let i = 0; i < length; i++) {
          const rand = Math.floor(Math.random() * colors.length);
          seq.push(colors[rand]);
        }
        if (seq.includes('green') && seq.includes('red') && seq.includes('yellow')) {
          valid = true;
        }
      }
      return seq;
    }
    const result: SequenceColor[] = [];
    for (let i = 0; i < length; i++) {
      const rand = Math.floor(Math.random() * colors.length);
      result.push(colors[rand]);
    }
    return result;
  };

  // Get current target sequence length
  const getTargetSequenceLength = (lvl: number): number => {
    if (lvl === 1) return 2;
    if (lvl === 2) return 3;
    if (lvl >= 3) return 4;
    return 2;
  };

  // Get target correct count required to fill the flask for current level
  const getTargetCorrectForLevel = (lvl: number): number => {
    if (lvl === 1) return 3;
    return 4; // Level 2 & 3 require 4 correct
  };

  const COLOR_NAMES_VOICE: Record<SequenceColor, string> = {
  green: 'Зелёный',
  red: 'Красный',
  yellow: 'Жёлтый',
};

// Helper to start the visual demonstration phase item-by-item with spoken color names
  const startDemoSequence = (seq: SequenceColor[], lvl: number) => {
    setVoiceSilenceMode(false);
    setIsVoiceInstructionPlaying(true);
    setActiveShowIndex(0);
    setPhase('SHOW');

    const showItem = (idx: number) => {
      setActiveShowIndex(idx);
      playSound('click', soundEnabled);

      const color = seq[idx];
      const colorName = COLOR_NAMES_VOICE[color];
      setLumiMessage(colorName);

      speakLumi(colorName, {
        soundEnabled,
        force: true,
        speechKey: `seq_show_${colorName}_${idx}`,
        onEnd: () => {
          timerRef.current = setTimeout(() => {
            if (idx + 1 < seq.length) {
              showItem(idx + 1);
            } else {
              // Phase 2: Show full sequence together during memorizationDuration
              setPhase('SHOW_FULL');
              setActiveShowIndex(null);
              setLumiMessage('Посмотри внимательно! Запомни все цвета ✨');
              playSound('click', soundEnabled);

              timerRef.current = setTimeout(() => {
                // Phase 3: Sequence disappears -> start recallDelay pause
                setPhase('DISAPPEAR_PAUSE');
                setLumiMessage('Ой! Цвета исчезли. Поможешь мне их вернуть? 🌈');

                const delay = getRecallDelay(lvl);

                timerRef.current = setTimeout(() => {
                  // Phase 4: Reproduction phase
                  setLumiMessage('Нажимай цвета в том порядке, в котором они были показаны 👇');

                  speakLumi('Теперь повтори.', {
                    soundEnabled,
                    force: true,
                    onEnd: () => {
                      setIsVoiceInstructionPlaying(false);
                      setPhase('REPRODUCE');
                      setTrialStartTime(Date.now());
                    },
                  });
                }, delay);
              }, MEMORIZATION_DURATION);
            }
          }, 350);
        },
      });
    };

    showItem(0);
  };

  // Start new trial
  const prepareNextTrial = (lvl = level) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const targetLen = getTargetSequenceLength(lvl);
    const newSeq = generateSequence(targetLen);
    
    setStimulusSequence(newSeq);
    setChildSequence([]);
    childSequenceRef.current = [];
    inputEventCountRef.current = 0;
    setInputEventCount(0);
    sequenceInputCountRef.current = 0;
    setSequenceInputCount(0);
    lastInputTimestampRef.current = 0;

    setActiveShowIndex(null);
    setWrongSelectionIndex(null);
    setLumiState('happy');
    setLumiMessage('Смотри внимательно. Запомни цвета ✨');

    if (!introPlayedRef.current) {
      introPlayedRef.current = true;
      setGame2IntroPlayed(true);

      // Speak full intro instruction ONCE at start of session, wait for onEnd -> short pause -> startDemoSequence
      setVoiceSilenceMode(false);
      setIsVoiceInstructionPlaying(true);
      speakLumi('Смотри внимательно. Запомни цвета\u0301. Потом попробуй повторить их.', {
        soundEnabled,
        force: true,
        onEnd: () => {
          timerRef.current = setTimeout(() => {
            setIsVoiceInstructionPlaying(false);
            startDemoSequence(newSeq, lvl);
          }, 400);
        },
      });
    } else {
      // Intro already played in this game session; start demonstration directly
      timerRef.current = setTimeout(() => {
        startDemoSequence(newSeq, lvl);
      }, 300);
    }
  };

  // Re-show sequence (Hint / Retry on same trial)
  const reShowSequence = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setChildSequence([]);
    childSequenceRef.current = [];
    inputEventCountRef.current = 0;
    setInputEventCount(0);
    sequenceInputCountRef.current = 0;
    setSequenceInputCount(0);
    lastInputTimestampRef.current = 0;

    setActiveShowIndex(null);
    setWrongSelectionIndex(null);
    setLumiState('encouraging');
    setLumiMessage('Давай посмотрим ещё раз 👁️✨');

    // Speech was already handled on error ("Попробуй ещё раз."); start demo sequence cleanly
    startDemoSequence(stimulusSequence, level);
  };

  // Start Level
  const startLevel = (lvl: number) => {
    if (lvl === 3 && level === 2) {
      setSuccessfulLevel2To3Transitions((prev) => prev + 1);
    }

    setLevel(lvl);
    setSeriesTrials([]);
    setRecoveredColorLayers([]);
    setIsFillingFlask(false);
    setIsSimplifiedMode(false);
    setConsecutiveErrors(0);
    setChildSequence([]);
    childSequenceRef.current = [];
    inputEventCountRef.current = 0;
    setInputEventCount(0);
    sequenceInputCountRef.current = 0;
    setSequenceInputCount(0);
    lastInputTimestampRef.current = 0;

    if (lvl === 1) {
      introPlayedRef.current = false;
      setGame2IntroPlayed(false);
      setHasReachedMinimumLevel(false);
      setSuccessfulLevel2To3Transitions(0);
    }

    setVoiceSilenceMode(false);
    setPhase('INTRO');
    let msg = '';
    if (lvl === 1) {
      msg = 'Уровень 1: Помоги наполнить колбу Луми цветами! Запомни 2 цвета.';
    } else if (lvl === 2) {
      msg = 'Уровень 2: Ух ты! Теперь наполняем колбу 3 цветами!';
    } else {
      msg = 'Уровень 3: Финал! Заполняем колбу с паузой!';
    }
    setLumiMessage(msg);
  };

  // Child clicks color button during REPRODUCE
  const handleColorClick = (color: SequenceColor) => {
    // Only accept input during active REPRODUCE phase and when instruction is not playing
    if (phase !== 'REPRODUCE' || isVoiceInstructionPlaying) return;

    const now = Date.now();
    // Guard against duplicate physical events (ghost clicks from touch/click synthesis within 100ms)
    if (now - lastInputTimestampRef.current < 100) {
      console.warn('[NeuroGame] Duplicate physical event blocked:', color, 'dt:', now - lastInputTimestampRef.current);
      return;
    }

    const currentPosBefore = childSequenceRef.current.length;

    // Do not accept inputs beyond required stimulus length
    if (currentPosBefore >= stimulusSequence.length) {
      return;
    }

    lastInputTimestampRef.current = now;

    // Determine expected color at this position and immediate correctness
    const expectedColor = stimulusSequence[currentPosBefore];
    const isCorrectForPosition = color === expectedColor;

    // Update child sequence synchronously in Ref & React state
    const updatedChildSeq = [...childSequenceRef.current, color];
    childSequenceRef.current = updatedChildSeq;
    setChildSequence(updatedChildSeq);

    // Update physical input event counter & sequence counter
    inputEventCountRef.current += 1;
    setInputEventCount(inputEventCountRef.current);
    sequenceInputCountRef.current = updatedChildSeq.length;
    setSequenceInputCount(updatedChildSeq.length);

    const isLastPosition = updatedChildSeq.length === stimulusSequence.length;
    const isAttemptCompleted = !isCorrectForPosition || isLastPosition;
    const isAttemptCorrect = isCorrectForPosition && isLastPosition;

    const debugInfo = {
      eventId: `evt_${now}_${inputEventCountRef.current}`,
      inputEventCount: inputEventCountRef.current,
      currentPositionBefore: currentPosBefore,
      selectedColor: color,
      expectedColor,
      currentPositionAfter: updatedChildSeq.length,
      childSequenceBefore: childSequenceRef.current.slice(0, currentPosBefore),
      childSequenceAfter: updatedChildSeq,
      correctForPosition: isCorrectForPosition,
      attemptCompleted: isAttemptCompleted,
      attemptCorrect: isAttemptCorrect,
    };
    setLastInputDebug(debugInfo);

    if (!isCorrectForPosition) {
      // INCORRECT COLOR CHOSEN AT THIS POSITION!
      // Immediately set phase to CHECK to disable all buttons and lock input
      setPhase('CHECK');
      playSound('wrong', soundEnabled);
      setLumiState('encouraging');
      setLumiMessage('Давай попробуем ещё раз 💛');
      setHintActive(true);
      setWrongSelectionIndex(currentPosBefore);

      const responseTime = Date.now() - trialStartTime;
      const trialData: SequenceTrialData = {
        id: 'seq_' + Date.now(),
        trialNumber: allTrials.length + 1,
        stimulusSequence,
        childSequence: updatedChildSeq,
        sequenceLength: stimulusSequence.length,
        correct: false,
        matchedPositions: currentPosBefore,
        firstErrorPosition: currentPosBefore + 1,
        orderError: false,
        omissionError: false,
        intrusionError: false,
        hintUsed: hintActive,
        responseTimeMs: responseTime,
        difficultyLevel: level,
        timestamp: Date.now(),
        phase: `LEVEL_${level}`,
      };

      const newAllTrials = [...allTrials, trialData];
      const newSeriesTrials = [...seriesTrials, trialData];
      setAllTrials(newAllTrials);
      setSeriesTrials(newSeriesTrials);

      const newErrCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrCount);

      setVoiceSilenceMode(false);
      setIsVoiceInstructionPlaying(true);

      if (newErrCount >= 2) {
        if (
          level === 1 ||
          hasReachedMinimumLevel ||
          (level === 3 && successfulLevel2To3Transitions >= 2)
        ) {
          // Offer break proposal if on Level 1, if child already reached minimum level 1 earlier, or if on Level 3 after >= 2 successful 2->3 transitions
          setLumiState('encouraging');
          setLumiMessage('Кажется, сегодня эти цвета решили немного похитрить 😊 Давай отдохнём и попробуем потом.');
          speakLumi('Давай сделаем перерыв? Можешь погулять по Миру Луми или выбрать другую игру.', {
            soundEnabled,
            force: true,
            onEnd: () => {
              setIsVoiceInstructionPlaying(false);
              if (timerRef.current) clearTimeout(timerRef.current);
              setPhase('BREAK_PROPOSAL');
            },
          });
        } else {
          // Level > 1 and hasReachedMinimumLevel is false: Step down by exactly 1 level (3 -> 2, 2 -> 1)
          const nextLvl = level - 1;
          if (nextLvl === 1) {
            setHasReachedMinimumLevel(true);
          }
          setLumiState('encouraging');
          setLumiMessage('Давай попробуем ещё раз.');
          speakLumi('Давай попробуем ещё раз.', {
            soundEnabled,
            force: true,
            onEnd: () => {
              setIsVoiceInstructionPlaying(false);
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                setLevel(nextLvl);
                setConsecutiveErrors(0);
                setSeriesTrials([]);
                setRecoveredColorLayers([]);
                prepareNextTrial(nextLvl);
              }, 400);
            },
          });
        }
      } else {
        // Single error on current level: encourage and re-show sequence
        setLumiState('encouraging');
        setLumiMessage('Давай попробуем ещё раз.');
        speakLumi('Давай попробуем ещё раз.', {
          soundEnabled,
          force: true,
          onEnd: () => {
            setIsVoiceInstructionPlaying(false);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              reShowSequence();
            }, 400);
          },
        });
      }

      return;
    }

    // CORRECT COLOR FOR THIS POSITION
    if (isLastPosition) {
      // LAST POSITION REACHED - ENTIRE SEQUENCE IS CORRECT!
      setPhase('CHECK');
      playSound('correct', soundEnabled);
      setLumiState('happy');
      setConsecutiveErrors(0);

      setRecoveredColorLayers((prev) => [...prev, stimulusSequence]);
      setIsFillingFlask(true);

      const responseTime = Date.now() - trialStartTime;
      const trialData: SequenceTrialData = {
        id: 'seq_' + Date.now(),
        trialNumber: allTrials.length + 1,
        stimulusSequence,
        childSequence: updatedChildSeq,
        sequenceLength: stimulusSequence.length,
        correct: true,
        matchedPositions: stimulusSequence.length,
        firstErrorPosition: null,
        orderError: false,
        omissionError: false,
        intrusionError: false,
        hintUsed: hintActive,
        responseTimeMs: responseTime,
        difficultyLevel: level,
        timestamp: Date.now(),
        phase: `LEVEL_${level}`,
      };

      const newAllTrials = [...allTrials, trialData];
      const newSeriesTrials = [...seriesTrials, trialData];

      setAllTrials(newAllTrials);
      setSeriesTrials(newSeriesTrials);

      const targetCount = getTargetCorrectForLevel(level);
      const correctCount = newSeriesTrials.filter((t) => t.correct).length;

      if (correctCount >= targetCount) {
        setLumiMessage('Ура! Все цвета возвращаются! Колба полная! 🌈✨');
        speakLumi('Получилось! Колба полная!', { soundEnabled, force: true });
      } else {
        setLumiMessage('Правильно! Цвета возвращаются в колбу Луми! ✨');
        speakLumi('Получилось!', { soundEnabled, force: true });
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsFillingFlask(false);

        if (level === 1) {
          if (correctCount >= 3) {
            setPhase('LEVEL_SUCCESS');
            playSound('cheer', soundEnabled);
            speakLumi('Ого! Получилось! А если цветов будет побольше — сможем справиться?', { soundEnabled, force: true });
            return;
          } else if (newSeriesTrials.length >= 4) {
            setSeriesTrials([]);
            setRecoveredColorLayers([]);
            prepareNextTrial(1);
            return;
          }
        } else if (level === 2) {
          if (correctCount >= 4) {
            setPhase('LEVEL_SUCCESS');
            playSound('cheer', soundEnabled);
            speakLumi('Ого! Получилось! А если цветов будет побольше — сможем справиться?', { soundEnabled, force: true });
            return;
          } else if (newSeriesTrials.length >= 6) {
            if (hasReachedMinimumLevel) {
              setPhase('BREAK_PROPOSAL');
              return;
            }
            const nextLvl = 1;
            setLevel(nextLvl);
            setHasReachedMinimumLevel(true);
            setConsecutiveErrors(0);
            setSeriesTrials([]);
            setRecoveredColorLayers([]);
            prepareNextTrial(nextLvl);
            return;
          }
        } else if (level === 3) {
          if (correctCount >= 4) {
            setPhase('GAME_COMPLETE');
            playSound('cheer', soundEnabled);
            speakLumi('Ура! Ты запомнил все цвета!', { soundEnabled, force: true });
            return;
          } else if (newSeriesTrials.length >= 6) {
            if (successfulLevel2To3Transitions >= 2 || hasReachedMinimumLevel) {
              setPhase('BREAK_PROPOSAL');
              return;
            }
            const nextLvl = 2;
            setLevel(nextLvl);
            setConsecutiveErrors(0);
            setSeriesTrials([]);
            setRecoveredColorLayers([]);
            prepareNextTrial(nextLvl);
            return;
          }
        }

        prepareNextTrial();
      }, 1600);
    } else {
      // CORRECT COLOR SO FAR, BUT MORE POSITIONS REMAIN IN SEQUENCE
      playSound('click', soundEnabled);
      // Stay in REPRODUCE phase, ready for next click
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col items-center box-border">
      {/* Top Title Bar */}
      <div className="w-full flex items-center justify-between bg-white/90 backdrop-blur-xs px-4 py-3 rounded-2xl shadow-md border border-indigo-200 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌈</span>
          <div>
            <h1 className="font-extrabold text-indigo-950 text-base sm:text-lg">
              Луми потерял цвета
            </h1>
            <p className="text-indigo-800 text-xs font-semibold">
              Уровень {level} из 3 • {level === 1 ? '2 цвета в цепочке' : level === 2 ? '3 цвета в цепочке' : '4 цвета в цепочке (с паузой)'}
            </p>
          </div>
        </div>

        <button
          onClick={onReturnToLumiWorld}
          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl border border-indigo-300 transition-all cursor-pointer flex items-center gap-1"
        >
          <span>🌍</span>
          <span>Мир Луми</span>
        </button>
      </div>

      {/* Lumi Character & Lumi's Glass Progress Flask */}
      <div className="my-2 text-center w-full max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <LumiCharacter
          state={lumiState}
          speechBubble={lumiMessage}
          size="medium"
          soundEnabled={soundEnabled}
          autoSpeak={false}
        />
        {(phase === 'SHOW' || phase === 'SHOW_FULL' || phase === 'DISAPPEAR_PAUSE' || phase === 'REPRODUCE' || phase === 'CHECK') && (
          <LumiFlask
            recoveredLayers={recoveredColorLayers}
            targetCount={getTargetCorrectForLevel(level)}
            isAnimating={isFillingFlask}
          />
        )}
      </div>

      {/* INTRO SCREEN FOR LEVEL */}
      {phase === 'INTRO' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 rounded-3xl p-6 shadow-2xl border-4 border-indigo-300 text-center max-w-md my-6"
        >
          <div className="text-5xl mb-3">
            {level === 1 ? '🌱' : level === 2 ? '⭐' : '🏆'}
          </div>
          <h2 className="text-2xl font-black text-indigo-950 mb-2">
            Уровень {level}
          </h2>
          <p className="text-indigo-900 font-medium text-sm sm:text-base mb-6">
            {level === 1 && 'Луми растерял цвета! Запомни последовательность из 2 цветов.'}
            {level === 2 && 'Отлично! Теперь запоминаем 3 цвета в правильном порядке.'}
            {level === 3 && 'Финальный этап! Запомни цепочку из 4 цветов с короткой паузой.'}
          </p>

          <button
            onClick={() => prepareNextTrial(level)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xl py-4 rounded-2xl shadow-lg border-2 border-indigo-700 transition-all cursor-pointer"
          >
            ПОЕХАЛИ! ➔
          </button>
        </motion.div>
      )}

      {/* MAIN PLAYING FIELD (SHOW / SHOW_FULL / DISAPPEAR / REPRODUCE / CHECK) */}
      {(phase === 'SHOW' || phase === 'SHOW_FULL' || phase === 'DISAPPEAR_PAUSE' || phase === 'REPRODUCE' || phase === 'CHECK') && (
        <div className="w-full max-w-2xl flex flex-col items-center my-4">
          {/* Target Sequence Display Slots */}
          <div className="bg-slate-900/90 p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-slate-700 w-full mb-6 flex flex-col items-center justify-center min-h-[160px]">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
              {(phase === 'SHOW' || phase === 'SHOW_FULL') && '👀 Запоминай порядок!'}
              {phase === 'DISAPPEAR_PAUSE' && '⌛ Пауза... Помнишь цвета?'}
              {phase === 'REPRODUCE' && '👇 Повтори последовательность:'}
              {phase === 'CHECK' && '🔍 Проверяем...'}
            </span>

            <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap min-h-[80px]">
              {/* PHASE 1: SHOW item by item (cumulative reveal, no empty placeholders) */}
              {phase === 'SHOW' && (
                stimulusSequence.slice(0, (activeShowIndex ?? 0) + 1).map((color, idx) => {
                  const conf = COLOR_CONFIGS[color];
                  const isNewest = idx === activeShowIndex;
                  return (
                    <motion.div
                      key={`show_${idx}`}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: isNewest ? [0.8, 1.15, 1] : 1, opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center p-2 shadow-lg bg-slate-800/90 ${conf.borderClass} ${conf.glowClass}`}
                    >
                      <LumiAsset assetId={`lumi_ball_${color}`} size="medium" className="w-full h-full object-contain filter drop-shadow-lg" />
                    </motion.div>
                  );
                })
              )}

              {/* PHASE 2: SHOW_FULL (entire sequence visible together) */}
              {phase === 'SHOW_FULL' && (
                stimulusSequence.map((color, idx) => {
                  const conf = COLOR_CONFIGS[color];
                  return (
                    <motion.div
                      key={`full_${idx}`}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.4 }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center p-2 shadow-lg bg-slate-800/90 ${conf.borderClass} ${conf.glowClass}`}
                    >
                      <LumiAsset assetId={`lumi_ball_${color}`} size="medium" className="w-full h-full object-contain filter drop-shadow-lg" />
                    </motion.div>
                  );
                })
              )}

              {/* PHASE 3: DISAPPEAR_PAUSE (sequence hidden during retention delay) */}
              {phase === 'DISAPPEAR_PAUSE' && (
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-base sm:text-lg animate-pulse py-2">
                  <span>✨</span>
                  <span>Запоминаем...</span>
                  <span>✨</span>
                </div>
              )}

              {/* PHASE 4: REPRODUCE or CHECK (child input slots) */}
              {(phase === 'REPRODUCE' || phase === 'CHECK') && (
                stimulusSequence.map((_, idx) => {
                  const isChildFilled = childSequence.length > idx;
                  const childColor = isChildFilled ? childSequence[idx] : null;

                  return (
                    <motion.div
                      key={`repro_${idx}`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: isChildFilled ? 1.08 : 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl shadow-lg transition-all ${
                        childColor
                          ? `bg-slate-800/90 ${COLOR_CONFIGS[childColor].borderClass} ${COLOR_CONFIGS[childColor].glowClass} p-2`
                          : 'bg-slate-800 border-slate-600 border-dashed text-slate-500 font-extrabold text-xl'
                      }`}
                    >
                      {childColor ? (
                        <LumiAsset assetId={`lumi_ball_${childColor}`} size="medium" className="w-full h-full object-contain filter drop-shadow-lg" />
                      ) : (
                        `${idx + 1}`
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Debug input counter indicator (inputEventCount vs sequenceInputCount) */}
          {(phase === 'REPRODUCE' || phase === 'CHECK') && (
            <div className="flex flex-col items-center gap-1 my-1">
              <div className="text-[11px] font-mono text-indigo-300/80 bg-slate-900/60 px-3 py-1 rounded-full border border-indigo-900/50 flex flex-wrap items-center justify-center gap-2">
                <span>физических кликов: <strong className="text-amber-400">{inputEventCount}</strong></span>
                <span>•</span>
                <span>записано позиций: <strong className="text-emerald-400">{sequenceInputCount}</strong></span>
              </div>
              {lastInputDebug && (
                <div className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-0.5 rounded-lg border border-slate-800/80 max-w-full overflow-x-auto text-center">
                  <span>pos {lastInputDebug.currentPositionBefore}: </span>
                  <span className="text-amber-300">{COLOR_CONFIGS[lastInputDebug.selectedColor].emoji}</span>
                  <span> vs expected </span>
                  <span className="text-indigo-300">{COLOR_CONFIGS[lastInputDebug.expectedColor].emoji}</span>
                  <span> → </span>
                  <strong className={lastInputDebug.correctForPosition ? 'text-emerald-400' : 'text-rose-400'}>
                    {lastInputDebug.correctForPosition ? '✅ OK' : '❌ ERROR'}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* COLOR INPUT BUTTONS (Only visible during REPRODUCE phase) */}
          <AnimatePresence>
            {phase === 'REPRODUCE' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full grid grid-cols-3 gap-3 sm:gap-4"
              >
                {(['green', 'red', 'yellow'] as SequenceColor[]).map((col) => {
                  const conf = COLOR_CONFIGS[col];
                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={isVoiceInstructionPlaying}
                      onClick={(e) => {
                        e.preventDefault();
                        handleColorClick(col);
                      }}
                      className={`${conf.bgClass} border-b-4 ${conf.borderClass} font-black text-sm sm:text-lg py-5 px-3 rounded-2xl shadow-xl transition-transform ${isVoiceInstructionPlaying ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 cursor-pointer'} flex flex-col items-center justify-center gap-1 touch-manipulation select-none`}
                    >
                      <LumiAsset assetId={`lumi_ball_${col}`} size="medium" className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter drop-shadow-md" />
                      <span>{conf.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* INTERMEDIATE LEVEL SUCCESS */}
      {phase === 'LEVEL_SUCCESS' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-emerald-500 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-emerald-600 text-center max-w-md my-6"
        >
          <div className="text-6xl mb-3">🌟 ✨ 🌟</div>
          <h2 className="text-3xl font-black mb-2">Уровень {level} пройден!</h2>
          <p className="text-emerald-100 font-bold text-base mb-6">
            Отлично сработано! Луми уже вспоминает цвета!
          </p>

          <button
            onClick={() => startLevel(level + 1)}
            className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-black text-xl py-4 rounded-2xl shadow-lg border-2 border-amber-500 cursor-pointer transition-all"
          >
            СЛЕДУЮЩИЙ УРОВЕНЬ ➔
          </button>
        </motion.div>
      )}

      {/* BREAK PROPOSAL MODAL (OFFER PAUSE ON LEVEL 2/3 AFTER 2 FAILED ATTEMPTS) */}
      {phase === 'BREAK_PROPOSAL' && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/95 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center max-w-lg my-6 z-20"
        >
          <div className="text-5xl mb-3">😊 ✨ 🌈</div>

          <h2 className="text-amber-950 font-black text-2xl mb-3">
            Сделаем перерыв?
          </h2>

          <p className="text-amber-900 font-bold text-base sm:text-lg mb-6 leading-relaxed">
            Кажется, сегодня эти цвета решили немного похитрить 😊
            <br />
            Давай отдохнём и попробуем потом.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                onReturnToLumiWorld();
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-base sm:text-lg py-3.5 px-4 rounded-2xl shadow-lg border-2 border-amber-600 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>Пойти в Мир Луми</span>
              <span>🌍</span>
            </button>

            <button
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                onReturnToLumiWorld();
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-base sm:text-lg py-3.5 px-4 rounded-2xl shadow-lg border-2 border-indigo-700 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>Выбрать другую игру</span>
              <span>🎮</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* FINAL GAME COMPLETE (LEVEL 3 WINNER) */}
      {phase === 'GAME_COMPLETE' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-pink-400 text-center max-w-lg my-6"
        >
          {/* Animated Rainbow / Colors Assembled */}
          <div className="flex justify-center gap-3 text-5xl mb-4 animate-bounce">
            <span>🟢</span>
            <span>🔴</span>
            <span>🟡</span>
            <span>🌈</span>
          </div>

          <h2 className="text-3xl font-black mb-2">Ура! Все цвета на месте!</h2>
          <p className="text-indigo-100 font-extrabold text-lg mb-6">
            «Ты помог мне вернуть все цвета! Ты супер-помощник!» — радуется Луми 🌟
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => startLevel(1)}
              className="flex-1 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-black text-lg py-4 px-4 rounded-2xl shadow-lg border-2 border-amber-500 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>ИГРАТЬ ЕЩЁ</span>
              <span>🔄</span>
            </button>

            <button
              onClick={onReturnToLumiWorld}
              className="flex-1 bg-white hover:bg-slate-100 active:bg-slate-200 text-indigo-950 font-black text-lg py-4 px-4 rounded-2xl shadow-lg border-2 border-indigo-200 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>ВЫБРАТЬ ИГРУ</span>
              <span>🌍</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
