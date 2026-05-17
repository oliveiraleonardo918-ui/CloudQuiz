// src/App.tsx
// Configuração de rotas do app com React Router

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from './pages/LoginScreen';
import { RegisterScreen } from './pages/RegisterScreen';
import { QuizScreen } from './pages/QuizScreen';
import { LeaderboardScreen } from './pages/LeaderboardScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />

        {/* Rotas protegidas (exigem login) */}
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardScreen />
            </ProtectedRoute>
          }
        />

        {/* Redireciona a raiz para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Qualquer outra rota também vai pro login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
