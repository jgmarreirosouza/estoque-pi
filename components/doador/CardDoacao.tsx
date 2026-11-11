import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { FadeDown } from '../AnimEntrance';
import { Doacao } from '../../services/tipos';
import { StatusDoacaoChip, useStatusInfo } from './StatusDoacaoChip';

function dataBR(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function CardDoacao({ doacao, index }: { doacao: Doacao; index: number }) {
  const { colors } = useTheme();
  const info = useStatusInfo(doacao.status);

  return (
    <FadeDown delay={Math.min(index, 6) * 50} duration={360}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: info.ponto },
        ]}
      >
        <View style={styles.topo}>
          <View style={[styles.emojiBg, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={styles.emoji}>{doacao.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nome, { color: colors.textPrimary }]} numberOfLines={2}>
              {doacao.nomeItem}
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {doacao.quantidade} {doacao.quantidade === 1 ? 'unidade' : 'unidades'} · {dataBR(doacao.criadoEm)}
            </Text>
          </View>
          <StatusDoacaoChip status={doacao.status} />
        </View>
        <Text style={[styles.ajuda, { color: colors.textSecondary }]}>{info.ajuda}</Text>
        {doacao.status === 'recusada' && !!doacao.motivoRecusa && (
          <View style={[styles.motivo, { backgroundColor: colors.riscoAltoLight, borderColor: colors.riscoAlto }]}>
            <Text style={[styles.motivoTitulo, { color: colors.riscoAltoDark }]}>Motivo informado pela ONG</Text>
            <Text style={[styles.motivoTexto, { color: colors.riscoAltoDark }]}>{doacao.motivoRecusa}</Text>
          </View>
        )}
      </View>
    </FadeDown>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
      default: {},
    }),
  },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiBg: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  nome: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  ajuda: { fontSize: 13, lineHeight: 19 },
  motivo: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  motivoTitulo: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  motivoTexto: { fontSize: 14, lineHeight: 20 },
});
