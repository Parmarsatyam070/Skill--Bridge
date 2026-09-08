import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let firebaseAdminApp: App | null = null;

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function initializeFirebaseAdmin(): App {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  let serviceAccount: ServiceAccount | null = null;

  /*
   * ---------------------------------------------------------
   * 1. Preferred Render / production configuration
   * ---------------------------------------------------------
   */
  const projectIdEnv = process.env.FIREBASE_PROJECT_ID;
  const clientEmailEnv = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

  if (projectIdEnv && clientEmailEnv && privateKeyEnv) {
    serviceAccount = {
      projectId: projectIdEnv,
      clientEmail: clientEmailEnv,
      privateKey: privateKeyEnv.replace(/\\n/g, '\n'),
    };

    console.log(
      `✅ [Firebase Admin] Using environment credentials for project: ${projectIdEnv}`
    );
  }

  /*
   * ---------------------------------------------------------
   * 2. Existing FIREBASE_SERVICE_ACCOUNT_KEY support
   * ---------------------------------------------------------
   */
  if (!serviceAccount) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (rawKey) {
      const trimmed = rawKey.trim();

      if (trimmed.startsWith('{')) {
        try {
          serviceAccount = JSON.parse(trimmed);

          console.log(
            `✅ [Firebase Admin] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_KEY`
          );
        } catch (err: any) {
          console.error(
            '❌ [Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:',
            err.message
          );
        }
      } else {
        // Treat FIREBASE_SERVICE_ACCOUNT_KEY as a file path
        const resolvedPath = path.isAbsolute(trimmed)
          ? trimmed
          : path.resolve(process.cwd(), trimmed);

        if (fs.existsSync(resolvedPath)) {
          try {
            serviceAccount = JSON.parse(
              fs.readFileSync(resolvedPath, 'utf8')
            );

            console.log(
              `✅ [Firebase Admin] Loaded credentials from service account file: ${resolvedPath}`
            );
          } catch (err: any) {
            console.error(
              `❌ [Firebase Admin] Failed to read service account file from ${resolvedPath}:`,
              err.message
            );
          }
        } else {
          console.warn(
            `⚠️ [Firebase Admin] Service account file not found at path: ${resolvedPath}`
          );
        }
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * 3. Local development JSON fallback
   * ---------------------------------------------------------
   *
   * This is only used when environment credentials are not
   * available. The paths are now ESM-safe.
   */
  if (!serviceAccount) {
    const serviceAccountFile =
      'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json';

    const candidatePaths = [
      path.resolve(process.cwd(), serviceAccountFile),
      path.resolve(process.cwd(), '..', serviceAccountFile),
      path.resolve(__dirname, '..', '..', '..', serviceAccountFile),
      path.resolve(__dirname, '..', '..', serviceAccountFile),
    ];

    for (const candidatePath of candidatePaths) {
      if (fs.existsSync(candidatePath)) {
        try {
          serviceAccount = JSON.parse(
            fs.readFileSync(candidatePath, 'utf8')
          );

          console.log(
            `ℹ️ [Firebase Admin] Loaded local service account file`
          );

          break;
        } catch (err: any) {
          console.error(
            '❌ [Firebase Admin] Failed to load local service account file:',
            err.message
          );
        }
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * 4. Determine project ID
   * ---------------------------------------------------------
   */
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    (serviceAccount as any)?.project_id ||
    'sihi-5694c';

  /*
   * ---------------------------------------------------------
   * 5. Initialize Firebase Admin
   * ---------------------------------------------------------
   */
  if (serviceAccount) {
    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });

    console.log(
      `✅ [Firebase Admin] Initialized successfully for project: ${projectId}`
    );
  } else {
    console.warn(
      '⚠️ [Firebase Admin] No service account credentials found. ' +
      'Attempting initialization with default credentials.'
    );

    firebaseAdminApp = initializeApp({
      projectId,
    });
  }

  return firebaseAdminApp;
}

export const firebaseAdmin = initializeFirebaseAdmin();

export const adminAuth: Auth = getAuth(firebaseAdmin);

export default firebaseAdmin;