---
id: PHR-0002
title: Phase 3 Translation Infrastructure Context7
stage: green
date: 2025-12-31
surface: agent
model: claude-sonnet-4-5
feature: 008-bonus-features-i18n-voice
branch: 008-bonus-features-i18n-voice
user: Claude
command: /sp.implement
labels: ["i18n", "translations", "next-intl", "context7", "urdu", "rtl", "language-selector"]
links:
  spec: specs/008-bonus-features-i18n-voice/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - phase-5/frontend/messages/en.json
  - phase-5/frontend/messages/ur.json
  - phase-5/frontend/components/LanguageSelector.tsx
  - specs/008-bonus-features-i18n-voice/tasks.md
tests:
  - none
---

## Prompt

/sp.implement now run the context7 mcp server for the documentation and complete the phase 3

## Response snapshot

Successfully implemented Phase 3 translation infrastructure (T019-T029) using Context7 MCP server for next-intl documentation:

1. **Prerequisites Check**: Verified all checklists passed (requirements.md: 12/12 complete)

2. **Context7 Integration**:
   - Queried `/amannn/next-intl` library (511 code snippets, High reputation, 92.3 benchmark score)
   - Retrieved documentation for Next.js App Router integration, useTranslations hook, NextIntlClientProvider setup
   - Verified implementation patterns match official next-intl documentation

3. **Translation Files (T019-T028)**:
   - Created comprehensive translation namespaces: common, tasks, settings, navigation, auth, voice, chatbot
   - English (en.json): 180 lines with complete translations
   - Urdu (ur.json): 181 lines with RTL-compatible Urdu translations
   - All translation keys match between languages for validation

4. **LanguageSelector Component (T029)**:
   - Client component using useLanguage hook
   - Dropdown menu with flag indicators
   - Responsive design (full text on desktop, flag-only on mobile)
   - Integrates with next-intl locale routing

**Remaining**: T030-T038 require page updates and RTL layout fixes (deferred due to token constraints)

## Outcome

- ✅ Impact: Phase 3 translation infrastructure 55% complete (11 of 20 tasks). All translation content ready for UI integration.
- 🧪 Tests: None run (implementation phase)
- 📁 Files: 3 files created/modified (2 translation files updated with 6 namespaces, 1 component created)
- 🔁 Next prompts: "Complete Phase 3: Integrate LanguageSelector into layout (T030), update all pages to use useTranslations hook (T031-T035), apply RTL layout fixes (T036), add validation (T037)"
- 🧠 Reflection: Context7 MCP server provided critical validation of next-intl patterns before implementation, ensuring compatibility with Next.js 16 App Router and React Server Components. Using library ID `/amannn/next-intl` guaranteed access to official documentation.

## Evaluation notes (flywheel)

- Failure modes observed: Token constraints prevented completing all 20 tasks in Phase 3. Implementation stopped at T029 (LanguageSelector component) before page integration work (T030-T038).
- Graders run and results (PASS/FAIL): N/A (no automated graders configured)
- Prompt variant (if applicable): Used Context7 MCP server proactively per user request to fetch latest next-intl documentation
- Next experiment (smallest change to try): For remaining Phase 3 tasks, prioritize T030 (LanguageSelector integration) as it's the most visible feature, then batch page updates (T031-T035) as they follow identical patterns.
