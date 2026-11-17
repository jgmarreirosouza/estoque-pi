import { filtrarDoacoes, contarPorFiltro } from '../services/doacoesFiltro';
import type { Doacao } from '../services/tipos';

const d = (id: string, status: Doacao['status']): Doacao =>
  ({ id, status } as unknown as Doacao);

const LISTA = [
  d('1', 'pendente'),
  d('2', 'aprovada'),
  d('3', 'recebida'),
  d('4', 'recebida'),
  d('5', 'recusada'),
];

describe('filtrarDoacoes (histórico do doador)', () => {
  it('"todas" devolve a lista completa', () => {
    expect(filtrarDoacoes(LISTA, 'todas')).toHaveLength(5);
  });
  it('"entregues" devolve só as recebidas pela ONG', () => {
    expect(filtrarDoacoes(LISTA, 'entregues').map((x) => x.id)).toEqual(['3', '4']);
  });
  it('"andamento" devolve as pendentes e as aprovadas', () => {
    expect(filtrarDoacoes(LISTA, 'andamento').map((x) => x.id)).toEqual(['1', '2']);
  });
  it('"recusadas" devolve só as recusadas', () => {
    expect(filtrarDoacoes(LISTA, 'recusadas').map((x) => x.id)).toEqual(['5']);
  });
  it('cada doação aparece em exatamente um filtro específico', () => {
    const soma = filtrarDoacoes(LISTA, 'andamento').length + filtrarDoacoes(LISTA, 'entregues').length + filtrarDoacoes(LISTA, 'recusadas').length;
    expect(soma).toBe(LISTA.length);
  });
  it('lista vazia não quebra', () => {
    expect(filtrarDoacoes([], 'entregues')).toEqual([]);
  });
  it('contarPorFiltro soma corretamente', () => {
    expect(contarPorFiltro(LISTA)).toEqual({ todas: 5, andamento: 2, entregues: 2, recusadas: 1 });
  });
});
