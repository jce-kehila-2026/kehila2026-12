import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

const DirectionContext = createContext(null);

const STORAGE_KEY = 'shena-dir';

export function DirectionProvider({ children }) {
  const [direction, setDirection] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'rtl';
    } catch {
      return 'rtl';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    try {
      localStorage.setItem(STORAGE_KEY, direction);
    } catch {
      /* noop */
    }
  }, [direction]);

  const toggleDirection = useCallback(() => {
    setDirection((prev) => (prev === 'rtl' ? 'ltr' : 'rtl'));
  }, []);

  const value = useMemo(() => ({ direction, toggleDirection }), [direction, toggleDirection]);

  return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>;
}

export function useDirection() {
  const ctx = useContext(DirectionContext);
  if (!ctx) throw new Error('useDirection must be used inside <DirectionProvider>');
  return ctx;
}
