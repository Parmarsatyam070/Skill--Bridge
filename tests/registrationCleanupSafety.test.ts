import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldRollbackFirebaseRegistration,
  executeRegistrationRollbackIfPermitted,
  REGISTRATION_ROLLBACK_ALLOWED_CODES,
} from '../client/src/context/AuthContext.js';

describe('Firebase Registration Cleanup Safety Suite', () => {
  let mockCreatedUser: any;
  let mockCurrentAuthUser: any;
  let clearTokenCalled: boolean;

  beforeEach(() => {
    mockCreatedUser = {
      uid: 'new-firebase-uid-12345',
      email: 'new.candidate@example.com',
      delete: vi.fn().mockResolvedValue(undefined),
    };
    mockCurrentAuthUser = {
      uid: 'new-firebase-uid-12345',
      email: 'new.candidate@example.com',
    };
    clearTokenCalled = false;
  });

  const onClearToken = () => {
    clearTokenCalled = true;
  };

  // =========================================================================
  // REQUIREMENT 1: ALLOW-LIST VERIFICATION
  // =========================================================================
  it('1. should allow rollback ONLY for explicit documented registration rejection codes', () => {
    // Explicit allow-listed codes
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('ACCOUNT_EXISTS')).toBe(true);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('EMAIL_EXISTS')).toBe(true);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('PHONE_EXISTS')).toBe(true);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('VALIDATION_ERROR')).toBe(true);

    // Explicitly FORBIDDEN codes (never allow rollback)
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('HTTP_500')).toBe(false);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('PROVISIONING_FAILED')).toBe(false);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('INTERNAL_ERROR')).toBe(false);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('DATABASE_ERROR')).toBe(false);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('REQUEST_TIMEOUT')).toBe(false);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('UNKNOWN_ERROR')).toBe(false);
    expect(REGISTRATION_ROLLBACK_ALLOWED_CODES.has('HTTP_409')).toBe(false); // Generic 409 must not bypass allow-list
  });

  // =========================================================================
  // REQUIREMENT 2: PROVE ACCOUNT_EXISTS TRIGGERS CLEANUP
  // =========================================================================
  it('2. [Req: ACCOUNT_EXISTS] should perform cleanup when Firebase user is created and backend returns ACCOUNT_EXISTS', async () => {
    const backendError = {
      code: 'ACCOUNT_EXISTS',
      message: 'An account with this email address already exists. Please sign in instead.',
    };

    expect(shouldRollbackFirebaseRegistration(backendError)).toBe(true);

    const result = await executeRegistrationRollbackIfPermitted(
      mockCreatedUser,
      mockCurrentAuthUser,
      backendError,
      onClearToken
    );

    expect(result).toBe(true);
    expect(mockCreatedUser.delete).toHaveBeenCalledTimes(1);
    expect(clearTokenCalled).toBe(true);

    // Also support nested { error: { code: 'ACCOUNT_EXISTS' } } format
    mockCreatedUser.delete.mockClear();
    clearTokenCalled = false;
    const nestedError = { error: { code: 'ACCOUNT_EXISTS' } };
    expect(shouldRollbackFirebaseRegistration(nestedError)).toBe(true);
    const resultNested = await executeRegistrationRollbackIfPermitted(
      mockCreatedUser,
      mockCurrentAuthUser,
      nestedError,
      onClearToken
    );
    expect(resultNested).toBe(true);
    expect(mockCreatedUser.delete).toHaveBeenCalledTimes(1);
    expect(clearTokenCalled).toBe(true);
  });

  it('3. [Req: EMAIL_EXISTS / VALIDATION_ERROR] should perform cleanup for other allow-listed rejection codes', async () => {
    const emailExistsErr = { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists.' };
    const validationErr = { code: 'VALIDATION_ERROR', message: 'Invalid input data' };

    expect(shouldRollbackFirebaseRegistration(emailExistsErr)).toBe(true);
    expect(shouldRollbackFirebaseRegistration(validationErr)).toBe(true);

    const res1 = await executeRegistrationRollbackIfPermitted(
      mockCreatedUser,
      mockCurrentAuthUser,
      emailExistsErr,
      onClearToken
    );
    expect(res1).toBe(true);
    expect(mockCreatedUser.delete).toHaveBeenCalledTimes(1);

    mockCreatedUser.delete.mockClear();
    const res2 = await executeRegistrationRollbackIfPermitted(
      mockCreatedUser,
      mockCurrentAuthUser,
      validationErr,
      onClearToken
    );
    expect(res2).toBe(true);
    expect(mockCreatedUser.delete).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // REQUIREMENT 3: PROVE BACKEND 500 DOES NOT TRIGGER CLEANUP
  // =========================================================================
  it('4. [Req: Backend 500] should NOT delete Firebase user when backend returns HTTP 500 or PROVISIONING_FAILED', async () => {
    const backend500Errors = [
      { code: 'HTTP_500', message: 'An unexpected error occurred.' },
      { code: 'PROVISIONING_FAILED', message: 'Failed to provision user profile in database.' },
      { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
      { code: 'DATABASE_ERROR', message: 'Can’t reach database server.' },
    ];

    for (const err of backend500Errors) {
      mockCreatedUser.delete.mockClear();
      clearTokenCalled = false;

      expect(shouldRollbackFirebaseRegistration(err)).toBe(false);

      const result = await executeRegistrationRollbackIfPermitted(
        mockCreatedUser,
        mockCurrentAuthUser,
        err,
        onClearToken
      );

      expect(result).toBe(false);
      expect(mockCreatedUser.delete).not.toHaveBeenCalled();
      expect(clearTokenCalled).toBe(false);
    }
  });

  // =========================================================================
  // REQUIREMENT 4: PROVE NETWORK FAILURE DOES NOT TRIGGER CLEANUP
  // =========================================================================
  it('5. [Req: Network Failure] should NOT delete Firebase user when request fails due to network failure, fetch error, or timeout', async () => {
    const networkErrors = [
      new TypeError('Failed to fetch'),
      new Error('NetworkError when attempting to fetch resource'),
      { code: 'REQUEST_TIMEOUT', message: 'The server took longer than 25 seconds to respond.' },
      { name: 'AbortError', message: 'The operation was aborted.' },
    ];

    for (const err of networkErrors) {
      mockCreatedUser.delete.mockClear();
      clearTokenCalled = false;

      expect(shouldRollbackFirebaseRegistration(err)).toBe(false);

      const result = await executeRegistrationRollbackIfPermitted(
        mockCreatedUser,
        mockCurrentAuthUser,
        err,
        onClearToken
      );

      expect(result).toBe(false);
      expect(mockCreatedUser.delete).not.toHaveBeenCalled();
      expect(clearTokenCalled).toBe(false);
    }
  });

  // =========================================================================
  // REQUIREMENT 5: SESSION ISOLATION & ACCIDENTAL DELETION GUARD
  // =========================================================================
  it('6. [Session Safety] should NEVER delete or affect an existing authenticated session if createdUser does not match auth.currentUser', async () => {
    // Scenario: User was already logged in as Admin A, and somehow createdUser belongs to a different UID
    const existingAdminAuthUser = {
      uid: 'existing-admin-uid-99999',
      email: 'dean@university.edu',
    };

    const backendError = { code: 'ACCOUNT_EXISTS', message: 'Account exists' };

    // createdUser UID differs from current authenticated session!
    const result = await executeRegistrationRollbackIfPermitted(
      mockCreatedUser, // uid: 'new-firebase-uid-12345'
      existingAdminAuthUser, // uid: 'existing-admin-uid-99999'
      backendError,
      onClearToken
    );

    // Rollback MUST be denied: existing session is completely protected
    expect(result).toBe(false);
    expect(mockCreatedUser.delete).not.toHaveBeenCalled();
    expect(clearTokenCalled).toBe(false);
  });

  it('7. [Null Safety] should safely handle null or undefined createdUser or error without crashing', async () => {
    expect(shouldRollbackFirebaseRegistration(null)).toBe(false);
    expect(shouldRollbackFirebaseRegistration(undefined)).toBe(false);

    const res1 = await executeRegistrationRollbackIfPermitted(null, mockCurrentAuthUser, { code: 'ACCOUNT_EXISTS' });
    expect(res1).toBe(false);

    const res2 = await executeRegistrationRollbackIfPermitted(mockCreatedUser, null, { code: 'ACCOUNT_EXISTS' });
    expect(res2).toBe(false);
  });
});
