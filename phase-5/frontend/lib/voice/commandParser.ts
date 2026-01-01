import type { VoiceCommand, VoiceIntent } from '@/types/voice';
import type { Locale } from '@/types/i18n';

/**
 * Voice Command Parser
 *
 * Parses natural language voice transcripts into structured commands
 * Supports both English and Urdu languages
 */

/**
 * Command patterns for English language
 */
const ENGLISH_PATTERNS: Record<VoiceIntent, RegExp[]> = {
  CREATE_TASK: [
    /^(?:add|create|new)\s+task\s*:?\s+(.+)$/i,
    /^(?:add|create|new)\s+(.+)$/i,
    /^(?:create|make|add)\s+a?\s*(?:new)?\s*task\s+(?:called|named)?\s*(.+)$/i,
  ],
  COMPLETE_TASK: [
    /^(?:complete|finish|done|mark)\s+task\s+(\d+)$/i,
    /^(?:mark|set)\s+task\s+(\d+)\s+(?:as\s+)?(?:complete|done|finished)$/i,
    /^task\s+(\d+)\s+(?:is\s+)?(?:complete|done|finished)$/i,
  ],
  DELETE_TASK: [
    /^(?:delete|remove)\s+task\s+(\d+)$/i,
    /^(?:remove|delete|cancel)\s+task\s+number\s+(\d+)$/i,
  ],
  UPDATE_TASK: [
    /^(?:update|edit|change)\s+task\s+(\d+)\s+(?:to|with)\s+(.+)$/i,
    /^(?:rename|change)\s+task\s+(\d+)\s+(.+)$/i,
  ],
  FILTER_TASKS: [
    /^(?:show|display|filter|list)\s+(?:all\s+)?(\w+)\s+(?:priority\s+)?tasks?$/i,
    /^(?:show|display)\s+(?:tasks?\s+)?(?:with\s+)?(\w+)\s+priority$/i,
    /^(?:show|display|list)\s+(?:all\s+)?(\w+)\s+tasks?$/i,
  ],
  READ_TASKS: [
    /^(?:read|speak|tell me)\s+(?:my\s+)?tasks?$/i,
    /^(?:what are|list)\s+(?:my\s+)?tasks?$/i,
    /^(?:read|tell me)\s+(?:all\s+)?(?:my\s+)?tasks?\s+(?:aloud|out loud)?$/i,
  ],
  SHOW_HELP: [
    /^(?:help|what can (?:i|you) do|show commands?)$/i,
    /^(?:voice\s+)?(?:help|commands?)$/i,
  ],
  UNKNOWN: [],
};

/**
 * Command patterns for Urdu language
 */
const URDU_PATTERNS: Record<VoiceIntent, RegExp[]> = {
  CREATE_TASK: [
    /^(?:نیا|نیا کام|کام شامل کریں)\s*:?\s+(.+)$/i,
    /^(?:بنائیں|شامل کریں)\s+(.+)$/i,
  ],
  COMPLETE_TASK: [
    /^(?:مکمل کریں|ختم کریں)\s+کام\s+(\d+)$/i,
    /^کام\s+(\d+)\s+مکمل$/i,
  ],
  DELETE_TASK: [
    /^(?:حذف کریں|ہٹائیں)\s+کام\s+(\d+)$/i,
    /^کام\s+(\d+)\s+حذف$/i,
  ],
  UPDATE_TASK: [
    /^(?:تبدیل کریں|ترمیم کریں)\s+کام\s+(\d+)\s+(.+)$/i,
  ],
  FILTER_TASKS: [
    /^(?:دکھائیں|فلٹر کریں)\s+(.+)\s+کام$/i,
    /^(.+)\s+کام\s+دکھائیں$/i,
  ],
  READ_TASKS: [
    /^(?:پڑھیں|سنائیں)\s+کام$/i,
    /^(?:میرے\s+)?کام\s+(?:پڑھیں|سنائیں)$/i,
  ],
  SHOW_HELP: [
    /^(?:مدد|کمانڈز)$/i,
  ],
  UNKNOWN: [],
};

