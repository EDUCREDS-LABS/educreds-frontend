import React, { createContext, useContext, useState } from 'react';
import { testSentryLog, captureTestError, captureTestMessage } from './lib/sentry';

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
      {isDev && (
        <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg shadow-lg">
          <div className="text-xs font-bold mb-2">Sentry Test</div>
          <div className="flex gap-2">
            <button
              onClick={testSentryLog}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Log
            </button>
            <button
              onClick={captureTestMessage}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              Message
            </button>
            <button
              onClick={captureTestError}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              Error
            </button>
          </div>
        </div>
      )}
    </DevContext.Provider>
  );
};

export const useDevContext = () => {
  const context = useContext(DevContext);
  if (!context) throw new Error('useDevContext must be used within DevProvider');
  return context;
};
