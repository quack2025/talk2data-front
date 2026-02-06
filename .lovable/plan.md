

## Plan: Data Preparation (Preparacion de Datos)

### Resumen

Nueva seccion en la pagina de detalle del proyecto que permite al usuario gestionar reglas de preparacion de datos (cleaning, weight, net, recode, computed). Incluye crear, editar, eliminar, reordenar y activar/desactivar reglas, ademas de una vista previa del impacto.

### Archivos a crear

**1. `src/types/dataPrep.ts`** - Tipos TypeScript
- `DataPrepRule`, `DataPrepRuleCreate`, `DataPrepPreviewResponse`, `DataPrepSummary`
- Tipo union para `rule_type`: `'cleaning' | 'weight' | 'net' | 'recode' | 'computed'`

**2. `src/hooks/useDataPrep.ts`** - Hook de API
- Sigue el patron de `useWaves.ts` (useState + callbacks)
- Funciones: `fetchRules`, `createRule`, `updateRule`, `deleteRule`, `reorderRules`, `previewRules`, `fetchSummary`
- Todas llaman a `api.get/post/put/delete` con ruta `/projects/{projectId}/data-prep`

**3. `src/components/dataprep/DataPrepManager.tsx`** - Componente principal
- Props: `projectId: string`
- Lista de reglas con drag-reorder visual (usando botones arriba/abajo para simplicidad, sin libreria de drag)
- Toggle de activar/desactivar por regla (Switch)
- Botones de editar y eliminar por regla
- Boton "Preview" que muestra el impacto (filas afectadas, columnas nuevas, warnings)
- Badge con el resumen de reglas activas

**4. `src/components/dataprep/DataPrepRuleDialog.tsx`** - Dialog crear/editar regla
- Formulario con nombre, tipo de regla (Select), configuracion (JSON editor basico con Textarea), y toggle activo
- Sigue el patron del dialog de WaveManager

**5. `src/components/dataprep/DataPrepPreview.tsx`** - Componente de vista previa
- Muestra: filas originales, filas finales, filas afectadas, columnas agregadas, warnings
- Card con estadisticas y lista de advertencias

**6. `src/components/dataprep/index.ts`** - Barrel export

### Archivos a modificar

**7. `src/pages/ProjectDetail.tsx`**
- Importar `DataPrepManager`
- Agregar nueva seccion Card entre "Variable Groups" y "Wave Manager" (visible solo cuando `hasReadyFiles`)
- Icono: `Wrench` o `SlidersHorizontal` de lucide-react

**8. `src/i18n/translations.ts`**
- Agregar bloque `dataPrep` en ambos idiomas (es/en) con textos para: titulo, descripcion, tipos de regla, botones, mensajes de preview, confirmacion de eliminacion

### Detalles tecnicos

- **Patron de hook**: useState + useCallback (igual que `useWaves.ts`), no useQuery/TanStack para consistencia
- **Reordenar**: Botones de flecha arriba/abajo que llaman a `PUT /data-prep/reorder` con el array de IDs reordenado
- **Toggle activo**: Llama a `PUT /data-prep/{ruleId}` con `{ is_active: !current }`
- **Preview**: `POST /data-prep/preview` sin body (dry-run de todas las reglas activas)
- **Config editor**: Textarea con JSON, validacion basica de parse antes de enviar
- **Tipos de regla con iconos**:
  - cleaning: `Eraser`
  - weight: `Scale`
  - net: `Network`
  - recode: `ArrowLeftRight`
  - computed: `Calculator`

