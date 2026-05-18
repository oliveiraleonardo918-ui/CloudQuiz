// src/pages/LoginScreen.tsx
// Tela de login - login normal + Google OAuth (via id_token)

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/quiz');
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoToRegister() {
    navigate('/register');
  }

  // Decodifica o JWT do Google pra extrair info do usuario (sub, email, name)
  function parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // Callback quando Google retorna sucesso (recebe id_token)
  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error('Token do Google nao recebido');
      }

      // Decodifica o JWT pra pegar id, email e nome
      const decoded = parseJwt(idToken);
      if (!decoded) {
        throw new Error('Falha ao decodificar token do Google');
      }

      await loginWithGoogle({
        id: decoded.sub, // ID unico do Google
        id_token: idToken,
        email: decoded.email,
        name: decoded.name,
      });

      navigate('/quiz');
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao autenticar com Google.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleError() {
    setErrorMsg('Falha no login com Google. Tente novamente.');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8">
      <div className="flex flex-col items-center mb-12">
        <Cloud className="w-20 h-20 text-teal-500 mb-4" strokeWidth={1.5} />
        <h1 className="text-5xl text-gray-900">CloudQuiz</h1>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {errorMsg && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleGoToRegister}
            disabled={isLoading}
            className="w-full py-4 border-2 border-teal-500 text-teal-500 rounded-xl hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            Register
          </button>

          {/* Divisor */}
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Componente oficial do Google - retorna id_token (JWT) */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="384"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
