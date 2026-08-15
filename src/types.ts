export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    theme: 'light' | 'dark';
    compactMode: boolean;
  };
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  battingOrder: number;
  isSubstitute: boolean;
  substitutedFor?: string;
  stats: {
    ab: number;
    r: number;
    h: number;
    rbi: number;
    double: number;
    triple: number;
    hr: number;
    bb: number;
    so: number;
    sb: number;
    cs: number;
    ip: number;
    hitsAllowed: number;
    earnedRuns: number;
    pitchCount: number;
    pitchStrikes: number;
  };
}

export interface Team {
  name: string;
  color: string;
  isHome: boolean;
  players: Player[];
}

export type PitchResult = 'ball' | 'strike_swinging' | 'strike_looking' | 'foul';

export type AtBatOutcome = 
  | '1B' | '2B' | '3B' | 'HR' | 'GO' | 'FO' | 'LO' | 'PO' 
  | 'GRD' | 'FC' | 'HBP' | 'SF' | 'SAC' | 'DP' | 'TP' 
  | 'E' | 'INT' | 'IBB' | 'BB' | 'K' | 'SB' | 'CS'
  | 'RUNNER_OUT' | 'RUNNER_ADVANCE' | 'RUNNER_SCORE';

export interface PlayEvent {
  id: string;
  gameId: string;
  inning: number;
  half: 'top' | 'bottom';
  batterId: string;
  batterName?: string;
  pitcherId: string;
  balls: number;
  strikes: number;
  pitches: { type: PitchResult; locationX?: number; locationY?: number }[];
  outcome?: AtBatOutcome;
  hitDirection?: 'Left' | 'Center' | 'Right';
  fieldersInvolved?: string;
  runsScored: number;
  outsRecorded: number;
  runnersAdvanced: { from: number; to: number; runnerId: string }[];
  timestamp: number;
  notes?: string;
  // Runner action fields
  isRunnerAction?: boolean;
  runnerName?: string;
  runnerFromBase?: number;
  runnerToBase?: number | string; // 'out' | 'home' | base number
  // Runner status snapshot after this play
  runnersSnapshot?: {
    first?: string;  // player name on 1B
    second?: string; // player name on 2B
    third?: string;  // player name on 3B
  };
}

export interface Game {
  id: string;
  userId: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  location: string;
  status: 'in_progress' | 'completed';
  inningsCount: number;
  currentInning: number;
  currentHalf: 'top' | 'bottom';
  outs: number;
  balls: number;
  strikes: number;
  homeScore: number;
  awayScore: number;
  runners: {
    1: string | null; // player id
    2: string | null;
    3: string | null;
  };
  plays: PlayEvent[];
  notes: string;
}
