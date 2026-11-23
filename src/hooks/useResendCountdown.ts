import { useCallback, useEffect, useState } from 'react';

/** Seconds remaining before a new reset code may be requested. */
export function useResendCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.ceil(initialSeconds)));
  const running = secondsLeft > 0;

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const restart = useCallback((seconds: number) => setSecondsLeft(Math.max(0, Math.ceil(seconds))), []);

  return { secondsLeft, canResend: !running, restart };
}
