# CLAUDE.md – Talk2Data Frontend

> Internal development notes for AI-assisted sessions.
> See also: [agent_docs/architecture.md](agent_docs/architecture.md) | [agent_docs/building_and_deploying.md](agent_docs/building_and_deploying.md) | [agent_docs/code_conventions.md](agent_docs/code_conventions.md) | [agent_docs/cross_product_context.md](agent_docs/cross_product_context.md)

---

## Project: Talk2Data (Survey Genius Pro) — Genius Labs AI Suite

Part of the **Genius Labs AI Suite** (4 products sharing a unified design system). See [cross_product_context.md](agent_docs/cross_product_context.md) for suite-wide details.

**Frontend:** https://github.com/quack2025/talk2data-front (React on Lovable)
**Backend:** https://github.com/quack2025/talk2data (FastAPI on Railway)
**Stack:** React 18 + TypeScript 5.8 + Vite 5.4 + Tailwind CSS 3.4 + shadcn/ui + Recharts + @dnd-kit
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
│   ├── folders/            # Folder system (FolderSection, DroppableFolderItem) — drag-and-drop
│   ├── dashboard/          # DraggableProjectCard — @dnd-kit useDraggable
│   ├── segments/           # Segment CRUD + selector
│   ├── data-prep/          # Data prep rules manager
│   ├── grouping/           # Variable groups (auto-detect + manual)
│   ├── waves/              # Wave management + comparison
│   ├── help/               # Help chat dialog
│   ├── merge/              # Merge wizard dialog
│   ├── segmentation/       # Segmentation clustering wizard
│   ├── share/              # Share link dialog + management
│   ├── reports/            # Report generator dialog + progress
│   ├── teams/              # Team management (TeamsManager, TeamCard, InviteMemberDialog)
│   ├── dataprep/           # Data prep AI input + rule management
│   ├── layout/             # AppSidebar (Core Zone + Folders + Account Zone), AppHeader
│   └── ...
├── hooks/                  # Custom hooks (28+ hooks)
│   ├── useChat.ts          # Chat with retry, cache, refine
│   ├── useExplore.ts       # Explore mode analysis
│   ├── useSegments.ts      # Segment CRUD + preview
│   ├── useDataPrep.ts      # Data prep rules CRUD
│   ├── useAggfileGenerator.ts  # Generate Tables wizard state
│   ├── useReportGenerator.ts # Report generation with progress polling
│   ├── useTeams.ts           # Team CRUD + useAssignProjectToTeam
│   ├── useShareLinks.ts      # Share link CRUD
│   └── ...
├── types/                  # TypeScript type definitions
│   ├── explore.ts          # Explore types (ExploreRunRequest, ExploreVariable, etc.)
│   ├── segments.ts         # Segment types + OPERATOR_LABELS
│   ├── dataPrep.ts         # Data prep rule types
│   ├── database.ts         # Database types (Project interface with folder_id)
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
- Sections: `sidebar` (sidebar.usage, sidebar.billing), `folders` (folder CRUD labels), and feature-specific sections

### Sidebar Layout (AppSidebar.tsx)
The sidebar is collapsible (w-64 expanded, w-16 collapsed) and has three zones:
- **Core Zone** (`coreItems`): Projects, Upload, Chat, Export, Teams, API Keys
- **Folder Section**: Drag-and-drop project folders with 8-color picker, collapsed mode shows colored dots + tooltips
- **Account Zone** (`accountItems`): Usage (/settings?tab=usage), Billing (/settings?tab=billing), Settings

The sidebar is wrapped in a `DndContext` (from @dnd-kit/core) to support dragging projects into folders. Folder state is derived from URL `?folder=` search params.

