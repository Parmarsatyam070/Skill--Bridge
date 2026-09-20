import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { prisma } from '../config/prisma.js';
import { adminAuth } from '../config/firebase.js';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../../../shared/validation.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { recordDailyActivity } from '../services/streakService.js';
import { sendPasswordResetEmail, sendSmsOtp } from '../services/notificationService.js';
import {
  getAuthorizationUrl,
  exchangeCodeForVerifiedUser,
  createOAuthOnboardingToken,
  verifyOAuthOnboardingToken,
  isOauthConfigured,
  OAuthProvider,
} from '../services/oauthService.js';

const router = Router();

// Rate limiter for login: 25 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for password reset: max 3 requests per 15 minutes
const resetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset requests. Please wait 15 minutes before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Format full session object for client
 */
export async function buildUserSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      industryProfile: true,
      academicianProfile: true,
      institutionProfile: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone || undefined,
    phoneVerified: user.phoneVerified,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastActiveDate: user.lastActiveDate || undefined,
    studentProfile: user.studentProfile || undefined,
    industryProfile: user.industryProfile || undefined,
    academicianProfile: user.academicianProfile || undefined,
    institutionProfile: user.institutionProfile || undefined,
  };
}

/**
 * Shared handler for Firebase ID token verification and PostgreSQL user session sync/provisioning.
 * Supports both POST /api/auth/sync and POST /api/auth/google/firebase.
 */
