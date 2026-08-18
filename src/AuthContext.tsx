import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  watchAuthState,
  signInAsGuest,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  type FirebaseUser,
} from '../firebase/auth';
import {
  subscribeToProfile,
  createProfile,
  addTaps as addTapsService,
  updateHighestTPS as updateHighestTPSService,
  reportFlag as reportFlagService,
} from '../firebase/userService';
import type { AntiCheatFlag, UserProfile } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signInGuest: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (username: string, countryCode: string) => Promise<void>;
  addTaps: (amount: number) => Promise<void>;
  reportHighestTPS: (tps: number) => Promise<void>;
  reportFlag: (flag: AntiCheatFlag) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    return watchAuthState((user) => {
      setFirebaseUser(user);
      setAuthChecked(true);
      if (!user) {
        setProfile(null);
        setProfileChecked(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    setProfileChecked(false);
    return subscribeToProfile(firebaseUser.uid, (p) => {
      setProfile(p);
      setProfileChecked(true);
    });
  }, [firebaseUser]);

  const loading = !authChecked || (Boolean(firebaseUser) && !profileChecked);
  const needsOnboarding = Boolean(firebaseUser) && profileChecked && profile === null;

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    loading,
    needsOnboarding,
    signInGuest: async () => {
      await signInAsGuest();
    },
    signUp: async (email, password) => {
      await signUpWithEmail(email, password);
    },
    signIn: async (email, password) => {
      await signInWithEmail(email, password);
    },
    signOut: async () => {
      await signOutUser();
    },
    completeOnboarding: async (username, countryCode) => {
      if (!firebaseUser) return;
      await createProfile(firebaseUser.uid, username, countryCode);
    },
    addTaps: async (amount) => {
      if (!firebaseUser) return;
      await addTapsService(firebaseUser.uid, amount);
    },
    reportHighestTPS: async (tps) => {
      if (!firebaseUser) return;
      await updateHighestTPSService(firebaseUser.uid, tps);
    },
    reportFlag: async (flag) => {
      if (!firebaseUser) return;
      await reportFlagService(firebaseUser.uid, flag);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
