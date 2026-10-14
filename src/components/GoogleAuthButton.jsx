import { useEffect, useRef, useState, useCallback } from 'react';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';

/**
 * GoogleAuthButton renders the Google Identity Services Sign-In button
 * and provides seamless Google authentication.
 *
 * @param {Object} props
 * @param {string} [props.role='student'] - Target role (student, teacher, admin)
 * @param {'login'|'register'} [props.mode='login'] - Context mode
 * @param {(user: Object) => void} [props.onSuccess] - Callback when authentication succeeds
 * @param {(err: Error) => void} [props.onError] - Callback on error
 */
export default function GoogleAuthButton({
  role = 'student',
  mode = 'login',
  onSuccess,
  onError,
}) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const gisContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isPlaceholderId =
    !googleClientId ||
    googleClientId === 'your-google-client-id.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(
    async (response) => {
      const idToken = response?.credential;
      if (!idToken) {
        const err = new Error('No Google credentials returned.');
        onError?.(err);
        return;
      }

      setLoading(true);
      try {
        const user = await loginWithGoogle(idToken, role);
        onSuccess?.(user);
      } catch (err) {
        console.error('Google authentication error:', err);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, role, onSuccess, onError]
  );

  useEffect(() => {
    let checkInterval = null;
    let attempts = 0;

    const setupGis = () => {
      if (
        typeof window !== 'undefined' &&
        window.google?.accounts?.id &&
        gisContainerRef.current &&
        !isPlaceholderId
      ) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Clear prior elements to avoid duplicates on re-render
          gisContainerRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(gisContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'register' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 380,
          });

          setGisRendered(true);
          if (checkInterval) clearInterval(checkInterval);
          return true;
        } catch (e) {
          console.warn('Google Identity Services render warning:', e);
        }
      }
      return false;
    };

    if (!setupGis()) {
      checkInterval = setInterval(() => {
        attempts += 1;
        if (setupGis() || attempts > 20) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, isPlaceholderId, mode, handleCredentialResponse]);

  const handleCustomButtonClick = async () => {
    if (loading) return;

    // Check if test environment or mock token requested
    const isTestEnv =
      import.meta.env.MODE === 'test' ||
      typeof window.__MOCK_GOOGLE__ !== 'undefined';

    if (isTestEnv) {
      setLoading(true);
      try {
        const defaultEmail = role === 'admin' ? 'admin1@gmail.com' : 'testuser@example.edu';
        const defaultName = role === 'admin' ? 'admin1' : 'Alex Morgan';
        const mockToken =
          window.__MOCK_GOOGLE_TOKEN__ ||
          `mock-google-token:google-test-sub-${role === 'admin' ? 'admin-1' : '123'}:${defaultEmail}:${defaultName}`;
        const user = await loginWithGoogle(mockToken, role);
        onSuccess?.(user);
      } catch (err) {
        onError?.(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (window.google?.accounts?.id && !isPlaceholderId) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap is skipped/not displayed, fallback to notification
            toast?.show?.({
              kind: 'info',
              title: 'Google Sign-In',
              message: 'Please click the official Google button above.',
            });
          }
        });
      } catch (err) {
        console.error('Google prompt error:', err);
      }
      return;
    }

    // Inform developer/user about Google Client ID configuration
    toast?.show?.({
      kind: 'info',
      title: 'Google OAuth Setup',
      message:
        'To sign in with Google, set your Google Client ID in .env (VITE_GOOGLE_CLIENT_ID) and backend/.env (GOOGLE_CLIENT_ID).',
    });
  };

  const buttonLabel =
    mode === 'register' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <div className="google-auth-wrap" data-testid="google-auth-container">
      {/* Official Google Identity Services Container */}
      <div
        ref={gisContainerRef}
        className={`google-gis-container ${gisRendered ? 'is-visible' : 'is-hidden'}`}
        data-testid="google-gis-container"
      />

      {/* Styled Fallback / Primary Button */}
      {(!gisRendered || loading) && (
        <button
          type="button"
          className="google-btn-fallback"
          onClick={handleCustomButtonClick}
          disabled={loading}
          data-testid="google-auth-btn"
          aria-label={buttonLabel}
        >
          {loading ? (
            <span className="google-btn-spinner" aria-hidden="true" />
          ) : (
            <svg
              className="google-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating with Google…' : buttonLabel}</span>
        </button>
      )}
    </div>
  );
}
