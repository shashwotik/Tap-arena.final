import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { fetchSuspiciousUsers, adminDismissFlags, adminSetBanned, adminResetTaps } from '../firebase/userService';
import { FlaggedUserCard } from '../components/admin/FlaggedUserCard';
import type { UserProfile } from '../types';

export function AdminScreen() {
  const { t } = useSettings();
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  const load = useCallback(async () => {
    const list = await fetchSuspiciousUsers();
    setUsers(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDismiss = async (uid: string) => {
    await adminDismissFlags(uid);
    void load();
  };
  const handleBan = async (uid: string, banned: boolean) => {
    await adminSetBanned(uid, banned);
    void load();
  };
  const handleResetTaps = async (uid: string) => {
    await adminResetTaps(uid);
    void load();
  };

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="text-loss" size={20} />
        <h1 className="font-display text-xl font-bold text-text">{t('adminTitle')}</h1>
      </div>
      <p className="mt-1 font-body text-xs text-text-dim">
        Flags are advisory — the game never restricts an account automatically. Review and decide here.
      </p>

      {users === null && (
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-panel-light" />
          ))}
        </div>
      )}

      {users !== null && users.length === 0 && <p className="mt-10 text-center font-body text-sm text-text-dim">{t('adminEmpty')}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {users?.map((u) => (
          <FlaggedUserCard key={u.uid} user={u} onDismiss={handleDismiss} onBan={handleBan} onResetTaps={handleResetTaps} />
        ))}
      </div>
    </div>
  );
}
