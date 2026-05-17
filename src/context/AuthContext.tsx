// src/context/AuthContext.tsx
// Gerencia o estado de autenticação em toda a aplicação

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Parse, { getCurrentUser, logIn as apiLogIn, signUp as apiSignUp, logOut as apiLogOut } from '../services/back4app';

interface AuthContextType {
  user: Parse.User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Parse.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar, verifica se já tem usuário logado (sessão persistente)
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

  const logout = async () => {
    await apiLogOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto facilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
