import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'login.rememberedEmail';

export function useRememberedEmail() {
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [isReady, setReady] = useState(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(KEY).then((saved) => {
      if (mounted && saved) { setEmail(saved); setRemember(true); }
    }).catch(() => undefined).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  const enqueue = (value: string | null) => {
    writes.current = writes.current.catch(() => undefined).then(() => value
      ? AsyncStorage.setItem(KEY, value) : AsyncStorage.removeItem(KEY)).catch(() => undefined);
    return writes.current;
  };
  const toggle = () => {
    setRemember(!remember);
    if (remember) void enqueue(null);
  };
  const save = (value: string) => enqueue(remember ? value.trim().toLowerCase() : null);
  return { email, setEmail, remember, toggle, save, isReady };
}
