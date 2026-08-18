import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { soundManager } from '../utils/soundManager';
import { setVibrationEnabled as applyVibrationSetting } from '../utils/haptics';
import { translate, type TranslationKey } from '../config/i18n';
import type { AppSettings, ThemeMode } from '../types';

const STORAGE_KEY = 'tap-legends-settings';

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  language: 'en',
  theme: 'dark', // dark is the default theme, per spec
};

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue extends AppSettings {
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
  setLanguage: (value: string) => void;
  setTheme: (value: ThemeMode) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Private-browsing/storage-full — settings simply won't persist.
    }
  }, [settings]);

  useEffect(() => {
    soundManager.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  useEffect(() => {
    applyVibrationSetting(settings.vibrationEnabled);
  }, [settings.vibrationEnabled]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', settings.theme === 'light');
  }, [settings.theme]);

  const value: SettingsContextValue = {
    ...settings,
    setSoundEnabled: (value) => setSettings((s) => ({ ...s, soundEnabled: value })),
    setVibrationEnabled: (value) => setSettings((s) => ({ ...s, vibrationEnabled: value })),
    setLanguage: (value) => setSettings((s) => ({ ...s, language: value })),
    setTheme: (value) => setSettings((s) => ({ ...s, theme: value })),
    t: (key) => translate(settings.language, key),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
