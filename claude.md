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

### Local Paths & Infrastructure

| Resource | Location |
|----------|----------|
| This repo (frontend) | `C:\Users\jorge\proyectos_python\talk2data-front` |
| Backend repo | `C:\Users\jorge\proyectos_python\talk2data` |
| Supabase project | `icxsetsaxifssotcodul` |
| Backend API (prod) | talk2data-production-1698.up.railway.app |

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
│   ├── charts/             # Recharts wrappers (bar, crosstab, compare means, NPS, donut, line, scatter, stacked bar, wave comparison, segment profile, batch progress, tabspec upload)
│   ├── chat/               # Chat UI (messages, input, sidebar, results, refine actions, banner picker)
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
│   ├── reports/            # AI Report Prompt (ReportPromptDialog — structured markdown for Gamma/ChatGPT/Tome)
│   ├── teams/              # Team management (TeamsManager, TeamCard, InviteMemberDialog)
│   ├── dataprep/           # Data prep AI input + rule management
│   ├── layout/             # AppSidebar (Core Zone + Folders + Account Zone), AppHeader
│   └── ...
├── hooks/                  # Custom hooks (28+ hooks)
│   ├── useChat.ts          # Chat with retry, cache, refine, SSE streaming, pagination
│   ├── useExplore.ts       # Explore mode analysis
│   ├── useSegments.ts      # Segment CRUD + preview
│   ├── useDataPrep.ts      # Data prep rules CRUD
│   ├── useAggfileGenerator.ts  # Generate Tables wizard state
│   ├── useReportGenerator.ts # Report generation with progress polling
│   ├── useTeams.ts           # Team CRUD + useAssignProjectToTeam
│   ├── useShareLinks.ts      # Share link CRUD
│   └── ...
├── types/                  # TypeScript type definitions
│   ├── explore.ts          # Explore types (ExploreRunRequest, ExploreVariable with hidden_by_group, etc.)
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
| AI Chat | ProjectChat | ChatMessage, ResultsPanel, RefineActions, BannerPickerPopover, ChatInput | useChat |
| Explore Mode | ProjectExplore | VariableBrowser (with Analyze as Group for MRS), AnalysisPanel, SegmentSelector | useExplore |
| Generate Tables | (modal) | BannerVariablesStep, AnalysisVariablesStep, ConfigureStep, PreviewStep | useAggfileGenerator |
| Segments | ProjectDetail | SegmentManager, SegmentFormDialog, SegmentSelector | useSegments |
| Data Prep | ProjectDetail | DataPrepManager (V2: QC Report, Variable Profiles, AI Suggestions panels), RuleFormDialog | useDataPrep |
| Variable Groups | ProjectDetail | VariableGroupsManager, AutoDetectPanel, ManualGrouper | useVariableGroups |
| Waves | ProjectDetail | WaveManager, WaveComparisonChart | useWaves |
| Help Chat | (floating) | HelpChatDialog | useHelpChat |
| Charts | (embedded) | ChartWithTable, CrosstabTable, CompareMeansChart, NpsGauge, ScatterQuadrantChart, StackedBarChart, WaveComparisonChartEmbed, SegmentProfileChart, BatchTabPlanProgress, TabSpecUploadWidget | — |
| Merge Wizard | (modal) | MergeWizardDialog | -- |
| Segmentation | (modal) | SegmentationWizardDialog | -- |
| Share Links | (modal) | ShareDialog | useShareLinks |
| AI Report Prompt | ProjectChat toolbar + Exports page | ReportPromptDialog (depth selector, copy/download markdown) | useReportPrompt |
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
| `/projects/:projectId/:tab` | Deep link to specific tab (overview, dataprep, data-preparation, context, files, explore) |
| `/projects/:projectId/upload` | File upload |
| `/projects/:projectId/chat` | AI chat interface |
| `/projects/:projectId/explore` | Interactive explore mode |
| `/projects/:projectId/settings` | Project settings |
| `/projects/:projectId/summary` | Executive summary |
| `/dashboard` | Main dashboard |
| `/exports` | AI Report Prompt (replaced old PDF/Excel/PPTX export dropdown) |
| `/settings` | User settings |
| `/teams` | Team management |
| `/api-keys` | API key management |

