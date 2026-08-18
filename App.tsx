import { useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { BottomNav } from './components/ui/BottomNav';
import { LevelUpModal } from './components/level/LevelUpModal';
import { getLevelInfo } from './config/levels';
import { isFirebaseConfigured } from './firebase/config';
import type { LevelInfo, Screen } from './types';

function ConfigWarningBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-[70] bg-loss px-4 py-2 text-center font-body text-xs font-semibold text-void">
      Firebase isn't configured — copy .env.example to .env and add your project credentials (see README.md).
    </div>
  );
}

function AppShell() {
  const { firebaseUser, profile, loading, needsOnboarding } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [levelUpInfo, setLevelUpInfo] = useState<LevelInfo | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  // Fires whenever the player's derived level crosses a new threshold —
  // from home-screen tapping OR a match reward landing, since both just
  // change profile.totalTaps and this watches that single source of truth.
  useEffect(() => {
    if (!profile) {
      prevLevelRef.current = null;
      return;
    }
    const info = getLevelInfo(profile.totalTaps);
    if (prevLevelRef.current !== null && info.level > prevLevelRef.current) {
      setLevelUpInfo(info);
    }
    prevLevelRef.current = info.level;
  }, [profile?.totalTaps]);

  useEffect(() => {
    if (screen === 'admin' && !profile?.isAdmin) setScreen('settings');
  }, [screen, profile?.isAdmin]);

  if (loading) return <LoadingScreen />;
  if (!firebaseUser) return <AuthScreen />;
  if (needsOnboarding) return <OnboardingScreen />;

  return (
    <div className="relative min-h-[100dvh] bg-void bg-grid text-text">
      <main className="relative z-10">
        {screen === 'home' && <HomeScreen />}
        {screen === 'leaderboard' && <LeaderboardScreen />}
        {screen === 'match' && <MatchScreen onNavigate={setScreen} />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'settings' && <SettingsScreen onNavigate={setScreen} />}
        {screen === 'admin' && profile?.isAdmin && <AdminScreen />}
      </main>
      <BottomNav current={screen} onChange={setScreen} />
      <LevelUpModal info={levelUpInfo} onClose={() => setLevelUpInfo(null)} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        {!isFirebaseConfigured && <ConfigWarningBanner />}
        <AppShell />
      </AuthProvider>
    </SettingsProvider>
  );
}
