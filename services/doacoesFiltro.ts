import type { Doacao } from './tipos';

/**
 * Filtro do histórico de doações do doador.
 *  - concluidas: doações já recebidas pela ONG (status 'recebida')
 *  - recusadas:  doações não aceitas pela ONG (status 'recusada')
 * Os status vêm do banco; não existe um status "cancelada" separado.
 */
export type FiltroDoacao = 'todas' | 'concluidas' | 'recusadas';

export const FILTROS_DOACAO: { id: FiltroDoacao; emoji: string; rotulo: string; rotuloCurto: string }[] = [
  { id: 'todas',      emoji: '📋', rotulo: 'Todas',                       rotuloCurto: 'Todas' },
  { id: 'concluidas', emoji: '✅', rotulo: 'Concluídas / entregues',      rotuloCurto: 'Concluídas' },
  { id: 'recusadas',  emoji: '🚫', rotulo: 'Recusadas / canceladas',      rotuloCurto: 'Recusadas' },
];

export function filtrarDoacoes(lista: Doacao[], filtro: FiltroDoacao): Doacao[] {
  if (filtro === 'concluidas') return lista.filter((d) => d.status === 'recebida');
  if (filtro === 'recusadas') return lista.filter((d) => d.status === 'recusada');
  return lista;
}

export function contarPorFiltro(lista: Doacao[]): Record<FiltroDoacao, number> {
  return {
    todas: lista.length,
    concluidas: filtrarDoacoes(lista, 'concluidas').length,
    recusadas: filtrarDoacoes(lista, 'recusadas').length,
  };
}
