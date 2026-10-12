import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

let adminApp: App | null = null;

/**
 * Parse FIREBASE_SERVICE_ACCOUNT_JSON which may be raw JSON or base64-encoded JSON.
 */
function loadServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const candidates = [raw];
  try {
    candidates.push(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    // not base64
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && parsed.project_id && parsed.private_key && parsed.client_email) {
        // Private keys pasted into .env often have escaped newlines.
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
        return parsed;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export const isFirebaseAdminConfigured = Boolean(loadServiceAccount());

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured on the server.");
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    projectId: serviceAccount.project_id,
  });
  return adminApp;
}

/**
 * Verify a Firebase ID token issued after a successful phone sign-in and return the
 * verified E.164 phone number (e.g. "+919812345678").
 */
export async function verifyFirebasePhoneToken(idToken: string): Promise<{ uid: string; phoneNumber: string }> {
  const auth = getAuth(getAdminApp());
  const decoded: DecodedIdToken = await auth.verifyIdToken(idToken, true);

  const phoneNumber = decoded.phone_number;
  if (!phoneNumber) {
    throw new Error("The Firebase token does not contain a verified phone number.");
  }
  if (decoded.firebase?.sign_in_provider !== "phone") {
    throw new Error("Only phone-number sign-in is accepted.");
  }

  return { uid: decoded.uid, phoneNumber };
}
