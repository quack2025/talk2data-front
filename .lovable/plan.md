
## Dividir "Data Explorer" en dos sub-tabs: "Data Table" y "Frequency Analysis"

### El problema

El tab "Data Explorer" actual tiene dos secciones apiladas verticalmente:
1. **Top (55% de altura)**: Tabla completa de datos (`DataTableView`)
2. **Bottom (45% restante)**: Variable Browser + AnalysisPanel + Bookmarks

Esto genera una vista muy comprimida donde ninguna sección tiene suficiente espacio para respirar, y el usuario tiene que scrollear dentro de ambas secciones simultáneamente. Es visualmente pesado y confuso.

### La solución

Reemplazar el layout de dos secciones apiladas por **dos sub-tabs dentro del tab "Data Explorer"**:

```text
[Project Detail Tabs]
 Overview | Data Prep ● | Data Explorer | Study Context | Files

  [Data Explorer sub-tabs]
  ┌─────────────┬──────────────────────┐
  │  Data Table │  Frequency Analysis  │   ← sub-tabs (pill style o underline sutil)
  └─────────────┴──────────────────────┘

  [Data Table activo]
  ┌──────────────────────────────────────────────────────────────┐
  │  Original ◉ | Value Labels ◉ | 292×129 | Col Sel | Export   │
  │  ┌────┬────────────┬──────────────────────────────────────┐  │
  │  │ 1  │ 1398..     │ Complete │ ...                       │  │
  │  │ 2  │ 2201..     │ ...      │                           │  │
  │  └────┴────────────┴──────────────────────────────────────┘  │
  │  Mostrando 1-50 de 292   < >                                  │
  └──────────────────────────────────────────────────────────────┘

  [Frequency Analysis activo]
  ┌─────────────────┬──────────────────────────────┬────────────┐
  │ Variable Browser│ AnalysisPanel + ResultDisplay │ Bookmarks  │
  │ (Variable list) │ (Freq / CrossTab / Means...)  │ (saved)    │
  └─────────────────┴──────────────────────────────┴────────────┘
```

Cada sub-tab tiene la **altura completa disponible** y puede usar el espacio sin restricciones.

### Cambios técnicos (solo `src/pages/ProjectDetail.tsx`)

Este es un cambio de layout puro. No se toca ninguna lógica, hooks, ni componentes hijos.

**1. Agregar estado para el sub-tab activo**
```ts
const [exploreSubTab, setExploreSubTab] = useState<'table' | 'analysis'>('table');
```

**2. Reestructurar el `TabsContent value="explore"`**

Reemplazar el `div` con dos secciones apiladas (`flex-col`) por un segundo nivel de `Tabs` (sub-tabs):

```tsx
<TabsContent value="explore" className="mt-0 -mx-6 -mb-6 lg:-mx-8 lg:-mb-8">
  {hasReadyFiles ? (
    <Tabs value={exploreSubTab} onValueChange={(v) => setExploreSubTab(v as 'table' | 'analysis')}>
      {/* Sub-tab header */}
      <div className="px-6 lg:px-8 border-b bg-muted/20">
        <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none">
          <TabsTrigger value="table" className="... underline style sutil ...">
            <Table2 className="h-4 w-4 mr-2" /> Data Table
          </TabsTrigger>
          <TabsTrigger value="analysis" className="... underline style sutil ...">
            <BarChart3 className="h-4 w-4 mr-2" /> Frequency Analysis
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Sub-tab: Data Table — ocupa altura completa */}
      <TabsContent value="table" className="mt-0 h-[calc(100vh-290px)] overflow-hidden">
        <DataTableView projectId={projectId!} onCreateRule={handleCreateRuleFromExplorer} />
      </TabsContent>

      {/* Sub-tab: Frequency Analysis — ocupa altura completa en 3 columnas */}
      <TabsContent value="analysis" className="mt-0 h-[calc(100vh-290px)] flex overflow-hidden">
        {/* Variable Browser | Analysis+Results | Bookmarks */}
        ...
      </TabsContent>
    </Tabs>
  ) : (
    <EmptyState />
  )}
</TabsContent>
```

**3. Bonus UX: cuando el usuario hace "Exclude Column" desde el Data Table**
El handler `handleCreateRuleFromExplorer` ya cambia a `activeTab = 'dataprep'`. Esto sigue funcionando sin cambios.

**4. Bonus UX: cuando el usuario viene del bookmark**
La función `handleSelectBookmark` ejecuta un análisis. Podemos hacer que también cambie el sub-tab a `'analysis'` automáticamente para que el resultado sea visible:
```ts
const handleSelectBookmark = useCallback((bookmark) => {
  ...
  setExploreSubTab('analysis'); // ← agregar esta línea
  explore.runAnalysis(config);
}, [...]);
```

### Resumen de cambios

| Archivo | Qué cambia |
|---|---|
| `src/pages/ProjectDetail.tsx` | Añadir estado `exploreSubTab`; reemplazar layout apilado por dos `TabsContent` hijos; ajustar `handleSelectBookmark` para auto-seleccionar sub-tab de análisis |

Solo se modifica un archivo. No hay cambios en componentes hijos, hooks, ni tipos.

### Resultado visual esperado

- **Data Table sub-tab**: La tabla ocupa el 100% del espacio disponible sin ningún panel debajo compitiendo. El scroll horizontal funciona con amplitud. Todos los controles (Value Labels, Column Selector, Export, paginación) tienen espacio cómodo.
- **Frequency Analysis sub-tab**: El panel de 3 columnas (Variable Browser + Análisis + Bookmarks) ocupa toda la altura sin ninguna tabla encima ocupando espacio. El usuario puede enfocarse completamente en explorar frecuencias y cruces.
- La transición entre sub-tabs es instantánea (sin re-fetch de datos porque ambos mantienen estado en memoria mientras el tab padre "explore" está montado).
