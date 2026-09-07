import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  StimulusColor,
  ActionType,
  GamePhase,
  TrialData,
  GameSettings,
  RuleMapping,
  ActiveView,
  SequenceTrialData,
} from './types';
import {
  RULE_MAPPINGS,
  AGE_CONFIGS,
  isRuleSwitchError,
  getLumiMessageForPhase,
} from './utils/neuroLogic';
import { playSound } from './utils/audio';
import { speakLumi, stopLumiVoice } from './utils/voiceManager';
import { LumiState } from './visualSystem/LumiAssetRegistry';
import { LumiCharacter } from './components/LumiCharacter';
import { TrafficLight } from './components/TrafficLight';
import { ActionButtons } from './components/ActionButtons';
import { RuleCard } from './components/RuleCard';
import { Distractors } from './components/Distractors';
import { HeaderBar } from './components/HeaderBar';
import { DevPanel } from './components/DevPanel';
import { CarTrafficScene } from './components/CarTrafficScene';
import { LumiWorldScreen } from './components/LumiWorldScreen';
import { ColorSequenceGame } from './components/ColorSequenceGame';
import { ColorWorldGame, Game3DebugData } from './components/ColorWorldGame';
import { ColorHiddenGame } from './components/ColorHiddenGame';
import { SpotDiffGame } from './components/SpotDiffGame';
import { ColorTrailGame } from './components/ColorTrailGame';
import { RobotMistakeGame } from './components/RobotMistakeGame';
import { ColorOrShapeGame } from './components/ColorOrShapeGame';
import { ColorDanceGame } from './components/ColorDanceGame';
import { AssociationWordGame } from './components/AssociationWordGame';
import { ColorCodeGame } from './components/ColorCodeGame';
import { OddOneOutGame } from './components/OddOneOutGame';
import { LumiGalleryScreen } from './components/LumiGalleryScreen';

