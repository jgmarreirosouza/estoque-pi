import {
  collection,
  doc,
  setDoc,
  getDoc,
  where,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Doacao, StatusDoacao } from './tipos';

/**
 * Coleção `doacoes` — sugestões de doação enviadas pelos doadores.
 *
 * Fluxo: pendente → aprovada → recebida (ou recusada).
 * Enviar uma sugestão NÃO altera o estoque: o estoque só muda quando a equipe
 * registra a entrada manualmente, depois de receber a doação.
 *
 * Segurança (ver firestore.rules): o doador precisa ter conta com e-mail
 * verificado para CRIAR uma sugestão (sempre 'pendente') e só enxerga as
 * próprias. Só a equipe lê todas, aprova, recusa ou apaga.
 *
 * Teto diário: o ID do documento é `uid_AAAAMMDD_n` (n de 1 a LIMITE_DIARIO) e
 * as regras só aceitam esse formato, com a data de hoje (UTC). Como o doador não
 * pode alterar documentos, depois de usar os n IDs do dia não existe ID livre.
 */
const COL = 'doacoes';

/** Máximo de sugestões por doador por dia. Igual ao das regras do Firestore. */
export const LIMITE_DIARIO = 3;

export class LimiteDiarioError extends Error {
  constructor() {
    super('limite-diario');
    this.name = 'LimiteDiarioError';
  }
}

/** Data de hoje em UTC no formato AAAAMMDD (o mesmo cálculo das regras). */
function diaUTC(d: Date = new Date()): number {
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function docToDoacao(d: DocumentSnapshot): Doacao {
  // 'estimate' evita criadoEm nulo enquanto o servidor ainda não confirmou o horário.
  const data = d.data({ serverTimestamps: 'estimate' })!;
  const ts = data.criadoEm as Timestamp | null;
  return {
    id: d.id,
    produtoId: data.produtoId ?? undefined,
    nomeItem: data.nomeItem,
    emoji: data.emoji ?? '📦',
    quantidade: data.quantidade,
    doadorUid: data.doadorUid ?? undefined,
    doadorNome: data.doadorNome,
    doadorContato: data.doadorContato,
    observacao: data.observacao ?? undefined,
    status: data.status as StatusDoacao,
    criadoEm: (ts ? ts.toDate() : new Date()).toISOString(),
  };
}

export interface DadosNovaDoacao {
  produtoId?: string;
  nomeItem: string;
  emoji: string;
  quantidade: number;
  doadorNome: string;
  doadorContato: string;
  observacao?: string;
}

/** Prefixo dos IDs das sugestões de hoje deste doador (para contar quantas já enviou). */
export function prefixoDeHoje(uid: string): string {
  return `${uid}_${diaUTC()}_`;
}

/**
 * Cria uma sugestão de doação (sempre como 'pendente') para o doador logado.
 * Lança LimiteDiarioError quando os IDs do dia já foram usados.
 */
export async function criarDoacao(uid: string, dados: DadosNovaDoacao): Promise<string> {
  // Garante que o token enviado ao Firestore já traz o e-mail como confirmado.
  await auth.currentUser?.getIdToken(true);

  const dia = diaUTC();
  for (let n = 1; n <= LIMITE_DIARIO; n++) {
    const ref = doc(db, COL, `${uid}_${dia}_${n}`);
    // ID já usado hoje? Se sim, tenta o próximo. Qualquer outro erro (regras,
    // rede) sobe como está, para não ser confundido com o limite diário.
    const existente = await getDoc(ref);
    if (existente.exists()) continue;
    await setDoc(ref, montarDocumento(uid, dados));
    return ref.id;
  }
  throw new LimiteDiarioError();
}

function montarDocumento(uid: string, dados: DadosNovaDoacao) {
  return {
    doadorUid: uid,
    produtoId: dados.produtoId ?? null,
    nomeItem: dados.nomeItem.trim(),
    emoji: dados.emoji,
    quantidade: dados.quantidade,
    doadorNome: dados.doadorNome.trim(),
    doadorContato: dados.doadorContato.trim(),
    observacao: dados.observacao?.trim() || null,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  };
}

/** Doações do próprio doador (a ordenação é feita aqui, sem índice composto). */
export function subscribeMinhasDoacoes(
  uid: string,
  callback: (doacoes: Doacao[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), where('doadorUid', '==', uid));
  return onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs
          .map(docToDoacao)
          .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      ),
    onError
  );
}

/** Todas as sugestões, da mais recente para a mais antiga (somente equipe). */
export function subscribeToDoacoes(
  callback: (doacoes: Doacao[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(docToDoacao)), onError);
}

export async function atualizarStatusDoacao(id: string, status: StatusDoacao): Promise<void> {
  await updateDoc(doc(db, COL, id), { status, atualizadoEm: serverTimestamp() });
}
