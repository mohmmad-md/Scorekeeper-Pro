import { Player } from '../types';

export const POSITIONS = [
  { code: 'P', name: 'Pitcher (1)' },
  { code: 'C', name: 'Catcher (2)' },
  { code: '1B', name: 'First Base (3)' },
  { code: '2B', name: 'Second Base (4)' },
  { code: '3B', name: 'Third Base (5)' },
  { code: 'SS', name: 'Shortstop (6)' },
  { code: 'LF', name: 'Left Field (7)' },
  { code: 'CF', name: 'Center Field (8)' },
  { code: 'RF', name: 'Right Field (9)' },
  { code: 'DH', name: 'Designated Hitter' }
];

export const getDefaultPlayers = (prefix: string): Player[] => {
  const positions = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];
  return positions.map((pos, idx) => ({
    id: `${prefix}-p${idx + 1}`,
    name: `Player ${idx + 1} (${pos})`,
    jerseyNumber: `${(idx + 1) * 3}`,
    position: pos,
    battingOrder: idx + 1,
    isSubstitute: false,
    stats: {
      ab: 0, r: 0, h: 0, rbi: 0, double: 0, triple: 0, hr: 0,
      bb: 0, so: 0, sb: 0, cs: 0, ip: 0, hitsAllowed: 0,
      earnedRuns: 0, pitchCount: 0, pitchStrikes: 0
    }
  }));
};

export const HELP_GUIDE = [
  { term: '1B / 2B / 3B / HR', desc: 'Single, Double, Triple, Home Run. Safe advance for the batter.' },
  { term: 'GO / FO / LO / PO', desc: 'Ground Out, Fly Out, Line Out, Pop Out. Results in an out.' },
  { term: 'FC', desc: "Fielder's Choice. Batter reaches base but a preceding runner is put out." },
  { term: 'SAC / SF', desc: 'Sacrifice Bunt or Fly. Advances runner(s) at cost of an out.' },
  { term: 'DP / TP', desc: 'Double Play / Triple Play. Two or three outs recorded on a single play.' },
  { term: 'E', desc: 'Error by a fielder. Allows runner to reach base safely.' },
  { term: 'K / Ꝁ', desc: 'Strikeout Swinging (K) or Looking (Ꝁ).' }
];
