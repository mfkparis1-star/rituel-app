import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCacheAccount(): string | null | undefined {
  const [account, setAccount] = useState<string | null>();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(session?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return account;
}
