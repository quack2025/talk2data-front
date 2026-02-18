
## Add Full Data Table View to the Data Explorer Tab

### What's Missing

The current "Data Explorer" tab only shows the **frequency/analysis panel** (Variable Browser → AnalysisPanel → ResultDisplay → Bookmarks). The previous "Habilita gate UX más visible" version also had a **full raw data table** at the top of that tab, with:

- **Original Data / Prepared Data** toggle
- **Value Labels** toggle (show label + code vs raw code)
- **Rows × Columns** badge (e.g. "292 rows × 129 columns")
- **Column Selector** dropdown with search, invert, show-all, and apply
- **Export to Excel** dropdown (Values only / Labels only / Labels + Values)
- **Paginated data grid** with horizontal scroll, sticky headers, and right-click context menus per column/cell (View Distribution, Create Net, Create Recode, Exclude Column, Keep only value, Exclude value)
- **Column Distribution Sheet** (slide-in panel with bar chart per variable)

All of this logic already exists as a fully working component: `DataTableView` in `src/components/dataprep/DataTableView.tsx`. It is currently only used inside the "Data Preparation" tab via `DataPrepManager`. The goal is to **add** it to the Data Explorer tab as a top section, without replacing the existing analysis panel below.

### What `DataTableView` needs

`DataTableView` accepts two props:
- `projectId: string` — already available
- `onCreateRule: (prefill: RulePrefill) => void` — currently wired to open the rule dialog in DataPrepManager

For the Explorer tab, the `onCreateRule` callback needs to **switch to the Data Preparation tab** and pre-fill the rule dialog there. This can be done by lifting a `pendingRulePrefill` state up to `ProjectDetail` and applying it when the dataprep tab activates.

### Implementation Plan

**File: `src/pages/ProjectDetail.tsx`**

1. **Import `DataTableView`** from `@/components/dataprep`.

2. **Import `RulePrefill`** type from `@/components/dataprep`.

3. **Add state** for pending cross-tab rule creation:
   ```ts
   const [pendingRulePrefill, setPendingRulePrefill] = useState<RulePrefill | null>(null);
   ```

4. **Add handler** `handleCreateRuleFromExplorer` that:
   - Saves the prefill to `pendingRulePrefill`
   - Switches `activeTab` to `'dataprep'`
   (The DataPrepManager will pick up the prefill on the next render)

5. **Add state & handler in DataPrepManager** — DataPrepManager already has internal `rulePrefill` state. The cleanest approach is to pass an optional `externalPrefill` prop to `DataPrepManager` and apply it via a `useEffect` when it changes.

   Actually, a simpler approach: pass a `prefillRef` callback directly. Looking at the code, `DataPrepManager` already tracks `rulePrefill` and `showDialog` internally. The cleanest solution without refactoring the child is to pass `initialPrefill?: RulePrefill` prop to `DataPrepManager` and use a `useEffect` to open the dialog when it's provided.

6. **In the Data Explorer tab (`value="explore"`)**: Add `DataTableView` at the top of the center area (above the AnalysisPanel), inside a visually separated section. Structure:

   ```
   [Data Explorer Tab]
   ┌──────────────────────────────────────────────────────┐
   │  📊 Data Table (DataTableView with all features)     │
   │  Original ◉ | Value Labels ◉ | 292×129 | Col Sel | Export │
   │  ┌───┬────────┬──────────────────────────────────┐  │
   │  │ 9 │ 1398.. │ Complete │ ...                   │  │
   │  └───┴────────┴──────────────────────────────────┘  │
   │  Pagination: Showing 1-50 of 292   < >              │
   ├──────────────────────────────────────────────────────┤
   │  🔍 Frequency Analysis (AnalysisPanel + Results)    │
   └──────────────────────────────────────────────────────┘
   ```

   The two sections are separated by a divider with a label. The table uses the full width area (no side panels constrain it). The Variable Browser and Bookmarks panels remain visible alongside the analysis section below.

7. **Layout adjustment**: The Data Explorer tab currently uses a 3-column flex layout (`Variable Browser | Center | Bookmarks`). The `DataTableView` needs full horizontal width (it scrolls horizontally). The best approach is to **restructure the layout** into two vertical sections:
   - **Top section (full width)**: `DataTableView` with its own horizontal scroll
   - **Bottom section (3-column flex)**: Variable Browser | Analysis Panel + Results | Bookmarks
   
   This keeps all existing functionality intact while adding the table on top.

**File: `src/components/dataprep/DataPrepManager.tsx`**

8. **Add optional `externalPrefill` prop**: When provided and changes (non-null), automatically open the rule dialog with that prefill. Reset to null after consuming.

### Technical Details

- `DataTableView` already handles its own data fetching via `useDataTable(projectId)` — no new API calls needed
- The `onCreateRule` callback from the explorer table will call `handleCreateRuleFromExplorer`, which switches tabs and passes the prefill through
- The `ColumnDistributionSheet` is rendered inside `DataTableView` itself — no additional wiring
- No new dependencies required — all components and hooks already exist

### Summary of Changes

| File | Change |
|---|---|
| `src/pages/ProjectDetail.tsx` | Import `DataTableView` + `RulePrefill`; add `pendingRulePrefill` state; add `handleCreateRuleFromExplorer`; add `DataTableView` to the explorer tab; pass `externalPrefill` to `DataPrepManager` |
| `src/components/dataprep/DataPrepManager.tsx` | Add optional `externalPrefill?: RulePrefill` prop; add `useEffect` to consume it and open the dialog |
