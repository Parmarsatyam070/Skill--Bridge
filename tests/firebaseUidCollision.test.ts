import { describe, it, expect, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "../server/src/config/prisma.js";
import { adminAuth } from "../server/src/config/firebase.js";
import { handleFirebaseTokenAuth } from "../server/src/routes/auth.js";

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    cookies: {},
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
    cookie(name: string, value: any) { this.cookies[name] = value; return this; },
    setHeader() { return this; },
  };
  return res;
}

function mockFirebaseToken(spy: any, uid: string, email: string, emailVerified: boolean, provider: string) {
  spy.mockResolvedValueOnce({
    uid, email, email_verified: emailVerified,
    firebase: { sign_in_provider: provider },
  } as any);
}

describe("Firebase UID Collision / Reassignment Prevention Suite", { timeout: 30000 }, () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.institutionProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.studentProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.industryProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  it("1. [UID -> Same User] should allow auth when UID already matches existing firebaseUid - no destructive rewrite", async () => {
    const uid = `same-uid-${Date.now()}`;
    const email = `same.uid.${Date.now()}@university.edu`;
    const hash = await bcrypt.hash("Test1234!", 10);
    const user = await prisma.user.create({
      data: {
        email, passwordHash: hash, name: "Same UID User", role: "STUDENT",
        firebaseUid: uid, currentStreak: 1, longestStreak: 1,
        studentProfile: { create: { institution: "Test Uni", targetDomain: "Engineering" } },
      },
    });
    createdUserIds.push(user.id);

    const spy = vi.spyOn(adminAuth, "verifyIdToken");
    mockFirebaseToken(spy, uid, email, false, "password");
    const req: any = { headers: { authorization: "Bearer token-same" }, body: {} };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, "google/firebase");
    spy.mockRestore();

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshed?.firebaseUid).toBe(uid);
  });

  it("2. [UID -> Different User] should reject link when Firebase UID already owned by different user - neither user modified", async () => {
    const uid = `hijack-uid-${Date.now()}`;
    const emailA = `uid.owner.${Date.now()}@example.com`;
    const emailB = `uid.hijacker.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Test1234!", 10);

    const userA = await prisma.user.create({
      data: {
        email: emailA, passwordHash: hash, name: "UID Owner A", role: "STUDENT",
        firebaseUid: uid, currentStreak: 1, longestStreak: 1,
        studentProfile: { create: { institution: "Uni A", targetDomain: "CS" } },
      },
    });
    createdUserIds.push(userA.id);

    const userB = await prisma.user.create({
      data: {
        email: emailB, passwordHash: hash, name: "Hijacker B", role: "INDUSTRY",
        firebaseUid: null, currentStreak: 1, longestStreak: 1,
        industryProfile: { create: { companyName: "Corp B", companySize: "50-200 employees", industrySector: "Tech", website: "", verified: true } },
      },
    });
    createdUserIds.push(userB.id);

    const spy = vi.spyOn(adminAuth, "verifyIdToken");
    mockFirebaseToken(spy, uid, emailB, true, "google.com");
    const req: any = { headers: { authorization: "Bearer token-hijack" }, body: {} };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, "google/firebase");
    spy.mockRestore();

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe("FIREBASE_UID_ALREADY_LINKED");
    const refreshedA = await prisma.user.findUnique({ where: { id: userA.id } });
    const refreshedB = await prisma.user.findUnique({ where: { id: userB.id } });
    expect(refreshedA?.firebaseUid).toBe(uid);
    expect(refreshedB?.firebaseUid).toBeNull();
  });

  it("3. [Unused UID + Verified External] should successfully link a fresh Firebase UID to an existing account", async () => {
    const uid = `fresh-link-uid-${Date.now()}`;
    const email = `fresh.link.${Date.now()}@university.edu`;
    const hash = await bcrypt.hash("Test1234!", 10);
    const user = await prisma.user.create({
      data: {
        email, passwordHash: hash, name: "Fresh Link User", role: "INSTITUTION_ADMIN",
        firebaseUid: null, currentStreak: 1, longestStreak: 1,
        institutionProfile: { create: { institutionName: "NIT Trichy", adminDesignation: "Dean" } },
      },
    });
    createdUserIds.push(user.id);

    const spy = vi.spyOn(adminAuth, "verifyIdToken");
    mockFirebaseToken(spy, uid, email, true, "google.com");
    const req: any = { headers: { authorization: "Bearer token-fresh" }, body: {} };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, "google/firebase");
    spy.mockRestore();

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshed?.firebaseUid).toBe(uid);
  });

  it("4. [Unused UID + Unverified External] should reject with EMAIL_NOT_VERIFIED when provider email is unverified", async () => {
    const uid = `unverified-uid-${Date.now()}`;
    const email = `unverified.link.${Date.now()}@university.edu`;
    const hash = await bcrypt.hash("Test1234!", 10);
    const user = await prisma.user.create({
      data: {
        email, passwordHash: hash, name: "Unverified Provider User", role: "STUDENT",
        firebaseUid: null, currentStreak: 1, longestStreak: 1,
        studentProfile: { create: { institution: "IIT Delhi", targetDomain: "ML" } },
      },
    });
    createdUserIds.push(user.id);

    const spy = vi.spyOn(adminAuth, "verifyIdToken");
    mockFirebaseToken(spy, uid, email, false, "google.com");
    const req: any = { headers: { authorization: "Bearer token-unverified" }, body: {} };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, "google/firebase");
    spy.mockRestore();

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshed?.firebaseUid).toBeNull();
  });

  it("5. [Fallback Token] should never populate firebaseUid when a Firebase custom/fallback token is used", async () => {
    const email = `fallback.${Date.now()}@internal.system`;
    const hash = await bcrypt.hash("Test1234!", 10);
    const user = await prisma.user.create({
      data: {
        email, passwordHash: hash, name: "Fallback Token User", role: "STUDENT",
        firebaseUid: null, currentStreak: 1, longestStreak: 1,
        studentProfile: { create: { institution: "IIT Bombay", targetDomain: "Backend Dev" } },
      },
    });
    createdUserIds.push(user.id);

    // Simulate a custom Firebase token (isFallbackToken = true path in handleFirebaseTokenAuth):
    // provider === 'custom' triggers isFallbackToken = true which must never write to firebaseUid.
    // uid is the SkillBridge User.id (UUID-shaped) — exactly as the firebase-login-fallback endpoint
    // generates via adminAuth.createCustomToken(user.id).
    const spy = vi.spyOn(adminAuth, "verifyIdToken");
    spy.mockResolvedValueOnce({
      uid: user.id,  // SkillBridge User.id, not a Firebase UID
      email,
      email_verified: false,
      isSkillBridgeFallback: true,
      firebase: { sign_in_provider: "custom" },
    } as any);

    const req: any = { headers: { authorization: "Bearer custom-fallback-token" }, body: {} };
    const res = createMockRes();
    await handleFirebaseTokenAuth(req, res, "google/firebase");
    spy.mockRestore();

    // Fallback token must authenticate the user via their User.id UUID
    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe(user.id);

    // CRITICAL: firebaseUid must remain null — the fallback/custom token path MUST NOT populate it
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshed?.firebaseUid).toBeNull();
  });
});

