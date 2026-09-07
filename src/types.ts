export type ActiveView =
  | 'LUMI_WORLD'
  | 'TRAFFIC_LIGHT'
  | 'COLOR_SEQUENCE'
  | 'COLOR_WORLD'
  | 'COLOR_HIDDEN'
  | 'SPOT_DIFF'
  | 'COLOR_TRAIL'
  | 'ROBOT_MISTAKE'
  | 'COLOR_OR_SHAPE'
  | 'COLOR_DANCE'
  | 'ASSOCIATION_WORD'
  | 'COLOR_CODE'
  | 'ODD_ONE_OUT'
  | 'ASSET_GALLERY';

export type SequenceColor = 'green' | 'red' | 'yellow';

export interface SequenceTrialData {
  id: string;
  trialNumber: number;
  stimulusSequence: SequenceColor[];
  childSequence: SequenceColor[];
  sequenceLength: number;
  correct: boolean;
  matchedPositions: number;
  firstErrorPosition: number | null;
  orderError: boolean;
  omissionError: boolean;
  intrusionError: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
  difficultyLevel: number;
  timestamp: number;
  phase: string;
}

export type StimulusColor = 'green' | 'red' | 'yellow';
export type ActionType = 'GO' | 'STOP' | 'CLAP';
export type AgeGroup = '2.5-3' | '3-4' | '4-5';

export interface RuleMapping {
  green: ActionType;
  red: ActionType;
  yellow?: ActionType;
}

export type GamePhase =
  | 'DEMO_NORMAL'          // Initial demonstration: Green=GO, Red=STOP
  | 'PRACTICE_NORMAL'      // Practice standard rule
  | 'SWITCH_ANNOUNCEMENT'  // "Traffic light broke!" announcement
  | 'DEMO_INVERTED'        // Demo new rule: Green=STOP, Red=GO
  | 'PRACTICE_INVERTED'    // Practice inverted rule
  | 'LEVEL_3_ANNOUNCEMENT'  // "3rd color added!"
  | 'DEMO_LEVEL3'          // Demo 3 colors: Green=STOP, Red=GO, Yellow=CLAP
  | 'PRACTICE_LEVEL3'      // Practice 3 colors
  | 'REPAIR_ANNOUNCEMENT'  // "We fixed the traffic light!" announcement
  | 'REPAIR_TEST'          // Interactive 3-color repair verification check
  | 'SERIES_SUCCESS'       // Mini-series completion signal
  | 'GAME_COMPLETE'        // Entire game session finished
  | 'SIMPLIFY_MODE';       // Adaptive simplified mode

export interface TrialData {
  id: string;
  trialNumber: number;
  stimulusColor: StimulusColor;
  expectedAction: ActionType;
  childAction: ActionType | null;
  correct: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
  selfCorrection: boolean;
  ruleSwitchError: boolean;
  difficultyLevel: number;
  phase: GamePhase;
  timestamp: number;
  distractorsCount: number;
  ageGroup: AgeGroup;
}

export interface SessionStats {
  totalTrials: number;
  correctAnswers: number;
  colorErrors: number;
  ruleSwitchErrors: number;
  hintsUsed: number;
  selfCorrections: number;
  currentLevel: number;
  maxLevelAchieved: number;
  recentHistory: boolean[];
}

export interface AgeGroupConfig {
  label: string;
  maxColors: number;
  distractorsEnabled: boolean;
  responseTimeLimitMs: number;
  instructionLength: 'short' | 'standard' | 'expanded';
  description: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  distractorsEnabled: boolean;
  showVisualAnchors: boolean;
  developerMode: boolean;
}
