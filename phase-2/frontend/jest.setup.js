// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

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
