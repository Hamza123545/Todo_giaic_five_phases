# Implementation Plan: Bonus Features - Multi-language Support & Voice Commands

**Branch**: `008-bonus-features-i18n-voice` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-bonus-features-i18n-voice/spec.md`

**Note**: This plan covers implementation of two bonus features to achieve 100% hackathon completion (1,700/1,700 points).

## Summary

Implement two accessibility and internationalization features for the Phase V Todo Application:

1. **Multi-language Support (Urdu) - +100 Points**: Full internationalization (i18n) using next-intl library with English and Urdu (اردو) language support, including RTL (right-to-left) layout for Urdu, language selector component, persistent language preferences, and complete UI translations (500-1000 translation keys).

2. **Voice Commands - +200 Points**: Hands-free task management using Web Speech API for voice recognition and text-to-speech, supporting natural language commands in both English and Urdu for task operations (add, complete, delete, update, filter, read), with microphone permission handling and visual recording feedback.

**Technical Approach**: Frontend-only implementation leveraging browser-native APIs (Web Speech API, localStorage) and Next.js i18n capabilities. No backend changes required except optional i18n error message support.

## Technical Context

**Language/Version**: TypeScript 5+ (Frontend), Node.js 22+ (Runtime)
**Primary Dependencies**:
- next-intl 3.x (i18n with RSC support)
- Web Speech API (SpeechRecognition, SpeechSynthesis - browser-native)
- React 18+ (UI components)
- Tailwind CSS 4 (RTL layout support)

**Storage**: Browser localStorage (language preference), No database changes required
**Testing**: Jest + React Testing Library (unit/integration), Playwright (E2E)
**Target Platform**: Modern web browsers (Chrome 33+, Edge 79+, Safari 14.1+)
**Project Type**: Web application (Next.js 16+ frontend enhancement)
**Performance Goals**:
- Language switch: <1 second UI update
- Voice command processing: <2 seconds from speech end to task action
- Voice recognition accuracy: 90%+ for clear speech
- TTS speech rate: 120-150 words per minute

**Constraints**:
- Browser compatibility: Web Speech API not supported in Firefox, limited in Safari
- Translation quality: Professional Urdu translations required (500-1000 keys)
- Voice accuracy: Dependent on browser implementation, background noise affects quality
- RTL layout: All components must support CSS logical properties

**Scale/Scope**:
- UI strings: 500-1000 translation keys
- Voice commands: 15+ command patterns
- Affected pages: All frontend pages (10-15 pages)
- New components: LanguageSelector, VoiceCommandButton, VoiceRecordingIndicator

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase I-V Compatibility ✅

- ✅ **Phase I (Console App)**: No impact - CLI functionality unchanged
- ✅ **Phase II (Web App)**: Fully compatible - i18n and voice add accessibility without breaking existing features
- ✅ **Phase III (AI Chatbot)**: Compatible - voice commands complement chatbot, both use natural language
- ✅ **Phase IV (Kubernetes)**: No impact - frontend-only changes, deployment unchanged
- ✅ **Phase V (Cloud)**: Fully compatible - no changes to event-driven architecture, Kafka, or Dapr

### Technology Stack Compliance ✅

- ✅ **Next.js 16+**: Using next-intl which is designed for Next.js App Router
- ✅ **TypeScript**: All new code will use TypeScript with strict typing
- ✅ **Better Auth**: No changes to authentication - JWT tokens work identically in all languages
- ✅ **Tailwind CSS**: RTL support via Tailwind directionality utilities
- ✅ **No Backend Changes**: Frontend-only implementation maintains separation of concerns

### Security Requirements ✅

- ✅ **User Isolation**: Language preference is browser-local, voice commands use existing authenticated API calls
- ✅ **JWT Tokens**: No changes to JWT authentication flow
- ✅ **Privacy**: Voice data processed in browser only, not stored or transmitted to servers
- ✅ **Permissions**: Microphone permission follows browser security model

### Backward Compatibility ✅

- ✅ **Success Criteria SC-017**: All Phase I-V functionality works identically in both English and Urdu
- ✅ **Success Criteria SC-018**: Voice commands don't interfere with existing keyboard/mouse operations
- ✅ **Success Criteria SC-019**: Zero impact on users who don't use language switching or voice features
- ✅ **No Breaking Changes**: All existing API endpoints, data models, and user workflows unchanged

### Constitution Violations: NONE ✅

All constitution requirements are preserved. These bonus features are purely additive enhancements that improve accessibility and internationalization without modifying core functionality.

## Project Structure

### Documentation (this feature)

```text
specs/008-bonus-features-i18n-voice/
├── spec.md              # Feature specification (✅ COMPLETE)
├── plan.md              # This file (🔄 IN PROGRESS)
├── research.md          # Phase 0 output - Technology decisions
├── data-model.md        # Phase 1 output - State management entities
├── quickstart.md        # Phase 1 output - Integration examples
├── contracts/           # Phase 1 output - Voice command schemas
│   ├── voice-commands.json       # Voice command patterns
│   └── translation-keys.json     # I18n translation key structure
├── checklists/
│   └── requirements.md  # Spec quality checklist (✅ COMPLETE)
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (Phase 5 Frontend)

