# Word Pilot - Setup Guide

## Quick Start

Follow these steps to get Word Pilot up and running:

### Step 1: Install Dependencies

```bash
cd word-pilot
npm install
```

### Step 2: Set Up Supabase Project

1. **Create Supabase Account & Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Choose an organization, name your project (e.g., "word-pilot")
   - Set a database password (save this!)
   - Choose a region close to you
   - Click "Create new project"
   - Wait 2-3 minutes for the project to initialize

2. **Get Your API Credentials**
   - In your Supabase dashboard, go to **Settings** (gear icon) → **API**
   - Copy the following:
     - **Project URL** (under "Project URL")
     - **anon/public key** (under "Project API keys", use the `anon` `public` key)

3. **Create Environment File**
   - In the `word-pilot` directory, copy `env.example` to `.env`:
     ```bash
     cp env.example .env
     ```
   - Open `.env` and paste your credentials:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

### Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
6. You should see "Success. No rows returned" - this is correct!

### Step 4: Set Up Authentication

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter:
   - Email: your email address
   - Password: choose a secure password
   - Auto Confirm User: **Enable** this (since you're the only user)
4. Click **Create user**
5. Save these credentials - you'll use them to log in!

**Note:** For production, you may want to enable email confirmation. For now, with auto-confirm enabled, you can log in immediately.

### Step 5: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The app should open in your browser at `http://localhost:3000`

3. You should be redirected to the login page

4. Log in with the credentials you created in Step 4

5. You should see the Dashboard page

### Step 6: Migrate Your Sandwich Data

You'll need to migrate your existing sandwich data from your `.tsx` file. Here's how:

#### Option A: Using the Data Migration Component (Coming Soon)
A UI component will be added to help you import data.

#### Option B: Manual Import via SQL
1. Export your sandwich data from the `.tsx` file
2. Format it as SQL INSERT statements following this pattern:
   ```sql
   INSERT INTO sandwiches (chapter, name, origin, ingredients, significance, fun_facts, researched, writing_status)
   VALUES 
     (1, 'Sandwich Name', 'Origin text...', 'Ingredients...', 'Significance...', 'Fun facts...', true, 'not_started'),
     (1, 'Another Sandwich', '...', '...', '...', '...', true, 'not_started');
   ```
3. Run in Supabase SQL Editor

#### Option C: Using the API Helper (Recommended)
Create a temporary migration script or use the browser console:

```javascript
// In browser console on the logged-in dashboard:
import { bulkInsertSandwiches } from './lib/sandwiches'

const sandwiches = [
  {
    chapter: 1,
    name: "Sandwich Name",
    origin: "Origin text...",
    ingredients: "Ingredients...",
    significance: "Significance...",
    fun_facts: "Fun facts...",
    researched: true,
    writing_status: 'not_started'
  },
  // ... more sandwiches
]

await bulkInsertSandwiches(sandwiches)
```

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure you created the `.env` file (not just `env.example`)
- Verify the variable names start with `VITE_`
- Restart the dev server after creating/editing `.env`

### "Invalid API key" error
- Double-check you copied the `anon` `public` key (not the `service_role` key)
- Make sure there are no extra spaces in your `.env` file

### Can't log in / "Invalid login credentials"
- Verify the user was created in Supabase dashboard
- Check that "Auto Confirm User" was enabled when creating the user
- Try resetting the password in Supabase dashboard

### Database errors
- Verify the migration ran successfully (check for errors in SQL Editor)
- Ensure RLS policies are set up (they're included in the migration)
- Check that you're logged in (RLS requires authentication)

## Next Steps

Once you have the basic setup working:
1. Migrate your sandwich data
2. Build the browse interface
3. Add search functionality
4. Implement Word document export
5. Add progress tracking UI

## Deployment to Vercel

When ready to deploy:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The `.env` file is gitignored, so your credentials won't be committed.