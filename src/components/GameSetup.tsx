import React, { useState } from 'react';
import { Game, Player } from '../types';
import { getDefaultPlayers, POSITIONS } from '../utils/dummyData';
import { Calendar, MapPin, Clock, Trophy, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface GameSetupProps {
  onStartGame: (gameConfig: Partial<Game>) => void;
  userId: string;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, userId }) => {
  // Team States
  const [homeTeamName, setHomeTeamName] = useState('Home Team');
  const [homeTeamColor, setHomeTeamColor] = useState('#2563eb');
  const [homeLineupType, setHomeLineupType] = useState<'default' | 'custom'>('default');
  const [homePlayers, setHomePlayers] = useState<Player[]>(getDefaultPlayers('home'));

  const [awayTeamName, setAwayTeamName] = useState('Away Team');
  const [awayTeamColor, setAwayTeamColor] = useState('#dc2626');
  const [awayLineupType, setAwayLineupType] = useState<'default' | 'custom'>('default');
  const [awayPlayers, setAwayPlayers] = useState<Player[]>(getDefaultPlayers('away'));

  // Game Info States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('Yankee Stadium');
  const [inningsCount, setInningsCount] = useState(9);
  const [leagueName, setLeagueName] = useState('');
  const [umpireName, setUmpireName] = useState('');

  // Helpers for custom lineup management
  const addPlayer = (teamType: 'home' | 'away') => {
    const list = teamType === 'home' ? homePlayers : awayPlayers;
    const newP: Player = {
      id: `${teamType}-p${Date.now()}`,
      name: `Substitute Player`,
      jerseyNumber: '00',
      position: 'DH',
      battingOrder: list.length + 1,
      isSubstitute: true,
      stats: { ab: 0, r: 0, h: 0, rbi: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, sb: 0, cs: 0, ip: 0, hitsAllowed: 0, earnedRuns: 0, pitchCount: 0, pitchStrikes: 0 }
    };
    if (teamType === 'home') setHomePlayers([...list, newP]);
    else setAwayPlayers([...list, newP]);
  };

  const updatePlayer = (teamType: 'home' | 'away', index: number, field: keyof Player, value: any) => {
    const list = [...(teamType === 'home' ? homePlayers : awayPlayers)];
    list[index] = { ...list[index], [field]: value };
    if (teamType === 'home') setHomePlayers(list);
    else setAwayPlayers(list);
  };

  const movePlayer = (teamType: 'home' | 'away', index: number, direction: 'up' | 'down') => {
    const list = [...(teamType === 'home' ? homePlayers : awayPlayers)];
    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
      // Reassign batting orders
      list.forEach((p, i) => { p.battingOrder = i + 1; });
      teamType === 'home' ? setHomePlayers(list) : setAwayPlayers(list);
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index + 1], list[index]] = [list[index], list[index + 1]];
      list.forEach((p, i) => { p.battingOrder = i + 1; });
      teamType === 'home' ? setHomePlayers(list) : setAwayPlayers(list);
    }
  };

  const deletePlayer = (teamType: 'home' | 'away', index: number) => {
    const list = teamType === 'home' ? [...homePlayers] : [...awayPlayers];
    if (list.length <= 9) return; // Prevent less than 9 players
    list.splice(index, 1);
    list.forEach((p, i) => { p.battingOrder = i + 1; });
    teamType === 'home' ? setHomePlayers(list) : setAwayPlayers(list);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      id: 'g-' + Date.now(),
      userId,
      homeTeam: { name: homeTeamName, color: homeTeamColor, isHome: true, players: homePlayers },
      awayTeam: { name: awayTeamName, color: awayTeamColor, isHome: false, players: awayPlayers },
      date,
      location: `${location} | Umpire: ${umpireName || 'None'}`,
      status: 'in_progress',
      inningsCount,
      currentInning: 1,
      currentHalf: 'top',
      outs: 0,
      balls: 0,
      strikes: 0,
      homeScore: 0,
      awayScore: 0,
      runners: { 1: null, 2: null, 3: null },
      plays: [],
      notes: `League: ${leagueName}`
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-6 text-white shadow-xl mt-6">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
        <Trophy className="w-8 h-8 text-amber-500" />
        <h2 className="text-2xl font-bold tracking-wide">Configure New Baseball Game</h2>
      </div>

      <form onSubmit={handleStart} className="space-y-8">
        {/* Game Detail Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Date</label>
            <div className="flex items-center relative">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-500" />
              <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Time</label>
            <div className="flex items-center relative">
              <Clock className="absolute left-3 w-4 h-4 text-slate-500" />
              <input type="time" className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Location / Stadium</label>
            <div className="flex items-center relative">
              <MapPin className="absolute left-3 w-4 h-4 text-slate-500" />
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Innings (1-12)</label>
            <input type="number" min={1} max={12} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:border-blue-500" value={inningsCount} onChange={e => setInningsCount(Number(e.target.value))} />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">League Name (Optional)</label>
            <input type="text" placeholder="e.g. Little League, MLB" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:border-blue-500" value={leagueName} onChange={e => setLeagueName(e.target.value)} />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Umpire Name (Optional)</label>
            <input type="text" placeholder="e.g. John Smith" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:border-blue-500" value={umpireName} onChange={e => setUmpireName(e.target.value)} />
          </div>
        </div>

        {/* Both Teams Configured */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Away Team */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded">AWAY TEAM</span>
              <input type="color" value={awayTeamColor} onChange={e => setAwayTeamColor(e.target.value)} className="bg-transparent w-8 h-8 rounded cursor-pointer" />
            </div>

            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-lg font-bold mb-4 focus:border-red-500" value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)} />

            <div className="flex gap-2 mb-4 bg-slate-800 p-1 rounded-lg">
              <button type="button" onClick={() => setAwayLineupType('default')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${awayLineupType === 'default' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Default Lineup</button>
              <button type="button" onClick={() => setAwayLineupType('custom')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${awayLineupType === 'custom' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Custom Lineup</button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {awayPlayers.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2 bg-slate-800/80 p-2 rounded border border-slate-700 text-xs">
                  <span className="w-5 text-slate-400 font-mono">{idx + 1}.</span>
                  {awayLineupType === 'default' ? (
                    <>
                      <span className="flex-1 font-medium">{p.name}</span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">{p.position}</span>
                    </>
                  ) : (
                    <>
                      <input type="text" value={p.name} onChange={e => updatePlayer('away', idx, 'name', e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded" placeholder="Name" />
                      <input type="text" value={p.jerseyNumber} onChange={e => updatePlayer('away', idx, 'jerseyNumber', e.target.value)} className="w-12 bg-slate-900 border border-slate-700 px-1 py-1 rounded text-center" placeholder="#" />
                      <select value={p.position} onChange={e => updatePlayer('away', idx, 'position', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-1 py-1">
                        {POSITIONS.map(pos => <option key={pos.code} value={pos.code}>{pos.code}</option>)}
                      </select>
                      <button type="button" onClick={() => movePlayer('away', idx, 'up')} className="text-slate-400 hover:text-white"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => movePlayer('away', idx, 'down')} className="text-slate-400 hover:text-white"><ArrowDown className="w-4 h-4" /></button>
                      {awayPlayers.length > 9 && (
                        <button type="button" onClick={() => deletePlayer('away', idx)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {awayLineupType === 'custom' && (
              <button type="button" onClick={() => addPlayer('away')} className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs flex items-center justify-center gap-1 border border-slate-700">
                <Plus className="w-4 h-4" /> Add Player (Substitute)
              </button>
            )}
          </div>

          {/* Home Team */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded">HOME TEAM</span>
              <input type="color" value={homeTeamColor} onChange={e => setHomeTeamColor(e.target.value)} className="bg-transparent w-8 h-8 rounded cursor-pointer" />
            </div>

            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-lg font-bold mb-4 focus:border-blue-500" value={homeTeamName} onChange={e => setHomeTeamName(e.target.value)} />

            <div className="flex gap-2 mb-4 bg-slate-800 p-1 rounded-lg">
              <button type="button" onClick={() => setHomeLineupType('default')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${homeLineupType === 'default' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Default Lineup</button>
              <button type="button" onClick={() => setHomeLineupType('custom')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${homeLineupType === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Custom Lineup</button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {homePlayers.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2 bg-slate-800/80 p-2 rounded border border-slate-700 text-xs">
                  <span className="w-5 text-slate-400 font-mono">{idx + 1}.</span>
                  {homeLineupType === 'default' ? (
                    <>
                      <span className="flex-1 font-medium">{p.name}</span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">{p.position}</span>
                    </>
                  ) : (
                    <>
                      <input type="text" value={p.name} onChange={e => updatePlayer('home', idx, 'name', e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded" placeholder="Name" />
                      <input type="text" value={p.jerseyNumber} onChange={e => updatePlayer('home', idx, 'jerseyNumber', e.target.value)} className="w-12 bg-slate-900 border border-slate-700 px-1 py-1 rounded text-center" placeholder="#" />
                      <select value={p.position} onChange={e => updatePlayer('home', idx, 'position', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-1 py-1">
                        {POSITIONS.map(pos => <option key={pos.code} value={pos.code}>{pos.code}</option>)}
                      </select>
                      <button type="button" onClick={() => movePlayer('home', idx, 'up')} className="text-slate-400 hover:text-white"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => movePlayer('home', idx, 'down')} className="text-slate-400 hover:text-white"><ArrowDown className="w-4 h-4" /></button>
                      {homePlayers.length > 9 && (
                        <button type="button" onClick={() => deletePlayer('home', idx)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {homeLineupType === 'custom' && (
              <button type="button" onClick={() => addPlayer('home')} className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs flex items-center justify-center gap-1 border border-slate-700">
                <Plus className="w-4 h-4" /> Add Player (Substitute)
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-lg tracking-wide shadow-lg transition">
          Play Ball! (Start Game)
        </button>
      </form>
    </div>
  );
};
