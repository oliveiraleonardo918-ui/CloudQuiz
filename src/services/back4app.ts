// src/services/back4app.ts
// Configuração do Parse SDK e funções de comunicação com o Back4App

import Parse from 'parse';

// ============================================================
// INICIALIZAÇÃO DO PARSE
// ============================================================

const APP_ID = import.meta.env.VITE_BACK4APP_APP_ID;
const JS_KEY = import.meta.env.VITE_BACK4APP_JS_KEY;

if (!APP_ID || !JS_KEY) {
  console.error(
    '❌ Chaves do Back4App não configuradas. Verifique seu arquivo .env'
  );
}

Parse.initialize(APP_ID, JS_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

export default Parse;

// ============================================================
// TIPOS
// ============================================================

export interface Question {
  id: string;
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
}

export interface ScoreEntry {
  id: string;
  username: string;
  points: number;
  totalQuestions: number;
  playedAt: Date;
  isCurrentUser?: boolean;
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================

export async function signUp(username: string, password: string): Promise<Parse.User> {
  const user = new Parse.User();
  user.set('username', username);
  user.set('password', password);

  try {
    const newUser = await user.signUp();
    return newUser;
  } catch (error: any) {
    throw new Error(traduzErro(error.message));
  }
}

export async function logIn(username: string, password: string): Promise<Parse.User> {
  try {
    const user = await Parse.User.logIn(username, password);
    return user;
  } catch (error: any) {
    throw new Error(traduzErro(error.message));
  }
}

export async function logOut(): Promise<void> {
  await Parse.User.logOut();
}

export function getCurrentUser(): Parse.User | null {
  return Parse.User.current();
}

// ============================================================
// PERGUNTAS
// ============================================================

/**
 * Busca 10 perguntas aleatórias do banco
 */
export async function fetchQuestions(limit: number = 10): Promise<Question[]> {
  const Question = Parse.Object.extend('Question');
  const query = new Parse.Query(Question);
  query.limit(100); // pega até 100 perguntas para sortear depois

  try {
    const results = await query.find();

    // Embaralha e pega as primeiras "limit"
    const shuffled = results.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, limit);

    return selected.map((q) => ({
      id: q.id || '',
      statement: q.get('statement'),
      optionA: q.get('optionA'),
      optionB: q.get('optionB'),
      optionC: q.get('optionC'),
      optionD: q.get('optionD'),
      correctAnswer: q.get('correctAnswer'),
      category: q.get('category'),
    }));
  } catch (error: any) {
    throw new Error('Erro ao buscar perguntas: ' + error.message);
  }
}

// ============================================================
// PONTUAÇÃO (SCORE)
// ============================================================

/**
 * Salva o resultado de uma partida no Back4App
 */
export async function saveScore(points: number, totalQuestions: number): Promise<void> {
  const currentUser = Parse.User.current();
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  const Score = Parse.Object.extend('Score');
  const score = new Score();

  score.set('playerId', currentUser);
  score.set('points', points);
  score.set('totalQuestions', totalQuestions);
  score.set('playedAt', new Date());

  try {
    await score.save();
  } catch (error: any) {
    throw new Error('Erro ao salvar pontuação: ' + error.message);
  }
}

/**
 * Busca o leaderboard global (top N por pontuação)
 */
export async function fetchLeaderboard(limit: number = 10): Promise<ScoreEntry[]> {
  const Score = Parse.Object.extend('Score');
  const query = new Parse.Query(Score);

  query.descending('points');
  query.limit(limit);
  query.include('playerId'); // traz dados do usuário junto

  try {
    const results = await query.find();
    const currentUser = Parse.User.current();
    const currentUserId = currentUser?.id;

    return results.map((scoreObj) => {
      const player = scoreObj.get('playerId');
      const username = player?.get('username') || 'Anônimo';

      return {
        id: scoreObj.id || '',
        username,
        points: scoreObj.get('points'),
        totalQuestions: scoreObj.get('totalQuestions'),
        playedAt: scoreObj.get('playedAt'),
        isCurrentUser: player?.id === currentUserId,
      };
    });
  } catch (error: any) {
    throw new Error('Erro ao buscar leaderboard: ' + error.message);
  }
}

// ============================================================
// HELPERS
// ============================================================

function traduzErro(mensagem: string): string {
  if (mensagem.includes('Invalid username/password')) {
    return 'Usuário ou senha inválidos.';
  }
  if (mensagem.includes('already taken')) {
    return 'Esse nome de usuário já está em uso.';
  }
  if (mensagem.includes('cannot be empty')) {
    return 'Preencha todos os campos.';
  }
  if (mensagem.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  return mensagem;
}
