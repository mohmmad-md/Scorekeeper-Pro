import React, { useState } from 'react';
import { Game, Player } from '../types';
import { Download, LayoutGrid, Trophy } from 'lucide-react';

interface StatsGridProps {
  game: Game;
  onExportPdf: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ game, onExportPdf }) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'batting' | 'pitching'>('grid');

  // Determine winner
  const winner = game.homeScore > game.awayScore
    ? game.homeTeam.name
    : game.awayScore > game.homeScore
      ? game.awayTeam.name
      : null;

  // Compute stats helper per team
  const renderBattingStats = (players: Player[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-900 text-slate-300 border-b border-slate-700">
            <th className="p-2">Name</th>
            <th className="p-2">Pos</th>
            <th className="p-2">AB</th>
            <th className="p-2">R</th>
            <th className="p-2">H</th>
            <th className="p-2">RBI</th>
            <th className="p-2">2B</th>
            <th className="p-2">3B</th>
            <th className="p-2">HR</th>
            <th className="p-2">BB</th>
            <th className="p-2">SO</th>
            <th className="p-2">SB</th>
            <th className="p-2">AVG</th>
            <th className="p-2">OBP</th>
            <th className="p-2">SLG</th>
            <th className="p-2">OPS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {players.map((p) => {
            const ab = p.stats.ab;
            const h = p.stats.h;
            const avg = ab > 0 ? (h / ab).toFixed(3) : '.000';
            const obp = (ab + p.stats.bb) > 0 ? ((h + p.stats.bb) / (ab + p.stats.bb)).toFixed(3) : '.000';
            const slg = ab > 0 ? ((h + p.stats.double + 2 * p.stats.triple + 3 * p.stats.hr) / ab).toFixed(3) : '.000';
            const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);

            return (
              <tr key={p.id} className="hover:bg-slate-800/60">
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2 text-slate-400">{p.position}</td>
                <td className="p-2">{ab}</td>
                <td className="p-2">{p.stats.r}</td>
                <td className="p-2">{h}</td>
                <td className="p-2">{p.stats.rbi}</td>
                <td className="p-2">{p.stats.double}</td>
                <td className="p-2">{p.stats.triple}</td>
                <td className="p-2">{p.stats.hr}</td>
                <td className="p-2">{p.stats.bb}</td>
                <td className="p-2">{p.stats.so}</td>
                <td className="p-2">{p.stats.sb}</td>
                <td className="p-2 font-mono text-emerald-400">{avg}</td>
                <td className="p-2 font-mono">{obp}</td>
                <td className="p-2 font-mono">{slg}</td>
                <td className="p-2 font-mono font-bold">{ops}</td>
              </tr>
            );
          })}
          {/* Totals row */}
          <tr className="bg-slate-900/50 font-bold border-t-2 border-slate-600">
            <td className="p-2" colSpan={2}>TOTALS</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.ab, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.r, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.h, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.rbi, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.double, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.triple, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.hr, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.bb, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.so, 0)}</td>
            <td className="p-2">{players.reduce((s, p) => s + p.stats.sb, 0)}</td>
            <td className="p-2" colSpan={4}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderPitchingStats = (players: Player[]) => {
    const pitchers = players.filter(p => p.position === 'P' || p.stats.pitchCount > 0);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-300 border-b border-slate-700">
              <th className="p-2">Name</th>
              <th className="p-2">IP</th>
              <th className="p-2">H</th>
              <th className="p-2">R</th>
              <th className="p-2">ER</th>
              <th className="p-2">BB</th>
              <th className="p-2">SO</th>
              <th className="p-2">Pitches</th>
              <th className="p-2">ERA</th>
              <th className="p-2">WHIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {pitchers.map((p) => {
              const ip = p.stats.ip || 1;
              const era = ((p.stats.earnedRuns / ip) * 9).toFixed(2);
              const whip = ((p.stats.hitsAllowed + p.stats.bb) / ip).toFixed(2);

              return (
                <tr key={p.id} className="hover:bg-slate-800/60">
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2">{p.stats.ip}</td>
                  <td className="p-2">{p.stats.hitsAllowed}</td>
                  <td className="p-2">{p.stats.r}</td>
                  <td className="p-2">{p.stats.earnedRuns}</td>
                  <td className="p-2">{p.stats.bb}</td>
                  <td className="p-2">{p.stats.so}</td>
                  <td className="p-2">{p.stats.pitchCount}</td>
                  <td className="p-2 font-mono text-red-400">{era}</td>
                  <td className="p-2 font-mono">{whip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Grid/Cell Renderer for Paper Scorecard Grid View
  const getPlayNotations = (player: Player, inning: number, isHome: boolean) => {
    const half = isHome ? 'bottom' : 'top';
    // Find ALL plays for this batter in this inning (could have multiple at-bats)
    const plays = game.plays.filter(p =>
      p.batterId === player.id &&
      p.inning === inning &&
      p.half === half &&
      !p.isRunnerAction
    );
    if (plays.length === 0) return null;
    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
        {plays.map((play, pIdx) => (
          <div key={play.id} className="flex flex-col items-center">
            <span className={`font-extrabold text-[10px] ${
              ['1B', '2B', '3B', 'HR'].includes(play.outcome || '') ? 'text-emerald-400' :
              ['GO', 'FO', 'LO', 'PO', 'K', 'DP'].includes(play.outcome || '') ? 'text-red-400' :
              ['BB', 'IBB', 'HBP'].includes(play.outcome || '') ? 'text-blue-400' :
              'text-slate-300'
            }`}>{play.outcome}</span>
            {pIdx === 0 && (
              <svg width="16" height="16" viewBox="0 0 20 20" className="mt-0.5">
                <polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="#64748b" strokeWidth="1" />
                {['1B', '2B', '3B', 'HR', 'BB', 'IBB', 'HBP', 'E'].includes(play.outcome || '') && (
                  <line x1="10" y1="18" x2="18" y2="10" stroke="#10b981" strokeWidth="2" />
                )}
                {['2B', '3B', 'HR'].includes(play.outcome || '') && (
                  <line x1="18" y1="10" x2="10" y2="2" stroke="#10b981" strokeWidth="2" />
                )}
                {['3B', 'HR'].includes(play.outcome || '') && (
                  <line x1="10" y1="2" x2="2" y2="10" stroke="#10b981" strokeWidth="2" />
                )}
                {play.outcome === 'HR' && (
                  <line x1="2" y1="10" x2="10" y2="18" stroke="#10b981" strokeWidth="2" />
                )}
                {['GO', 'FO', 'LO', 'PO', 'K', 'DP'].includes(play.outcome || '') && (
                  <circle cx="10" cy="10" r="3" fill="#ef4444" opacity="0.5" />
                )}
              </svg>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Compute runs per inning for each team
  const getRunsPerInning = (isHome: boolean) => {
    const half = isHome ? 'bottom' : 'top';
    const maxInning = Math.max(game.currentInning, ...game.plays.map(p => p.inning), 1);
    const runs: number[] = [];
    for (let i = 1; i <= maxInning; i++) {
      const inningPlays = game.plays.filter(p => p.inning === i && p.half === half);
      runs.push(inningPlays.reduce((sum, p) => sum + p.runsScored, 0));
    }
    return { runs, maxInning };
  };

  const awayLine = getRunsPerInning(false);
  const homeLine = getRunsPerInning(true);
  const maxInning = Math.max(awayLine.maxInning, homeLine.maxInning);
  const displayInnings = Math.max(maxInning, game.inningsCount);

  const totalRuns = (isHome: boolean) => {
    const half = isHome ? 'bottom' : 'top';
    return game.plays.filter(p => p.half === half).reduce((sum, p) => sum + p.runsScored, 0);
  };

  const totalHits = (isHome: boolean) => {
    const team = isHome ? game.homeTeam : game.awayTeam;
    return team.players.reduce((sum, p) => sum + p.stats.h, 0);
  };

  const totalErrors = (isHome: boolean) => {
    const half = isHome ? 'top' : 'bottom'; // Errors are committed BY the fielding team
    return game.plays.filter(p => p.half === half && p.outcome === 'E').length;
  };

  return (
    <div id="pdf-exportable-zone" className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-white max-w-7xl mx-auto shadow-xl">

      {/* GAME HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Away</div>
              <div className="text-xl font-black" style={{ color: game.awayTeam.color }}>{game.awayTeam.name}</div>
            </div>
            <div className="bg-slate-800 rounded-xl px-6 py-3 border border-slate-600">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black" style={{ color: game.awayTeam.color }}>{game.awayScore}</span>
                <span className="text-xl text-slate-500">-</span>
                <span className="text-4xl font-black" style={{ color: game.homeTeam.color }}>{game.homeScore}</span>
              </div>
              {game.status === 'completed' && winner && (
                <div className="text-center mt-1 text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3" /> {winner} Wins
                </div>
              )}
              {game.status === 'completed' && !winner && (
                <div className="text-center mt-1 text-[10px] font-bold text-amber-400">Tie Game</div>
              )}
              {game.status === 'in_progress' && (
                <div className="text-center mt-1 text-[10px] font-bold text-blue-400">In Progress</div>
              )}
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Home</div>
              <div className="text-xl font-black" style={{ color: game.homeTeam.color }}>{game.homeTeam.name}</div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>{game.date}</div>
            <div>{game.location}</div>
            <div>{game.plays.length} plays • {maxInning} innings</div>
          </div>
        </div>
      </div>

      {/* LINE SCORE */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📊 Line Score</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-slate-400">
                <th className="p-2 text-left w-32 border-r border-slate-700">Team</th>
                {Array.from({ length: displayInnings }).map((_, i) => (
                  <th key={i} className="p-2 text-center w-8 border-r border-slate-800">{i + 1}</th>
                ))}
                <th className="p-2 text-center w-10 font-black text-amber-400 border-r border-slate-700">R</th>
                <th className="p-2 text-center w-10 font-black text-blue-400 border-r border-slate-700">H</th>
                <th className="p-2 text-center w-10 font-black text-red-400">E</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-700">
                <td className="p-2 font-bold text-left border-r border-slate-700" style={{ color: game.awayTeam.color }}>{game.awayTeam.name}</td>
                {Array.from({ length: displayInnings }).map((_, i) => (
                  <td key={i} className="p-2 text-center border-r border-slate-800">
                    {i < awayLine.runs.length ? (awayLine.runs[i] > 0 ? awayLine.runs[i] : '0') : '-'}
                  </td>
                ))}
                <td className="p-2 text-center font-black text-amber-400 text-lg border-r border-slate-700">{totalRuns(false)}</td>
                <td className="p-2 text-center font-bold text-blue-400 border-r border-slate-700">{totalHits(false)}</td>
                <td className="p-2 text-center font-bold text-red-400">{totalErrors(false)}</td>
              </tr>
              <tr className="border-t border-slate-700">
                <td className="p-2 font-bold text-left border-r border-slate-700" style={{ color: game.homeTeam.color }}>{game.homeTeam.name}</td>
                {Array.from({ length: displayInnings }).map((_, i) => (
                  <td key={i} className="p-2 text-center border-r border-slate-800">
                    {i < homeLine.runs.length ? (homeLine.runs[i] > 0 ? homeLine.runs[i] : '0') : '-'}
                  </td>
                ))}
                <td className="p-2 text-center font-black text-amber-400 text-lg border-r border-slate-700">{totalRuns(true)}</td>
                <td className="p-2 text-center font-bold text-blue-400 border-r border-slate-700">{totalHits(true)}</td>
                <td className="p-2 text-center font-bold text-red-400">{totalErrors(true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-400" /> Stats & Scorecard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            View traditional paper scorecard, batting stats, or pitching stats.
          </p>
        </div>

        <button
          onClick={onExportPdf}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm shadow-lg transition"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}
        >
          📋 Paper Scorecard
        </button>
        <button
          onClick={() => setActiveTab('batting')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'batting' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}
        >
          🏏 Batting Stats
        </button>
        <button
          onClick={() => setActiveTab('pitching')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'pitching' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}
        >
          ⚾ Pitching Stats
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'grid' && (
        <div className="space-y-8">
          {[
            { team: game.awayTeam, label: 'AWAY', isHome: false },
            { team: game.homeTeam, label: 'HOME', isHome: true }
          ].map(({ team, label, isHome }) => (
            <div key={label} className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-4 py-2 font-bold text-xs flex justify-between items-center" style={{ backgroundColor: team.color + '20' }}>
                <span style={{ color: team.color }}>{label}: {team.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-700">
                      <th className="p-2 border-r border-slate-800 w-36 sticky left-0 bg-slate-950 z-10">#  Batter</th>
                      <th className="p-1 border-r border-slate-800 text-center w-8">Pos</th>
                      {Array.from({ length: displayInnings }).map((_, i) => (
                        <th key={i} className="p-2 border-r border-slate-800 text-center w-14">{i + 1}</th>
                      ))}
                      <th className="p-2 text-center w-10">AB</th>
                      <th className="p-2 text-center w-10">R</th>
                      <th className="p-2 text-center w-10">H</th>
                      <th className="p-2 text-center w-10">RBI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {team.players.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-1.5 border-r border-slate-800 font-medium sticky left-0 bg-slate-800 z-10">
                          <span className="text-slate-500 mr-1">{idx + 1}.</span> {p.name}
                        </td>
                        <td className="p-1 border-r border-slate-800 text-center text-[10px] text-slate-400">{p.position}</td>
                        {Array.from({ length: displayInnings }).map((_, i) => (
                          <td key={i} className="p-1 border-r border-slate-800 text-center align-middle h-12">
                            {getPlayNotations(p, i + 1, isHome)}
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold">{p.stats.ab}</td>
                        <td className="p-2 text-center font-bold">{p.stats.r}</td>
                        <td className="p-2 text-center font-bold">{p.stats.h}</td>
                        <td className="p-2 text-center font-bold">{p.stats.rbi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'batting' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: game.awayTeam.color }}>AWAY: {game.awayTeam.name}</h3>
            {renderBattingStats(game.awayTeam.players)}
          </div>
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-bold mb-2" style={{ color: game.homeTeam.color }}>HOME: {game.homeTeam.name}</h3>
            {renderBattingStats(game.homeTeam.players)}
          </div>
        </div>
      )}

      {activeTab === 'pitching' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: game.awayTeam.color }}>AWAY: {game.awayTeam.name}</h3>
            {renderPitchingStats(game.awayTeam.players)}
          </div>
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-bold mb-2" style={{ color: game.homeTeam.color }}>HOME: {game.homeTeam.name}</h3>
            {renderPitchingStats(game.homeTeam.players)}
          </div>
        </div>
      )}
    </div>
  );
};
