# Architecture — Talk2Data Frontend

## System Overview

Talk2Data frontend is a React SPA for market research data analysis. It communicates with a FastAPI backend via REST APIs and uses Supabase for authentication and some database operations.

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
| Notifications | Sonner (toast) |
| Deployment | Lovable (auto-deploy from `main`) |

---

## Application Flow

```
App.tsx (Router + Auth guards)
  ├── PublicRoute → Auth page (login/register)
  └── ProtectedRoute → Authenticated pages
       ├── Dashboard → Project list
       ├── ProjectDetail → Data prep, groups, waves, segments
       ├── ProjectChat → AI chat with backend
       ├── ProjectExplore → Interactive analysis
       ├── ProjectUpload → SPSS file upload
       └── ...
```

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
