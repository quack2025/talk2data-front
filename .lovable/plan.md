
## Renombrar sub-tabs: "Data Table" → "Browse" y "Frequency Analysis" → "Analyze"

### Cambio único en `src/pages/ProjectDetail.tsx`

Solo hay que tocar **2 labels y 2 íconos** dentro del bloque de sub-tabs del Data Explorer (líneas ~716–729).

**Labels:**
- `'Data Table'` → `'Browse'`
- `'Frequency Analysis'` → `'Analyze'`

**Íconos** (ajuste para reflejar la acción, no el objeto):
- `<Table2>` → `<Eye />` — Browse = mirar/inspeccionar registros
- `<BarChart3>` → `<BarChart3 />` — Analyze = estadísticas (se queda igual, ya es apropiado)

Adicionalmente, los fallbacks de i18n también se actualizan para que coincidan en caso de que las claves de traducción no existan:
- `t.dataPrep?.dataTab?.dataTabLabel || 'Data Table'` → `'Browse'`
- `t.explore?.title || 'Frequency Analysis'` → `'Analyze'`

### Resultado visual

```text
[Data Explorer]
┌──────────┬──────────┐
│  👁 Browse │ 📊 Analyze │
└──────────┴──────────┘
```

- **Browse**: el usuario está navegando los registros crudos de su base de datos.
- **Analyze**: el usuario está ejecutando análisis estadísticos (frecuencias, cruces, medias).

### Resumen

| Archivo | Líneas | Qué cambia |
|---|---|---|
| `src/pages/ProjectDetail.tsx` | ~720–728 | Label "Data Table" → "Browse"; ícono `Table2` → `Eye`; label "Frequency Analysis" → "Analyze" |

Un solo archivo, un solo bloque, cambio cosmético puro.