---

## QA Audit — 4 Rounds (Feb 26-27, 2026)

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

### Round 4 (commit `26f4590`)
| Bug | Fix |
|-----|-----|
| B2 | Error recovery banner in ProjectDetail with retry button (calls `POST /reprocess`) |
| B3 | "No valid data" empty state in ResultDisplay when `sample_size === 0` |
| B16 | Wave selector dedup: filter to `spss_data` + unique `original_name` |
| B20 | Conversation export dropdown in ProjectChat toolbar (PDF/Excel/PPTX via useExports) |

### NL Chat Sprint 21 (commit `6be8cdb`)
| Feature | Description |
|---------|-------------|
| Per-message results | Click assistant message → ResultsPanel shows that message's charts/tables |
| Smart suggestions | ChatSuggestions shows dataset-specific example questions |
| Weight toast | Auto-detect weight variable → info toast with Data Prep link |
| Segment selector in chat | SegmentSelector in chat toolbar for global filter |

### NL Chat QA (commit `fcb66f5`)
| Bug | Fix |
|-----|-----|
| TC-19 | Per-message nav reads `attachments` from historical messages (charts/tables persisted in DB) |

### Pre-Launch QA + Sprint 22 (commits `654053a`, `69a978c`, `eb7de59`, `c176ac8`)
| Feature/Fix | Description |
|-------------|-------------|
| Change Banner | `BannerPickerPopover` — searchable variable picker for changing crosstab banner via `RefineActions` |
| Pre-launch P0 fixes | Dashboard crash, suggestions endpoint, segments filter, share links, crosstab sig |
| Detailed Report (backend) | New `detailed_report` analysis type — runs 6-8 analyses automatically with unified narrative. No frontend changes needed (renders as normal chat message with charts). |

### Sprint 22 — Post-Launch Quick Wins (commits `0a1a9db`, `d2b1e6e`)
| Feature/Fix | Description |
|-------------|-------------|
| Remove Report Generator | Removed dead `{false && (...)}` blocks and imports from ProjectChat + ProjectDetail. Component files kept for future Gamma export pivot. |
| Data Prep V2 Panels | Three collapsible panels in DataPrepManager: QC Report (quality badges), Variable Profiles (type detection, confidence), AI Suggestions (checkbox + apply). Uses existing `useDataPrep` hook methods. |
| Wave Comparison Chart | `WaveComparisonChartEmbed` — Recharts LineChart for wave trends in NL chat results. Registered in ChartWithTable dispatcher. |
| Data Prep Export | Already existed in `DataTableView` — verified working. |

### Sprint 23 — Charts & Visualization (commit `0c04ee3`)
| Feature | Description |
|---------|-------------|
| ScatterQuadrantChart | Importance vs Satisfaction scatter with quadrant reference lines (gap analysis). Points colored by quadrant: red (concentrate), green (maintain), gray (low priority), amber (overkill). |
| StackedBarChart | Stacked bar chart for crosstab/funnel visualizations. Uses Recharts Bar with `stackId`. |
| ChartType updated | Added `scatter`, `stacked_bar`, `wave_comparison` to ChartType union in `database.ts`. |

### Sprint 24 — Batch Tab Plan & TabSpec Upload (commit `bb0c969`)
| Feature | Description |
|---------|-------------|
| BatchTabPlanProgress | Async polling widget for batch tab plan exports. Polls `GET /generate-tables/export-status/{taskId}` every 3s. Shows progress bar, stage label, tables_done/tables_total, download button on completion. New file: `src/components/chat/BatchTabPlanProgress.tsx`. |
| TabSpecUploadWidget | 3-phase upload widget in chat: Phase 1 FileDropZone (.xlsx/.xls), Phase 2 rule preview table with checkboxes, Phase 3 apply confirmation. New file: `src/components/chat/TabSpecUploadWidget.tsx`. |
| CrosstabTable spanning headers | Two-level column headers for nested crosstabs. Conditional parent header row when `spanning_headers` present, using `<TableHead colSpan={sh.colspan}>`. |
| ChartType + types | Added `SpanningHeader` interface `{ label: string; colspan: number }`, extended `ChartTableData` with `spanning_headers?: SpanningHeader[]`, added `batch_progress` and `tabspec_upload` to ChartType union. |

