// src/pages/LoginScreen.tsx
// Tela de login - adaptada do Figma com autenticação real

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    // Validação básica
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
        </div>
      </form>
    </div>
  );
}
