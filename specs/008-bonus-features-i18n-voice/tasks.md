# Tasks: Bonus Features - Multi-language Support & Voice Commands

**Input**: Design documents from `/specs/008-bonus-features-i18n-voice/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are excluded per specification guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Branch**: `008-bonus-features-i18n-voice` (already created and checked out)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend-only implementation**: `phase-5/frontend/src/`
- **No backend changes required** (per plan.md - frontend enhancement only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and i18n/voice framework setup

- [X] T001 Install next-intl dependency in phase-5/frontend/package.json
- [X] T002 [P] Create next-intl configuration file in phase-5/frontend/lib/i18n/config.ts
- [X] T003 [P] Create i18n request handler in phase-5/frontend/lib/i18n/request.ts
- [X] T004 [P] Create i18n middleware in phase-5/frontend/middleware.ts
- [X] T005 [P] Create TypeScript type definitions in phase-5/frontend/types/i18n.ts
- [X] T006 [P] Create TypeScript type definitions in phase-5/frontend/types/voice.ts
- [X] T007 Create translation file structure in phase-5/frontend/messages/ (en.json, ur.json)
- [X] T008 Update Next.js config to include next-intl plugin in phase-5/frontend/next.config.ts
- [X] T009 Update Tailwind config to support RTL directionality in phase-5/frontend/app/globals.css

**Checkpoint**: i18n and type infrastructure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks, utilities, and contexts that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Create useLanguage hook in phase-5/frontend/src/hooks/useLanguage.ts
- [X] T011 [P] Create browser feature detection utility in phase-5/frontend/src/lib/voice/featureDetection.ts
- [X] T012 [P] Create voice command parser in phase-5/frontend/src/lib/voice/commandParser.ts
- [X] T013 [P] Create Web Speech API wrapper in phase-5/frontend/src/lib/voice/speechRecognition.ts
- [X] T014 [P] Create text-to-speech implementation in phase-5/frontend/src/lib/voice/textToSpeech.ts
- [X] T015 Create useVoiceCommands hook in phase-5/frontend/src/hooks/useVoiceCommands.ts
- [X] T016 [P] Create useTextToSpeech hook in phase-5/frontend/src/hooks/useTextToSpeech.ts
- [X] T017 Modify phase-5/frontend/src/app/[locale]/layout.tsx to add locale routing and language provider
- [X] T018 Create [locale] directory structure under phase-5/frontend/src/app/[locale]/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Switch Application Language to Urdu (Priority: P1) 🎯 MVP

**Goal**: Users can switch between English and Urdu languages with proper RTL layout support

**Independent Test**: Switch language to Urdu in settings and verify all UI text displays in Urdu with RTL layout. Language preference persists across browser sessions.

### Implementation for User Story 1

- [X] T019 [P] [US1] Create initial English translation file with common namespace in phase-5/frontend/src/messages/en.json
- [X] T020 [P] [US1] Create initial Urdu translation file with common namespace in phase-5/frontend/src/messages/ur.json
- [X] T021 [P] [US1] Add task-related translations (tasks namespace) to phase-5/frontend/src/messages/en.json
- [X] T022 [P] [US1] Add task-related translations (tasks namespace) to phase-5/frontend/src/messages/ur.json
- [X] T023 [P] [US1] Add settings-related translations (settings namespace) to phase-5/frontend/src/messages/en.json
- [X] T024 [P] [US1] Add settings-related translations (settings namespace) to phase-5/frontend/src/messages/ur.json
- [X] T025 [P] [US1] Add navigation translations (navigation namespace) to phase-5/frontend/src/messages/en.json
- [X] T026 [P] [US1] Add navigation translations (navigation namespace) to phase-5/frontend/src/messages/ur.json
- [X] T027 [P] [US1] Add authentication translations (auth namespace) to phase-5/frontend/src/messages/en.json
- [X] T028 [P] [US1] Add authentication translations (auth namespace) to phase-5/frontend/src/messages/ur.json
- [X] T029 [US1] Create LanguageSelector component in phase-5/frontend/src/components/LanguageSelector.tsx
- [X] T030 [US1] Integrate LanguageSelector into header layout (TopBar component) in phase-5/frontend/src/components/organisms/TopBar.tsx
- [X] T031 [US1] Update homepage to use translations (LandingHero component) in phase-5/frontend/src/components/LandingHero.tsx
- [X] T032 [US1] Update tasks list page to use translations in phase-5/frontend/src/app/[locale]/tasks/page.tsx
- [X] T033 [US1] Update task detail pages - N/A (no individual task detail pages exist, tasks managed inline in Kanban view)
- [X] T034 [US1] Update settings page to use translations in phase-5/frontend/src/app/[locale]/settings/page.tsx
- [ ] T035 [US1] Update authentication pages to use translations in phase-5/frontend/src/app/[locale]/auth/
- [ ] T036 [US1] Apply RTL layout fixes to all components using Tailwind logical properties (ms-*, me-*, start, end)
- [ ] T037 [US1] Add validation to ensure all translation keys exist in both en.json and ur.json
- [ ] T038 [US1] Implement language preference persistence using localStorage in useLanguage hook

**Checkpoint**: At this point, User Story 1 should be fully functional - complete language switching with RTL layout working independently

---

## Phase 4: User Story 2 - Create Tasks Using Voice Commands (Priority: P1) 🎯 MVP

**Goal**: Users can create new tasks hands-free by speaking "Add task: [task name]" in English or Urdu

**Independent Test**: Click microphone button, speak "Add task: Buy groceries", verify new task "Buy groceries" appears in task list

### Implementation for User Story 2

- [ ] T039 [P] [US2] Add voice-related translations (voice namespace) to phase-5/frontend/src/messages/en.json
- [ ] T040 [P] [US2] Add voice-related translations (voice namespace) to phase-5/frontend/src/messages/ur.json
- [ ] T041 [P] [US2] Implement CREATE_TASK intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T042 [P] [US2] Implement CREATE_TASK command execution in phase-5/frontend/src/lib/voice/commandExecutor.ts
- [ ] T043 [US2] Create VoiceCommandButton component in phase-5/frontend/src/components/VoiceCommandButton.tsx
- [ ] T044 [US2] Create VoiceRecordingIndicator component in phase-5/frontend/src/components/VoiceRecordingIndicator.tsx
- [ ] T045 [US2] Integrate VoiceCommandButton into task list page in phase-5/frontend/src/app/[locale]/tasks/page.tsx
- [ ] T046 [US2] Add microphone permission request handling in Web Speech API wrapper
- [ ] T047 [US2] Add interim transcript display to VoiceCommandButton component
- [ ] T048 [US2] Add voice command success/error feedback UI to VoiceCommandButton component
- [ ] T049 [US2] Implement browser compatibility check and graceful degradation in VoiceCommandButton
- [ ] T050 [US2] Add voice command examples for CREATE_TASK to VoiceCommandHelp modal

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - language switching + voice task creation

---

## Phase 5: User Story 3 - Control Tasks with Voice Commands (Priority: P2)

**Goal**: Users can perform task operations (complete, delete, update, filter) using voice commands

**Independent Test**: Speak "Complete task 1" and verify first task in list is marked as complete

### Implementation for User Story 3

- [ ] T051 [P] [US3] Implement COMPLETE_TASK intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T052 [P] [US3] Implement DELETE_TASK intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T053 [P] [US3] Implement UPDATE_TASK intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T054 [P] [US3] Implement FILTER_TASKS intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T055 [P] [US3] Implement COMPLETE_TASK command execution in phase-5/frontend/src/lib/voice/commandExecutor.ts
- [ ] T056 [P] [US3] Implement DELETE_TASK command execution in phase-5/frontend/src/lib/voice/commandExecutor.ts
- [ ] T057 [P] [US3] Implement UPDATE_TASK command execution in phase-5/frontend/src/lib/voice/commandExecutor.ts
- [ ] T058 [P] [US3] Implement FILTER_TASKS command execution in phase-5/frontend/src/lib/voice/commandExecutor.ts
- [ ] T059 [US3] Add task number validation with error messages for invalid task references
- [ ] T060 [US3] Add confirmation dialog for destructive commands (DELETE_TASK)
- [ ] T061 [US3] Add voice command examples for all operations to VoiceCommandHelp modal
- [ ] T062 [US3] Update VoiceCommandButton to handle all command types (complete, delete, update, filter)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - full voice task management

---

## Phase 6: User Story 4 - Listen to Tasks with Text-to-Speech (Priority: P3)

**Goal**: Users can have their tasks read aloud using "Read my tasks" command

**Independent Test**: Speak "Read my tasks" and hear browser speak each task title aloud

### Implementation for User Story 4

- [ ] T063 [P] [US4] Implement READ_TASKS intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T064 [P] [US4] Implement SHOW_HELP intent parsing in phase-5/frontend/src/lib/voice/commandParser.ts
- [ ] T065 [P] [US4] Implement task reading logic in phase-5/frontend/src/lib/voice/textToSpeech.ts
- [ ] T066 [US4] Implement READ_TASKS command execution with task list fetching
- [ ] T067 [US4] Add language-specific voice selection (en-US for English, ur-PK for Urdu)
- [ ] T068 [US4] Add stop button for text-to-speech in VoiceCommandButton component
- [ ] T069 [US4] Add speaking state indicator to VoiceRecordingIndicator component
- [ ] T070 [US4] Create VoiceCommandHelp modal component in phase-5/frontend/src/components/VoiceCommandHelp.tsx
- [ ] T071 [US4] Implement SHOW_HELP command to open VoiceCommandHelp modal
- [ ] T072 [US4] Add "No tasks" spoken message when task list is empty
- [ ] T073 [US4] Add filtered task reading support (read high priority tasks, read completed tasks)

**Checkpoint**: All user stories (1-4) should now be independently functional - complete i18n + voice feature set

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T074 [P] Add comprehensive error handling for all voice command edge cases
- [ ] T075 [P] Add logging for voice command processing (intent, parameters, success/failure)
- [ ] T076 [P] Implement voice command queueing for rapid sequential commands
- [ ] T077 [P] Add rate limiting for voice command API calls to prevent abuse
- [ ] T078 Optimize bundle size by code-splitting translations by locale
- [ ] T079 [P] Add accessibility improvements (ARIA labels, keyboard navigation for voice UI)
- [ ] T080 [P] Add visual feedback improvements (animations, transitions for language switch)
- [ ] T081 Validate translation completeness (all keys exist in both en.json and ur.json)
- [ ] T082 [P] Add performance monitoring for language switch time (<1s requirement)
- [ ] T083 [P] Add performance monitoring for voice command processing time (<2s requirement)
- [ ] T084 Update HACKATHON_VERIFICATION_REPORT.md to reflect 1,700/1,700 points (100% completion)
- [ ] T085 [P] Update phase-5/README.md with multi-language support documentation
- [ ] T086 [P] Update phase-5/README.md with voice commands usage guide
- [ ] T087 Create quickstart validation script to verify all examples in quickstart.md work
- [ ] T088 [P] Add browser compatibility warning banner for Firefox users (no voice support)
- [ ] T089 Verify backward compatibility - all Phase I-V functionality works in both languages
- [ ] T090 Final end-to-end validation of all 4 user stories independently

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Language Switching**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1) - Voice Task Creation**: Can start after Foundational (Phase 2) - Independent of US1 but enhanced when combined
- **User Story 3 (P2) - Voice Task Operations**: Can start after Foundational (Phase 2) - Builds on US2 voice infrastructure
- **User Story 4 (P3) - Text-to-Speech**: Can start after Foundational (Phase 2) - Uses voice infrastructure from US2/US3

### Within Each User Story

- Translation files can be created in parallel (T019-T028 for US1)
- Component creation can be parallelized when working on different files
- Integration tasks must follow component creation
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T006)
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Once Foundational phase completes:
  - US1 (Language) and US2 (Voice Creation) can start in parallel (different files)
  - US3 (Voice Operations) can start once US2 has command parser foundation
  - US4 (TTS) can start once voice infrastructure exists
- Translation file creation highly parallel (en.json and ur.json for each namespace)
- Polish tasks mostly parallel (documentation, testing, monitoring)

---

## Parallel Example: User Story 1 (Language Switching)

```bash
# Launch all translation file creation in parallel:
Task T019: "Create initial English translation file with common namespace"
Task T020: "Create initial Urdu translation file with common namespace"
Task T021: "Add task-related translations (tasks namespace) to en.json"
Task T022: "Add task-related translations (tasks namespace) to ur.json"
Task T023: "Add settings-related translations (settings namespace) to en.json"
Task T024: "Add settings-related translations (settings namespace) to ur.json"
Task T025: "Add navigation translations (navigation namespace) to en.json"
Task T026: "Add navigation translations (navigation namespace) to ur.json"
Task T027: "Add authentication translations (auth namespace) to en.json"
Task T028: "Add authentication translations (auth namespace) to ur.json"

