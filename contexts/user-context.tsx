
'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/lib/types';

// Create the context with a default value of null
const UserContext = createContext<User | null>(null);

// Create a provider component
export function UserProvider({ children, user }: { children: React.ReactNode, user: User }) {
  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

// Create a custom hook to use the UserContext
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
