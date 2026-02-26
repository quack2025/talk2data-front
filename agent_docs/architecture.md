# Architecture — Talk2Data Frontend

## System Overview

Talk2Data frontend is a React SPA for market research data analysis, part of the Genius Labs AI Suite. It communicates with a FastAPI backend via REST APIs and uses Supabase for authentication and some database operations. The UI follows a unified design system (HSL tokens, primary #1E40AF) shared across all 4 Genius Labs products.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 + TypeScript 5.8 |
| Build | Vite 5.4 (SWC plugin) |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix primitives) |
| State | React Query 5 (server), React Context (language), useState (local) |
| Auth | Supabase Auth (JWT, session in localStorage) |
| Charts | Recharts 2.15 |
| Routing | React Router 6 |
| Forms | React Hook Form + Zod validation |
| i18n | Custom LanguageContext (ES/EN) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/utilities |
| Notifications | Sonner (toast) |
| Deployment | Lovable (auto-deploy from `main`) |

---

## Application Flow

```
App.tsx (Router + Auth guards)
  ├── PublicRoute → Auth page (login/register)
  └── ProtectedRoute → Authenticated pages
       ├── AppSidebar (collapsible: w-64 / w-16)
       │    ├── Core Zone (coreItems: Projects, Upload, Chat, Export, Teams, API Keys)
       │    ├── FolderSection (drag-and-drop folders, 8-color picker)
       │    │    └── DroppableFolderItem (useDroppable targets)
       │    └── Account Zone (accountItems: Usage, Billing, Settings)
       ├── Dashboard / Projects → Project list (filtered by ?folder= param)
       │    └── DraggableProjectCard (useDraggable sources)
       ├── ProjectDetail → Data prep, groups, waves, segments
       ├── ProjectChat → AI chat with backend
       ├── ProjectExplore → Interactive analysis
       ├── ProjectSettings → Project settings + team assignment
       ├── Teams → TeamsManager (CRUD, member management)
       ├── ProjectUpload → SPSS file upload
       └── ...
```

The sidebar wraps its content in a `DndContext` from @dnd-kit/core. When a project card is dropped on a folder, `handleDragEnd` in AppSidebar assigns the project to that folder via Supabase update.

### Authentication Flow
1. User logs in via Supabase Auth (email/password)
2. Supabase stores session in localStorage
3. `ApiClient.getAuthToken()` reads session on every request
4. JWT `Authorization: Bearer` header sent to FastAPI backend
5. Backend verifies JWT via Supabase JWKS (ES256)

---

## Component Architecture

### Feature Module Pattern

Each feature follows a consistent pattern:

```
components/feature-name/
├── FeatureManager.tsx      # List view with CRUD actions
├── FeatureFormDialog.tsx   # Create/edit dialog
├── FeatureSelector.tsx     # Compact picker (optional)
└── index.ts                # Barrel exports
```

Examples:
- `segments/` → SegmentManager, SegmentFormDialog, SegmentSelector
- `data-prep/` → DataPrepManager, RuleFormDialog
- `grouping/` → VariableGroupsManager, AutoDetectPanel, ManualGrouper
- `waves/` → WaveManager, WaveComparisonChart

### Hook Pattern

Each feature has a corresponding hook in `src/hooks/`:

```typescript
export function useSegments(projectId: string) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => { ... }, [projectId]);
  const createSegment = useCallback(async (data) => { ... }, [projectId]);
  const updateSegment = useCallback(async (id, data) => { ... }, [projectId]);
  const deleteSegment = useCallback(async (id) => { ... }, [projectId]);

  return { segments, isLoading, error, fetchSegments, createSegment, updateSegment, deleteSegment };
}
```

Hooks encapsulate:
- State management (loading, error, data)
- API calls via `ApiClient`
- Optimistic updates (local state mutation before server confirmation)

---

## Data Flow

### AI Chat Query
```
User types question in ChatInput
  → useChat.sendMessage(question, { segment_id })
  → api.post(`/projects/${id}/conversations/${convId}/query`, { question, segment_id })
  → Backend: AI interpretation → real statistics → response
  → QueryResponse { answer, charts, tables, variables, python_code }
  → ChatMessage renders answer + charts + results panel
```

### Explore Mode Analysis
```
User selects variable + analysis type in AnalysisPanel
  → useExplore.runAnalysis({ analysis_type, variable, segment_id, filters })
  → api.post(`/projects/${id}/explore/run`, ExploreRunRequest)
  → ExploreRunResponse { result, sample_size, warnings, python_code }
  → AnalysisPanel renders result table + chart
```

### Segment Selection
```
SegmentSelector (compact dropdown in Explore/Chat/Tables)
  → onChange(segmentId) → parent state updates
  → Parent includes segment_id in next API request
  → Backend resolves segment → FilterCondition[] → prepends to filters
```

