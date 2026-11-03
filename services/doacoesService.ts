import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Doacao, StatusDoacao } from './tipos';

/**
 * Coleção `doacoes` — sugestões de doação enviadas pelos doadores.
 *
 * Fluxo: pendente → aprovada → recebida (ou recusada).
 * Enviar uma sugestão NÃO altera o estoque: o estoque só muda quando a equipe
 * registra a entrada manualmente, depois de receber a doação.
 *
 * Segurança (ver firestore.rules): qualquer pessoa pode CRIAR uma sugestão
 * (sempre 'pendente'), mas só a equipe pode LER, aprovar, recusar ou apagar.
 */
const COL = 'doacoes';

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

/** Cria uma sugestão de doação (sempre como 'pendente'). Não exige login. */
export async function criarDoacao(dados: DadosNovaDoacao): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    produtoId: dados.produtoId ?? null,
    nomeItem: dados.nomeItem.trim(),
    emoji: dados.emoji,
    quantidade: dados.quantidade,
    doadorNome: dados.doadorNome.trim(),
    doadorContato: dados.doadorContato.trim(),
    observacao: dados.observacao?.trim() || null,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  });
  return ref.id;
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
