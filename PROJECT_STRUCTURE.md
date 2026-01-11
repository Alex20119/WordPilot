# Project Structure

```
word-pilot/
├── src/
│   ├── components/
│   │   ├── Login.tsx              # Login page component
│   │   └── ProtectedRoute.tsx     # Route guard for authenticated pages
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context and hooks
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client initialization
│   │   └── sandwiches.ts          # Database operations for sandwiches
│   ├── pages/
│   │   └── Dashboard.tsx          # Main dashboard (placeholder for now)
│   ├── types/
│   │   └── database.types.ts      # TypeScript types for database entities
│   ├── App.tsx                    # Main app component with routing
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles with Tailwind
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Database schema migration
├── .env                           # Environment variables (create from env.example)
├── .eslintrc.cjs                  # ESLint configuration
├── .gitignore                     # Git ignore rules
├── .vercelignore                  # Vercel deployment ignore rules
├── env.example                    # Example environment variables
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS configuration
├── README.md                      # Main project documentation
├── SETUP.md                       # Detailed setup instructions
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # TypeScript config for Node tools
├── vercel.json                    # Vercel deployment configuration
└── vite.config.ts                 # Vite build configuration

```

## Key Files Explained

### Configuration Files
- **vite.config.ts**: Vite build tool configuration with path aliases (`@/` → `src/`)
- **tsconfig.json**: TypeScript compiler options and path mappings
- **tailwind.config.js**: Tailwind CSS theme customization
- **vercel.json**: Vercel deployment settings (SPA routing)

### Source Code
- **src/main.tsx**: React app entry point
- **src/App.tsx**: Main app component with React Router setup
- **src/lib/supabase.ts**: Supabase client singleton
- **src/lib/sandwiches.ts**: Database query functions for sandwiches
- **src/contexts/AuthContext.tsx**: Global authentication state management
- **src/types/database.types.ts**: TypeScript interfaces matching database schema

### Database
- **supabase/migrations/001_initial_schema.sql**: Complete database schema with:
  - `sandwiches` table definition
  - Indexes for performance
  - Row Level Security (RLS) policies
  - Automatic timestamp triggers

## Path Aliases

The project uses path aliases for cleaner imports:
- `@/` → `src/`
- Example: `import { supabase } from '@/lib/supabase'`

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public API key

## Next Features to Build

1. **Browse Interface** (`src/pages/Browse.tsx`)
   - Display sandwiches organized by chapters
   - Expand/collapse chapter sections
   - Filter by writing status

2. **Search Component** (`src/components/Search.tsx`)
   - Search bar with real-time results
   - Filter by name, ingredients, origin

3. **Sandwich Detail View** (`src/pages/SandwichDetail.tsx`)
   - Full sandwich information display
   - Edit personal notes
   - Update writing status
   - Export to Word document

4. **Export Utility** (`src/lib/export.ts`)
   - Generate Word documents using `docx` library
   - Export individual sandwiches or full chapters
   - Professional formatting for writing

5. **Data Migration Utility** (`src/components/DataMigration.tsx`)
   - Import sandwich data from existing `.tsx` file
   - Bulk upload with validation