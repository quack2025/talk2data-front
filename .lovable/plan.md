

## Plan: Data Readiness Gate (Checkpoint antes del Chat)

### Concepto

Agregar un estado de "Data Readiness" al proyecto que actua como checkpoint obligatorio antes de poder acceder al Chat. El usuario debe pasar por Data Preparation y tomar una decision explicita: aplicar reglas o confirmar que no se necesita preparacion. Esto replica el flujo de "DP sign-off" que usan las agencias de investigacion de mercados.

NO es un wizard pesado. Es un gate ligero con dos caminos:
- **Camino rapido**: "Los datos estan listos, no necesitan preparacion" (1 clic)
- **Camino completo**: Crear reglas de limpieza/ponderacion/recodificacion y confirmar

### Flujo del usuario

```text
Upload SPSS
    |
    v
Executive Summary (auto-generado)
    |
    v
Project Detail
    |
    v
[Data Preparation section - OBLIGATORIO]
    |
    +-- Opcion A: Revisar datos, crear reglas, luego "Confirmar datos listos"
    |
    +-- Opcion B: Revisar datos, clic en "No requiere preparacion"
    |
    v
Chat DESBLOQUEADO (badge "Data Ready" visible)
```

### Cambios en la experiencia

1. **Boton de Chat bloqueado** hasta que el proyecto tenga `data_prep_status = 'confirmed'`
2. **Banner informativo** en ProjectDetail cuando el status es `pending`, guiando al usuario a Data Preparation
3. **Dos botones nuevos** en DataPrepManager:
   - "Confirmar datos listos" (cuando hay reglas activas aplicadas)
   - "No requiere preparacion" (para confirmar explicitamente que los datos estan bien tal cual)
4. **Badge visual** en el proyecto indicando el estado de preparacion

### Seccion tecnica

**1. Backend: nuevo campo en el proyecto**

El ingeniero de backend debe agregar un campo al modelo de proyecto:

- `data_prep_status`: enum con valores `'pending' | 'confirmed' | 'skipped'`
- Default: `'pending'` (se setea cuando el proyecto pasa a status `ready`)
- Endpoint: `PATCH /api/v1/projects/{project_id}` con `{ data_prep_status: 'confirmed' | 'skipped' }`

Alternativamente, si no quieren modificar el modelo de proyecto, se puede manejar con un endpoint dedicado:
- `POST /api/v1/projects/{project_id}/data-prep/confirm` (body: `{ status: 'confirmed' | 'skipped' }`)
- `GET /api/v1/projects/{project_id}/data-prep/status` (retorna el estado actual)

**2. Frontend: tipo del proyecto (`src/types/database.ts` o similar)**

Agregar `data_prep_status?: 'pending' | 'confirmed' | 'skipped'` a la interfaz del proyecto.

**3. Frontend: `src/hooks/useDataPrep.ts`**

Agregar dos funciones al hook:
- `confirmDataReady()` — llama al endpoint para marcar como `confirmed`
- `skipDataPrep()` — llama al endpoint para marcar como `skipped`
- `dataPrepStatus` — estado actual leido del proyecto

**4. Frontend: `src/components/dataprep/DataPrepManager.tsx`**

Agregar en la parte inferior de la seccion:
- Si no hay reglas: boton prominente "No requiere preparacion" + texto explicativo de por que es importante revisar
- Si hay reglas activas: boton "Confirmar datos listos"
- Si ya esta confirmado: badge verde "Datos confirmados" con opcion de reabrir

**5. Frontend: `src/pages/ProjectDetail.tsx`**

- Leer `project.data_prep_status` del objeto del proyecto
- Si es `pending`: mostrar banner amarillo/informativo arriba de las Quick Actions: "Antes de analizar, revisa y confirma la preparacion de datos"
- El boton/card de Chat: deshabilitado con tooltip "Confirma la preparacion de datos primero"
- El boton/card de Cross Tables: tambien deshabilitado (misma razon)
- Si es `confirmed` o `skipped`: todo funciona como ahora

**6. Frontend: `src/pages/ProjectChat.tsx`**

Agregar un guard al inicio: si `data_prep_status === 'pending'`, redirigir a ProjectDetail con un toast informativo. Esto previene acceso directo via URL.

**7. Frontend: `src/i18n/translations.ts`**

Nuevas claves en ambos idiomas:
- `dataPrep.confirmReady` / "Confirmar datos listos"
- `dataPrep.skipPrep` / "No requiere preparacion"  
- `dataPrep.statusPending` / "Pendiente de revision"
- `dataPrep.statusConfirmed` / "Datos confirmados"
- `dataPrep.statusSkipped` / "Sin preparacion requerida"
- `dataPrep.gateBanner` / "Revisa y confirma la preparacion de datos antes de iniciar el analisis"
- `dataPrep.gateTooltip` / "Confirma la preparacion de datos primero"
- `dataPrep.skipConfirmTitle` / "Confirmar sin preparacion?"
- `dataPrep.skipConfirmDescription` / "Al continuar sin reglas de preparacion, el analisis usara los datos tal como fueron cargados..."
- `dataPrep.reopenPrep` / "Reabrir preparacion"

### Dependencia del backend

Este feature requiere que el backend implemente el campo `data_prep_status` o el endpoint dedicado. Recomiendo coordinar con el ingeniero de backend para definir cual de las dos opciones prefieren antes de implementar el frontend.

Si quieren avanzar solo en frontend mientras tanto, se puede usar localStorage como almacenamiento temporal del estado, y despues migrar al backend cuando este listo.

