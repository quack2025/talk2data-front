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
