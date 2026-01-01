# Quickstart Guide: Multi-language Support & Voice Commands

**Branch**: `008-bonus-features-i18n-voice` | **Date**: 2025-12-31
**Audience**: Developers implementing or maintaining i18n and voice features

## Overview

This guide provides practical examples for common integration tasks:
1. Adding new translations
2. Adding new voice commands
3. Testing RTL layout
4. Testing voice recognition
5. Browser compatibility testing

---

## 1. Adding New Translations

### Step 1: Identify the Translation Key

Follow the naming convention: `{namespace}.{category}.{key}`

```typescript
// Example: Adding a new button label for "Archive"
// Namespace: common (shared UI)
// Category: buttons
// Key: archive
const key = "common.buttons.archive";
```

### Step 2: Add to English Translation File

**File**: `src/messages/en.json`

```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "archive": "Archive"  // ← Add new key here
    }
  }
}
```

### Step 3: Add to Urdu Translation File

**File**: `src/messages/ur.json`

```json
{
  "common": {
    "buttons": {
      "save": "محفوظ کریں",
      "cancel": "منسوخ کریں",
      "delete": "حذف کریں",
      "archive": "محفوظ کریں"  // ← Add Urdu translation
    }
  }
}
```

### Step 4: Use in Component

```typescript
import { useTranslations } from 'next-intl';

export function TaskItem({ task }) {
  const t = useTranslations('common.buttons');

  return (
    <button onClick={handleArchive}>
      {t('archive')}  {/* Will render "Archive" or "محفوظ کریں" */}
    </button>
  );
}
```

### Translation with Placeholders

```json
// en.json
{
  "tasks": {
    "list": {
      "count": "You have {count} {count, plural, one {task} other {tasks}}"
    }
  }
}

// ur.json
{
  "tasks": {
    "list": {
      "count": "آپ کے پاس {count} کام {count, plural, one {ہے} other {ہیں}}"
    }
  }
}
```

```typescript
// Usage
const t = useTranslations('tasks.list');
<p>{t('count', { count: taskCount })}</p>
// English: "You have 5 tasks"
// Urdu: "آپ کے پاس 5 کام ہیں"
```

### Validation Checklist

- [ ] Key exists in both `en.json` AND `ur.json`
- [ ] Placeholder names match exactly across languages
- [ ] Translation is not an empty string
- [ ] Key follows `{namespace}.{category}.{key}` pattern
- [ ] Urdu translation tested with RTL layout

---

## 2. Adding New Voice Commands

### Step 1: Define Command in Contract

**File**: `specs/008-bonus-features-i18n-voice/contracts/voice-commands.json`

```json
{
  "intent": "ARCHIVE_TASK",
  "description": "Archive a completed task",
  "patterns": {
    "en": [
      "archive task {id}",
      "move task {id} to archive"
    ],
    "ur": [
      "کام {id} کو محفوظ کریں"
    ]
  },
  "parameters": [
    {
      "name": "id",
      "type": "number",
      "required": true,
      "validation": { "min": 1 }
    }
  ],
  "examples": {
    "en": ["Archive task 5"],
    "ur": ["کام 5 کو محفوظ کریں"]
  },
  "apiMapping": {
    "endpoint": "PATCH /api/tasks/{id}",
    "payload": { "archived": true }
  }
}
```

### Step 2: Add Patterns to Command Parser

**File**: `src/lib/voice/commandParser.ts`

```typescript
export function parseVoiceCommand(
  transcript: string,
  locale: 'en' | 'ur'
): VoiceCommand {
  const patterns = {
    ARCHIVE_TASK: {
      en: [
        /archive task (\d+)/i,
        /move task (\d+) to archive/i
      ],
      ur: [
        /کام (\d+) کو محفوظ کریں/i
      ]
    },
    // ... other intents
  };

  // Try to match patterns
  for (const [intent, localePatterns] of Object.entries(patterns)) {
    for (const pattern of localePatterns[locale]) {
      const match = transcript.match(pattern);
      if (match) {
        return {
          transcript,
          intent: intent as VoiceIntent,
          parameters: extractParameters(match, intent),
          confidence: calculateConfidence(match),
          timestamp: Date.now(),
          locale
        };
      }
    }
  }

  // No match found
  return {
    transcript,
    intent: 'UNKNOWN',
    parameters: {},
    confidence: 0,
    timestamp: Date.now(),
    locale
  };
}
```

