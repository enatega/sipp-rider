import { useEffect, useState } from 'react';

/**
 * Whole seconds left in the rider's cancel window. The server sends the remainder
 * (not a deadline) so device clock skew can't extend or shorten the window.
 * `receivedAt` is when that remainder was measured on the client.
 */
export function useAssignmentCancelCountdown(remainingMs: number | null | undefined, receivedAt: number) {
  const deadline = remainingMs && remainingMs > 0 ? receivedAt + remainingMs : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
