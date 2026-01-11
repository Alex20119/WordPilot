# Word Pilot

Research database and writing assistant app for completing a sandwich history book.

## Tech Stack

- **React 18** + **TypeScript** with **Vite**
- **Supabase** (database, authentication, file storage)
- **Tailwind CSS** for styling
- **React Router** for navigation
- **docx** library for Word document export
- Deployed on **Vercel**

## Project Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** to get your project URL and anon key
3. Copy `env.example` to `.env` and fill in your Supabase credentials:

```bash
cp env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration to create the `sandwiches` table

### 4. Set Up Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Create your user account:
   - Go to **Authentication** → **Users**
   - Click **Add User** → **Create new user**
   - Enter your email and password
   - Save the credentials for login

### 5. Migrate Your Sandwich Data

You'll need to migrate your existing sandwich data from the `.tsx` file to Supabase. A migration script will be created in the next step. For now, you can:

1. Export your data from the existing `.tsx` file
2. Use the Supabase dashboard SQL editor to insert data, or
3. Wait for the data migration utility component (coming next)

### 6. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Project Structure

```
word-pilot/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── lib/             # Utilities and Supabase client
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component with routing
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── supabase/
│   └── migrations/      # Database migration scripts
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Features (V1 Roadmap)

- [x] Supabase authentication - secure login page
- [x] Database setup - schema and migrations
- [ ] Browse interface - view sandwiches organized by chapters
- [ ] Search functionality - find sandwiches by name, ingredients, origin
- [ ] Export to .docx - download individual sandwiches or full chapters
- [ ] Progress tracking - mark sandwiches as: not started, drafted, revised, final
- [ ] Personal notes - add writing notes/ideas to each sandwich

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Database Schema

### `sandwiches` table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| chapter | INTEGER | Chapter number (1-8) |
| name | TEXT | Sandwich name |
| origin | TEXT | Origin story and sources |
| ingredients | TEXT | List of ingredients |
| significance | TEXT | Historical/cultural significance |
| fun_facts | TEXT | Fun facts about the sandwich |
| researched | BOOLEAN | Research completion status |
| writing_status | TEXT | Writing progress: 'not_started', 'drafted', 'revised', 'final' |
| personal_notes | TEXT | Personal writing notes (nullable) |
| created_at | TIMESTAMP | Auto-generated creation timestamp |
| updated_at | TIMESTAMP | Auto-updated modification timestamp |

## Next Steps

1. Create data migration utility to import from existing `.tsx` file
2. Build browse interface with chapter organization
3. Implement search functionality
4. Add export to Word document feature
5. Build progress tracking UI
6. Add personal notes editing interface