export default function App() {
  // Navigation & Multi-Game State
  const [activeView, setActiveView] = useState<ActiveView>('LUMI_WORLD');
  const [sequenceTrials, setSequenceTrials] = useState<SequenceTrialData[]>([]);
  const [game3Debug, setGame3Debug] = useState<Game3DebugData | null>(null);

  // Clean up speech when navigating between games or returning to Lumi World
  useEffect(() => {
    stopLumiVoice();
  }, [activeView]);

  // Game Settings State
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    ageGroup: '3-4',
    distractorsEnabled: true,
    showVisualAnchors: false,
    developerMode: false,
  });

  // Core Game State
  const [phase, setPhase] = useState<GamePhase>('DEMO_NORMAL');
  const [currentRule, setCurrentRule] = useState<RuleMapping>(RULE_MAPPINGS.NORMAL);
  const [stimulusColor, setStimulusColor] = useState<StimulusColor | null>('green');
  const [isBroken, setIsBroken] = useState<boolean>(false);
  const [showYellowLight, setShowYellowLight] = useState<boolean>(false);

  // Interaction & Timing State
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());
  const [wrongSelection, setWrongSelection] = useState<ActionType | null>(null);
  const [highlightedAction, setHighlightedAction] = useState<ActionType | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Hint Support Sequence State
  const [hintActive, setHintActive] = useState<boolean>(false); // Stage 1: Main Lumi RuleCard
  const [hasSoftHintBeenShown, setHasSoftHintBeenShown] = useState<boolean>(false);
  const [showContextualAnchors, setShowContextualAnchors] = useState<boolean>(false); // Stage 2: Contextual light anchors
  const [isSimplifiedMode, setIsSimplifiedMode] = useState<boolean>(false);

  // Trial History & Session Metrics
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [currentPhaseTrials, setCurrentPhaseTrials] = useState<TrialData[]>([]);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [lastTrialResult, setLastTrialResult] = useState<{
    correct: boolean;
    selfCorrection?: boolean;
    hintUsed?: boolean;
    ruleSwitchError?: boolean;
  } | undefined>(undefined);

  // Mini-Series & Recovery Mode State
  const [seriesTrials, setSeriesTrials] = useState<TrialData[]>([]);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);
  const [recoveryTrials, setRecoveryTrials] = useState<TrialData[]>([]);
  const [nextTargetPhase, setNextTargetPhase] = useState<GamePhase | null>(null);
  const [level3Completed, setLevel3Completed] = useState<boolean>(false);

  // Level 3 & Repair Test Queues for guaranteed color distribution
  const level3QueueRef = useRef<StimulusColor[]>([]);
  const repairQueueRef = useRef<StimulusColor[]>([]);
  const [repairCompletedColors, setRepairCompletedColors] = useState<StimulusColor[]>([]);
  const [repairStepCount, setRepairStepCount] = useState<number>(0);
  const [repairCycle, setRepairCycle] = useState<number>(1);
  const [lastRepairEffect, setLastRepairEffect] = useState<{
    color: StimulusColor;
    action: ActionType;
    message: string;
  } | null>(null);

  // Self-Correction Window State
  const [selfCorrectionActive, setSelfCorrectionActive] = useState<boolean>(false);

  // Auto-Next Timers Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get random stimulus color
  const getRandomStimulusColor = useCallback(
    (allowedColors: StimulusColor[]): StimulusColor => {
      const next = allowedColors[Math.floor(Math.random() * allowedColors.length)];
      return next;
    },
    []
  );

  // Advance to new trial stimulus
  const prepareNextTrial = useCallback(
    (currentPhaseVal: GamePhase) => {
      setWrongSelection(null);
      setHighlightedAction(null);
      setIsProcessing(false);
      setSelfCorrectionActive(false);

      let nextColor: StimulusColor = 'green';
      if (currentPhaseVal === 'REPAIR_TEST') {
        if (repairQueueRef.current.length === 0) {
          return;
        }
        nextColor = repairQueueRef.current.shift()!;
      } else if (currentPhaseVal === 'PRACTICE_LEVEL3' || currentPhaseVal === 'DEMO_LEVEL3') {
        if (level3QueueRef.current.length === 0) {
          const balancedSet: StimulusColor[] = ['green', 'green', 'red', 'red', 'yellow', 'yellow'];
          for (let i = balancedSet.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [balancedSet[i], balancedSet[j]] = [balancedSet[j], balancedSet[i]];
          }
          level3QueueRef.current = balancedSet;
        }
        nextColor = level3QueueRef.current.shift()!;
      } else {
        let colors: StimulusColor[] = ['green', 'red'];
        nextColor = getRandomStimulusColor(colors);
      }

      setStimulusColor(nextColor);
      setTrialStartTime(Date.now());
    },
    [getRandomStimulusColor]
  );

  // Phase transition handlers
  const startNormalPractice = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('PRACTICE_NORMAL');
    setCurrentRule(RULE_MAPPINGS.NORMAL);
    setIsBroken(false);
    setShowYellowLight(false);
    setSeriesTrials([]);
    setIsRecoveryMode(false);
    setRecoveryTrials([]);
    setConsecutiveErrors(0);
    setHintActive(false);
    setHasSoftHintBeenShown(false);
    setShowContextualAnchors(false);
    setIsSimplifiedMode(false);
    setLevel3Completed(false);
    prepareNextTrial('PRACTICE_NORMAL');
  };

  const startInvertedPhase = () => {
    setPhase('SWITCH_ANNOUNCEMENT');
    setIsBroken(true);
    playSound('break', settings.soundEnabled);
    speakLumi('Ой! Кажется, светофор сломался! Теперь правила изменились. Красный — иди. Зелёный — стоп.', { soundEnabled: settings.soundEnabled, force: true });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase('DEMO_INVERTED');
      setCurrentRule(RULE_MAPPINGS.INVERTED);
    }, 2800);
  };

  const startInvertedPractice = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('PRACTICE_INVERTED');
    setCurrentRule(RULE_MAPPINGS.INVERTED);
    setIsBroken(true);
    setShowYellowLight(false);
    setCurrentPhaseTrials([]);
    setSeriesTrials([]);
    setIsRecoveryMode(false);
    setRecoveryTrials([]);
    setConsecutiveErrors(0);
    setHintActive(false);
    setHasSoftHintBeenShown(false);
    setShowContextualAnchors(false);
    setIsSimplifiedMode(false);
    setLevel3Completed(false);
    prepareNextTrial('PRACTICE_INVERTED');
  };

  const startLevel3Phase = () => {
    setPhase('LEVEL_3_ANNOUNCEMENT');
    setShowYellowLight(true);
    playSound('cheer', settings.soundEnabled);
    speakLumi('Ух ты! Светофор мигает жёлтым! Появился новый жёлтый цвет! Жёлтый — хлопни.', { soundEnabled: settings.soundEnabled, force: true });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase('DEMO_LEVEL3');
      setCurrentRule(RULE_MAPPINGS.LEVEL3);
    }, 2800);
  };

  const startLevel3Practice = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('PRACTICE_LEVEL3');
    setCurrentRule(RULE_MAPPINGS.LEVEL3);
    setIsBroken(true);
    setShowYellowLight(true);
    setCurrentPhaseTrials([]);
    setSeriesTrials([]);
    setIsRecoveryMode(false);
    setRecoveryTrials([]);
    setConsecutiveErrors(0);
    setHintActive(false);
    setHasSoftHintBeenShown(false);
    setShowContextualAnchors(false);
    setIsSimplifiedMode(false);
    setLevel3Completed(false);
    level3QueueRef.current = [];
    prepareNextTrial('PRACTICE_LEVEL3');
  };

  const startRepairAnnouncement = (bypassGuard = false) => {
    if (!level3Completed && !bypassGuard) {
      console.warn('Blocked attempt to start repair announcement: level3Completed is false!');
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('REPAIR_ANNOUNCEMENT');
    playSound('cheer', settings.soundEnabled);
    speakLumi('Ура! Мы починили светофор! Давай проверим, работает ли он теперь правильно!', { soundEnabled: settings.soundEnabled, force: true });
  };

  const startRepairTest = () => {
    if (!level3Completed) {
      console.warn('Blocked attempt to start repair test: level3Completed is false!');
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('REPAIR_TEST');
    setCurrentRule(RULE_MAPPINGS.REPAIR); // Standard repaired rules: Green=GO, Red=STOP, Yellow=CLAP
    setIsBroken(false); // Traffic light is repaired!
    setShowYellowLight(true);
    setRepairCompletedColors([]);
    setLastRepairEffect(null);
    setRepairStepCount(0);
    setRepairCycle(1);
    // 3 full cycles of 🟢 -> 🔴 -> 🟡 (9 stimuli total)
    repairQueueRef.current = [
      'green', 'red', 'yellow',
      'green', 'red', 'yellow',
      'green', 'red', 'yellow',
    ];
    prepareNextTrial('REPAIR_TEST');
  };

  // Trigger Mini-Series Success Signal
  const triggerSeriesSuccess = (targetPhase: GamePhase | null) => {
    playSound('cheer', settings.soundEnabled);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (targetPhase === null) {
      if (level3Completed) {
        startRepairAnnouncement(true);
      }
    } else {
      setNextTargetPhase(targetPhase);
      setPhase('SERIES_SUCCESS');
      timerRef.current = setTimeout(() => {
        if (targetPhase === 'SWITCH_ANNOUNCEMENT') startInvertedPhase();
        else if (targetPhase === 'LEVEL_3_ANNOUNCEMENT') startLevel3Phase();
      }, 3500);
    }
  };

  const triggerHintStage1 = () => {
    setHintActive(true); // Stage 1: Soft Lumi RuleCard ONLY
    setHasSoftHintBeenShown(true);
    setShowContextualAnchors(false);
    setIsRecoveryMode(true);
    setRecoveryTrials([]);
    setConsecutiveErrors(0);
    playSound('hint', settings.soundEnabled);
    prepareNextTrial(phase);
  };

  // Evaluate progression logic after each trial
  const evaluateSeriesProgress = (newTrial: TrialData) => {
    const updatedSeries = [...seriesTrials, newTrial];
    setSeriesTrials(updatedSeries);

    const updatedPhase = [...currentPhaseTrials, newTrial];
    setCurrentPhaseTrials(updatedPhase);

    // RECOVERY MODE LOGIC (After hint support is triggered)
    if (isRecoveryMode) {
      const updatedRecovery = [...recoveryTrials, newTrial];
      setRecoveryTrials(updatedRecovery);

      const recoveryCorrect = updatedRecovery.filter((t) => t.correct).length;
      const requiredCorrect = phase === 'PRACTICE_LEVEL3' ? 4 : 3;
      const maxRecoveryAttempts = 5;

      // 1. Skill Restored
      if (recoveryCorrect >= requiredCorrect) {
        setIsRecoveryMode(false);
        setRecoveryTrials([]);
        setHintActive(false);
        setHasSoftHintBeenShown(false);
        setShowContextualAnchors(false);
        setIsSimplifiedMode(false);

        if (phase === 'PRACTICE_NORMAL') {
          triggerSeriesSuccess('SWITCH_ANNOUNCEMENT');
        } else if (phase === 'PRACTICE_INVERTED') {
          triggerSeriesSuccess('LEVEL_3_ANNOUNCEMENT');
        } else if (phase === 'PRACTICE_LEVEL3') {
          setLevel3Completed(true);
          startRepairAnnouncement(true);
        }
        return;
      }

      // 2. Recovery Failed (5 attempts with < requiredCorrect) -> Downgrade 1 level
      if (updatedRecovery.length >= maxRecoveryAttempts && recoveryCorrect < requiredCorrect) {
        setIsRecoveryMode(false);
        setRecoveryTrials([]);
        setHintActive(false);
        setHasSoftHintBeenShown(false);
        setShowContextualAnchors(false);
        setIsSimplifiedMode(false);

        if (phase === 'PRACTICE_LEVEL3') {
          setLevel3Completed(false);
          startInvertedPractice(); // Downgrade Level 3 -> Level 2
        } else if (phase === 'PRACTICE_INVERTED') {
          startNormalPractice(); // Downgrade Level 2 -> Level 1
        } else {
          setPhase('DEMO_NORMAL');
          setCurrentRule(RULE_MAPPINGS.NORMAL);
          setIsBroken(false);
          setShowYellowLight(false);
        }
        return;
      }

      // 3. Child failed attempt during recovery:
      if (!newTrial.correct && hasSoftHintBeenShown && !showContextualAnchors) {
        setShowContextualAnchors(true); // Stage 2: Contextual light anchors
        setIsSimplifiedMode(true);
        setHintActive(false);
        setConsecutiveErrors(0);
        playSound('hint', settings.soundEnabled);
      }

      prepareNextTrial(phase);
      return;
    }

    // MAIN PRACTICE SERIES LOGIC
    const correctCount = updatedSeries.filter((t) => t.correct).length;

    if (phase === 'PRACTICE_NORMAL') {
      // Level 1: 4 trials, >= 3 correct
      if (correctCount >= 3) {
        triggerSeriesSuccess('SWITCH_ANNOUNCEMENT');
        return;
      }
      if (consecutiveErrors >= 2 || updatedSeries.length >= 4) {
        triggerHintStage1();
        return;
      }
    } else if (phase === 'PRACTICE_INVERTED') {
      // Level 2: minimum 6 stimulus trials, >= 4 correct
      if (updatedSeries.length >= 6) {
        if (correctCount >= 4) {
          triggerSeriesSuccess('LEVEL_3_ANNOUNCEMENT');
          return;
        } else {
          triggerHintStage1();
          return;
        }
      } else if (consecutiveErrors >= 2) {
        triggerHintStage1();
        return;
      }
    } else if (phase === 'PRACTICE_LEVEL3') {
      // Level 3: 6 stimulus trials, >= 4 correct
      const level3Correct = updatedSeries.filter((t) => t.correct).length;

      if (updatedSeries.length >= 6) {
        if (level3Correct >= 4) {
          setLevel3Completed(true);
          startRepairAnnouncement(true);
          return;
        } else {
          // 6 trials finished but level3Correct < 4 -> Trigger hint & recovery mode
          triggerHintStage1();
          return;
        }
      } else if (consecutiveErrors >= 2) {
        triggerHintStage1();
        return;
      }
    }

    prepareNextTrial(phase);
  };

  // Primary Child Action Handler
  const handleAction = (selectedAction: ActionType) => {
    if (isProcessing || !stimulusColor) return;

    playSound('click', settings.soundEnabled);
    const responseTime = Date.now() - trialStartTime;
    const expected = currentRule[stimulusColor];
    const wasHintUsed = hintActive || hasSoftHintBeenShown || showContextualAnchors || isSimplifiedMode;

    // INTERACTIVE REPAIR FINALE TEST HANDLER
    if (phase === 'REPAIR_TEST') {
      if (selectedAction === expected) {
        setIsProcessing(true);
        playSound('correct', settings.soundEnabled);
        setHighlightedAction(selectedAction);

        const color = stimulusColor;
        setRepairCompletedColors((prev) => [...prev, color]);

        const newStepCount = repairStepCount + 1;
        setRepairStepCount(newStepCount);

        const currentCycleNum = Math.min(3, Math.floor((newStepCount - 1) / 3) + 1);
        setRepairCycle(currentCycleNum);

        let message = '';
        if (selectedAction === 'GO') {
          message = `🟢 [Цикл ${currentCycleNum}/3] Машинка поехала! 🚗💨`;
        } else if (selectedAction === 'STOP') {
          message = `🔴 [Цикл ${currentCycleNum}/3] Машинка остановилась! 🛑`;
        } else {
          message = `🟡 [Цикл ${currentCycleNum}/3] Луми хлопает в ладоши! 👏✨`;
        }

        setLastRepairEffect({ color, action: selectedAction, message });

        const newTrial: TrialData = {
          id: 'repair_' + Date.now(),
          trialNumber: trials.length + 1,
          stimulusColor: color,
          expectedAction: expected,
          childAction: selectedAction,
          correct: true,
          responseTimeMs: responseTime,
          hintUsed: false,
          selfCorrection: false,
          ruleSwitchError: false,
          difficultyLevel: 3,
          phase: 'REPAIR_TEST',
          timestamp: Date.now(),
          distractorsCount: 0,
          ageGroup: settings.ageGroup,
        };

        setTrials((prev) => [...prev, newTrial]);
        setLastTrialResult({ correct: true });

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setHighlightedAction(null);
          setIsProcessing(false);
          if (repairQueueRef.current.length > 0) {
            prepareNextTrial('REPAIR_TEST');
          } else {
            // All 9 steps (3 full cycles) completed in repair test!
            playSound('cheer', settings.soundEnabled);
            setPhase('GAME_COMPLETE');
            speakLumi('Ура! Ты починил светофор!', { soundEnabled: settings.soundEnabled, force: true });
          }
        }, 1800);
        return;
      } else {
        // Incorrect attempt during repair test -> show gentle retry feedback, allow retry on same stimulus
        setIsProcessing(true);
        playSound('wrong', settings.soundEnabled);
        setWrongSelection(selectedAction);

        let hintMsg = 'Давай посмотрим ещё раз! ';
        if (stimulusColor === 'green') hintMsg += 'Зелёный цвет значит «ИДИ» 🟢';
        else if (stimulusColor === 'red') hintMsg += 'Красный цвет значит «СТОП» 🔴';
        else if (stimulusColor === 'yellow') hintMsg += 'Жёлтый цвет значит «ХЛОПНИ» 🟡';

        setLastRepairEffect({
          color: stimulusColor,
          action: selectedAction,
          message: hintMsg,
        });

        const failedTrial: TrialData = {
          id: 'repair_' + Date.now(),
          trialNumber: trials.length + 1,
          stimulusColor: stimulusColor,
          expectedAction: expected,
          childAction: selectedAction,
          correct: false,
          responseTimeMs: responseTime,
          hintUsed: false,
          selfCorrection: false,
          ruleSwitchError: false,
          difficultyLevel: 3,
          phase: 'REPAIR_TEST',
          timestamp: Date.now(),
          distractorsCount: 0,
          ageGroup: settings.ageGroup,
        };

        setTrials((prev) => [...prev, failedTrial]);
        setLastTrialResult({ correct: false });

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setWrongSelection(null);
          setIsProcessing(false);
        }, 1500);
        return;
      }
    }

    // Scenario 1: Correct answer on first try
    if (selectedAction === expected && !selfCorrectionActive) {
      setIsProcessing(true);
      playSound('correct', settings.soundEnabled);
      speakLumi('Да! Получилось!', { soundEnabled: settings.soundEnabled });
      setHighlightedAction(selectedAction);

      const newTrial: TrialData = {
        id: 'trial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        trialNumber: trials.length + 1,
        stimulusColor,
        expectedAction: expected,
        childAction: selectedAction,
        correct: true,
        responseTimeMs: responseTime,
        hintUsed: wasHintUsed,
        selfCorrection: false,
        ruleSwitchError: false,
        difficultyLevel: showYellowLight ? 3 : isBroken ? 2 : 1,
        phase,
        timestamp: Date.now(),
        distractorsCount: isSimplifiedMode ? 0 : 3,
        ageGroup: settings.ageGroup,
      };

      setTrials((prev) => [...prev, newTrial]);
      setConsecutiveErrors(0);
      setLastTrialResult({ correct: true });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        evaluateSeriesProgress(newTrial);
      }, 1000);

      return;
    }

    // Scenario 2: Correct answer AFTER an initial mistake (SELF-CORRECTION)
    if (selectedAction === expected && selfCorrectionActive) {
      setIsProcessing(true);
      playSound('self_correction', settings.soundEnabled);
      speakLumi('Молодец! Ты исправился!', { soundEnabled: settings.soundEnabled });
      setHighlightedAction(selectedAction);
      setWrongSelection(null);

      const newTrial: TrialData = {
        id: 'trial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        trialNumber: trials.length + 1,
        stimulusColor,
        expectedAction: expected,
        childAction: selectedAction,
        correct: true,
        responseTimeMs: responseTime,
        hintUsed: wasHintUsed,
        selfCorrection: true,
        ruleSwitchError: false,
        difficultyLevel: showYellowLight ? 3 : isBroken ? 2 : 1,
        phase,
        timestamp: Date.now(),
        distractorsCount: isSimplifiedMode ? 0 : 3,
        ageGroup: settings.ageGroup,
      };

      setTrials((prev) => [...prev, newTrial]);
      setConsecutiveErrors(0);
      setLastTrialResult({ correct: true, selfCorrection: true });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        evaluateSeriesProgress(newTrial);
      }, 1200);

      return;
    }

    // Scenario 3: Incorrect answer (first attempt)
    setIsProcessing(true); // Lock buttons during error feedback timeout to prevent double-submits
    playSound('wrong', settings.soundEnabled);
    speakLumi('Попробуй ещё раз.', { soundEnabled: settings.soundEnabled, force: true });
    setWrongSelection(selectedAction);
    setSelfCorrectionActive(true);

    const ruleSwError = isRuleSwitchError(phase, stimulusColor, selectedAction);
    const newConsecutive = consecutiveErrors + 1;
    setConsecutiveErrors(newConsecutive);

    // Set lastTrialResult immediately so Lumi state updates to 'support' right when the error occurs
    setLastTrialResult({
      correct: false,
      ruleSwitchError: ruleSwError,
      hintUsed: wasHintUsed,
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const failedTrial: TrialData = {
        id: 'trial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        trialNumber: trials.length + 1,
        stimulusColor,
        expectedAction: expected,
        childAction: selectedAction,
        correct: false,
        responseTimeMs: responseTime,
        hintUsed: wasHintUsed,
        selfCorrection: false,
        ruleSwitchError: ruleSwError,
        difficultyLevel: showYellowLight ? 3 : isBroken ? 2 : 1,
        phase,
        timestamp: Date.now(),
        distractorsCount: isSimplifiedMode ? 0 : 3,
        ageGroup: settings.ageGroup,
      };

      setTrials((prev) => [...prev, failedTrial]);

      evaluateSeriesProgress(failedTrial);
    }, 2200);
  };

  // Reset complete session
  const resetSession = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTrials([]);
    setCurrentPhaseTrials([]);
    setSeriesTrials([]);
    setIsRecoveryMode(false);
    setRecoveryTrials([]);
    setNextTargetPhase(null);
    setConsecutiveErrors(0);
    setHintActive(false);
    setHasSoftHintBeenShown(false);
    setShowContextualAnchors(false);
    setIsSimplifiedMode(false);
    setLevel3Completed(false);
    setIsBroken(false);
    setShowYellowLight(false);
    setPhase('DEMO_NORMAL');
    setCurrentRule(RULE_MAPPINGS.NORMAL);
    setStimulusColor('green');
    setLastTrialResult(undefined);
    setRepairCompletedColors([]);
    setLastRepairEffect(null);
  };

  // Explicit return handler to LumiWorldScreen (resets session and navigates strictly to Lumi World Hub)
  const handleReturnToLumiWorld = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    resetSession();
    setActiveView('LUMI_WORLD');
  };

  // Developer Simulation Helpers
  const handleSimulateResponse = (
    correct: boolean,
    isRuleSwitchErr = false,
    isSelfCorrect = false
  ) => {
    if (!stimulusColor) return;
    const expected = currentRule[stimulusColor];
    let childAction: ActionType = expected;

    if (!correct) {
      if (expected === 'GO') childAction = 'STOP';
      else if (expected === 'STOP') childAction = 'GO';
      else childAction = 'GO';
    }

    const simTrial: TrialData = {
      id: 'sim_' + Date.now(),
      trialNumber: trials.length + 1,
      stimulusColor,
      expectedAction: expected,
      childAction,
      correct,
      responseTimeMs: Math.floor(Math.random() * 2000) + 800,
      hintUsed: hintActive,
      selfCorrection: isSelfCorrect,
      ruleSwitchError: isRuleSwitchErr,
      difficultyLevel: showYellowLight ? 3 : isBroken ? 2 : 1,
      phase,
      timestamp: Date.now(),
      distractorsCount: isSimplifiedMode ? 0 : 3,
      ageGroup: settings.ageGroup,
    };

    setTrials((prev) => [...prev, simTrial]);
    evaluateSeriesProgress(simTrial);
  };

  const handleForceLevel = (level: number) => {
    if (level === 1) {
      setLevel3Completed(false);
      setPhase('PRACTICE_NORMAL');
      setCurrentRule(RULE_MAPPINGS.NORMAL);
      setIsBroken(false);
      setShowYellowLight(false);
    } else if (level === 2) {
      setLevel3Completed(false);
      setPhase('PRACTICE_INVERTED');
      setCurrentRule(RULE_MAPPINGS.INVERTED);
      setIsBroken(true);
      setShowYellowLight(false);
    } else if (level === 3) {
      setLevel3Completed(false);
      setPhase('PRACTICE_LEVEL3');
      setCurrentRule(RULE_MAPPINGS.LEVEL3);
      setIsBroken(true);
      setShowYellowLight(true);
    } else if (level === 4) {
      setLevel3Completed(true);
      startRepairAnnouncement(true);
      return;
    }
    prepareNextTrial(
      level === 1 ? 'PRACTICE_NORMAL' : level === 2 ? 'PRACTICE_INVERTED' : 'PRACTICE_LEVEL3'
    );
  };

  // Determine Lumi emotion based on game state
  let lumiEmotion: LumiState = 'happy';
  if (phase === 'SWITCH_ANNOUNCEMENT' || phase === 'LEVEL_3_ANNOUNCEMENT') {
    lumiEmotion = 'surprised';
  } else if (
    phase === 'SERIES_SUCCESS' ||
    phase === 'REPAIR_ANNOUNCEMENT' ||
    phase === 'GAME_COMPLETE' ||
    lastTrialResult?.selfCorrection
  ) {
    lumiEmotion = 'clap';
  } else if (lastTrialResult?.correct === false || hintActive) {
    lumiEmotion = 'support';
  } else if (lastTrialResult?.correct === true) {
    lumiEmotion = 'happy';
  }

  const lumiMessage = getLumiMessageForPhase(phase, lastTrialResult);

  return (
    <div className="min-h-screen w-full max-w-full box-border bg-linear-to-b from-amber-50 via-sky-50 to-emerald-50 text-slate-800 flex flex-col font-sans relative overflow-x-hidden select-none">
      {/* Background Distractors (Soft clouds/butterfly - hidden when simplified) */}
      <Distractors enabled={settings.distractorsEnabled && !isSimplifiedMode} />

      {/* Top Navigation Header Bar */}
      <HeaderBar
        settings={settings}
        activeView={activeView}
        onUpdateSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
        onResetSession={resetSession}
        onReturnToLumiWorld={handleReturnToLumiWorld}
        onOpenGallery={() => setActiveView('ASSET_GALLERY')}
        currentPhaseText={
          phase === 'GAME_COMPLETE'
            ? 'Светофор починен! 🎉'
            : phase === 'REPAIR_ANNOUNCEMENT' || phase === 'REPAIR_TEST'
            ? 'Финал: Ремонт светофора 🛠️'
            : phase === 'SERIES_SUCCESS'
            ? 'Мини-серия пройдена! 🌟'
            : phase.includes('NORMAL')
            ? 'Уровень 1: Прямое правило'
            : phase.includes('INVERTED') || phase === 'SWITCH_ANNOUNCEMENT'
            ? 'Уровень 2: Переключение (Инверсия)'
            : 'Уровень 3: Дополнительный цвет'
        }
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-2.5 sm:px-6 py-2 flex flex-col items-center justify-start gap-3 sm:gap-4 z-10">
        {/* VIEW 1: LUMI'S WORLD HUB */}
        {activeView === 'LUMI_WORLD' && (
          <LumiWorldScreen
            onSelectGame={(game) => {
              if (game === 'TRAFFIC_LIGHT') {
                resetSession();
              }
              setActiveView(game);
            }}
          />
        )}

        {/* VIEW 2: GAME #2 - LUMI LOST COLORS */}
        {activeView === 'COLOR_SEQUENCE' && (
          <ColorSequenceGame
            soundEnabled={settings.soundEnabled}
            onSelectGame={(game) => {
              if (game === 'TRAFFIC_LIGHT') {
                resetSession();
                setActiveView('TRAFFIC_LIGHT');
              } else if (game === 'COLOR_SEQUENCE') {
                setActiveView('COLOR_SEQUENCE');
              } else {
                setActiveView('COLOR_WORLD');
              }
            }}
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
            onTrialsUpdate={setSequenceTrials}
          />
        )}

        {/* VIEW 4: GAME #3 - COLOR WORLD */}
        {activeView === 'COLOR_WORLD' && (
          <ColorWorldGame
            soundEnabled={settings.soundEnabled}
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
            onDebugDataUpdate={setGame3Debug}
          />
        )}

        {/* VIEW 5: GAME #4 - COLOR HIDDEN */}
        {activeView === 'COLOR_HIDDEN' && (
          <ColorHiddenGame
            soundEnabled={settings.soundEnabled}
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 6: GAME #5 - SPOT DIFF ("Что изменилось?") */}
        {activeView === 'SPOT_DIFF' && (
          <SpotDiffGame
            soundEnabled={settings.soundEnabled}
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 7: GAME #6 - COLOR TRAIL ("Цветной след") */}
        {activeView === 'COLOR_TRAIL' && (
          <ColorTrailGame
            soundEnabled={settings.soundEnabled}
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 8: GAME #7 - ROBOT MISTAKE ("Робот ошибается") */}
        {activeView === 'ROBOT_MISTAKE' && (
          <RobotMistakeGame
            soundEnabled={settings.soundEnabled}
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 9: GAME #8 - COLOR OR SHAPE ("Цвет или форма?") */}
        {activeView === 'COLOR_OR_SHAPE' && (
          <ColorOrShapeGame
            soundEnabled={settings.soundEnabled}
            onBackToWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 10: GAME #9 - COLOR DANCE ("Цветной танец") */}
        {activeView === 'COLOR_DANCE' && (
          <ColorDanceGame
            onBackToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 11: GAME #10 - ASSOCIATION -> WORD ("Ассоциация → слово") */}
        {activeView === 'ASSOCIATION_WORD' && (
          <AssociationWordGame
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 12: GAME #11 - COLOR CODE ("Цветной код") */}
        {activeView === 'COLOR_CODE' && (
          <ColorCodeGame
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 13: GAME #12 - ODD ONE OUT ("Что лишнее?") */}
        {activeView === 'ODD_ONE_OUT' && (
          <OddOneOutGame
            onReturnToLumiWorld={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 14: DEV ASSET GALLERY ("Библиотека Мира Луми") */}
        {activeView === 'ASSET_GALLERY' && (
          <LumiGalleryScreen
            onBack={() => setActiveView('LUMI_WORLD')}
          />
        )}

        {/* VIEW 3: GAME #1 - BROKEN TRAFFIC LIGHT */}
        {activeView === 'TRAFFIC_LIGHT' && (
          <>
            {/* Lumi Assistant Speech Component */}
            <LumiCharacter
              state={lumiEmotion}
              message={lumiMessage}
              autoSpeak={false}
              subText={
                hintActive
                  ? '💡 Правило на карточке поможет вспомнить ответ!'
                  : isSimplifiedMode
                  ? '✨ Режим с меньшим количеством отвлекающих элементов'
                  : undefined
              }
            />

            {/* MINI-SERIES SUCCESS SIGNAL BANNER */}
            <AnimatePresence>
              {phase === 'SERIES_SUCCESS' && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  className="bg-emerald-100 border-4 border-emerald-500 rounded-3xl p-6 shadow-2xl text-center max-w-md mx-auto my-6 z-20"
                >
                  <div className="text-5xl mb-3">🌟 👏 🌟</div>
                  <h2 className="text-emerald-950 font-black text-2xl sm:text-3xl mb-2">
                    Получилось! Луми рад!
                  </h2>
                  <p className="text-emerald-900 font-bold text-base mb-5">
                    Отличная работа! Ты успешно выполнил эту мини-серию!
                  </p>
                  <button
                    onClick={() => {
                      if (timerRef.current) clearTimeout(timerRef.current);
                      if (nextTargetPhase === 'SWITCH_ANNOUNCEMENT') startInvertedPhase();
                      else if (nextTargetPhase === 'LEVEL_3_ANNOUNCEMENT') startLevel3Phase();
                      else startNormalPractice();
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xl px-8 py-4 rounded-2xl shadow-lg border-2 border-emerald-600 cursor-pointer transition-all"
                  >
                    Продолжить ➔
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ANNOUNCEMENT BANNER FOR REPAIR FINALE */}
            <AnimatePresence>
              {phase === 'REPAIR_ANNOUNCEMENT' && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  className="bg-emerald-100 border-4 border-emerald-500 rounded-3xl p-6 shadow-2xl text-center max-w-lg mx-auto my-6 z-20"
                >
                  <div className="text-5xl mb-3">🛠️ 🚦 🚗</div>
                  <h2 className="text-emerald-950 font-black text-2xl sm:text-3xl mb-2">
                    Мы починили светофор!
                  </h2>
                  <p className="text-emerald-900 font-bold text-base sm:text-lg mb-6">
                    Давай проверим, работает ли он теперь правильно!
                  </p>
                  <button
                    onClick={startRepairTest}
                    className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xl px-8 py-4 rounded-2xl shadow-lg border-2 border-emerald-600 cursor-pointer transition-all"
                  >
                    Проверить светофор ➔
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ENTIRE GAME COMPLETE FINALE CARD */}
            <AnimatePresence>
              {phase === 'GAME_COMPLETE' && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-6 shadow-2xl text-center max-w-lg mx-auto my-6 z-20"
                >
                  <div className="text-5xl mb-3">🏆 🚦 🎉</div>
                  <h2 className="text-amber-950 font-black text-2xl sm:text-3xl mb-2">
                    Ты починил светофор!
                  </h2>
                  <p className="text-amber-900 font-bold text-base mb-2">
                    Ура! Светофор снова работает правильно!
                  </p>

                  {/* Working Traffic Light Mini Animation */}
                  <div className="flex justify-center items-center gap-3 bg-slate-800 rounded-2xl p-3 my-3 border-2 border-slate-700 w-48 mx-auto shadow-inner">
                    <span className="w-6 h-6 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <span className="w-6 h-6 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    <span className="w-6 h-6 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>

                  {/* Metrics summary */}
                  <div className="bg-white/90 rounded-2xl p-4 border-2 border-amber-300 my-4 text-sm font-semibold text-amber-950 flex flex-wrap justify-around gap-3 shadow-inner">
                    <div>
                      <span className="text-amber-800 text-xs block">Всего попыток</span>
                      <span className="text-xl font-extrabold">{trials.length}</span>
                    </div>
                    <div>
                      <span className="text-emerald-800 text-xs block">Правильных</span>
                      <span className="text-xl font-extrabold text-emerald-600">
                        {trials.filter((t) => t.correct).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-800 text-xs block">Исправлений</span>
                      <span className="text-xl font-extrabold text-blue-600">
                        {trials.filter((t) => t.selfCorrection).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-800 text-xs block">Подсказок</span>
                      <span className="text-xl font-extrabold text-purple-600">
                        {trials.filter((t) => t.hintUsed).length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                      onClick={resetSession}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-lg py-3.5 px-4 rounded-2xl shadow-lg border-2 border-amber-600 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <span>ИГРАТЬ ЕЩЁ</span>
                      <span>🔄</span>
                    </button>

                    <button
                      onClick={handleReturnToLumiWorld}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-lg py-3.5 px-4 rounded-2xl shadow-lg border-2 border-emerald-700 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <span>ВЫБРАТЬ ИГРУ</span>
                      <span>🌍</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ANNOUNCEMENT BANNER FOR RULE SWITCH */}
            <AnimatePresence>
              {(phase === 'SWITCH_ANNOUNCEMENT' || phase === 'LEVEL_3_ANNOUNCEMENT') && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-amber-400 border-4 border-amber-600 text-amber-950 font-extrabold text-xl sm:text-2xl p-4 sm:p-6 rounded-3xl shadow-2xl my-4 text-center max-w-lg mx-auto"
                >
                  {phase === 'SWITCH_ANNOUNCEMENT' ? (
                    <>
                      <div className="text-4xl mb-2">⚡ 🛠️ ⚡</div>
                      <p>Ой! Светофор сломался!</p>
                      <p className="text-base sm:text-lg font-bold text-amber-900 mt-1">
                        Теперь правила изменились! Посмотри внимательно!
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">✨ 🟡 ✨</div>
                      <p>Ух ты! Светофор мигает жёлтым!</p>
                      <p className="text-base sm:text-lg font-bold text-amber-900 mt-1">
                        Появился новый жёлтый цвет и новое действие!
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* DEMONSTRATION CARDS (Before practice series) */}
            <AnimatePresence>
              {(phase === 'DEMO_NORMAL' || phase === 'DEMO_INVERTED' || phase === 'DEMO_LEVEL3') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full my-2"
                >
                  <RuleCard
                    rule={currentRule}
                    title={
                      phase === 'DEMO_NORMAL'
                        ? 'Первоначальное правило'
                        : phase === 'DEMO_INVERTED'
                        ? 'Новое правило (Светофор сломался!)'
                        : 'Правило с тремя цветами'
                    }
                    showClapRule={phase === 'DEMO_LEVEL3'}
                    onClose={() => {
                      if (phase === 'DEMO_NORMAL') startNormalPractice();
                      else if (phase === 'DEMO_INVERTED') startInvertedPractice();
                      else if (phase === 'DEMO_LEVEL3') startLevel3Practice();
                    }}
                  />
                  <div className="text-center mt-3">
                    <button
                      onClick={() => {
                        if (phase === 'DEMO_NORMAL') startNormalPractice();
                        else if (phase === 'DEMO_INVERTED') startInvertedPractice();
                        else if (phase === 'DEMO_LEVEL3') startLevel3Practice();
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-lg sm:text-xl px-8 py-4 rounded-2xl shadow-lg border-2 border-emerald-600 transition-all cursor-pointer"
                    >
                      Понятно! Начать ➔
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTIVE PRACTICE STAGE: TRAFFIC LIGHT & ACTION BUTTONS */}
            {phase.startsWith('PRACTICE') && (
              <div className="w-full flex flex-col items-center">
                {/* Visual Rule Hint Card if triggered (Stage 1) */}
                {hintActive && (
                  <RuleCard
                    rule={currentRule}
                    isHint={true}
                    showClapRule={phase === 'PRACTICE_LEVEL3'}
                    onClose={() => {
                      setHintActive(false);
                      setConsecutiveErrors(0);
                    }}
                  />
                )}

                {/* Traffic Light Illustration (Stage 2 contextual anchors strictly active when hintActive is false) */}
                <TrafficLight
                  currentColor={stimulusColor}
                  isBroken={isBroken}
                  showYellowLight={showYellowLight}
                  activeRule={currentRule}
                  showRuleAnchors={!hintActive && (showContextualAnchors || settings.showVisualAnchors)}
                />

                {/* Action Buttons (ИДИ, СТОП, ХЛОПНИ) */}
                <ActionButtons
                  onAction={handleAction}
                  showClapButton={showYellowLight || phase === 'PRACTICE_LEVEL3'}
                  disabled={isProcessing}
                  highlightedAction={highlightedAction}
                  wrongActionSelected={wrongSelection}
                />
              </div>
            )}

            {/* INTERACTIVE REPAIR FINALE TEST STAGE */}
            {phase === 'REPAIR_TEST' && (
              <div className="w-full flex flex-col items-center">
                {/* Traffic light working cleanly */}
                <TrafficLight
                  currentColor={stimulusColor}
                  isBroken={false}
                  showYellowLight={true}
                  activeRule={currentRule}
                  showRuleAnchors={false}
                />

                {/* Interactive Car Traffic Cause-and-Effect Scene */}
                <CarTrafficScene
                  currentColor={stimulusColor}
                  lastActionEffect={lastRepairEffect}
                  completedColors={repairCompletedColors}
                  repairStepCount={repairStepCount}
                  repairCycle={repairCycle}
                />

                {/* Action Buttons */}
                <ActionButtons
                  onAction={handleAction}
                  showClapButton={true}
                  disabled={isProcessing}
                  highlightedAction={highlightedAction}
                  wrongActionSelected={wrongSelection}
                />
              </div>
            )}
          </>
        )}

        {/* Developer / Debug Panel (When enabled via header or dev button) */}
        {settings.developerMode && (
          <DevPanel
            activeView={activeView}
            sequenceTrials={sequenceTrials}
            game3Debug={game3Debug}
            trials={trials}
            currentPhase={phase}
            currentRule={currentRule}
            level3Attempts={seriesTrials.length}
            level3Correct={seriesTrials.filter((t) => t.correct).length}
            level3Completed={level3Completed}
            recoveryMode={isRecoveryMode}
            recoveryAttempts={recoveryTrials.length}
            recoveryCorrect={recoveryTrials.filter((t) => t.correct).length}
            hintUsed={hintActive || hasSoftHintBeenShown || showContextualAnchors || isSimplifiedMode}
            onForceRuleSwitch={startInvertedPhase}
            onForceLevel={handleForceLevel}
            onSimulateResponse={handleSimulateResponse}
            onClearLogs={() => {
              setTrials([]);
              setCurrentPhaseTrials([]);
              setSeriesTrials([]);
              setRecoveryTrials([]);
              setSequenceTrials([]);
            }}
            onOpenGallery={() => setActiveView('ASSET_GALLERY')}
            onClose={() => setSettings((prev) => ({ ...prev, developerMode: false }))}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="text-center py-2 text-xs text-amber-900/60 font-medium">
        Нейропсихологический игровой прототип «Сломанный светофор» • Тренировка торможения и переключения
      </footer>
    </div>
  );
}
