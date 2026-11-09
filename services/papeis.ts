import { User } from 'firebase/auth';

/**
 * E-mails da equipe da ONG. Quem entrar com um e-mail desta lista (e com o
 * e-mail verificado) vê o painel de estoque; qualquer outra conta é doador.
 *
 * ATENÇÃO: esta lista precisa ser IGUAL à função ehEquipe() do arquivo
 * firestore.rules. O app só decide qual tela mostrar; quem realmente protege
 * os dados são as regras do Firestore.
 */
export const EMAILS_EQUIPE: string[] = [
  'souza.joaojg@gmail.com',
];

export type Papel = 'equipe' | 'doador';

export function papelDoUsuario(user: User | null): Papel | null {
  if (!user || user.isAnonymous) return null;
  const email = (user.email ?? '').trim().toLowerCase();
  return EMAILS_EQUIPE.includes(email) ? 'equipe' : 'doador';
}