```text
phase-5/
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── [locale]/                  # NEW - next-intl locale routing
    │   │   │   ├── layout.tsx             # MODIFIED - Add language provider
    │   │   │   ├── page.tsx               # MODIFIED - Translate homepage
    │   │   │   ├── tasks/                 # MODIFIED - Translate task pages
    │   │   │   └── settings/              # MODIFIED - Add language settings
    │   │   └── api/
    │   │       └── voice/                 # NEW - Voice command API route (optional)
    │   ├── components/
    │   │   ├── LanguageSelector.tsx       # NEW - Language switcher component
    │   │   ├── VoiceCommandButton.tsx     # NEW - Microphone button
    │   │   ├── VoiceRecordingIndicator.tsx # NEW - Visual feedback
    │   │   └── VoiceCommandHelp.tsx       # NEW - Command examples modal
    │   ├── lib/
    │   │   ├── i18n/
    │   │   │   ├── config.ts              # NEW - next-intl configuration
    │   │   │   ├── request.ts             # NEW - Server-side i18n
    │   │   │   └── middleware.ts          # NEW - Locale detection
    │   │   └── voice/
    │   │       ├── speechRecognition.ts   # NEW - Web Speech API wrapper
    │   │       ├── commandParser.ts       # NEW - Voice command parser
    │   │       └── textToSpeech.ts        # NEW - TTS implementation
    │   ├── hooks/
    │   │   ├── useVoiceCommands.ts        # NEW - Voice command hook
    │   │   ├── useTextToSpeech.ts         # NEW - TTS hook
    │   │   └── useLanguage.ts             # NEW - Language preference hook
    │   ├── messages/                       # NEW - Translation files
    │   │   ├── en.json                    # English translations
    │   │   └── ur.json                    # Urdu translations
    │   └── types/
    │       ├── voice.ts                   # NEW - Voice command types
    │       └── i18n.ts                    # NEW - I18n types
    ├── middleware.ts                       # MODIFIED - Add locale middleware
    ├── next.config.ts                      # MODIFIED - Add next-intl plugin
    ├── tailwind.config.ts                  # MODIFIED - Add RTL support
    ├── package.json                        # MODIFIED - Add next-intl dependency
    └── tests/
        ├── unit/
        │   ├── voice/
        │   │   ├── commandParser.test.ts  # NEW - Voice parser tests
        │   │   └── speechRecognition.test.ts # NEW - SR tests
        │   └── i18n/
        │       └── translations.test.ts   # NEW - I18n tests
        ├── integration/
        │   ├── voiceCommands.test.ts      # NEW - E2E voice tests
        │   └── languageSwitching.test.ts  # NEW - E2E i18n tests
        └── e2e/
            ├── voice-task-creation.spec.ts # NEW - Playwright voice test
            └── urdu-interface.spec.ts      # NEW - Playwright RTL test
```

**Structure Decision**: Web application (frontend enhancement only). All implementation is in `phase-5/frontend/` directory. No backend changes required as voice commands use existing REST API endpoints and i18n is handled client-side. This follows the Phase V monorepo structure established in earlier phases.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - No constitution violations identified. Both features are purely additive enhancements that preserve all Phase I-V requirements without introducing architectural complexity or breaking changes.

## Phase 0: Research & Technology Decisions

**Output**: `research.md` with decisions, rationale, and alternatives considered

### Research Tasks

1. **I18n Library Selection**
   - Decision: next-intl 3.x
   - Rationale: Native Next.js App Router support, React Server Components compatible, locale-based routing
   - Alternatives: react-i18next (requires client-side only), next-translate (less active maintenance)

2. **Voice Recognition API**
   - Decision: Web Speech API (browser-native)
   - Rationale: Zero dependencies, built-in browser support, native performance, privacy-first (no cloud processing)
   - Alternatives: Google Cloud Speech-to-Text (requires API key, costs money), Azure Speech Services (complex setup)

3. **RTL Layout Implementation**
   - Decision: Tailwind CSS logical properties + CSS `direction` attribute
   - Rationale: Automatic text direction switching, minimal code changes, framework-agnostic
   - Alternatives: react-with-direction (deprecated), CSS-in-JS libraries (runtime overhead)

