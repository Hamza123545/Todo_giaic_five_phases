---
id: PHR-0001
title: Phase 2 Foundational Hooks Voice i18n
stage: green
date: 2025-12-31
surface: agent
model: claude-sonnet-4-5
feature: 008-bonus-features-i18n-voice
branch: 008-bonus-features-i18n-voice
user: Claude
command: /sp.implement
labels: ["i18n", "voice-commands", "hooks", "foundational", "next-intl", "web-speech-api"]
links:
  spec: specs/008-bonus-features-i18n-voice/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - phase-5/frontend/hooks/useLanguage.ts
  - phase-5/frontend/hooks/useVoiceCommands.ts
  - phase-5/frontend/hooks/useTextToSpeech.ts
  - phase-5/frontend/lib/voice/featureDetection.ts
  - phase-5/frontend/lib/voice/commandParser.ts
  - phase-5/frontend/lib/voice/speechRecognition.ts
  - phase-5/frontend/lib/voice/textToSpeech.ts
  - phase-5/frontend/app/[locale]/layout.tsx
  - phase-5/frontend/app/layout.tsx
  - specs/008-bonus-features-i18n-voice/tasks.md
tests:
  - none
---

## Prompt

/sp.implement now complete phase 1 but read the frontend files first as I think there is already i18n available

## Response snapshot

Completed Phase 2: Foundational (Blocking Prerequisites) - T010-T018. Created all core hooks and utilities for i18n and voice features:

1. **Core Hooks** (T010, T015, T016):
   - useLanguage: Language switching with localStorage persistence, RTL support, URL-based locale routing
   - useVoiceCommands: Speech recognition wrapper with command parsing and error handling
   - useTextToSpeech: TTS wrapper with language-aware voice selection and playback controls

2. **Voice Utilities** (T011-T014):
   - featureDetection: Browser capability checks (Speech Recognition, TTS, localStorage, Intl)
   - commandParser: Natural language parsing for English and Urdu voice commands (CREATE_TASK, COMPLETE_TASK, etc.)
   - speechRecognition: Web Speech API wrapper with interim results and error handling
   - textToSpeech: Speech synthesis with language-specific voice selection and rate/pitch controls

3. **Directory Structure** (T017-T018):
   - Created app/[locale]/ directory structure
   - Moved all route directories into [locale] (calendar, chat, dashboard, forgot-password, reset-password, settings, signin, signup, tasks)
   - Created locale-specific layout with NextIntlClientProvider and RTL support
   - Simplified root layout to minimal shell

**Note**: Initially thought i18n was already set up, but discovered it was not. Implemented fresh next-intl infrastructure.

## Outcome

- ✅ Impact: Phase 2 foundational infrastructure complete - all user story work can now proceed. Created 7 new files with comprehensive i18n and voice functionality.
- 🧪 Tests: None run (implementation phase)
- 📁 Files: 10 files created/modified (7 new implementations + 3 structure changes)
- 🔁 Next prompts: "Implement Phase 3: User Story 1 - Language Switching (T019-T038) with translation namespaces and LanguageSelector component"
- 🧠 Reflection: The [locale] directory restructuring was critical - moved from flat app/ structure to app/[locale]/ structure to enable proper i18n routing. Root layout became minimal shell while locale layout handles all providers.

## Evaluation notes (flywheel)

- Failure modes observed: User expected existing i18n setup, but none existed. Had to clarify during exploration. Path references in tasks.md used src/ directory which didn't match actual structure (direct paths lib/, app/, components/).
- Graders run and results (PASS/FAIL): N/A (no automated graders configured)
- Prompt variant (if applicable): N/A (standard /sp.implement workflow)
- Next experiment (smallest change to try): For Phase 3, create translation files in parallel for all namespaces to accelerate implementation (tasks T019-T028 can run concurrently).
