import { supabase, isSupabaseConfigured } from './supabase';
import { Game, User } from '../types';

// ============================================================
// GAME DATABASE OPERATIONS (Supabase)
// ============================================================

/**
 * Save or update a game in Supabase.
 * Stores queryable fields as columns + full game state as JSONB.
 */
export async function saveGameToDb(game: Game): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('games')
    .upsert({
      id: game.id,
      user_id: user.id,
      home_team_name: game.homeTeam.name,
      away_team_name: game.awayTeam.name,
      home_team_color: game.homeTeam.color,
      away_team_color: game.awayTeam.color,
      game_date: game.date,
      location: game.location || '',
      league_name: '',
      umpire_name: '',
      status: game.status,
      innings_count: game.inningsCount,
      current_inning: game.currentInning,
      current_half: game.currentHalf,
      outs: game.outs,
      balls: game.balls,
      strikes: game.strikes,
      home_score: game.homeScore,
      away_score: game.awayScore,
      notes: game.notes || '',
      game_data: JSON.parse(JSON.stringify(game)), // full game state
    });

  if (error) {
    console.error('Error saving game:', error);
    return false;
  }
  return true;
}

/**
 * Load all games for the current user from Supabase.
 */
export async function loadGamesFromDb(): Promise<Game[]> {
  if (!isSupabaseConfigured()) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('games')
    .select('game_data, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error loading games:', error);
    return [];
  }

  return (data || [])
    .map(row => row.game_data as Game)
    .filter(g => g && g.id);
}

/**
 * Delete a game from Supabase.
 */
export async function deleteGameFromDb(gameId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId);

  if (error) {
    console.error('Error deleting game:', error);
    return false;
  }
  return true;
}

// ============================================================
// USER PROFILE OPERATIONS
// ============================================================

/**
 * Get the current user's profile from Supabase.
 */
export async function getUserProfile(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, preferences')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error loading profile:', error);
    return null;
  }

  return {
    id: user.id,
    name: profile?.full_name || user.email || 'User',
    email: user.email || '',
    preferences: profile?.preferences || { theme: 'dark', compactMode: false },
  };
}

/**
 * Update the current user's profile.
 */
export async function updateUserProfile(
  updates: { full_name?: string; preferences?: Record<string, unknown> }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }
  return true;
}

// ============================================================
// AUTH OPERATIONS (wrappers around Supabase Auth)
// ============================================================

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured. Please set your credentials in src/lib/supabase.ts' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    return {
      success: true,
      user: {
        id: data.user.id,
        name: fullName,
        email: data.user.email || email,
        preferences: { theme: 'dark', compactMode: false },
      },
    };
  }

  return { success: false, error: 'No user returned after sign up.' };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured. Please set your credentials in src/lib/supabase.ts' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    // Try to get profile name
    const profile = await getUserProfile();
    return {
      success: true,
      user: {
        id: data.user.id,
        name: profile?.name || data.user.email || 'User',
        email: data.user.email || email,
        preferences: profile?.preferences || { theme: 'dark', compactMode: false },
      },
    };
  }

  return { success: false, error: 'No user returned after sign in.' };
}

export async function signOutUser(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getCurrentSession(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  return getUserProfile();
}
