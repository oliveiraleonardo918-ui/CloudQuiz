// src/services/back4app.ts
// Configuracao do Parse SDK e funcoes de comunicacao com o Back4App

// Importa Parse como namespace - funciona com modulos CJS sem default export
// @ts-ignore
import * as ParseAll from 'parse';

// O Parse pode estar em .default (ESM) ou no namespace (CJS) - tentamos os dois
const Parse: any = (ParseAll as any).default ?? ParseAll;

// ============================================================
// INICIALIZACAO DO PARSE
// ============================================================

const APP_ID = import.meta.env.VITE_BACK4APP_APP_ID;
const JS_KEY = import.meta.env.VITE_BACK4APP_JS_KEY;

if (!APP_ID || !JS_KEY) {
  console.error('Chaves do Back4App nao configuradas. Verifique seu arquivo .env');
}

if (typeof Parse.initialize !== 'function') {
  console.error('Parse SDK nao carregou corretamente. Conteudo do modulo:', ParseAll);
} else {
  Parse.initialize(APP_ID, JS_KEY);
  Parse.serverURL = 'https://parseapi.back4app.com/';
}

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
// AUTENTICACAO
// ============================================================

export async function signUp(username: string, password: string): Promise<any> {
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

export async function logIn(username: string, password: string): Promise<any> {
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

export function getCurrentUser(): any | null {
  return Parse.User.current();
}

// ============================================================
// PERGUNTAS
// ============================================================

export async function fetchQuestions(limit: number = 10): Promise<Question[]> {
  const QuestionClass = Parse.Object.extend('Question');
  const query = new Parse.Query(QuestionClass);
  query.limit(100);

  try {
    const results = await query.find();
    const shuffled = results.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, limit);

    return selected.map((q: any) => ({
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
// PONTUACAO (SCORE)
// ============================================================

export async function saveScore(points: number, totalQuestions: number): Promise<void> {
  const currentUser = Parse.User.current();
  if (!currentUser) {
    throw new Error('Usuario nao autenticado');
  }

  const username = currentUser.get('username') || 'Anonimo';

  const Score = Parse.Object.extend('Score');
  const score = new Score();

  // Salvamos tanto o pointer (relacionamento) quanto o username (denormalizado pro leaderboard)
  score.set('playerId', currentUser);
  score.set('username', username);
  score.set('points', points);
  score.set('totalQuestions', totalQuestions);
  score.set('playedAt', new Date());

  try {
    await score.save();
  } catch (error: any) {
    throw new Error('Erro ao salvar pontuacao: ' + error.message);
  }
}

export async function fetchLeaderboard(limit: number = 10): Promise<ScoreEntry[]> {
  const Score = Parse.Object.extend('Score');
  const query = new Parse.Query(Score);

  query.descending('points');
  query.limit(limit);

  try {
    const results = await query.find();
    const currentUser = Parse.User.current();
    const currentUserId = currentUser?.id;

    return results.map((scoreObj: any) => {
      // Le o username direto do Score (desnormalizado)
      // Fallback para scores antigos que nao tem o campo username
      const username = scoreObj.get('username') || 'Anonimo';

      // Verifica se eh do usuario atual via Pointer
      const playerPointer = scoreObj.get('playerId');
      const isCurrentUser = playerPointer?.id === currentUserId;

      return {
        id: scoreObj.id || '',
        username,
        points: scoreObj.get('points'),
        totalQuestions: scoreObj.get('totalQuestions'),
        playedAt: scoreObj.get('playedAt'),
        isCurrentUser,
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
    return 'Usuario ou senha invalidos.';
  }
  if (mensagem.includes('already taken')) {
    return 'Esse nome de usuario ja esta em uso.';
  }
  if (mensagem.includes('cannot be empty')) {
    return 'Preencha todos os campos.';
  }
  if (mensagem.includes('Network')) {
    return 'Erro de conexao. Verifique sua internet.';
  }
  return mensagem;
}
