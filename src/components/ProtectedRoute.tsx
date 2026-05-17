// src/components/ProtectedRoute.tsx
// Componente que bloqueia acesso a rotas sem autenticação

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Enquanto carrega a verificação de sessão, não renderiza nada
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  // Se não tiver usuário logado, redireciona pra login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
