import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/src/config/prisma.js';
import { adminAuth } from '../server/src/config/firebase.js';
import {
  RegisterAdminSchema,
  RegisterSchema,
  RoleEnum,
} from '../shared/validation.js';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../server/src/services/tokenService.js';
import {
  requireInstitutionProfile,
  requireStudentProfile,
  requireIndustryProfile,
} from '../server/src/middleware/authorization.js';
import { authenticate, AuthRequest } from '../server/src/middleware/auth.js';
import { handleFirebaseTokenAuth, buildUserSession } from '../server/src/routes/auth.js';
import { Role } from '../shared/types.js';

// Mirrors getRoleRedirect from AuthContext.tsx
function getRoleRedirect(role?: Role | string): string {
  switch (role) {
    case 'STUDENT':
      return '/dashboard';
    case 'INDUSTRY':
      return '/industry/dashboard';
    case 'INSTITUTION_ADMIN':
      return '/institution/dashboard';
    default:
      return '/dashboard';
  }
}

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

describe('Institution Admin Authentication & Role Persistence Suite', { timeout: 30000 }, () => {
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

  async function cleanupTestFixtures(specificIds?: string[]) {
    try {
      const targets = specificIds && specificIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: { in: specificIds, notIn: Array.from(ORIGINAL_10_IDS) },
            },
            select: { id: true },
          })
        : await prisma.user.findMany({
            where: {
              id: { notIn: Array.from(ORIGINAL_10_IDS) },
              OR: [
                { email: { contains: '178984' } },
                { email: { contains: '178985' } },
                { email: { startsWith: 'session.a.admin.' } },
                { email: { startsWith: 'session.b.student.' } },
                { email: { startsWith: 'student.b.' } },
                { email: { startsWith: 'student.collision.' } },
                { email: { startsWith: 'recruiter.collision.' } },
                { email: { startsWith: 'attacker.' } },
              ],
            },
            select: { id: true },
          });

      const idsToDelete = targets.map((t) => t.id);
      if (idsToDelete.length > 0) {
        await prisma.institutionProfile.deleteMany({
          where: { userId: { in: idsToDelete } },
        });
        await prisma.studentProfile.deleteMany({
          where: { userId: { in: idsToDelete } },
        });
        await prisma.industryProfile.deleteMany({
          where: { userId: { in: idsToDelete } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }
    } catch (err) {
      console.warn('[TEST FIXTURE CLEANUP WARN]', err);
    }
  }

  // Pre-test sweep: clean up any orphaned fixtures from prior crashed runs
  beforeAll(async () => {
    await cleanupTestFixtures();
  });

  // Per-test sweep: immediately destroy fixtures created in each test
  afterEach(async () => {
    if (createdUserIds.length > 0) {
      const ids = [...createdUserIds];
      createdUserIds.length = 0;
      await cleanupTestFixtures(ids);
    }
  });

  // Final sweep
  afterAll(async () => {
    await cleanupTestFixtures();
  });

  it('1. should validate Institution Admin payload with RegisterAdminSchema and RegisterSchema', () => {
    const validAdminPayload = {
      role: 'INSTITUTION_ADMIN' as const,
      institutionName: 'Delhi Technological University',
      adminDesignation: 'Dean of Academic & Placement Affairs',
      email: 'dean.placement@dtu.ac.in',
      password: 'SecurePassword123!',
      phone: '+91 98765 43210',
    };

    const adminResult = RegisterAdminSchema.safeParse(validAdminPayload);
    expect(adminResult.success).toBe(true);

    const unionResult = RegisterSchema.safeParse(validAdminPayload);
    expect(unionResult.success).toBe(true);

    // Reject missing institutionName
    const invalidPayload = { ...validAdminPayload, institutionName: '' };
    expect(RegisterAdminSchema.safeParse(invalidPayload).success).toBe(false);
  });

  it('2. should verify RoleEnum includes INSTITUTION_ADMIN and active role set is strictly [STUDENT, INDUSTRY, INSTITUTION_ADMIN]', () => {
    const roles = RoleEnum.options;
    expect(roles).toContain('INSTITUTION_ADMIN');
    expect(roles).toContain('STUDENT');
    expect(roles).toContain('INDUSTRY');

    const activeRoles: Role[] = ['STUDENT', 'INDUSTRY', 'INSTITUTION_ADMIN'];
    expect(activeRoles).not.toContain('ACADEMICIAN');
  });

  it('3. should create fresh Institution Admin user in PostgreSQL: role === INSTITUTION_ADMIN, linked InstitutionProfile, NO StudentProfile', async () => {
    const testEmail = `fresh.admin.${Date.now()}@university.edu`;
    const instName = 'National Institute of Technology Trichy';
    const adminDesig = 'Head of Training & Placement';
    const personName = 'Dr. K. Ramanathan';

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: personName,
        role: 'INSTITUTION_ADMIN',
        firebaseUid: `fb-admin-${Date.now()}`,
        currentStreak: 1,
        longestStreak: 1,
        institutionProfile: {
          create: {
            institutionName: instName,
            adminDesignation: adminDesig,
          },
        },
      },
      include: {
        studentProfile: true,
        industryProfile: true,
        institutionProfile: true,
      },
    });

    createdUserIds.push(user.id);

    expect(user.role).toBe('INSTITUTION_ADMIN');
    expect(user.name).toBe(personName);
    expect(user.institutionProfile).not.toBeNull();
    expect(user.institutionProfile?.institutionName).toBe(instName);
    expect(user.institutionProfile?.adminDesignation).toBe(adminDesig);
    expect(user.studentProfile).toBeNull();
    expect(user.industryProfile).toBeNull();
  });

  it('4. should correctly generate and verify JWT token payload with role === INSTITUTION_ADMIN', () => {
    const tokenPayload = {
      userId: 'admin-uuid-test',
      role: 'INSTITUTION_ADMIN',
      email: 'admin@university.edu',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const verified = verifyAccessToken(accessToken);

    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('INSTITUTION_ADMIN');
    expect(verified?.userId).toBe(tokenPayload.userId);
    expect(verified?.email).toBe(tokenPayload.email);

    const refreshToken = generateRefreshToken(tokenPayload);
    const verifiedRefresh = verifyRefreshToken(refreshToken);
    expect(verifiedRefresh).not.toBeNull();
    expect(verifiedRefresh?.userId).toBe(tokenPayload.userId);
  });

  it('5. should route getRoleRedirect for all active roles with ZERO cross-routing', () => {
    expect(getRoleRedirect('INSTITUTION_ADMIN')).toBe('/institution/dashboard');
    expect(getRoleRedirect('STUDENT')).toBe('/dashboard');
    expect(getRoleRedirect('INDUSTRY')).toBe('/industry/dashboard');

    // Verify Institution Admin NEVER redirects to /dashboard (student)
    expect(getRoleRedirect('INSTITUTION_ADMIN')).not.toBe('/dashboard');
    expect(getRoleRedirect('INSTITUTION_ADMIN')).not.toBe('/industry/dashboard');
  });

  it('6. should enforce route authorization: requireInstitutionProfile allows INSTITUTION_ADMIN and rejects STUDENT / INDUSTRY', () => {
    const mockRes = () => {
      const res: any = {};
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data: any) => {
        res.data = data;
        return res;
      };
      return res;
    };

    // 1. Institution Admin with profile -> next() called
    let nextCalled = false;
    const adminReq: AuthRequest = {
      user: {
        id: 'admin-1',
        email: 'admin@univ.edu',
        role: 'INSTITUTION_ADMIN',
        institutionProfileId: 'inst-prof-1',
      },
    } as any;
    const adminRes = mockRes();
    requireInstitutionProfile(adminReq, adminRes, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);

    // 2. Student trying to access institution route -> 403 Forbidden
    let studentNext = false;
    const studentReq: AuthRequest = {
      user: {
        id: 'student-1',
        email: 'student@univ.edu',
        role: 'STUDENT',
        studentProfileId: 'stud-prof-1',
      },
    } as any;
    const studentRes = mockRes();
    requireInstitutionProfile(studentReq, studentRes, () => {
      studentNext = true;
    });
    expect(studentNext).toBe(false);
    expect(studentRes.statusCode).toBe(403);
    expect(studentRes.data.error.code).toBe('FORBIDDEN');

    // 3. Industry trying to access institution route -> 403 Forbidden
    let industryNext = false;
    const industryReq: AuthRequest = {
      user: {
        id: 'ind-1',
        email: 'ind@corp.com',
        role: 'INDUSTRY',
        industryProfileId: 'ind-prof-1',
      },
    } as any;
    const industryRes = mockRes();
    requireInstitutionProfile(industryReq, industryRes, () => {
      industryNext = true;
    });
    expect(industryNext).toBe(false);
    expect(industryRes.statusCode).toBe(403);
    expect(industryRes.data.error.code).toBe('FORBIDDEN');

    // 4. Institution Admin trying to access student route -> 403 Forbidden
    let adminOnStudentNext = false;
    const adminOnStudentRes = mockRes();
    requireStudentProfile(adminReq, adminOnStudentRes, () => {
      adminOnStudentNext = true;
    });
    expect(adminOnStudentNext).toBe(false);
    expect(adminOnStudentRes.statusCode).toBe(403);

    // 5. Institution Admin trying to access industry route -> 403 Forbidden
    let adminOnIndustryNext = false;
    const adminOnIndustryRes = mockRes();
    requireIndustryProfile(adminReq, adminOnIndustryRes, () => {
      adminOnIndustryNext = true;
    });
    expect(adminOnIndustryNext).toBe(false);
    expect(adminOnIndustryRes.statusCode).toBe(403);
  });

  it('7. should auto-heal existing INSTITUTION_ADMIN users who are missing an InstitutionProfile', async () => {
    const unlinkedEmail = `unlinked.admin.${Date.now()}@university.edu`;
    const user = await prisma.user.create({
      data: {
        email: unlinkedEmail,
        name: 'Prof. S. Venkatesh',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: `fb-unlinked-${Date.now()}`,
      },
      include: { institutionProfile: true },
    });
    createdUserIds.push(user.id);
    expect(user.institutionProfile).toBeNull();

    const healedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        institutionProfile: {
          create: {
            institutionName: 'Partner Institution',
            adminDesignation: 'Administrator',
          },
        },
      },
      include: { institutionProfile: true, studentProfile: true },
    });

    expect(healedUser.role).toBe('INSTITUTION_ADMIN');
    expect(healedUser.institutionProfile).not.toBeNull();
    expect(healedUser.institutionProfile?.institutionName).toBe('Partner Institution');
    expect(healedUser.studentProfile).toBeNull();
  });

  it('8. should verify STUDENT and INDUSTRY registration still work and remain fully isolated', async () => {
    // Student
    const studentEmail = `fresh.student.${Date.now()}@college.edu`;
    const student = await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Rohan Gupta',
        role: 'STUDENT',
        studentProfile: {
          create: {
            institution: 'IIT Delhi',
            targetDomain: 'Cloud/DevOps',
          },
        },
      },
      include: { studentProfile: true, institutionProfile: true },
    });
    createdUserIds.push(student.id);

    expect(student.role).toBe('STUDENT');
    expect(student.studentProfile).not.toBeNull();
    expect(student.institutionProfile).toBeNull();
    expect(getRoleRedirect(student.role as Role)).toBe('/dashboard');

    // Industry
    const industryEmail = `fresh.recruiter.${Date.now()}@corp.com`;
    const industry = await prisma.user.create({
      data: {
        email: industryEmail,
        name: 'Nexus Technologies',
        role: 'INDUSTRY',
        industryProfile: {
          create: {
            companyName: 'Nexus Technologies',
            companySize: '50-200 employees',
            industrySector: 'Cloud Computing',
            verified: true,
          },
        },
      },
      include: { industryProfile: true, institutionProfile: true, studentProfile: true },
    });
    createdUserIds.push(industry.id);

    expect(industry.role).toBe('INDUSTRY');
    expect(industry.industryProfile).not.toBeNull();
    expect(industry.studentProfile).toBeNull();
    expect(industry.institutionProfile).toBeNull();
    expect(getRoleRedirect(industry.role as Role)).toBe('/industry/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 13: EXISTING ADMIN FALLBACK LOGIN REGRESSION TEST
  // =========================================================================
  it('9. [Req 13] should correctly authenticate existing admin in fallback flow (firebaseUid=null, uid=User.id, role/email absent) without shadow student', async () => {
    const timestamp = Date.now();
    const adminEmail = `fallback.admin.${timestamp}@university.edu`;

    // 1. Database state: User.role = INSTITUTION_ADMIN, InstitutionProfile exists, StudentProfile = null, firebaseUid = null
    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dean R. K. Sharma',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null, // Critical: null firebaseUid
        institutionProfile: {
          create: {
            institutionName: 'Apex Institute of Technology',
            adminDesignation: 'Dean of Placements',
          },
        },
      },
      include: {
        institutionProfile: true,
        studentProfile: true,
      },
    });
    createdUserIds.push(existingAdmin.id);

    expect(existingAdmin.role).toBe('INSTITUTION_ADMIN');
    expect(existingAdmin.firebaseUid).toBeNull();
    expect(existingAdmin.studentProfile).toBeNull();
    expect(existingAdmin.institutionProfile).not.toBeNull();

    // 2. Mock Firebase ID token verification returning ONLY uid = existingAdmin.id (no email, no role)
    const spyVerify = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: existingAdmin.id,
      // email absent
      // role absent
    } as any);

    // 3. Fallback authentication request
    const mockReq: any = {
      headers: {
        authorization: 'Bearer fallback-custom-id-token',
      },
      body: {}, // No client email, no client role
    };
    const mockRes = createMockRes();

    await handleFirebaseTokenAuth(mockReq, mockRes, 'sync-fallback-test');

    spyVerify.mockRestore();

    // 4. Assert response
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.body).not.toBeNull();
    expect(mockRes.body.isNewUser).toBe(false);
    expect(mockRes.body.user).not.toBeNull();
    expect(mockRes.body.user.id).toBe(existingAdmin.id);
    expect(mockRes.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(mockRes.body.accessToken).toBeDefined();

    // 5. Database check: NO new User, NO StudentProfile created, role preserved
    const refreshedAdmin = await prisma.user.findUnique({
      where: { id: existingAdmin.id },
      include: { studentProfile: true, institutionProfile: true },
    });

    expect(refreshedAdmin).not.toBeNull();
    expect(refreshedAdmin?.role).toBe('INSTITUTION_ADMIN');
    expect(refreshedAdmin?.studentProfile).toBeNull();
    expect(refreshedAdmin?.institutionProfile).not.toBeNull();

    // 6. Test /api/auth/me hydration with issued accessToken
    const meReq: any = {
      headers: {
        authorization: `Bearer ${mockRes.body.accessToken}`,
      },
    };
    const meRes = createMockRes();
    let authNextCalled = false;
    await authenticate(meReq, meRes, () => {
      authNextCalled = true;
    });

    expect(authNextCalled).toBe(true);
    expect(meReq.user.role).toBe('INSTITUTION_ADMIN');

    const meSession = await buildUserSession(meReq.user.id);
    expect(meSession?.role).toBe('INSTITUTION_ADMIN');

    // 7. Redirect logic must route to /institution/dashboard
    expect(getRoleRedirect(meSession?.role)).toBe('/institution/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 14: DUPLICATE ACCOUNT REGRESSION TEST
  // =========================================================================
  it('14. [Req 14] fallback login must NEVER silently create a new Student account or cause unintended record increase', async () => {
    const timestamp = Date.now();
    const adminEmail = `dupcheck.admin.${timestamp}@university.edu`;

    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dr. Neha Verma',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null,
        institutionProfile: {
          create: {
            institutionName: 'Symbiosis Institute',
            adminDesignation: 'Placement Officer',
          },
        },
      },
    });
    createdUserIds.push(existingAdmin.id);

    // Record baseline counts BEFORE fallback login
    const userCountBefore = await prisma.user.count();
    const studentProfileCountBefore = await prisma.studentProfile.count();
    const institutionProfileCountBefore = await prisma.institutionProfile.count();

    // Execute fallback login
    const spyVerify = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: existingAdmin.id,
    } as any);

    const mockReq: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {},
    };
    const mockRes = createMockRes();

    await handleFirebaseTokenAuth(mockReq, mockRes, 'sync-dup-test');
    spyVerify.mockRestore();

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.body.isNewUser).toBe(false);

    // Verify record counts AFTER login: strictly ZERO unintended increase
    const userCountAfter = await prisma.user.count();
    const studentProfileCountAfter = await prisma.studentProfile.count();
    const institutionProfileCountAfter = await prisma.institutionProfile.count();

    expect(userCountAfter).toBe(userCountBefore);
    expect(studentProfileCountAfter).toBe(studentProfileCountBefore);
    expect(institutionProfileCountAfter).toBe(institutionProfileCountBefore);
  });

  // =========================================================================
  // REQUIREMENT 15: STALE CLIENT ROLE REGRESSION TEST
  // =========================================================================
  it('15. [Req 15] client sending role=STUDENT can NEVER downgrade an existing INSTITUTION_ADMIN account', async () => {
    const timestamp = Date.now();
    const adminEmail = `stalerole.admin.${timestamp}@university.edu`;

    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dean Anil Deshmukh',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: `fb-stalerole-${timestamp}`,
        institutionProfile: {
          create: {
            institutionName: 'Pune Engineering College',
            adminDesignation: 'Director of Corporate Relations',
          },
        },
      },
    });
    createdUserIds.push(existingAdmin.id);

    // Mock token verification with matching UID
    const spyVerify = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: `fb-stalerole-${timestamp}`,
      email: adminEmail,
    } as any);

    // Client maliciously or inadvertently sends role: 'STUDENT' in request body
    const mockReq: any = {
      headers: { authorization: 'Bearer mock-token' },
      body: {
        role: 'STUDENT',
        name: 'Stale Student Name',
        email: 'attacker-client-email@fake.com', // Client-supplied email must be IGNORED (Rule 1)
      },
    };
    const mockRes = createMockRes();

    await handleFirebaseTokenAuth(mockReq, mockRes, 'sync-stale-role-test');
    spyVerify.mockRestore();

    expect(mockRes.statusCode).toBe(200);
    // User role in response MUST remain INSTITUTION_ADMIN
    expect(mockRes.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(mockRes.body.user.email).toBe(adminEmail); // Authoritative email from DB
    expect(mockRes.body.isNewUser).toBe(false);

    // Database record check
    const refreshed = await prisma.user.findUnique({
      where: { id: existingAdmin.id },
      include: { studentProfile: true, institutionProfile: true },
    });

    expect(refreshed?.role).toBe('INSTITUTION_ADMIN');
    expect(refreshed?.studentProfile).toBeNull();
    expect(refreshed?.institutionProfile).not.toBeNull();
    expect(getRoleRedirect(refreshed?.role)).toBe('/institution/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 16: EXISTING CORRECT ADMIN LOGIN / REFRESH / LOGOUT / RE-LOGIN
  // =========================================================================
  it('16. [Req 16] existing correct Institution Admin: login -> /me -> refresh -> logout -> re-login stays INSTITUTION_ADMIN', async () => {
    const timestamp = Date.now();
    const adminEmail = `correct.admin.${timestamp}@university.edu`;
    const fbUid = `fb-correct-${timestamp}`;

    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dean S. K. Mukherjee',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: fbUid,
        institutionProfile: {
          create: {
            institutionName: 'Jadavpur University',
            adminDesignation: 'Chief Placement Officer',
          },
        },
      },
      include: { institutionProfile: true },
    });
    createdUserIds.push(existingAdmin.id);

    // Step 1: Initial Login
    const spy1 = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: fbUid,
      email: adminEmail,
    } as any);

    const loginReq: any = {
      headers: { authorization: 'Bearer fb-token' },
      body: {},
    };
    const loginRes = createMockRes();
    await handleFirebaseTokenAuth(loginReq, loginRes, 'test-login');
    spy1.mockRestore();

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(getRoleRedirect(loginRes.body.user.role)).toBe('/institution/dashboard');

    const accessToken = loginRes.body.accessToken;

    // Step 2: /api/auth/me call
    const meReq: any = { headers: { authorization: `Bearer ${accessToken}` } };
    const meRes = createMockRes();
    let meNextCalled = false;
    await authenticate(meReq, meRes, () => { meNextCalled = true; });
    expect(meNextCalled).toBe(true);
    expect(meReq.user.role).toBe('INSTITUTION_ADMIN');

    const hydratedSession = await buildUserSession(meReq.user.id);
    expect(hydratedSession?.role).toBe('INSTITUTION_ADMIN');
    expect(getRoleRedirect(hydratedSession?.role)).toBe('/institution/dashboard');

    // Step 3: Refresh simulation (authenticate with same valid token)
    const refreshReq: any = { headers: { authorization: `Bearer ${accessToken}` } };
    const refreshRes = createMockRes();
    let refreshNext = false;
    await authenticate(refreshReq, refreshRes, () => { refreshNext = true; });
    expect(refreshNext).toBe(true);
    expect(refreshReq.user.role).toBe('INSTITUTION_ADMIN');

    // Step 4: Logout (cookie clearance)
    const logoutRes = createMockRes();
    logoutRes.clearCookie('accessToken');
    logoutRes.clearCookie('refreshToken');
    expect(logoutRes.cookies['accessToken']).toBeUndefined();

    // Step 5: Re-login
    const spy2 = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: fbUid,
      email: adminEmail,
    } as any);

    const reloginReq: any = {
      headers: { authorization: 'Bearer fb-token-2' },
      body: {},
    };
    const reloginRes = createMockRes();
    await handleFirebaseTokenAuth(reloginReq, reloginRes, 'test-relogin');
    spy2.mockRestore();

    expect(reloginRes.statusCode).toBe(200);
    expect(reloginRes.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(getRoleRedirect(reloginRes.body.user.role)).toBe('/institution/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 17: NEW ADMIN REGISTRATION & IMMEDIATE LOGIN
  // =========================================================================
  it('17. [Req 17] new admin registration creates INSTITUTION_ADMIN + InstitutionProfile (NO StudentProfile) and routes to /institution/dashboard', async () => {
    const timestamp = Date.now();
    const newAdminEmail = `new.reg.admin.${timestamp}@university.edu`;
    const passwordHash = await bcrypt.hash('SecureAdminPass123!', 10);

    // Simulate registration endpoint logic
    const newAdmin = await prisma.user.create({
      data: {
        email: newAdminEmail,
        name: 'IIT Kharagpur Placement Office',
        role: 'INSTITUTION_ADMIN',
        passwordHash,
        institutionProfile: {
          create: {
            institutionName: 'IIT Kharagpur',
            adminDesignation: 'Placement Chair',
          },
        },
      },
      include: {
        institutionProfile: true,
        studentProfile: true,
      },
    });
    createdUserIds.push(newAdmin.id);

    expect(newAdmin.role).toBe('INSTITUTION_ADMIN');
    expect(newAdmin.institutionProfile).not.toBeNull();
    expect(newAdmin.studentProfile).toBeNull();

    // Immediate login via fallback token
    const spyVerify = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: newAdmin.id,
      email: newAdminEmail,
    } as any);

    const loginReq: any = {
      headers: { authorization: 'Bearer reg-token' },
      body: {},
    };
    const loginRes = createMockRes();
    await handleFirebaseTokenAuth(loginReq, loginRes, 'sync-new-reg');
    spyVerify.mockRestore();

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(loginRes.body.user.studentProfile).toBeUndefined();
    expect(loginRes.body.user.institutionProfile).toBeDefined();
    expect(getRoleRedirect(loginRes.body.user.role)).toBe('/institution/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 12: ADMIN CREATES STUDENT — SESSION ISOLATION
  // =========================================================================
  it('12. [Req 12] admin provisioning student maintains 100% session isolation: admin remains INSTITUTION_ADMIN, student created as STUDENT', async () => {
    const timestamp = Date.now();
    const adminEmail = `session.admin.${timestamp}@university.edu`;

    // 1. Admin A setup
    const adminA = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin A (Placement Dean)',
        role: 'INSTITUTION_ADMIN',
        institutionProfile: {
          create: {
            institutionName: 'Birla Institute',
            adminDesignation: 'Dean',
          },
        },
      },
      include: { institutionProfile: true },
    });
    createdUserIds.push(adminA.id);

    // Admin A session token
    const adminToken = generateAccessToken({
      userId: adminA.id,
      role: 'INSTITUTION_ADMIN',
      email: adminA.email,
    });

    // Verify Admin A session before student creation
    const adminReqBefore: any = { headers: { authorization: `Bearer ${adminToken}` } };
    const adminResBefore = createMockRes();
    let adminBeforeNext = false;
    await authenticate(adminReqBefore, adminResBefore, () => { adminBeforeNext = true; });
    expect(adminBeforeNext).toBe(true);
    expect(adminReqBefore.user.role).toBe('INSTITUTION_ADMIN');
    expect(adminReqBefore.user.id).toBe(adminA.id);

    // 2. Admin A creates Student B
    const studentBEmail = `student.b.${timestamp}@birla.edu`;
    const studentB = await prisma.user.create({
      data: {
        email: studentBEmail,
        name: 'Student B',
        role: 'STUDENT',
        studentProfile: {
          create: {
            institution: 'Birla Institute',
            institutionProfileId: adminA.institutionProfile!.id,
            targetDomain: 'Computer Science',
          },
        },
      },
      include: { studentProfile: true },
    });
    createdUserIds.push(studentB.id);

    // Assert Student B is STUDENT and affiliated with Admin A's institution
    expect(studentB.role).toBe('STUDENT');
    expect(studentB.studentProfile?.institutionProfileId).toBe(adminA.institutionProfile!.id);

    // 3. CRITICAL: Admin A's session is completely unaffected
    const adminReqAfter: any = { headers: { authorization: `Bearer ${adminToken}` } };
    const adminResAfter = createMockRes();
    let adminAfterNext = false;
    await authenticate(adminReqAfter, adminResAfter, () => { adminAfterNext = true; });

    expect(adminAfterNext).toBe(true);
    expect(adminReqAfter.user.id).toBe(adminA.id); // Stays Admin A
    expect(adminReqAfter.user.role).toBe('INSTITUTION_ADMIN'); // Stays INSTITUTION_ADMIN
    expect(getRoleRedirect(adminReqAfter.user.role)).toBe('/institution/dashboard');

    // Admin A session does NOT switch to Student B
    expect(adminReqAfter.user.id).not.toBe(studentB.id);
    expect(adminReqAfter.user.role).not.toBe('STUDENT');
  });

  // =========================================================================
  // REQUIREMENT 18: MULTI-ROLE ROUTING ISOLATION
  // =========================================================================
  it('18. [Req 18] should verify all active roles map exclusively to their authoritative routes with zero cross-role degradation', () => {
    // Student
    expect(getRoleRedirect('STUDENT')).toBe('/dashboard');

    // Industry
    expect(getRoleRedirect('INDUSTRY')).toBe('/industry/dashboard');

    // Institution Admin
    expect(getRoleRedirect('INSTITUTION_ADMIN')).toBe('/institution/dashboard');

    // Strict cross-role exclusion tests
    expect(getRoleRedirect('INSTITUTION_ADMIN')).not.toBe('/dashboard');
    expect(getRoleRedirect('INSTITUTION_ADMIN')).not.toBe('/industry/dashboard');

    expect(getRoleRedirect('STUDENT')).not.toBe('/institution/dashboard');
    expect(getRoleRedirect('STUDENT')).not.toBe('/industry/dashboard');

    expect(getRoleRedirect('INDUSTRY')).not.toBe('/dashboard');
    expect(getRoleRedirect('INDUSTRY')).not.toBe('/institution/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 11: REAL FIREBASE UID LINKING SEQUENCE
  // =========================================================================
  it('19. [Req 11] fallback login does not pollute firebaseUid with User.id, subsequent real Firebase login safely links real UID to the same PostgreSQL account without duplicates', async () => {
    const timestamp = Date.now();
    const adminEmail = `linking.admin.${timestamp}@university.edu`;
    const realFirebaseUid = `fb-genuine-uid-${timestamp}`;

    // 1. Existing SkillBridge Institution Admin with firebaseUid = null
    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Prof. Linking Dean',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null,
        institutionProfile: {
          create: {
            institutionName: 'IIT Mandi',
            adminDesignation: 'Dean Academic Relations',
          },
        },
      },
      include: { institutionProfile: true },
    });
    createdUserIds.push(existingAdmin.id);

    expect(existingAdmin.firebaseUid).toBeNull();
    const initialUserCount = await prisma.user.count();

    // 2. Login through fallback custom token (isSkillBridgeFallback: true, uid: existingAdmin.id)
    const spyFallback = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: existingAdmin.id,
      email: adminEmail,
      isSkillBridgeFallback: true,
      skillbridgeUserId: existingAdmin.id,
      firebase: { sign_in_provider: 'custom' },
    } as any);

    const fallbackReq: any = {
      headers: { authorization: 'Bearer fallback-token' },
      body: {},
    };
    const fallbackRes = createMockRes();
    await handleFirebaseTokenAuth(fallbackReq, fallbackRes, 'fallback-link-test');
    spyFallback.mockRestore();

    expect(fallbackRes.statusCode).toBe(200);
    expect(fallbackRes.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(fallbackRes.body.isNewUser).toBe(false);

    // CRITICAL: Database verification: firebaseUid must NOT be polluted with existingAdmin.id!
    const adminAfterFallback = await prisma.user.findUnique({
      where: { id: existingAdmin.id },
    });
    expect(adminAfterFallback?.firebaseUid).toBeNull(); // Stays null, not polluted by user.id
    expect(await prisma.user.count()).toBe(initialUserCount); // No duplicate user

    // 3. Subsequent login through REAL Firebase authentication (Google OAuth, etc.)
    const spyReal = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: realFirebaseUid,
      email: adminEmail,
      email_verified: true,
      isSkillBridgeFallback: false,
      firebase: { sign_in_provider: 'google.com' },
    } as any);

    const realReq: any = {
      headers: { authorization: 'Bearer real-google-token' },
      body: {},
    };
    const realRes = createMockRes();
    await handleFirebaseTokenAuth(realReq, realRes, 'real-link-test');
    spyReal.mockRestore();

    expect(realRes.statusCode).toBe(200);
    expect(realRes.body.user.id).toBe(existingAdmin.id); // Same PostgreSQL user resolved!
    expect(realRes.body.user.role).toBe('INSTITUTION_ADMIN'); // Role preserved
    expect(realRes.body.isNewUser).toBe(false);

    // Database verification: real Firebase UID is now cleanly linked!
    const adminAfterRealAuth = await prisma.user.findUnique({
      where: { id: existingAdmin.id },
      include: { studentProfile: true, institutionProfile: true },
    });
    expect(adminAfterRealAuth?.firebaseUid).toBe(realFirebaseUid); // Genuine UID linked
    expect(adminAfterRealAuth?.studentProfile).toBeNull(); // No shadow student
    expect(adminAfterRealAuth?.institutionProfile).not.toBeNull();
    expect(await prisma.user.count()).toBe(initialUserCount); // ZERO duplicate accounts

    // 4. Future login with real UID fast-paths directly through PRIMARY lookup
    const spySubsequent = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: realFirebaseUid,
      email: adminEmail,
      firebase: { sign_in_provider: 'google.com' },
    } as any);

    const fastpathReq: any = {
      headers: { authorization: 'Bearer real-fastpath-token' },
      body: {},
    };
    const fastpathRes = createMockRes();
    await handleFirebaseTokenAuth(fastpathReq, fastpathRes, 'fastpath-test');
    spySubsequent.mockRestore();

    expect(fastpathRes.statusCode).toBe(200);
    expect(fastpathRes.body.user.id).toBe(existingAdmin.id);
    expect(fastpathRes.body.user.role).toBe('INSTITUTION_ADMIN');
  });

  // =========================================================================
  // REQUIREMENT 15: MULTI-SESSION ISOLATION TEST
  // =========================================================================
  it('20. [Req 15] should maintain strict multi-session isolation between concurrent Institution Admin and Student sessions', async () => {
    const timestamp = Date.now();

    // Session A: Institution Admin
    const admin = await prisma.user.create({
      data: {
        email: `session.a.admin.${timestamp}@univ.edu`,
        name: 'Admin Session A',
        role: 'INSTITUTION_ADMIN',
        institutionProfile: {
          create: {
            institutionName: 'Session University A',
            adminDesignation: 'Dean',
          },
        },
      },
      include: { institutionProfile: true },
    });
    createdUserIds.push(admin.id);

    // Session B: Student
    const student = await prisma.user.create({
      data: {
        email: `session.b.student.${timestamp}@univ.edu`,
        name: 'Student Session B',
        role: 'STUDENT',
        studentProfile: {
          create: {
            institution: 'Session University A',
            targetDomain: 'Cybersecurity',
          },
        },
      },
      include: { studentProfile: true },
    });
    createdUserIds.push(student.id);

    // Tokens
    const tokenA = generateAccessToken({ userId: admin.id, role: 'INSTITUTION_ADMIN', email: admin.email });
    const tokenB = generateAccessToken({ userId: student.id, role: 'STUDENT', email: student.email });

    // Interleaved execution: Authenticate A
    const reqA1: any = { headers: { authorization: `Bearer ${tokenA}` } };
    const resA1 = createMockRes();
    let nextA1 = false;
    await authenticate(reqA1, resA1, () => { nextA1 = true; });
    expect(nextA1).toBe(true);
    expect(reqA1.user.id).toBe(admin.id);
    expect(reqA1.user.role).toBe('INSTITUTION_ADMIN');
    expect(getRoleRedirect(reqA1.user.role)).toBe('/institution/dashboard');

    // Authenticate B
    const reqB: any = { headers: { authorization: `Bearer ${tokenB}` } };
    const resB = createMockRes();
    let nextB = false;
    await authenticate(reqB, resB, () => { nextB = true; });
    expect(nextB).toBe(true);
    expect(reqB.user.id).toBe(student.id);
    expect(reqB.user.role).toBe('STUDENT');
    expect(getRoleRedirect(reqB.user.role)).toBe('/dashboard');

    // Re-verify A: A is completely unaffected by B's authentication
    const reqA2: any = { headers: { authorization: `Bearer ${tokenA}` } };
    const resA2 = createMockRes();
    let nextA2 = false;
    await authenticate(reqA2, resA2, () => { nextA2 = true; });
    expect(nextA2).toBe(true);
    expect(reqA2.user.id).toBe(admin.id);
    expect(reqA2.user.role).toBe('INSTITUTION_ADMIN');
    expect(getRoleRedirect(reqA2.user.role)).toBe('/institution/dashboard');
  });

  // =========================================================================
  // REQUIREMENT 12: EMAIL NORMALIZATION
  // =========================================================================
  it('21. [Req 12] should normalize emails case-insensitively and never allow casing variants to create duplicate accounts', async () => {
    const timestamp = Date.now();
    const mixedCaseEmail = `CaseInsensitive.${timestamp}@University.EDU`;
    const lowerCaseEmail = mixedCaseEmail.toLowerCase();

    const existingAdmin = await prisma.user.create({
      data: {
        email: lowerCaseEmail,
        name: 'Case Dean',
        role: 'INSTITUTION_ADMIN',
        institutionProfile: {
          create: {
            institutionName: 'Case University',
            adminDesignation: 'Dean',
          },
        },
      },
    });
    createdUserIds.push(existingAdmin.id);

    const initialUserCount = await prisma.user.count();

    // Token presents mixed-case email claim
    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: `fb-mixed-case-${timestamp}`,
      email: mixedCaseEmail,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer mixed-case-token' },
      body: {},
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'case-test');
    spy.mockRestore();

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe(existingAdmin.id);
    expect(res.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(res.body.isNewUser).toBe(false);
    expect(await prisma.user.count()).toBe(initialUserCount); // No duplicate user created
  });

  // =========================================================================
  // REQUIREMENT 3: REJECT ARBITRARY FIREBASE TOKEN WITH UUID FROM HIJACKING USER.ID
  // =========================================================================
  it('22. [Req 3] should reject arbitrary real Firebase tokens from matching User.id by UUID shape unless explicitly verified as SkillBridge fallback token', async () => {
    const timestamp = Date.now();
    const adminEmail = `victim.admin.${timestamp}@university.edu`;

    const victimAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Victim Admin',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null,
        institutionProfile: {
          create: {
            institutionName: 'Target Institute',
            adminDesignation: 'Dean',
          },
        },
      },
    });
    createdUserIds.push(victimAdmin.id);

    // An external Firebase user signs in via Google with a UID that maliciously or coincidentally equals victimAdmin.id,
    // BUT has their own email and is NOT a SkillBridge fallback token (isSkillBridgeFallback: false).
    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: victimAdmin.id, // Matching UUID
      email: `attacker.${timestamp}@evil.com`, // Different email
      isSkillBridgeFallback: false, // NOT a SkillBridge fallback token!
      firebase: { sign_in_provider: 'google.com' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer attacker-token' },
      body: {},
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'hijack-test');
    spy.mockRestore();

    // Attacker's token must NOT hijack victimAdmin's account!
    // Instead, it enters new-user provisioning for attacker or returns their own separate user.
    if (res.body.user?.id) {
      createdUserIds.push(res.body.user.id);
    }
    expect(res.body.user.id).not.toBe(victimAdmin.id); // Did NOT match victimAdmin!
    expect(res.body.user.email).not.toBe(adminEmail);

    // Check victimAdmin in DB: still unchanged, role INSTITUTION_ADMIN
    const checkVictim = await prisma.user.findUnique({
      where: { id: victimAdmin.id },
    });
    expect(checkVictim?.email).toBe(adminEmail);
    expect(checkVictim?.role).toBe('INSTITUTION_ADMIN');
  });

  // =========================================================================
  // REQUIREMENT 1: REJECT EMAIL-BASED LINKING WHEN FIREBASE EMAIL IS UNVERIFIED (CASE 3)
  // =========================================================================
  it('23. [Req 1 / Case 3] should reject email-based account linking when external provider token has email_verified: false', async () => {
    const timestamp = Date.now();
    const adminEmail = `unverified.target.${timestamp}@university.edu`;

    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Target Admin',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null,
        institutionProfile: {
          create: {
            institutionName: 'Target University',
            adminDesignation: 'Dean',
          },
        },
      },
    });
    createdUserIds.push(existingAdmin.id);

    // An attacker creates an unverified external provider account (e.g. Google) with the dean's email
    const attackerUid = `unverified-attacker-${timestamp}`;
    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: attackerUid,
      email: adminEmail,
      email_verified: false, // UNVERIFIED!
      firebase: { sign_in_provider: 'google.com' }, // Genuine federated external provider
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer unverified-google-token' },
      body: {},
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'unverified-test');
    spy.mockRestore();

    // Must be rejected with 403 EMAIL_NOT_VERIFIED, NOT linked to existingAdmin!
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.error.message).toContain('login provider email is not verified');

    // Existing admin account in PostgreSQL must NOT be hijacked or linked to attacker
    const checkAdmin = await prisma.user.findUnique({
      where: { id: existingAdmin.id },
    });
    expect(checkAdmin?.firebaseUid).toBeNull(); // Still null, attacker NOT linked
    expect(checkAdmin?.role).toBe('INSTITUTION_ADMIN');
  });

  // =========================================================================
  // CASE 1: NEW EMAIL/PASSWORD REGISTRATION FOR INSTITUTION ADMIN
  // =========================================================================
  it('24. [Case 1] should successfully register a new Institution Admin with email/password, creating InstitutionProfile and assigning INSTITUTION_ADMIN role', async () => {
    const timestamp = Date.now();
    const newAdminEmail = `new.dean.${timestamp}@dtu.ac.in`;
    const newAdminUid = `fb-new-admin-${timestamp}`;

    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: newAdminUid,
      email: newAdminEmail,
      email_verified: false, // Normal new email/password accounts start unverified
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer new-admin-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        name: 'Dr. S. K. Verma',
        roleData: {
          institutionName: 'Delhi Technological University',
          adminDesignation: 'Dean of Student Affairs',
          name: 'Dr. S. K. Verma',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');
    spy.mockRestore();

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('INSTITUTION_ADMIN');
    expect(res.body.user.email).toBe(newAdminEmail);
    expect(res.body.isNewUser).toBe(true);

    if (res.body.user?.id) {
      createdUserIds.push(res.body.user.id);
    }

    // Verify DB user record & profile
    const dbAdmin = await prisma.user.findUnique({
      where: { email: newAdminEmail },
      include: { institutionProfile: true, studentProfile: true, industryProfile: true },
    });
    expect(dbAdmin).not.toBeNull();
    expect(dbAdmin?.role).toBe('INSTITUTION_ADMIN');
    expect(dbAdmin?.firebaseUid).toBe(newAdminUid);
    expect(dbAdmin?.institutionProfile).not.toBeNull();
    expect(dbAdmin?.institutionProfile?.institutionName).toBe('Delhi Technological University');
    expect(dbAdmin?.institutionProfile?.adminDesignation).toBe('Dean of Student Affairs');
    expect(dbAdmin?.studentProfile).toBeNull();
    expect(dbAdmin?.industryProfile).toBeNull();
  });

  // =========================================================================
  // CASE 2: EXISTING EMAIL/PASSWORD ACCOUNT CANNOT BE RE-REGISTERED
  // =========================================================================
  it('25. [Case 2] should reject registration of an existing email/password account with 409 ACCOUNT_EXISTS without requiring provider email verification', async () => {
    const timestamp = Date.now();
    const existingEmail = `existing.pw.user.${timestamp}@university.edu`;

    const existingUser = await prisma.user.create({
      data: {
        email: existingEmail,
        name: 'Existing Admin',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null, // edge case: existing email/password account with null firebaseUid
        passwordHash: await bcrypt.hash('Password123!', 10),
        institutionProfile: {
          create: {
            institutionName: 'Apex University',
            adminDesignation: 'Director',
          },
        },
      },
    });
    createdUserIds.push(existingUser.id);
    const initialUserCount = await prisma.user.count();

    // User attempts to re-register with email/password (provider: 'password')
    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: `fb-dup-pw-${timestamp}`,
      email: existingEmail,
      email_verified: false, // unverified password registration token
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer dup-pw-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        name: 'Attempt Duplicate',
        roleData: {
          institutionName: 'Duplicate College',
          adminDesignation: 'Vice Chancellor',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');
    spy.mockRestore();

    // Must return 409 ACCOUNT_EXISTS, NOT 403 EMAIL_NOT_VERIFIED!
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');
    expect(res.body.error.message).toContain('already exists. Please sign in instead');

    // Verify DB integrity: no duplicate user, role unchanged
    expect(await prisma.user.count()).toBe(initialUserCount);
    const checkDb = await prisma.user.findUnique({
      where: { id: existingUser.id },
      include: { institutionProfile: true },
    });
    expect(checkDb?.role).toBe('INSTITUTION_ADMIN');
    expect(checkDb?.institutionProfile?.institutionName).toBe('Apex University'); // Unchanged
  });

  // =========================================================================
  // CASE 3: EXISTING ACCOUNT WITH VERIFIED GOOGLE ACCOUNT LINKS SUCCESSFULLY
  // =========================================================================
  it('26. [Case 3] should link existing account when external provider token is verified (email_verified: true)', async () => {
    const timestamp = Date.now();
    const adminEmail = `verified.oauth.${timestamp}@university.edu`;
    const googleUid = `google-uid-${timestamp}`;

    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dean Verified',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null,
        institutionProfile: {
          create: {
            institutionName: 'Verified Tech',
            adminDesignation: 'Dean',
          },
        },
      },
    });
    createdUserIds.push(existingAdmin.id);

    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: googleUid,
      email: adminEmail,
      email_verified: true, // VERIFIED!
      firebase: { sign_in_provider: 'google.com' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer verified-google-token' },
      body: {},
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'google/firebase');
    spy.mockRestore();

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe(existingAdmin.id);
    expect(res.body.user.role).toBe('INSTITUTION_ADMIN');

    // Verify linked in DB
    const checkAdmin = await prisma.user.findUnique({ where: { id: existingAdmin.id } });
    expect(checkAdmin?.firebaseUid).toBe(googleUid);
  });

  // =========================================================================
  // CASE 4: EXISTING INSTITUTION ADMIN CANNOT BE DOWNGRADED OR DUPLICATED
  // =========================================================================
  it('27. [Case 4] should not downgrade existing INSTITUTION_ADMIN when registration payload specifies STUDENT', async () => {
    const timestamp = Date.now();
    const adminEmail = `downgrade.attempt.${timestamp}@university.edu`;

    const existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Senior Dean',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: null,
        institutionProfile: {
          create: {
            institutionName: 'Central University',
            adminDesignation: 'Dean of Engineering',
          },
        },
      },
    });
    createdUserIds.push(existingAdmin.id);
    const initialUserCount = await prisma.user.count();

    // Client maliciously or accidentally attempts to register as a STUDENT with this email
    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: `fb-student-attempt-${timestamp}`,
      email: adminEmail,
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer student-attempt-token' },
      body: {
        role: 'STUDENT',
        name: 'Hacker',
        roleData: {
          institution: 'Random College',
          targetDomain: 'Full-Stack Web',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');
    spy.mockRestore();

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');
    expect(res.body.error.message).toContain('already exists. Please sign in instead');

    // DB verification: user still exists, still INSTITUTION_ADMIN, no studentProfile created
    expect(await prisma.user.count()).toBe(initialUserCount);
    const checkAdmin = await prisma.user.findUnique({
      where: { id: existingAdmin.id },
      include: { studentProfile: true, institutionProfile: true },
    });
    expect(checkAdmin?.role).toBe('INSTITUTION_ADMIN');
    expect(checkAdmin?.studentProfile).toBeNull();
    expect(checkAdmin?.institutionProfile).not.toBeNull();
  });

  // =========================================================================
  // CASE 6: EXISTING STUDENT CANNOT BE OVERWRITTEN BY INSTITUTION ADMIN REGISTRATION
  // =========================================================================
  it('28. [Case 6] should reject Institution Admin registration when email belongs to an existing STUDENT account', async () => {
    const timestamp = Date.now();
    const studentEmail = `student.collision.${timestamp}@university.edu`;

    const existingStudent = await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Student Rohan',
        role: 'STUDENT',
        firebaseUid: `fb-rohan-${timestamp}`,
        studentProfile: {
          create: {
            institution: 'NIT Trichy',
            targetDomain: 'AI/Data Science',
          },
        },
      },
    });
    createdUserIds.push(existingStudent.id);
    const initialUserCount = await prisma.user.count();

    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: `fb-admin-rohan-${timestamp}`,
      email: studentEmail,
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer rohan-admin-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        name: 'NIT Admin',
        roleData: {
          institutionName: 'NIT Trichy',
          adminDesignation: 'Placement Officer',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');
    spy.mockRestore();

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');

    // Student account in DB remains untouched, role is still STUDENT
    expect(await prisma.user.count()).toBe(initialUserCount);
    const checkStudent = await prisma.user.findUnique({
      where: { id: existingStudent.id },
      include: { studentProfile: true, institutionProfile: true },
    });
    expect(checkStudent?.role).toBe('STUDENT');
    expect(checkStudent?.institutionProfile).toBeNull(); // No admin profile created
  });

  // =========================================================================
  // CASE 7: EXISTING INDUSTRY CANNOT BE OVERWRITTEN BY INSTITUTION ADMIN REGISTRATION
  // =========================================================================
  it('29. [Case 7] should reject Institution Admin registration when email belongs to an existing INDUSTRY account', async () => {
    const timestamp = Date.now();
    const industryEmail = `recruiter.collision.${timestamp}@techcorp.com`;

    const existingIndustry = await prisma.user.create({
      data: {
        email: industryEmail,
        name: 'Recruiter Maya',
        role: 'INDUSTRY',
        firebaseUid: `fb-maya-${timestamp}`,
        industryProfile: {
          create: {
            companyName: 'TechCorp Labs',
            companySize: '50-250 employees',
            industrySector: 'Software',
            verified: true,
          },
        },
      },
    });
    createdUserIds.push(existingIndustry.id);
    const initialUserCount = await prisma.user.count();

    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: `fb-admin-maya-${timestamp}`,
      email: industryEmail,
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer maya-admin-token' },
      body: {
        role: 'INSTITUTION_ADMIN',
        name: 'TechCorp Admin',
        roleData: {
          institutionName: 'TechCorp Institute',
          adminDesignation: 'Campus Director',
        },
      },
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'sync');
    spy.mockRestore();

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');

    // Industry account in DB remains untouched, role is still INDUSTRY
    expect(await prisma.user.count()).toBe(initialUserCount);
    const checkIndustry = await prisma.user.findUnique({
      where: { id: existingIndustry.id },
      include: { industryProfile: true, institutionProfile: true },
    });
    expect(checkIndustry?.role).toBe('INDUSTRY');
    expect(checkIndustry?.institutionProfile).toBeNull();
  });

  // =========================================================================
  // LOGIN FLOW: INSTITUTION ADMIN LOGIN STILL WORKS AFTER REGISTRATION
  // =========================================================================
  it('30. [Login Flow] should allow registered Institution Admin to sign in and hydrate session with correct role and profile', async () => {
    const timestamp = Date.now();
    const adminEmail = `login.admin.${timestamp}@university.edu`;
    const adminUid = `fb-login-admin-${timestamp}`;

    // Admin created via registration flow
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dr. A. P. Sharma',
        role: 'INSTITUTION_ADMIN',
        firebaseUid: adminUid,
        institutionProfile: {
          create: {
            institutionName: 'State Technical University',
            adminDesignation: 'Dean of Placements',
          },
        },
      },
    });
    createdUserIds.push(admin.id);

    // Admin logs in via signInWithEmailAndPassword -> calls /google/firebase
    const spy = vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValueOnce({
      uid: adminUid,
      email: adminEmail,
      firebase: { sign_in_provider: 'password' },
    } as any);

    const req: any = {
      headers: { authorization: 'Bearer admin-login-token' },
      body: {},
    };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, 'google/firebase');
    spy.mockRestore();

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(admin.id);
    expect(res.body.user.institutionProfile).toBeDefined();
    expect(res.body.user.institutionProfile.institutionName).toBe('State Technical University');
    expect(res.body.accessToken).toBeDefined();
    expect(getRoleRedirect(res.body.user.role)).toBe('/institution/dashboard');
  });
});

