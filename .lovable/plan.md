
## Compactar el grid de análisis: 2 columnas → 3 columnas con descripción en tooltip

### Qué cambia visualmente

Actualmente cada botón tiene dos líneas de texto:
- Línea 1: icono + label + badge (✓ o candado)
- Línea 2: descripción en gris (`text-[11px]`)

Esto hace que cada botón mida ~52px de altura y 10 tipos en 2 columnas = 5 filas × 52px = **260px de grid**, que requiere scroll en paneles compactos.

### Solución propuesta: 3 columnas + descripción en tooltip

- Cambiar `grid-cols-2` → `grid-cols-3`
- Eliminar la línea de descripción del botón (la `<p>` con `text-[11px]`)
- Mover la descripción a un `Tooltip` que aparece al hacer hover sobre el botón
- Reducir padding de `py-2` → `py-1.5`
- Resultado: 10 tipos en 4 filas (3+3+3+1) a ~38px c/u = **~152px de grid total**, sin scroll

### Diseño resultante

```text
┌─────────────┬─────────────┬─────────────┐
│ ▣ Frecuencia│ ▤ Cruzada   │ ≎ Cruce+sig │
├─────────────┼─────────────┼─────────────┤
│ ↗ Media     │ ≎ Comp.Med  │ ★ NPS       │
├─────────────┼─────────────┼─────────────┤
│ ⊖ Net Score │ ☑ Resp.Mult │ Σ Regresion 🔒│
├─────────────┴─────────────┴─────────────┤
│            ⧉ Anal.Factorial 🔒           │
└─────────────────────────────────────────┘
```

Cada botón al hover muestra un tooltip con la descripción (ej: "Cruce entre dos variables").

### Cambios técnicos — solo `AnalysisPanel.tsx`

**1. Importar `Tooltip`** (ya está disponible en el proyecto):
```tsx
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
```

**2. Cambiar el grid** (línea 253):
```tsx
// Antes:
<div className="grid grid-cols-2 gap-1.5">
// Después:
<div className="grid grid-cols-3 gap-1.5">
```

**3. Envolver cada botón en Tooltip y eliminar la descripción** (líneas 259-291):
```tsx
<TooltipProvider key={typeDef.id}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={...}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-all text-sm w-full',
          isSelected ? '...' : '...'
        )}
      >
        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', ...)} />
        <div className="min-w-0 flex items-center gap-1 flex-1">
          <span className="font-medium text-xs truncate">
            {typeDef.label[language] || typeDef.label.en}
          </span>
          {isSuggested && <Badge ...>✓</Badge>}
          {typeDef.isPremium && <Lock className="h-3 w-3 text-amber-500 flex-shrink-0" />}
        </div>
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      {typeDef.description[language] || typeDef.description.en}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Resumen de cambios

| Archivo | Qué cambia |
|---|---|
| `src/components/explore/AnalysisPanel.tsx` | `grid-cols-2` → `grid-cols-3`, eliminar `<p>` descripción, envolver en `Tooltip`, reducir padding a `py-1.5` e iconos a `h-3.5 w-3.5`, fuente del label a `text-xs` |

Un solo archivo, cambio quirúrgico. No se toca el backend, hooks ni tipos.
