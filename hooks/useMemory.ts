import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getMemory, patchMemory, type Memory } from '../utils/memory';

type Account = { userId: string | null };
type Snapshot = { account: Account; memory: Memory | null; loading: boolean };

export function useMemory() {
  const currentAccount = useRef<Account | null>(null);
  const readRevision = useRef(0);
  const [account, setAccount] = useState<Account | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      if (currentAccount.current?.userId === userId) return;
      // A fresh object also distinguishes two sessions for the same user
      // when another account signs in between them.
      const nextAccount = { userId };
      currentAccount.current = nextAccount;
      setAccount(nextAccount);
    });
    return () => {
      currentAccount.current = null;
      data.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!account?.userId || currentAccount.current !== account) return;
    const revision = ++readRevision.current;
    setSnapshot((previous) => ({
      account,
      memory: previous?.account === account ? previous.memory : null,
      loading: true,
    }));
    const memory = await getMemory(account.userId).catch(() => null);
    if (currentAccount.current === account && readRevision.current === revision) {
      setSnapshot((previous) => ({
        account,
        memory: memory ?? (previous?.account === account ? previous.memory : null) ?? {},
        loading: false,
      }));
    }
  }, [account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patch = useCallback(async (value: Partial<Memory>) => {
    if (!account?.userId || currentAccount.current !== account) return false;
    const saved = await patchMemory(account.userId, value);
    if (!saved || currentAccount.current !== account) return false;

    // A read that started before this write can still return the old profile.
    readRevision.current++;
    setSnapshot((previous) => ({
      account,
      memory: { ...(previous?.account === account ? previous.memory : null), ...value },
      loading: false,
    }));
    return true;
  }, [account]);

  const visible = snapshot?.account === account ? snapshot : null;
  return {
    account: account === null ? undefined : account.userId,
    memory: visible?.memory ?? null,
    loading: account === null || (!!account.userId && (visible?.loading ?? true)),
    refresh,
    patch,
  };
}
