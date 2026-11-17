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
  it('"concluidas" devolve só as recebidas', () => {
    expect(filtrarDoacoes(LISTA, 'concluidas').map((x) => x.id)).toEqual(['3', '4']);
  });
  it('"recusadas" devolve só as recusadas', () => {
    expect(filtrarDoacoes(LISTA, 'recusadas').map((x) => x.id)).toEqual(['5']);
  });
  it('doações pendentes e aprovadas só aparecem em "todas"', () => {
    expect(filtrarDoacoes(LISTA, 'concluidas').some((x) => x.status === 'pendente' || x.status === 'aprovada')).toBe(false);
    expect(filtrarDoacoes(LISTA, 'recusadas').some((x) => x.status === 'pendente' || x.status === 'aprovada')).toBe(false);
  });
  it('lista vazia não quebra', () => {
    expect(filtrarDoacoes([], 'concluidas')).toEqual([]);
  });
  it('contarPorFiltro soma corretamente', () => {
    expect(contarPorFiltro(LISTA)).toEqual({ todas: 5, concluidas: 2, recusadas: 1 });
  });
});