### Step 3: Add Command Handler

**File**: `src/lib/voice/commandExecutor.ts`

```typescript
export async function executeVoiceCommand(
  command: VoiceCommand
): Promise<void> {
  switch (command.intent) {
    case 'ARCHIVE_TASK':
      const { id } = command.parameters;
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      });
      break;

    // ... other cases
  }
}
```

### Step 4: Add UI Feedback Translations

```json
// en.json
{
  "voice": {
    "feedback": {
      "task_archived": "Task {id} archived successfully"
    }
  }
}

// ur.json
{
  "voice": {
    "feedback": {
      "task_archived": "کام {id} کامیابی سے محفوظ ہو گیا"
    }
  }
}
```

### Testing New Command

```typescript
// Manual test
const result = parseVoiceCommand("archive task 5", "en");
console.log(result);
// Expected: { intent: "ARCHIVE_TASK", parameters: { id: "5" }, ... }

// Unit test
describe('Voice Command Parser', () => {
  it('should parse archive task command in English', () => {
    const result = parseVoiceCommand("archive task 5", "en");
    expect(result.intent).toBe("ARCHIVE_TASK");
    expect(result.parameters.id).toBe("5");
  });

  it('should parse archive task command in Urdu', () => {
    const result = parseVoiceCommand("کام 5 کو محفوظ کریں", "ur");
    expect(result.intent).toBe("ARCHIVE_TASK");
    expect(result.parameters.id).toBe("5");
  });
});
```

---

## 3. Testing RTL Layout

### Visual Testing with Browser DevTools

```typescript
// 1. Switch language to Urdu in your app
localStorage.setItem('user-language-preference', JSON.stringify({
  locale: 'ur',
  lastUpdated: Date.now()
}));

// 2. Refresh page - should see RTL layout

// 3. Inspect HTML element
// Should have: <html dir="rtl" lang="ur">
```

### Checklist for RTL Testing

- [ ] Text direction is right-to-left
- [ ] UI elements are mirrored (icons, arrows, etc.)
- [ ] Margins and paddings are reversed (left ↔ right)
- [ ] Scrollbars appear on left side
- [ ] Numbers and dates display correctly
- [ ] Mixed LTR/RTL content (e.g., English words in Urdu text) renders correctly

### Common RTL Issues and Fixes

**Issue 1: Directional CSS not using logical properties**

```css
/* ❌ Wrong - uses directional properties */
.element {
  margin-left: 1rem;
  text-align: left;
}

/* ✅ Correct - uses logical properties */
.element {
  margin-inline-start: 1rem;
  text-align: start;
}
```

**Issue 2: Icons not flipping**

```tsx
// ❌ Wrong - icon doesn't flip in RTL
<ArrowIcon className="ml-2" />

// ✅ Correct - icon flips in RTL
<ArrowIcon className="ms-2 rtl:rotate-180" />
```

**Issue 3: Absolute positioning not adapting**

```css
/* ❌ Wrong */
.dropdown {
  position: absolute;
  left: 0;
}

/* ✅ Correct */
.dropdown {
  position: absolute;
  inset-inline-start: 0;
}
```

### Automated RTL Testing (Playwright)

```typescript
// tests/e2e/urdu-interface.spec.ts
import { test, expect } from '@playwright/test';

test('should display Urdu interface with RTL layout', async ({ page }) => {
  await page.goto('/');

  // Switch to Urdu
  await page.click('[data-testid="language-selector"]');
  await page.click('[data-testid="language-option-ur"]');

  // Verify RTL attribute
  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'ur');

  // Verify text is in Urdu
  const title = page.locator('h1');
  await expect(title).toContainText('میرے کام');

  // Take screenshot for visual regression
  await page.screenshot({ path: 'screenshots/urdu-rtl-layout.png' });
});
```

