# Cross-Product Context -- Genius Labs AI Suite

## The Suite
Talk2Data (Survey Genius Pro) is one of 4 products in the Genius Labs AI Suite. All share:
- Unified design system (HSL tokens, primary #1E40AF, Genius Labs logo)
- Consistent sidebar hierarchy (Core Zone + Folders + Account Zone)
- shadcn/ui + Tailwind CSS + Lucide icons
- Lovable deployment (auto-deploy from main, .env must stay in git)
- Supabase Auth + Postgres + RLS

## The 4 Products

| Product | Repo | Purpose | Backend | Supabase ID |
|---------|------|---------|---------|-------------|
| Survey Coder Pro | survey-coder-front | AI-powered survey response coding | Railway (Express) | czqrgdgyzvsrutymjssg |
| Voice Capture | genius-voice-dashboard | Voice recording projects + transcription | Railway (Express) | hggwsdqjkwydiubhvrvq |
| SurveyGenius AI | ai-followup-front | AI follow-up questions for surveys (Alchemer) | Express (api.survey-genius.ai) | yqaginukztblnwooxmwd |
| Talk2Data | talk2data-front | Market research data analysis + AI chat | FastAPI (Railway) | icxsetsaxifssotcodul |

## GitHub Org
All repos under quack2025 on GitHub.

## Shared Sidebar Structure (all 4 products)
Logo + Product Name
-- Core Zone (product-specific nav items)
-- Separator
-- Folder Section (drag-and-drop project folders)
-- Separator
-- Account Zone (Usage, Billing, Settings)
-- User section (avatar, language, logout)

## Key Differences Between Products
- i18n: Survey Coder uses i18next (5 locales), Voice Capture/AI Followup use i18next (3 locales), Talk2Data uses custom useLanguage() hook (2 locales)
- Sidebar: Survey Coder uses shadcn Sidebar components, Talk2Data has collapsible sidebar (w-64/w-16), others use fixed aside
- Folders: Survey Coder and AI Followup scope to organization_id, Voice Capture/Talk2Data scope to user_id
- Auth: All use Supabase Auth. Survey Coder has session enforcement + encryption
- Talk2Data unique: collapsible sidebar with FolderSection supporting collapsed mode (colored dots + tooltips), folder state from URL search params (?folder=)

## UX Unification History

### Phase 1: Design System Unification (Feb 2026)
- Unified HSL-based CSS design tokens across all 4 products (primary #1E40AF)
- Genius Labs AI Suite branding with shared logo
- Consistent color palette, auth page gradients, dashboard metric cards

### Phase 2: Sidebar Hierarchy Unification (Feb 2026)
- All 4 products adopted Core Zone + Folder Section + Account Zone sidebar structure
- Consistent icons: BarChart3 (Usage), CreditCard (Billing), Settings (gear)
- Separators between zones, active state detection, i18n keys for all sidebar items

### Phase 3: QA Audit + Fixes (Feb 2026)
- Automated QA team audited all 4 products for UX consistency
- 20 issues found (8 critical, 7 major, 5 minor), 17 fixed
- Survey Coder: Sidebar restructured to show Core+Account zones on ALL pages; Language Switcher added
- Voice Capture: ~30 Portuguese accent fixes; PlanBadge/UsageBadge now use design tokens; Loader for folders
- AI Followup: OrganizationSwitcher + AdminOrganization fully i18n'd (3 locales); duplicate admin nav removed
- Talk2Data: "API Docs" translated; all fallback operators standardized to `??` with English defaults
- Commits: SC `d9b6482`, VC `dfb9eae`, AF `4ed1dbc`, T2D `b6ab6dd`

### Phase 4: Talk2Data Product QA (Feb 26-27, 2026)
- Dedicated QA audit of Talk2Data identified 23 bugs across 10 sections
- 20 bugs fixed in 4 rounds
- Round 1: Null guards, NPS gauge, lock icons, notifications (commit `9ce6bbb`)
- Round 2: Missing %, context memo, export cache, summary CTA (backend `04e5492`, frontend `d8593bf`)
- Round 3: Report timeouts, auto-naming, team sharing, a11y (backend `a0d2bb9`, frontend `5843f96`)
- Round 4: Error recovery, missing warning, wave dedup, chat export (backend `f25bba4`, frontend `26f4590`)
- 3 items deferred (B23 usage/billing requires Stripe, plus 2 wont-fix)