### Design System
Unified HSL-based CSS variables across all Genius Labs products. Primary color: `#1E40AF` (blue-800). Icons: Lucide React (includes BarChart3 for Usage, CreditCard for Billing).

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
| Folders | AppSidebar | FolderSection, DroppableFolderItem, DraggableProjectCard | -- |
| AI Chat | ProjectChat | ChatMessage, ResultsPanel, RefineActions, ChatInput | useChat |
| Explore Mode | ProjectExplore | AnalysisPanel, SegmentSelector | useExplore |
| Generate Tables | (modal) | BannerVariablesStep, AnalysisVariablesStep, ConfigureStep, PreviewStep | useAggfileGenerator |
| Segments | ProjectDetail | SegmentManager, SegmentFormDialog, SegmentSelector | useSegments |
| Data Prep | ProjectDetail | DataPrepManager, RuleFormDialog | useDataPrep |
| Variable Groups | ProjectDetail | VariableGroupsManager, AutoDetectPanel, ManualGrouper | useVariableGroups |
| Waves | ProjectDetail | WaveManager, WaveComparisonChart | useWaves |
| Help Chat | (floating) | HelpChatDialog | useHelpChat |
| Charts | (embedded) | ChartWithTable, CrosstabTable, CompareMeansChart, NpsGauge | — |
| Merge Wizard | (modal) | MergeWizardDialog | -- |
| Segmentation | (modal) | SegmentationWizardDialog | -- |
| Share Links | (modal) | ShareDialog | useShareLinks |
| Report Gen | (modal) | ReportGeneratorDialog | useReportGenerator |
| Teams | /teams | TeamsManager, TeamCard, InviteMemberDialog, CreateTeamDialog | useTeams |
| Team Assignment | ProjectSettings | Select (team selector) | useAssignProjectToTeam |
| Data Prep AI | ProjectDetail | DataPrepAIInput | -- |

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

## QA Audit — 3 Rounds (Feb 26, 2026)

### Round 1 (commit `9ce6bbb`)
| Bug | Fix |
|-----|-----|
| B4 | Null guards on `.toFixed()` in CompareMeansChart + ResultDisplay |
| B5 | Division by zero guard in NpsGauge (`total > 0`) |
| B6/B8 | Removed `isPremium: true` + lock icon from Regression/Factor Analysis |
| B22 | Bell button → DropdownMenu with "No notifications" |

### Round 2 (commit `d8593bf`)
| Bug | Fix |
|-----|-----|
| B21 | `useMemo` on LanguageContext value for stable propagation |
| B15 | Cached `lastExportUrl` in AggfileState — skip re-generation |
| B1 | ProjectDetail shows "Generate summary" CTA when summary is null |

### Round 3 (commit `5843f96`)
| Bug | Fix |
|-----|-----|
| B12 | Stuck detection in useReportGenerator (40 polls ~2min timeout) |
| B18 | 30-second safety timeout on NL rule creation |
| A1 | `DialogDescription` (sr-only) on Segmentation, Merge, Share, Report dialogs |
| B19 | Team assignment selector in ProjectSettings |

---

## Backend API Endpoints Available (Not Yet Integrated in Frontend)

The following backend endpoints were added in Sprint 12 (Feb 2026) and are available for frontend integration:

### TabSpec Import (Data Prep)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/data-prep/import-tabspec` | Upload Excel TabSpec → preview rules |
| POST | `/projects/{id}/data-prep/apply-tabspec` | Apply reviewed TabSpec rules |

**Flow:** Upload `.xlsx` → backend parses + validates variables → returns rule preview → user reviews → apply.

### Data Prep V2 Intelligence
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/data-prep/variable-profiles` | Auto-profile all variables |
| GET | `/projects/{id}/data-prep/qc-report` | Quality control report |
| GET | `/projects/{id}/data-prep/suggestions` | AI prep suggestions |
| POST | `/projects/{id}/data-prep/apply-suggestions` | Apply selected suggestions |
| GET | `/projects/{id}/data-prep/templates` | List prep templates |
| POST | `/projects/{id}/data-prep/apply-template` | Apply a template |
| GET | `/projects/{id}/data-prep/data-table` | Paginated data table (offset, limit, is_prepared) |
| GET | `/projects/{id}/data-prep/column-distribution/{col}` | Column distribution |

### Implementation Notes
- TabSpec import uses `multipart/form-data` (UploadFile) — use `api.uploadFile()` from ApiClient
- Data table endpoint supports `?is_prepared=true` to show data with rules applied
- QC report and suggestions can power a "Data Health" panel in ProjectDetail

---

## Supabase Migrations

Database migrations live in `supabase/migrations/` and auto-deploy when pushed to `main`:
```
supabase/migrations/
├── 20260219180000_add_segments_table.sql
├── 20260222_project_folders.sql          # Folder system (user_id scoped)
└── ...
```

Use `gen_random_uuid()` (not `uuid_generate_v4()`) for Supabase PG17 compatibility.
