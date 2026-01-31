
# Plan de Correcciones e Integración de Features

## Resumen de la Revisión

He revisado todas las funcionalidades implementadas y encontré los siguientes puntos:

---

## 1. Error de Compilación (CRÍTICO)

**Archivo:** `src/components/grouping/ManualGrouper.tsx` línea 187

**Error:**
```
Type 'Dispatch<SetStateAction<"awareness" | "custom" | "grid" | "ranking" | "scale">>' 
is not assignable to type '(value: string) => void'.
```

**Causa:** El `Select` component de shadcn/ui espera que `onValueChange` sea `(value: string) => void`, pero `setGroupType` tiene un tipo más restrictivo basado en la unión de literales.

**Solución:** Crear un wrapper que valide el string antes de hacer el cast:

```tsx
// Cambiar línea 187 de:
<Select value={groupType} onValueChange={setGroupType}>

// A:
<Select 
  value={groupType} 
  onValueChange={(value) => {
    if (GROUP_TYPES.includes(value as typeof GROUP_TYPES[number])) {
      setGroupType(value as typeof groupType);
    }
  }}
>
```

---

## 2. Wizard de 4 Pasos (AggfileGenerator)

**Estado:** Correctamente implementado

**Verificaciones realizadas:**
- `useAggfileGenerator.ts`: Navegación funciona con array `['banners', 'stubs', 'configure', 'preview']`
- `buildConfig()` mapea correctamente el estado a `GenerateTablesConfig`
- Los endpoints correctos se llaman:
  - Preview: `POST /projects/{id}/generate-tables/preview`
  - Generate: `POST /projects/{id}/generate-tables`  
  - Export: `POST /projects/{id}/generate-tables/export`
- `ConfigureStep` y `PreviewStep` reciben los props correctos
- Los tipos en `src/types/aggfile.ts` están completos

**No requiere cambios.**

---

## 3. CompareMeansChart

**Estado:** Correctamente implementado

**Verificaciones realizadas:**
- `ChartWithTable.tsx` línea 68-69: Renderiza `CompareMeansChart` cuando `chart_type === 'compare_means'`
- El ícono `BarChart3` está configurado para el tipo `compare_means` (línea 88-89)
- El componente usa `ErrorBar` de Recharts para mostrar ±SD
- Tipos actualizados en `database.ts` con `error_bars?: number[]`

**No requiere cambios.**

---

## 4. Variable Grouping

**Estado:** Componentes implementados pero NO integrados a las rutas

**Verificaciones realizadas:**
- Componentes compilan correctamente (excepto el error en ManualGrouper ya mencionado)
- Hook `useVariableGroups` tiene todos los métodos necesarios
- Traducciones en `translations.ts` sección `grouping` están completas

**Integración necesaria:** Agregar a la página ProjectDetail o crear una nueva tab/sección

---

## 5. Post-Query Refinement

**Estado:** Correctamente implementado

**Verificaciones realizadas:**
- `RefineActions.tsx` muestra botones contextuales basados en el tipo de análisis
- `useChat.ts` tiene la mutación `refineMessage` que llama al endpoint correcto
- `ChatMessage.tsx` renderiza `RefineActions` cuando hay análisis y existe `onRefine`
- `ProjectChat.tsx` maneja `handleRefine` y lo pasa a los componentes

**No requiere cambios.**

---

## 6. Wave Comparison

**Estado:** Componentes implementados pero NO integrados a las rutas

**Verificaciones realizadas:**
- `WaveManager.tsx` y `WaveComparisonChart.tsx` están completos
- Hook `useWaves` tiene todos los métodos (fetchWaves, createWave, updateWave, deleteWave, compareWaves)
- Traducciones en `translations.ts` sección `waves` están completas

**Integración necesaria:** Agregar a ProjectDetail con acceso a `availableFiles` y `availableVariables`

---

## 7. Traducciones i18n

**Estado:** Correctamente implementadas

**Verificaciones realizadas:**
- Secciones `grouping`, `refine`, `waves` agregadas en español e inglés
- Se usa optional chaining (`t.grouping?.xxx`) con fallbacks en español