export async function handleFirebaseTokenAuth(req: Request, res: Response, sourceEndpoint: string) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.body?.idToken) {
    token = req.body.idToken;
  }

  console.log(`[AUTH ${sourceEndpoint}] === Starting Firebase Token Authentication ===`);

  if (!token) {
    console.warn(`[AUTH ${sourceEndpoint}] Missing token in request header and body.`);
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Valid Firebase ID token required.' },
    });
  }

  try {
    console.log(`[AUTH ${sourceEndpoint}] Step 1: Verifying token with Firebase Admin SDK...`);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const cleanEmail = decodedToken.email?.toLowerCase().trim();
    const uid = decodedToken.uid;
    const isEmailVerified = Boolean(decodedToken.email_verified);
    // Determine if token is from an explicit external identity provider or a controlled SkillBridge fallback token (Rule 2 & 3)
    const provider = decodedToken.firebase?.sign_in_provider;
    const isFederatedExternalProvider = Boolean(
      provider && ['google.com', 'github.com', 'microsoft.com', 'apple.com'].includes(provider)
    );
    const isPasswordProvider = provider === 'password';
    const isExplicitExternalProvider = Boolean(
      provider && ['google.com', 'github.com', 'microsoft.com', 'apple.com', 'password', 'phone', 'anonymous'].includes(provider)
    );
    const isFallbackToken = !isExplicitExternalProvider && Boolean(
      (decodedToken as any).isSkillBridgeFallback === true ||
      provider === 'custom' ||
      (!provider && (decodedToken as any).skillbridgeUserId) ||
      (!provider && !decodedToken.firebase)
    );
    const fallbackUserId = (decodedToken as any).skillbridgeUserId;
    const authProvider = provider || (isFallbackToken ? 'skillbridge-fallback' : 'unknown');

    console.log(`[AUTH ${sourceEndpoint}] Step 1 Success: UID=${uid} | Email=${cleanEmail || 'none'} | Verified=${isEmailVerified} | Provider=${authProvider}`);

    if (!cleanEmail && !uid) {
      console.error(`[AUTH ${sourceEndpoint}] Token lacked both email and UID.`);
      return res.status(400).json({
        error: { code: 'INVALID_TOKEN', message: 'Token lacks email or UID identifier.' },
      });
    }

    console.log(`[AUTH ${sourceEndpoint}] Step 2: Looking up existing user by verified identity...`);

    let user: any = null;

    if (isFallbackToken) {
      console.log(`[AUTH ${sourceEndpoint}] Processing controlled SkillBridge fallback-token flow.`);
      // Controlled SkillBridge Fallback Token Flow:
      // PRIMARY: Lookup by SkillBridge User.id (using fallbackUserId or uid when formatted as UUID)
      const targetUserId = fallbackUserId || uid;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
      if (isUuid) {
        user = await prisma.user.findUnique({
          where: { id: targetUserId },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }

      // SECONDARY: If not matched by User.id, check by verified token email (case-insensitive)
      if (!user && cleanEmail) {
        user = await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: 'insensitive' as const },
          },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }

      // TERTIARY: If user already had an existing real firebaseUid matching uid
      if (!user && uid) {
        user = await prisma.user.findFirst({
          where: { firebaseUid: uid },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }
    } else {
      console.log(`[AUTH ${sourceEndpoint}] Processing genuine Firebase authentication token (Provider: ${authProvider}).`);
      // Genuine Firebase Authentication Token (Google, Password, GitHub, etc.):
      // PRIMARY: Check by verified firebaseUid = verified token UID
      user = await prisma.user.findFirst({
        where: { firebaseUid: uid },
        include: {
          studentProfile: true,
          industryProfile: true,
          academicianProfile: true,
          institutionProfile: true,
        },
      });

      // Security Check: If a user with this firebaseUid was found, verify it is the SAME user being authenticated
      if (user && cleanEmail && user.email.toLowerCase().trim() !== cleanEmail) {
        console.error(
          `[AUTH ${sourceEndpoint}] Firebase UID ${uid} is already linked to user ${user.id} (${user.email}), which differs from token email (${cleanEmail}). Rejecting conflict.`
        );
        return res.status(409).json({
          error: {
            code: 'FIREBASE_UID_ALREADY_LINKED',
            message: 'This Firebase account is already linked to another user.',
          },
        });
      }

      // Check role consistency if this is an explicit registration attempt for an existing user with this firebaseUid
      const isRegistrationAttempt = Boolean(
        sourceEndpoint === 'sync' || req.body?.role || req.body?.roleData
      );
      if (user && isRegistrationAttempt && req.body?.role && req.body.role !== user.role) {
        console.warn(
          `[AUTH ${sourceEndpoint}] Role conflict: existing user ${user.id} (${user.email}) has DB role ${user.role}, but registration requested ${req.body.role}.`
        );
        return res.status(409).json({
          error: {
            code: 'ROLE_CONFLICT',
            message: `An account already exists with role ${user.role}. Cannot register as ${req.body.role}.`,
          },
        });
      }

      // SECONDARY: If not found by firebaseUid, look up existing account by cleanEmail:
      if (!user && cleanEmail) {
        const existingAccountByEmail = await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: 'insensitive' as const },
          },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });

        if (existingAccountByEmail) {
          // An existing account with this email was found in PostgreSQL!
          // CASE A & B: User already has the same Firebase UID linked
          if (existingAccountByEmail.firebaseUid === uid) {
            if (isRegistrationAttempt && req.body?.role && req.body.role !== existingAccountByEmail.role) {
              console.warn(
                `[AUTH ${sourceEndpoint}] Role conflict: existing user ${existingAccountByEmail.id} has DB role ${existingAccountByEmail.role}, but registration requested ${req.body.role}.`
              );
              return res.status(409).json({
                error: {
                  code: 'ROLE_CONFLICT',
                  message: `An account already exists with role ${existingAccountByEmail.role}. Cannot register as ${req.body.role}.`,
                },
              });
            }
            console.log(`[AUTH ${sourceEndpoint}] Existing user ${existingAccountByEmail.id} matches verified Firebase UID ${uid}. Idempotent session recovery.`);
            user = existingAccountByEmail;
          } else if (isFederatedExternalProvider) {
            // CASE 3: Genuine federated external provider (Google, GitHub, Microsoft, Apple)
            if (!isEmailVerified) {
              console.error(`[AUTH ${sourceEndpoint}] External provider (${provider}) email ${cleanEmail} is not verified. Rejecting account linking.`);
              return res.status(403).json({
                error: {
                  code: 'EMAIL_NOT_VERIFIED',
                  message: 'An account with this email exists, but your login provider email is not verified. Please verify your email before linking.',
                },
              });
            }

            // Requirement 1: Look up existing user by firebaseUid before linking
            const existingUserByUid = uid
              ? await prisma.user.findFirst({
                  where: { firebaseUid: uid },
                })
              : null;

            // Requirement 3: If UID belongs to a DIFFERENT User:
            if (existingUserByUid && existingUserByUid.id !== existingAccountByEmail.id) {
              console.error(
                `[AUTH ${sourceEndpoint}] Firebase UID ${uid} is already linked to user ${existingUserByUid.id} (${existingUserByUid.email}). Rejecting account linking to ${existingAccountByEmail.id} (${existingAccountByEmail.email}).`
              );
              return res.status(409).json({
                error: {
                  code: 'FIREBASE_UID_ALREADY_LINKED',
                  message: 'This Firebase account is already linked to another user.',
                },
              });
            }

            console.log(`[AUTH ${sourceEndpoint}] External provider (${provider}) verified email match for ${cleanEmail}. Linking account.`);
            user = existingAccountByEmail;
          } else if (isRegistrationAttempt) {
            // Check if UID belongs to another user
            const existingUserByUid = uid
              ? await prisma.user.findFirst({
                  where: { firebaseUid: uid },
                })
              : null;
            if (existingUserByUid && existingUserByUid.id !== existingAccountByEmail.id) {
              return res.status(409).json({
                error: {
                  code: 'FIREBASE_UID_ALREADY_LINKED',
                  message: 'This Firebase account is already linked to another user.',
                },
              });
            }
            // CASE 2 & 4: Existing account created with email/password
            // Registration attempted for an email that already exists.
            // Do NOT treat it as external-provider linking.
            // Do NOT require Firebase provider-email verification.
            // Return a clear "account already exists / please sign in" response.
            // Do not create a duplicate User.
            // Do not alter the existing User.role.
            console.warn(`[AUTH ${sourceEndpoint}] Registration attempted for existing email/password account ${cleanEmail} (Role: ${existingAccountByEmail.role}).`);
            return res.status(409).json({
              error: {
                code: 'ACCOUNT_EXISTS',
                message: 'An account with this email address already exists. Please sign in instead.',
              },
            });
          } else {
            // Existing email/password user logging in (e.g. firebaseUid was null in PostgreSQL)
            console.log(`[AUTH ${sourceEndpoint}] Existing email/password user ${cleanEmail} authenticated via Firebase. Linking firebaseUid.`);
            user = existingAccountByEmail;
          }
        }
      }
      // Note: Arbitrary Firebase tokens do NOT search by id: uid, ensuring UUID-shaped Firebase UIDs cannot collide with User.id
    }

    if (user) {
      console.log(`[AUTH ${sourceEndpoint}] Step 2: Found existing user account in database (ID: ${user.id}, Role: ${user.role}, Existing UID: ${user.firebaseUid || 'null'}).`);

      // CRITICAL (Rule 3 & Rule 4): Database User.role is AUTHORITATIVE.
      // Ignore any client-supplied role in req.body (e.g. role: 'STUDENT').
      // Existing user role can NEVER be downgraded or modified during normal login/sync.
      const authoritativeRole = user.role;

      // Identity Linking Rule (Rule 4):
      // Only link firebaseUid if this is a GENUINE Firebase token (!isFallbackToken) and the UID is not already linked.
      // NEVER write User.id into firebaseUid column during fallback authentication.
      if (!isFallbackToken && uid && user.firebaseUid !== uid) {
        console.log(`[AUTH ${sourceEndpoint}] Step 3: Linking genuine Firebase UID ${uid} to user account ${user.id}...`);

        // UID Collision Guard: check whether this Firebase UID is already assigned to a DIFFERENT user.
        // If so, reject the linking to prevent UID reassignment/hijacking.
        const uidOwner = await prisma.user.findFirst({
          where: { firebaseUid: uid },
          select: { id: true, email: true },
        });
        if (uidOwner && uidOwner.id !== user.id) {
          console.error(
            `[AUTH ${sourceEndpoint}] Step 3: Firebase UID ${uid} is already linked to user ${uidOwner.id} (${uidOwner.email}). ` +
            `Rejecting link attempt for user ${user.id} (${user.email}).`
          );
          return res.status(409).json({
            error: {
              code: 'FIREBASE_UID_ALREADY_LINKED',
              message: 'This Firebase account is already linked to another user.',
            },
          });
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firebaseUid: uid,
            avatarUrl: user.avatarUrl || decodedToken.picture || null,
          },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
        console.log(`[AUTH ${sourceEndpoint}] Step 3: Successfully linked account with genuine Firebase UID.`);
      } else if (!user.avatarUrl && decodedToken.picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            avatarUrl: decodedToken.picture,
          },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }

      // Ensure profile exists ONLY for the user's authoritative role (auto-heal)
      if (authoritativeRole === 'INSTITUTION_ADMIN' && !user.institutionProfile) {
        console.log(`[AUTH ${sourceEndpoint}] Auto-creating default institution profile for existing admin ${user.id}`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            institutionProfile: {
              create: {
                institutionName: 'Partner Institution',
                adminDesignation: 'Administrator',
              },
            },
          },
          include: { studentProfile: true, industryProfile: true, academicianProfile: true, institutionProfile: true },
        });
      } else if (authoritativeRole === 'STUDENT' && !user.studentProfile) {
        console.log(`[AUTH ${sourceEndpoint}] Auto-creating default student profile for existing student ${user.id}`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            studentProfile: {
              create: {
                institution: 'Unspecified University',
                targetDomain: 'Full-Stack Web',
              },
            },
          },
          include: { studentProfile: true, industryProfile: true, academicianProfile: true, institutionProfile: true },
        });
      } else if (authoritativeRole === 'INDUSTRY' && !user.industryProfile) {
        console.log(`[AUTH ${sourceEndpoint}] Auto-creating default industry profile for existing recruiter ${user.id}`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            industryProfile: {
              create: {
                companyName: user.name || 'Partner Company',
                companySize: '50-200 employees',
                industrySector: 'Technology',
                verified: true,
              },
            },
          },
          include: { studentProfile: true, industryProfile: true, academicianProfile: true, institutionProfile: true },
        });
      }

      try {
        await recordDailyActivity(user.id);
      } catch (activityErr: any) {
        console.warn(`[AUTH ${sourceEndpoint}] Non-critical: Failed to record daily activity for user ${user.id}:`, activityErr.message);
      }

      const session = await buildUserSession(user.id);
      if (!session) {
        throw new Error(`Failed to build user session for user ${user.id}`);
      }
      // Guarantee session role reflects authoritative database role
      session.role = authoritativeRole;

      // Generate SkillBridge JWT tokens using authoritative database role
      const tokenPayload = { userId: user.id, role: authoritativeRole, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log(`[AUTH ${sourceEndpoint}] === Authentication Successful for Existing User ${user.id} (${user.email}) [Authoritative Role: ${authoritativeRole}] ===`);
      return res.json({ user: session, accessToken, isNewUser: false });
    }

    // 2. New user provisioning in PostgreSQL
    // DEFENSE 2: Reject password-provider auto-provisioning on /api/auth/google/firebase when no DB User exists
    if (sourceEndpoint === 'google/firebase' && isPasswordProvider) {
      console.warn(
        `[AUTH ${sourceEndpoint}] Rejected auto-provisioning for password-provider Firebase user ${uid} (${cleanEmail}). Explicit registration required.`
      );
      return res.status(400).json({
        error: {
          code: 'REGISTRATION_REQUIRED',
          message: 'Password accounts must be registered with complete profile information.',
        },
      });
    }

    const { role, name, roleData } = req.body || {};
    const ALLOWED_SIGNUP_ROLES = ['STUDENT', 'INDUSTRY', 'INSTITUTION_ADMIN'];
    const assignedRole = (role && ALLOWED_SIGNUP_ROLES.includes(role)) ? role : 'STUDENT';
    const displayName = (name || roleData?.name || roleData?.institutionName || roleData?.companyName || decodedToken.name || cleanEmail?.split('@')[0] || 'User').trim();
    const avatarUrl = decodedToken.picture || null;

    console.log(`[AUTH ${sourceEndpoint}] Step 4: Provisioning new user in database (Email: ${cleanEmail}, Role: ${assignedRole}, Name: ${displayName})...`);

    try {
      const dbFirebaseUid = isFallbackToken ? null : uid;

      if (assignedRole === 'STUDENT') {
        user = await prisma.user.create({
          data: {
            email: cleanEmail || `${uid}@firebase.user`,
            firebaseUid: dbFirebaseUid,
            name: displayName,
            role: 'STUDENT',
            avatarUrl,
            currentStreak: 1,
            longestStreak: 1,
            studentProfile: {
              create: {
                institution: roleData?.institution?.trim() || 'Unspecified University',
                targetDomain: roleData?.targetDomain?.trim() || 'Full-Stack Web',
                cgpa: roleData?.cgpa ? Number(roleData.cgpa) : null,
                bio: roleData?.bio?.trim() || null,
              },
            },
          },
          include: { studentProfile: true },
        });
      } else if (assignedRole === 'INDUSTRY') {
        user = await prisma.user.create({
          data: {
            email: cleanEmail || `${uid}@firebase.user`,
            firebaseUid: dbFirebaseUid,
            name: roleData?.companyName?.trim() || displayName,
            role: 'INDUSTRY',
            avatarUrl,
            currentStreak: 1,
            longestStreak: 1,
            industryProfile: {
              create: {
                companyName: roleData?.companyName?.trim() || displayName,
                companySize: roleData?.companySize || '50-200 employees',
                industrySector: roleData?.industrySector?.trim() || 'Technology',
                website: roleData?.website || '',
                verified: true,
              },
            },
          },
          include: { industryProfile: true },
        });
      } else if (assignedRole === 'INSTITUTION_ADMIN') {
        const instName = roleData?.institutionName?.trim() || 'Partner Institution';
        const adminDesig = roleData?.adminDesignation?.trim() || 'Administrator';
        const personName = (roleData?.name || name || displayName || instName).trim();
        user = await prisma.user.create({
          data: {
            email: cleanEmail || `${uid}@firebase.user`,
            firebaseUid: dbFirebaseUid,
            name: personName,
            role: 'INSTITUTION_ADMIN',
            avatarUrl,
            currentStreak: 1,
            longestStreak: 1,
            institutionProfile: {
              create: {
                institutionName: instName,
                adminDesignation: adminDesig,
              },
            },
          },
          include: { institutionProfile: true },
        });
      }
    } catch (createErr: any) {
      // Graceful fallback for P2002 concurrent collisions
      if (createErr.code === 'P2002') {
        const [collidingByUid, collidingByEmail] = await Promise.all([
          uid
            ? prisma.user.findFirst({
                where: { firebaseUid: uid },
                include: {
                  studentProfile: true,
                  industryProfile: true,
                  academicianProfile: true,
                  institutionProfile: true,
                },
              })
            : null,
          cleanEmail
            ? prisma.user.findFirst({
                where: { email: { equals: cleanEmail, mode: 'insensitive' as const } },
                include: {
                  studentProfile: true,
                  industryProfile: true,
                  academicianProfile: true,
                  institutionProfile: true,
                },
              })
            : null,
        ]);

        const collidingUser = collidingByUid || collidingByEmail;

        if (collidingUser) {
          // If the colliding user belongs to the SAME Firebase UID:
          if (collidingUser.firebaseUid === uid) {
            if (assignedRole && collidingUser.role !== assignedRole) {
              console.warn(
                `[AUTH ${sourceEndpoint}] P2002 collision: User ${collidingUser.id} has same Firebase UID ${uid} but role ${collidingUser.role} !== requested ${assignedRole}.`
              );
              return res.status(409).json({
                error: {
                  code: 'ROLE_CONFLICT',
                  message: `An account already exists with role ${collidingUser.role}. Cannot register as ${assignedRole}.`,
                },
              });
            }
            console.log(
              `[AUTH ${sourceEndpoint}] P2002 collision recovery: User ${collidingUser.id} has same Firebase UID and matching role (${collidingUser.role}). Idempotent success.`
            );
            user = collidingUser;
          } else if (collidingByUid && collidingByUid.id !== collidingUser.id) {
            console.error(
              `[AUTH ${sourceEndpoint}] P2002 collision: Firebase UID ${uid} is already linked to user ${collidingByUid.id}. Rejecting.`
            );
            return res.status(409).json({
              error: {
                code: 'FIREBASE_UID_ALREADY_LINKED',
                message: 'This Firebase account is already linked to another user.',
              },
            });
          } else if (isFederatedExternalProvider) {
            if (!isEmailVerified) {
              console.error(`[AUTH ${sourceEndpoint}] Account with email ${cleanEmail} exists, but Firebase token email is not verified.`);
              return res.status(403).json({
                error: {
                  code: 'EMAIL_NOT_VERIFIED',
                  message: 'An account with this email exists, but your login provider email is not verified. Please verify your email before linking.',
                },
              });
            }

            if (uid && collidingUser.firebaseUid && collidingUser.firebaseUid !== uid) {
              return res.status(409).json({
                error: {
                  code: 'FIREBASE_UID_ALREADY_LINKED',
                  message: 'This Firebase account is already linked to another user.',
                },
              });
            }

            user = await prisma.user.update({
              where: { id: collidingUser.id },
              data: {
                firebaseUid: uid,
                avatarUrl: collidingUser.avatarUrl || avatarUrl,
              },
              include: {
                studentProfile: true,
                industryProfile: true,
                academicianProfile: true,
                institutionProfile: true,
              },
            });
          } else {
            console.warn(`[AUTH ${sourceEndpoint}] Password registration collision (P2002) for ${cleanEmail}. Returning ACCOUNT_EXISTS.`);
            return res.status(409).json({
              error: {
                code: 'ACCOUNT_EXISTS',
                message: 'An account with this email address already exists. Please sign in instead.',
              },
            });
          }
        } else {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    }

    if (!user) {
      console.error(`[AUTH ${sourceEndpoint}] User provisioning failed to produce a user record.`);
      return res.status(500).json({
        error: { code: 'PROVISIONING_FAILED', message: 'Failed to provision user profile in database.' },
      });
    }

    try {
      await recordDailyActivity(user.id);
    } catch (activityErr: any) {
      console.warn(`[AUTH ${sourceEndpoint}] Non-critical: Failed to record daily activity for user ${user.id}:`, activityErr.message);
    }

    const session = await buildUserSession(user.id);
    if (!session) {
      throw new Error(`Failed to build user session for newly provisioned user ${user.id}`);
    }

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`[AUTH ${sourceEndpoint}] === Provisioning Complete for New User ${user.id} (${user.email}) ===`);
    return res.status(201).json({ user: session, accessToken, isNewUser: true });
  } catch (err: any) {
    console.error(`[AUTH ${sourceEndpoint} ERROR] Full failure details:`);
    console.error(`[AUTH ${sourceEndpoint} ERROR] Code: ${err.code || 'UNKNOWN'}`);
    console.error(`[AUTH ${sourceEndpoint} ERROR] Message: ${err.message}`);
    if (err.stack) {
      console.error(`[AUTH ${sourceEndpoint} ERROR] Stack: ${err.stack}`);
    }
    return res.status(500).json({
      error: {
        code: 'SYNC_FAILED',
        message: 'Could not synchronize Google account with SkillBridge. Please try again.',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      },
    });
  }
}

