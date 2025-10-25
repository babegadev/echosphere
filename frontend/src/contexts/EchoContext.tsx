'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Echo } from '@/types/echo';

interface EchoContextType {
  newEchos: Echo[];
  addNewEcho: (echo: Echo) => void;
  clearNewEchos: () => void;
}

const EchoContext = createContext<EchoContextType | undefined>(undefined);

export function EchoProvider({ children }: { children: ReactNode }) {
  const [newEchos, setNewEchos] = useState<Echo[]>([]);

  const addNewEcho = (echo: Echo) => {
    setNewEchos((prev) => [echo, ...prev]);
  };

  const clearNewEchos = () => {
    setNewEchos([]);
  };

  return (
    <EchoContext.Provider value={{ newEchos, addNewEcho, clearNewEchos }}>
      {children}
    </EchoContext.Provider>
  );
}

export function useEcho() {
  const context = useContext(EchoContext);
  if (context === undefined) {
    throw new Error('useEcho must be used within an EchoProvider');
  }
  return context;
}