# Total: 10 translation tasks can run in parallel (5 namespaces × 2 languages)
```

## Parallel Example: User Story 2 (Voice Task Creation)

```bash
# Launch intent parsing and translations in parallel:
Task T039: "Add voice-related translations (voice namespace) to en.json"
Task T040: "Add voice-related translations (voice namespace) to ur.json"
Task T041: "Implement CREATE_TASK intent parsing"
Task T042: "Implement CREATE_TASK command execution"

# Launch component creation in parallel:
Task T043: "Create VoiceCommandButton component"
Task T044: "Create VoiceRecordingIndicator component"

# Total: 6 tasks can run in parallel initially
```

## Parallel Example: User Story 3 (Voice Task Operations)

```bash
# Launch all intent parsing in parallel:
Task T051: "Implement COMPLETE_TASK intent parsing"
Task T052: "Implement DELETE_TASK intent parsing"
Task T053: "Implement UPDATE_TASK intent parsing"
Task T054: "Implement FILTER_TASKS intent parsing"

# Launch all command execution in parallel:
Task T055: "Implement COMPLETE_TASK command execution"
Task T056: "Implement DELETE_TASK command execution"
Task T057: "Implement UPDATE_TASK command execution"
Task T058: "Implement FILTER_TASKS command execution"

# Total: 8 tasks can run in parallel (4 intents × 2 layers)
```

## Parallel Example: User Story 4 (Text-to-Speech)

```bash
# Launch intent parsing and TTS logic in parallel:
Task T063: "Implement READ_TASKS intent parsing"
Task T064: "Implement SHOW_HELP intent parsing"
Task T065: "Implement task reading logic in textToSpeech.ts"

