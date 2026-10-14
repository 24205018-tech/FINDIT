import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let oauthClientInstance = null;

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!oauthClientInstance || oauthClientInstance._clientId !== clientId) {
    oauthClientInstance = new OAuth2Client(clientId);
    oauthClientInstance._clientId = clientId;
  }
  return oauthClientInstance;
}

/**
 * Verify a Google ID Token received from frontend Google Identity Services.
 * @param {string} idToken
 * @returns {Promise<{ sub: string, email: string, name: string, picture: string, email_verified: boolean }>}
 */
export async function verifyGoogleToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID token is required.');
  }

  // Support mock tokens for automated tests and offline testing
  if (idToken.startsWith('mock-google-token:')) {
    const parts = idToken.split(':');
    const sub = parts[1] || 'mock-google-sub-12345';
    const email = parts[2] || 'mockuser@example.com';
    const name = parts[3] || 'Mock Google User';
    const picture = parts.slice(4).join(':') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
    return {
      sub,
      email: email.toLowerCase().trim(),
      name,
      picture,
      email_verified: true,
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'your-google-client-id.apps.googleusercontent.com') {
    // If client ID is placeholder, warn clearly
    throw new Error('GOOGLE_CLIENT_ID is not configured with a valid Google Cloud Client ID in backend/.env');
  }

  const client = getGoogleOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token: empty payload.');
  }

  if (!payload.email) {
    throw new Error('Google token does not contain an email address.');
  }

  return {
    sub: payload.sub,
    email: String(payload.email).toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
    email_verified: Boolean(payload.email_verified),
    given_name: payload.given_name || '',
    family_name: payload.family_name || '',
  };
}
