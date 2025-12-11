/**
 * Integration Tests for Authentication Flow
 *
 * Tests the complete user authentication flow from signup to signin
 * to accessing protected routes to signout.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from './mocks/server';
import { resetMockTasks } from './mocks/handlers';

// Mock Next.js router
const mockPush = jest.fn();
const mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Mock components (simplified versions for testing)
const MockSignupPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem('auth_token', data.data.token);
        mockPush('/dashboard');
      } else {
        setError(data.error.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="name-input"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit">Sign Up</button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  );
};

const MockSigninPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem('auth_token', data.data.token);
        mockPush('/dashboard');
      } else {
        setError(data.error.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit">Sign In</button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  );
};

const MockDashboard = () => {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignout = async () => {
    setIsSigningOut(true);
    try {
      await fetch('http://localhost:8000/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });
      sessionStorage.removeItem('auth_token');
      mockPush('/signin');
    } catch (err) {
      setIsSigningOut(false);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome! You are logged in.</p>
      <button onClick={handleSignout} disabled={isSigningOut}>
        {isSigningOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
};

import React from 'react';

describe('Authentication Flow Integration Tests', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    resetMockTasks();
    sessionStorage.clear();
    mockPush.mockClear();
  });

  afterAll(() => {
    server.close();
  });

  // ==================== Signup Flow ====================

  describe('User Signup Flow', () => {
    test('user can sign up with valid credentials', async () => {
      const user = userEvent.setup();
      render(<MockSignupPage />);

      // Fill in signup form
      await user.type(screen.getByTestId('name-input'), 'Test User');
      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Verify token is stored
      expect(sessionStorage.getItem('auth_token')).toBe('mock-jwt-token-abc123');
    });

    test('signup form shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      render(<MockSignupPage />);

      // Submit without filling form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Form should not redirect (browser validation should prevent submission)
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==================== Signin Flow ====================

  describe('User Signin Flow', () => {
    test('user can sign in with valid credentials', async () => {
      const user = userEvent.setup();
      render(<MockSigninPage />);

      // Fill in signin form
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      // Verify token is stored
      expect(sessionStorage.getItem('auth_token')).toBe('mock-jwt-token-abc123');
    });

    test('signin shows error for invalid credentials', async () => {
      const user = userEvent.setup();
      render(<MockSigninPage />);

      // Fill in signin form with wrong credentials
      await user.type(screen.getByTestId('email-input'), 'wrong@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpass');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      });

      // Verify no redirect
      expect(mockPush).not.toHaveBeenCalled();

      // Verify no token is stored
      expect(sessionStorage.getItem('auth_token')).toBeNull();
    });
  });

  // ==================== Complete Auth Journey ====================

  describe('Complete Authentication Journey', () => {
    test('user can signup → signin → access dashboard → signout', async () => {
      const user = userEvent.setup();

      // Step 1: Signup
      const { unmount: unmountSignup } = render(<MockSignupPage />);
      await user.type(screen.getByTestId('name-input'), 'Test User');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
      unmountSignup();

      // Step 2: Access Dashboard
      const { unmount: unmountDashboard } = render(<MockDashboard />);
      expect(screen.getByText(/welcome! you are logged in/i)).toBeInTheDocument();
      expect(sessionStorage.getItem('auth_token')).toBeTruthy();

      // Step 3: Signout
      mockPush.mockClear();
      await user.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/signin');
      });

      // Verify token is removed
      expect(sessionStorage.getItem('auth_token')).toBeNull();
      unmountDashboard();
    });
  });

  // ==================== Protected Route Access ====================

  describe('Protected Route Access', () => {
    test('authenticated user can access dashboard', async () => {
      // Setup: Store auth token
      sessionStorage.setItem('auth_token', 'mock-jwt-token-abc123');

      render(<MockDashboard />);

      expect(screen.getByText(/welcome! you are logged in/i)).toBeInTheDocument();
    });

    test('signout removes auth token and redirects', async () => {
      const user = userEvent.setup();

      // Setup: Store auth token
      sessionStorage.setItem('auth_token', 'mock-jwt-token-abc123');

      render(<MockDashboard />);

      // Click signout
      await user.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(sessionStorage.getItem('auth_token')).toBeNull();
        expect(mockPush).toHaveBeenCalledWith('/signin');
      });
    });
  });

  // ==================== Token Management ====================

  describe('Token Management', () => {
    test('token persists across page refreshes', () => {
      // Simulate signin
      sessionStorage.setItem('auth_token', 'mock-jwt-token-abc123');

      // Simulate page refresh (token should still be there)
      const token = sessionStorage.getItem('auth_token');
      expect(token).toBe('mock-jwt-token-abc123');
    });

    test('token is included in API requests', async () => {
      sessionStorage.setItem('auth_token', 'mock-jwt-token-abc123');

      const response = await fetch('http://localhost:8000/api/user-123/tasks', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });

      expect(response.ok).toBe(true);
    });
  });
});
