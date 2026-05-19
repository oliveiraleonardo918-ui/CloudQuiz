// src/services/back4app.ts
// Configuração do Parse SDK e funções de comunicação com o Back4App

// @ts-ignore
import * as ParseAll from 'parse';
const Parse: any = (ParseAll as any).default ?? ParseAll;

// ============================================================
// INICIALIZAÇÃO DO PARSE
// ============================================================

const APP_ID = import.meta.env.VITE_BACK4APP_APP_ID;
const JS_KEY = import.meta.env.VITE_BACK4APP_JS_KEY;

if (!APP_ID || !JS_KEY) {
  console.error('Chaves do Back4App não configuradas. Verifique seu arquivo .env');
}

if (typeof Parse.initialize !== 'function') {
  console.error('Parse SDK não carregou corretamente. Conteúdo do módulo:', ParseAll);
} else {
  Parse.initialize(APP_ID, JS_KEY);
  Parse.serverURL = 'https://parseapi.back4app.com/';
}

// ============================================================
// TIPOS
// ============================================================

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
  difficulty: Difficulty;
}

export interface ScoreEntry {
  id: string;
  username: string;
  points: number;
  totalQuestions: number;
  playedAt: Date;
  isCurrentUser?: boolean;
}

export interface GoogleAuthData {
  id: string;
  id_token: string;
  email?: string;
  name?: string;
}

// ============================================================
// HELPERS
// ============================================================

function getDisplayName(user: any): string {
  if (!user) return 'Anônimo';

  const displayName = user.get('displayName');
  if (displayName && displayName.trim()) return displayName;

  const email = user.get('email');
  const username = user.get('username') || '';

  const looksLikeRandomId = /^[a-zA-Z0-9]{16,}$/.test(username);
  if (looksLikeRandomId && email) {
    return email.split('@')[0];
  }

  return username || 'Anônimo';
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================

export async function signUp(username: string, password: string): Promise<any> {
  const user = new Parse.User();
  user.set('username', username);
  user.set('password', password);

  try {
    return await user.signUp();
  } catch (error: any) {
    throw new Error(traduzErro(error.message));
  }
}

export async function logIn(username: string, password: string): Promise<any> {
  try {
    return await Parse.User.logIn(username, password);
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

export async function signInWithGoogle(googleData: GoogleAuthData): Promise<any> {
  try {
    const authData = {
      id: googleData.id,
      id_token: googleData.id_token,
    };

    const user = await Parse.User.logInWith('google', { authData });

    let needsSave = false;

    if (googleData.name && user.get('displayName') !== googleData.name) {
      user.set('displayName', googleData.name);
      needsSave = true;
    }

    if (googleData.email && user.get('email') !== googleData.email) {
      user.set('email', googleData.email);
      needsSave = true;
    }

    if (needsSave) {
      try {
        await user.save();
      } catch (saveError: any) {
        console.warn('Aviso: não conseguiu salvar displayName/email do Google:', saveError.message);
      }
    }

    return user;
  } catch (error: any) {
    throw new Error('Erro ao autenticar com Google: ' + (error.message || 'desconhecido'));
  }
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
      difficulty: (q.get('difficulty') || 'medium') as Difficulty,
    }));
  } catch (error: any) {
    throw new Error('Erro ao buscar perguntas: ' + error.message);
  }
}

// ============================================================
// PONTUAÇÃO (SCORE)
// ============================================================

export async function saveScore(points: number, totalQuestions: number): Promise<void> {
  const currentUser = Parse.User.current();
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  const displayName = getDisplayName(currentUser);

  const Score = Parse.Object.extend('Score');
  const score = new Score();

  score.set('playerId', currentUser);
  score.set('username', displayName);
  score.set('points', points);
  score.set('totalQuestions', totalQuestions);
  score.set('playedAt', new Date());

  try {
    await score.save();
  } catch (error: any) {
    throw new Error('Erro ao salvar pontuação: ' + error.message);
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
      const username = scoreObj.get('username') || 'Anônimo';
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
// SCORING - Calculadora de pontos
// ============================================================

/**
 * Calcula pontos por pergunta com base em:
 * - Acertou ou não
 * - Dificuldade da pergunta (multiplicador 1x / 1.5x / 2x)
 * - Tempo restante quando respondeu (bônus de até +12 pontos)
 *
 * Fórmula (timer 12s):
 *   base = 10 pontos
 *   pontos = (base * multiplicador_dificuldade) + timeLeft
 *
 * Exemplos:
 *   - Easy, 12s sobrando:  (10 * 1) + 12 = 22 pts
 *   - Medium, 6s sobrando: (10 * 1.5) + 6 = 21 pts
 *   - Hard, 0s sobrando:   (10 * 2) + 0 = 20 pts
 *   - Hard, 12s sobrando:  (10 * 2) + 12 = 32 pts (MÁXIMO)
 */
export function calculateQuestionPoints(
  correct: boolean,
  difficulty: Difficulty,
  timeLeftSeconds: number
): number {
  if (!correct) return 0;

  const basePoints = 10;
  const multiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
  const timeBonus = timeLeftSeconds;

  return Math.round(basePoints * multiplier + timeBonus);
}

// ============================================================
// HELPERS DE ERRO
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
