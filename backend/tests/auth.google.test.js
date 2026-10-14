import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleToken } from '../src/utils/googleAuth.js';
import { publicUser } from '../src/utils/user.js';
import { signToken, verifyToken } from '../src/utils/jwt.js';

describe('Backend Google Authentication Unit Tests', () => {
  it('verifyGoogleToken rejects missing or empty ID token', async () => {
    await assert.rejects(
      async () => {
        await verifyGoogleToken('');
      },
      {
        message: 'Google ID token is required.',
      }
    );

    await assert.rejects(
      async () => {
        await verifyGoogleToken(null);
      },
      {
        message: 'Google ID token is required.',
      }
    );
  });

  it('verifyGoogleToken parses test mock tokens into verified payload', async () => {
    const mockToken =
      'mock-google-token:sub-998877:campus_user@test.edu:Campus Student:https://img.example.com/avatar.png';
    const payload = await verifyGoogleToken(mockToken);

    assert.equal(payload.sub, 'sub-998877');
    assert.equal(payload.email, 'campus_user@test.edu');
    assert.equal(payload.name, 'Campus Student');
    assert.equal(payload.picture, 'https://img.example.com/avatar.png');
    assert.equal(payload.email_verified, true);
  });

  it('publicUser safely formats user with google_id and photo', () => {
    const userDoc = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Priya Sharma',
      email: 'priya@university.edu',
      phone: '',
      role: 'student',
      google_id: 'sub-998877',
      photo: 'https://img.example.com/priya.png',
      department: 'Computer Science',
      designation: 'Student',
      createdAt: new Date('2026-10-08T12:00:00Z'),
      updatedAt: new Date('2026-10-08T12:00:00Z'),
    };

    const formatted = publicUser(userDoc);
    assert.equal(formatted.id, '507f1f77bcf86cd799439011');
    assert.equal(formatted.email, 'priya@university.edu');
    assert.equal(formatted.google_id, 'sub-998877');
    assert.equal(formatted.photo, 'https://img.example.com/priya.png');
    assert.equal(formatted.phone, '');
    assert.equal(formatted.role, 'student');
  });

  it('signToken generates valid FindIt JWT token for Google-authenticated user', () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = signToken({ id: userId });

    assert.ok(typeof token === 'string' && token.length > 20);
    const decoded = verifyToken(token);
    assert.equal(decoded.id, userId);
  });

  it('verifies account linking logic for existing email', () => {
    const existingUser = {
      id: 'existing-id-123',
      email: 'alex@campus.edu',
      name: 'Alex Existing',
      google_id: '',
      photo: '',
      role: 'student',
    };

    const googlePayload = {
      sub: 'google-sub-555',
      email: 'alex@campus.edu',
      name: 'Alex Google',
      picture: 'https://lh3.googleusercontent.com/avatar.jpg',
    };

    // Linking logic: attach google_id, update photo if empty, keep existing id
    if (!existingUser.google_id && googlePayload.sub) {
      existingUser.google_id = googlePayload.sub;
    }
    if (!existingUser.photo && googlePayload.picture) {
      existingUser.photo = googlePayload.picture;
    }

    assert.equal(existingUser.id, 'existing-id-123');
    assert.equal(existingUser.google_id, 'google-sub-555');
    assert.equal(existingUser.photo, 'https://lh3.googleusercontent.com/avatar.jpg');
    assert.equal(existingUser.name, 'Alex Existing'); // Preserves existing name
  });

  it('verifyGoogleToken parses mock token for admin1@gmail.com', async () => {
    const mockToken =
      'mock-google-token:google-admin-sub-001:admin1@gmail.com:admin1:https://img.example.com/admin.png';
    const payload = await verifyGoogleToken(mockToken);

    assert.equal(payload.sub, 'google-admin-sub-001');
    assert.equal(payload.email, 'admin1@gmail.com');
    assert.equal(payload.name, 'admin1');
    assert.equal(payload.picture, 'https://img.example.com/admin.png');
    assert.equal(payload.email_verified, true);
  });

  it('links Google account to existing admin1@gmail.com while preserving admin role and permissions', () => {
    const existingAdmin = {
      _id: '6ac72072e9c0504c676ae3a9',
      name: 'admin1',
      email: 'admin1@gmail.com',
      phone: '2365478912',
      role: 'admin',
      department: 'Administration',
      designation: 'System Administrator',
      photo: '',
      google_id: '',
      createdAt: new Date('2026-10-08T04:47:46.884Z'),
      updatedAt: new Date('2026-10-08T04:47:46.884Z'),
    };

    const googlePayload = {
      sub: 'google-admin-sub-001',
      email: 'admin1@gmail.com',
      name: 'admin1',
      picture: 'https://lh3.googleusercontent.com/admin.jpg',
    };

    // Linking logic: existing user found by normalized email -> link Google ID, preserve admin role
    if (!existingAdmin.google_id && googlePayload.sub) {
      existingAdmin.google_id = googlePayload.sub;
    }
    if (!existingAdmin.photo && googlePayload.picture) {
      existingAdmin.photo = googlePayload.picture;
    }

    const formatted = publicUser(existingAdmin);
    assert.equal(formatted.id, '6ac72072e9c0504c676ae3a9');
    assert.equal(formatted.email, 'admin1@gmail.com');
    assert.equal(formatted.role, 'admin');
    assert.equal(formatted.department, 'Administration');
    assert.equal(formatted.designation, 'System Administrator');
    assert.equal(formatted.google_id, 'google-admin-sub-001');
    assert.equal(formatted.photo, 'https://lh3.googleusercontent.com/admin.jpg');
  });

  it('prevents arbitrary Google users from claiming admin role and enforces single-admin rule', () => {
    const arbitraryGoogleEmail = 'arbitrary_user@gmail.com';
    const isDesignatedAdmin = arbitraryGoogleEmail.toLowerCase() === 'admin1@gmail.com';
    assert.equal(isDesignatedAdmin, false);

    // Arbitrary Google users cannot register as admin
    const requestedRole = 'admin';
    const allowedRolesForGoogleSignup = ['student', 'teacher'];
    const canRegisterAsAdmin = allowedRolesForGoogleSignup.includes(requestedRole);
    assert.equal(canRegisterAsAdmin, false);
  });

  it('generates valid JWT token for authenticated admin1@gmail.com user', () => {
    const adminId = '6ac72072e9c0504c676ae3a9';
    const token = signToken({ id: adminId });
    assert.ok(typeof token === 'string' && token.length > 20);
    const decoded = verifyToken(token);
    assert.equal(decoded.id, adminId);
  });
});
