# ⚾ Baseball Scorecard — Supabase Connection Guide

## Quick Overview
This app works **out of the box** with local storage. To enable **cloud saving, login/signup, and persistent game history**, connect a free Supabase project.

---

## 🟢 METHOD 1: In-App Settings (Easiest — No Code Editing)

### Step 1: Create a Free Supabase Project
1. Go to **[https://supabase.com](https://supabase.com)**
2. Click **"Start your project"** → Sign up (GitHub, Google, or Email)
3. Click **"New Project"**
4. Choose the **Free** plan
5. Set a project name (e.g., `baseball-scorecard`)
6. Set a **database password** (save it!)
7. Choose the closest **region** to you
8. Click **"Create new project"**
9. ⏳ **Wait ~2 minutes** for the project to initialize

### Step 2: Run the Database Schema
1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Download the file `supabase-schema.sql` from this project
4. **Copy ALL the content** and paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see **"Success. No rows returned"** ✅

### Step 3: Get Your API Keys
1. Go to **Project Settings** ⚙️ (gear icon at bottom left)
2. Click **"API"** in the left menu
3. You'll see:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon / public Key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Copy both values**

### Step 4: Connect in the App
1. Open the Baseball Scorecard app
2. Click the **⚙️ Settings** button (top right, next to Profile)
3. Paste your **Project URL** in the first field
4. Paste your **Anon Key** in the second field
5. Click **"Test & Connect"**
6. If you see ✅ "Connected successfully!" — you're done!

---

## 🟡 METHOD 2: Hardcode Credentials (For Production Builds)

If you want to bake the credentials into the build:

1. Open `src/lib/supabase.ts`
2. Replace these lines:
   ```typescript
   const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE';
   ```
3. With your real values:
   ```typescript
   const DEFAULT_SUPABASE_URL = 'https://abc123xyz.supabase.co';
   const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...';
   ```
4. Run `npm run build` to rebuild

---

## 📋 Database Schema (supabase-schema.sql)

The schema creates these tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (name, preferences) linked to auth.users |
| `games` | Complete game data stored as JSONB + queryable columns |

**Row Level Security (RLS)** is enabled so users can only see their own games.

---

## 🔐 Security Notes

- The **anon key** is safe for browser use — Supabase RLS protects data
- **Never** use the `service_role` key in frontend code
- Credentials stored in localStorage are only accessible to your browser
- Each user can only access their own games (enforced by Supabase RLS)

---

## ❓ Troubleshooting

### "Connection failed" error
- Make sure you copied the **Project URL** (not the REST URL)
- Make sure you copied the **anon public** key (not service_role)
- Wait 2+ minutes after creating the project for it to fully initialize
- Check that you ran the SQL schema successfully

### "Invalid credentials format"
- The URL should look like: `https://xxxxx.supabase.co`
- The key should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### Games not loading after connecting
- Try logging out and logging back in
- Check that the SQL schema was run successfully in Supabase
- Open browser console (F12) to see any error messages

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Database schema — run in Supabase SQL Editor |
| `src/lib/supabase.ts` | Supabase client — stores credentials |
| `src/lib/db.ts` | Database CRUD operations |
| `src/components/SupabaseSettings.tsx` | In-app settings panel |
| `src/components/Auth.tsx` | Login/Signup with Supabase Auth |
| `src/App.tsx` | Main app with cloud/local mode |