---

## 4. Testing Voice Recognition

### Browser Support Detection

```typescript
// src/lib/voice/detectSupport.ts
export function isSpeechRecognitionSupported(): boolean {
  return (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  );
}

export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

// Usage in component
if (!isSpeechRecognitionSupported()) {
  return <ErrorMessage>
    Voice commands not supported in this browser.
    Try Chrome or Edge.
  </ErrorMessage>;
}
```

### Manual Testing Procedure

1. **Start Recording**
   ```typescript
   // Click microphone button in UI
   // Or programmatically:
   const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
   recognition.lang = 'en-US'; // or 'ur-PK' for Urdu
   recognition.start();
   ```

2. **Speak a Command**
   - English: "Add task Daily standup meeting"
   - Urdu: "کام شامل کریں روزانہ میٹنگ"

3. **Verify Recognition**
   ```typescript
   recognition.onresult = (event) => {
     const transcript = event.results[0][0].transcript;
     console.log('Recognized:', transcript);
     // Expected: "add task daily standup meeting"
   };
   ```

4. **Verify Parsing**
   ```typescript
   const command = parseVoiceCommand(transcript, 'en');
   console.log('Parsed:', command);
   // Expected: { intent: "CREATE_TASK", parameters: { title: "Daily standup meeting" } }
   ```

5. **Verify Execution**
   - Check that task appears in task list
   - Verify API call was made
   - Check success feedback message

### Testing Different Accents and Environments

| Scenario | Expected Behavior | Notes |
|----------|-------------------|-------|
| **Clear speech, quiet room** | 90%+ accuracy | Ideal conditions |
| **Background noise** | 70-80% accuracy | Show "low confidence" warning |
| **Strong accent** | 60-70% accuracy | Allow retry, show parsed text for confirmation |
| **Very fast speech** | Lower accuracy | Slow speech rate recommendation in UI |
| **Urdu speech** | Browser-dependent | Chrome best, Safari limited |

### Mock Voice Recognition (for automated tests)

```typescript
// tests/mocks/speechRecognition.ts
export class MockSpeechRecognition {
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;

  start() {
    // Simulate recognition after delay
    setTimeout(() => {
      const mockEvent = {
        results: [[{
          transcript: "add task test task",
          confidence: 0.95
        }]]
      };
      this.onresult?.(mockEvent as any);
    }, 100);
  }

  stop() {}
}

// Test usage
beforeEach(() => {
  window.SpeechRecognition = MockSpeechRecognition as any;
});

test('should parse voice command', async () => {
  const { result } = renderHook(() => useVoiceCommands());

  await act(async () => {
    await result.current.startRecording();
  });

  // Mock will automatically trigger after 100ms
  await waitFor(() => {
    expect(result.current.state.finalTranscript).toBe("add task test task");
  });
});
```

---

## 5. Browser Compatibility Testing

### Supported Browsers

| Browser | Voice Recognition | Voice Synthesis | RTL Layout | Notes |
|---------|------------------|-----------------|------------|-------|
| Chrome 33+ | ✅ Full support | ✅ Full support | ✅ Full support | Best experience |
| Edge 79+ | ✅ Full support | ✅ Full support | ✅ Full support | Chromium-based |
| Safari 14.1+ | ⚠️ Partial | ✅ Full support | ✅ Full support | Requires permission each time |
| Firefox | ❌ No support | ✅ Full support | ✅ Full support | i18n works, voice doesn't |

### Feature Detection Pattern

```typescript
// src/lib/voice/featureDetection.ts
export interface BrowserCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  localStorage: boolean;
  intl: boolean;
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  return {
    speechRecognition:
      'SpeechRecognition' in window ||
      'webkitSpeechRecognition' in window,

    speechSynthesis: 'speechSynthesis' in window,

    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),

    intl: 'Intl' in window && 'Locale' in Intl
  };
}

// Usage
const capabilities = detectBrowserCapabilities();

if (!capabilities.speechRecognition) {
  console.warn('Voice recognition not supported');
  // Show alternative UI
}
```

