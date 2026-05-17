// src/pages/LeaderboardScreen.tsx
// Tela de placar global - dados reais do Back4App

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { fetchLeaderboard } from '../services/back4app';
import type { ScoreEntry } from '../services/back4app';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  finalScore?: number;
  total?: number;
}

export function LeaderboardScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const state = location.state as LocationState | null;
  const finalScore = state?.finalScore ?? null;

  const [players, setPlayers] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLeaderboard(10);
        setPlayers(data);
      } catch (error: any) {
        setErrorMsg(error.message || 'Erro ao carregar ranking.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handlePlayAgain() {
    navigate('/quiz');
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-8 py-12">
      <div className="max-w-2xl mx-auto w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Trophy className="w-10 h-10 text-amber-500" />
          <h1 className="text-4xl text-gray-900">Global Leaderboard</h1>
        </div>

        {/* Card de pontuação atual (se veio do quiz) */}
        {finalScore !== null && (
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-8 mb-8 shadow-md">
            <p className="text-white text-2xl">
              Your score: <span className="font-semibold">{finalScore} pts</span> 🎉
            </p>
          </div>
        )}

        {/* Lista de jogadores */}
        {isLoading && (
          <p className="text-center text-gray-600 mb-8">Carregando ranking...</p>
        )}

        {errorMsg && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-8">
            <p className="text-red-700">{errorMsg}</p>
          </div>
        )}

        {!isLoading && !errorMsg && players.length === 0 && (
          <p className="text-center text-gray-600 mb-8">
            Nenhuma pontuação registrada ainda.
          </p>
        )}

        {!isLoading && players.length > 0 && (
          <div className="space-y-4 mb-8">
            {players.map((player, index) => {
              const rank = index + 1;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-6 rounded-xl ${
                    player.isCurrentUser
                      ? 'bg-teal-50 border-2 border-teal-500'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        rank === 1
                          ? 'bg-amber-400 text-white'
                          : player.isCurrentUser
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {rank}
                    </div>
                    <span className={`text-lg ${player.isCurrentUser ? 'text-teal-700' : 'text-gray-900'}`}>
                      {player.username}
                    </span>
                  </div>
                  <span className={`text-lg ${player.isCurrentUser ? 'text-teal-700' : 'text-gray-600'}`}>
                    {player.points} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-3">
          <button
            onClick={handlePlayAgain}
            className="w-full py-4 bg-teal-500 text-white text-lg rounded-xl hover:bg-teal-600 transition-colors"
          >
            Play Again
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