/**
 * POST /api/auth/sync
 * Verifies Firebase ID token and returns / links / provisions the user session in PostgreSQL.
 */
router.post('/sync', (req: Request, res: Response) => handleFirebaseTokenAuth(req, res, 'sync'));

/**
 * POST /api/auth/google/firebase
 * Dedicated Google Firebase authentication endpoint for SkillBridge.
 */
router.post('/google/firebase', (req: Request, res: Response) => handleFirebaseTokenAuth(req, res, 'google/firebase'));

/**
 * POST /api/auth/firebase-login-fallback
 * Rate-limited endpoint for existing PostgreSQL users whose accounts are not yet provisioned in Firebase Auth.
 * If credentials match in PostgreSQL, generates a custom Firebase token so the client can establish a persistent session.
 */
router.post('/firebase-login-fallback', loginLimiter, async (req: Request, res: Response) => {
  const { identifier, password } = req.body || {};
  const rawKey = (identifier || '').trim();

  if (!rawKey || !password) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Email/phone and password are required.' },
    });
  }

  const loginEmail = rawKey.toLowerCase();
  const digitsOnly = rawKey.replace(/\D/g, '');
  const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  const phoneConditions: any[] = [{ phone: rawKey }];
  if (digitsOnly && digitsOnly !== rawKey) {
    phoneConditions.push({ phone: digitsOnly });
    phoneConditions.push({ phone: `+${digitsOnly}` });
  }
  if (last10Digits.length === 10) {
    phoneConditions.push({ phone: last10Digits });
    phoneConditions.push({ phone: `+91${last10Digits}` });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginEmail },
        ...phoneConditions,
      ],
    },
  });

  if (!user) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please check your login details.' },
    });
  }

  // Explicitly reject OAuth-only accounts with null passwordHash
  if (!user.passwordHash) {
    return res.status(400).json({
      error: {
        code: 'OAUTH_ACCOUNT',
        message: 'This account was registered via social sign-in (Google/GitHub/Microsoft). Please sign in using your social provider.',
      },
    });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please check your password.' },
    });
  }

  try {
    // Generate custom token for this user so Firebase Client SDK can sign in and establish a persistent session.
    // Explicitly use user.firebaseUid if known; otherwise use SkillBridge user.id as the fallback identifier.
    const fallbackUid = user.firebaseUid || user.id;
    // Pass email, role, and explicit SkillBridge fallback markers as developer claims
    const customToken = await adminAuth.createCustomToken(fallbackUid, {
      email: user.email,
      role: user.role,
      isSkillBridgeFallback: true,
      skillbridgeUserId: user.id,
    });
    await recordDailyActivity(user.id);
    const session = await buildUserSession(user.id);

    // Issue SkillBridge access and refresh tokens using authoritative database role
    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      customToken,
      accessToken,
      user: session,
      message: 'Authentication verified. Establishing Firebase persistent session.',
    });
  } catch (err: any) {
    console.error('Firebase custom token error:', err);
    return res.status(500).json({
      error: { code: 'TOKEN_CREATION_FAILED', message: 'Could not generate session token.' },
    });
  }
});

