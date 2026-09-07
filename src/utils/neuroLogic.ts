import { RuleMapping, GamePhase, TrialData, SessionStats, AgeGroupConfig, AgeGroup } from '../types';

export const RULE_MAPPINGS: Record<string, RuleMapping> = {
  NORMAL: {
    green: 'GO',
    red: 'STOP',
  },
  INVERTED: {
    green: 'STOP',
    red: 'GO',
  },
  LEVEL3: {
    green: 'STOP',
    red: 'GO',
    yellow: 'CLAP',
  },
  REPAIR: {
    green: 'GO',
    red: 'STOP',
    yellow: 'CLAP',
  },
};

export const AGE_CONFIGS: Record<AgeGroup, AgeGroupConfig> = {
  '2.5-3': {
    label: '2.5 – 3 года',
    maxColors: 2,
    distractorsEnabled: false,
    responseTimeLimitMs: 12000,
    instructionLength: 'short',
    description: 'Минимальные отвлекающие факторы, увеличенное время отклика, крупная наглядность.',
  },
  '3-4': {
    label: '3 – 4 года',
    maxColors: 2,
    distractorsEnabled: true,
    responseTimeLimitMs: 8000,
    instructionLength: 'standard',
    description: 'Базовый уровень ТЗ. Проверка торможения привычного ответа и смены правил.',
  },
  '4-5': {
    label: '4 – 5 лет',
    maxColors: 3,
    distractorsEnabled: true,
    responseTimeLimitMs: 6000,
    instructionLength: 'expanded',
    description: 'Усложнение третьим цветом (ХЛОПНИ), проверка гибкости и переключения.',
  },
};

/**
  * Check if the child demonstrates pre-requisite rule stability:
  * Minimum 3 correct answers in max 4 attempts.
  */
export function checkRuleStability(trialsInCurrentSeries: TrialData[]): boolean {
  if (trialsInCurrentSeries.length === 0) return false;
  const correctCount = trialsInCurrentSeries.filter((t) => t.correct).length;
  return correctCount >= 3;
}

/**
 * Check if the child successfully restored skill after a hint (max 3 attempts, >=2 correct)
 */
export function isRecoverySuccessful(recoveryTrials: TrialData[]): boolean {
  if (recoveryTrials.length === 0) return false;
  const correctCount = recoveryTrials.filter((t) => t.correct).length;
  return correctCount >= 2;
}

/**
 * Determine if an error is specifically a "rule_switch_error".
 * A rule switch error happens when the rule has just switched,
 * and the child responds according to the OLD rule rather than the NEW rule.
 */
export function isRuleSwitchError(
  phase: GamePhase,
  stimulusColor: 'green' | 'red' | 'yellow',
  childAction: 'GO' | 'STOP' | 'CLAP'
): boolean {
  if (phase === 'PRACTICE_INVERTED' || phase === 'PRACTICE_LEVEL3') {
    const oldRule = RULE_MAPPINGS.NORMAL;
    const previousExpected = oldRule[stimulusColor as keyof typeof oldRule];
    if (previousExpected && childAction === previousExpected) {
      return true; // Child executed the old automatic habit!
    }
  }
  return false;
}

/**
 * Compute aggregate session stats from trial array
 */
export function calculateSessionStats(trials: TrialData[]): SessionStats {
  const totalTrials = trials.length;
  const correctAnswers = trials.filter((t) => t.correct).length;
  const colorErrors = trials.filter((t) => !t.correct && !t.ruleSwitchError).length;
  const ruleSwitchErrors = trials.filter((t) => t.ruleSwitchError).length;
  const hintsUsed = trials.filter((t) => t.hintUsed).length;
  const selfCorrections = trials.filter((t) => t.selfCorrection).length;

  let currentLevel = 1;
  let maxLevelAchieved = 1;

  trials.forEach((t) => {
    if (t.difficultyLevel > maxLevelAchieved) {
      maxLevelAchieved = t.difficultyLevel;
    }
    currentLevel = t.difficultyLevel;
  });

  const recentHistory = trials.slice(-10).map((t) => t.correct);

  return {
    totalTrials,
    correctAnswers,
    colorErrors,
    ruleSwitchErrors,
    hintsUsed,
    selfCorrections,
    currentLevel,
    maxLevelAchieved,
    recentHistory,
  };
}

export function getLumiMessageForPhase(phase: GamePhase, lastResult?: { correct: boolean; selfCorrection?: boolean; hintUsed?: boolean; ruleSwitchError?: boolean }): string {
  if (lastResult) {
    if (lastResult.selfCorrection) {
      return 'Ты заметил! Молодец, сам исправил!';
    }
    if (lastResult.ruleSwitchError) {
      return 'Ой, внимание! Правило изменилось, давай проверим!';
    }
    if (!lastResult.correct) {
      if (phase === 'REPAIR_TEST') {
        return 'Ой, почти! Попробуй ещё раз!';
      }
      return 'Давай посмотрим ещё раз вместе!';
    }
    if (lastResult.correct) {
      return 'Отлично! Всё верно!';
    }
  }

  switch (phase) {
    case 'DEMO_NORMAL':
      return 'Привет! Я Луми. Посмотри, как работает светофор: Зелёный = ИДИ, Красный = СТОП!';
    case 'PRACTICE_NORMAL':
      return 'Внимательно смотри на светофор и нажимай правильную кнопку!';
    case 'SWITCH_ANNOUNCEMENT':
      return 'Ой! Светофор сломался! Теперь правила изменились!';
    case 'DEMO_INVERTED':
      return 'Запомни новое правило: Зелёный = СТОП, Красный = ИДИ!';
    case 'PRACTICE_INVERTED':
      return 'Будь внимателен! Светофор работает по-новому!';
    case 'LEVEL_3_ANNOUNCEMENT':
      return 'Ух ты! Светофор стал ещё интереснее! Добавился жёлтый цвет!';
    case 'DEMO_LEVEL3':
      return 'Запомни: Зелёный = СТОП, Красный = ИДИ, а Жёлтый = ХЛОПНИ!';
    case 'PRACTICE_LEVEL3':
      return 'Три цвета! Удерживай все правила в голове!';
    case 'REPAIR_ANNOUNCEMENT':
      return 'Мы починили светофор! Давай проверим, работает ли он теперь правильно!';
    case 'REPAIR_TEST':
      return 'Проверяем починенный светофор: Зелёный = ИДИ, Красный = СТОП, Жёлтый = ХЛОПНИ!';
    case 'SERIES_SUCCESS':
      return 'Получилось! Луми рад! Ты отлично справляешься!';
    case 'GAME_COMPLETE':
      return 'Ура! Ты починил светофор! Луми очень гордится тобой!';
    case 'SIMPLIFY_MODE':
      return 'Давай попробуем спокойнее. Вот тебе подсказка!';
    default:
      return 'Попробуем ещё раз вместе!';
  }
}
