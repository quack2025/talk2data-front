

## Plan: Corregir bordes cortados en inputs del diálogo "Create Project"

### Problema Identificado

En la captura de pantalla se observa que los bordes de las cajas de texto (Input y Textarea) aparecen cortados en los lados izquierdo y derecho. Esto ocurre porque:

1. El `ScrollArea` solo tiene `pr-4` (padding derecho) para la barra de scroll
2. No hay padding en el lado izquierdo ni en la parte superior/inferior
3. Cuando un input tiene focus, su `ring` (anillo de enfoque) se extiende más allá del borde y queda recortado por el `overflow-hidden` del contenedor

### Solución Propuesta

Modificar el padding del `ScrollArea` para que tenga espacio en ambos lados, permitiendo que los bordes y el focus ring de los inputs se muestren completamente.

### Cambios Técnicos

**Archivo:** `src/components/projects/CreateProjectDialog.tsx`

Cambiar el className del ScrollArea de:
```tsx
<ScrollArea type="always" className="flex-1 min-h-0 pr-4">
  <div className="space-y-4">
```

A:
```tsx
<ScrollArea type="always" className="flex-1 min-h-0">
  <div className="space-y-4 px-1">
```

Este cambio:
- Elimina el `pr-4` del ScrollArea (ya que el componente ScrollArea maneja internamente el espacio para la barra de scroll)
- Añade `px-1` al contenedor interior para dar un pequeño margen horizontal que permita ver los bordes y focus rings completos

### Alternativa más conservadora

Si la barra de scroll se ve muy pegada al contenido:
```tsx
<ScrollArea type="always" className="flex-1 min-h-0 -mr-4 pr-4">
  <div className="space-y-4 px-1">
```

Esto usa margin negativo para expandir el área del scroll mientras mantiene el padding visual.

