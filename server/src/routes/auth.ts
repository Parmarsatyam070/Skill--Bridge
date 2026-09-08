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
import { authenticate, AuthRequest } from '../middleware/auth.js';
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
async function buildUserSession(userId: string) {
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
async function handleFirebaseTokenAuth(req: Request, res: Response, sourceEndpoint: string) {
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
    const authProvider = decodedToken.firebase?.sign_in_provider || 'google.com';

    console.log(`[AUTH ${sourceEndpoint}] Step 1 Success: UID=${uid} | Email=${cleanEmail || 'none'} | Verified=${isEmailVerified} | Provider=${authProvider}`);

    if (!cleanEmail && !uid) {
      console.error(`[AUTH ${sourceEndpoint}] Token lacked both email and UID.`);
      return res.status(400).json({
        error: { code: 'INVALID_TOKEN', message: 'Token lacks email or UID identifier.' },
      });
    }

    console.log(`[AUTH ${sourceEndpoint}] Step 2: Searching PostgreSQL for existing user (by UID or email: ${cleanEmail})...`);

    // 1. Check for existing user by firebaseUid OR case-insensitive email
    let user: any = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: uid },
          ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: 'insensitive' as const } }] : []),
        ],
      },
      include: {
        studentProfile: true,
        industryProfile: true,
        academicianProfile: true,
        institutionProfile: true,
      },
    });

    if (user) {
      console.log(`[AUTH ${sourceEndpoint}] Step 2: Found existing user account in database (ID: ${user.id}, Role: ${user.role}, Existing UID: ${user.firebaseUid || 'null'}).`);

      // Gracefully link/update Firebase UID and avatar if needed
      if (user.firebaseUid !== uid || (!user.avatarUrl && decodedToken.picture)) {
        console.log(`[AUTH ${sourceEndpoint}] Step 3: Linking Firebase UID ${uid} to user account ${user.id}...`);

        // If another database record holds this firebaseUid, unlink it first to prevent unique constraint failure
        await prisma.user.updateMany({
          where: { firebaseUid: uid, id: { not: user.id } },
          data: { firebaseUid: null },
        });

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
        console.log(`[AUTH ${sourceEndpoint}] Step 3: Successfully linked account with Firebase UID.`);
      }

      // Ensure profile exists for the user's role
      if (user.role === 'STUDENT' && !user.studentProfile) {
        console.log(`[AUTH ${sourceEndpoint}] Auto-creating default student profile for existing user ${user.id}`);
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

      // Generate SkillBridge JWT tokens
      const tokenPayload = { userId: user.id, role: user.role, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log(`[AUTH ${sourceEndpoint}] === Authentication Successful for Existing User ${user.id} (${user.email}) ===`);
      return res.json({ user: session, accessToken, isNewUser: false });
    }

    // 2. New user provisioning in PostgreSQL
    const { role, name, roleData } = req.body || {};
    const ALLOWED_SIGNUP_ROLES = ['STUDENT', 'INDUSTRY', 'ACADEMICIAN'];
    const assignedRole = (role && ALLOWED_SIGNUP_ROLES.includes(role)) ? role : 'STUDENT';
    const displayName = (name || decodedToken.name || cleanEmail?.split('@')[0] || 'User').trim();
    const avatarUrl = decodedToken.picture || null;

    console.log(`[AUTH ${sourceEndpoint}] Step 4: Provisioning new user in database (Email: ${cleanEmail}, Role: ${assignedRole}, Name: ${displayName})...`);

    try {
      if (assignedRole === 'STUDENT') {
        user = await prisma.user.create({
          data: {
            email: cleanEmail || `${uid}@firebase.user`,
            firebaseUid: uid,
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
            firebaseUid: uid,
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
      } else if (assignedRole === 'ACADEMICIAN') {
        user = await prisma.user.create({
          data: {
            email: cleanEmail || `${uid}@firebase.user`,
            firebaseUid: uid,
            name: displayName,
            role: 'ACADEMICIAN',
            avatarUrl,
            currentStreak: 1,
            longestStreak: 1,
            academicianProfile: {
              create: {
                institution: roleData?.institution?.trim() || 'Academic Institute',
                department: roleData?.department?.trim() || 'Computer Science',
                designation: roleData?.designation?.trim() || 'Faculty Member',
              },
            },
          },
          include: { academicianProfile: true },
        });
      }
    } catch (createErr: any) {
      // Graceful fallback for P2002 (Unique constraint failed on email)
      if (createErr.code === 'P2002' && cleanEmail) {
        console.warn(`[AUTH ${sourceEndpoint}] Email collision (P2002) detected for ${cleanEmail}. Resolving via account linking...`);
        user = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: 'insensitive' } },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });

        if (user) {
          // Unlink conflicting record if any
          await prisma.user.updateMany({
            where: { firebaseUid: uid, id: { not: user.id } },
            data: { firebaseUid: null },
          });

          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              firebaseUid: uid,
              avatarUrl: user.avatarUrl || avatarUrl,
            },
            include: {
              studentProfile: true,
              industryProfile: true,
              academicianProfile: true,
              institutionProfile: true,
            },
          });
          console.log(`[AUTH ${sourceEndpoint}] Successfully linked conflicting email account ${user.id} to Firebase UID ${uid}.`);
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
    // Generate custom token for this user so Firebase Client SDK can sign in and establish a persistent session
    const customToken = await adminAuth.createCustomToken(user.firebaseUid || user.id);
    await recordDailyActivity(user.id);
    const session = await buildUserSession(user.id);

    return res.json({
      customToken,
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

  if (!role || !['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION_ADMIN'].includes(role)) {
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

  let user;
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
  } else if (role === 'ACADEMICIAN') {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: displayName,
        role: 'ACADEMICIAN',
        avatarUrl: verifiedUser.avatarUrl || null,
        currentStreak: 1,
        longestStreak: 1,
        academicianProfile: {
          create: {
            institution: roleData?.institution || 'Academic Institute',
            department: roleData?.department || 'Computer Science',
            designation: roleData?.designation || 'Faculty Member',
          },
        },
      },
      include: { academicianProfile: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: roleData?.institutionName || displayName,
        role: 'INSTITUTION_ADMIN',
        avatarUrl: verifiedUser.avatarUrl || null,
        currentStreak: 1,
        longestStreak: 1,
        institutionProfile: {
          create: {
            institutionName: roleData?.institutionName || 'University Administration',
            adminDesignation: roleData?.adminDesignation || 'Dean',
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
