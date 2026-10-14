import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GoogleAuthButton from '../GoogleAuthButton.jsx';
import Login from '../../pages/Login.jsx';
import Register from '../../pages/Register.jsx';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockToastShow = vi.fn();

vi.mock('../../hooks/useAuth.js', () => ({
  default: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    login: mockLogin,
    register: mockRegister,
    loginWithGoogle: mockLoginWithGoogle,
  }),
}));

vi.mock('../../hooks/useToast.jsx', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

describe('Google Authentication Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.__MOCK_GOOGLE__;
    delete window.__MOCK_GOOGLE_TOKEN__;
  });

  afterEach(() => {
    delete window.__MOCK_GOOGLE__;
    delete window.__MOCK_GOOGLE_TOKEN__;
  });

  it('renders "Continue with Google" button in login mode', () => {
    render(
      <MemoryRouter>
        <GoogleAuthButton mode="login" role="student" />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /continue with google/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders "Sign up with Google" button in register mode', () => {
    render(
      <MemoryRouter>
        <GoogleAuthButton mode="register" role="student" />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /sign up with google/i });
    expect(btn).toBeInTheDocument();
  });

  it('triggers loginWithGoogle when user clicks GoogleAuthButton in test environment', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockLoginWithGoogle.mockResolvedValueOnce({
      id: 'usr-123',
      name: 'Alex Morgan',
      email: 'alex@example.edu',
    });

    render(
      <MemoryRouter>
        <GoogleAuthButton mode="login" role="student" onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /continue with google/i });
    await user.click(btn);

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
    expect(mockLoginWithGoogle).toHaveBeenCalledWith(
      expect.stringContaining('mock-google-token:'),
      'student'
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('renders Google authentication and maintains email/password fields on Login page', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Google button and divider
    expect(
      screen.getByRole('button', { name: /continue with google/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/or sign in with email/i)).toBeInTheDocument();

    // Standard email/password fields
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^login/i })
    ).toBeInTheDocument();
  });

  it('renders Google authentication and maintains full form on Register page', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    // Google button and divider
    expect(
      screen.getByRole('button', { name: /sign up with google/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/or register with email/i)).toBeInTheDocument();

    // Standard registration inputs
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('triggers loginWithGoogle for admin with admin1@gmail.com mock token', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockLoginWithGoogle.mockResolvedValueOnce({
      id: 'admin-id-1',
      name: 'admin1',
      email: 'admin1@gmail.com',
      role: 'admin',
    });

    render(
      <MemoryRouter>
        <GoogleAuthButton mode="login" role="admin" onSuccess={onSuccess} />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /continue with google/i });
    await user.click(btn);

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
    expect(mockLoginWithGoogle).toHaveBeenCalledWith(
      expect.stringContaining('admin1@gmail.com'),
      'admin'
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin1@gmail.com',
        role: 'admin',
      })
    );
  });
});
