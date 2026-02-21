# Survey Genius Pro

## Propuesta de Valor

> **El motor de procesamiento que permite a las agencias de investigación de mercados entregar más estudios con el mismo equipo.**

Pipeline: `Sube el .sav → datos preparados automáticamente → tablas generadas → reporte listo para el cliente`

### ICP Primario
Agencias de investigación de mercados: Director de operaciones, Head of Data, analista senior. Dolor concreto: 3-5 días de procesamiento → 3-5 horas.

### ICP Secundario
Áreas in-house desarrolladas que ya hacen estudios propios y necesitan capacidad de procesamiento.

### Lo que NO somos
- No reemplazamos SPSS (trabajamos encima del workflow existente)
- No generamos números con IA (todos los resultados vienen de scipy/pandas con datos reales)
- No somos para usuarios sin conocimiento estadístico

## Stack Técnico

- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Railway) — branch `claude/survey-ai-chat-platform-6TzlE`
- **Base de datos**: Railway PostgreSQL (datos, exports, templates) + Supabase (auth, storage)
- **IA**: Claude AI (análisis de datos, resúmenes, reportes PPTX) + OpenAI (embeddings)
- **Almacenamiento**: Supabase Storage (archivos SPSS, PDFs, PPTX generados)
- **Autenticación**: Supabase Auth (email/password, OAuth con Google)
- **Deploy**: Lovable (frontend, auto-deploy on push) + Railway (backend)

## Funcionalidades

### Core
- [x] Autenticación de usuarios (login/registro/OAuth)
- [x] Gestión de proyectos (CRUD, estados, contexto del estudio)
- [x] Subida de archivos SPSS (.sav) + cuestionarios (PDF/Word)
- [x] Chat con datos usando IA (lenguaje natural → análisis estadístico)
- [x] Visualización de gráficos (barras, líneas, donut, NPS gauge, compare means)
- [x] Generación de Executive Summary automático
- [x] Múltiples conversaciones por proyecto
- [x] Soporte multiidioma (español/inglés)
- [x] Tema claro/oscuro

### Data Preparation (Sprint 9)
- [x] Reglas de limpieza (drop cases, filter)
- [x] Ponderación RIM (targets por variable, iteraciones configurables)
- [x] Nets / Top Box / Bottom Box
- [x] Recodificación de variables
- [x] Variables computadas (condiciones combinables)
- [x] Exclusión de columnas
- [x] Data readiness gate (confirmar antes de análisis)
- [x] IA para crear reglas en lenguaje natural
- [x] Vista de datos original vs preparado

### Variable Groups
- [x] Auto-detección de grupos por prefijo/sufijo
- [x] Creación manual de grupos con sub-grupos
- [x] Edición/eliminación de grupos

### Segments
- [x] Segmentos de audiencia reutilizables (condiciones AND)
- [x] Vista previa de filas afectadas
- [x] Filtrado automático en análisis

### Waves / Tracking
- [x] Gestión de olas de estudio
- [x] Comparación entre waves con deltas
- [x] Significancia estadística en comparaciones

### Generate Tables (Aggfile)
- [x] Wizard 4 pasos: banners → stubs → configuración → preview
- [x] Tablas cruzadas con significancia (A, B, C)
- [x] Exportación directa a Excel
- [x] Estimación de horas manuales equivalentes
- [x] Templates reutilizables

### Data Explorer
- [x] Browser de variables con búsqueda y filtros
- [x] Análisis interactivo punto a punto
- [x] Bookmarks de análisis guardados
- [x] Exportación individual a Excel

### Exportaciones
- [x] PDF (Executive Summary)
- [x] Excel (tablas cruzadas, datos)
- [x] PowerPoint (reportes de insights con AI)

### AI-Powered PPTX Reports
- [x] Pipeline: DataAssembly → Phase 1 (Opus) → Phase 2 (Sonnet) → PptxBuilder → Storage
- [x] 3 temas visuales (modern_dark, corporate_light, minimal)
- [x] 3 profundidades (compact 8-12, standard 15-25, detailed 30-45 slides)
- [x] 3 tonos narrativos (executive, workshop, academic)
- [x] Selección de conversaciones específicas
- [x] Speaker notes opcionales + apéndice de datos
- [x] Barra de progreso en tiempo real
- [x] Historial de reportes generados

### Colaboración
- [x] Equipos con roles (admin, editor, viewer)
- [x] Invitaciones por email
- [x] Share links con expiración y contraseña
- [x] API Keys programáticas (read/write/admin)

### UX
- [x] Banner de transparencia: "Todos los resultados se calculan con datos reales"
- [x] Código Python reproducible por cada análisis
- [x] Notación estándar n= para tamaño de muestra
- [x] Refinement actions (agregar significancia, cruzar, filtrar)
- [x] Help chat contextual con sugerencias por sección
- [x] Preferencias de usuario (estilo, tono, idioma, confianza)
- [x] Prompt personalizable para Executive Summary

## Arquitectura

```
┌─────────────────┐     JWT Token      ┌─────────────────┐
│   Frontend      │ ─────────────────► │  Railway API    │
│   (React/Vite)  │ ◄───────────────── │  (FastAPI)      │
│   Lovable       │    JSON Response   │                 │
└────────┬────────┘                    └───┬─────────┬───┘
         │                                 │         │
         │ Auth + Storage                  │ Data    │ AI
         ▼                                 ▼         ▼
┌─────────────────┐              ┌──────────┐ ┌───────────┐
│    Supabase     │              │ Railway  │ │ Anthropic │
│  Auth + Storage │              │ Postgres │ │ Claude AI │
└─────────────────┘              └──────────┘ └───────────┘
```

