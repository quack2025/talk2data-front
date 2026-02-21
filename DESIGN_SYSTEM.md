# DESIGN_SYSTEM.md — Genius Labs AI Suite
> **Fuente de verdad para todos los agentes y desarrolladores.**  
> Versión 1.0 · Febrero 2026  
> Este archivo debe existir en la raíz de TODOS los repositorios frontend.

---

## 1. Principio Rector

> Los analistas deben pasar más tiempo analizando, no preparando datos.

Todo diseño debe:
- **Automatizar** la preparación → ✅
- **No automatizar** el análisis → ❌
- Dejar espacio para que el analista "brille" con su interpretación

---

## 2. Stack (igual en todos los productos)

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + Vite + TypeScript |
| UI Components | shadcn/ui (Radix primitives) |
| Styling | Tailwind CSS — solo utility classes, sin CSS custom |
| Auth | Supabase Auth |
| Deploy | Lovable (auto-deploy desde `main`) |
| Iconos | lucide-react únicamente |
| Toast | sonner — `toast.success()` / `toast.error()` / `toast.loading()` |
| Forms | react-hook-form + zod |

**CRÍTICO:** Nunca eliminar `.env` del git. Lovable lee `VITE_*` del `.env` commiteado.

---

## 3. Design Tokens — `src/index.css`

Estos valores deben existir en el `:root` de TODOS los productos. Ajustar solo si el producto tiene color primario diferente (ej. Voice Capture puede usar otro primary si aplica).

```css
:root {
  /* Brand */
  --primary: 213 94% 39%;           /* #1E40AF — azul Genius Labs */
  --primary-foreground: 0 0% 100%;

  /* Superficie */
  --background: 0 0% 100%;
  --foreground: 220 14% 10%;        /* #111827 */
  --muted: 220 9% 96%;              /* #F3F4F6 */
  --muted-foreground: 220 9% 46%;   /* #6B7280 */

  /* Bordes */
  --border: 220 13% 91%;            /* #E5E7EB */
  --input: 220 13% 91%;
  --ring: 213 94% 39%;

  /* Cards */
  --card: 0 0% 100%;
  --card-foreground: 220 14% 10%;

  /* Semánticos — OBLIGATORIOS */
  --success: 160 84% 39%;           /* #059669 — emerald-600 */
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;            /* #D97706 — amber-600 */
  --warning-foreground: 0 0% 100%;
  --destructive: 0 72% 51%;         /* #DC2626 — red-600 */
  --destructive-foreground: 0 0% 100%;

  /* Sidebar */
  --sidebar-bg: 222 47% 11%;        /* #0F172A — slate-900 */
  --sidebar-foreground: 215 28% 82%;
  --sidebar-active-bg: 213 94% 39%; /* mismo que --primary */
  --sidebar-active-foreground: 0 0% 100%;
  --sidebar-hover-bg: 217 33% 17%;  /* slate-800 */
}
```

### Clases Tailwind permitidas para colores semánticos

```
text-foreground           → texto principal
text-muted-foreground     → texto secundario, labels, metadata
bg-muted                  → fondos secundarios, filas alternas
text-primary              → links, activos, acciones
bg-primary                → botones primarios, badges activos
text-destructive          → errores, acciones de eliminar
bg-destructive/10         → fondo de badge de error
text-[--success]          → estados completados ← usar CSS var directamente
text-[--warning]          → advertencias, créditos bajos
border-border             → bordes estándar
```

---

## 4. Layout — Reglas Fijas

### 4.1 DashboardLayout

```
┌────────────────────────────────────────────────────────────┐
│  AppSidebar (w-64, fixed, bg-[--sidebar-bg])               │
│  ┌──────────────────────────────────────────┐              │
│  │  [LOGO BLOCK] Logo + Nombre del Producto │  ← fijo top  │
│  │  bg-white, rounded-lg, m-3, p-3          │              │
│  │  Logo: 32x32px · Nombre: font-semibold   │              │
│  ├──────────────────────────────────────────┤              │
│  │  NAV ITEMS                                │              │
│  │  Ícono (20px) + Label · active=primary   │              │
│  │  hover:bg-[--sidebar-hover-bg]           │              │
│  ├──────────────────────────────────────────┤              │
│  │  [USER SECTION] ← siempre al fondo       │              │
│  │  Avatar · Nombre · Role                  │              │
│  │  PlanBadge · CreditIndicator (si aplica) │              │
│  │  LanguageSwitcher · Logout               │              │
│  └──────────────────────────────────────────┘              │
│                                                            │
│  Main Content (ml-64)                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  p-4 md:p-8                                          │  │
│  │  Breadcrumb (si aplica) + Page Title + CTAs          │  │
│  │  [Contenido de la página]                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  HelpChatWidget (fixed bottom-right, z-50)                 │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Reglas de Layout

| Elemento | Valor | Obligatorio |
|----------|-------|-------------|
| Sidebar width | `w-64` (256px) fijo | ✅ |
| Logo container width | `w-64` — mismo que sidebar | ✅ |
| Logo size | 32×32px | ✅ |
| Page padding | `p-4 md:p-8` | ✅ |
| Detail pages max-width | `max-w-4xl mx-auto` | ✅ |
| User section position | Bottom del sidebar, siempre | ✅ |
| HelpChat position | `fixed bottom-6 right-6` | ✅ |
| Mobile sidebar | Slide-in con backdrop overlay | ✅ |
| Status badges | `whitespace-nowrap` siempre | ✅ |

### 4.3 Logo Block (componente `SidebarBrand.tsx`)

```tsx
// Estructura estándar — NO modificar la lógica, solo el logo y nombre
<div className="m-3 p-3 bg-white rounded-lg flex items-center gap-3">
  <img src={logo} alt={productName} className="w-8 h-8 object-contain" />
  <span className="font-semibold text-sm text-foreground truncate">
    {productName}
  </span>
