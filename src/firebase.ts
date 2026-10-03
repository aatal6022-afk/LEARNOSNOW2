import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
  type DocumentSnapshot,
  type QuerySnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut, 
  signInAnonymously, 
  onAuthStateChanged as fbOnAuthStateChanged,
  type User,
  type Auth,
  type Unsubscribe
} from 'firebase/auth';

// Firebase configuration with environment variable override support and built-in defaults
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCK55jOpuxDGMxLEe4WP9dtiKt9AcqEbL4';
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0122170639.firebaseapp.com';
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0122170639';
const rawAppId = import.meta.env.VITE_FIREBASE_APP_ID || '1:97021874420:web:0a6e00cf3b5edf3a670ea1';
// Only use databaseId if explicitly set in env and not '(default)'
const rawDatabaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID && import.meta.env.VITE_FIREBASE_DATABASE_ID.trim() !== '' && import.meta.env.VITE_FIREBASE_DATABASE_ID.trim() !== '(default)')
  ? import.meta.env.VITE_FIREBASE_DATABASE_ID.trim()
  : '';
const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0122170639.firebasestorage.app';
const rawMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '97021874420';

export const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  appId: rawAppId,
  firestoreDatabaseId: rawDatabaseId || undefined,
  storageBucket: rawStorageBucket,
  messagingSenderId: rawMessagingSenderId,
};

// Initialize Firebase App
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.length > 10
);

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);

// Resilient Firestore initialization
let dbInstance: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    dbInstance = getFirestore(app);
  }
} catch (e) {
  console.warn('[Firebase] Connecting with default Firestore instance fallback:', e);
  dbInstance = getFirestore(app);
}
export const db: Firestore = dbInstance;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auto-authenticate anonymously if no active user exists, ensuring Firestore rules always pass
export async function ensureAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    console.log('[Firebase Auth] Anonymous session initialized for Firestore sync:', cred.user.uid);
    return cred.user;
  } catch (err) {
    console.warn('[Firebase Auth] Background session notice (offline or rule fallback):', err);
    return null;
  }
}

// Auto-run background session initialization
if (typeof window !== 'undefined') {
  ensureAuth().catch(() => {});
}

// Test connection to Firestore on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection verified successfully.');
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or restricted in iframe.');
    } else {
      console.log('[Firebase] Connection check status:', error?.message || error);
    }
  }
}
testConnection();

// Check for redirect result on load (for mobile/iframe signInWithRedirect)
if (typeof window !== 'undefined') {
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        console.log('[Firebase Auth] Redirect login success:', result.user.displayName);
        try {
          localStorage.setItem('learning_os_auth_user', JSON.stringify({
            uid: result.user.uid,
            displayName: result.user.displayName || 'Студент',
            email: result.user.email || '',
            photoURL: result.user.photoURL || undefined
          }));
        } catch {}
      }
    })
    .catch((err) => {
      console.warn('[Firebase Auth] Redirect result notice:', err?.message || err);
    });
}

// Auth helpers: Real Google Login
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      const userProfile = {
        uid: result.user.uid,
        displayName: result.user.displayName || 'Студент Google',
        email: result.user.email || '',
        photoURL: result.user.photoURL || undefined
      };
      try {
        localStorage.setItem('learning_os_auth_user', JSON.stringify(userProfile));
      } catch {}
      return result.user;
    }
    throw new Error('No user returned from Google sign-in');
  } catch (popupErr: any) {
    console.warn('[Firebase Auth] Popup login interrupted, checking redirect flow:', popupErr?.message || popupErr);
    if (
      popupErr?.code === 'auth/popup-blocked' ||
      popupErr?.code === 'auth/popup-closed-by-user' ||
      popupErr?.code === 'auth/cancelled-popup-request'
    ) {
      // If popup was blocked by browser or iframe constraints, try redirect
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error('[Firebase Auth] Redirect failed:', redirectErr);
      }
    }
    throw popupErr;
  }
}

export async function loginAsGuest(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    if (result.user) {
      const guestProfile = {
        uid: result.user.uid,
        displayName: 'Студент (Демо)',
        email: result.user.email || 'guest@learning-os.internal',
        photoURL: undefined
      };
      try {
        localStorage.setItem('learning_os_auth_user', JSON.stringify(guestProfile));
      } catch {}
      return result.user;
    }
    throw new Error('Anonymous login failed');
  } catch (err: any) {
    console.warn('[Firebase Auth] Anonymous sign-in error:', err?.message || err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('[Firebase Auth] Sign out error:', e);
  }
  try {
    localStorage.removeItem('learning_os_auth_user');
  } catch {}
}

export function onAuthStateChanged(
  authInstance: Auth, 
  nextOrObserver: (user: User | null) => void, 
  error?: (error: any) => void
): Unsubscribe {
  return fbOnAuthStateChanged(authInstance || auth, (user) => {
    if (user) {
      try {
        localStorage.setItem('learning_os_auth_user', JSON.stringify({
          uid: user.uid,
          displayName: user.displayName || 'Студент',
          email: user.email || '',
          photoURL: user.photoURL || undefined
        }));
      } catch {}
    }
    nextOrObserver(user);
  }, error);
}

// Safe wrapper for doc() to ensure no runtime errors if reference is invalid
export function safeDoc(database: Firestore, path: string, ...pathSegments: string[]) {
  if (!database || typeof (database as any).type !== 'string') {
    return doc(db, path, ...pathSegments);
  }
  return doc(database, path, ...pathSegments);
}

export { 
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  onSnapshot,
  getDocFromServer
};
export type { User };
