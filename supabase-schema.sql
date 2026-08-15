-- ============================================================
-- BASEBALL SCORECARD - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Instructions:
-- 1. Go to https://supabase.com and create a free project
-- 2. Go to SQL Editor (left sidebar)
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 5. Go to Project Settings > API to get your URL and anon key
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{"theme": "dark", "compactMode": false}'::jsonb
);

-- ============================================================
-- 2. GAMES TABLE (stores complete game state)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,                    -- e.g., 'g-1700000000000'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Queryable fields (extracted for easy filtering)
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_team_color TEXT DEFAULT '#dc2626',
  away_team_color TEXT DEFAULT '#2563eb',
  game_date TEXT NOT NULL,
  location TEXT DEFAULT '',
  league_name TEXT DEFAULT '',
  umpire_name TEXT DEFAULT '',
  status TEXT DEFAULT 'in_progress',      -- 'in_progress' or 'completed'
  innings_count INTEGER DEFAULT 9,
  current_inning INTEGER DEFAULT 1,
  current_half TEXT DEFAULT 'top',        -- 'top' or 'bottom'
  outs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  strikes INTEGER DEFAULT 0,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  
  -- Full game data as JSON (teams, players, plays, runners)
  game_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_date ON public.games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_user_status ON public.games(user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) - Critical for data isolation
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Games: Users can only access their own games
CREATE POLICY "Users can view own games"
  ON public.games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
  ON public.games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
  ON public.games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
  ON public.games FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferences)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    '{"theme": "dark", "compactMode": false}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Trigger: automatically create profile when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. AUTO-UPDATE updated_at TIMESTAMP
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SCHEMA COMPLETE!
-- ============================================================
-- Next steps:
-- 1. Go to Project Settings > API
-- 2. Copy the "Project URL" and "anon/public" key
-- 3. Paste them into your app's Supabase client configuration
-- ============================================================
