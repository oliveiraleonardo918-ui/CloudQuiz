// src/pages/RegisterScreen.tsx
// Tela de cadastro com registro real no Back4App

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('Preencha todos os campos.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('O usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await register(username.trim(), password);
      navigate('/quiz');
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBackToLogin() {
    navigate('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8">
      <div className="flex flex-col items-center mb-12">
        <Cloud className="w-20 h-20 text-teal-500 mb-4" strokeWidth={1.5} />
        <h1 className="text-5xl text-gray-900">CloudQuiz</h1>
        <p className="text-gray-600 mt-2">Crie sua conta</p>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-md space-y-4">
        <div>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <button
            type="button"
            onClick={handleBackToLogin}
            disabled={isLoading}
            className="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Voltar ao Login
          </button>
        </div>
      </form>
    </div>
  );
}
