import React from 'react';
import { Game } from '../types';
import { Play, Copy, Trash2, Calendar, MapPin, Clock, BarChart2 } from 'lucide-react';

interface GameListProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  onViewStats: (game: Game) => void;
  onDuplicateGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
  onNewGame: () => void;
}

export const GameList: React.FC<GameListProps> = ({
  games,
  onSelectGame,
  onViewStats,
  onDuplicateGame,
  onDeleteGame,
  onNewGame
}) => {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800/40 border border-slate-700/50 rounded-xl max-w-4xl mx-auto mt-6">
        <p className="text-slate-400 mb-4">No saved games found. Create your first game!</p>
        <button
          onClick={onNewGame}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg text-sm mx-auto"
        >
          + Create New Game
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Game History & Saved Sessions
        </h2>
        <button
          onClick={onNewGame}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm"
        >
          + New Game
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition">
            <div>
              {/* Top Banner Status */}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${game.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'}`}>
                  {game.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {game.date}
                </span>
              </div>

              {/* Matchup */}
              <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mb-4">
                <div className="text-center flex-1">
                  <div className="text-xs text-slate-500 font-bold mb-0.5">AWAY</div>
                  <div className="font-bold text-white text-sm truncate">{game.awayTeam.name}</div>
                  <div className="text-lg font-black text-slate-300">{game.awayScore}</div>
                </div>

                <div className="px-3 font-bold text-slate-500 text-xs">VS</div>

                <div className="text-center flex-1">
                  <div className="text-xs text-slate-500 font-bold mb-0.5">HOME</div>
                  <div className="font-bold text-white text-sm truncate">{game.homeTeam.name}</div>
                  <div className="text-lg font-black text-slate-300">{game.homeScore}</div>
                </div>
              </div>

              {/* Game Info Details */}
              <div className="space-y-1 text-xs text-slate-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {game.location}
                </div>
                <div>
                  <strong>Inning:</strong> {game.currentInning} ({game.currentHalf}) | <strong>Outs:</strong> {game.outs}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-700/50 pt-3">
              <button
                onClick={() => onSelectGame(game)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1 shadow transition"
              >
                <Play className="w-3.5 h-3.5" /> {game.status === 'completed' ? 'View/Edit' : 'Resume'}
              </button>
              
              <button
                onClick={() => onViewStats(game)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-1 shadow transition"
              >
                <BarChart2 className="w-3.5 h-3.5" /> Stats
              </button>

              <button
                onClick={() => onDuplicateGame(game)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-3 rounded text-xs flex items-center gap-1 border border-slate-600 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>

              <button
                onClick={() => onDeleteGame(game.id)}
                className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/40 py-2 px-3 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