/**
 * POST /api/auth/register
 * Real user registration - new students start with a completely blank profile
 */
router.post('/register', async (req: Request, res: Response) => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid input data',
        details: parseResult.error.errors,
      },
    });
  }

  const data = parseResult.data;

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existingEmail) {
    return res.status(409).json({
      error: { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists.' },
    });
  }

  // Check if phone already exists (if provided)
  if (data.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone.trim() },
    });
    if (existingPhone) {
      return res.status(409).json({
        error: { code: 'PHONE_EXISTS', message: 'An account with this phone number already exists.' },
      });
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    let user;

    if (data.role === 'STUDENT') {
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim() || null,
          passwordHash,
          name: data.name.trim(),
          role: 'STUDENT',
          avatarUrl: null, // New users start with blank / initials avatar
          currentStreak: 1,
          longestStreak: 1,
          studentProfile: {
            create: {
              institution: data.institution.trim(),
              targetDomain: data.targetDomain.trim(),
              cgpa: data.cgpa || null,
              bio: data.bio?.trim() || null,
              experiencesJson: null,
              educationsJson: null,
              projectsJson: null,
              certificatesJson: null,
              responsibilitiesJson: null,
              achievementsJson: null,
              socialsJson: null,
              customSkillsJson: null,
            },
          },
        },
        include: { studentProfile: true },
      });
      // CRITICAL: Blank profile - No fake baseline skill scores injected!
    } else if (data.role === 'INDUSTRY') {
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim() || null,
          passwordHash,
          name: data.companyName.trim(),
          role: 'INDUSTRY',
          avatarUrl: null,
          currentStreak: 1,
          longestStreak: 1,
          industryProfile: {
            create: {
              companyName: data.companyName.trim(),
              companySize: data.companySize || '50-200 employees',
              industrySector: data.industrySector.trim(),
              website: data.website || '',
              verified: true,
            },
          },
        },
        include: { industryProfile: true },
      });
    } else if (data.role === 'ACADEMICIAN') {
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim() || null,
          passwordHash,
          name: data.name.trim(),
          role: 'ACADEMICIAN',
          avatarUrl: null,
          currentStreak: 1,
          longestStreak: 1,
          academicianProfile: {
            create: {
              institution: data.institution.trim(),
              department: data.department.trim(),
              designation: data.designation.trim(),
            },
          },
        },
        include: { academicianProfile: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim() || null,
          passwordHash,
          name: data.institutionName.trim(),
          role: 'INSTITUTION_ADMIN',
          avatarUrl: null,
          currentStreak: 1,
          longestStreak: 1,
          institutionProfile: {
            create: {
              institutionName: data.institutionName.trim(),
              adminDesignation: data.adminDesignation.trim(),
            },
          },
        },
        include: { institutionProfile: true },
      });
    }

    // Record initial daily activity streak
    await recordDailyActivity(user.id);

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const session = await buildUserSession(user.id);
    return res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: session,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Could not complete registration.' },
    });
  }
});

