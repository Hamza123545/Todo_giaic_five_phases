/**
 * MSW Server for Integration Tests
 *
 * Sets up Mock Service Worker for API interception in Node.js environment (Jest tests)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server with request handlers
export const server = setupServer(...handlers);