### Sprint 25 — SSE Streaming, Pagination & Segment Profile (commit `b1fb366`)
| Feature | Description |
|---------|-------------|
| SegmentProfileChart | Recharts horizontal bar comparison chart. Dual bars (Segment colored by index, Total gray). Index coloring: green (>=120), red (<=80), gray (neutral). Custom tooltip with segment %, total %, index, significance flag. Legend at bottom. New file: `src/components/chat/SegmentProfileChart.tsx`. |
| SSE streaming (useChat) | `executeQueryStream` using `fetch()` with ReadableStream parsing SSE events. `thinkingStage` state for real-time stage display. `sendMessage` tries stream first with POST fallback. (+148 lines in `useChat.ts`). |
| Message pagination (useChat) | `hasMore`, `isLoadingMore`, `prependedMessages` state. `loadEarlierMessages` callback using cursor-based `before` param. Reset on conversation change. |
| ProjectChat UI updates | "Load earlier messages" button with ChevronUp icon at top of message list. Thinking indicator shows `thinkingStage` instead of static "Analyzing data...". |
| i18n additions | 5 new keys in both es/en: `loadEarlier`, `loadingEarlier`, `interpreting`, `buildingCharts`, `generatingNarrative`. |
| ChartType updated | Added `segment_profile` to ChartType union in `database.ts`. |

### Sprint 26 — AI Report Prompt + QA Fixes (commits `ab0cf59`, `314f006`, `a7b73b9`, `502d925`)
| Feature/Fix | Description |
|-------------|-------------|
| ReportPromptDialog | New dialog: depth selector (compact/standard/detailed), source selector (current/all conversations — hidden when no conversationId), Claude-generated structured markdown, copy to clipboard + download .md. New file: `src/components/reports/ReportPromptDialog.tsx`. Hook: `useReportPrompt`. |
| AI Report in chat toolbar | Button in ProjectChat toolbar opens ReportPromptDialog with conversationId for source selection. |
| AI Report on Exports page | Replaced `CreateExportDialog` with `ReportPromptDialog` on `/exports` page. No conversationId passed — generates report purely from project data (variable profiles, exec summary, study context). Button: "Reporte IA" / "AI Report" with Sparkles icon. |
| Bilingual chat suggestions | `ChatSuggestions` now passes `?lang=${language}` to backend. Weight-detected toast is bilingual. |
| SPA deep link fix | Created `public/_redirects` with `/* /index.html 200` for Netlify/Lovable catch-all routing. |
| i18n additions | `exports.aiReport` key (ES/EN), updated `exports.subtitle` and `exports.noExportsDescription`, `reportPromptDialog` section with all dialog labels. |

### QA Regression Rounds 1-3 (5 March 2026, commits `60518e2`, `9e0af3d`, `172e109`, `acd85f7`)

| Fix | Description |
|-----|-------------|
| BUG-2: SPA deep link 404 | Created `vercel.json` with SPA rewrites (deleted Netlify `_redirects`). Added `/projects/:projectId/:tab` route in App.tsx. `ProjectDetail` reads `:tab` param with slug→internal mapping (`data-preparation`→`dataprep`, etc.). |
| BUG-6: AI Report modal freeze | Added `error` state + inline error display in `ReportPromptDialog`. Reset on close. Toast on failure. |
| Remove Export dropdown | Removed `DropdownMenu` with PDF/Excel/PPTX options from `ProjectChat` toolbar. Only "AI Report" button remains. Removed `useExports` hook usage and `Download` icon import. |
| Coming Soon badges | Merge Data and Segmentation cards in `ProjectDetail` disabled with `opacity-60 cursor-not-allowed` + amber "Coming Soon" badge. Cards no longer clickable for client demos. |
| Analyze as Group (MRS) | `VariableBrowser` now accepts `onAnalyzeGroup` prop. When a group is selected in the dropdown, an "Analyze group (N vars)" button appears. Click triggers `multiple_response` analysis with all group variables via `ProjectExplore.handleAnalyzeGroup`. No backend changes needed. |

