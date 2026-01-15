# Survey Genius

## Descripción

Plataforma SaaS para investigadores de mercado que permite subir archivos SPSS, chatear con los datos usando IA y generar reportes en PDF, Excel y PowerPoint.

## Stack Técnico

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Railway)
- **APIs**: Claude AI (análisis de datos), OpenAI (embeddings)
- **Base de datos**: Supabase (PostgreSQL) - Auth, perfiles, metadatos de proyectos
- **Almacenamiento**: AWS S3 (archivos SPSS, PDFs generados) via Railway backend
- **Autenticación**: Supabase Auth (email/password, OAuth)

## Funcionalidades Actuales

- [x] Autenticación de usuarios (login/registro)
- [x] Gestión de proyectos (crear, editar, eliminar)
- [x] Subida de archivos SPSS (.sav)
- [x] Subida de cuestionarios (PDF/texto)
- [x] Chat con datos usando IA (preguntas en lenguaje natural)
- [x] Visualización de gráficos (barras, líneas, donut, gauge NPS, etc.)
- [x] Generación de Executive Summary automático
- [x] Múltiples conversaciones por proyecto
- [x] Exportación a PDF, Excel y PowerPoint
- [x] Configuración de contexto del estudio (objetivo, país, industria, metodología)
- [x] Soporte multiidioma (español/inglés)
- [x] Tema claro/oscuro

## Estructura de Base de Datos (Supabase)

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Datos de usuario (nombre, email, avatar, empresa, rol) |
| `projects` | Proyectos de investigación (nombre, descripción, estado) |
| `project_files` | Archivos subidos (SPSS, PDFs) - metadatos |
| `chat_sessions` | Conversaciones por proyecto |
| `chat_messages` | Mensajes de cada conversación |
| `exports` | Exportaciones generadas (PDF, Excel, PPTX) |

## Endpoints / Flujos Principales

### Flujo de Proyecto
1. Usuario crea proyecto → Se guarda en Supabase
2. Usuario sube archivo SPSS → Frontend envía a `/api/projects/{id}/files` (Railway)
3. Backend procesa SPSS → Extrae variables, casos, metadatos
4. Usuario configura contexto del estudio → Se actualiza en Railway

### Flujo de Chat
1. Usuario envía pregunta → `POST /api/analysis/projects/{id}/query`
2. Backend analiza con Claude AI → Ejecuta análisis estadístico
3. Respuesta incluye texto + gráficos (chart_type, data, table)
4. Frontend renderiza gráficos con Recharts

### Flujo de Executive Summary
1. Usuario solicita resumen → `POST /api/analysis/projects/{id}/summary`
2. Backend genera resumen con IA → Key findings, metodología
3. Frontend muestra con Markdown + permite regenerar

### Flujo de Exportación
1. Usuario selecciona contenido (Summary/Conversación) + formato
2. `POST /api/exports` con project_id, conversation_id, format
3. Backend genera archivo → Guarda en S3
4. Frontend descarga desde URL firmada

## API Endpoints (Railway Backend)

```
# Proyectos
GET    /api/projects
POST   /api/projects
GET    /api/projects/{id}
PATCH  /api/projects/{id}
DELETE /api/projects/{id}

# Archivos
POST   /api/projects/{id}/files
GET    /api/projects/{id}/files
DELETE /api/projects/{id}/files/{file_id}

# Conversaciones
GET    /api/projects/{id}/conversations
POST   /api/projects/{id}/conversations
DELETE /api/conversations/{id}

# Análisis
POST   /api/analysis/projects/{id}/query
GET    /api/analysis/projects/{id}/summary
POST   /api/analysis/projects/{id}/summary

# Exportaciones
GET    /api/exports?project_id={id}
POST   /api/exports
DELETE /api/exports/{id}
```

## Tipos de Gráficos Soportados

| Tipo | Componente | Uso |
|------|------------|-----|
| `bar` / `vertical_bar` | `VerticalBarChart` | Comparaciones categóricas |
| `horizontal_bar` | `HorizontalBarChart` | Rankings, listas largas |
| `line` | `LineChart` | Tendencias temporales |
| `donut` / `pie` | `DonutChart` | Distribuciones porcentuales |
| `nps_gauge` | `NpsGauge` | Net Promoter Score |

## Limitaciones Conocidas

- Tamaño máximo de archivo SPSS: Definido por backend (Railway)
- Límite de tokens por consulta: Depende del modelo Claude
- No soporta archivos Excel directamente (solo SPSS .sav)
- Executive Summary requiere datos procesados primero
- Exportaciones dependen de disponibilidad del backend
- No hay colaboración en tiempo real entre usuarios

## Integraciones Previstas

- [ ] Alchemer (importación de encuestas)
- [ ] SurveyMonkey
- [ ] Qualtrics
- [ ] Google Forms

## Variables de Entorno

### Frontend (Supabase)
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_PUBLISHABLE_KEY` - Clave anon de Supabase

### Backend (Railway) - Requeridas
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` - Para Claude AI
- `AWS_ACCESS_KEY_ID` - Para S3
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

## Arquitectura de Comunicación

```
┌─────────────────┐     JWT Token      ┌─────────────────┐
│                 │ ─────────────────► │                 │
│   Frontend      │                    │  Railway API    │
│   (React/Vite)  │ ◄───────────────── │  (FastAPI)      │
│                 │    JSON Response   │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ Auth/Metadata                        │ Files/AI
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│    Supabase     │                    │    AWS S3       │
│   (PostgreSQL)  │                    │   (Storage)     │
└─────────────────┘                    └─────────────────┘
```

## Notas de Desarrollo

- El frontend usa `src/lib/api.ts` como cliente HTTP centralizado
- Los JWT de Supabase se envían automáticamente al backend Railway
- Los tipos de base de datos están en `src/types/database.ts` (sincronizados manualmente)
- Los gráficos usan colores del design system (`src/lib/chartColors.ts`)
- Traducciones en `src/i18n/translations.ts` (ES/EN)
