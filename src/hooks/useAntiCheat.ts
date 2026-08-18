import { useCallback, useRef, useState } from 'react';
import { AntiCheatEngine } from '../utils/antiCheatEngine';
import type { AntiCheatFlag } from '../types';

export function useAntiCheat(onFlag?: (flag: AntiCheatFlag) => void) {
  const engineRef = useRef<AntiCheatEngine | null>(null);
  if (!engineRef.current) engineRef.current = new AntiCheatEngine();
  const [currentTPS, setCurrentTPS] = useState(0);

  const registerTap = useCallback(
    (isTrusted: boolean) => {
      const result = engineRef.current!.registerTap({
        timestamp: Date.now(),
        isTrusted,
        hidden: typeof document !== 'undefined' && document.hidden,
      });
      setCurrentTPS(result.tps);
      result.flags.forEach((flag) => onFlag?.(flag));
      return result;
    },
    [onFlag],
  );

  const getPeakTPS = useCallback(() => engineRef.current!.getPeakTPS(), []);
  const reset = useCallback(() => {
    engineRef.current!.reset();
    setCurrentTPS(0);
  }, []);

  return { registerTap, currentTPS, getPeakTPS, reset };
}