### MRS QA + Variable Visibility (10 March 2026, commits `76c294a`, `e6a888e`)
| Feature/Fix | Description |
|-------------|-------------|
| MRS horizontal bar chart | `ResultDisplay` now renders a Recharts horizontal bar chart for MRS results (top 20 items by % respondents) above the table. Truncated labels (max 30 chars). |
| Optional cross for MRS | `AnalysisPanel`: new `optionalCross` property on MRS analysis type — shows banner selector without requiring it (`showCross = needsCross \|\| optionalCross`). |
| Coming Soon: Export PDF | `ProjectDetail`: Export/Generate PDF card disabled with amber "Coming Soon" badge. |
| Hidden variables (backend-driven) | Backend now filters out variables that belong to a Variable Group from `GET /explore/variables` response. `ExploreVariable` type has new `hidden_by_group?: string \| null` field. Frontend receives only visible variables — no client-side filtering needed. |
| Frequency missing fix | `ResultDisplay`: frequency charts no longer show "MISSING" as the largest bar. Backend excludes missing from `frequencies[]` list. New `total_missing`/`pct_missing` fields displayed as a discrete note below the frequency table (e.g. "42 missing cases (65.2%)"). |

### Chart Types Rendered

Full `ChartType` union in `src/types/database.ts`:
```ts
type ChartType = 'bar' | 'horizontal_bar' | 'vertical_bar' | 'pie' | 'donut' | 'line' | 'nps_gauge' | 'crosstab' | 'compare_means' | 'scatter' | 'stacked_bar' | 'wave_comparison' | 'batch_progress' | 'tabspec_upload' | 'segment_profile';
```

| ChartType | Component | Description |
|-----------|-----------|-------------|
| `bar` / `horizontal_bar` / `vertical_bar` | (Recharts BarChart) | Standard bar charts |
| `pie` / `donut` | (Recharts PieChart) | Pie and donut charts |
| `line` | (Recharts LineChart) | Line chart |
| `nps_gauge` | NpsGauge | NPS score gauge |
| `crosstab` | CrosstabTable | Crosstab table with significance letters |
| `compare_means` | CompareMeansChart | Compare means bar chart |
| `scatter` | ScatterQuadrantChart | Scatter with quadrant reference lines |
| `stacked_bar` | StackedBarChart | Stacked bar chart |
| `wave_comparison` | WaveComparisonChartEmbed | Wave trend line chart |
| `batch_progress` | BatchTabPlanProgress | Batch tab plan async export |
| `tabspec_upload` | TabSpecUploadWidget | TabSpec import from chat |
| `segment_profile` | SegmentProfileChart | Segment profiling (segment vs total bars) |

---

## Remaining Limitations

1. No offline mode — all data requires backend connection
2. No real-time collaboration — single-user edits only
3. ~~No streaming — chat responses arrive as a single block~~ **DONE (Sprint 25 SSE)**
4. No undo/redo in data prep rule editing
5. No drag-and-drop reordering of data prep rules
6. ~~No bulk variable selection in Explore mode~~ **Partially done:** Analyze as Group button for MRS variable groups (QA Regression). Individual variable multi-select still pending.
7. No chart annotation or custom labels
8. ~~No PDF export from chat~~ **Replaced with AI Report Prompt (Sprint 26)** — generates structured markdown for Gamma/ChatGPT/Tome. PDF/Excel/PPTX export dropdown removed from chat toolbar (QA Regression).
9. No dark mode
11. **Merge Data and Segmentation cards disabled** (Coming Soon badges) for client demos — backend functionality exists but frontend entry points are temporarily blocked
10. ~~Conversation history limited to 50 messages~~ **DONE (Sprint 25 pagination)**

---

## Backend API Endpoints (Partial Frontend Integration)

The following backend endpoints were added in Sprint 12 (Feb 2026) and are available for frontend integration:

### TabSpec Import (Data Prep)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/data-prep/import-tabspec` | Upload Excel TabSpec → preview rules |
| POST | `/projects/{id}/data-prep/apply-tabspec` | Apply reviewed TabSpec rules |

**Flow:** Upload `.xlsx` → backend parses + validates variables → returns rule preview → user reviews → apply.

### Data Prep V2 Intelligence (Frontend panels added Sprint 22)
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
