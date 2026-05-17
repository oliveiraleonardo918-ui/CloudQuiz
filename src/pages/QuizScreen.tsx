// src/pages/QuizScreen.tsx
// Tela do quiz - perguntas reais do Back4App, timer de 20s, pontuação

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { fetchQuestions, saveScore } from '../services/back4app';
import type { Question } from '../services/back4app';

const QUESTION_TIME_SECONDS = 20;
const TOTAL_QUESTIONS = 10;
const POINTS_PER_CORRECT = 10;

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

  // ============================================================
  // Carrega perguntas ao montar
  // ============================================================
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

  // ============================================================
  // Avança para próxima pergunta ou finaliza partida
  // ============================================================
  const goToNextQuestion = useCallback(async (finalScore: number) => {
    // Se ainda tem perguntas, avança
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setTimeLeft(QUESTION_TIME_SECONDS);
      return;
    }

    // Última pergunta — salva no banco e vai pro leaderboard
    setIsSubmitting(true);
    try {
      await saveScore(finalScore, questions.length);
      navigate('/leaderboard', { state: { finalScore, total: questions.length } });
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao salvar pontuação.');
      setIsSubmitting(false);
    }
  }, [currentIndex, questions.length, navigate]);

  // ============================================================
  // Confirma a resposta (clica no botão "Answer" ou estoura o timer)
  // ============================================================
  const handleAnswer = useCallback((answer: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    let newScore = score;
    if (answer && answer === currentQuestion.correctAnswer) {
      newScore = score + POINTS_PER_CORRECT;
      setScore(newScore);
    }

    goToNextQuestion(newScore);
  }, [questions, currentIndex, score, goToNextQuestion]);

  // ============================================================
  // Timer: decrementa 1s e finaliza ao zerar
  // ============================================================
  useEffect(() => {
    if (isLoading || questions.length === 0 || isSubmitting) return;

    if (timeLeft <= 0) {
      // Tempo esgotado: conta como resposta vazia (incorreta)
      handleAnswer('');
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, isLoading, questions.length, isSubmitting, handleAnswer]);

  // ============================================================
  // Renderização
  // ============================================================

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-8 py-12">
      <div className="max-w-3xl mx-auto w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-10">
          <span className="text-xl text-gray-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${
            timeLeft <= 5 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
          }`}>
            <Timer className="w-5 h-5" />
            <span className="text-lg">{timeLeft}s</span>
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
          <p className="text-sm text-teal-600 mb-2">{currentQuestion.category}</p>
          <p className="text-2xl text-gray-900">{currentQuestion.statement}</p>
        </div>

        {/* Alternativas */}
        <div className="space-y-4 mb-8">
          {answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => setSelectedAnswer(answer.id)}
              disabled={isSubmitting}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all text-lg ${
                selectedAnswer === answer.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className={selectedAnswer === answer.id ? 'text-teal-700' : 'text-gray-700'}>
                {answer.id}) {answer.text}
              </span>
            </button>
          ))}
        </div>

        {/* Botão de confirmar + barra de progresso */}
        <div className="space-y-4">
          <button
            onClick={() => handleAnswer(selectedAnswer)}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full py-4 bg-teal-500 text-white text-lg rounded-xl hover:bg-teal-600 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : currentIndex === questions.length - 1 ? 'Finish' : 'Answer'}
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