/**
 * Get command patterns for a specific locale
 */
function getCommandPatterns(locale: Locale): Record<VoiceIntent, RegExp[]> {
  return locale === 'ur' ? URDU_PATTERNS : ENGLISH_PATTERNS;
}

/**
 * Parse a voice transcript into a structured command
 *
 * @param transcript - Raw voice transcript text
 * @param locale - Current language locale
 * @returns Structured voice command object
 */
export function parseVoiceCommand(
  transcript: string,
  locale: Locale = 'en'
): VoiceCommand {
  const normalized = transcript.trim();
  const patterns = getCommandPatterns(locale);

  // Try to match against each intent pattern
  for (const [intent, regexList] of Object.entries(patterns)) {
    if (intent === 'UNKNOWN') continue;

    for (const regex of regexList) {
      const match = normalized.match(regex);
      if (match) {
        return {
          transcript: normalized,
          intent: intent as VoiceIntent,
          parameters: extractParameters(intent as VoiceIntent, match),
          confidence: calculateConfidence(match),
          timestamp: Date.now(),
          locale,
        };
      }
    }
  }

  // No pattern matched - return UNKNOWN intent
  return {
    transcript: normalized,
    intent: 'UNKNOWN',
    parameters: {},
    confidence: 0,
    timestamp: Date.now(),
    locale,
  };
}

/**
 * Extract parameters from regex match based on intent type
 */
function extractParameters(
  intent: VoiceIntent,
  match: RegExpMatchArray
): Record<string, any> {
  switch (intent) {
    case 'CREATE_TASK':
      return {
        title: match[1]?.trim() || '',
      };

    case 'COMPLETE_TASK':
    case 'DELETE_TASK':
      return {
        taskNumber: parseInt(match[1], 10),
      };

    case 'UPDATE_TASK':
      return {
        taskNumber: parseInt(match[1], 10),
        newTitle: match[2]?.trim() || '',
      };

    case 'FILTER_TASKS':
      return {
        filter: normalizeFilterType(match[1]?.toLowerCase()),
      };

    case 'READ_TASKS':
    case 'SHOW_HELP':
      return {};

    default:
      return {};
  }
}

/**
 * Normalize filter type from various natural language inputs
 */
function normalizeFilterType(filter: string | undefined): string {
  if (!filter) return 'all';

  const normalized = filter.toLowerCase();

  // Priority filters
  if (normalized.match(/high|urgent|important|زیادہ|اہم/)) return 'high';
  if (normalized.match(/medium|normal|درمیانہ/)) return 'medium';
  if (normalized.match(/low|کم/)) return 'low';

  // Status filters
  if (normalized.match(/complete|completed|done|finished|مکمل/)) return 'completed';
  if (normalized.match(/incomplete|pending|active|نامکمل/)) return 'incomplete';

  // Default to all
  return 'all';
}

/**
 * Calculate confidence score based on match quality
 * Higher confidence for more specific matches
 */
