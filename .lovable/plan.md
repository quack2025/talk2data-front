
## Problema identificado: Mismatch entre el formato del backend y el renderizador de crosstab

### Causa raíz (100% frontend)

El backend devuelve la tabla de crosstab como un **array de filas**:
```json
{
  "table": [
    {
      "row_value": 12532.0,
      "row_label": "Nunca había escuchado de este ingrediente...",
      "1.0": { "count": 28, "percentage": 17.8 },
      "2.0": { "count": 10, "percentage": 16.9 },
      "Total": { "count": 51, "percentage": 17.6 }
    },
    ...
  ],
  "col_value_labels": { "1.0": "Bogotá", "2.0": "Medellín", "3.0": "Cali", "4.0": "Barranquilla" }
}
```

El renderizador actual en `ResultDisplay.tsx` (línea 176-219) espera `data.table` como un **objeto anidado** `Record<string, Record<string, any>>` y hace `Object.keys(table)` — por eso sale el raw JSON en la vista fallback (el `if` de crosstab no se activa porque `data.table` es un array, y `Object.keys(array)` devuelve los índices `"0"`, `"1"`, etc., causando el caos visual que se ve en la screenshot).

### Solución: reescribir el renderizador de crosstab en `ResultDisplay.tsx`

Adaptar el bloque de crosstab para leer el nuevo formato que devuelve el backend:

1. **Detectar el formato array**: `Array.isArray(data.table)` en lugar de asumir objeto anidado.
2. **Extraer columnas dinámicamente**: tomar todas las keys de la primera fila que no sean `row_value` ni `row_label` — esas son las columnas de cruce (`"1.0"`, `"2.0"`, etc., más `"Total"`).
3. **Usar `col_value_labels`**: reemplazar los códigos numéricos (`"1.0"`) por sus etiquetas (`"Bogotá"`) en los encabezados de columna.
4. **Renderizar**: cada fila muestra `row_label` como label de fila, y cada celda muestra el `percentage` con el `count` en tooltip o entre paréntesis.
5. **Fila de Total**: la última fila (`row_value === "Total"`) se renderiza en `<tfoot>` con estilo de negrita.

### Diseño de la tabla resultante

```text
                     | Bogotá  | Medellín | Cali    | Barranquilla | Total
---------------------+---------+----------+---------+--------------+-------
Nunca había...       | 17.8%   | 16.9%    | 0.0%    | 19.4%        | 17.6%
Lo he escuchado...   | 14.0%   | 28.8%    | 33.3%   | 4.5%         | 15.2%
...
Total                | n=157   | n=59     | n=6     | n=67         | n=289
```

- Las celdas de datos muestran el `%` (porcentaje de columna, ya que el backend ya calcula column %).
- La fila Total muestra el `n` (count) en lugar de %, ya que representa el base total de cada columna.
- Si la columna tiene bajo n (warning del backend), la celda se muestra con texto en color naranja/muted.

### Cambios técnicos

**Solo un archivo: `src/components/explore/ResultDisplay.tsx`**

Reemplazar el bloque `if (analysisType === 'crosstab' || ...)` (líneas 175-220) por una nueva implementación que:

```tsx
// Nuevo renderizador de crosstab
if ((analysisType === 'crosstab' || analysisType === 'crosstab_with_significance') && data.table) {
  
  // El backend devuelve un array de filas
  const rows = data.table as Record<string, any>[];
  if (!rows.length) return <p>No data</p>;

  // Separar fila Total del resto
  const dataRows = rows.filter(r => r.row_value !== 'Total');
  const totalRow = rows.find(r => r.row_value === 'Total');

  // Columnas: todas las keys excepto row_value y row_label
  const colKeys = Object.keys(rows[0]).filter(k => k !== 'row_value' && k !== 'row_label');

  // Labels de columna desde col_value_labels (o el code si no existe)
  const colLabels = data.col_value_labels ?? {};

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-3 font-medium w-[40%]"></th>
          {colKeys.map(col => (
            <th key={col} className="text-right py-2 px-3 font-medium text-xs">
              {colLabels[col] ?? col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row, i) => (
          <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
            <td className="py-1.5 px-3 text-xs">{row.row_label}</td>
            {colKeys.map(col => {
              const cell = row[col];
              const pct = cell?.percentage ?? cell?.pct ?? cell;
              const sig = cell?.sig ?? null;
              return (
                <td key={col} className="text-right py-1.5 px-3 tabular-nums text-xs">
                  {typeof pct === 'number' ? pct.toFixed(1) + '%' : '-'}
                  {sig && <span className="text-[10px] text-primary ml-0.5 font-bold">{sig}</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      {totalRow && (
        <tfoot>
          <tr className="border-t font-medium bg-muted/30">
            <td className="py-1.5 px-3 text-xs">Total (n)</td>
            {colKeys.map(col => {
              const cell = totalRow[col];
              return (
                <td key={col} className="text-right py-1.5 px-3 tabular-nums text-xs">
                  {cell?.count ?? '-'}
                </td>
              );
            })}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
```

### Resumen

| Archivo | Líneas afectadas | Qué cambia |
|---|---|---|
| `src/components/explore/ResultDisplay.tsx` | 175–220 | Reemplazar renderizador de crosstab para leer el formato array que devuelve el backend, usando `row_label` como label de fila y `col_value_labels` para los encabezados de columna |

El backend está correcto. Solo se modifica el renderizador frontend. No hay cambios en hooks, tipos, ni otros componentes.
