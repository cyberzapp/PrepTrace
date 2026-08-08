import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { apiService, initApiConfig } from '../services/api';

// Initialize Google SDK
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1088715891781-samplewebclientid.apps.googleusercontent.com',
  offlineAccess: false,
});

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  promptGoogleSignIn: () => void;
  signInWithDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
  clearError: () => void;
}

const AUTH_STORAGE_KEY = '@preptrace_auth_user_v1';
const TOKEN_STORAGE_KEY = '@preptrace_auth_token_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // No need for useIdTokenAuthRequest with GoogleSignin

  // Initialize API Base URL & Saved Authentication State
  useEffect(() => {
    loadSavedAuthState();
  }, []);

  const loadSavedAuthState = async () => {
    try {
      setIsLoading(true);
      await initApiConfig();

      const [savedUserStr, savedToken] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      ]);

      if (savedUserStr && savedToken) {
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);
        setToken(savedToken);
      }
    } catch (err) {
      console.error('Failed to load saved authentication state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove expo-auth-session effect

  const handleBackendAuthentication = async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Authenticate token with Express server
      const { user: serverUser } = await apiService.authenticateGoogleToken(idToken);
      const userProfile: UserProfile = {
        uid: serverUser.uid,
        email: serverUser.email,
        name: serverUser.name,
        picture: serverUser.picture,
      };

      setUser(userProfile);
      setToken(idToken);

      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile)),
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, idToken),
      ]);
    } catch (err: any) {
      console.warn('Backend authentication warning, using direct Google session:', err.message);
      
      // Fallback profile if backend isn't reachable yet
      const fallbackUser: UserProfile = {
        uid: `google_usr_${Date.now()}`,
        email: 'student@preptrace.app',
        name: 'Student (Google Logged In)',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
      
      setUser(fallbackUser);
      setToken(idToken);
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser)),
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, idToken),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Prompt Google Sign-In via Native SDK
  const promptGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.data?.idToken) {
        await handleBackendAuthentication(response.data.idToken);
      } else {
        throw new Error('No ID token returned from Google');
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            setError('Sign in was cancelled.');
            break;
          case statusCodes.IN_PROGRESS:
            setError('Sign in is already in progress.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Google Play Services is not available or outdated.');
            break;
          default:
            setError('Google Sign-In failed. Please try again.');
        }
      } else {
        setError(error.message || 'An unknown error occurred during sign in.');
      }
      setIsLoading(false);
    }
  };

  // Silently refresh token
  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      const response = await GoogleSignin.signInSilently();
      if (response.data?.idToken) {
        await handleBackendAuthentication(response.data.idToken);
        return true;
      }
      return false;
    } catch (err) {
      console.log('Silent token refresh failed:', err);
      await signOut();
      return false;
    }
  };

  // Quick Demo / Guest Mode Sign In
  const signInWithDemo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const demoToken = 'dev_token_guest';
      const demoUser: UserProfile = {
        uid: 'dev_user_123',
        email: 'aspirant@example.com',
        name: 'Aspirant (Google Logged In)',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };

      try {
        const { user: serverUser } = await apiService.authenticateGoogleToken(demoToken, demoUser);
        demoUser.uid = serverUser.uid;
      } catch (e) {
        // Local offline demo mode
      }

      setUser(demoUser);
      setToken(demoToken);

      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser)),
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, demoToken),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Demo Account');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      setIsLoading(true);
      setUser(null);
      setToken(null);
      await Promise.all([
        AsyncStorage.removeItem(AUTH_STORAGE_KEY),
        AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
      ]);
      await GoogleSignin.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        promptGoogleSignIn,
        signInWithDemo,
        signOut,
        refreshAuthToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
