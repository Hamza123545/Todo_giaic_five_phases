#!/usr/bin/env node

/**
 * Translation Key Validation Script
 *
 * Validates that all translation keys in en.json exist in ur.json and vice versa.
 * Ensures consistency between English and Urdu translation files.
 *
 * Usage: node scripts/validate-translations.js
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const EN_FILE = path.join(MESSAGES_DIR, 'en.json');
const UR_FILE = path.join(MESSAGES_DIR, 'ur.json');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Recursively extract all keys from a nested object
 */
function extractKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Load and parse a JSON file
 */
function loadTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${filePath}:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Find missing keys between two sets
 */
function findMissingKeys(sourceKeys, targetKeys) {
  return sourceKeys.filter(key => !targetKeys.includes(key));
}

/**
 * Main validation function
 */
function validateTranslations() {
  console.log(`${colors.cyan}🌐 Translation Key Validation${colors.reset}\n`);

  // Load translation files
  console.log(`${colors.blue}Loading translation files...${colors.reset}`);
  const enTranslations = loadTranslations(EN_FILE);
  const urTranslations = loadTranslations(UR_FILE);

  // Extract all keys
  const enKeys = extractKeys(enTranslations).sort();
  const urKeys = extractKeys(urTranslations).sort();

  console.log(`  • English (en.json): ${colors.green}${enKeys.length}${colors.reset} keys`);
  console.log(`  • Urdu (ur.json): ${colors.green}${urKeys.length}${colors.reset} keys\n`);

  // Find missing keys
  const missingInUrdu = findMissingKeys(enKeys, urKeys);
  const missingInEnglish = findMissingKeys(urKeys, enKeys);

  let hasErrors = false;

  // Report missing keys in Urdu
  if (missingInUrdu.length > 0) {
    hasErrors = true;
    console.log(`${colors.red}✗ Missing in ur.json (${missingInUrdu.length}):${colors.reset}`);
    missingInUrdu.forEach(key => {
      console.log(`  ${colors.red}•${colors.reset} ${key}`);
    });
    console.log();
  }

  // Report missing keys in English
  if (missingInEnglish.length > 0) {
    hasErrors = true;
    console.log(`${colors.red}✗ Missing in en.json (${missingInEnglish.length}):${colors.reset}`);
    missingInEnglish.forEach(key => {
      console.log(`  ${colors.red}•${colors.reset} ${key}`);
    });
    console.log();
  }

  // Report success or failure
  if (!hasErrors) {
    console.log(`${colors.green}✓ All translation keys are synchronized!${colors.reset}`);
    console.log(`${colors.green}✓ Both files contain ${enKeys.length} keys${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Translation validation failed${colors.reset}`);
    console.log(`${colors.yellow}Please add missing keys to ensure both files are synchronized.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run validation
validateTranslations();
