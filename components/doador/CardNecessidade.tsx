import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import { FadeDown } from '../AnimEntrance';
import { NecessidadePublica, UrgenciaNecessidade } from '../../services/tipos';
import { CATEGORIAS_PADRAO } from '../../services/categoriasService';

export function nomeCategoria(id: string): string {
  const padrao = CATEGORIAS_PADRAO.find((c) => c.id === id);
  if (padrao) return padrao.label;
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Outros';
}

const ROTULO_URGENCIA: Record<UrgenciaNecessidade, string> = {
  urgente: 'Urgente',
  atencao: 'Em breve',
  geral: 'Sempre ajuda',
};

interface Props {
  item: NecessidadePublica;
  index: number;
  /** true no celular (1 coluna): card horizontal e compacto, como antes. */
  compacto: boolean;
}

export function CardNecessidade({ item, index, compacto }: Props) {
  const { colors } = useTheme();

  const cor =
    item.urgencia === 'urgente'
      ? { fundo: colors.riscoAltoLight, texto: colors.riscoAltoDark }
      : item.urgencia === 'atencao'
      ? { fundo: colors.riscoAtencaoLight, texto: colors.riscoAtencaoDark }
      : { fundo: colors.riscoSeguroLight, texto: colors.riscoSeguroDark };

  function doar() {
    router.push({
      pathname: '/doador/doar',
      params: { produtoId: item.id, nome: item.nome, emoji: item.emoji },
    });
  }

  const midia = item.fotoUrl ? (
    <Image source={{ uri: item.fotoUrl }} style={compacto ? styles.fotoCompacta : styles.foto} resizeMode="cover" />
  ) : (
    <Text style={compacto ? styles.emojiCompacto : styles.emoji}>{item.emoji}</Text>
  );

  return (
    <FadeDown delay={Math.min(index, 6) * 60} duration={380}>
      <TouchableOpacity
        style={[
          compacto ? styles.cardCompacto : styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={doar}
        activeOpacity={0.85}
        accessibilityLabel={`${item.nome}. Toque para sugerir uma doação deste item.`}
      >
        <View
          style={[
            compacto ? styles.midiaCompacta : styles.midia,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          {midia}
        </View>

        <View style={compacto ? { flex: 1, gap: 4 } : { gap: 6 }}>
          <Text style={[styles.nome, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.nome}
          </Text>
          <View style={styles.linhaMeta}>
            <View style={[styles.selo, { backgroundColor: cor.fundo }]}>
              <Text style={[styles.seloTexto, { color: cor.texto }]}>{ROTULO_URGENCIA[item.urgencia]}</Text>
            </View>
            <Text style={[styles.categoria, { color: colors.textSecondary }]} numberOfLines={1}>
              {nomeCategoria(item.categoria)}
            </Text>
          </View>
        </View>

        <View style={[styles.botao, { backgroundColor: colors.primaryLight }, !compacto && { alignSelf: 'stretch' }]}>
          <Text style={[styles.botaoTexto, { color: colors.primaryDark }]}>Quero doar</Text>
        </View>
      </TouchableOpacity>
    </FadeDown>
  );
}

const sombra = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 1 },
  default: {},
});

const styles = StyleSheet.create({
  // Vertical (tablet e computador)
  card: { borderRadius: 18, borderWidth: 1, padding: 12, gap: 12, ...sombra },
  midia: { height: 120, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  foto: { width: '100%', height: 120 },
  emoji: { fontSize: 54 },

  // Horizontal (celular)
  cardCompacto: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 12, ...sombra },
  midiaCompacta: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fotoCompacta: { width: 52, height: 52 },
  emojiCompacto: { fontSize: 26 },

  nome: { fontSize: 16, fontWeight: '700' },
  linhaMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  selo: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  seloTexto: { fontSize: 11, fontWeight: '700' },
  categoria: { fontSize: 12 },

  botao: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontSize: 14, fontWeight: '700' },
});
