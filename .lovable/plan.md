

## Plan: Reorganizar ProjectDetail con navegacion por tabs

### Diagnostico actual

La pagina actual tiene ~600 lineas y muestra 8+ secciones en scroll vertical continuo. El usuario debe hacer scroll extenso para llegar a Data Preparation (que es obligatorio) y luego volver arriba para las Quick Actions. Esto rompe el flujo logico.

### Propuesta: Header fijo + Tabs internos

En lugar de crear rutas separadas (que fragmentarian demasiado la experiencia y perderian contexto), la mejor opcion es un **header fijo con tabs** que organicen el contenido en paneles. Esto da visibilidad sin scroll excesivo y mantiene la navegacion dentro del proyecto coherente.

```text
+------------------------------------------+
| Breadcrumb                               |
| Header (nombre, status, botones)         |
| Banner Data Readiness (si pending)       |
+------------------------------------------+
| [Resumen] [Datos] [Contexto] [Archivos]  |  <-- Tabs
+------------------------------------------+
|                                          |
|  Contenido del tab activo                |
|                                          |
+------------------------------------------+
```

### Distribucion de tabs

**Tab 1 - Resumen (default)**
- Quick Actions (Chat, Tables, Export, Settings) - como cards compactos en una fila
- Executive Summary preview
- Badge de estado de Data Prep (link al tab Datos)

**Tab 2 - Datos**
- Data Preparation (con gate de confirmacion)
- Variable Groups
- Waves (si aplica)

**Tab 3 - Contexto**
- Study Context (objetivo, pais, industria, metodologia, etc.)
- Link a Settings para editar

**Tab 4 - Archivos**
- Lista de archivos del proyecto
- Boton de upload

### Beneficios vs pantallas separadas

| Criterio | Tabs (propuesto) | Rutas separadas |
|----------|-----------------|-----------------|
| Contexto del proyecto | Siempre visible en header | Se pierde al navegar |
| Velocidad de navegacion | Instantanea (sin carga) | Requiere fetch por ruta |
| Complejidad de codigo | Moderada (1 archivo) | Alta (4+ archivos nuevos) |
| Visibilidad de Data Prep | 1 clic (tab "Datos") | 1 clic (ruta dedicada) |
| Mobile | Tabs scrolleables | Mejor en teoria |

### Seccion tecnica

**Archivo: `src/pages/ProjectDetail.tsx`**

Cambios principales:

1. **Estructura general**: El header (breadcrumb, nombre, status, botones, banner) permanece fuera de los tabs, siempre visible. El contenido debajo se organiza con el componente `Tabs` de shadcn/ui.

2. **Tabs component**: Usar `Tabs` con `TabsList` y `TabsTrigger` para las 4 pestanas. El tab activo por defecto sera "overview" (Resumen).

3. **Tab "Resumen" (overview)**:
   - Quick Actions grid (las 5 cards actuales)
   - Executive Summary preview card
   - Un mini-badge o link que indica el estado de Data Prep con enlace al tab "data"

4. **Tab "Datos" (data)**:
   - DataPrepManager (con su gate de confirmacion incluido)
   - VariableGroupsManager
   - WaveManager (condicional si `project.is_tracking`)

5. **Tab "Contexto" (context)**:
   - Study Context card (objetivo, pais, industria, etc.)
   - Boton para ir a Settings a editar

6. **Tab "Archivos" (files)**:
   - File list con upload button
   - Mismo contenido actual de la seccion Files

7. **Logica del banner**: El banner de Data Readiness permanece fuera de los tabs (entre header y tabs), siempre visible cuando `dataPrepStatus === 'pending'`. Se le agrega un boton CTA "Ir a preparacion" que cambia el tab activo a "data".

8. **Estado del tab activo**: Usar `useState` para controlar el tab activo. El CTA del banner hara `setActiveTab('data')`.

9. **Indicador en tab**: El tab "Datos" mostrara un punto de color (amber si pending, green si confirmed) para indicar el estado sin entrar al tab.

**Archivo: `src/i18n/translations.ts`**

Agregar claves para los nombres de los tabs:
- `projectDetail.tabOverview` / "Resumen" / "Overview"
- `projectDetail.tabData` / "Datos" / "Data"
- `projectDetail.tabContext` / "Contexto" / "Context"
- `projectDetail.tabFiles` / "Archivos" / "Files"
- `projectDetail.goToDataPrep` / "Ir a preparacion" / "Go to data prep"

No se crean archivos nuevos. Todo se reorganiza dentro del mismo `ProjectDetail.tsx` usando el componente `Tabs` ya disponible en el proyecto.

