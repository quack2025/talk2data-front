# Code Conventions — Talk2Data Frontend

## File Organization

### Naming
| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.tsx` | `SegmentManager.tsx` |
| Hooks | camelCase with `use` prefix `.ts` | `useSegments.ts` |
| Types | camelCase `.ts` | `segments.ts` |
| Utilities | camelCase `.ts` | `chartColors.ts` |
| Pages | PascalCase `.tsx` | `ProjectExplore.tsx` |
| UI primitives | lowercase `.tsx` (shadcn convention) | `button.tsx`, `dialog.tsx` |

### Imports
- Always use `@/` path alias: `import { Button } from '@/components/ui/button'`
- Group imports: React → external libs → components → hooks → types → utils
- Barrel exports for feature modules: `src/components/segments/index.ts`

---

## Component Conventions

### Feature Module Structure
```
components/feature-name/
├── FeatureManager.tsx      # List view: fetch, display cards, CRUD actions
├── FeatureFormDialog.tsx   # Dialog: create/edit form with validation
├── FeatureSelector.tsx     # Compact dropdown for use in other features (optional)
└── index.ts                # export { FeatureManager } from './FeatureManager'
```

### Props Pattern
```typescript
interface SegmentManagerProps {
  projectId: string;
  availableVariables: ExploreVariable[];
}

export function SegmentManager({ projectId, availableVariables }: SegmentManagerProps) {
  const { t } = useLanguage();
  const seg = t.segments;
  // ...
}
```

### UI Components
- **Dialogs:** Use `Dialog` from shadcn for create/edit forms
- **Confirmation:** Use `AlertDialog` for delete confirmations
- **Selection:** Use `Select` (Radix) for dropdowns — NOT native `<select>`
- **Cards:** Use `Card`/`CardHeader`/`CardContent` for list items
- **Loading:** Use `Loader2` from lucide-react with `animate-spin`
- **Badges:** Use `Badge` for status indicators and counts
- **Toasts:** Use `toast.success()` / `toast.error()` from sonner

### Spacing & Layout
- Use Tailwind utility classes exclusively (no custom CSS)
- `className={cn("base-classes", conditional && "extra-classes")}` with `cn()` from `lib/utils`
- Compact variants: `h-8 text-xs` for tight UIs (e.g., SegmentSelector)
- Standard variants: `h-9 text-sm` for normal forms

---

## Hook Conventions

### CRUD Hook Pattern
```typescript
export function useFeature(projectId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Item[]>(`/projects/${projectId}/items`);
      setItems(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading items');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createItem = useCallback(async (data: ItemCreate) => {
    try {
      const response = await api.post<Item>(`/projects/${projectId}/items`, data);
      setItems(prev => [response, ...prev]);  // Optimistic prepend
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creating item');
      throw e;
    }
  }, [projectId]);

  // ... updateItem, deleteItem follow same pattern

  return { items, isLoading, error, fetchItems, createItem, updateItem, deleteItem };
}
```

### Key Patterns
- `useCallback` with `[projectId]` dependency for all async operations
- Optimistic local state updates (add to array, remove from array)
- Error state stored in hook, displayed by component
- `throw e` after `setError` so callers can catch too

---

## Internationalization

### Adding New Translations
In `src/i18n/translations.ts`:
```typescript
export const translations = {
  es: {
    // ...
    segments: {
      title: 'Segmentos',
      createSegment: 'Nuevo Segmento',
      // ...
    },
  },
  en: {
    // ...
    segments: {
      title: 'Segments',
      createSegment: 'New Segment',
      // ...
    },
  },
};
```

### Usage in Components
```typescript
const { t, language } = useLanguage();
const seg = t.segments;

// Always provide fallback:
<h3>{seg?.title ?? 'Segments'}</h3>
```

### For Operator Labels (bilingual constants)
```typescript
// In types file:
export const OPERATOR_LABELS: Record<string, Record<string, string>> = {
  eq: { es: 'Igual a', en: 'Equals' },
  ne: { es: 'Diferente de', en: 'Not equal' },
  // ...
};

// In component:
const label = OPERATOR_LABELS[operator]?.[language] ?? operator;
```

---

## Type Conventions

### Type Files
- One file per feature domain in `src/types/`
- Export interfaces (not types, unless union needed)
- Match backend schema names when possible

### Common Patterns
```typescript
// Request types match backend Pydantic schemas
export interface ExploreRunRequest {
  analysis_type: string;
  variable: string;
  cross_variable?: string;
  filters?: FilterCondition[];
  segment_id?: string;        // Optional segment filter
  nets?: Record<string, (string | number)[]>;
}

// Response types match backend response schemas
export interface ExploreRunResponse {
  success: boolean;
  result: Record<string, any> | null;
  sample_size: number | null;
  warnings: string[];
  python_code: string | null;
}
```

### Sentinel Values
For `<Select>` components that need a "none" option (Radix Select doesn't allow empty string):
```typescript
const NO_SEGMENT = '__none__';

<Select value={value || NO_SEGMENT} onValueChange={v => onChange(v === NO_SEGMENT ? null : v)}>
```

---

## API Integration

### Endpoint Pattern
```typescript
// In hook:
const response = await api.post<SegmentPreviewResponse>(
  `/projects/${projectId}/segments/preview`,
  { conditions }
);

// For file downloads:
const blob = await api.downloadBlob(
  `/projects/${projectId}/generate-tables/export`,
  'POST',
  config
);
```

### Error Handling
```typescript
try {
  await api.post(...);
  toast.success(t.segments?.created ?? 'Segment created');
} catch (e) {
  // ApiError has: status, isServerError, isServiceUnavailable
  toast.error(e instanceof Error ? e.message : 'Error');
}
```

---

## Chart Colors

Standard palette from `src/lib/chartColors.ts`:
```typescript
import { getChartColor } from '@/lib/chartColors';
// getChartColor(0) → '#4F46E5' (indigo)
// getChartColor(1) → '#06B6D4' (cyan)
// ...
```

Chart types: `bar`, `horizontal_bar`, `line`, `pie`, `donut`, `nps_gauge`, `crosstab`, `compare_means`

---

## Common Pitfalls

1. **shadcn/ui Select requires non-empty values** — Use a sentinel like `__none__` for "no selection"
2. **`.env` must stay in git** — Lovable reads VITE_* from committed file, not dashboard
3. **Always provide `??` fallbacks for translations** — `t.section?.key ?? 'English fallback'`
4. **useCallback dependencies** — Always include `projectId` in CRUD hook callbacks
5. **gen_random_uuid()** — Use this in Supabase migrations, not `uuid_generate_v4()`
6. **Toast after async** — Always toast success/error after API calls complete
