/**
 * MSW Server for Integration Tests
 *
 * Sets up Mock Service Worker for API interception in Node.js environment (Jest tests)
 */

const { setupServer } = require('msw/node');
const { handlers } = require('./handlers');

// Create MSW server with request handlers
export const server = setupServer(...handlers);