4. **Voice Command Parsing Strategy**
   - Decision: Regex-based keyword extraction with intent mapping
   - Rationale: Lightweight, fast, deterministic, no ML dependencies, works offline
   - Alternatives: NLP libraries (Compromise.js - too heavy), OpenAI API (requires internet, costs money)

5. **Translation Storage Format**
   - Decision: JSON files (en.json, ur.json) in `messages/` directory
   - Rationale: next-intl native format, easy editing, type-safe with TypeScript
   - Alternatives: Database storage (overkill for static translations), YAML (requires parser)

6. **Language Preference Persistence**
   - Decision: localStorage API
   - Rationale: Client-side only, no server changes, persistent across sessions, simple API
   - Alternatives: Cookies (unnecessary server involvement), Database (requires authentication, overkill)

7. **Browser Compatibility Strategy**
   - Decision: Feature detection + graceful degradation
   - Rationale: Progressive enhancement, clear error messages, no breaking changes for unsupported browsers
   - Alternatives: Polyfills (none exist for Web Speech API), Transpilation (not applicable)

**Artifacts**: All research decisions documented in `research.md` with decision records

## Phase 1: Design & Contracts

**Output**: `data-model.md`, `contracts/`, `quickstart.md`, updated agent context

### 1.1 Data Model (`data-model.md`)

**State Management Entities**:

1. **LanguagePreference**
   - Fields: `locale` (string: "en" | "ur"), `lastUpdated` (timestamp)
   - Storage: localStorage key `user-language-preference`
   - Validation: Must be one of supported locales
   - State Transitions: EN ↔ UR (bidirectional)

2. **VoiceCommand**
   - Fields: `transcript` (string), `intent` (string), `parameters` (object), `confidence` (number 0-1)
   - Lifecycle: Recognized → Parsed → Validated → Executed → Completed/Failed
   - Validation: Intent must match known command patterns

3. **TranslationString**
   - Fields: `key` (string), `en` (string), `ur` (string)
   - Organization: Namespaced by page/component (e.g., `tasks.list.title`, `common.buttons.save`)
   - Validation: All keys must exist in both en.json and ur.json

4. **VoiceRecordingState**
   - Fields: `isRecording` (boolean), `isSpeaking` (boolean), `error` (string | null)
   - State Transitions: Idle → Listening → Processing → Idle

### 1.2 API Contracts (`contracts/`)

**File**: `voice-commands.json` - Voice command patterns and intents

```json
{
  "commands": [
    {
      "intent": "CREATE_TASK",
      "patterns": [
        "add task {title}",
        "create task {title}",
        "new task {title}"
      ],
      "parameters": ["title"],
      "example": "Add task Daily standup meeting"
    },
    {
      "intent": "COMPLETE_TASK",
      "patterns": [
        "complete task {id}",
        "mark task {id} as done",
        "finish task {id}"
      ],
      "parameters": ["id"],
      "example": "Complete task 5"
    },
    {
      "intent": "DELETE_TASK",
      "patterns": [
        "delete task {id}",
        "remove task {id}"
      ],
      "parameters": ["id"],
      "example": "Delete task 3"
    },
    {
      "intent": "FILTER_TASKS",
      "patterns": [
        "show {priority} priority tasks",
        "show {status} tasks"
      ],
      "parameters": ["priority", "status"],
      "example": "Show high priority tasks"
    },
    {
      "intent": "READ_TASKS",
      "patterns": [
        "read my tasks",
        "what are my tasks",
        "list my tasks"
      ],
      "parameters": [],
      "example": "Read my tasks"
    }
  ]
}
```

**File**: `translation-keys.json` - I18n key structure

```json
{
  "namespaces": {
    "common": {
      "description": "Shared UI elements across all pages",
      "keys": [
        "buttons.save",
        "buttons.cancel",
        "buttons.delete",
        "errors.network",
        "errors.validation"
      ]
    },
    "tasks": {
      "description": "Task management pages",
      "keys": [
        "list.title",
        "list.empty",
        "form.title",
        "form.description",
        "form.priority"
      ]
    },
    "voice": {
      "description": "Voice command UI",
      "keys": [
        "button.start",
        "button.stop",
        "status.listening",
        "status.processing",
        "errors.not_supported"
      ]
    },
    "settings": {
      "description": "Settings page",
      "keys": [
        "language.title",
        "language.select",
        "voice.title",
        "voice.enable"
      ]
    }
  }
}
```

### 1.3 Integration Guide (`quickstart.md`)

**Content**:
1. Adding new translations (how to update en.json and ur.json)
2. Adding new voice commands (how to extend commandParser.ts)
3. Testing RTL layout (how to verify Urdu layout correctness)
4. Testing voice recognition (how to test with different browsers)
5. Browser compatibility testing (feature detection examples)

**Artifacts**: All Phase 1 files created in `specs/008-bonus-features-i18n-voice/`