</div>
```

**Nombres oficiales por producto:**
- `surveycoder.io` → "Survey Coder PRO"
- `talk2data.survey-genius.ai` → "Talk2data"
- `followups.survey-genius.ai` → "SurveyGenius AI"
- `audio.insightgenius.io` → "Voice Capture"

---

## 5. Páginas de Autenticación

Todas las páginas auth siguen este layout — SIN sidebar.

```tsx
// Layout wrapper estándar para auth
<div className="min-h-screen bg-muted flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    
    {/* Logo centrado arriba del card */}
    <div className="flex justify-center mb-6">
      <img src={logo} alt={productName} className="h-10 w-auto" />
    </div>

    {/* Card */}
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{t('auth.login.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Formulario */}
      </CardContent>
    </Card>

    {/* Link de navegación entre páginas auth */}
    <p className="text-center text-sm text-muted-foreground mt-4">
      {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
    </p>

  </div>
</div>
```

### Campos por página

| Página | Campos | CTA |
|--------|--------|-----|
| Login | Email, Password | "Iniciar sesión" |
| Register | Nombre, Email, Password, Confirmar password | "Crear cuenta" |
| Forgot Password | Email | "Enviar instrucciones" |
| Reset Password | Nueva password, Confirmar password | "Actualizar contraseña" |

**Login siempre incluye:** link "Olvidé mi contraseña" debajo del campo password.  
**Register siempre incluye:** checkbox de aceptación de Términos.  
**Reset Password:** redirige a `/dashboard` al completar.

---

## 6. Dashboard de Proyectos

### 6.1 Stat Cards (arriba de la lista)

**REGLA CRÍTICA:** Cada producto define sus propias métricas relevantes. No forzar las mismas columnas en todos.

| Producto | Métricas sugeridas |
|----------|--------------------|
| Survey Coder PRO | Respuestas procesadas, Accuracy promedio, Colas activas, Tiempo estimado |
| Talk2data | Archivos SPSS activos, Consultas este mes, Créditos usados, Proyectos |
| SurveyGenius AI | Proyectos activos, Requests este mes, Tasa de respuesta, Conexiones |
| Voice Capture | Grabaciones totales, Horas transcritas, Proyectos activos, Créditos usados |

Estructura del card:
```tsx
<Card>
  <CardContent className="pt-6">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
    {trend && (
      <p className="text-xs text-[--success] mt-1">{trend}</p>  // verde si positivo
    )}
  </CardContent>
</Card>
```

### 6.2 Lista de Proyectos — Tabla estándar

```
Search [___________________]          [Filter] [Sort]

PROJECT NAME    STATUS         [métrica 1]  [métrica 2]  ACTIONS
─────────────────────────────────────────────────────────────────
📁 Nombre       ● Activo       valor        valor        ···
📁 Nombre       ● En proceso   valor        valor        ···
📁 Nombre       ● Error        —            —            ···
```

**REGLA:** Las columnas de métricas (`[métrica 1]`, `[métrica 2]`) son específicas de cada producto. No copiar columnas de otro producto.

| Producto | Columna 1 | Columna 2 |
|----------|-----------|-----------|
| Survey Coder PRO | Respuestas | Accuracy Score (barra) |
| Talk2data | Archivos SPSS | Última consulta |
| SurveyGenius AI | Requests | Tasa respuesta |
| Voice Capture | Grabaciones | Duración total |

### 6.3 Estado de Proyectos — Badges

```tsx
// Siempre whitespace-nowrap. Nunca dejar que corte en dos líneas.
const statusConfig = {
  active:     { label: 'Activo',      class: 'bg-primary/10 text-primary' },
  processing: { label: 'En proceso',  class: 'bg-[--warning]/10 text-[--warning]' },
  complete:   { label: 'Completado',  class: 'bg-[--success]/10 text-[--success]' },
  archived:   { label: 'Archivado',   class: 'bg-muted text-muted-foreground' },
  error:      { label: 'Error',       class: 'bg-destructive/10 text-destructive' },
  pending:    { label: 'Pendiente',   class: 'bg-muted text-muted-foreground' },
}

<Badge className={`whitespace-nowrap ${statusConfig[status].class}`}>
  <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
  {statusConfig[status].label}
</Badge>
```

### 6.4 Progress del Proyecto

**REGLA:** El progreso se muestra según lo que es relevante para CADA producto.

| Producto | Qué muestra el progreso |
|----------|------------------------|
| Survey Coder PRO | % de respuestas codificadas (es un proceso de AI) |
| Talk2data | % de preparación de datos completada |
| SurveyGenius AI | % de configuración del proyecto |
| Voice Capture | % de grabaciones transcritas |

```tsx
// Barra de progreso estándar
<div className="flex items-center gap-2">
  <Progress value={progress} className="h-1.5 flex-1" />
  <span className="text-sm font-medium w-10 text-right">{progress}%</span>
</div>
```

### 6.5 Tabs de Filtrado

```tsx
<Tabs defaultValue="active">
  <TabsList>
    <TabsTrigger value="active">Activos ({counts.active})</TabsTrigger>
    <TabsTrigger value="archived">Archivados ({counts.archived})</TabsTrigger>
    {counts.error > 0 && (
      <TabsTrigger value="error" className="text-destructive">
        Con errores ({counts.error})
      </TabsTrigger>
    )}
  </TabsList>
</Tabs>
```

### 6.6 Empty State

```tsx
// Mismo patrón en todos los productos
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="w-12 h-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">No tienes proyectos aún</h3>
  <p className="text-muted-foreground text-sm max-w-sm mb-6">
    {productSpecificDescription}
  </p>
  <Button onClick={onCreateNew}>
    <Plus className="w-4 h-4 mr-2" />
    Crear tu primer proyecto
  </Button>
</div>
```

---

## 7. Settings — Estructura Estándar

Tabs en este orden exacto (omitir los que no apliquen al producto):

```
[Mi Cuenta] [Organización] [Miembros] [Plan y Facturación] [Notificaciones] [Seguridad] [Zona de Peligro]
```

### Tab: Mi Cuenta
- Nombre completo (editable)
- Email (solo lectura, con nota "para cambiar email contactar soporte")
- Cambio de contraseña (form separado debajo)
- Idioma preferido (Select con idiomas disponibles del producto)
- Zona horaria

### Tab: Plan y Facturación
- Card con plan actual + PlanBadge
- CreditIndicator si el producto usa créditos
- Fecha de renovación (si es suscripción)
- Botón "Cambiar plan" → `/subscription`
- Historial de facturas (si Stripe está integrado)

### Tab: Zona de Peligro
```tsx
// Siempre con AlertDialog de confirmación
<Card className="border-destructive/50">
  <CardHeader>
    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Eliminar cuenta</p>
        <p className="text-sm text-muted-foreground">
          Esta acción es permanente y no se puede deshacer.
        </p>
      </div>
      <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
        Eliminar cuenta
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 8. Componentes Transversales

### 8.1 PlanBadge

```tsx
const planStyles = {
  free:         'bg-muted text-muted-foreground',
  starter:      'bg-blue-100 text-blue-700',
  growth:       'bg-purple-100 text-purple-700',
  professional: 'bg-amber-100 text-amber-700',  // display: "Business"
  enterprise:   'bg-emerald-100 text-emerald-700',
  // Voice Capture usa: free, freelancer(=Starter), pro, enterprise
  freelancer:   'bg-blue-100 text-blue-700',
  pro:          'bg-amber-100 text-amber-700',
}
```

### 8.2 CreditIndicator

```tsx
// Regla de colores (basada en % del plan, no en número absoluto)
const getCreditColor = (used: number, total: number) => {
  const pct = used / total
  if (pct >= 0.8) return 'text-destructive'  // ≥80% usado → rojo
  if (pct >= 0.6) return 'text-[--warning]'  // ≥60% usado → amber
  return 'text-[--success]'                   // <60% usado → verde
}
```

### 8.3 Toast (sonner)

```tsx
import { toast } from 'sonner'

// Éxito
toast.success('Proyecto creado correctamente')

// Error
toast.error('Error al crear el proyecto', { description: error.message })

// Loading (para ops > 2s)
const id = toast.loading('Procesando...')
// ... al terminar:
toast.dismiss(id)
toast.success('Procesamiento completo')

// Posición: bottom-right (en Toaster component)
<Toaster position="bottom-right" />
```

### 8.4 AlertDialog para acciones destructivas

```tsx
// Patrón estándar — usar SIEMPRE para: eliminar proyecto, eliminar cuenta, remover miembro
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar "{name}"?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. Se eliminará permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 8.5 Loading States

```tsx
// En botones durante acción async
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
  {isLoading ? 'Procesando...' : 'Guardar'}
</Button>

// En listas mientras carga (NO spinner de página completa)
{isLoading ? (
  Array.from({ length: 3 }).map((_, i) => (
    <Skeleton key={i} className="h-16 w-full rounded-lg" />
  ))
) : (
  <ProjectList projects={projects} />
)}
```

### 8.6 ErrorBoundary

Todos los productos deben tener `src/components/ErrorBoundary.tsx`.  
Referencia: Voice Capture ya tiene la implementación correcta — copiar de `quack2025/genius-voice-dashboard`.

```tsx
// Fallback mínimo
<div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
  <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
  <p className="text-muted-foreground mb-6">
    Ocurrió un error inesperado. Por favor recarga la página.
  </p>
  <Button onClick={() => window.location.reload()}>
    Recargar página
  </Button>
</div>
```

---

## 9. Reglas de Desarrollo para Agentes

### Lo que SIEMPRE se debe hacer
- Usar `@/` para todos los imports
- Usar `cn()` de `lib/utils` para clases condicionales
- Usar `whitespace-nowrap` en todos los badges de status
- Usar `AlertDialog` (nunca `confirm()` del browser) para acciones destructivas
- Usar `toast` de sonner (no `useToast` de shadcn) — verificar cuál tiene el proyecto
- Testear en mobile (sidebar debe colapsar correctamente)

### Lo que NUNCA se debe hacer
- Escribir CSS custom fuera de `:root` en `index.css`
- Modificar archivos en `src/components/ui/` directamente
- Usar `window.confirm()` o `window.alert()`
- Usar `<select>` nativo — usar `Select` de shadcn
- Copiar columnas de métricas de otro producto sin validar que tienen sentido
- Hacer que un badge de status corte en dos líneas
- Poner el logo en el header o junto al título de la página

### Verificación antes de hacer PR
- [ ] CSS variables `--success` y `--warning` existen en `index.css`
- [ ] Logo en sidebar con contenedor blanco `w-64`
- [ ] User info al fondo del sidebar
- [ ] HelpChatWidget en bottom-right
- [ ] No hay `window.confirm()` en el código
- [ ] Todos los badges tienen `whitespace-nowrap`
- [ ] ErrorBoundary wrapping la app
- [ ] sonner instalado y `<Toaster position="bottom-right" />` en App.tsx

---

## 10. Checklist de Coherencia Cross-Producto

Este checklist lo usa el agente jefe para validar que todos los productos están alineados:

```
LAYOUT
[ ] Sidebar w-64 fijo en todos
[ ] Logo block: bg-white, rounded-lg, logo 32px + nombre truncate
[ ] User section al fondo del sidebar en todos
[ ] HelpChat bottom-right en todos
[ ] Page padding p-4 md:p-8 en todos

AUTH PAGES  
[ ] Layout centrado, bg-muted, card max-w-md
[ ] Logo sobre el card (no dentro)
[ ] Login tiene link "Olvidé mi contraseña"
[ ] Reset password redirige a /dashboard

DASHBOARD
[ ] Stat cards con métricas relevantes AL producto (no copiadas)
[ ] Tabla con search + filter + sort
[ ] Tabs: Activos / Archivados (mínimo)
[ ] Badges siempre whitespace-nowrap
[ ] Progress con significado correcto para cada producto
[ ] Empty state con CTA

SETTINGS
[ ] Tabs en orden: Mi Cuenta → Org → Miembros → Plan → Peligro
[ ] Zona de Peligro con AlertDialog

COMPONENTES
[ ] PlanBadge con colores correctos
[ ] CreditIndicator (donde aplique) con colores rojo/amber/verde
[ ] sonner configurado bottom-right
[ ] AlertDialog en todas las acciones destructivas
[ ] ErrorBoundary wrapping la app
[ ] Skeleton loading (no full-page spinner)

TOKENS
[ ] --success definido en index.css
[ ] --warning definido en index.css
[ ] --sidebar-bg definido en index.css
```

---

*Genius Labs AI Suite · DESIGN_SYSTEM.md · v1.0 · Febrero 2026*  
*Actualizar este archivo antes de iniciar cualquier sprint de UI.*
