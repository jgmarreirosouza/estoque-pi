import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ReactNode } from 'react';
import { useTheme } from '../theme';
import { NivelRisco } from '../services/tipos';
import { RiskBadge } from './RiskBadge';
import { useLayout } from '../utils/useLayout';

/** Colunas da grade de cards (web / tablet). */
export function useColunasGrade(): number {
  const { width } = useLayout();
  return width >= 1100 ? 4 : width >= 900 ? 3 : 2;
}

/** Grade responsiva: cada filho ocupa 1/colunas da largura, com espaço entre eles. */
export function GradeCards({ children, colunas }: { children: ReactNode; colunas: number }) {
  const pct = `${100 / colunas}%` as const;
  return (
    <View style={styles.grade}>
      {(Array.isArray(children) ? children : [children]).map((c: any, i: number) => (
        <View key={c?.key ?? i} style={[styles.celula, { width: pct }]}>
          {c}
        </View>
      ))}
    </View>
  );
}

function formatarData(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

interface Props {
  nome: string;
  emoji: string;
  fotoUrl?: string;
  /** Linha de apoio abaixo do nome (ex.: total em estoque ou categoria). */
  subtitulo: string;
  /** Cor da faixa superior (risco geral). Sem ela usa a cor da borda. */
  risco?: NivelRisco | null;
  countLotes?: number;
  /** Validade do lote que vence primeiro (AAAA-MM-DD) e seus dados. */
  validadeProxima?: string;
  diasProxima?: number;
  riscoProxima?: NivelRisco | null;
  /** Texto do selo quando não há lotes (ex.: "Aguardando"). */
  seloVazio?: string;
  /** Botão extra dentro do card (ex.: "Adicionar lote" em produto sem lotes). */
  acao?: { label: string; onPress: () => void };
  onPress: () => void;
}

export function CardProdutoQuadrado(p: Props) {
  const { colors } = useTheme();
  const faixa =
    p.risco === 'risco_alto' ? colors.riscoAlto
    : p.risco === 'atencao'  ? colors.riscoAtencao
    : p.risco === 'seguro'   ? colors.riscoSeguro
    : colors.border;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderTopColor: faixa }]}
      onPress={p.onPress}
      activeOpacity={0.8}
      accessibilityLabel={`${p.nome}, ${p.subtitulo}${p.validadeProxima ? `, vence em ${formatarData(p.validadeProxima)}` : ''}`}
    >
      <View style={[styles.midia, { backgroundColor: colors.surfaceSecondary }]}>
        {p.fotoUrl
          ? <Image source={{ uri: p.fotoUrl }} style={styles.foto} resizeMode="cover" />
          : <Text style={styles.emoji}>{p.emoji}</Text>}
      </View>

      <View style={styles.corpo}>
        <Text style={[styles.nome, { color: colors.textPrimary }]} numberOfLines={2}>{p.nome}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{p.subtitulo}</Text>

        {p.validadeProxima !== undefined ? (
          <View style={styles.rodape}>
            <RiskBadge risco={p.riscoProxima ?? null} diasParaVencer={p.diasProxima} />
            <Text style={[styles.val, { color: colors.textDisabled }]} numberOfLines={1}>
              val. {formatarData(p.validadeProxima)}
              {p.countLotes ? ` · ${p.countLotes} ${p.countLotes === 1 ? 'lote' : 'lotes'}` : ''}
            </Text>
          </View>
        ) : (
          <View style={[styles.selo, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.seloTexto, { color: colors.textDisabled }]}>{p.seloVazio ?? 'Aguardando'}</Text>
          </View>
        )}

        {p.acao && (
          <TouchableOpacity
            style={[styles.acao, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            onPress={p.acao.onPress}
            activeOpacity={0.8}
            accessibilityLabel={p.acao.label}
          >
            <Text style={[styles.acaoTexto, { color: colors.primaryDark }]}>{p.acao.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  grade:  { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  celula: { padding: 8 },
  card: {
    aspectRatio: 1,
    borderRadius: 18, borderWidth: 1, borderTopWidth: 5,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  midia:  { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  foto:   { width: '100%', height: '100%' },
  emoji:  { fontSize: 56 },
  corpo:  { padding: 14, gap: 4 },
  nome:   { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  sub:    { fontSize: 13 },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  val:    { fontSize: 12 },
  acao:   { alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6 },
  acaoTexto: { fontSize: 13, fontWeight: '700' },
  selo:   { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginTop: 6 },
  seloTexto: { fontSize: 13, fontWeight: '700' },
});
