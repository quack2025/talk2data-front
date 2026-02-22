# Building & Deploying — Talk2Data Frontend

## Local Development

### Prerequisites
- Node.js 18+ (LTS)
- npm

### Setup
```bash
cd C:\Users\jorge\proyectos_python\talk2data-front

# Install dependencies
npm install

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

### Environment Variables

Create `.env.local` for local overrides (gitignored):
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xithhxnnbvxkzxdmdpnn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

The committed `.env` file contains production values — **never remove it from git** (Lovable requires it).

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | FastAPI backend URL (default: `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous/publishable key |

---

## Build

```bash
# Production build
npm run build
# Output: dist/

# Development build (with source maps)
npm run build:dev

# Preview production build locally
npm run preview

# Lint
npm run lint
```

### Build Notes
- Vite bundles with SWC (via `@vitejs/plugin-react-swc`)
- Path alias `@/` → `./src/` configured in both `vite.config.ts` and `tsconfig.json`
- Tailwind CSS processes via PostCSS
- `lovable-tagger` dev dependency adds Lovable-specific build metadata

---

## Deployment on Lovable

### How It Works
1. Push code to `main` branch
2. Lovable detects the push and triggers a build
3. Lovable runs `npm run build` (reads `VITE_*` from committed `.env`)
4. Built `dist/` is deployed to CDN
5. Supabase migrations in `supabase/migrations/` are auto-applied

### Critical Lovable Gotchas

**`.env` file MUST stay in git:**
- Lovable reads `VITE_*` variables from the committed `.env` file
- It does NOT reliably inject env vars set in its dashboard into the Vite build
- Removing `.env` from git causes `supabaseUrl is required` crash at runtime
- Only public keys go in `.env` (anon keys, URLs) — safe to commit

**Supabase migrations auto-deploy:**
- Files in `supabase/migrations/` are applied when pushed to `main`
- Use `gen_random_uuid()` not `uuid_generate_v4()` (PG17 compatibility)
- No CLI needed — just push the migration SQL file

**Edge functions:**
- Files in `supabase/functions/<name>/index.ts` auto-deploy on push
- No Supabase CLI needed

---

## Supabase Configuration

### Project
- **Supabase project ID:** `xithhxnnbvxkzxdmdpnn` (Lovable-managed)
- Auth: Email/password with JWT (ES256)
- Storage: SPSS file storage (managed by backend)

### Database Migrations

Migrations live in the frontend repo because Lovable auto-deploys them:
```
supabase/migrations/
├── 20260219180000_add_segments_table.sql
├── 20260222_project_folders.sql          # Folder system (user_id scoped, gen_random_uuid())
└── ...
```

Lovable auto-deploys migrations when pushed to `main` -- no Supabase CLI needed. Just add the `.sql` file and push.

Create new migrations:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ...
);
CREATE INDEX ix_segments_project_id ON segments(project_id);
```

---

## Project Dependencies

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3 | UI framework |
| typescript | 5.8 | Type safety |
| vite | 5.4 | Build tool |
| tailwindcss | 3.4 | Utility CSS |
| @tanstack/react-query | 5.83 | Server state management |
| @supabase/supabase-js | 2.89 | Supabase client |
| recharts | 2.15 | Chart rendering |
| react-router-dom | 6.30 | Client-side routing |
| react-hook-form | 7.61 | Form management |
| zod | 3.25 | Schema validation |
| sonner | 1.7 | Toast notifications |
| lucide-react | 0.462 | Icons |
| @dnd-kit/core | -- | Drag-and-drop (folder system) |
| @dnd-kit/utilities | -- | CSS transform helpers for draggable items |
| framer-motion | 12.34 | Animations |

### shadcn/ui
UI primitives from Radix UI, styled with Tailwind. Located in `src/components/ui/`. Do not modify these directly — extend via composition.

---

## Branching & Workflow

- **`main`** — Production branch, auto-deploys to Lovable
- Push directly to `main` for deployment
- Backend changes go to the backend repo's `claude/survey-ai-chat-platform-6TzlE` branch

### Deployment Checklist
1. `npm run build` — verify no TypeScript/build errors
2. `git add` + `git commit` + `git push origin main`
3. Lovable auto-deploys within minutes
4. Verify at `talk2data.survey-genius.ai`
