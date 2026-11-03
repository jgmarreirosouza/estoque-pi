import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  WriteBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { NecessidadePublica, UrgenciaNecessidade } from './tipos';

/**
 * Coleção `necessidades` — cópia PÚBLICA e resumida da lista de necessidades.
 * Qualquer pessoa pode ler (área do doador); só a equipe da ONG escreve.
 * Os dados internos de estoque nunca são copiados para cá.
 */
const COL = 'necessidades';

const ORDEM_URGENCIA: Record<UrgenciaNecessidade, number> = {
  urgente: 0,
  atencao: 1,
  geral: 2,
};

function docToNecessidade(d: DocumentSnapshot): NecessidadePublica {
  const data = d.data()!;
  return {
    id: d.id,
    nome: data.nome,
    emoji: data.emoji ?? '📦',
    fotoUrl: data.fotoUrl ?? undefined,
    categoria: data.categoria,
    urgencia: (data.urgencia as UrgenciaNecessidade) ?? 'geral',
  };
}

/** Lista pública em tempo real, do mais urgente para o menos urgente. */
export function subscribeNecessidadesPublicas(
  callback: (itens: NecessidadePublica[]) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      const itens = snap.docs
        .map(docToNecessidade)
        .sort(
          (a, b) =>
            ORDEM_URGENCIA[a.urgencia] - ORDEM_URGENCIA[b.urgencia] ||
            a.nome.localeCompare(b.nome, 'pt-BR')
        );
      callback(itens);
    },
    onError
  );
}

/**
 * Substitui a lista pública pelo conjunto informado: grava os itens atuais
 * e remove os que saíram da lista. Chamado pela equipe (usuária autenticada).
 */
export async function publicarNecessidades(itens: NecessidadePublica[]): Promise<void> {
  const existentes = await getDocs(collection(db, COL));
  const novosIds = new Set(itens.map((i) => i.id));
  const agora = Timestamp.now();

  const operacoes: Array<(batch: WriteBatch) => void> = [];

  existentes.docs.forEach((d) => {
    if (!novosIds.has(d.id)) operacoes.push((batch) => batch.delete(d.ref));
  });

  itens.forEach((i) => {
    operacoes.push((batch) =>
      batch.set(doc(db, COL, i.id), {
        nome: i.nome,
        emoji: i.emoji,
        fotoUrl: i.fotoUrl ?? null,
        categoria: i.categoria,
        urgencia: i.urgencia,
        atualizadoEm: agora,
      })
    );
  });

  // Um lote do Firestore aceita até 500 operações; usamos 400 por segurança.
  for (let i = 0; i < operacoes.length; i += 400) {
    const batch = writeBatch(db);
    operacoes.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}
