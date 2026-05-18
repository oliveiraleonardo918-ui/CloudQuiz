// src/services/back4app.ts
// Configuracao do Parse SDK e funcoes de comunicacao com o Back4App

// @ts-ignore
import * as ParseAll from 'parse';
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

export interface GoogleAuthData {
  id: string;
  id_token: string;
  email?: string;
  name?: string;
}

// ============================================================
// AUTENTICACAO - Helper
// ============================================================

/**
 * Retorna o nome de exibicao do usuario, com prioridade:
 * 1. displayName (nome real do Google, se foi salvo)
 * 2. email (se for Google e o username for um ID aleatorio)
 * 3. username (login normal)
 * 4. fallback "Anonimo"
 */
function getDisplayName(user: any): string {
  if (!user) return 'Anonimo';

  const displayName = user.get('displayName');
  if (displayName && displayName.trim()) return displayName;

  const email = user.get('email');
  const username = user.get('username') || '';

  // Se username parece um ID aleatorio do Parse (20 chars alfanumericos sem caracteres especiais)
  const looksLikeRandomId = /^[a-zA-Z0-9]{16,}$/.test(username);
  if (looksLikeRandomId && email) {
    // Retorna so a parte antes do @ do email
    return email.split('@')[0];
  }

  return username || 'Anonimo';
}

// ============================================================
// AUTENTICACAO
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

/**
 * Autentica via Google usando Parse.User.logInWith
 * Apos autenticar, salva displayName e email no usuario (pra ficar bonito no leaderboard)
 */
export async function signInWithGoogle(googleData: GoogleAuthData): Promise<any> {
  try {
    const authData = {
      id: googleData.id,
      id_token: googleData.id_token,
    };

    const user = await Parse.User.logInWith('google', { authData });

    // Sempre tenta salvar/atualizar displayName e email apos login Google
    // Isso garante que mesmo logins repetidos atualizem os dados se mudaram
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
        // Nao quebra o login se falhar o save dos dados extras
        console.warn('Aviso: nao conseguiu salvar displayName/email do Google:', saveError.message);
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

  // Usa displayName se existir, senao username, senao email
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
      const username = scoreObj.get('username') || 'Anonimo';
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
