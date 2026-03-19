import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ReferenceDataContextValue {
  version: number;
  bumpVersion: () => void;
}

export const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(null);

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bumpVersion = useCallback(() => setVersion((v) => v + 1), []);
  return (
    <ReferenceDataContext.Provider value={{ version, bumpVersion }}>
      {children}
    </ReferenceDataContext.Provider>
  );
}

export function useReferenceDataVersion(): number {
  const ctx = useContext(ReferenceDataContext);
  return ctx?.version ?? 0;
}
