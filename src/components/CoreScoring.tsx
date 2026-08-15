import React, { useState, useCallback } from 'react';
import { Game, PlayEvent, PitchResult, AtBatOutcome, Player } from '../types';
import { DiamondVisualization } from './DiamondVisualization';
import { Save, Flag, ChevronRight, Undo2, Redo2, X, ChevronLeft } from 'lucide-react';

interface CoreScoringProps {
  game: Game;
  onUpdateGame: (updated: Game) => void;
  onSaveGame: () => void;
  onBack: () => void;
}

// Runner actions are identified by isRunnerAction flag on PlayEvent

export const CoreScoring: React.FC<CoreScoringProps> = ({ game, onUpdateGame, onSaveGame, onBack }) => {
  const [pitchHistory, setPitchHistory] = useState<{ type: PitchResult }[]>([]);
  const [sprayDir, setSprayDir] = useState<'Left' | 'Center' | 'Right' | undefined>(undefined);
  const [subPlayerName, setSubPlayerName] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [selectedBase, setSelectedBase] = useState<1 | 2 | 3 | null>(null);
  const [undoStack, setUndoStack] = useState<Game[]>([]);
  const [redoStack, setRedoStack] = useState<Game[]>([]);
  const [showDPModal, setShowDPModal] = useState(false);
  const [dpSelections, setDpSelections] = useState<string[]>([]); // player IDs to out

  // Current team/batter logic
  const currentBattingTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;
  const currentPitchingTeam = game.currentHalf === 'top' ? game.homeTeam : game.awayTeam;

  // Calculate batter index - ONLY count at-bat plays, NOT base running plays
  const atBatPlays = game.plays.filter(p =>
    p.half === game.currentHalf &&
    p.inning === game.currentInning &&
    !p.isRunnerAction
  );
  const atBatIndex = atBatPlays.length % currentBattingTeam.players.length;
  const currentBatter = currentBattingTeam.players[atBatIndex] || currentBattingTeam.players[0];
  const currentPitcher = currentPitchingTeam.players.find(p => p.position === 'P') || currentPitchingTeam.players[0];

  // Build player name lookup map
  const playerNameMap: Record<string, string> = {};
  [...game.homeTeam.players, ...game.awayTeam.players].forEach(p => {
    playerNameMap[p.id] = p.name;
  });

  const getPlayerName = (id: string | null): string => {
    if (!id) return '';
    return playerNameMap[id] || id;
  };

  // Build runners snapshot for play log
  const buildRunnersSnapshot = (runners: { 1: string | null; 2: string | null; 3: string | null }) => {
    return {
      first: runners[1] ? getPlayerName(runners[1]) : undefined,
      second: runners[2] ? getPlayerName(runners[2]) : undefined,
      third: runners[3] ? getPlayerName(runners[3]) : undefined,
    };
  };

  // Push current state to undo stack before changes
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(game))]);
    setRedoStack([]);
  }, [game]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, JSON.parse(JSON.stringify(game))]);
    setUndoStack(u => u.slice(0, -1));
    onUpdateGame(prev);
    setPitchHistory([]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, JSON.parse(JSON.stringify(game))]);
    setRedoStack(r => r.slice(0, -1));
    onUpdateGame(next);
  };

  const recordPitch = (type: PitchResult) => {
    pushUndo();
    let newBalls = game.balls;
    let newStrikes = game.strikes;

    if (type === 'ball') {
      newBalls += 1;
    } else if (type === 'strike_swinging' || type === 'strike_looking') {
      newStrikes += 1;
    } else if (type === 'foul') {
      if (newStrikes < 2) newStrikes += 1;
    }

    setPitchHistory([...pitchHistory, { type }]);

    if (newBalls >= 4) {
      resolveAtBat('BB');
    } else if (newStrikes >= 3) {
      resolveAtBat('K');
    } else {
      onUpdateGame({
        ...game,
        balls: newBalls,
        strikes: newStrikes
      });
    }
  };

  const resolveAtBat = (outcome: AtBatOutcome, hitDirection?: 'Left' | 'Center' | 'Right') => {
    pushUndo();
    let newOuts = game.outs;
    let newHomeScore = game.homeScore;
    let newAwayScore = game.awayScore;
    let newRunners = { ...game.runners };

    const batterTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;

    const updateBatterStats = (isHit: boolean, isAB: boolean, runsBatted = 0) => {
      if (!currentBatter) return;
      const pIdx = batterTeam.players.findIndex(p => p.id === currentBatter.id);
      if (pIdx >= 0) {
        batterTeam.players[pIdx].stats.ab += isAB ? 1 : 0;
        batterTeam.players[pIdx].stats.h += isHit ? 1 : 0;
        batterTeam.players[pIdx].stats.rbi += runsBatted;
        if (outcome === '2B') batterTeam.players[pIdx].stats.double += 1;
        if (outcome === '3B') batterTeam.players[pIdx].stats.triple += 1;
        if (outcome === 'HR') batterTeam.players[pIdx].stats.hr += 1;
        if (outcome === 'BB' || outcome === 'IBB') batterTeam.players[pIdx].stats.bb += 1;
        if (outcome === 'K') batterTeam.players[pIdx].stats.so += 1;
      }
    };

    let runsScored = 0;

    switch (outcome) {
      case '1B':
      case 'E':
      case 'BB':
      case 'IBB':
      case 'HBP':
      case 'INT':
        if (newRunners[3]) { runsScored++; newRunners[3] = null; }
        if (newRunners[2]) { newRunners[3] = newRunners[2]; newRunners[2] = null; }
        if (newRunners[1]) { newRunners[2] = newRunners[1]; newRunners[1] = null; }
        newRunners[1] = currentBatter?.id || 'batter';
        updateBatterStats(outcome === '1B', outcome === '1B' || outcome === 'E');
        break;

      case '2B':
      case 'GRD':
        if (newRunners[3]) { runsScored++; newRunners[3] = null; }
        if (newRunners[2]) { runsScored++; newRunners[2] = null; }
        if (newRunners[1]) { newRunners[3] = newRunners[1]; newRunners[1] = null; }
        newRunners[2] = currentBatter?.id || 'batter';
        updateBatterStats(true, true);
        break;

      case '3B':
        if (newRunners[3]) { runsScored++; newRunners[3] = null; }
        if (newRunners[2]) { runsScored++; newRunners[2] = null; }
        if (newRunners[1]) { runsScored++; newRunners[1] = null; }
        newRunners[3] = currentBatter?.id || 'batter';
        updateBatterStats(true, true);
        break;

      case 'HR':
        runsScored = 1 + (newRunners[1] ? 1 : 0) + (newRunners[2] ? 1 : 0) + (newRunners[3] ? 1 : 0);
        newRunners = { 1: null, 2: null, 3: null };
        updateBatterStats(true, true, runsScored);
        break;

      case 'GO':
      case 'FO':
      case 'LO':
      case 'PO':
      case 'K':
        newOuts += 1;
        updateBatterStats(false, true);
        break;

      case 'TP':
        newOuts += 3;
        newRunners = { 1: null, 2: null, 3: null };
        updateBatterStats(false, true);
        break;

      case 'SF':
      case 'SAC':
        newOuts += 1;
        if (newRunners[3]) { runsScored++; newRunners[3] = null; }
        updateBatterStats(false, false, 1);
        break;

      case 'FC':
        // Fielder's choice - batter reaches, a runner is out
        newOuts += 1;
        newRunners[1] = currentBatter?.id || 'batter';
        updateBatterStats(false, true);
        break;

      default:
        break;
    }

    if (game.currentHalf === 'top') {
      newAwayScore += runsScored;
    } else {
      newHomeScore += runsScored;
    }

    // Update pitcher stats
    const pitcherTeam = game.currentHalf === 'top' ? game.homeTeam : game.awayTeam;
    const pitcherIdx = pitcherTeam.players.findIndex(p => p.id === currentPitcher?.id);
    if (pitcherIdx >= 0) {
      pitcherTeam.players[pitcherIdx].stats.pitchCount += pitchHistory.length + 1;
      if (['1B', '2B', '3B', 'HR', 'E'].includes(outcome)) {
        pitcherTeam.players[pitcherIdx].stats.hitsAllowed += 1;
      }
      if (outcome === 'BB' || outcome === 'IBB') {
        pitcherTeam.players[pitcherIdx].stats.bb += 1;
      }
      if (outcome === 'K') {
        pitcherTeam.players[pitcherIdx].stats.so += 1;
      }
      pitcherTeam.players[pitcherIdx].stats.earnedRuns += runsScored;
    }

    const newPlay: PlayEvent = {
      id: 'play-' + Date.now(),
      gameId: game.id,
      inning: game.currentInning,
      half: game.currentHalf,
      batterId: currentBatter?.id || '',
      batterName: currentBatter?.name || '',
      pitcherId: currentPitcher?.id || '',
      balls: game.balls,
      strikes: game.strikes,
      pitches: pitchHistory,
      outcome,
      hitDirection,
      runsScored,
      outsRecorded: newOuts - game.outs,
      runnersAdvanced: [],
      timestamp: Date.now(),
      isRunnerAction: false,
      runnersSnapshot: buildRunnersSnapshot(newRunners)
    };

    const nextPlays = [...game.plays, newPlay];

    if (newOuts >= 3) {
      const nextHalf = game.currentHalf === 'top' ? 'bottom' as const : 'top' as const;
      const nextInning = game.currentHalf === 'bottom' ? game.currentInning + 1 : game.currentInning;

      onUpdateGame({
        ...game,
        plays: nextPlays,
        outs: 0,
        balls: 0,
        strikes: 0,
        currentInning: nextInning,
        currentHalf: nextHalf,
        runners: { 1: null, 2: null, 3: null },
        homeScore: newHomeScore,
        awayScore: newAwayScore
      });
    } else {
      onUpdateGame({
        ...game,
        plays: nextPlays,
        outs: newOuts,
        balls: 0,
        strikes: 0,
        runners: newRunners,
        homeScore: newHomeScore,
        awayScore: newAwayScore
      });
    }

    setPitchHistory([]);
    setSelectedBase(null);
  };

  // ========== RUNNER ACTIONS (do NOT advance to next batter) ==========

  const handleStolenBase = (targetBase: 2 | 3 | 4) => {
    // Determine which runner to move based on selectedBase or auto-detect
    let sourceBase: 1 | 2 | 3;
    if (targetBase === 2) sourceBase = 1;
    else if (targetBase === 3) sourceBase = 2;
    else sourceBase = 3; // steal home

    // If a base is selected, use that runner
    if (selectedBase) {
      sourceBase = selectedBase;
      // Calculate actual target based on selected base
      if (selectedBase === 1) targetBase = 2;
      else if (selectedBase === 2) targetBase = 3;
      else if (selectedBase === 3) targetBase = 4;
    }

    if (!game.runners[sourceBase]) return; // No runner on that base

    pushUndo();
    const newRunners = { ...game.runners };
    const runnerId = newRunners[sourceBase]!;
    const runnerName = getPlayerName(runnerId);
    let runsScored = 0;

    if (targetBase === 4) {
      // Stealing home
      newRunners[sourceBase] = null;
      runsScored = 1;
      // Update runner's run stat
      const batterTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;
      const rIdx = batterTeam.players.findIndex(p => p.id === runnerId);
      if (rIdx >= 0) {
        batterTeam.players[rIdx].stats.r += 1;
        batterTeam.players[rIdx].stats.sb += 1;
      }
    } else {
      // Check if target base is occupied
      if (newRunners[targetBase as 1 | 2 | 3]) return; // Can't steal if base occupied
      newRunners[targetBase as 1 | 2 | 3] = runnerId;
      newRunners[sourceBase] = null;
      // Update SB stat
      const batterTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;
      const rIdx = batterTeam.players.findIndex(p => p.id === runnerId);
      if (rIdx >= 0) batterTeam.players[rIdx].stats.sb += 1;
    }

    const newHomeScore = game.homeScore + (game.currentHalf === 'bottom' ? runsScored : 0);
    const newAwayScore = game.awayScore + (game.currentHalf === 'top' ? runsScored : 0);

    const sbPlay: PlayEvent = {
      id: 'play-sb-' + Date.now(),
      gameId: game.id,
      inning: game.currentInning,
      half: game.currentHalf,
      batterId: currentBatter?.id || '',
      batterName: currentBatter?.name || '',
      pitcherId: currentPitcher?.id || '',
      balls: game.balls,
      strikes: game.strikes,
      pitches: [],
      outcome: 'SB',
      runsScored,
      outsRecorded: 0,
      runnersAdvanced: [],
      timestamp: Date.now(),
      isRunnerAction: true, // This is KEY - won't advance to next batter
      runnerName,
      runnerFromBase: sourceBase,
      runnerToBase: targetBase === 4 ? 'home' : targetBase,
      runnersSnapshot: buildRunnersSnapshot(newRunners)
    };

    onUpdateGame({
      ...game,
      runners: newRunners,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      plays: [...game.plays, sbPlay]
    });

    setSelectedBase(null);
  };

  const handleRunnerOut = () => {
    if (!selectedBase || !game.runners[selectedBase]) return;

    pushUndo();
    const newRunners = { ...game.runners };
    const runnerId = newRunners[selectedBase]!;
    const runnerName = getPlayerName(runnerId);
    newRunners[selectedBase] = null;
    const newOuts = game.outs + 1;

    // Update CS stat
    const batterTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;
    const rIdx = batterTeam.players.findIndex(p => p.id === runnerId);
    if (rIdx >= 0) batterTeam.players[rIdx].stats.cs += 1;

    const outPlay: PlayEvent = {
      id: 'play-rout-' + Date.now(),
      gameId: game.id,
      inning: game.currentInning,
      half: game.currentHalf,
      batterId: currentBatter?.id || '',
      batterName: currentBatter?.name || '',
      pitcherId: currentPitcher?.id || '',
      balls: game.balls,
      strikes: game.strikes,
      pitches: [],
      outcome: 'RUNNER_OUT',
      runsScored: 0,
      outsRecorded: 1,
      runnersAdvanced: [],
      timestamp: Date.now(),
      isRunnerAction: true,
      runnerName,
      runnerFromBase: selectedBase,
      runnerToBase: 'out',
      runnersSnapshot: buildRunnersSnapshot(newRunners)
    };

    if (newOuts >= 3) {
      const nextHalf = game.currentHalf === 'top' ? 'bottom' as const : 'top' as const;
      const nextInning = game.currentHalf === 'bottom' ? game.currentInning + 1 : game.currentInning;
      onUpdateGame({
        ...game,
        plays: [...game.plays, outPlay],
        outs: 0,
        balls: 0,
        strikes: 0,
        currentInning: nextInning,
        currentHalf: nextHalf,
        runners: { 1: null, 2: null, 3: null },
      });
    } else {
      onUpdateGame({
        ...game,
        runners: newRunners,
        outs: newOuts,
        plays: [...game.plays, outPlay]
      });
    }

    setSelectedBase(null);
  };

  const handleRunnerAdvance = () => {
    if (!selectedBase || !game.runners[selectedBase]) return;
    pushUndo();
    const newRunners = { ...game.runners };
    const runnerId = newRunners[selectedBase]!;
    const runnerName = getPlayerName(runnerId);
    let runsScored = 0;
    let toBase: number | string = selectedBase + 1;

    if (selectedBase === 3) {
      // Score from 3rd
      newRunners[3] = null;
      runsScored = 1;
      toBase = 'home';
      const batterTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;
      const rIdx = batterTeam.players.findIndex(p => p.id === runnerId);
      if (rIdx >= 0) batterTeam.players[rIdx].stats.r += 1;
    } else {
      const next = (selectedBase + 1) as 2 | 3;
      if (newRunners[next]) return; // target occupied
      newRunners[next] = runnerId;
      newRunners[selectedBase] = null;
    }

    const newHomeScore = game.homeScore + (game.currentHalf === 'bottom' ? runsScored : 0);
    const newAwayScore = game.awayScore + (game.currentHalf === 'top' ? runsScored : 0);

    const advPlay: PlayEvent = {
      id: 'play-adv-' + Date.now(),
      gameId: game.id,
      inning: game.currentInning,
      half: game.currentHalf,
      batterId: currentBatter?.id || '',
      batterName: currentBatter?.name || '',
      pitcherId: currentPitcher?.id || '',
      balls: game.balls,
      strikes: game.strikes,
      pitches: [],
      outcome: runsScored > 0 ? 'RUNNER_SCORE' : 'RUNNER_ADVANCE',
      runsScored,
      outsRecorded: 0,
      runnersAdvanced: [],
      timestamp: Date.now(),
      isRunnerAction: true,
      runnerName,
      runnerFromBase: selectedBase,
      runnerToBase: toBase,
      runnersSnapshot: buildRunnersSnapshot(newRunners)
    };

    onUpdateGame({
      ...game,
      runners: newRunners,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      plays: [...game.plays, advPlay]
    });

    setSelectedBase(null);
  };

  // ========== DOUBLE PLAY ==========
  const handleDoublePlay = () => {
    // Check if there are runners on base
    const runnersOnBase = ([1, 2, 3] as const).filter(b => game.runners[b]);
    if (runnersOnBase.length === 0) {
      // No runners: just record batter out and one more out (lineup)
      resolveAtBat('DP');
      return;
    }
    // Show DP modal to select who gets out
    setDpSelections([]);
    setShowDPModal(true);
  };

  const confirmDoublePlay = () => {
    if (dpSelections.length !== 2) return;
    pushUndo();

    let newOuts = game.outs + 2;
    const newRunners = { ...game.runners };
    const batterTeam = game.currentHalf === 'top' ? game.awayTeam : game.homeTeam;

    // Process each selected player
    dpSelections.forEach(sel => {
      if (sel === 'batter') {
        // Batter is out - record AB
        const pIdx = batterTeam.players.findIndex(p => p.id === currentBatter?.id);
        if (pIdx >= 0) batterTeam.players[pIdx].stats.ab += 1;
      } else {
        // It's a base number
        const base = parseInt(sel) as 1 | 2 | 3;
        if (newRunners[base]) {
          const rId = newRunners[base]!;
          const rIdx = batterTeam.players.findIndex(p => p.id === rId);
          if (rIdx >= 0) batterTeam.players[rIdx].stats.cs += 1;
          newRunners[base] = null;
        }
      }
    });

    // If batter was selected as out, put batter on... no, batter is out
    const batterOut = dpSelections.includes('batter');

    const dpPlay: PlayEvent = {
      id: 'play-dp-' + Date.now(),
      gameId: game.id,
      inning: game.currentInning,
      half: game.currentHalf,
      batterId: currentBatter?.id || '',
      batterName: currentBatter?.name || '',
      pitcherId: currentPitcher?.id || '',
      balls: game.balls,
      strikes: game.strikes,
      pitches: pitchHistory,
      outcome: 'DP',
      runsScored: 0,
      outsRecorded: 2,
      runnersAdvanced: [],
      timestamp: Date.now(),
      isRunnerAction: !batterOut, // If batter is out, it counts as at-bat
      runnersSnapshot: buildRunnersSnapshot(newRunners),
      notes: `DP: ${dpSelections.map(s => s === 'batter' ? (currentBatter?.name || 'Batter') : `Runner on ${s}B`).join(' + ')}`
    };

    const nextPlays = [...game.plays, dpPlay];

    if (newOuts >= 3) {
      const nextHalf = game.currentHalf === 'top' ? 'bottom' as const : 'top' as const;
      const nextInning = game.currentHalf === 'bottom' ? game.currentInning + 1 : game.currentInning;
      onUpdateGame({
        ...game,
        plays: nextPlays,
        outs: 0,
        balls: 0,
        strikes: 0,
        currentInning: nextInning,
        currentHalf: nextHalf,
        runners: { 1: null, 2: null, 3: null },
      });
    } else {
      onUpdateGame({
        ...game,
        plays: nextPlays,
        outs: newOuts,
        balls: 0,
        strikes: 0,
        runners: newRunners,
      });
    }

    setPitchHistory([]);
    setSelectedBase(null);
    setShowDPModal(false);
    setDpSelections([]);
  };

  const toggleDPSelection = (id: string) => {
    setDpSelections(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev; // Max 2
      return [...prev, id];
    });
  };

  // ========== SUBSTITUTION ==========
  const substitutePlayer = () => {
    if (!subPlayerName) return;
    pushUndo();
    const newP: Player = {
      id: `sub-${Date.now()}`,
      name: subPlayerName,
      jerseyNumber: '99',
      position: 'PH',
      battingOrder: currentBatter.battingOrder,
      isSubstitute: true,
      stats: { ab: 0, r: 0, h: 0, rbi: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, sb: 0, cs: 0, ip: 0, hitsAllowed: 0, earnedRuns: 0, pitchCount: 0, pitchStrikes: 0 }
    };

    if (game.currentHalf === 'top') {
      const pIdx = game.awayTeam.players.findIndex(p => p.id === currentBatter.id);
      const nextPlayers = [...game.awayTeam.players];
      nextPlayers[pIdx] = newP;
      onUpdateGame({ ...game, awayTeam: { ...game.awayTeam, players: nextPlayers } });
    } else {
      const pIdx = game.homeTeam.players.findIndex(p => p.id === currentBatter.id);
      const nextPlayers = [...game.homeTeam.players];
      nextPlayers[pIdx] = newP;
      onUpdateGame({ ...game, homeTeam: { ...game.homeTeam, players: nextPlayers } });
    }
    setSubPlayerName('');
    setShowSubModal(false);
  };

  const handleEndHalfInning = () => {
    pushUndo();
    const nextHalf = game.currentHalf === 'top' ? 'bottom' as const : 'top' as const;
    const nextInning = game.currentHalf === 'bottom' ? game.currentInning + 1 : game.currentInning;
    onUpdateGame({
      ...game,
      outs: 0,
      balls: 0,
      strikes: 0,
      currentInning: nextInning,
      currentHalf: nextHalf,
      runners: { 1: null, 2: null, 3: null }
    });
    setPitchHistory([]);
  };

  const isGameOver = game.status === 'completed';

  // Determine winner
  const winner = game.homeScore > game.awayScore
    ? game.homeTeam.name
    : game.awayScore > game.homeScore
      ? game.awayTeam.name
      : 'Tie';

  // Check if there are runners on base
  const hasRunners = game.runners[1] || game.runners[2] || game.runners[3];
  const selectedRunnerName = selectedBase ? getPlayerName(game.runners[selectedBase]) : '';

  // ===========================
  // GAME OVER SCREEN
  // ===========================
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-black text-white mb-2">Game Over!</h1>
          <p className="text-slate-400 mb-6">{game.date} • {game.location}</p>

          <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Away</div>
                <div className="text-2xl font-black" style={{ color: game.awayTeam.color }}>{game.awayTeam.name}</div>
              </div>
              <div className="text-5xl font-black text-white">{game.awayScore}</div>
            </div>
            <div className="h-px bg-slate-700 my-3"></div>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Home</div>
                <div className="text-2xl font-black" style={{ color: game.homeTeam.color }}>{game.homeTeam.name}</div>
              </div>
              <div className="text-5xl font-black text-white">{game.homeScore}</div>
            </div>
          </div>

          <div className={`text-xl font-bold mb-6 px-4 py-2 rounded-lg inline-block ${
            winner === 'Tie' ? 'bg-slate-700 text-slate-300' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
          }`}>
            {winner === 'Tie' ? "It's a Tie!" : `🎉 ${winner} Wins!`}
          </div>

          <div className="text-sm text-slate-400 mb-6">
            {game.plays.length} plays recorded • {game.currentInning} innings
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-lg transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={onSaveGame}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition shadow-lg"
            >
              <Save className="w-4 h-4 inline mr-2" /> Save Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to render the play log entry with status
  const renderPlayLogEntry = (play: PlayEvent, idx: number) => {
    const isRunner = play.isRunnerAction;
    let statusLabel = '';
    let statusColor = 'text-slate-400';
    let icon = '';

    if (isRunner) {
      if (play.outcome === 'SB') {
        statusLabel = `${play.runnerName} stole ${play.runnerToBase === 'home' ? 'Home' : play.runnerToBase + 'B'}`;
        statusColor = 'text-emerald-400';
        icon = '🏃';
      } else if (play.outcome === 'RUNNER_OUT') {
        statusLabel = `${play.runnerName} OUT at ${play.runnerFromBase}B (tag)`;
        statusColor = 'text-red-400';
        icon = '❌';
      } else if (play.outcome === 'RUNNER_ADVANCE') {
        statusLabel = `${play.runnerName} advanced to ${play.runnerToBase}B`;
        statusColor = 'text-blue-400';
        icon = '➡️';
      } else if (play.outcome === 'RUNNER_SCORE') {
        statusLabel = `${play.runnerName} scored! (from ${play.runnerFromBase}B)`;
        statusColor = 'text-yellow-400';
        icon = '🏠';
      }
    }

    return (
      <div key={play.id} className={`border rounded-lg p-2 text-xs ${
        isRunner ? 'bg-slate-900/50 border-slate-700/40' : 'bg-slate-900 border-slate-700/60'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-amber-400 text-[10px]">
            {play.half === 'top' ? '▲' : '▼'} Inn {play.inning}
          </span>
          <span className="text-[10px] text-slate-500">#{game.plays.length - idx}</span>
        </div>

        {isRunner ? (
          <div className={`font-bold text-sm ${statusColor}`}>
            {icon} {statusLabel}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">{play.batterName || 'Batter'}</span>
              <span className={`font-black text-sm ${
                ['1B', '2B', '3B', 'HR'].includes(play.outcome || '') ? 'text-emerald-400' :
                ['GO', 'FO', 'LO', 'PO', 'K', 'DP', 'TP'].includes(play.outcome || '') ? 'text-red-400' :
                ['BB', 'IBB', 'HBP'].includes(play.outcome || '') ? 'text-blue-400' :
                'text-slate-300'
              }`}>
                {play.outcome}
              </span>
              {play.hitDirection && (
                <span className="text-[9px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                  {play.hitDirection}
                </span>
              )}
            </div>
            {play.notes && (
              <div className="text-[10px] text-slate-500 mt-0.5 italic">{play.notes}</div>
            )}
          </>
        )}

        {/* Status badges */}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {play.runsScored > 0 && (
            <span className="bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
              +{play.runsScored} Run{play.runsScored > 1 ? 's' : ''}
            </span>
          )}
          {play.outsRecorded > 0 && (
            <span className="bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {play.outsRecorded} Out{play.outsRecorded > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Runner positions after this play */}
        {play.runnersSnapshot && (play.runnersSnapshot.first || play.runnersSnapshot.second || play.runnersSnapshot.third) && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {play.runnersSnapshot.first && (
              <span className="bg-emerald-800/40 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-medium">
                1B: {play.runnersSnapshot.first}
              </span>
            )}
            {play.runnersSnapshot.second && (
              <span className="bg-emerald-800/40 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-medium">
                2B: {play.runnersSnapshot.second}
              </span>
            )}
            {play.runnersSnapshot.third && (
              <span className="bg-emerald-800/40 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-medium">
                3B: {play.runnersSnapshot.third}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // ===========================
  // MAIN SCORING INTERFACE
  // ===========================
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* ===== TOP SCOREBOARD BAR ===== */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* Back + Inning info row */}
          <div className="flex items-center justify-between mb-1">
            <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400">
                {game.currentHalf === 'top' ? '▲ TOP' : '▼ BOT'} {game.currentInning}
              </span>
              <span className="text-xs text-slate-500">of {game.inningsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Score display */}
          <div className="flex items-center justify-center gap-4">
            {/* Away Team */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Away</div>
                <div className="text-base font-black truncate max-w-[100px]" style={{ color: game.awayTeam.color }}>
                  {game.awayTeam.name}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-5 py-2 border border-slate-700 min-w-[140px] justify-center">
              <span className="text-4xl font-black" style={{ color: game.awayTeam.color }}>{game.awayScore}</span>
              <span className="text-xl font-bold text-slate-600">-</span>
              <span className="text-4xl font-black" style={{ color: game.homeTeam.color }}>{game.homeScore}</span>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-2 flex-1 justify-start">
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Home</div>
                <div className="text-base font-black truncate max-w-[100px]" style={{ color: game.homeTeam.color }}>
                  {game.homeTeam.name}
                </div>
              </div>
            </div>
          </div>

          {/* Outs indicator */}
          <div className="flex items-center justify-center mt-1 gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Outs:</span>
            <div className="flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                    i < game.outs
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50'
                      : 'bg-transparent border-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 max-w-[1600px] mx-auto w-full">

        {/* LEFT PANEL: Diamond + Lineup */}
        <div className="lg:w-56 flex-shrink-0 flex flex-col gap-2">
          {/* Diamond */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-2">
            <div className="flex items-center justify-center">
              <DiamondVisualization
                runners={game.runners}
                homeColor={game.homeTeam.color}
                awayColor={game.awayTeam.color}
                isTopInning={game.currentHalf === 'top'}
                sprayDirection={sprayDir}
                size="sm"
                selectedBase={selectedBase}
                onBaseClick={(base) => setSelectedBase(base === selectedBase ? null : base)}
                playerNames={playerNameMap}
              />
            </div>

            {/* Count Display */}
            <div className="bg-slate-900 rounded-lg p-2 mt-2 border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 font-bold">COUNT</span>
                <span className="font-black text-lg text-white">{game.balls}-{game.strikes}</span>
              </div>
              <div className="flex gap-1 mb-0.5 items-center">
                <span className="text-[9px] text-amber-400 font-bold w-3">B</span>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < game.balls ? 'bg-amber-500' : 'bg-slate-700'}`} />
                ))}
              </div>
              <div className="flex gap-1 mb-0.5 items-center">
                <span className="text-[9px] text-red-400 font-bold w-3">S</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < game.strikes ? 'bg-red-500' : 'bg-slate-700'}`} />
                ))}
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[9px] text-white font-bold w-3">O</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < game.outs ? 'bg-white' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>

            {/* Current At Bat Info */}
            <div className="mt-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold">At Bat</div>
              <div className="font-bold text-sm text-white truncate">{currentBatter?.name || '—'}</div>
              <div className="text-[9px] text-slate-500">#{currentBatter?.jerseyNumber} • {currentBatter?.position}</div>
              <div className="text-[9px] text-slate-500 mt-1">
                vs <span className="text-slate-300">{currentPitcher?.name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Batting Lineup */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 flex-1 overflow-hidden">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
              <span>Batting Order</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-700 text-[9px]" style={{ color: currentBattingTeam.color }}>
                {currentBattingTeam.name}
              </span>
            </h3>
            <div className="space-y-0.5 max-h-48 lg:max-h-72 overflow-y-auto">
              {currentBattingTeam.players.slice(0, 9).map((p, idx) => {
                // Check if this player is on base
                const onBase = ([1, 2, 3] as const).find(b => game.runners[b] === p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded text-[11px] transition ${
                      p.id === currentBatter?.id
                        ? 'bg-blue-600/30 border border-blue-500/50 font-bold text-white'
                        : onBase
                          ? 'bg-emerald-900/30 border border-emerald-700/30 text-emerald-300'
                          : 'text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-[9px] font-mono text-slate-500 w-3">{idx + 1}</span>
                    <span className="truncate flex-1">{p.name}</span>
                    {onBase && (
                      <span className="text-[8px] bg-emerald-700/50 px-1 py-0.5 rounded font-bold">{onBase}B</span>
                    )}
                    <span className="text-[8px] font-mono text-slate-500">{p.position}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Action Buttons - THE MAIN AREA */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">

          {/* PITCH BUTTONS */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">⚾ Pitch Tracking</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => recordPitch('ball')}
                className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-black py-4 rounded-xl text-lg shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                BALL
                <div className="text-xs font-bold opacity-70">({game.balls}/4)</div>
              </button>
              <button
                onClick={() => recordPitch('strike_swinging')}
                className="bg-red-500 hover:bg-red-400 active:bg-red-600 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                STRIKE
                <div className="text-xs font-bold opacity-70">({game.strikes}/3)</div>
              </button>
              <button
                onClick={() => recordPitch('strike_looking')}
                className="bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-all active:scale-95"
              >
                LOOKING
                <div className="text-xs font-bold opacity-70">Called K</div>
              </button>
              <button
                onClick={() => recordPitch('foul')}
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-all active:scale-95"
              >
                FOUL
                <div className="text-xs font-bold opacity-70">Foul Ball</div>
              </button>
            </div>
          </div>

          {/* HIT OUTCOMES */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hit / Play Outcome</span>
              <div className="flex gap-1">
                {(['Left', 'Center', 'Right'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setSprayDir(sprayDir === dir ? undefined : dir)}
                    className={`text-[10px] px-2 py-1 rounded font-bold transition ${
                      sprayDir === dir
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {dir === 'Left' ? '← LF' : dir === 'Center' ? '↑ CF' : '→ RF'}
                  </button>
                ))}
              </div>
            </div>

            {/* Hit buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-2">
              {[
                { code: '1B', label: 'Single', color: 'bg-emerald-600 hover:bg-emerald-500' },
                { code: '2B', label: 'Double', color: 'bg-emerald-700 hover:bg-emerald-600' },
                { code: '3B', label: 'Triple', color: 'bg-emerald-800 hover:bg-emerald-700' },
                { code: 'HR', label: 'Home Run', color: 'bg-yellow-500 hover:bg-yellow-400 text-slate-900' },
                { code: 'BB', label: 'Walk', color: 'bg-blue-600 hover:bg-blue-500' },
                { code: 'HBP', label: 'Hit By P', color: 'bg-orange-600 hover:bg-orange-500' },
                { code: 'IBB', label: 'Int Walk', color: 'bg-blue-800 hover:bg-blue-700' },
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => resolveAtBat(item.code as AtBatOutcome, sprayDir)}
                  className={`${item.color} text-white font-bold py-3 rounded-lg text-sm shadow transition-all active:scale-95`}
                >
                  <div className="font-black text-base">{item.code}</div>
                  <div className="text-[9px] opacity-70">{item.label}</div>
                </button>
              ))}
            </div>

            {/* Out buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                { code: 'GO', label: 'Ground Out' },
                { code: 'FO', label: 'Fly Out' },
                { code: 'LO', label: 'Line Out' },
                { code: 'PO', label: 'Pop Out' },
                { code: 'E', label: 'Error', special: 'bg-purple-600 hover:bg-purple-500' },
                { code: 'SAC', label: 'Sacrifice' },
                { code: 'FC', label: "Fielder's Ch" },
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => resolveAtBat(item.code as AtBatOutcome, sprayDir)}
                  className={`${item.special || 'bg-slate-600 hover:bg-slate-500'} text-white font-bold py-3 rounded-lg text-sm shadow transition-all active:scale-95`}
                >
                  <div className="font-black text-base">{item.code}</div>
                  <div className="text-[9px] opacity-70">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BASE RUNNING & RUNNER ACTIONS */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Base Running & Runner Actions
              </span>
              {selectedBase && game.runners[selectedBase] && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                    ✦ {selectedRunnerName} on {selectedBase}B
                  </span>
                  <button onClick={() => setSelectedBase(null)} className="text-[9px] bg-slate-700 px-2 py-1 rounded text-slate-300 hover:bg-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {!hasRunners && !selectedBase && (
              <div className="text-center text-slate-500 text-xs py-2">
                No runners on base. Click a base on the diamond to select a runner.
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {/* Steal buttons - only work with selected runner or auto-detect */}
              <button
                onClick={() => handleStolenBase(2)}
                disabled={!game.runners[1] && !(selectedBase === 1 && game.runners[1])}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95"
              >
                SB → 2B
                {game.runners[1] && <div className="text-[8px] opacity-70">{getPlayerName(game.runners[1])}</div>}
              </button>
              <button
                onClick={() => handleStolenBase(3)}
                disabled={!game.runners[2] && !(selectedBase === 2 && game.runners[2])}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95"
              >
                SB → 3B
                {game.runners[2] && <div className="text-[8px] opacity-70">{getPlayerName(game.runners[2])}</div>}
              </button>
              <button
                onClick={() => handleStolenBase(4)}
                disabled={!game.runners[3] && !(selectedBase === 3 && game.runners[3])}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95"
              >
                SB → Home
                {game.runners[3] && <div className="text-[8px] opacity-70">{getPlayerName(game.runners[3])}</div>}
              </button>

              {/* Runner Out - requires selected base */}
              <button
                onClick={handleRunnerOut}
                disabled={!selectedBase || !game.runners[selectedBase]}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95"
              >
                ❌ OUT
                {selectedBase && game.runners[selectedBase] && (
                  <div className="text-[8px] opacity-70">{selectedRunnerName}</div>
                )}
              </button>

              {/* Runner Advance - requires selected base */}
              <button
                onClick={handleRunnerAdvance}
                disabled={!selectedBase || !game.runners[selectedBase]}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95"
              >
                ➡️ Advance
                {selectedBase && game.runners[selectedBase] && (
                  <div className="text-[8px] opacity-70">{selectedRunnerName} → {selectedBase === 3 ? 'Home' : (selectedBase + 1) + 'B'}</div>
                )}
              </button>

              {/* Double Play */}
              <button
                onClick={handleDoublePlay}
                className="bg-red-800 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-xs transition-all active:scale-95"
              >
                DP
                <div className="text-[8px] opacity-70">Double Play</div>
              </button>
            </div>
          </div>

          {/* Game Control Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowSubModal(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all active:scale-95"
            >
              🔄 Substitute
            </button>
            <button
              onClick={handleEndHalfInning}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4" /> End Half Inning
            </button>
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Flag className="w-4 h-4" /> Finish Game
            </button>
            <button
              onClick={onSaveGame}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Play-by-Play Log */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <span className="font-bold text-sm text-slate-300">📋 Play Log</span>
              <span className="text-[10px] text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{game.plays.length} plays</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[200px] max-h-[calc(100vh-250px)]">
              {game.plays.length === 0 && (
                <div className="text-center text-slate-600 text-xs py-8">
                  No plays recorded yet.<br />Start scoring!
                </div>
              )}
              {game.plays.slice().reverse().map((play, idx) => renderPlayLogEntry(play, idx))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONFIRM FINISH MODAL ===== */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Finish Game?</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will end the game with the current score.
            </p>
            <div className="bg-slate-900 rounded-lg p-4 mb-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <div>
                  <div className="text-xs text-slate-400">Away</div>
                  <div className="font-bold" style={{ color: game.awayTeam.color }}>{game.awayTeam.name}</div>
                  <div className="text-3xl font-black text-white">{game.awayScore}</div>
                </div>
                <span className="text-xl text-slate-600 font-bold">vs</span>
                <div>
                  <div className="text-xs text-slate-400">Home</div>
                  <div className="font-bold" style={{ color: game.homeTeam.color }}>{game.homeTeam.name}</div>
                  <div className="text-3xl font-black text-white">{game.homeScore}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateGame({ ...game, status: 'completed' });
                  setShowConfirmFinish(false);
                  onSaveGame();
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg transition"
              >
                🏁 Finish Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DOUBLE PLAY MODAL ===== */}
      {showDPModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Double Play</h3>
            <p className="text-sm text-slate-400 mb-4">
              Select <span className="text-white font-bold">2 players</span> to record as out:
            </p>
            <div className="space-y-2 mb-4">
              {/* Current batter */}
              <button
                onClick={() => toggleDPSelection('batter')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition font-bold text-sm ${
                  dpSelections.includes('batter')
                    ? 'border-red-500 bg-red-500/20 text-red-300'
                    : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                {dpSelections.includes('batter') && '❌ '} 
                🏏 Batter: {currentBatter?.name}
              </button>
              
              {/* Runners on base */}
              {([1, 2, 3] as const).map(base => {
                if (!game.runners[base]) return null;
                const id = base.toString();
                return (
                  <button
                    key={base}
                    onClick={() => toggleDPSelection(id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition font-bold text-sm ${
                      dpSelections.includes(id)
                        ? 'border-red-500 bg-red-500/20 text-red-300'
                        : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {dpSelections.includes(id) && '❌ '}
                    🏃 Runner on {base}B: {getPlayerName(game.runners[base])}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 mb-4">
              Selected: {dpSelections.length}/2
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDPModal(false); setDpSelections([]); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDoublePlay}
                disabled={dpSelections.length !== 2}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-lg transition"
              >
                Confirm DP ({dpSelections.length}/2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUBSTITUTION MODAL ===== */}
      {showSubModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Substitute Player</h3>
            <p className="text-sm text-slate-400 mb-4">
              Replacing: <span className="text-white font-bold">{currentBatter?.name}</span>
            </p>
            <input
              type="text"
              placeholder="New player name"
              value={subPlayerName}
              onChange={(e) => setSubPlayerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm mb-4 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={substitutePlayer}
                disabled={!subPlayerName.trim()}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-lg transition"
              >
                Substitute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