# Total: 3 tasks can run in parallel
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T018) - CRITICAL
3. Complete Phase 3: User Story 1 - Language Switching (T019-T038)
4. Complete Phase 4: User Story 2 - Voice Task Creation (T039-T050)
5. **STOP and VALIDATE**: Test both US1 and US2 independently
6. Deploy/demo if ready - **This achieves 100% hackathon completion (1,700 points)**

**Rationale**: US1 + US2 deliver the core value proposition (+100 points i18n + +200 points voice = +300 total). These are both P1 priority and provide immediate user value. This is the recommended MVP scope.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T018)
2. Add User Story 1 → Test independently → Deploy/Demo (Language switching works)
3. Add User Story 2 → Test independently → Deploy/Demo (Voice task creation works)
4. Add User Story 3 → Test independently → Deploy/Demo (Full voice task management)
5. Add User Story 4 → Test independently → Deploy/Demo (Text-to-speech reading)
6. Polish Phase → Production-ready deployment

**Benefits**: Each story adds value without breaking previous stories. Can stop at any point with working features.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T018)
2. **Once Foundational is done**:
   - **Developer A**: User Story 1 (Language Switching) - T019-T038
   - **Developer B**: User Story 2 (Voice Task Creation) - T039-T050
   - **Developer C**: User Story 3 (Voice Task Operations) - T051-T062
   - **Developer D**: User Story 4 (Text-to-Speech) - T063-T073
