import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CabecalhoApp, BotaoEngrenagem, AbaCabecalho } from './CabecalhoApp';

/**
 * Cabeçalho da ONG na web em tela larga: o MESMO cabeçalho da área do doador
 * (logo + nome, abas na largura toda com indicador deslizante e ⚙️ nas configurações).
 * No celular continua a barra de abas de baixo, sem alteração.
 */
const ICONES: Record<string, string> = {
  index: '🏠',
  estoque: '📦',
  produtos: '📋',
  historico: '🗂️',
};

export function TopoBarOng({ state, descriptors, navigation }: BottomTabBarProps) {
  const rotaAtiva = state.routes[state.index]?.name;
  const emConfig = rotaAtiva === 'configuracoes';

  const abas: AbaCabecalho[] = state.routes
    .filter((r) => r.name !== 'configuracoes' && r.name !== 'produtos')
    .map((r) => ({
      id: r.name,
      emoji: ICONES[r.name] ?? '•',
      label: descriptors[r.key].options.title ?? r.name,
    }));

  return (
    <CabecalhoApp
      titulo="Casa da Criança"
      subtitulo="Painel da ONG"
      larguraMax={1160}
      abas={abas}
      abaAtiva={emConfig ? undefined : rotaAtiva}
      onSelecionar={(id) => navigation.navigate(id as never)}
      direita={<BotaoEngrenagem ativo={emConfig} onPress={() => navigation.navigate('configuracoes' as never)} />}
    />
  );
}
