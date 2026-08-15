import React, { useState, useEffect } from 'react';
import {
  Database, CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  ArrowLeft, ExternalLink, Trash2, Plug, Shield,
  BookOpen, Info, Heart, Users, HelpCircle, Mail, Globe,
  Coffee, Star, Award, Zap, Smartphone, Play
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  resetSupabaseConnection,
  getSupabase,
} from '../lib/supabase';

interface SettingsPanelProps {
  onBack: () => void;
  onConnectionChange: (connected: boolean) => void;
}

type SettingsTab = 'supabase' | 'about' | 'sponsor' | 'howtouse';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack, onConnectionChange }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('supabase');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: 'supabase' as const, icon: Database, label: 'Database' },
              { id: 'about' as const, icon: Info, label: 'About Us' },
              { id: 'sponsor' as const, icon: Heart, label: 'Sponsor' },
              { id: 'howtouse' as const, icon: HelpCircle, label: 'How to Use' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto p-4">
        {activeTab === 'supabase' && <SupabaseTab onBack={onBack} onConnectionChange={onConnectionChange} />}
        {activeTab === 'about' && <AboutTab />}
        {activeTab === 'sponsor' && <SponsorTab />}
        {activeTab === 'howtouse' && <HowToUseTab />}
      </div>
    </div>
  );
};