**Nota importante**: Railway PostgreSQL almacena los datos de negocio (proyectos, archivos, conversaciones, exports, templates, segments). Supabase se usa exclusivamente para autenticación (JWT) y almacenamiento de archivos (Storage buckets).

## API Endpoints (Railway Backend)

```
# Proyectos
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{id}
PATCH  /api/v1/projects/{id}
DELETE /api/v1/projects/{id}

# Archivos
POST   /api/v1/projects/{id}/files
GET    /api/v1/projects/{id}/files
DELETE /api/v1/projects/{id}/files/{file_id}

# Variables
GET    /api/v1/projects/{id}/variables

# Conversaciones
GET    /api/v1/conversations?project_id={id}
POST   /api/v1/conversations
DELETE /api/v1/conversations/{id}

# Análisis / Chat
POST   /api/v1/analysis/projects/{id}/query
GET    /api/v1/analysis/projects/{id}/summary
POST   /api/v1/analysis/projects/{id}/summary
POST   /api/v1/messages/{id}/export/excel

# Data Preparation
GET    /api/v1/projects/{id}/data-prep/rules
POST   /api/v1/projects/{id}/data-prep/rules
PATCH  /api/v1/projects/{id}/data-prep/rules/{rule_id}
DELETE /api/v1/projects/{id}/data-prep/rules/{rule_id}
POST   /api/v1/projects/{id}/data-prep/preview
POST   /api/v1/projects/{id}/data-prep/confirm
POST   /api/v1/projects/{id}/data-prep/ai

# Variable Groups
GET    /api/v1/projects/{id}/variable-groups
POST   /api/v1/projects/{id}/variable-groups
PATCH  /api/v1/projects/{id}/variable-groups/{group_id}
DELETE /api/v1/projects/{id}/variable-groups/{group_id}
POST   /api/v1/projects/{id}/variable-groups/auto-detect

# Segments
GET    /api/v1/projects/{id}/segments
POST   /api/v1/projects/{id}/segments
PATCH  /api/v1/projects/{id}/segments/{segment_id}
DELETE /api/v1/projects/{id}/segments/{segment_id}

# Waves
GET    /api/v1/projects/{id}/waves
POST   /api/v1/projects/{id}/waves
PATCH  /api/v1/projects/{id}/waves/{wave_id}
DELETE /api/v1/projects/{id}/waves/{wave_id}
POST   /api/v1/projects/{id}/waves/compare

# Generate Tables (Aggfile)
POST   /api/v1/aggfile/projects/{id}/preview
POST   /api/v1/aggfile/projects/{id}/generate

# Explore
GET    /api/v1/explore/projects/{id}/variables
POST   /api/v1/explore/projects/{id}/run
POST   /api/v1/explore/projects/{id}/export
GET    /api/v1/explore/projects/{id}/bookmarks
POST   /api/v1/explore/projects/{id}/bookmarks
DELETE /api/v1/explore/projects/{id}/bookmarks/{bookmark_id}

# Reports (PPTX)
POST   /api/v1/projects/{id}/reports/generate
GET    /api/v1/projects/{id}/reports/status/{export_id}
GET    /api/v1/projects/{id}/reports/history
GET    /api/v1/projects/{id}/reports/conversations
POST   /api/v1/report-templates
GET    /api/v1/report-templates?project_id={id}
DELETE /api/v1/report-templates/{template_id}

# Exportaciones
GET    /api/v1/exports?project_id={id}
POST   /api/v1/exports
DELETE /api/v1/exports/{id}

# Share Links
GET    /api/v1/projects/{id}/shares
POST   /api/v1/projects/{id}/shares
DELETE /api/v1/shares/{share_id}

# Teams
GET    /api/v1/teams
POST   /api/v1/teams
PATCH  /api/v1/teams/{id}
DELETE /api/v1/teams/{id}
POST   /api/v1/teams/{id}/members
DELETE /api/v1/teams/{id}/members/{member_id}

# API Keys
GET    /api/v1/api-keys
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/{key_id}

# Help Chat
POST   /api/v1/help-chat
```

## Tipos de Gráficos

| Tipo | Componente | Uso |
|------|------------|-----|
| `bar` / `vertical_bar` | `VerticalBarChart` | Comparaciones categóricas |
| `horizontal_bar` | `HorizontalBarChart` | Rankings, listas largas |
| `line` | `LineChart` | Tendencias temporales |
| `donut` / `pie` | `DonutChart` | Distribuciones porcentuales |
| `nps_gauge` | `NpsGauge` | Net Promoter Score |
| `compare_means` | `CompareMeansChart` | Medias por grupo |

## Variables de Entorno

### Frontend (.env — committed, public keys only)
- `VITE_SUPABASE_URL` — URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` — Clave anon de Supabase
- `VITE_API_BASE_URL` — URL del backend Railway

### Backend (Railway env vars)
- `DATABASE_URL` / `DATABASE_PUBLIC_URL` — Railway PostgreSQL
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Para auth verification y storage
- `ANTHROPIC_API_KEY` — Claude AI
- `OPENAI_API_KEY` — Embeddings

## Notas de Desarrollo

- El frontend usa `src/lib/api.ts` como cliente HTTP centralizado
- Los JWT de Supabase se envían automáticamente al backend Railway
- Traducciones centralizadas en `src/i18n/translations.ts` (ES/EN)
- El hook `useLanguage()` provee `t` (translations) y `language` a todos los componentes
- Los gráficos usan colores del design system (`src/lib/chartColors.ts`)
- **NUNCA remover `.env` del git** — Lovable lo necesita para el build
- Background tasks en el backend usan `async_session_maker()` para su propia sesión de DB
- El campo `metadata` en SQLAlchemy se mapea como `metadata_` (Python attr) → `metadata` (DB column)
