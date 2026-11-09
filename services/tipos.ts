export type Categoria = string;
export type NivelRisco = 'seguro' | 'atencao' | 'risco_alto';
export type TipoMovimentacao = 'entrada' | 'saida' | 'descarte';

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  emoji: string;
  ean?: string;
  fotoUrl?: string;
  conteudo?: string;
  mediaConsumoDias: number;
  ocultarNecessidades?: boolean;
}

// Compatível com o tipo usado nas telas da Parte 1
export interface Lote {
  id: string;
  produtoId: string;
  codigo: string;
  quantidade: number;
  validade: string;    // ISO date "YYYY-MM-DD"
  risco: NivelRisco | null; // null quando criado offline (classificação pendente)
  dataCadastro: string; // ISO date "YYYY-MM-DD"
}

export interface Movimentacao {
  id: string;
  tipo: TipoMovimentacao;
  produtoId: string;
  loteId: string;
  quantidade: number;
  data: string;        // ISO date "YYYY-MM-DD"
  observacao?: string;
}

// ── Área do doador ───────────────────────────────────────────────────────────

/** Ciclo de vida de uma sugestão de doação. Só 'recebida' conta como doação feita. */
export type StatusDoacao = 'pendente' | 'aprovada' | 'recebida' | 'recusada';

export type UrgenciaNecessidade = 'urgente' | 'atencao' | 'geral';

/**
 * Item da lista PÚBLICA de necessidades (o que o doador enxerga).
 * Propositalmente sem quantidade em estoque, lotes ou validade: esses dados
 * são internos da ONG e ficam nas coleções `produtos` e `lotes`.
 */
export interface NecessidadePublica {
  id: string;            // mesmo id do produto
  nome: string;
  emoji: string;
  fotoUrl?: string;
  categoria: Categoria;
  urgencia: UrgenciaNecessidade;
}

export interface Doacao {
  id: string;
  produtoId?: string;    // preenchido quando o doador escolheu um item da lista
  nomeItem: string;
  emoji: string;
  quantidade: number;
  doadorUid?: string;    // uid da conta do doador (Firebase Auth)
  doadorNome: string;
  doadorContato: string; // telefone ou e-mail
  observacao?: string;
  status: StatusDoacao;
  criadoEm: string;      // ISO 8601 completo
}
