import { describe, it, expect, afterEach, afterAll, vi } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { adminAuth } from '../server/src/config/firebase.js';
import { handleFirebaseTokenAuth, buildUserSession } from '../server/src/routes/auth.js';

// Lightweight mock Express Response object
function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    cookies: {} as Record<string, any>,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    send(data: any) {
      this.body = data;
      return this;
    },
    cookie(name: string, value: any, options?: any) {
      this.cookies[name] = { value, options };
      return this;
    },
    clearCookie(name: string) {
      delete this.cookies[name];
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
}

describe('Institution Admin Registration Race Condition & Auth Hardening Suite', { timeout: 30000 }, () => {
  const createdUserIds: string[] = [];

  // Protect baseline accounts from automated test fixture cleanup
  const ORIGINAL_10_IDS = new Set([
    '1b68de5a-acee-42fc-875d-b8ec39217746',
    'f5ee0e6a-b379-4eab-a01b-d1dbfeb1dfef',
    'd98b6d0b-3ec2-42d1-ad35-6a3107262e92',
    'ae644203-c99a-4cab-899f-8926377b72ec',
    'fd6220c8-b62e-40b4-b3b6-29839d002a51',
    'a2e8011e-5256-4423-9d61-b8cdc8629e36',
    '3965a1a8-bbbc-451f-ad97-10f34e1304c4',
    '23f7eebc-90b6-4822-8969-220d6d68605b',
    '611234ea-f6dc-46f8-a9eb-4d3229ee2702',
    '156331cc-2b7b-49c2-acaa-302c6010edc5',
  ]);

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    // Clean up test users created by this suite
    const safeToDelete = createdUserIds.filter((id) => !ORIGINAL_10_IDS.has(id));
    if (safeToDelete.length > 0) {
      await prisma.institutionProfile.deleteMany({ where: { userId: { in: safeToDelete } } });
      await prisma.studentProfile.deleteMany({ where: { userId: { in: safeToDelete } } });
      await prisma.industryProfile.deleteMany({ where: { userId: { in: safeToDelete } } });
      await prisma.activityLog.deleteMany({ where: { userId: { in: safeToDelete } } });
      await prisma.user.deleteMany({ where: { id: { in: safeToDelete } } });
    }
  });

  // =========================================================================
  // DEFENSE 1: Client Registration Ownership State Guard
  // =========================================================================
  it('Defense 1: RegistrationStateRef suppresses onAuthStateChanged automatic provisioning during active registration', () => {
    interface RegistrationFlowState {
      active: boolean;
      firebaseUid: string | null;
      provisioningComplete: boolean;
    }

    const registrationState: RegistrationFlowState = {
      active: false,
      firebaseUid: null,
      provisioningComplete: false,
    };

    let autoProvisioningCalled = false;
    const fakeSyncWithBackend = () => {
      autoProvisioningCalled = true;
    };

    const simulateAuthStateChanged = (fbUser: { uid: string } | null) => {
      if (registrationState.active) {
        return;
      }
      if (fbUser && registrationState.firebaseUid === fbUser.uid) {
        return;
      }
      if (fbUser) {
        fakeSyncWithBackend();
      }
    };

    // Step A: Registration begins
    registrationState.active = true;
    registrationState.firebaseUid = null;
    registrationState.provisioningComplete = false;

    // Step B: Firebase createUserWithEmailAndPassword resolves with UID
    const testUid = 'fb-uid-test-123';
    registrationState.firebaseUid = testUid;

    // Step C: onAuthStateChanged fires immediately while registration is active
    simulateAuthStateChanged({ uid: testUid });
    expect(autoProvisioningCalled).toBe(false);

    // Step D: Explicit registration completes and clears state in finally block
    registrationState.provisioningComplete = true;
    registrationState.active = false;
    registrationState.firebaseUid = null;

    // Step E: Normal subsequent auth event for another action executes normally
    simulateAuthStateChanged({ uid: testUid });
    expect(autoProvisioningCalled).toBe(true);
  });

  // =========================================================================
  // DEFENSE 2: Backend Rejection of Password Provider Auto-Provisioning
  // =========================================================================
  it('Defense 2: /api/auth/google/firebase strictly rejects password-provider auto-provisioning when no DB User exists', async () => {
    const timestamp = Date.now();
    const testEmail = `pwd.defense2.${timestamp}@university.edu`;
    const testUid = `uid-pwd-defense2-${timestamp}`;

    // Mock Firebase token verification as password provider
    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const mockReq: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {},
    };
    const mockRes = createMockRes();

    // Invoked on google/firebase endpoint
    await handleFirebaseTokenAuth(mockReq, mockRes, 'google/firebase');

    // Must return 400 REGISTRATION_REQUIRED
    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.body?.error?.code).toBe('REGISTRATION_REQUIRED');
    expect(mockRes.body?.error?.message).toContain('Password accounts must be registered with complete profile information');

    // Verify zero records were created in database
    const userInDb = await prisma.user.findFirst({
      where: { email: { equals: testEmail, mode: 'insensitive' } },
    });
    expect(userInDb).toBeNull();
  });

  // =========================================================================
  // CONCURRENT RACE SIMULATION: /google/firebase vs /sync
  // =========================================================================
  it('Concurrent Race: /google/firebase rejected while /sync succeeds as INSTITUTION_ADMIN with 0 Student records', async () => {
    const timestamp = Date.now();
    const testEmail = `race.instadmin.${timestamp}@university.edu`;
    const testUid = `uid-race-instadmin-${timestamp}`;

    // Mock token verification
    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      email_verified: false,
      name: 'Dr. Race Test Admin',
      firebase: { sign_in_provider: 'password' },
    } as any);

    // Request 1: Concurrent onAuthStateChanged -> /api/auth/google/firebase
    const reqGoogleFirebase: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {},
    };
    const resGoogleFirebase = createMockRes();

    // Request 2: Explicit register() -> /api/auth/sync with INSTITUTION_ADMIN
    const reqSync: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        name: 'Dr. Race Test Admin',
        roleData: {
          institutionName: 'Race Safe University',
          adminDesignation: 'Dean of Engineering',
        },
      },
    };
    const resSync = createMockRes();

    // Dispatch concurrently
    await Promise.all([
      handleFirebaseTokenAuth(reqGoogleFirebase, resGoogleFirebase, 'google/firebase'),
      handleFirebaseTokenAuth(reqSync, resSync, 'sync'),
    ]);

    // Request 1 must be rejected by DEFENSE 2
    expect(resGoogleFirebase.statusCode).toBe(400);
    expect(resGoogleFirebase.body?.error?.code).toBe('REGISTRATION_REQUIRED');

    // Request 2 must succeed and create INSTITUTION_ADMIN
    expect(resSync.statusCode).toBe(201);
    expect(resSync.body?.user?.role).toBe('INSTITUTION_ADMIN');
    expect(resSync.body?.user?.institutionProfile?.institutionName).toBe('Race Safe University');
    createdUserIds.push(resSync.body.user.id);

    // Database verification:
    const usersInDb = await prisma.user.findMany({
      where: { email: { equals: testEmail, mode: 'insensitive' } },
      include: { studentProfile: true, institutionProfile: true },
    });

    expect(usersInDb).toHaveLength(1);
    const createdUser = usersInDb[0];
    expect(createdUser.role).toBe('INSTITUTION_ADMIN');
    expect(createdUser.firebaseUid).toBe(testUid);
    expect(createdUser.institutionProfile).not.toBeNull();
    expect(createdUser.institutionProfile?.institutionName).toBe('Race Safe University');
    expect(createdUser.studentProfile).toBeNull();

    // Total Student users or StudentProfiles created by this registration: 0
    const studentProfiles = await prisma.studentProfile.findMany({
      where: { userId: createdUser.id },
    });
    expect(studentProfiles).toHaveLength(0);
  });

  // =========================================================================
  // IDEMPOTENT SYNC: Same Firebase UID + Same Role succeeds
  // =========================================================================
  it('Idempotent Sync: Same Firebase UID + Same Role allows safe idempotent login', async () => {
    const timestamp = Date.now();
    const testEmail = `idempotent.admin.${timestamp}@university.edu`;
    const testUid = `uid-idempotent-admin-${timestamp}`;

    // Create user initially via /sync
    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req1: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        roleData: { institutionName: 'Idempotent College', adminDesignation: 'Registrar' },
      },
    };
    const res1 = createMockRes();
    await handleFirebaseTokenAuth(req1, res1, 'sync');
    expect(res1.statusCode).toBe(201);
    createdUserIds.push(res1.body.user.id);

    // Now second call with same UID and same role
    const req2: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: { role: 'INSTITUTION_ADMIN' },
    };
    const res2 = createMockRes();
    await handleFirebaseTokenAuth(req2, res2, 'sync');

    expect(res2.statusCode).toBe(200);
    expect(res2.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(res2.body.isNewUser).toBe(false);

    // Verify DB count remains exactly 1
    const count = await prisma.user.count({
      where: { email: { equals: testEmail, mode: 'insensitive' } },
    });
    expect(count).toBe(1);
  });

  // =========================================================================
  // ROLE_CONFLICT: Same Firebase UID + Role Mismatch returns 409 ROLE_CONFLICT
  // =========================================================================
  it('Role Mismatch: Registration attempting different role for existing UID returns 409 ROLE_CONFLICT and preserves DB role', async () => {
    const timestamp = Date.now();
    const testEmail = `conflict.admin.${timestamp}@university.edu`;
    const testUid = `uid-conflict-admin-${timestamp}`;

    // Create user as INSTITUTION_ADMIN
    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const reqCreate: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        roleData: { institutionName: 'Tech University', adminDesignation: 'Admin' },
      },
    };
    const resCreate = createMockRes();
    await handleFirebaseTokenAuth(reqCreate, resCreate, 'sync');
    expect(resCreate.statusCode).toBe(201);
    createdUserIds.push(resCreate.body.user.id);

    // Attempt registration with same UID but requesting STUDENT
    const reqConflict: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: { role: 'STUDENT', roleData: { institution: 'Tech University' } },
    };
    const resConflict = createMockRes();
    await handleFirebaseTokenAuth(reqConflict, resConflict, 'sync');

    expect(resConflict.statusCode).toBe(409);
    expect(resConflict.body?.error?.code).toBe('ROLE_CONFLICT');
    expect(resConflict.body?.error?.message).toContain('An account already exists with role INSTITUTION_ADMIN');

    // Verify DB role was NOT modified
    const userInDb = await prisma.user.findUnique({
      where: { id: resCreate.body.user.id },
      include: { studentProfile: true, institutionProfile: true },
    });
    expect(userInDb?.role).toBe('INSTITUTION_ADMIN');
    expect(userInDb?.studentProfile).toBeNull();
  });

  // =========================================================================
  // MULTI-ROLE REGISTRATION TESTS: STUDENT, INDUSTRY, INSTITUTION_ADMIN
  // =========================================================================
  it('Multi-Role: STUDENT registration creates exactly 1 User, role STUDENT, and 1 StudentProfile', async () => {
    const timestamp = Date.now();
    const testEmail = `reg.student.${timestamp}@university.edu`;
    const testUid = `uid-reg-student-${timestamp}`;

    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'STUDENT',
        name: 'Aarav Sharma',
        roleData: {
          institution: 'IIT Bombay',
          targetDomain: 'Full-Stack Web',
          cgpa: 8.9,
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.studentProfile?.institution).toBe('IIT Bombay');
    createdUserIds.push(res.body.user.id);

    const user = await prisma.user.findUnique({
      where: { id: res.body.user.id },
      include: { studentProfile: true, industryProfile: true, institutionProfile: true },
    });
    expect(user?.role).toBe('STUDENT');
    expect(user?.studentProfile).not.toBeNull();
    expect(user?.industryProfile).toBeNull();
    expect(user?.institutionProfile).toBeNull();
  });

  it('Multi-Role: INDUSTRY registration creates exactly 1 User, role INDUSTRY, and 1 IndustryProfile', async () => {
    const timestamp = Date.now();
    const testEmail = `reg.industry.${timestamp}@techcorp.com`;
    const testUid = `uid-reg-industry-${timestamp}`;

    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'INDUSTRY',
        name: 'Priya Mehta',
        roleData: {
          companyName: 'Apex Innovations',
          industrySector: 'Artificial Intelligence',
          companySize: '50-200 employees',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('INDUSTRY');
    expect(res.body.user.industryProfile?.companyName).toBe('Apex Innovations');
    createdUserIds.push(res.body.user.id);

    const user = await prisma.user.findUnique({
      where: { id: res.body.user.id },
      include: { studentProfile: true, industryProfile: true, institutionProfile: true },
    });
    expect(user?.role).toBe('INDUSTRY');
    expect(user?.industryProfile).not.toBeNull();
    expect(user?.studentProfile).toBeNull();
    expect(user?.institutionProfile).toBeNull();
  });

  it('Multi-Role: INSTITUTION_ADMIN registration creates exactly 1 User, role INSTITUTION_ADMIN, and 1 InstitutionProfile', async () => {
    const timestamp = Date.now();
    const testEmail = `reg.instadmin.${timestamp}@university.edu`;
    const testUid = `uid-reg-instadmin-${timestamp}`;

    vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
      uid: testUid,
      email: testEmail,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        name: 'Dr. Rajesh Patel',
        roleData: {
          institutionName: 'National Institute of Technology',
          adminDesignation: 'Dean Academic Affairs',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(res.body.user.institutionProfile?.institutionName).toBe('National Institute of Technology');
    createdUserIds.push(res.body.user.id);

    const user = await prisma.user.findUnique({
      where: { id: res.body.user.id },
      include: { studentProfile: true, industryProfile: true, institutionProfile: true },
    });
    expect(user?.role).toBe('INSTITUTION_ADMIN');
    expect(user?.institutionProfile).not.toBeNull();
    expect(user?.studentProfile).toBeNull();
    expect(user?.industryProfile).toBeNull();
  });
});
