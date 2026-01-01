---
id: PHR-0003
title: Phase 3 LanguageSelector UI Integration
stage: green
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5
feature: 008-bonus-features-i18n-voice
branch: 008-bonus-features-i18n-voice
user: Claude
command: /sp.implement
labels: ["i18n", "translations", "next-intl", "context7", "urdu", "rtl", "language-selector", "ui-integration", "landing-page"]
links:
  spec: specs/008-bonus-features-i18n-voice/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - phase-5/frontend/components/organisms/TopBar.tsx
  - phase-5/frontend/components/LandingHero.tsx
  - phase-5/frontend/messages/en.json
  - phase-5/frontend/messages/ur.json
  - specs/008-bonus-features-i18n-voice/tasks.md
tests:
  - none
---

## Prompt

/sp.implement use the context7 mcp server for the documentation and read the planing research data model this all specs files and complete the remaning tasks

## Response snapshot

Successfully completed Phase 3 tasks T030-T031, integrating LanguageSelector into UI and adding landing page translations:

1. **T030 - LanguageSelector Integration (TopBar component)**:
   - Added `LanguageSelector` import to TopBar.tsx
   - Integrated component into desktop header (line 94) between actions and ThemeToggle
   - Added LanguageSelector to mobile menu footer (line 186-188) for accessibility
   - Component now appears on all authenticated pages (tasks, dashboard, settings)

2. **T031 - Homepage Translation (LandingHero component)**:
   - Added `landing.hero` namespace to en.json and ur.json translation files
   - Translation structure includes: badge, title, subtitle, benefits (4 items), cta (2 buttons), trust indicators (3 items)
   - Updated LandingHero.tsx to use `useTranslations('landing.hero')` hook
   - Replaced all hardcoded strings with translation keys:
     - Badge: `t('badge')`
     - Title: `t('title')` - "Stay Productive, Stay Organized" / "پیداواری رہیں، منظم رہیں"
     - Subtitle: `t('subtitle')` - Full paragraph with AI assistant description
     - Benefits array: `t('benefits.ai_powered')`, `t('benefits.offline')`, etc.
     - CTA buttons: `t('cta.get_started')`, `t('cta.sign_in')`
     - Trust indicators: `t('trust.secure')`, `t('trust.unlimited')`, `t('trust.ai_powered')`

3. **Context7 MCP Server Usage**:
   - Queried `/amannn/next-intl` library for useTranslations hook documentation
   - Retrieved examples of Client Component translation patterns with TypeScript
   - Verified ICU message syntax support and namespace-based organization
   - Confirmed pattern: `const t = useTranslations('namespace')` for Client Components

**Files Modified**:
- `phase-5/frontend/components/organisms/TopBar.tsx` (+3 lines: import, 2 component integrations)
- `phase-5/frontend/components/LandingHero.tsx` (+22 lines: import, hook usage, all string replacements)
- `phase-5/frontend/messages/en.json` (+23 lines: landing.hero namespace)
- `phase-5/frontend/messages/ur.json` (+23 lines: landing.hero namespace with Urdu translations)
- `specs/008-bonus-features-i18n-voice/tasks.md` (marked T030, T031 as complete)

**Remaining Phase 3 Tasks**:
- T032: Update tasks list page (large Client Component with ~50+ strings)
- T033: Update task detail pages
- T034: Update settings page
- T035: Update authentication pages
- T036: Apply RTL layout fixes (CSS logical properties)
- T037: Add translation key validation script
- T038: ✅ Already complete (localStorage persistence in useLanguage hook)

**Task Completion Status**: 12/20 tasks complete (60%), T030-T031 newly completed in this session

## Outcome

- ✅ Impact: Phase 3 language switching 60% complete (12 of 20 tasks). LanguageSelector now visible in TopBar and mobile menu; homepage hero section fully translated.
- 🧪 Tests: None run (implementation phase)
- 📁 Files: 5 files modified (TopBar, LandingHero, en.json, ur.json, tasks.md)
- 🔁 Next prompts: "Continue Phase 3: Update tasks page (T032), task detail pages (T033), settings (T034), auth pages (T035), apply RTL fixes (T036), add validation (T037)"
- 🧠 Reflection: Context7 MCP server provided critical next-intl Client Component patterns. LanguageSelector integration in TopBar ensures language switching is accessible on all authenticated pages. Landing page requires comprehensive namespace structure (badge, title, subtitle, benefits, cta, trust) to support complex marketing content in both LTR (English) and RTL (Urdu) layouts.

## Evaluation notes (flywheel)

- Failure modes observed: Tasks list page (T032) contains extensive hardcoded strings (~50+ translation keys needed), requiring comprehensive namespace structure (tasks.empty_state, tasks.actions, tasks.export_formats, tasks.quick_actions, tasks.view_modes, tasks.filters). Large file size may require batching translation updates.
- Graders run and results (PASS/FAIL): N/A (no automated graders configured)
- Prompt variant (if applicable): Used Context7 MCP server for latest next-intl Client Component documentation, following /sp.implement workflow
- Next experiment (smallest change to try): For T032 (tasks page), first add all required translation keys to en.json/ur.json, then update component imports and hook usage, finally replace strings section by section (header, filters, actions, modals) to avoid errors.