### Report Generation
```
User opens ReportGeneratorDialog
  → useReportGenerator.generate(options)
  → api.post(`/projects/${id}/reports/generate`, options)
  → Backend: background task with progress tracking
  → Frontend polls: api.get(`/projects/${id}/reports/status/${exportId}`)
  → Stuck detection: 40 consecutive identical polls → timeout error
  → On complete: download URL available
```

### Team Assignment
```
ProjectSettings page → team selector (Select component)
  → useAssignProjectToTeam().mutate({ projectId, teamId })
  → api.patch(`/projects/${projectId}`, { team_id: teamId })
  → Backend: validates team membership, sets owner_type=TEAM
  → Query invalidation: ['projects'] cache refreshed
```

---

## Folder System

### Overview
Users can organize projects into colored folders via drag-and-drop. The folder system is user_id-scoped (each user sees only their own folders).

### Components
| Component | File | Role |
|-----------|------|------|
| FolderSection | `src/components/folders/FolderSection.tsx` | Folder list with CRUD, 8-color picker, collapsed mode |
| DroppableFolderItem | `src/components/folders/DroppableFolderItem.tsx` | Each folder as a @dnd-kit `useDroppable` target |
| DraggableProjectCard | `src/components/dashboard/DraggableProjectCard.tsx` | Project card as a @dnd-kit `useDraggable` source |
| AppSidebar | `src/components/layout/AppSidebar.tsx` | Wraps everything in `DndContext`, handles `onDragEnd` |

### State and Routing
- Folder state is derived from URL search params: `?folder={folderId}`
- `Projects.tsx` reads `searchParams.get('folder')` and filters the project list
- No separate hook; folder CRUD uses Supabase client directly in FolderSection
- Migration: `supabase/migrations/20260222_project_folders.sql` (uses `gen_random_uuid()`)

### Collapsed Sidebar Mode
When the sidebar is collapsed (w-16), FolderSection renders each folder as a colored dot with a tooltip showing the folder name, instead of the full folder row.

---

## Chart System

All charts rendered via Recharts with consistent color palette from `lib/chartColors.ts`.

| Chart Type | Component | Used For |
|-----------|-----------|----------|
| Vertical bar | ChartWithTable | Frequency, general distributions |
| Horizontal bar | CompareMeansChart | Compare means with error bars |
| Crosstab table | CrosstabTable | Cross-tabulation with significance letters |
| NPS gauge | NpsGauge | Net Promoter Score |
| Donut | DonutChart | Proportions |
| Line | LineChart | Wave comparison trends |
| Dendrogram | SegmentationDendrogram | Hierarchical clustering tree (SVG) |

The `ChartWithTable` component is the main dispatcher — it reads `chart_type` from the backend response and renders the appropriate visualization.

---

## State Management Strategy

| State Type | Mechanism | Example |
|-----------|-----------|---------|
| Server data | React Query | Project list, conversations, exports |
| Feature CRUD | Custom hooks (useState + useCallback) | segments, data prep, groups |
| UI state | useState in components | dialog open/close, selected tab |
| Auth | Supabase session | Login state, JWT token |
| Language | LanguageContext | ES/EN toggle |
| Folder filter | URL search params (?folder=) | Active folder selection |
| Theme | next-themes | Dark/light mode |

**No global store.** Each feature's hook owns its state. Cross-feature communication happens via prop drilling or shared page-level state.

---

## Page-Level Composition (ProjectDetail example)

```tsx
// src/pages/ProjectDetail.tsx
function ProjectDetail() {
  // Multiple feature hooks compose at page level
  const { variables } = useExplore(projectId);
  const { segments } = useSegments(projectId);

  return (
    <>
      <VariableGroupsManager projectId={projectId} variables={variables} />
      <DataPrepManager projectId={projectId} variables={variables} />
      <WaveManager projectId={projectId} />
      <SegmentManager projectId={projectId} availableVariables={variables} />
    </>
  );
}
```

Each Manager component is self-contained: it fetches its own data via its hook, renders its own CRUD UI, and manages its own dialogs.

---

## Backend API Endpoints (Not Yet in Frontend)

These Sprint 12 backend endpoints are available but lack frontend integration:
- **TabSpec Import:** `POST .../data-prep/import-tabspec` (multipart) + `POST .../data-prep/apply-tabspec`
- **Data Prep V2:** `GET .../data-prep/variable-profiles`, `/qc-report`, `/suggestions`, `/data-table`, `/column-distribution/{col}`
- **Templates:** `GET .../data-prep/templates`, `POST .../data-prep/apply-template`

These would integrate into `DataPrepManager` (new tabs or sub-panels) using the existing hook pattern.
