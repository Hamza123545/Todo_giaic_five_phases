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
    // Pattern with title and description: "create task name of X and description will be Y"
    /^(?:add|create|new)\s+task\s+(?:of\s+)?name\s+(?:of|is)?\s*(.+?)\s+(?:and\s+)?(?:description\s+(?:will\s+be|is)?\s*(.+))$/i,
    /^(?:add|create|new)\s+task\s+(?:called|named|titled)\s+(.+?)\s+(?:and\s+)?(?:description\s+(?:will\s+be|is)?\s*(.+))$/i,
    // Pattern with recurring: "create daily task X"
    /^(?:add|create|new)\s+(?:daily|weekly|monthly|yearly)\s+task\s+(?:called|named|titled)?\s*(.+)$/i,
    /^(?:add|create|new)\s+task\s+(?:called|named|titled)?\s*(.+?)\s+(?:recurring|repeat)\s+(?:daily|weekly|monthly|yearly)$/i,
    // Standard patterns
    /^(?:add|create|new)\s+task\s*:?\s*(.+)$/i,
    /^(?:add|create|new)\s+task\s+(?:called|named|titled)?\s*(.+)$/i,
    /^(?:add|create|new)\s+(.+)$/i,
    /^(?:create|make|add)\s+a?\s*(?:new)?\s*task\s+(?:called|named|titled|about)?\s*(.+)$/i,
    /^(?:i\s+)?(?:want\s+to\s+)?(?:add|create|make)\s+(?:a\s+)?(?:new\s+)?task\s+(?:called|named|titled|about)?\s*(.+)$/i,
    /^(?:task|todo)\s*:?\s*(.+)$/i,
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
    /^(?:update|edit|change|modify)\s+task\s+(\d+)\s+(?:to|with|to be|as)\s+(.+)$/i,
    /^(?:rename|change|update)\s+task\s+(\d+)\s+(?:to|as|with)\s+(.+)$/i,
    /^task\s+(\d+)\s+(?:should be|is|to be)\s+(.+)$/i,
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
  // Normalize transcript: remove extra spaces, handle punctuation
  const normalized = transcript
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[.,;:!?]+/g, ' ') // Remove punctuation but keep as space
    .trim();
  
  const patterns = getCommandPatterns(locale);

  // Try to match against each intent pattern
  for (const [intent, regexList] of Object.entries(patterns)) {
    if (intent === 'UNKNOWN') continue;

    for (const regex of regexList) {
      const match = normalized.match(regex);
      if (match) {
        // For CREATE_TASK, ensure we capture everything after the command
        if (intent === 'CREATE_TASK' && match[1]) {
          // If the captured group seems incomplete, try to get more
          const commandIndex = normalized.toLowerCase().search(/(?:add|create|new|make|task|todo)/i);
          if (commandIndex >= 0) {
            const afterCommand = normalized.substring(commandIndex);
            const taskMatch = afterCommand.match(/(?:add|create|new|make|task|todo)\s*(?:called|named|titled|about|:)?\s*(.+)/i);
            if (taskMatch && taskMatch[1] && taskMatch[1].length > match[1].length) {
              match[1] = taskMatch[1].trim();
            }
          }
        }
        
        return {
          transcript: normalized,
          intent: intent as VoiceIntent,
          parameters: extractParameters(intent as VoiceIntent, match, normalized),
          confidence: calculateConfidence(match),
          timestamp: Date.now(),
          locale,
        };
      }
    }
  }

  // Fallback: Try to detect CREATE_TASK even if pattern doesn't match perfectly
  // This helps with natural speech variations
  const createTaskKeywords = locale === 'ur' 
    ? /(?:نیا|کام|شامل|بنائیں)/i
    : /(?:add|create|new|make|task|todo)/i;
  
  if (createTaskKeywords.test(normalized)) {
    // Try to extract title and description from full transcript
    // Pattern: "create task name of X and description will be Y"
    const fullPattern = new RegExp(
      `(?:${createTaskKeywords.source})\\s+(?:task\\s+)?(?:of\\s+)?name\\s+(?:of|is)?\\s*(.+?)(?:\\s+and\\s+description\\s+(?:will\\s+be|is)\\s*(.+))?$`,
      'i'
    );
    const fullMatch = normalized.match(fullPattern);
    
    if (fullMatch) {
      return {
        transcript: normalized,
        intent: 'CREATE_TASK',
        parameters: extractParameters('CREATE_TASK', fullMatch, normalized),
        confidence: 0.7, // Lower confidence for fallback
        timestamp: Date.now(),
        locale,
      };
    }
    
    // Fallback: Extract everything after the first command keyword
    const keywordMatch = normalized.match(new RegExp(`(?:${createTaskKeywords.source})\\s*(?:called|named|titled|about|:)?\\s*(.+)`, 'i'));
    if (keywordMatch && keywordMatch[1]) {
      return {
        transcript: normalized,
        intent: 'CREATE_TASK',
        parameters: extractParameters('CREATE_TASK', keywordMatch, normalized),
        confidence: 0.7, // Lower confidence for fallback
        timestamp: Date.now(),
        locale,
      };
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
  match: RegExpMatchArray,
  fullTranscript?: string
): Record<string, any> {
  switch (intent) {
    case 'CREATE_TASK':
      // Check if we have both title and description (match[1] and match[2])
      let title = match[1]?.trim() || '';
      let description = match[2]?.trim() || '';
      let recurringPattern: string | undefined = undefined;
      
      // Extract recurring pattern from transcript
      if (fullTranscript) {
        const recurringMatch = fullTranscript.match(/\b(daily|weekly|monthly|yearly)\b/i);
        if (recurringMatch) {
          recurringPattern = recurringMatch[1].toUpperCase();
        }
      }
      
      // If we only have one match group, it might be title only or combined
      if (!description && title) {
        // Try to split title and description if they're combined
        // Look for patterns like "title and description is Y" or "title, description Y"
        const splitPatterns = [
          /^(.+?)\s+(?:and\s+)?(?:description\s+(?:will\s+be|is)?\s*(.+))$/i,
          /^(.+?)\s*,\s*(?:description\s+)?(.+)$/i,
          /^(.+?)\s+(?:with\s+description\s+)?(.+)$/i,
        ];
        
        for (const pattern of splitPatterns) {
          const splitMatch = title.match(pattern);
          if (splitMatch && splitMatch[1] && splitMatch[2]) {
            title = splitMatch[1].trim();
            description = splitMatch[2].trim();
            break;
          }
        }
      }
      
      // If title seems incomplete or too short, try to extract from full transcript
      if ((!title || title.length < 3) && fullTranscript) {
        // Find the command keyword and get everything after it
        const commandPattern = /(?:add|create|new|make|task|todo)\s*(?:of\s+)?name\s+(?:of|is)?\s*(.+?)(?:\s+and\s+description|$)/i;
        const fullMatch = fullTranscript.match(commandPattern);
        if (fullMatch && fullMatch[1]) {
          title = fullMatch[1].trim();
        } else {
          // Fallback: get everything after command
          const fallbackPattern = /(?:add|create|new|make|task|todo)\s*(?:called|named|titled|about|:)?\s*(.+)/i;
          const fallbackMatch = fullTranscript.match(fallbackPattern);
          if (fallbackMatch && fallbackMatch[1]) {
            title = fallbackMatch[1].trim();
          }
        }
      }
      
      // Extract description if not already captured
      if (!description && fullTranscript) {
        const descPatterns = [
          // "and description will be X" or "and description is X"
          /(?:and\s+)?description\s+(?:will\s+be|is)\s*(.+?)(?:\s+and\s+recurring|\s+recurring|$)/i,
          // "description: X" or ", description X"
          /(?:,\s*)?description\s*:?\s*(.+?)(?:\s+and\s+recurring|\s+recurring|$)/i,
          // "with description X"
          /with\s+description\s+(.+?)(?:\s+and\s+recurring|\s+recurring|$)/i,
        ];
        
        for (const pattern of descPatterns) {
          const descMatch = fullTranscript.match(pattern);
          if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
            // Remove trailing "and recurring" or similar phrases
            description = description.replace(/\s+(?:and\s+)?(?:recurring|repeat|daily|weekly|monthly|yearly).*$/i, '').trim();
            break;
          }
        }
      }
      
      // If still no description, check if title contains "and description" pattern
      if (!description && title && fullTranscript) {
        // Pattern: "name of X and description will be Y"
        const nameDescPattern = /name\s+(?:of|is)?\s*(.+?)\s+and\s+description\s+(?:will\s+be|is)\s*(.+)/i;
        const nameDescMatch = fullTranscript.match(nameDescPattern);
        if (nameDescMatch && nameDescMatch[1] && nameDescMatch[2]) {
          title = nameDescMatch[1].trim();
          description = nameDescMatch[2].trim();
        }
      }
      
      // Remove common filler words at the start
      title = title.replace(/^(?:a|an|the|to|for|with|about)\s+/i, '').trim();
      description = description.replace(/^(?:a|an|the|to|for|with|about)\s+/i, '').trim();
      
      return {
        title: title || '',
        description: description || '',
        recurring_pattern: recurringPattern,
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
