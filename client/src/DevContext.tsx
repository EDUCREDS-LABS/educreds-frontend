import React, { createContext, useContext, useState } from 'react';

interface DevContextType {
  isDev: boolean;
  mockUser: any;
  setMockUser: (user: any) => void;
  toggleDevMode: () => void;
}

const DevContext = createContext<DevContextType | undefined>(undefined);

export const DevProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDev, setIsDev] = useState(import.meta.env.DEV);
  const [mockUser, setMockUser] = useState({
    id: 'dev-user-123',
    email: 'dev@test.com',
    name: 'Dev User',
    type: 'institution'
  });

  const toggleDevMode = () => setIsDev(!isDev);

  return (
    <DevContext.Provider value={{ isDev, mockUser, setMockUser, toggleDevMode }}>
      {children}
    </DevContext.Provider>
  );
};

export const useDevContext = () => {
  const context = useContext(DevContext);
  if (!context) throw new Error('useDevContext must be used within DevProvider');
  return context;
};
