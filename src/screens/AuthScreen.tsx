import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { describeAuthError } from '../firebase/auth';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

export function AuthScreen() {
  const { signInGuest, signUp, signIn } = useAuth();
  const { t } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'guest' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGuest = async () => {
    setError(null);
    setLoading('guest');
    try {
      await signInGuest();
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading('email');
    try {
      if (mode === 'signup') await signUp(email, password);
      else await signIn(email, password);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-void bg-grid px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center text-center"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-500 shadow-glow">
          <span className="h-3 w-3 rounded-full bg-neon-400 shadow-glow-sm" />
        </div>
        <h1 className="font-display text-3xl font-black tracking-wide text-text text-glow">TAP LEGENDS</h1>
        <p className="mt-2 max-w-xs font-body text-sm text-text-dim">{t('authTagline')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mt-10 w-full max-w-sm"
      >
        <Button fullWidth loading={loading === 'guest'} onClick={handleGuest} className="py-3.5 text-base">
          {t('authContinueGuest')}
        </Button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-steel" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{t('authOrDivider')}</span>
          <span className="h-px flex-1 bg-steel" />
        </div>

        <div className="chamfer glass-panel p-5">
          <div className="mb-4 flex rounded-full border border-steel p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={cn(
                'flex-1 rounded-full py-1.5 font-body text-xs font-semibold uppercase tracking-wide transition-colors',
                mode === 'signin' ? 'bg-neon-600/40 text-neon-300' : 'text-text-dim',
              )}
            >
              {t('authSignIn')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 rounded-full py-1.5 font-body text-xs font-semibold uppercase tracking-wide transition-colors',
                mode === 'signup' ? 'bg-neon-600/40 text-neon-300' : 'text-text-dim',
              )}
            >
              {t('authSignUp')}
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-steel bg-panel-light px-3 py-2.5">
              <Mail size={16} className="text-text-dim" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={t('authEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent font-body text-sm text-text outline-none placeholder:text-text-dim"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-steel bg-panel-light px-3 py-2.5">
              <Lock size={16} className="text-text-dim" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={t('authPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent font-body text-sm text-text outline-none placeholder:text-text-dim"
              />
            </label>

            {error && <p className="font-body text-xs text-loss">{error}</p>}

            <Button type="submit" variant="secondary" fullWidth loading={loading === 'email'} className="mt-1">
              {mode === 'signup' ? t('authSignUp') : t('authSignIn')}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            className="mt-3 w-full text-center font-body text-xs text-text-dim underline decoration-steel underline-offset-4"
          >
            {mode === 'signin' ? t('authSwitchToSignUp') : t('authSwitchToSignIn')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
