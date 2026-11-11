import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';

/**
 * Cabeçalho da ONG na web em tela larga — mesmo padrão do painel do doador:
 * logo + nome à esquerda, abas no meio e só um ícone ⚙️ para as configurações.
 * (No celular continua a barra de abas de baixo, sem alteração.)
 */
const ICONES: Record<string, string> = {
  index: '🏠',
  estoque: '📦',
  produtos: '📋',
  historico: '🗂️',
};

export function TopoBarOng({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const rotaAtiva = state.routes[state.index]?.name;
  const emConfig = rotaAtiva === 'configuracoes';

  return (
    <View style={[styles.barra, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.logo, { backgroundColor: colors.primaryLight }]}>
        <Text style={styles.logoEmoji}>🏠</Text>
      </View>
      <View style={styles.marca}>
        <Text style={[styles.titulo, { color: colors.textPrimary }]} numberOfLines={1}>Casa da Criança</Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]} numberOfLines={1}>Painel da ONG</Text>
      </View>

      <View style={styles.abas}>
        {state.routes
          .filter((r) => r.name !== 'configuracoes' && r.name !== 'produtos')
          .map((r) => {
            const ativa = r.name === rotaAtiva;
            const titulo = descriptors[r.key].options.title ?? r.name;
            return (
              <TouchableOpacity
                key={r.key}
                style={[styles.aba, ativa && { backgroundColor: colors.primaryLight }]}
                onPress={() => navigation.navigate(r.name as never)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: ativa }}
              >
                <Text style={[styles.abaIcone, { opacity: ativa ? 1 : 0.6 }]}>{ICONES[r.name] ?? '•'}</Text>
                <Text style={[styles.abaTexto, { color: ativa ? colors.primary : colors.textSecondary }]}>{titulo}</Text>
              </TouchableOpacity>
            );
          })}
      </View>

      <TouchableOpacity
        style={[styles.engrenagem, { backgroundColor: emConfig ? colors.primaryLight : colors.surfaceSecondary }]}
        onPress={() => navigation.navigate('configuracoes' as never)}
        activeOpacity={0.75}
        accessibilityLabel="Configurações"
      >
        <Text style={styles.engrenagemIcone}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1,
  },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 24 },
  marca: { minWidth: 150 },
  titulo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitulo: { fontSize: 12 },
  abas: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 24 },
  aba: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  abaIcone: { fontSize: 18 },
  abaTexto: { fontSize: 14, fontWeight: '700' },
  engrenagem: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  engrenagemIcone: { fontSize: 20 },
});
