'use client';
import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  firstName: string;
  role: string;
}

const UserContext = createContext<{
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
}>({
  selectedUser: null,
  setSelectedUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  return (
    <UserContext.Provider value={{ selectedUser, setSelectedUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
