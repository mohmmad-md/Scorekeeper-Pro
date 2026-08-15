import React, { useState, useEffect, useCallback } from 'react';
import { User, Game } from './types';
import { Auth } from './components/Auth';
import { GameSetup } from './components/GameSetup';
import { CoreScoring } from './components/CoreScoring';
import { StatsGrid } from './components/StatsGrid';
import { GameList } from './components/GameList';
import { HelpManual } from './components/HelpManual';
import { SettingsPanel } from './components/SettingsPanel';
import { Trophy, HelpCircle, Sun, Plus, Database, Loader2, Settings } from 'lucide-react';
import { generateScorecardPDF } from './utils/generatePDF';
import { isSupabaseConfigured } from './lib/supabase';
import { saveGameToDb, loadGamesFromDb, deleteGameFromDb } from './lib/db';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [statsGame, setStatsGame] = useState<Game | null>(null);
  const [view, setView] = useState<'setup' | 'scoring' | 'stats' | 'list' | 'help' | 'profile' | 'settings'>('setup');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Check Supabase connection once on mount without blocking
  useEffect(() => {
    const checkSupabase = () => {
      try {
        const ready = isSupabaseConfigured();
        setSupabaseReady(ready);
      } catch (e) {
        setSupabaseReady(false);
      }
    };
    checkSupabase();
  }, []);

  // ---- RESTORE USER SESSION (localStorage only) ----
  useEffect(() => {
    // Always start with login screen - user must explicitly login
    // This allows fresh start every time app opens
  }, []);

  // ---- SAVE GAME ----
  const handleSaveGame = useCallback(async (gameToSave: Game) => {
    setSyncStatus('saving');

    // Update local state
    const updatedGames = games.filter(g => g.id !== gameToSave.id);
    const newGamesList = [gameToSave, ...updatedGames];
    setGames(newGamesList);

    // Always save to localStorage
    if (user) {
      localStorage.setItem('baseball_games_' + user.id, JSON.stringify(newGamesList));
    }
    localStorage.setItem('baseball_active_game_id', gameToSave.id);

    // Save to Supabase if available
    if (supabaseReady) {
      const ok = await saveGameToDb(gameToSave);
      setSyncStatus(ok ? 'saved' : 'error');
    } else {
      setSyncStatus('saved');
    }

    setTimeout(() => setSyncStatus('idle'), 2000);
  }, [games, user, supabaseReady]);

  // ---- LOAD GAMES FOR USER ----
  const loadUserGames = useCallback(async (userId: string) => {
    // Load from Supabase first if available
    if (supabaseReady) {
      const dbGames = await loadGamesFromDb();
      if (dbGames.length > 0) {
        setGames(dbGames);
        return;
      }
    }
    // Fallback to localStorage
    const savedGames = localStorage.getItem('baseball_games_' + userId);
    if (savedGames) {
      setGames(JSON.parse(savedGames));
    } else {
      setGames([]);
    }
  }, [supabaseReady]);

  // ---- LOGIN HANDLER ----
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('baseball_current_user', JSON.stringify(loggedInUser));
    loadUserGames(loggedInUser.id);
    setView('list');
  };

  // ---- LOGOUT HANDLER ----
  const handleLogout = () => {
    setUser(null);
    setGames([]);
    setActiveGame(null);
    setStatsGame(null);
    localStorage.removeItem('baseball_current_user');
    setView('list');
  };

  // ---- START NEW GAME ----
  const handleStartNewGame = (gameConfig: Partial<Game>) => {
    const newGame = gameConfig as Game;
    setActiveGame(newGame);
    handleSaveGame(newGame);
    setView('scoring');
  };

  // ---- DUPLICATE GAME ----
  const handleDuplicateGame = (gameToCopy: Game) => {
    const duplicatedGame: Game = {
      ...JSON.parse(JSON.stringify(gameToCopy)),
      id: 'g-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      status: 'in_progress' as const,
      currentInning: 1,
      currentHalf: 'top' as const,
      outs: 0,
      balls: 0,
      strikes: 0,
      homeScore: 0,
      awayScore: 0,
      runners: { 1: null, 2: null, 3: null },
      plays: []
    };
    const resetStats = { ab: 0, r: 0, h: 0, rbi: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, sb: 0, cs: 0, ip: 0, hitsAllowed: 0, earnedRuns: 0, pitchCount: 0, pitchStrikes: 0 };
    duplicatedGame.homeTeam.players.forEach(p => { p.stats = { ...resetStats }; });
    duplicatedGame.awayTeam.players.forEach(p => { p.stats = { ...resetStats }; });
    handleSaveGame(duplicatedGame);
    setActiveGame(duplicatedGame);
    setView('scoring');
  };

  // ---- DELETE GAME ----
  const handleDeleteGame = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this game record?')) return;
    const filtered = games.filter(g => g.id !== id);
    setGames(filtered);
    if (user) {
      localStorage.setItem('baseball_games_' + user.id, JSON.stringify(filtered));
    }
    if (supabaseReady) {
      await deleteGameFromDb(id);
    }
    if (activeGame?.id === id) {
      setActiveGame(null);
      localStorage.removeItem('baseball_active_game_id');
      setView('list');
    }
    if (statsGame?.id === id) {
      setStatsGame(null);
    }
  };

  // ---- PDF EXPORT ----
  const generateAndDownloadPDF = async () => {
    const gameForPdf = statsGame || activeGame;
    if (!gameForPdf) {
      alert('No game selected for export.');
      return;
    }
    try {
      await generateScorecardPDF(gameForPdf);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ---- RENDER AUTH SCREEN (Always first if no user) ----
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-blue-500" />
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              SCOREKEEPER PRO
            </span>
          </div>
          <button
            onClick={() => setView('settings')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <Settings className="w-3 h-3" />
            Settings
          </button>
        </header>
        <main className="flex-1 flex flex-col">
          {view === 'settings' ? (
            <SettingsPanel
              onBack={() => setView('list')}
              onConnectionChange={(connected: boolean) => setSupabaseReady(connected)}
            />
          ) : (
            <Auth
              currentUser={null}
              onLogin={handleLogin}
              onLogout={() => {}}
            />
          )}
        </main>
        <footer className="border-t border-slate-800 text-center py-4 text-xs text-slate-600">
          Baseball Scorecard & Statistics Tracker Pro
        </footer>
      </div>
    );
  }

  // ---- SCORING VIEW (full screen) ----
  if (view === 'scoring' && activeGame) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <CoreScoring
          game={activeGame}
          onUpdateGame={setActiveGame}
          onSaveGame={() => handleSaveGame(activeGame)}
          onBack={() => setView('list')}
        />
      </div>
    );
  }

  // ---- MAIN DASHBOARD ----
  const currentStatsGame = statsGame || activeGame;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'} px-4 py-3 sticky top-0 z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('list'); setStatsGame(null); }}>
            <Trophy className="w-6 h-6 text-blue-500" />
            <span className="font-black text-lg tracking-wider bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              SCOREKEEPER PRO
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Status */}
            {syncStatus !== 'idle' && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                syncStatus === 'saving' ? 'bg-blue-500/10 text-blue-400' :
                syncStatus === 'saved' ? 'bg-green-500/10 text-green-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {syncStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'saved' ? '✓ Saved' : '✗ Error'}
              </div>
            )}

            {/* Cloud Status */}
            <div className={`hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full ${supabaseReady ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Database className="w-3 h-3" />
              {supabaseReady ? 'Cloud' : 'Local'}
            </div>

            {/* New Game */}
            <button
              onClick={() => { setActiveGame(null); setStatsGame(null); setView('setup'); }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow"
            >
              <Plus className="w-4 h-4" /> New Game
            </button>

            {/* Continue Game */}
            {activeGame && (
              <button
                onClick={() => setView('scoring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'scoring' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}
              >
                ⚾ Continue Game
              </button>
            )}

            {/* Games */}
            <button
              onClick={() => { setView('list'); setStatsGame(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'list' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}
            >
              📋 Games
            </button>

            {/* Help */}
            <button
              onClick={() => setView('help')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'help' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-800'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile */}
            <button
              onClick={() => setView('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'profile' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}
            >
              👤 Profile
            </button>

            {/* Settings */}
            <button
              onClick={() => setView('settings')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                view === 'settings'
                  ? 'bg-blue-600 text-white'
                  : supabaseReady
                    ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
                    : 'bg-amber-900/50 text-amber-400 border border-amber-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {view === 'setup' && user && (
          <GameSetup
            onStartGame={handleStartNewGame}
            userId={user.id}
          />
        )}

        {view === 'list' && user && (
          <GameList
            games={games}
            onSelectGame={(game) => {
              setActiveGame(game);
              if (game.status === 'completed') {
                setStatsGame(game);
                setView('stats');
              } else {
                setView('scoring');
              }
            }}
            onDeleteGame={handleDeleteGame}
            onDuplicateGame={handleDuplicateGame}
            onViewStats={(game) => {
              setStatsGame(game);
              setView('stats');
            }}
            onNewGame={() => { setActiveGame(null); setStatsGame(null); setView('setup'); }}
          />
        )}

        {view === 'stats' && currentStatsGame && (
          <StatsGrid
            game={currentStatsGame}
            onExportPdf={generateAndDownloadPDF}
          />
        )}

        {view === 'help' && (
          <HelpManual />
        )}

        {view === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Profile</h2>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold"
                >
                  Logout
                </button>
              </div>

              {/* User Info Card */}
              <div className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-6`}>
                <div className="flex items-center gap-4 mb-6">
                  {/* Avatar with first letter of email */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-slate-400">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg p-4`}>
                    <p className="text-xs text-slate-400 mb-1">User ID</p>
                    <p className="text-sm font-mono truncate">{user.id}</p>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg p-4`}>
                    <p className="text-xs text-slate-400 mb-1">Storage Mode</p>
                    <p className="text-sm font-bold">{supabaseReady ? '☁️ Cloud Connected' : '💾 Local Only'}</p>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg p-4`}>
                    <p className="text-xs text-slate-400 mb-1">Total Games</p>
                    <p className="text-xl font-bold">{games.length}</p>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg p-4`}>
                    <p className="text-xs text-slate-400 mb-1">Active Games</p>
                    <p className="text-xl font-bold">{games.filter(g => g.status === 'in_progress').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <SettingsPanel
            onBack={() => setView('list')}
            onConnectionChange={(connected: boolean) => setSupabaseReady(connected)}
          />
        )}
      </main>
    </div>
  );
};

export default App;