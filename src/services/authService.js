import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initialized = false;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Set persistence to local storage
      await setPersistence(auth, browserLocalPersistence);
      
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.notifyListeners(user);
        
        if (user) {
          // Store user data in localStorage for quick access
          localStorage.setItem('vibesplit_user', JSON.stringify({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString()
          }));
          
          // Track user activity
          this.trackUserActivity('login');
        } else {
          localStorage.removeItem('vibesplit_user');
        }
        
        this.initialized = true;
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.initialized = true;
    }
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.trackUserActivity('google_signin');
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      localStorage.removeItem('vibesplit_user');
      this.trackUserActivity('logout');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getStoredUser() {
    try {
      const stored = localStorage.getItem('vibesplit_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  onAuthStateChange(callback) {
    this.authListeners.push(callback);
    
    // If already initialized, call immediately
    if (this.initialized) {
      callback(this.currentUser);
    }
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(user) {
    this.authListeners.forEach(callback => callback(user));
  }

  handleAuthError(error) {
    const errorMessages = {
      'auth/popup-blocked': 'Please allow popups for this website to sign in with Google',
      'auth/popup-closed-by-user': 'Sign-in was cancelled',
      'auth/cancelled-popup-request': 'Another sign-in is already in progress',
      'auth/third-party-cookies-blocked': 'Please enable third-party cookies or try in regular browsing mode',
      'auth/network-request-failed': 'Network error. Please check your connection and try again',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/user-disabled': 'This account has been disabled',
      'auth/operation-not-allowed': 'Google sign-in is not enabled for this app'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || 'Sign in failed. Please try again.',
      originalError: error
    };
  }

  trackUserActivity(action) {
    try {
      const activity = {
        action,
        timestamp: new Date().toISOString(),
        user: this.currentUser ? {
          uid: this.currentUser.uid,
          email: this.currentUser.email
        } : null,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Store in localStorage for visitor tracking
      const activities = JSON.parse(localStorage.getItem('vibesplit_activities') || '[]');
      activities.push(activity);
      
      // Keep only last 100 activities to prevent storage overflow
      if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
      }
      
      localStorage.setItem('vibesplit_activities', JSON.stringify(activities));
    } catch (error) {
      console.warn('Failed to track user activity:', error);
    }
  }

  getUserActivities() {
    try {
      return JSON.parse(localStorage.getItem('vibesplit_activities') || '[]');
    } catch {
      return [];
    }
  }

  clearUserData() {
    localStorage.removeItem('vibesplit_user');
    localStorage.removeItem('vibesplit_activities');
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
