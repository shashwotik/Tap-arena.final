import { useState, type ReactNode } from 'react';
import { Volume2, Vibrate, Languages, Moon, ShieldAlert, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LANGUAGES } from '../config/i18n';
import { resetProgress } from '../firebase/userService';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';
import type { Screen } from '../types';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-2.5 text-text">
        {icon}
        <span className="font-body text-sm">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { profile, signOut } = useAuth();
  const { soundEnabled, vibrationEnabled, language, theme, setSoundEnabled, setVibrationEnabled, setLanguage, setTheme, t } =
    useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!profile) return;
    setResetting(true);
    try {
      await resetProgress(profile.uid);
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-6">
      <h1 className="font-display text-xl font-bold text-text">{t('settingsTitle')}</h1>

      <div className="mt-5 chamfer glass-panel divide-y divide-steel">
        <Row icon={<Volume2 size={16} />} label={t('settingsSound')}>
          <Switch checked={soundEnabled} onChange={setSoundEnabled} label={t('settingsSound')} />
        </Row>
        <Row icon={<Vibrate size={16} />} label={t('settingsVibration')}>
          <Switch checked={vibrationEnabled} onChange={setVibrationEnabled} label={t('settingsVibration')} />
        </Row>
        <Row icon={<Languages size={16} />} label={t('settingsLanguage')}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-steel bg-panel-light px-2 py-1 font-body text-xs text-text outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Row>
        <Row icon={<Moon size={16} />} label={t('settingsTheme')}>
          <div className="flex rounded-full border border-steel p-0.5">
            <button
              onClick={() => setTheme('dark')}
              className={cn('rounded-full px-3 py-1 font-body text-xs', theme === 'dark' ? 'bg-neon-600/40 text-neon-300' : 'text-text-dim')}
            >
              {t('settingsThemeDark')}
            </button>
            <button
              onClick={() => setTheme('light')}
              className={cn('rounded-full px-3 py-1 font-body text-xs', theme === 'light' ? 'bg-neon-600/40 text-neon-300' : 'text-text-dim')}
            >
              {t('settingsThemeLight')}
            </button>
          </div>
        </Row>
      </div>

      {profile?.isAdmin && (
        <Button variant="secondary" fullWidth icon={<ShieldAlert size={16} />} className="mt-5" onClick={() => onNavigate('admin')}>
          {t('settingsAdminPanel')}
        </Button>
      )}

      <Button variant="secondary" fullWidth className="mt-3" onClick={() => void signOut()}>
        {t('signOut')}
      </Button>

      <div className="mt-8">
        <p className="mb-2 font-body text-xs uppercase tracking-widest text-loss">{t('settingsDanger')}</p>
        <Button variant="danger" fullWidth icon={<RotateCcw size={16} />} onClick={() => setConfirmReset(true)}>
          {t('settingsResetProgress')}
        </Button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <p className="text-center font-body text-sm text-text">{t('settingsResetConfirm')}</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button variant="danger" fullWidth loading={resetting} onClick={() => void handleReset()}>
            {t('confirm')}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmReset(false)}>
            {t('cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
