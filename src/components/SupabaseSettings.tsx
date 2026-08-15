import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Copy,
  ExternalLink,
  Trash2,
  Plug,
  Shield,
  BookOpen,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  resetSupabaseConnection,
  getSupabase,
} from '../lib/supabase';

interface SupabaseSettingsProps {
  onBack: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export const SupabaseSettings: React.FC<SupabaseSettingsProps> = ({ onBack, onConnectionChange }) => {
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

      // Test by checking auth session
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Database className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold">Supabase Settings</h1>
          {connected && (
            <span className="ml-auto flex items-center gap-1 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Connected
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Connection Status Banner */}
        <div className={`rounded-xl p-4 border ${
          connected
            ? 'bg-emerald-900/30 border-emerald-700'
            : 'bg-amber-900/30 border-amber-700'
        }`}>
          <div className="flex items-center gap-3">
            {connected ? (
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            ) : (
              <Plug className="w-8 h-8 text-amber-400" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {connected ? 'Supabase Connected' : 'Supabase Not Connected'}
              </h3>
              <p className="text-sm text-gray-300">
                {connected
                  ? 'Your games are being saved to the cloud. Login, history, and stats are persistent.'
                  : 'Currently using local storage only. Connect Supabase to save games to the cloud and enable login.'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Setup Guide */}
        {step === 'guide' && !connected && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-750 px-5 py-4 border-b border-gray-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-lg">How to Connect Supabase (3 Steps)</h2>
            </div>

            <div className="p-5 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-lg">Create a Free Supabase Project</h3>
                  <p className="text-gray-300 text-sm">Go to supabase.com and create a new project (free plan).</p>
                  <a
                    href="https://supabase.com/dashboard/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Supabase Dashboard →
                  </a>
                  <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 space-y-1">
                    <p>• Click <strong>"New Project"</strong></p>
                    <p>• Choose <strong>Free</strong> plan</p>
                    <p>• Set a project name (e.g., <code className="bg-gray-700 px-1 rounded">baseball-scorecard</code>)</p>
                    <p>• Set a database password (save it!)</p>
                    <p>• Choose closest region → Click <strong>"Create"</strong></p>
                    <p className="text-amber-400">⏳ Wait ~2 minutes for project to initialize</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-lg">Run the Database Schema</h3>
                  <p className="text-gray-300 text-sm">Create the tables needed for your scorecard app.</p>
                  <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 space-y-1">
                    <p>• In Supabase dashboard → Click <strong>SQL Editor</strong> (left sidebar)</p>
                    <p>• Click <strong>"New query"</strong></p>
                    <p>• Download and open <code className="bg-gray-700 px-1 rounded">supabase-schema.sql</code></p>
                    <button
                      onClick={() => copyToClipboard(`-- Download supabase-schema.sql from your project files
-- Copy ALL content → Paste in SQL Editor → Click "Run"`)}
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <Copy className="w-3 h-3" />
                      Copy instructions
                    </button>
                    <p>• Copy ALL content → Paste in SQL Editor → Click <strong>"Run"</strong></p>
                    <p className="text-emerald-400">✅ You should see "Success. No rows returned"</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-lg">Get Your API Keys</h3>
                  <p className="text-gray-300 text-sm">Find your Project URL and Anon Key.</p>
                  <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 space-y-1">
                    <p>• Go to <strong>Project Settings</strong> ⚙️ (bottom left)</p>
                    <p>• Click <strong>"API"</strong> in the left menu</p>
                    <p>• Copy these two values:</p>
                    <div className="ml-4 space-y-1">
                      <p><strong className="text-emerald-400">Project URL:</strong></p>
                      <p className="font-mono text-xs bg-gray-800 p-2 rounded">https://xxxxxxxxxxxxx.supabase.co</p>
                      <p><strong className="text-emerald-400">anon / public Key:</strong></p>
                      <p className="font-mono text-xs bg-gray-800 p-2 rounded break-all">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
                    </div>
                    <p className="text-amber-400 mt-2">⚠️ Use the <strong>anon public</strong> key (NOT the service_role key!)</p>
                  </div>
                </div>
              </div>

              {/* Ready to connect */}
              <button
                onClick={() => setStep('form')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plug className="w-5 h-5" />
                I Have My Keys — Connect Now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter Credentials Form */}
        {(step === 'form' || (connected && step !== 'success')) && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-750 px-5 py-4 border-b border-gray-700 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-lg">Enter Supabase Credentials</h2>
            </div>

            <div className="p-5 space-y-5">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xxxxxxxxxxxxx.supabase.co"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Found in: Settings ⚙️ → API → Project URL
                </p>
              </div>

              {/* Anon Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Anon Public Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Found in: Settings ⚙️ → API → anon public key
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${
                  testResult === 'success'
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
                    : 'bg-red-900/40 text-red-300 border border-red-700'
                }`}>
                  {testResult === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  {testMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !url || !key}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      Test & Connect
                    </>
                  )}
                </button>

                {connected && (
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-900/50 hover:bg-red-800/50 text-red-300 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Disconnect
                  </button>
                )}
              </div>

              {/* Back to Guide */}
              {!connected && step === 'form' && (
                <button
                  onClick={() => setStep('guide')}
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Setup Guide
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="bg-gray-800 rounded-xl border border-emerald-700 overflow-hidden">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400">Connected Successfully!</h2>
              <p className="text-gray-300 max-w-md mx-auto">
                Your Baseball Scorecard is now connected to Supabase. All games, stats, and user accounts are saved to the cloud.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 text-sm text-left max-w-md mx-auto space-y-2">
                <p className="text-gray-300">✅ <strong>Authentication</strong> — Sign up / Login with email & password</p>
                <p className="text-gray-300">✅ <strong>Cloud Save</strong> — Games auto-save to Supabase</p>
                <p className="text-gray-300">✅ <strong>Game History</strong> — Access your games from any device</p>
                <p className="text-gray-300">✅ <strong>Password Reset</strong> — Real email-based reset</p>
              </div>
              <button
                onClick={onBack}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="font-medium text-gray-300 mb-1">Security Note</p>
              <p>
                The <strong>anon key</strong> is safe to use in the browser. Supabase uses Row Level Security (RLS)
                to ensure users can only access their own data. Never use the <strong>service_role</strong> key in frontend code.
              </p>
              <p className="mt-2">
                Credentials are stored in your browser's localStorage. They are not sent to any third-party server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