**No requiere cambios.**

---

## Cambios a Implementar

### Cambio 1: Fix Error de Compilación en ManualGrouper

**Archivo:** `src/components/grouping/ManualGrouper.tsx`

Modificar la línea 187 para agregar validación de tipo:

```tsx
<Select 
  value={groupType} 
  onValueChange={(value) => {
    if (GROUP_TYPES.includes(value as any)) {
      setGroupType(value as 'awareness' | 'custom' | 'grid' | 'ranking' | 'scale');
    }
  }}
>
```

### Cambio 2: Integrar Variable Groups en ProjectDetail

**Archivo:** `src/pages/ProjectDetail.tsx`

Agregar una nueva sección después de los archivos que muestre el `VariableGroupsManager`:

1. Importar el componente:
```tsx
import { VariableGroupsManager } from '@/components/grouping';
```

2. Obtener las variables disponibles del proyecto (usar un nuevo hook o extraer de files)

3. Agregar una nueva Card con el componente:
```tsx
{hasReadyFiles && (
  <Card>
    <CardHeader>
      <CardTitle>Variable Groups</CardTitle>
    </CardHeader>
    <CardContent>
      <VariableGroupsManager 
        projectId={projectId!} 
        availableVariables={variableNames} 
      />
    </CardContent>
  </Card>
)}
```

### Cambio 3: Integrar Wave Manager en ProjectDetail

**Archivo:** `src/pages/ProjectDetail.tsx`

Agregar una sección para el `WaveManager` (solo visible si el proyecto es tracking):

1. Importar el componente:
```tsx
import { WaveManager } from '@/components/waves';
```

2. Agregar la sección condicionalmente:
```tsx
{project.is_tracking && hasReadyFiles && (
  <Card>
    <CardHeader>
      <CardTitle>Waves / Tracking</CardTitle>
    </CardHeader>
    <CardContent>
      <WaveManager 
        projectId={projectId!} 
        availableFiles={files.map(f => ({ id: f.id, name: f.name }))} 
        availableVariables={variableNames} 
      />
    </CardContent>
  </Card>
)}
```

### Cambio 4: Crear hook para obtener nombres de variables

**Archivo nuevo:** `src/hooks/useProjectVariables.ts`

Para obtener la lista de variables disponibles del proyecto, necesitamos crear un hook o usar un endpoint existente:

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProjectVariables(projectId: string) {
  return useQuery({
    queryKey: ['project-variables', projectId],
    queryFn: () => api.get<{ variables: string[] }>(
      `/projects/${projectId}/exports/analysis-variables`
    ).then(res => res.variables.map(v => v.name)),
    enabled: !!projectId,
  });
}
```

Alternativa: Usar el endpoint existente de `analysis-variables` que ya se usa en el AggfileGenerator.

---

## Secuencia de Implementación

1. **Fix del error de compilación** (ManualGrouper.tsx) - bloqueante
2. **Crear hook useProjectVariables** (si es necesario)
3. **Integrar VariableGroupsManager** en ProjectDetail
4. **Integrar WaveManager** en ProjectDetail (condicional a is_tracking)

---

## Detalle Técnico

### Dependencias de datos para la integración:

Para `VariableGroupsManager`:
- `projectId`: Disponible desde `useParams()`
- `availableVariables`: Array de strings con nombres de variables. Opciones:
  - Usar `/projects/{id}/exports/analysis-variables` (devuelve `AnalysisVariable[]`)
  - Mapear a `string[]` extrayendo el campo `name`

Para `WaveManager`:
- `projectId`: Disponible desde `useParams()`
- `availableFiles`: Mapear desde `files` existente a `{ id, name }`
- `availableVariables`: Mismo que arriba

### Consideraciones de UX:

- VariableGroupsManager debería aparecer solo cuando el proyecto está `ready`
- WaveManager debería aparecer solo cuando `project.is_tracking === true`
- Ambos componentes pueden colapsar en Accordions para no ocupar mucho espacio en ProjectDetail