3. **Stories complete and integrate independently**
4. **Team completes Polish together** - T074-T090

**Maximum Parallelism**: 4 developers can work simultaneously on different user stories after foundational phase completes.

---

## Task Count Summary

- **Phase 1 (Setup)**: 9 tasks (T001-T009)
- **Phase 2 (Foundational)**: 9 tasks (T010-T018)
- **Phase 3 (US1 - Language Switching)**: 20 tasks (T019-T038)
- **Phase 4 (US2 - Voice Task Creation)**: 12 tasks (T039-T050)
- **Phase 5 (US3 - Voice Task Operations)**: 12 tasks (T051-T062)
- **Phase 6 (US4 - Text-to-Speech)**: 11 tasks (T063-T073)
- **Phase 7 (Polish)**: 17 tasks (T074-T090)

**Total**: 90 tasks

**Parallel Opportunities**:
- Phase 1: 7 parallel tasks (T002-T006, T008-T009)
- Phase 2: 6 parallel tasks (T011-T014, T016)
- Phase 3: 10 parallel tasks (translation files T019-T028)
- Phase 4: 6 parallel tasks (T039-T044)
- Phase 5: 8 parallel tasks (T051-T058)
- Phase 6: 3 parallel tasks (T063-T065)
- Phase 7: 11 parallel tasks (most polish tasks)

**Total Parallel Tasks**: 51/90 tasks (57%) can run in parallel

---

## Notes

- **[P] tasks** = different files, no dependencies, can run simultaneously
- **[Story] label** maps task to specific user story for traceability and independent testing
- **Each user story is independently completable and testable** - can stop at any checkpoint
- **No test tasks included** - tests not explicitly requested in feature specification
- **Frontend-only implementation** - no backend changes per plan.md
- **Translation completeness critical** - T081 validates all keys exist in both languages before deployment
- **Backward compatibility verified** - T089 ensures Phase I-V functionality preserved
- **100% hackathon completion** - US1 + US2 alone achieve +300 points (1,400 → 1,700)
- Commit after each task or logical group for safe rollback points
- Stop at any checkpoint to validate story independently before proceeding
- Avoid: cross-story dependencies that break independence, same-file conflicts in parallel execution