/**
 * POST /api/auth/provision-student
 *
 * Institution Admin–only endpoint: creates a new Student account in Firebase Auth
 * (server-side via Admin SDK, so the calling browser session is NEVER replaced)
 * and provisions the matching PostgreSQL record.
 *
 * Returns the newly created user's public profile. It deliberately does NOT issue
 * an accessToken or refreshToken for the new account, so the admin's session is
 * completely unaffected.
 */
router.post('/provision-student', authenticate, requireRole(['INSTITUTION_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { email, password, name, institution, targetDomain, phone, cgpa, bio } = req.body || {};

  if (!email || !password || !name || !institution) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'email, password, name, and institution are required to provision a student account.',
      },
    });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanPassword = String(password);

  if (cleanPassword.length < 6) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters.' },
    });
  }

  // 1. Guard: email must not already exist in PostgreSQL
  const existing = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: 'insensitive' } },
  });
  if (existing) {
    return res.status(409).json({
      error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
    });
  }

  try {
    // 2. Create Firebase Auth user via Admin SDK — does NOT affect any browser session
    let firebaseUid: string | null = null;
    try {
      const fbUser = await adminAuth.createUser({
        email: cleanEmail,
        password: cleanPassword,
        displayName: String(name).trim(),
      });
      firebaseUid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/email-already-exists') {
        // Firebase already has this email — look up the UID and proceed to DB provisioning
        const existing = await adminAuth.getUserByEmail(cleanEmail);
        firebaseUid = existing.uid;
      } else {
        throw fbErr;
      }
    }

    // 3. Hash the password for PostgreSQL (legacy/fallback login support)
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    // 4. Provision Student record in PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        firebaseUid: firebaseUid ?? undefined,
        passwordHash,
        name: String(name).trim(),
        role: 'STUDENT',
        phone: phone?.trim() || null,
        avatarUrl: null,
        currentStreak: 1,
        longestStreak: 1,
        studentProfile: {
          create: {
            institution: String(institution).trim(),
            targetDomain: targetDomain?.trim() || 'Full-Stack Web',
            cgpa: cgpa ? Number(cgpa) : null,
            bio: bio?.trim() || null,
          },
        },
      },
      include: { studentProfile: true },
    });

    await recordDailyActivity(newUser.id);

    const session = await buildUserSession(newUser.id);

    // 5. Return the provisioned student profile ONLY — no accessToken, no refreshToken,
    //    no cookie — the calling admin's session is completely untouched.
    return res.status(201).json({
      message: 'Student account provisioned successfully.',
      student: session,
    });
  } catch (err: any) {
    console.error('[AUTH provision-student] Error:', err);
    return res.status(500).json({
      error: {
        code: 'PROVISION_FAILED',
        message: err.message || 'Failed to provision student account.',
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Real login with email or phone + password
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message || 'Invalid credentials' },
      });
    }

    const { email, phone, identifier, password } = parseResult.data;
    const rawKey = (identifier || email || phone || '').trim();

    if (!rawKey || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Please enter your email or phone number and password.' },
      });
    }

    const loginEmail = rawKey.toLowerCase();
    const digitsOnly = rawKey.replace(/\D/g, '');
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // Resilient phone matching across raw, stripped digits, international prefix variants
    const phoneConditions: any[] = [{ phone: rawKey }];
    if (digitsOnly && digitsOnly !== rawKey) {
      phoneConditions.push({ phone: digitsOnly });
      phoneConditions.push({ phone: `+${digitsOnly}` });
    }
    if (last10Digits.length === 10) {
      phoneConditions.push({ phone: last10Digits });
      phoneConditions.push({ phone: `+91${last10Digits}` });
      phoneConditions.push({ phone: `+91 ${last10Digits.slice(0, 5)} ${last10Digits.slice(5)}` });
      phoneConditions.push({ phone: `+91 ${last10Digits}` });
    }

    // Look up user by email OR any formatted phone variation
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginEmail },
          ...phoneConditions,
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please check your login details.' },
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error: {
          code: 'OAUTH_ACCOUNT',
          message: 'This account was created with social login. Please sign in using your social provider.',
        },
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please check your password.' },
      });
    }

    // Record daily activity streak
    await recordDailyActivity(user.id);

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const session = await buildUserSession(user.id);
    return res.json({
      message: 'Login successful',
      accessToken,
      user: session,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected server error occurred during login.' },
    });
  }
});

