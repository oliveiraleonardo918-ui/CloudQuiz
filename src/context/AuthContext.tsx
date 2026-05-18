// src/context/AuthContext.tsx
// Gerencia o estado de autenticacao em toda a aplicacao

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  logIn as apiLogIn,
  signUp as apiSignUp,
  logOut as apiLogOut,
  signInWithGoogle as apiSignInWithGoogle,
} from '../services/back4app';
import type { GoogleAuthData } from '../services/back4app';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (googleData: GoogleAuthData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const loggedInUser = await apiLogIn(username, password);
    setUser(loggedInUser);
  };

  const register = async (username: string, password: string) => {
    const newUser = await apiSignUp(username, password);
    setUser(newUser);
  };

  const loginWithGoogle = async (googleData: GoogleAuthData) => {
    const googleUser = await apiSignInWithGoogle(googleData);
    setUser(googleUser);
  };

  const logout = async () => {
    await apiLogOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
