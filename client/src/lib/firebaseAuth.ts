import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

export class FirebaseAuth {
  private static getAuth() {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase is not configured. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID environment variables.');
    }
    return auth;
  }

  static async login(email: string, password: string) {
    try {
      const auth = this.getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Store token for API calls
      localStorage.setItem('firebase_token', token);
      
      return {
        user: userCredential.user,
        token
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async register(email: string, password: string) {
    try {
      const auth = this.getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Store token for API calls
      localStorage.setItem('firebase_token', token);
      
      return {
        user: userCredential.user,
        token
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signInWithGoogle() {
    try {
      const auth = this.getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      // Store token for API calls
      localStorage.setItem('firebase_token', token);
      
      return {
        user: result.user,
        token
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async logout() {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth);
      }
      localStorage.removeItem('firebase_token');
    } catch (error: any) {
      // Silently fail if Firebase isn't configured
      localStorage.removeItem('firebase_token');
    }
  }

  static getCurrentUser(): User | null {
    const auth = getFirebaseAuth();
    return auth?.currentUser || null;
  }

  static getToken(): string | null {
    return localStorage.getItem('firebase_token');
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    const auth = getFirebaseAuth();
    if (!auth) {
      // If Firebase isn't configured, call callback with null immediately
      callback(null);
      return () => {}; // Return no-op unsubscribe
    }
    return onAuthStateChanged(auth, callback);
  }

  static async refreshToken(): Promise<string | null> {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      localStorage.setItem('firebase_token', token);
      return token;
    }
    return null;
  }
}