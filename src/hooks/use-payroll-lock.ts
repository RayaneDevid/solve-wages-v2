import { useState, useEffect, useRef, useCallback } from 'react';
import { acquireLock, releaseLock, checkLock } from '@/api/payroll-lock.api';

const HEARTBEAT_INTERVAL = 15_000; // 15s
const POLL_INTERVAL = 5_000;       // 5s

export type LockState =
  | { status: 'idle' }
  | { status: 'acquiring' }
  | { status: 'owned' }
  | { status: 'blocked'; lockedBy: string }
  | { status: 'error' };

/**
 * Acquires a payroll lock for the given week+pole.
 * Sends a heartbeat every 15s to keep the lock alive.
 * Releases the lock on unmount or when weekId/pole changes.
 * Also polls every 5s to detect if we were kicked (shouldn't happen but safety).
 */
export function usePayrollLock(weekId: string | undefined, pole: string | undefined) {
  const [lockState, setLockState] = useState<LockState>({ status: 'idle' });
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ownedRef = useRef(false);
  // Refs to avoid stale closures in intervals when weekId/pole change
  const weekIdRef = useRef(weekId);
  const poleRef = useRef(pole);
  weekIdRef.current = weekId;
  poleRef.current = pole;

  const stopIntervals = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const release = useCallback(async (): Promise<void> => {
    if (!weekId || !pole || !ownedRef.current) return;
    ownedRef.current = false;
    stopIntervals();
    try { await releaseLock(weekId, pole); } catch { /* ignore on unmount */ }
  }, [weekId, pole, stopIntervals]);

  useEffect(() => {
    if (!weekId || !pole) return;

    let cancelled = false;

    async function acquire() {
      if (cancelled || !weekId || !pole) return;
      setLockState({ status: 'acquiring' });

      const result = await acquireLock(weekId, pole);

      if (cancelled) return;

      if (!result.ok) {
        setLockState({ status: 'blocked', lockedBy: result.lockedBy });

        // Poll to detect when the lock is released
        pollRef.current = setInterval(async () => {
          if (!weekId || !pole) return;
          try {
            const lock = await checkLock(weekId, pole);
            if (!lock) {
              // Lock released — try to acquire
              clearInterval(pollRef.current!);
              pollRef.current = null;
              acquire();
            }
          } catch { /* ignore */ }
        }, POLL_INTERVAL);

        return;
      }

      ownedRef.current = true;
      setLockState({ status: 'owned' });

      // Heartbeat to keep lock alive
      let heartbeatFailures = 0;
      heartbeatRef.current = setInterval(async () => {
        const wId = weekIdRef.current;
        const p = poleRef.current;
        if (!wId || !p) return;
        try {
          await acquireLock(wId, p);
          heartbeatFailures = 0;
        } catch {
          heartbeatFailures++;
          // After 5 consecutive failures (~75s) the lock has likely expired
          if (heartbeatFailures >= 5) {
            stopIntervals();
            ownedRef.current = false;
            setLockState({ status: 'error' });
          }
        }
      }, HEARTBEAT_INTERVAL);
    }

    acquire().catch(() => setLockState({ status: 'error' }));

    // Release lock on tab close
    const handleUnload = () => { release(); };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      cancelled = true;
      stopIntervals();
      window.removeEventListener('beforeunload', handleUnload);
      release();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId, pole]);

  return lockState;
}
