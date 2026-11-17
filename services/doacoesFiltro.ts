import type { Doacao } from './tipos';

/**
 * Filtro do histórico de doações do doador.
 *  - andamento: ainda em análise ou combinando a entrega (status 'pendente' ou 'aprovada')
 *  - entregues: doações já entregues e recebidas pela ONG (status 'recebida')
 *  - recusadas: doações não aceitas pela ONG (status 'recusada')
 * Os status vêm do banco; não existe um status "cancelada" separado.
 */
export type FiltroDoacao = 'todas' | 'andamento' | 'entregues' | 'recusadas';

export const FILTROS_DOACAO: { id: FiltroDoacao; emoji: string; rotulo: string; rotuloCurto: string }[] = [
  { id: 'todas',     emoji: '📋', rotulo: 'Todas',                  rotuloCurto: 'Todas' },
  { id: 'andamento', emoji: '⏳', rotulo: 'Em andamento',           rotuloCurto: 'Em andamento' },
  { id: 'entregues', emoji: '✅', rotulo: 'Entregues',              rotuloCurto: 'Entregues' },
  { id: 'recusadas', emoji: '🚫', rotulo: 'Recusadas / canceladas', rotuloCurto: 'Recusadas' },
];

export function filtrarDoacoes(lista: Doacao[], filtro: FiltroDoacao): Doacao[] {
  if (filtro === 'andamento') return lista.filter((d) => d.status === 'pendente' || d.status === 'aprovada');
  if (filtro === 'entregues') return lista.filter((d) => d.status === 'recebida');
  if (filtro === 'recusadas') return lista.filter((d) => d.status === 'recusada');
  return lista;
}

export function contarPorFiltro(lista: Doacao[]): Record<FiltroDoacao, number> {
  return {
    todas: lista.length,
    andamento: filtrarDoacoes(lista, 'andamento').length,
    entregues: filtrarDoacoes(lista, 'entregues').length,
    recusadas: filtrarDoacoes(lista, 'recusadas').length,
  };
}
