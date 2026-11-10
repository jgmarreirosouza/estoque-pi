import { useWindowDimensions } from 'react-native';

export type Faixa = 'celular' | 'tablet' | 'desktop';

/**
 * Pontos de quebra usados pela versão web (e por tablets).
 * No celular o resultado é sempre 'celular', então nada muda no app mobile.
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const faixa: Faixa = width >= 1100 ? 'desktop' : width >= 700 ? 'tablet' : 'celular';
  const colunas = faixa === 'desktop' ? 3 : faixa === 'tablet' ? 2 : 1;
  return { width, faixa, colunas, largo: faixa !== 'celular' };
}
