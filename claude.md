# Talk2Data Frontend — Claude.md

## Project Overview

**Survey Genius (Talk2Data)** is a SaaS platform for market research. Researchers upload SPSS files, chat with data using AI, and generate reports in multiple formats.

## Tech Stack

- **Framework:** React 18.3 + TypeScript 5.8
- **Build:** Vite 5.4 (SWC plugin), port 8080
- **Styling:** Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives)
- **State:** TanStack React Query 5 (server state), React Context (language, notifications)
- **Auth:** Supabase (JWT tokens, auto-refresh)
- **Charts:** Recharts 2.15
- **Routing:** React Router 6
- **Forms:** React Hook Form + Zod
- **i18n:** Custom context with ES/EN support

## Project Structure

```
src/
├── pages/              # 14 route pages
├── components/
│   ├── ui/             # shadcn/Radix primitives
│   ├── chat/           # Chat interface (sidebar, messages, input, results)
│   ├── charts/         # VerticalBar, HorizontalBar, Donut, Line, NpsGauge, CrosstabTable
│   ├── projects/       # Project CRUD, cards, table, filters
│   ├── analysis/       # AutoDetectPanel, GroupedAnalysisResults
│   ├── summary/        # Executive summary components
│   ├── exports/        # Export generation UI
│   ├── aggfile/        # Aggfile/crosstab generator wizard
│   ├── upload/         # File upload (react-dropzone)
│   ├── settings/       # User settings UI
│   └── layout/         # AppLayout wrapper
├── hooks/              # 12 custom hooks (useProjects, useChat, useChatMessages, etc.)
├── contexts/           # LanguageContext, SummaryNotificationContext
├── types/              # database.ts, aggfile.ts, autodetect.ts, userPreferences.ts
├── i18n/               # translations.ts + language detection
├── lib/                # api.ts (ApiClient), chartColors.ts, utils.ts
├── integrations/       # Supabase client setup
└── App.tsx             # Router + auth guards
```

## Key Patterns

### API Client (`src/lib/api.ts`)
Centralized `ApiClient` class with:
- Auto-injection of Supabase JWT tokens
- `ApiError` class with `status`, `isServerError`, `isServiceUnavailable` for error classification
- Automatic retry with backoff for 5xx errors and network failures (configurable via `retries` param)
- Supports JSON requests, multipart uploads, and blob downloads

```typescript
import { api, ApiError } from '@/lib/api';
api.get<T>(endpoint)
api.post<T>(endpoint, body, headers?, retries?)
api.uploadFile<T>(endpoint, formData)
api.downloadBlob(endpoint, method?, body?)  // returns Blob for file downloads
```

Backend base URL: `VITE_API_BASE_URL` (FastAPI on Railway).

### Error Handling & Retry (`src/hooks/useChat.ts`, `src/pages/ProjectChat.tsx`)
- `useChatMessages` auto-retries queries up to 2 times on 500/network errors with UI feedback
- Exposes `queryError` (with `isServerError` / `isServiceUnavailable`), `retryState` (attempt counter), and `retryLastQuery()` for manual retry
- `ProjectChat` renders contextual error messages (server error vs service unavailable) with "Try again" button
- `ChatInput` shows retry counter and "complex query" hint during analysis

### Custom Hooks
All data fetching uses React Query inside custom hooks:
- `useProjects()` — Project CRUD
- `useChat()` — Conversation management
- `useChatMessages()` — Messages + query sending, error/retry state, caches charts/python_code/tables/variables per message
- `useExecutiveSummary()` — Summary fetch/generation
- `useProjectFiles()` — File management
- `useExports()` — Export generation/retrieval
- `useAggfileGenerator()` — Crosstab wizard
- `useAutoDetect()` — Variable auto-detection
- `useGroupedAnalysis()` — Grouped analysis results
- `useUserPreferences()` — User preferences
- `useLanguage()` — i18n hook
- `useMobile()` — Responsive breakpoint

### Chat Features (`src/components/chat/`)
- **ChatMessage**: Renders user/assistant messages with markdown. For analysis messages:
  - "Export to Excel" button → `POST /messages/{id}/export/excel` → blob download
  - Collapsible Python code viewer (dark theme, copy-to-clipboard)
  - "Analysis executed" badge
- **ChatInput**: Input with thinking indicator, retry counter, and "complex query" hint
- **ResultsPanel**: Three-tab panel (Result/Table/Variables):
  - Accepts `tables: TableData[]` and `variablesAnalyzed: VariableInfo[]` directly from `QueryResponse`
  - Falls back to extracting from `analysisPerformed` for backward compatibility
  - Variables tab shows name, label, and analysis_type per variable
- **ChatSidebar**: Conversation list navigation
- **ChatSuggestions**: Suggested starter questions

### Types (`src/types/database.ts`)
Key domain types:
```typescript
TableData        // { columns, rows, title? }
VariableInfo     // { name, label?, type?, analysis_type? }
AnalysisMetadata // { analysis_type?, variables_analyzed?, sample_size?, missing_values?, warnings?, filters_applied? }
Message          // includes python_code?, tables?, variables_analyzed?, charts?
QueryResponse    // includes python_code?, tables?, variables_analyzed?, charts?, analysis_performed?
ChartData        // { chart_type, title, chart_base64, ... }
```

### Authentication
Supabase Auth with `ProtectedRoute` / `PublicRoute` wrappers in `App.tsx`. Session stored in localStorage.

### Routing
| Route | Page |
|-------|------|
| `/auth` | Login/registration |
| `/projects` | Project listing |
| `/projects/:projectId` | Project detail |
| `/projects/:projectId/upload` | File upload |
| `/projects/:projectId/chat` | Chat interface |
| `/projects/:projectId/settings` | Project settings |
| `/projects/:projectId/summary` | Executive summary |
| `/dashboard` | Dashboard |
| `/exports` | Export management |
| `/settings` | User settings |

### Chart Types
`bar`, `horizontal_bar`, `line`, `pie`, `donut`, `nps_gauge`, `crosstab` — colors via `getChartColor(index)` from `lib/chartColors.ts`.

### Path Aliases
`@/` → `./src/` (configured in vite.config.ts and tsconfig.json)

## Backend API Endpoints (used by frontend)

```
GET/POST   /projects
GET/POST   /projects/{id}
GET/POST   /conversations
POST       /conversations/projects/{id}/query    → QueryResponse
GET        /conversations/{id}                   → Conversation with messages
POST       /messages/{id}/export/excel           → Blob (.xlsx download)
GET/POST   /analysis/projects/{id}/summary
POST       /exports
GET/DELETE /exports/{id}
```

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_API_BASE_URL
```

## Commands

```bash
npm run dev        # Dev server (port 8080)
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Conventions

- Components use PascalCase filenames
- Hooks use `use` prefix in camelCase files
- All imports use `@/` path alias
- UI components are shadcn/ui — do not modify directly, extend via composition
- Toasts via `sonner` (`toast()` function)
- Dark mode via CSS class strategy (next-themes)
- TypeScript strict mode is relaxed (no strictNullChecks)
- Spanish is the default language; English supported
- All user-facing strings go through `translations.ts` (ES/EN)
- Error handling: use `ApiError` class for typed error classification; chat queries auto-retry on 5xx
