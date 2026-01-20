import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase config is valid
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.authDomain &&
    firebaseConfig.authDomain !== 'undefined' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'undefined'
  );
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

// Lazy initialization - only initialize if config is valid
const initializeFirebase = () => {
  if (!isFirebaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Firebase not configured. Marketplace authentication will be disabled.');
      console.warn('To enable Firebase, set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID');
    }
    return null;
  }

  try {
    if (!appInstance) {
      appInstance = initializeApp(firebaseConfig);
      authInstance = getAuth(appInstance);
      if (import.meta.env.DEV) {
        console.log('✅ Firebase initialized successfully');
      }
    }
    return appInstance;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return null;
  }
};

// Initialize on module load if configured
if (isFirebaseConfigured()) {
  initializeFirebase();
}

// Export getters that initialize lazily
export const getFirebaseApp = (): FirebaseApp | null => {
  if (!appInstance && isFirebaseConfigured()) {
    initializeFirebase();
  }
  return appInstance;
};

export const getFirebaseAuth = (): Auth | null => {
  if (!authInstance && isFirebaseConfigured()) {
    initializeFirebase();
  }
  return authInstance;
};

// For backward compatibility - export getter as 'auth'
export const auth = getFirebaseAuth();
export default getFirebaseApp();