import React from 'react';
import { HELP_GUIDE } from '../utils/dummyData';
import { HelpCircle, BookOpen } from 'lucide-react';

export const HelpManual: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-6 text-white shadow-xl mt-6">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
        <BookOpen className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold tracking-wide">How to Score: Notation & Reference Guide</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-sm text-slate-300 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500" /> Scoring Notation Shorthand
          </h3>
          <ul className="space-y-3">
            {HELP_GUIDE.map((item, index) => (
              <li key={index} className="flex flex-col border-b border-slate-700/50 pb-2">
                <span className="font-mono text-xs font-bold text-blue-400">{item.term}</span>
                <span className="text-xs text-slate-400">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <h3 className="font-bold text-sm text-slate-300 mb-2">General Instructions & Tips</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Baseball scorekeeping uses abbreviations and diagrams to create a complete history of the game.
          </p>

          <h4 className="font-bold text-xs text-amber-400 mb-1">Standard Defensive Positions</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <div>1 - Pitcher (P)</div>
            <div>6 - Shortstop (SS)</div>
            <div>2 - Catcher (C)</div>
            <div>7 - Left Field (LF)</div>
            <div>3 - First Base (1B)</div>
            <div>8 - Center Field (CF)</div>
            <div>4 - Second Base (2B)</div>
            <div>9 - Right Field (RF)</div>
            <div>5 - Third Base (3B)</div>
            <div>DH - Desig. Hitter</div>
          </div>
        </div>
      </div>
    </div>
  );
};