### Graceful Degradation Example

```typescript
export function VoiceCommandButton() {
  const capabilities = detectBrowserCapabilities();
  const t = useTranslations('voice');

  if (!capabilities.speechRecognition) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-yellow-800">
          {t('errors.not_supported')}
        </p>
        <p className="text-sm text-yellow-600 mt-2">
          Try using Chrome or Edge for voice commands.
        </p>
      </div>
    );
  }

  // Normal voice button UI
  return <button>...</button>;
}
```

### Cross-Browser Testing Script

```bash
#!/bin/bash
# scripts/test-browsers.sh

echo "Testing in Chrome..."
npx playwright test --project=chromium

echo "Testing in Edge..."
npx playwright test --project=msedge

echo "Testing in Safari..."
npx playwright test --project=webkit

echo "Testing in Firefox..."
npx playwright test --project=firefox

echo "Browser compatibility test complete!"
```

---

## Common Troubleshooting

### Issue 1: Voice recognition not working

**Symptoms**: Microphone button doesn't respond, no speech detected

**Checklist**:
- [ ] Check browser support: Chrome/Edge/Safari only
- [ ] Verify HTTPS connection (required for microphone access)
- [ ] Check microphone permission status in browser
- [ ] Test microphone with other apps (ensure hardware works)
- [ ] Open browser console for error messages

**Solution**:
```typescript
// Add error handling
recognition.onerror = (event) => {
  console.error('Speech recognition error:', event.error);

  switch (event.error) {
    case 'not-allowed':
      alert('Microphone permission denied. Check browser settings.');
      break;
    case 'no-speech':
      alert('No speech detected. Please try again.');
      break;
    default:
      alert(`Error: ${event.error}`);
  }
};
```

### Issue 2: Urdu text not displaying correctly

**Symptoms**: Urdu characters appear as boxes, RTL not working

**Checklist**:
- [ ] Verify Urdu font installed on system
- [ ] Check `<html dir="rtl">` attribute is set
- [ ] Verify JSON file is UTF-8 encoded
- [ ] Check browser language settings

**Solution**:
```typescript
// Force UTF-8 encoding in Next.js config
export default {
  i18n: {
    locales: ['en', 'ur'],
    defaultLocale: 'en',
  },
  // Ensure proper encoding
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
      parser: {
        parse: JSON.parse,
      },
    });
    return config;
  },
};
```

### Issue 3: Translation keys missing

**Symptoms**: English text shown instead of Urdu, console warnings

**Checklist**:
- [ ] Key exists in `ur.json`
- [ ] Key path matches exactly (case-sensitive)
- [ ] No typos in namespace/category/key
- [ ] Translation file properly imported

**Solution**:
```typescript
// Add fallback with warning
const t = useTranslations('tasks');

function getTranslation(key: string): string {
  try {
    return t(key);
  } catch (error) {
    console.warn(`Missing translation: tasks.${key}`);
    return key; // Fallback to key name
  }
}
```

---

## Performance Optimization

### Bundle Size Optimization

```typescript
// next.config.ts
export default {
  i18n: {
    localeDetection: true,
  },
  // Code-split translations by locale
  experimental: {
    optimizePackageImports: ['next-intl'],
  },
};
```

### Lazy Loading Voice Components

```typescript
// Only load voice components when needed
const VoiceCommandButton = dynamic(
  () => import('@/components/VoiceCommandButton'),
  {
    ssr: false, // Don't render on server
    loading: () => <Skeleton className="h-10 w-10" />,
  }
);
```

---

## Next Steps

After completing this quickstart:

1. **Read the spec**: [spec.md](./spec.md) for full requirements
2. **Review plan**: [plan.md](./plan.md) for architecture decisions
3. **Check contracts**: [contracts/](./contracts/) for API schemas
4. **Run tasks**: Use `/sp.tasks` to generate implementation tasks
5. **Implement features**: Use `/sp.implement` to execute tasks

---

## Additional Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [Urdu Typography Guidelines](https://www.w3.org/International/articles/urdu-typing/)
