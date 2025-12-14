import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export class FirebaseAuth {
  static async login(email: string, password: string) {
    try {
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
      await signOut(auth);
      localStorage.removeItem('firebase_token');
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  static getToken(): string | null {
    return localStorage.getItem('firebase_token');
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  static async refreshToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      localStorage.setItem('firebase_token', token);
      return token;
    }
    return null;
  }
}