// ============================================================
// SUPABASE TAB
// ============================================================
const SupabaseTab: React.FC<{ onBack: () => void; onConnectionChange: (c: boolean) => void }> = ({ onBack, onConnectionChange }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [step, setStep] = useState<'guide' | 'form' | 'success'>('guide');

  useEffect(() => {
    const creds = getSupabaseCredentials();
    if (creds.url && !creds.url.includes('YOUR_PROJECT_ID')) {
      setUrl(creds.url);
      setKey(creds.key);
      setConnected(isSupabaseConfigured());
    }
  }, []);

  const handleTestConnection = async () => {
    if (!url || !key) {
      setTestResult('error');
      setTestMessage('Please enter both URL and Anon Key');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      saveSupabaseCredentials(url, key);
      resetSupabaseConnection();
      const client = getSupabase();
      if (!client) {
        setTestResult('error');
        setTestMessage('Invalid credentials format');
        setTesting(false);
        return;
      }
      const { error } = await client.auth.getSession();
      if (error) {
        setTestResult('error');
        setTestMessage(`Connection failed: ${error.message}`);
      } else {
        setTestResult('success');
        setTestMessage('Connected successfully! Supabase is ready.');
        setConnected(true);
        setStep('success');
        onConnectionChange(true);
      }
    } catch (err: any) {
      setTestResult('error');
      setTestMessage(`Error: ${err.message || 'Unknown error'}`);
    }
    setTesting(false);
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    resetSupabaseConnection();
    setUrl('');
    setKey('');
    setConnected(false);
    setTestResult(null);
    setStep('guide');
    onConnectionChange(false);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-xl p-4 border ${connected ? 'bg-emerald-900/30 border-emerald-700' : 'bg-amber-900/30 border-amber-700'}`}>
        <div className="flex items-center gap-3">
          {connected ? <CheckCircle className="w-8 h-8 text-emerald-400" /> : <Plug className="w-8 h-8 text-amber-400" />}
          <div>
            <h3 className="font-semibold text-lg">{connected ? 'Supabase Connected' : 'Supabase Not Connected'}</h3>
            <p className="text-sm text-gray-300">
              {connected ? 'Your games are saved to the cloud.' : 'Using local storage. Connect Supabase for cloud sync.'}
            </p>
          </div>
        </div>
      </div>

      {/* Guide Step */}
      {step === 'guide' && !connected && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-lg">How to Connect Supabase (3 Steps)</h2>
          </div>
          <div className="p-5 space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">1</div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">Create a Free Supabase Project</h3>
                <p className="text-gray-300 text-sm">Go to supabase.com → New Project → Free plan</p>
                <a href="https://supabase.com/dashboard/new" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                  <ExternalLink className="w-4 h-4" /> Open Supabase Dashboard →
                </a>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">2</div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">Run the Database Schema</h3>
                <p className="text-gray-300 text-sm">In Supabase → SQL Editor → New query → Paste content from supabase-schema.sql → Run</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">3</div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">Get Your API Keys</h3>
                <p className="text-gray-300 text-sm">Settings ⚙️ → API → Copy Project URL and anon public key</p>
              </div>
            </div>
            <button onClick={() => setStep('form')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2">
              <Plug className="w-5 h-5" /> I Have My Keys — Connect Now
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {(step === 'form' || (connected && step !== 'success')) && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg">Enter Supabase Credentials</h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project URL</label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxxx.supabase.co"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Anon Public Key</label>
              <div className="relative">
                <input type={showKey ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {testResult && (
              <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${testResult === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700' : 'bg-red-900/40 text-red-300 border border-red-700'}`}>
                {testResult === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {testMessage}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleTestConnection} disabled={testing || !url || !key}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2">
                {testing ? <><Loader2 className="w-5 h-5 animate-spin" /> Testing...</> : <><Database className="w-5 h-5" /> Test & Connect</>}
              </button>
              {connected && (
                <button onClick={handleDisconnect}
                  className="bg-red-900/50 hover:bg-red-800/50 text-red-300 font-semibold py-3 px-4 rounded-xl transition flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Disconnect
                </button>
              )}
            </div>
            {!connected && step === 'form' && (
              <button onClick={() => setStep('guide')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Setup Guide
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="bg-gray-800 rounded-xl border border-emerald-700 overflow-hidden">
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">Connected Successfully!</h2>
            <p className="text-gray-300">Your games are now saved to the cloud.</p>
            <button onClick={onBack} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition">
              Go Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            The <strong>anon key</strong> is safe for browser use. Supabase uses Row Level Security (RLS) to protect data.
            Never use the <strong>service_role</strong> key in frontend code.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ABOUT US TAB
// ============================================================
const AboutTab: React.FC = () => (
  <div className="space-y-6">
    {/* Hero */}
    <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-2xl border border-blue-700/50 p-8 text-center">
      <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
        <Award className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-black tracking-wide bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        Scorekeeper Pro
      </h2>
      <p className="text-lg text-blue-200 mt-1">Baseball Scorecard & Statistics Tracker</p>
      <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
        A professional-grade baseball scorecard application built for fans, coaches, and statisticians.
        Score games in real-time, track detailed statistics, and export beautiful PDF scorecards.
      </p>
      <div className="text-xs text-gray-500 mt-2">Version 2.0.0</div>
    </div>

    {/* Features Grid */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" /> Key Features
        </h3>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Zap, title: 'Real-Time Scoring', desc: 'Record every pitch, hit, and play as it happens' },
          { icon: Users, title: 'Full Lineup Management', desc: 'Custom or default lineups with drag-and-drop' },
          { icon: Database, title: 'Cloud Storage', desc: 'Supabase-powered persistent game history' },
          { icon: Award, title: 'Detailed Statistics', desc: 'Batting, pitching, and fielding stats auto-calculated' },
          { icon: ExternalLink, title: 'PDF Export', desc: 'Professional scorecard PDFs for sharing and printing' },
          { icon: Smartphone, title: 'Mobile Friendly', desc: 'Works on phones, tablets, and desktops' },
        ].map((f, i) => (
          <div key={i} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{f.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Tech Stack */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-400" /> Technology Stack
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'React', desc: 'UI Framework' },
            { name: 'TypeScript', desc: 'Type Safety' },
            { name: 'Tailwind CSS', desc: 'Styling' },
            { name: 'Vite', desc: 'Build Tool' },
            { name: 'Supabase', desc: 'Backend & Auth' },
            { name: 'jsPDF', desc: 'PDF Generation' },
          ].map((t, i) => (
            <div key={i} className="bg-gray-900/50 rounded-lg p-3 text-center border border-gray-700/50">
              <div className="font-bold text-sm">{t.name}</div>
              <div className="text-xs text-gray-400">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Contact / Social */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-purple-400" /> Get in Touch
      </h3>
      <div className="flex flex-wrap gap-3">
        <a href="#" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
          <Globe className="w-4 h-4" /> GitHub
        </a>
        <a href="#" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
          <Mail className="w-4 h-4" /> Twitter
        </a>
        <a href="#" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
          <Mail className="w-4 h-4" /> Email
        </a>
      </div>
    </div>
  </div>
);

// ============================================================
// SPONSOR TAB
// ============================================================
const SponsorTab: React.FC = () => (
  <div className="space-y-6">
    {/* Hero */}
    <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 rounded-2xl border border-pink-700/50 p-8 text-center">
      <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
        <Heart className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-pink-300">Support Scorekeeper Pro</h2>
      <p className="text-gray-300 mt-2 max-w-md mx-auto">
        This app is free and open source. If you find it useful, consider supporting its development!
      </p>
    </div>

    {/* Sponsor Tiers */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Coffee className="w-5 h-5 text-amber-400" /> Ways to Support
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {[
          {
            tier: '☕ Buy a Coffee',
            amount: '$5',
            desc: 'Help keep the developer caffeinated!',
            color: 'amber',
            icon: Coffee
          },
          {
            tier: '⭐ Supporter',
            amount: '$15',
            desc: 'Get your name listed as a supporter in the app.',
            color: 'blue',
            icon: Star
          },
          {
            tier: '🏆 Sponsor',
            amount: '$50',
            desc: 'Feature your logo/name in the app. Great for baseball organizations!',
            color: 'emerald',
            icon: Award
          },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              s.color === 'amber' ? 'bg-amber-600/20' : s.color === 'blue' ? 'bg-blue-600/20' : 'bg-emerald-600/20'
            }`}>
              <s.icon className={`w-6 h-6 ${s.color === 'amber' ? 'text-amber-400' : s.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">{s.tier}</h4>
                <span className="text-lg font-black text-white">{s.amount}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
              <button className="mt-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">
                Support →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Current Sponsors */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="font-semibold text-lg">Our Sponsors</h3>
      </div>
      <div className="p-5 text-center text-gray-400 text-sm">
        <p>No sponsors yet. Be the first! 🎉</p>
      </div>
    </div>

    {/* Open Source */}
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
      <div className="flex items-start gap-3">
        <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-400">
          Scorekeeper Pro is <strong className="text-white">free and open source</strong>.
          Sponsorship is entirely voluntary and helps ensure continued development and improvements.
        </p>
      </div>
    </div>
  </div>
);

// ============================================================
// HOW TO USE TAB
// ============================================================
const HowToUseTab: React.FC = () => (
  <div className="space-y-6">
    {/* Quick Start */}
    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-2xl border border-emerald-700/50 p-6">
      <h2 className="text-xl font-bold text-emerald-300 flex items-center gap-2 mb-3">
        <Play className="w-6 h-6" /> Quick Start Guide
      </h2>
      <div className="space-y-3">
        {[
          { step: '1', title: 'Create Account / Login', desc: 'Sign up with your email or login to access your saved games.' },
          { step: '2', title: 'Start a New Game', desc: 'Click "New Game" → Enter team names, choose lineup type, set game info.' },
          { step: '3', title: 'Score the Game', desc: 'Use the scoring interface to record pitches, hits, outs, and base running.' },
          { step: '4', title: 'View Stats & Export', desc: 'Click "Stats" on any game to view detailed statistics and download PDF.' },
        ].map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold flex-shrink-0">{s.step}</div>
            <div>
              <h4 className="font-semibold text-sm">{s.title}</h4>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Scoring Guide */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" /> How to Score a Game
        </h3>
      </div>
      <div className="p-5 space-y-6">
        {/* Pitch Tracking */}
        <div>
          <h4 className="font-bold text-blue-400 mb-2">⚾ Pitch Tracking</h4>
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
            <p>• <strong>Ball (B)</strong> — Tap for each ball. 4 balls = Walk (BB)</p>
            <p>• <strong>Strike (S)</strong> — Tap for each strike. 3 strikes = Strikeout (K)</p>
            <p>• <strong>Looking (Ꝁ)</strong> — Strikeout looking (batter didn't swing)</p>
            <p>• <strong>Foul</strong> — Counts as a strike, but can't be the 3rd strike</p>
            <p className="text-amber-400 text-xs">Count starts at 0-0 and resets after each at-bat</p>
          </div>
        </div>

        {/* Hit Outcomes */}
        <div>
          <h4 className="font-bold text-emerald-400 mb-2">🏏 Hit Outcomes</h4>
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
            <p>• <strong>1B</strong> — Single. Batter reaches 1st base</p>
            <p>• <strong>2B</strong> — Double. Batter reaches 2nd base</p>
            <p>• <strong>3B</strong> — Triple. Batter reaches 3rd base</p>
            <p>• <strong>HR</strong> — Home Run. Batter and all runners score</p>
            <p>• <strong>BB</strong> — Walk. Batter advances to 1st</p>
            <p>• <strong>HBP</strong> — Hit By Pitch. Batter advances to 1st</p>
          </div>
        </div>

        {/* Outs */}
        <div>
          <h4 className="font-bold text-red-400 mb-2">❌ Recording Outs</h4>
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
            <p>• <strong>GO</strong> — Ground Out. Select fielders (e.g., 6-3 = SS to 1B)</p>
            <p>• <strong>FO</strong> — Fly Out. Ball caught in the air</p>
            <p>• <strong>LO</strong> — Line Out. Line drive caught</p>
            <p>• <strong>PO</strong> — Pop Out. Pop fly caught</p>
            <p>• <strong>K</strong> — Strikeout (swinging)</p>
            <p>• <strong>DP</strong> — Double Play. Select 2 players to be out</p>
            <p className="text-amber-400 text-xs">3 outs = half-inning ends automatically</p>
          </div>
        </div>

        {/* Base Running */}
        <div>
          <h4 className="font-bold text-amber-400 mb-2">🏃 Base Running</h4>
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
            <p>• <strong>Click a base</strong> on the diamond to select a runner</p>
            <p>• <strong>SB 2nd/3rd/Home</strong> — Stolen base (selected runner advances)</p>
            <p>• <strong>❌ OUT</strong> — Tag out the selected runner</p>
            <p>• <strong>➡️ Advance</strong> — Move selected runner one base</p>
            <p>• <strong>🏠 Score</strong> — Runner from 3rd scores a run</p>
            <p className="text-amber-400 text-xs">Runner actions don't change the current batter</p>
          </div>
        </div>

        {/* Position Numbers */}
        <div>
          <h4 className="font-bold text-purple-400 mb-2">📋 Position Numbers Reference</h4>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                ['1', 'Pitcher (P)'], ['2', 'Catcher (C)'], ['3', 'First Base (1B)'],
                ['4', 'Second Base (2B)'], ['5', 'Third Base (3B)'], ['6', 'Shortstop (SS)'],
                ['7', 'Left Field (LF)'], ['8', 'Center Field (CF)'], ['9', 'Right Field (RF)'],
              ].map(([num, pos]) => (
                <div key={num} className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-600/20 rounded text-center text-purple-400 font-bold text-xs flex items-center justify-center">{num}</span>
                  <span className="text-gray-300 text-xs">{pos}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Tips */}
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" /> Pro Tips
      </h3>
      <div className="space-y-2 text-sm text-gray-300">
        <p>💡 <strong>Auto-save:</strong> Every play is saved automatically. Never lose your data.</p>
        <p>💡 <strong>Undo:</strong> Made a mistake? Use the Undo button during scoring.</p>
        <p>💡 <strong>Resume:</strong> Games in progress can be resumed from the Games list.</p>
        <p>💡 <strong>PDF Export:</strong> View stats for any game, then click "Download PDF" for a printable scorecard.</p>
        <p>💡 <strong>Duplicate:</strong> Use "Duplicate" on a game to quickly set up the same matchup again.</p>
      </div>
    </div>
  </div>
);