function calculateConfidence(match: RegExpMatchArray): number {
  // Base confidence
  let confidence = 0.8;

  // Increase confidence if multiple capture groups matched
  const captureGroups = match.slice(1).filter((g) => g !== undefined).length;
  confidence += captureGroups * 0.05;

  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Validate if a command has all required parameters
 */
export function isValidCommand(command: VoiceCommand): boolean {
  if (command.intent === 'UNKNOWN') return false;
  if (command.confidence < 0.5) return false;

  // Validate required parameters for each intent
  switch (command.intent) {
    case 'CREATE_TASK':
      return !!command.parameters.title && command.parameters.title.length > 0;

    case 'COMPLETE_TASK':
    case 'DELETE_TASK':
      return (
        typeof command.parameters.taskNumber === 'number' &&
        command.parameters.taskNumber > 0
      );

    case 'UPDATE_TASK':
      return (
        typeof command.parameters.taskNumber === 'number' &&
        command.parameters.taskNumber > 0 &&
        !!command.parameters.newTitle &&
        command.parameters.newTitle.length > 0
      );

    case 'FILTER_TASKS':
      return !!command.parameters.filter;

    case 'READ_TASKS':
    case 'SHOW_HELP':
      return true;

    default:
      return false;
  }
}

/**
 * Get user-friendly description of a voice command
 */
export function getCommandDescription(
  command: VoiceCommand,
  locale: Locale = 'en'
): string {
  const { intent, parameters } = command;

  if (locale === 'ur') {
    switch (intent) {
      case 'CREATE_TASK':
        return `نیا کام بنائیں: "${parameters.title}"`;
      case 'COMPLETE_TASK':
        return `کام ${parameters.taskNumber} مکمل کریں`;
      case 'DELETE_TASK':
        return `کام ${parameters.taskNumber} حذف کریں`;
      case 'UPDATE_TASK':
        return `کام ${parameters.taskNumber} تبدیل کریں: "${parameters.newTitle}"`;
      case 'FILTER_TASKS':
        return `${parameters.filter} کام دکھائیں`;
      case 'READ_TASKS':
        return `کام پڑھیں`;
      case 'SHOW_HELP':
        return `مدد دکھائیں`;
      default:
        return `نامعلوم کمانڈ`;
    }
  }

  // English descriptions
  switch (intent) {
    case 'CREATE_TASK':
      return `Create task: "${parameters.title}"`;
    case 'COMPLETE_TASK':
      return `Complete task #${parameters.taskNumber}`;
    case 'DELETE_TASK':
      return `Delete task #${parameters.taskNumber}`;
    case 'UPDATE_TASK':
      return `Update task #${parameters.taskNumber}: "${parameters.newTitle}"`;
    case 'FILTER_TASKS':
      return `Show ${parameters.filter} tasks`;
    case 'READ_TASKS':
      return `Read tasks aloud`;
    case 'SHOW_HELP':
      return `Show voice command help`;
    default:
      return `Unknown command`;
  }
}

/**
 * Get example commands for a specific intent and locale
 */
export function getCommandExamples(
  intent: VoiceIntent,
  locale: Locale = 'en'
): string[] {
  if (locale === 'ur') {
    switch (intent) {
      case 'CREATE_TASK':
        return ['نیا کام: گروسری خریدنا', 'کام شامل کریں: میٹنگ کی تیاری'];
      case 'COMPLETE_TASK':
        return ['کام 1 مکمل کریں', 'مکمل کریں کام 2'];
      case 'DELETE_TASK':
        return ['کام 1 حذف کریں', 'حذف کریں کام 3'];
      case 'UPDATE_TASK':
        return ['کام 1 تبدیل کریں نئی عنوان'];
      case 'FILTER_TASKS':
        return ['اہم کام دکھائیں', 'مکمل کام دکھائیں'];
      case 'READ_TASKS':
        return ['کام پڑھیں', 'میرے کام سنائیں'];
      case 'SHOW_HELP':
        return ['مدد', 'کمانڈز'];
      default:
        return [];
    }
  }

  // English examples
  switch (intent) {
    case 'CREATE_TASK':
      return ['Add task: Buy groceries', 'Create task: Prepare for meeting'];
    case 'COMPLETE_TASK':
      return ['Complete task 1', 'Mark task 2 as done'];
    case 'DELETE_TASK':
      return ['Delete task 1', 'Remove task 3'];
    case 'UPDATE_TASK':
      return ['Update task 1 to New Title', 'Change task 2 Different Title'];
    case 'FILTER_TASKS':
      return ['Show high priority tasks', 'Display completed tasks'];
    case 'READ_TASKS':
      return ['Read my tasks', 'Tell me my tasks'];
    case 'SHOW_HELP':
      return ['Help', 'Voice commands'];
    default:
      return [];
  }
}
