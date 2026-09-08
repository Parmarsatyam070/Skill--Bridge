import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let firebaseAdminApp: App | null = null;

function initializeFirebaseAdmin(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let serviceAccount: ServiceAccount | null = null;

  if (rawKey) {
    const trimmed = rawKey.trim();
    if (trimmed.startsWith('{')) {
      try {
        serviceAccount = JSON.parse(trimmed);
      } catch (err: any) {
        console.error('❌ [Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string:', err.message);
      }
    } else {
      // Treat as file path
      const resolvedPath = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
      if (fs.existsSync(resolvedPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        } catch (err: any) {
          console.error(`❌ [Firebase Admin] Failed to read service account file from ${resolvedPath}:`, err.message);
        }
      } else {
        console.warn(`⚠️ [Firebase Admin] Service account file not found at path: ${resolvedPath}`);
      }
    }
  }

  // Check fallback local development credential file if serviceAccount wasn't already loaded
  if (!serviceAccount) {
    const candidatePaths = [
      path.resolve(process.cwd(), 'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json'),
      path.resolve(process.cwd(), '..', 'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json'),
      path.resolve(__dirname, '..', '..', '..', 'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json'),
      path.resolve(__dirname, '..', '..', 'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json'),
    ];

    for (const candPath of candidatePaths) {
      if (fs.existsSync(candPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(candPath, 'utf8'));
          console.log(`ℹ️ [Firebase Admin] Loaded credentials from service account file at: ${candPath}`);
          break;
        } catch (err: any) {
          console.error(`❌ [Firebase Admin] Failed to load service account file from ${candPath}:`, err.message);
        }
      }
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || (serviceAccount as any)?.project_id || 'sihi-5694c';

  if (serviceAccount) {
    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    console.log(`✅ [Firebase Admin] Initialized successfully for project: ${projectId}`);
  } else {
    console.warn('⚠️ [Firebase Admin] No service account key provided. Initializing with default project credentials (or test fallback).');
    firebaseAdminApp = initializeApp({
      projectId,
    });
  }

  return firebaseAdminApp;
}

export const firebaseAdmin = initializeFirebaseAdmin();
export const adminAuth: Auth = getAuth(firebaseAdmin);
export default firebaseAdmin;
