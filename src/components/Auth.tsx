import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, ShieldCheck, Mail, Lock, User as UserIcon, LogOut, Loader2, Database, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { signUpWithEmail, signInWithEmail, signOutUser, resetPassword, updateUserProfile } from '../lib/db';

interface AuthProps {
  onLogin: (user: User) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, currentUser, onLogout }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'profile' | 'edit-profile'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabaseReady = isSupabaseConfigured();

  // ---- LOGIN ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabaseReady) {
      // Fallback: local storage auth
      const users = JSON.parse(localStorage.getItem('baseball_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        if (rememberMe) localStorage.setItem('baseball_token', 'local_' + user.id);
        onLogin({ id: user.id, name: user.name, email: user.email, preferences: user.preferences });
      } else {
        setError('Invalid email or password. Please register first.');
      }
      setLoading(false);
      return;
    }

    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  // ---- REGISTER ----
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!supabaseReady) {
      // Fallback: local storage registration
      const users = JSON.parse(localStorage.getItem('baseball_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        setError('User with this email already exists.');
        setLoading(false);
        return;
      }
      const newUser = {
        id: 'u-local-' + Date.now(),
        name, email, password,
        preferences: { theme: 'dark', compactMode: false },
      };
      users.push(newUser);
      localStorage.setItem('baseball_users', JSON.stringify(users));
      setSuccess('Registration successful! Please login.');
      setMode('login');
      setLoading(false);
      return;
    }

    const result = await signUpWithEmail(email, password, name);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created! You can now sign in.');
      setMode('login');
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  // ---- FORGOT PASSWORD ----
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabaseReady) {
      setSuccess('Password reset link sent to your email (simulated).');
      setLoading(false);
      setTimeout(() => setMode('login'), 2000);
      return;
    }

    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      setSuccess('Password reset link sent! Check your email inbox.');
      setTimeout(() => setMode('login'), 3000);
    } else {
      setError(result.error || 'Failed to send reset email.');
    }
  };

  // ---- UPDATE PROFILE ----
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (supabaseReady) {
      const ok = await updateUserProfile({ full_name: name });
      if (ok) {
        onLogin({ ...currentUser!, name });
        setSuccess('Profile updated!');
        setMode('profile');
      } else {
        setError('Failed to update profile.');
      }
    } else {
      // Local fallback
      onLogin({ ...currentUser!, name });
      setSuccess('Profile updated!');
      setMode('profile');
    }
    setLoading(false);
  };

  // ---- LOGOUT ----
  const handleLogout = async () => {
    if (supabaseReady) {
      await signOutUser();
    }
    localStorage.removeItem('baseball_current_user');
    localStorage.removeItem('baseball_token');
    onLogout();
  };

  // ============================================================
  // PROFILE VIEW (when currentUser exists)
  // ============================================================
  if (currentUser && mode !== 'login' && mode !== 'register' && mode !== 'forgot') {
    if (mode === 'edit-profile') {
      return (
        <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-xl p-6 text-white shadow-xl mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">Edit Profile</h2>
          {error && <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/40 text-green-400 text-sm p-3 rounded-lg mb-4">{success}</div>}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Full Name</label>
              <input
                type="text"
                required
                defaultValue={currentUser.name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Email</label>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-slate-400">
                {currentUser.email}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
              </button>
              <button type="button" onClick={() => setMode('profile')} className="px-4 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg font-bold transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }

    // Get avatar letter from email
    const avatarLetter = (currentUser.email || currentUser.name || '?')[0].toUpperCase();
    const avatarColors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-pink-600'];
    const colorIndex = (currentUser.email || '').charCodeAt(0) % avatarColors.length;
    const avatarColor = avatarColors[colorIndex];

    return (
      <div className="max-w-lg mx-auto mt-8 px-4">
        {/* Profile Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-28 relative">
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>

          {/* Avatar */}
          <div className="relative px-6 -mt-12">
            <div className={`w-24 h-24 ${avatarColor} rounded-2xl border-4 border-slate-800 flex items-center justify-center shadow-xl`}>
              <span className="text-4xl font-black text-white">{avatarLetter}</span>
            </div>
          </div>

          <div className="px-6 pt-3 pb-6">
            {/* Name & Email */}
            <h2 className="text-2xl font-black text-white">{currentUser.name}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
              <Mail className="w-4 h-4" /> {currentUser.email}
            </p>

            {success && <div className="bg-green-500/10 border border-green-500/40 text-green-400 text-sm p-3 rounded-lg mt-4">{success}</div>}

            {/* Supabase status */}
            <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${supabaseReady ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>
              {supabaseReady ? <Database className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {supabaseReady ? 'Cloud connected — data synced to Supabase' : 'Local mode — data in browser only'}
            </div>

            {/* User Details */}
            <div className="mt-5 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-400" /> Account Details
                </h3>
              </div>
              <div className="divide-y divide-slate-700/50">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-400">Full Name</span>
                  <span className="text-sm font-medium text-white">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-400">Email</span>
                  <span className="text-sm font-medium text-white">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-400">User ID</span>
                  <span className="text-xs font-mono text-slate-500 truncate max-w-[200px]">{currentUser.id}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-400">Storage</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${supabaseReady ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {supabaseReady ? '☁️ Cloud' : '💾 Local'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setName(currentUser.name); setMode('edit-profile'); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white p-3 rounded-xl font-bold transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // AUTH FORMS (login / register / forgot)
  // ============================================================
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600/10 p-4 rounded-full border border-blue-500/30 mb-3">
            <ShieldCheck className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {mode === 'login' && 'Scorecard Login'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 text-center">
            Secure, full-featured score tracking and stats management
          </p>
        </div>

        {/* Supabase status */}
        <div className={`mb-4 p-2.5 rounded-lg text-xs flex items-center gap-2 ${supabaseReady ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>
          {supabaseReady ? <Database className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {supabaseReady ? 'Cloud storage active' : 'Local mode — configure Supabase for persistent data'}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/40 text-green-400 text-sm p-3 rounded-lg mb-4">{success}</div>}

        {/* ---- LOGIN FORM ---- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="email" required placeholder="you@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="password" required placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-400 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember Me
              </label>
              <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="text-blue-400 hover:underline font-medium">
                Forgot Password?
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />} Sign In
            </button>
            <div className="text-center mt-4">
              <span className="text-slate-400 text-sm">Don't have an account? </span>
              <button type="button" onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-blue-400 hover:underline font-medium text-sm">
                Register now
              </button>
            </div>
          </form>
        )}

        {/* ---- REGISTER FORM ---- */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="text" required placeholder="John Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="email" required placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="password" required placeholder="Min 6 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="password" required placeholder="Repeat password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />} Sign Up
            </button>
            <div className="text-center mt-4">
              <span className="text-slate-400 text-sm">Already have an account? </span>
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-blue-400 hover:underline font-medium text-sm">
                Login
              </button>
            </div>
          </form>
        )}

        {/* ---- FORGOT PASSWORD FORM ---- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Reset Password Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="email" required placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />} Send Reset Link
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full text-center text-slate-400 hover:underline text-sm font-medium">
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
