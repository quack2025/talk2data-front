# CLAUDE.md – Talk2Data Frontend

> Internal development notes for AI-assisted sessions.
> See also: [agent_docs/architecture.md](agent_docs/architecture.md) | [agent_docs/building_and_deploying.md](agent_docs/building_and_deploying.md) | [agent_docs/code_conventions.md](agent_docs/code_conventions.md)

---

## Project: Talk2Data (Survey Genius Pro) — Frontend

**Frontend:** https://github.com/quack2025/talk2data-front (React on Lovable)
**Backend:** https://github.com/quack2025/talk2data (FastAPI on Railway)
**Stack:** React 18 + TypeScript 5.8 + Vite 5.4 + Tailwind CSS 3.4 + shadcn/ui + Recharts
**Deployment:** Lovable (auto-deploy from `main` branch)
**Domain:** talk2data.survey-genius.ai

---

## Quick Reference

### Commands
```bash
npm run dev        # Local dev server (port 5173)
npm run build      # Production build (vite build)
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Environment
```
VITE_API_BASE_URL              # FastAPI backend URL (default: http://localhost:8000)
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anonymous key
```

> **IMPORTANT:** `.env` with `VITE_*` vars MUST stay in git — Lovable reads them from the committed file. Use `.env.local` (gitignored) for local-only overrides.

---

## Project Structure

```
src/
├── pages/                  # Route-level components (21 pages)
│   ├── ProjectChat.tsx     # AI chat interface
│   ├── ProjectExplore.tsx  # Interactive explore mode
│   ├── ProjectDetail.tsx   # Project overview (data prep, groups, waves, segments)
│   ├── ProjectUpload.tsx   # SPSS file upload
│   ├── Dashboard.tsx       # Main dashboard
│   └── ...
├── components/
│   ├── ui/                 # shadcn/ui primitives (50+ components)
│   ├── charts/             # Recharts wrappers (bar, crosstab, compare means, NPS, donut, line)
│   ├── chat/               # Chat UI (messages, input, sidebar, results, refine actions)
│   ├── aggfile/            # Generate Tables wizard (4 steps)
│   ├── segments/           # Segment CRUD + selector
│   ├── data-prep/          # Data prep rules manager
│   ├── grouping/           # Variable groups (auto-detect + manual)
│   ├── waves/              # Wave management + comparison
│   ├── help/               # Help chat dialog
│   ├── layout/             # AppHeader, navigation
│   └── ...
├── hooks/                  # Custom hooks (23 hooks)
│   ├── useChat.ts          # Chat with retry, cache, refine
│   ├── useExplore.ts       # Explore mode analysis
│   ├── useSegments.ts      # Segment CRUD + preview
│   ├── useDataPrep.ts      # Data prep rules CRUD
│   ├── useAggfileGenerator.ts  # Generate Tables wizard state
│   └── ...
├── types/                  # TypeScript type definitions
│   ├── explore.ts          # Explore types (ExploreRunRequest, ExploreVariable, etc.)
│   ├── segments.ts         # Segment types + OPERATOR_LABELS
│   ├── dataPrep.ts         # Data prep rule types
│   └── ...
├── lib/
│   ├── api.ts              # ApiClient class (auth, retry, error handling, file upload/download)
│   ├── utils.ts            # cn() utility (clsx + tailwind-merge)
│   ├── chartColors.ts      # Chart color palette
│   └── downloadFile.ts     # File download helper
├── i18n/
│   ├── translations.ts     # All UI strings (ES + EN, ~500 keys)
│   └── LanguageContext.tsx  # LanguageProvider + useLanguage() hook
└── integrations/
    └── supabase/           # Supabase client + auth helpers
```

---

## Key Patterns

### API Communication
All backend calls go through `ApiClient` in `src/lib/api.ts`:
- Automatic Supabase JWT token injection
- Retry on 5xx with exponential backoff
- `ApiError` class with `isServerError`, `isServiceUnavailable`
- Convenience methods: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- File upload: `api.uploadFile()`, download: `api.downloadBlob()`

### Internationalization
- All UI strings in `src/i18n/translations.ts` with `es` and `en` objects
- Access via `const { t, language } = useLanguage()`
- Pattern: `t.sectionName?.key ?? 'Fallback English text'`
- Always provide fallback after `??` for safety

### State Management
- **Server state:** React Query (`@tanstack/react-query`) for backend data
- **Local state:** React `useState` + custom hooks
- **Auth state:** Supabase client session
- No global store (Redux/Zustand) — hooks provide all needed state

### Component Patterns
- shadcn/ui for all primitives (Dialog, Select, Button, Card, etc.)
- Lucide React for icons
- Sonner for toast notifications (`toast.success()`, `toast.error()`)
- Feature components follow: Manager (list) → FormDialog (create/edit) → Selector (compact picker)

---

## Feature Map

| Feature | Page | Components | Hook |
|---------|------|------------|------|
| AI Chat | ProjectChat | ChatMessage, ResultsPanel, RefineActions, ChatInput | useChat |
| Explore Mode | ProjectExplore | AnalysisPanel, SegmentSelector | useExplore |
| Generate Tables | (modal) | BannerVariablesStep, AnalysisVariablesStep, ConfigureStep, PreviewStep | useAggfileGenerator |
| Segments | ProjectDetail | SegmentManager, SegmentFormDialog, SegmentSelector | useSegments |
| Data Prep | ProjectDetail | DataPrepManager, RuleFormDialog | useDataPrep |
| Variable Groups | ProjectDetail | VariableGroupsManager, AutoDetectPanel, ManualGrouper | useVariableGroups |
| Waves | ProjectDetail | WaveManager, WaveComparisonChart | useWaves |
| Help Chat | (floating) | HelpChatDialog | useHelpChat |
| Charts | (embedded) | ChartWithTable, CrosstabTable, CompareMeansChart, NpsGauge | — |

---

## Routing

| Route | Page |
|-------|------|
| `/auth` | Login/registration |
| `/projects` | Project listing |
| `/projects/:projectId` | Project detail (groups, data prep, waves, segments) |
| `/projects/:projectId/upload` | File upload |
| `/projects/:projectId/chat` | AI chat interface |
| `/projects/:projectId/explore` | Interactive explore mode |
| `/projects/:projectId/settings` | Project settings |
| `/projects/:projectId/summary` | Executive summary |
| `/dashboard` | Main dashboard |
| `/exports` | Export management |
| `/settings` | User settings |
| `/teams` | Team management |
| `/api-keys` | API key management |

---

## Supabase Migrations

Database migrations live in `supabase/migrations/` and auto-deploy when pushed to `main`:
```
supabase/migrations/
├── 20260219180000_add_segments_table.sql
└── ...
```

Use `gen_random_uuid()` (not `uuid_generate_v4()`) for Supabase PG17 compatibility.
