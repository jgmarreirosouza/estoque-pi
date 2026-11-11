import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { StatusDoacao } from '../../services/tipos';

const TEXTO: Record<StatusDoacao, { label: string; ajuda: string }> = {
  pendente: { label: 'Pendente', ajuda: 'A equipe da ONG ainda vai analisar sua sugestão.' },
  aprovada: { label: 'Aprovada', ajuda: 'Aprovada! A equipe vai combinar a entrega com você.' },
  recebida: { label: 'Recebida', ajuda: 'Recebemos sua doação. Muito obrigado! 💙' },
  recusada: { label: 'Recusada', ajuda: 'A ONG não pôde aceitar esta sugestão. Obrigado por oferecer!' },
};

export function useStatusInfo(status: StatusDoacao) {
  const { colors } = useTheme();
  const cores =
    status === 'recebida'
      ? { fundo: colors.riscoSeguroLight, texto: colors.riscoSeguroDark, ponto: colors.riscoSeguro }
      : status === 'aprovada'
      ? { fundo: colors.primaryLight, texto: colors.primaryDark, ponto: colors.primary }
      : status === 'recusada'
      ? { fundo: colors.riscoAltoLight, texto: colors.riscoAltoDark, ponto: colors.riscoAlto }
      : { fundo: colors.riscoAtencaoLight, texto: colors.riscoAtencaoDark, ponto: colors.riscoAtencao };
  return { ...TEXTO[status], ...cores };
}

export function StatusDoacaoChip({ status }: { status: StatusDoacao }) {
  const info = useStatusInfo(status);
  return (
    <View style={[styles.chip, { backgroundColor: info.fundo }]}>
      <View style={[styles.ponto, { backgroundColor: info.ponto }]} />
      <Text style={[styles.texto, { color: info.texto }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  ponto: { width: 7, height: 7, borderRadius: 4 },
  texto: { fontSize: 12, fontWeight: '700' },
});
