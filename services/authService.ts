import {
  GoogleAuthProvider,
  signInWithCredential,
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

export async function loginComEmail(email: string, senha: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, senha);
  return result.user;
}

export async function criarContaComEmail(email: string, senha: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, senha);
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
