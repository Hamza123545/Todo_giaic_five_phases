// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock sessionStorage for Node.js environment
class SessionStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.sessionStorage = new SessionStorageMock();