/**
 * GET /api/auth/oauth/:provider/url
 * Returns authorization URL for Google, GitHub, or Microsoft 365
 */
router.get('/oauth/:provider/url', (req: Request, res: Response) => {
  const { provider } = req.params;
  const clientBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
  const effectiveRedirectUri = (req.query.redirectUri as string)?.trim() || `${clientBaseUrl}/auth/callback`;
  const state = (req.query.state as string) || '';

  if (!['google', 'github', 'microsoft'].includes(provider)) {
    return res.status(400).json({
      error: {
        code: 'UNSUPPORTED_PROVIDER',
        message: 'Supported OAuth providers: google, github, microsoft',
      },
    });
  }

  if (!isOauthConfigured(provider as OAuthProvider)) {
    console.warn(`[AUTH OAUTH URL] Provider '${provider}' is not configured on the server.`);
    return res.status(400).json({
      error: {
        code: 'OAUTH_NOT_CONFIGURED',
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured on the server. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in the Render Environment Variables.`,
      },
    });
  }

  try {
    console.log(`[AUTH OAUTH URL] Generating auth URL for ${provider} with redirectUri: ${effectiveRedirectUri}`);
    const result = getAuthorizationUrl(provider as OAuthProvider, effectiveRedirectUri, state);
    return res.json(result);
  } catch (err: any) {
    console.error(`[OAUTH URL ERROR] ${provider}:`, err);
    return res.status(400).json({
      error: {
        code: 'OAUTH_CONFIG_ERROR',
        message: 'OAuth service is temporarily unavailable. Please try again later.',
      },
    });
  }
});

/**
 * POST /api/auth/oauth/:provider/callback
 * Real OAuth 2.0 authorization code exchange & cryptographic identity verification
 */
router.post('/oauth/:provider/callback', async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, redirectUri } = req.body;

  console.log(`[AUTH OAUTH CALLBACK] === Starting OAuth Callback Exchange for ${provider} ===`);

  if (!['google', 'github', 'microsoft'].includes(provider)) {
    return res.status(400).json({ error: { message: 'Supported providers: google, github, microsoft' } });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: { message: 'Authorization code is required.' } });
  }

  const clientBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
  const effectiveRedirectUri = (redirectUri && typeof redirectUri === 'string' && redirectUri.trim())
    ? redirectUri.trim()
    : `${clientBaseUrl}/auth/callback`;

  console.log(`[AUTH OAUTH CALLBACK] Step 1: Effective Redirect URI: ${effectiveRedirectUri}`);

  try {
    console.log(`[AUTH OAUTH CALLBACK] Step 2: Exchanging authorization code with ${provider}...`);
    const verifiedOAuthUser = await exchangeCodeForVerifiedUser(
      provider as OAuthProvider,
      code,
      effectiveRedirectUri
    );

    const cleanEmail = verifiedOAuthUser.email.toLowerCase().trim();
    console.log(`[AUTH OAUTH CALLBACK] Step 2 Success: Provider=${verifiedOAuthUser.provider} | ProviderID=${verifiedOAuthUser.providerId} | Email=${cleanEmail} | Name=${verifiedOAuthUser.name}`);

    // 1. Check if user exists with this verified email (case-insensitive)
    console.log(`[AUTH OAUTH CALLBACK] Step 3: Checking if user account exists with email: ${cleanEmail}...`);
    let user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' as const },
      },
    });

    if (user) {
      console.log(`[AUTH OAUTH CALLBACK] Step 3: Existing user found (ID: ${user.id}, Role: ${user.role}). Linking ${provider.toUpperCase()} integration...`);

      // Connect/update integration record
      await prisma.externalIntegration.upsert({
        where: {
          userId_platform: {
            userId: user.id,
            platform: provider.toUpperCase(),
          },
        },
        update: {
          profileDataJson: JSON.stringify({
            provider,
            providerId: verifiedOAuthUser.providerId,
            verifiedEmail: cleanEmail,
            lastAuthAt: new Date().toISOString(),
          }),
          connectedAt: new Date(),
        },
        create: {
          userId: user.id,
          platform: provider.toUpperCase(),
          profileDataJson: JSON.stringify({
            provider,
            providerId: verifiedOAuthUser.providerId,
            verifiedEmail: cleanEmail,
            lastAuthAt: new Date().toISOString(),
          }),
        },
      });

      // Update avatarUrl if empty
      if (!user.avatarUrl && verifiedOAuthUser.avatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: verifiedOAuthUser.avatarUrl },
        });
      }

      try {
        await recordDailyActivity(user.id);
      } catch (activityErr: any) {
        console.warn(`[AUTH OAUTH CALLBACK] Non-critical: Failed to record activity for user ${user.id}:`, activityErr.message);
      }

      const tokenPayload = { userId: user.id, role: user.role, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const session = await buildUserSession(user.id);
      console.log(`[AUTH OAUTH CALLBACK] === Successfully Logged In Existing User ${user.id} via ${provider} ===`);
      return res.json({
        isNewUser: false,
        message: `Signed in successfully via ${provider}`,
        accessToken,
        user: session,
      });
    }

    // 2. User is new -> Generate signed onboarding token so they can select role & onboarding info
    console.log(`[AUTH OAUTH CALLBACK] Step 4: User is new. Generating signed onboarding token...`);
    const onboardingToken = createOAuthOnboardingToken(verifiedOAuthUser);

    console.log(`[AUTH OAUTH CALLBACK] === Successfully Initiated Onboarding for New User (${cleanEmail}) ===`);
    return res.json({
      isNewUser: true,
      onboardingToken,
      profile: {
        email: verifiedOAuthUser.email,
        name: verifiedOAuthUser.name,
        avatarUrl: verifiedOAuthUser.avatarUrl,
        provider: verifiedOAuthUser.provider,
      },
    });
  } catch (err: any) {
    console.error(`[AUTH OAUTH CALLBACK ERROR] ${provider} exchange failed:`);
    console.error(`[AUTH OAUTH CALLBACK ERROR] Message: ${err.message}`);
    if (err.stack) {
      console.error(`[AUTH OAUTH CALLBACK ERROR] Stack: ${err.stack}`);
    }
    return res.status(400).json({
      error: {
        code: 'OAUTH_VERIFICATION_FAILED',
        message: 'OAuth identity verification failed. Please try signing in again.',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      },
    });
  }
});

/**
 * POST /api/auth/oauth/register
 * Completes new user onboarding with signed OAuth identity token and selected role
 */
router.post('/oauth/register', async (req: Request, res: Response) => {
  const { onboardingToken, role, roleData } = req.body;

  if (!onboardingToken || typeof onboardingToken !== 'string') {
    return res.status(400).json({ error: { message: 'Valid OAuth onboarding token is required.' } });
  }

  if (!role || !['STUDENT', 'INDUSTRY', 'INSTITUTION_ADMIN'].includes(role)) {
    return res.status(400).json({ error: { message: 'Valid role is required.' } });
  }

  let verifiedUser;
  try {
    verifiedUser = verifyOAuthOnboardingToken(onboardingToken);
  } catch (err: any) {
    console.error('OAuth token verification error:', err);
    return res.status(401).json({ error: { message: 'Invalid or expired onboarding session. Please sign in again.' } });
  }

  const cleanEmail = verifiedUser.email.toLowerCase().trim();

  // Ensure user doesn't already exist
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return res.status(409).json({ error: { message: 'An account with this verified email already exists.' } });
  }

  const randomPassword = crypto.randomBytes(24).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  const displayName = verifiedUser.name.trim();

  let user: any;
  if (role === 'STUDENT') {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: displayName,
        role: 'STUDENT',
        avatarUrl: verifiedUser.avatarUrl || null,
        currentStreak: 1,
        longestStreak: 1,
        studentProfile: {
          create: {
            institution: roleData?.institution?.trim() || 'Unspecified University',
            targetDomain: roleData?.targetDomain || 'Full-Stack Web',
            cgpa: null,
            bio: null,
          },
        },
      },
      include: { studentProfile: true },
    });
  } else if (role === 'INDUSTRY') {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: roleData?.companyName || displayName,
        role: 'INDUSTRY',
        avatarUrl: verifiedUser.avatarUrl || null,
        currentStreak: 1,
        longestStreak: 1,
        industryProfile: {
          create: {
            companyName: roleData?.companyName || displayName,
            industrySector: roleData?.industrySector || 'Technology & Platforms',
            companySize: roleData?.companySize || '50-250 employees',
            verified: true,
          },
        },
      },
      include: { industryProfile: true },
    });
  } else if (role === 'INSTITUTION_ADMIN') {
    const instName = roleData?.institutionName?.trim() || 'University Administration';
    const adminDesig = roleData?.adminDesignation?.trim() || 'Dean';
    const personName = (roleData?.name || displayName || instName).trim();
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: personName,
        role: 'INSTITUTION_ADMIN',
        avatarUrl: verifiedUser.avatarUrl || null,
        currentStreak: 1,
        longestStreak: 1,
        institutionProfile: {
          create: {
            institutionName: instName,
            adminDesignation: adminDesig,
          },
        },
      },
      include: { institutionProfile: true },
    });
  }

  // Record integration
  await prisma.externalIntegration.create({
    data: {
      userId: user.id,
      platform: verifiedUser.provider.toUpperCase(),
      profileDataJson: JSON.stringify({
        provider: verifiedUser.provider,
        providerId: verifiedUser.providerId,
        verifiedEmail: cleanEmail,
        initialAuthAt: new Date().toISOString(),
      }),
    },
  });

  await recordDailyActivity(user.id);

  const tokenPayload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const session = await buildUserSession(user.id);
  return res.status(201).json({
    message: `Account created and verified with ${verifiedUser.provider}`,
    accessToken,
    user: session,
  });
});

/**
 * POST /api/auth/forgot-password
 * Handles email reset links or 6-digit SMS OTPs with rate limiting
 */
router.post('/forgot-password', resetRateLimiter, async (req: Request, res: Response) => {
  const parseResult = ForgotPasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email or phone number.' },
    });
  }

  const { email, phone, identifier } = parseResult.data;
  const input = (identifier || email || phone || '').trim();

  if (!input) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Please provide your registered email or phone number.' },
    });
  }

  const isEmail = input.includes('@');

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: input.toLowerCase() }
      : { phone: input },
  });

  if (!user) {
    // Return generic success to avoid enumeration
    return res.json({
      message: isEmail
        ? 'If that email address is registered, a password reset link has been dispatched.'
        : 'If that phone number is registered, a 6-digit OTP has been sent via SMS.',
      mode: isEmail ? 'email' : 'phone',
    });
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  if (isEmail) {
    const token = crypto.randomBytes(32).toString('hex');

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL',
        expiresAt,
      },
    });

    const origin = req.headers.origin || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}`;

    const notifyRes = await sendPasswordResetEmail({ to: user.email, resetUrl, token });

    return res.json({
      message: notifyRes.mode === 'provider'
        ? 'A secure password reset link valid for 15 minutes has been sent to your email.'
        : 'Password reset link generated (dev console fallback mode).',
      mode: notifyRes.mode,
      channel: 'email',
      resetUrl,
      token, // Provided in development response for rapid testing
    });
  } else {
    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(16).toString('hex');

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        phone: user.phone,
        otpCode,
        type: 'PHONE_OTP',
        expiresAt,
      },
    });

    const notifyRes = await sendSmsOtp({ phone: user.phone!, otpCode });

    return res.json({
      message: notifyRes.mode === 'provider'
        ? 'A 6-digit OTP valid for 15 minutes has been dispatched to your mobile number.'
        : '6-digit OTP generated (dev console fallback mode).',
      mode: notifyRes.mode,
      channel: 'phone',
      phone: user.phone,
      otp: otpCode, // Provided in development response for rapid testing
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Resets password via verified token or SMS OTP
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const parseResult = ResetPasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message || 'Invalid data.' },
    });
  }

  const { token, otp, identifier, phone, email, password } = parseResult.data;

  let resetTokenRecord = null;

  if (token) {
    resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  } else if (otp) {
    const searchTarget = (identifier || phone || email || '').trim();
    resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        otpCode: otp.trim(),
        usedAt: null,
        expiresAt: { gt: new Date() },
        OR: [
          { phone: searchTarget },
          { user: { email: searchTarget.toLowerCase() } },
        ],
      },
      include: { user: true },
    });
  }

  if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < new Date()) {
    return res.status(400).json({
      error: { code: 'INVALID_RESET_TOKEN', message: 'Reset token or OTP is invalid or has expired.' },
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Update password and invalidate all tokens for user
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetTokenRecord.userId,
        id: { not: resetTokenRecord.id },
      },
    }),
  ]);

  return res.json({ message: 'Password has been successfully updated. Please log in with your new password.' });
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token provided.' } });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired.' } });
  }

  const tokenPayload = { userId: payload.userId, role: payload.role, email: payload.email };
  const accessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const session = await buildUserSession(payload.userId);
  return res.json({
    accessToken,
    user: session,
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  await recordDailyActivity(req.user!.id);
  const session = await buildUserSession(req.user!.id);
  if (!session) {
    return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
  }
  return res.json({ user: session });
});

export default router;
