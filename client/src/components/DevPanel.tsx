import React from 'react';
import { useDevContext } from '../DevContext';

export const DevPanel: React.FC = () => {
  const { isDev, mockUser, setMockUser, toggleDevMode } = useDevContext();

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">🔧 Dev Panel</h3>
      <div className="space-y-2 text-sm">
        <div>User: {mockUser.name}</div>
        <div>Type: {mockUser.type}</div>
        <button 
          onClick={() => setMockUser({...mockUser, type: mockUser.type === 'institution' ? 'designer' : 'institution'})}
          className="bg-white text-red-500 px-2 py-1 rounded text-xs"
        >
          Switch Role
        </button>
        <div>
          <a href="/dev/marketplace/templates" target="_blank" className="underline">
            View Templates (No Auth)
          </a>
        </div>
      </div>
    </div>
  );
};