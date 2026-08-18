import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { COUNTRIES, flagEmoji } from '../config/countries';
import { Button } from '../components/ui/Button';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,16}$/;

export function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { t } = useSettings();
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!USERNAME_PATTERN.test(username)) {
      setError(t('onboardUsernameHint'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await completeOnboarding(username, countryCode);
    } catch {
      setError(t('authError'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-void bg-grid px-6 py-10">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="chamfer glass-panel w-full max-w-sm p-6 shadow-glow"
      >
        <h1 className="font-display text-xl font-bold text-text">{t('onboardTitle')}</h1>
        <p className="mt-1 text-sm text-text-dim">{t('onboardSubtitle')}</p>

        <label className="mt-6 block">
          <span className="mb-1.5 block font-body text-xs uppercase tracking-widest text-text-dim">{t('onboardUsername')}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            placeholder="TapMaster99"
            className="w-full rounded-lg border border-steel bg-panel-light px-3 py-2.5 font-body text-sm text-text outline-none placeholder:text-text-dim focus:border-neon-500"
          />
          <span className="mt-1 block font-mono text-[10px] text-text-dim">{t('onboardUsernameHint')}</span>
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block font-body text-xs uppercase tracking-widest text-text-dim">{t('onboardCountry')}</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full rounded-lg border border-steel bg-panel-light px-3 py-2.5 font-body text-sm text-text outline-none focus:border-neon-500"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {flagEmoji(c.code)} {c.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="mt-3 font-body text-xs text-loss">{error}</p>}

        <Button type="submit" fullWidth loading={loading} className="mt-6">
          {t('onboardSubmit')}
        </Button>
      </motion.form>
    </div>
  );
}
