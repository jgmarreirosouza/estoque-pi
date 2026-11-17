import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInAnonymously as firebaseAnon,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function loginComGoogle(
  idToken: string | null,
  accessToken: string | null = null
): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/** Login com Google na WEB: popup do próprio Firebase (o módulo nativo só funciona no celular). */
export async function loginComGoogleWeb(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginComEmail(email: string, senha: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, senha);
  return result.user;
}

export const NOME_MIN = 2;
export const NOME_MAX = 80;

/** Nome gravado na conta (vazio se a conta ainda não tem nome). */
export function nomeDaConta(user: User | null): string {
  return user?.displayName?.trim() ?? '';
}

/** Grava o nome do doador na conta (Firebase Auth). Vale para todas as doações. */
export async function atualizarNomeDaConta(nome: string): Promise<void> {
  const limpo = nome.trim().replace(/\s+/g, ' ');
  if (limpo.length < NOME_MIN || limpo.length > NOME_MAX) {
    throw new Error('Nome inválido.');
  }
  if (!auth.currentUser) throw new Error('Nenhum usuário logado.');
  await updateProfile(auth.currentUser, { displayName: limpo });
}

export async function criarContaComEmail(email: string, senha: string, nome?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, senha);
  // O nome informado no cadastro fica associado à conta. Se falhar, o app pede de novo na 1ª doação.
  if (nome) {
    try {
      await updateProfile(result.user, { displayName: nome.trim().replace(/\s+/g, ' ') });
    } catch {
      // ignorado de propósito
    }
  }
  // Envia o link de confirmação. Se falhar, a tela de verificação permite reenviar.
  try {
    await sendEmailVerification(result.user);
  } catch {
    // ignorado de propósito
  }
  return result.user;
}

/** Reenvia o e-mail de verificação para o usuário logado. */
export async function reenviarVerificacao(): Promise<void> {
  if (!auth.currentUser) throw new Error('Nenhum usuário logado.');
  await sendEmailVerification(auth.currentUser);
}

export async function redefinirSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function loginAnonimo(): Promise<User> {
  const result = await firebaseAnon(auth);
  return result.user;
}

export async function sairDaConta(): Promise<void> {
  await firebaseSignOut(auth);
}
