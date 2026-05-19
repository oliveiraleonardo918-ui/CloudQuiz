// src/pages/QuizScreen.tsx
// Tela do quiz - perguntas do Back4App, timer 12s, scoring com dificuldade + bônus de tempo

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Zap } from 'lucide-react';
import { fetchQuestions, saveScore, calculateQuestionPoints } from '../services/back4app';
import type { Question, Difficulty } from '../services/back4app';

const QUESTION_TIME_SECONDS = 12;
const TOTAL_QUESTIONS = 10;

interface PointsAnimation {
  value: number;
  key: number;
}

const DIFFICULTY_STYLES: Record<Difficulty, { label: string; bg: string; text: string }> = {
  easy: { label: 'Fácil', bg: 'bg-green-100', text: 'text-green-700' },
  medium: { label: 'Médio', bg: 'bg-amber-100', text: 'text-amber-700' },
  hard: { label: 'Difícil', bg: 'bg-red-100', text: 'text-red-700' },
};

export function QuizScreen() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pointsAnimation, setPointsAnimation] = useState<PointsAnimation | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchQuestions(TOTAL_QUESTIONS);
        if (data.length === 0) {
          setErrorMsg('Nenhuma pergunta encontrada no banco.');
        } else {
          setQuestions(data);
        }
      } catch (error: any) {
        setErrorMsg(error.message || 'Erro ao carregar perguntas.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const goToNextQuestion = useCallback(
    async (finalScore: number) => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer('');
        setTimeLeft(QUESTION_TIME_SECONDS);
        return;
      }

      setIsSubmitting(true);
      try {
        await saveScore(finalScore, questions.length);
        navigate('/leaderboard', { state: { finalScore, total: questions.length } });
      } catch (error: any) {
        setErrorMsg(error.message || 'Erro ao salvar pontuação.');
        setIsSubmitting(false);
      }
    },
    [currentIndex, questions.length, navigate]
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      const currentQuestion = questions[currentIndex];
      if (!currentQuestion) return;

      const correct = answer === currentQuestion.correctAnswer;
      const earned = calculateQuestionPoints(correct, currentQuestion.difficulty, timeLeft);
      const newScore = score + earned;

      if (earned > 0) {
        setScore(newScore);
        setPointsAnimation({ value: earned, key: Date.now() });
      }

      const delay = earned > 0 ? 700 : 0;
      setTimeout(() => {
        setPointsAnimation(null);
        goToNextQuestion(newScore);
      }, delay);
    },
    [questions, currentIndex, score, timeLeft, goToNextQuestion]
  );

  useEffect(() => {
    if (isLoading || questions.length === 0 || isSubmitting || pointsAnimation) return;

    if (timeLeft <= 0) {
      handleAnswer('');
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, isLoading, questions.length, isSubmitting, pointsAnimation, handleAnswer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-600">Carregando perguntas...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-8">
        <p className="text-xl text-red-600 mb-4">{errorMsg}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600"
        >
          Voltar ao Login
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const answers = [
    { id: 'A', text: currentQuestion.optionA },
    { id: 'B', text: currentQuestion.optionB },
    { id: 'C', text: currentQuestion.optionC },
    { id: 'D', text: currentQuestion.optionD },
  ];

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const diffStyle = DIFFICULTY_STYLES[currentQuestion.difficulty];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-8 py-12">
      <div className="max-w-3xl mx-auto w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-col gap-1">
            <span className="text-xl text-gray-700">
              Pergunta {currentIndex + 1} de {questions.length}
            </span>
            <span className="text-sm text-gray-500">
              Pontuação: <span className="font-semibold text-teal-600">{score} pts</span>
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${
              timeLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
            }`}
          >
            <Timer className="w-5 h-5" />
            <span className="text-lg">{timeLeft}s</span>
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm relative">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm px-3 py-1 bg-teal-50 text-teal-700 rounded-full">
              {currentQuestion.category}
            </span>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${diffStyle.bg} ${diffStyle.text}`}
            >
              {diffStyle.label}
            </span>
          </div>
          <p className="text-2xl text-gray-900">{currentQuestion.statement}</p>

          {pointsAnimation && (
            <div
              key={pointsAnimation.key}
              className="absolute top-4 right-4 flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce"
            >
              <Zap className="w-5 h-5" />
              <span className="text-xl font-bold">+{pointsAnimation.value}</span>
            </div>
          )}
        </div>

        {/* Alternativas */}
        <div className="space-y-4 mb-8">
          {answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => setSelectedAnswer(answer.id)}
              disabled={isSubmitting || !!pointsAnimation}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all text-lg ${
                selectedAnswer === answer.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={
                  selectedAnswer === answer.id ? 'text-teal-700' : 'text-gray-700'
                }
              >
                {answer.id}) {answer.text}
              </span>
            </button>
          ))}
        </div>

        {/* Botão e barra de progresso */}
        <div className="space-y-4">
          <button
            onClick={() => handleAnswer(selectedAnswer)}
            disabled={!selectedAnswer || isSubmitting || !!pointsAnimation}
            className="w-full py-4 bg-teal-500 text-white text-lg rounded-xl hover:bg-teal-600 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Salvando...'
              : currentIndex === questions.length - 1
                ? 'Finalizar'
                : 'Responder'}
          </button>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
