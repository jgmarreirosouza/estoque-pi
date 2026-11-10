import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTheme } from '../../theme';
import { SkeletonLista } from '../SkeletonCard';
import { FadeIn } from '../AnimEntrance';
import { NecessidadePublica, UrgenciaNecessidade } from '../../services/tipos';
import { CardNecessidade, nomeCategoria } from './CardNecessidade';
import { Grade } from './Grade';

const GRUPOS: { urgencia: UrgenciaNecessidade; titulo: string; descricao: string }[] = [
  { urgencia: 'urgente', titulo: 'PRECISAMOS COM URGÊNCIA', descricao: 'Itens em falta ou acabando' },
  { urgencia: 'atencao', titulo: 'EM BREVE',                descricao: 'Vamos precisar nas próximas semanas' },
  { urgencia: 'geral',   titulo: 'TAMBÉM AJUDAM',           descricao: 'Itens que sempre fazem diferença' },
];

interface Props {
  itens: NecessidadePublica[];
  carregando: boolean;
  erro: boolean;
  colunas: number;
}

export function AbaNecessidades({ itens, carregando, erro, colunas }: Props) {
  const { colors } = useTheme();
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);

  const categorias = useMemo(
    () => Array.from(new Set(itens.map((i) => i.categoria).filter(Boolean))),
    [itens]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter(
      (i) =>
        (!categoria || i.categoria === categoria) &&
        (!termo || i.nome.toLowerCase().includes(termo))
    );
  }, [itens, busca, categoria]);

  const porGrupo = useMemo(
    () => GRUPOS.map((g) => ({ ...g, itens: filtrados.filter((i) => i.urgencia === g.urgencia) })),
    [filtrados]
  );

  const urgentes = itens.filter((i) => i.urgencia === 'urgente').length;
  const emBreve = itens.filter((i) => i.urgencia === 'atencao').length;

  const corGrupo = (u: UrgenciaNecessidade) =>
    u === 'urgente'
      ? { ponto: colors.riscoAlto, fundo: colors.riscoAltoLight, texto: colors.riscoAltoDark }
      : u === 'atencao'
      ? { ponto: colors.riscoAtencao, fundo: colors.riscoAtencaoLight, texto: colors.riscoAtencaoDark }
      : { ponto: colors.riscoSeguro, fundo: colors.riscoSeguroLight, texto: colors.riscoSeguroDark };

  return (
    <View>
      {/* Introdução */}
      <View style={[styles.intro, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
        <Text style={styles.introEmoji}>💙</Text>
        <Text style={[styles.introTexto, { color: colors.primaryDark }]}>
          Veja o que estamos precisando e escolha um item para sugerir sua doação. A nossa equipe
          analisa cada sugestão e combina a entrega com você.
        </Text>
      </View>

      {/* Resumo */}
      {!carregando && !erro && itens.length > 0 && (
        <View style={styles.resumo}>
          <View style={[styles.resumoCard, { backgroundColor: colors.riscoAltoLight }]}>
            <Text style={[styles.resumoNum, { color: colors.riscoAltoDark }]}>{urgentes}</Text>
            <Text style={[styles.resumoLabel, { color: colors.riscoAltoDark }]}>urgentes</Text>
          </View>
          <View style={[styles.resumoCard, { backgroundColor: colors.riscoAtencaoLight }]}>
            <Text style={[styles.resumoNum, { color: colors.riscoAtencaoDark }]}>{emBreve}</Text>
            <Text style={[styles.resumoLabel, { color: colors.riscoAtencaoDark }]}>em breve</Text>
          </View>
          <View style={[styles.resumoCard, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.resumoNum, { color: colors.primaryDark }]}>{itens.length}</Text>
            <Text style={[styles.resumoLabel, { color: colors.primaryDark }]}>itens na lista</Text>
          </View>
        </View>
      )}

      {/* Busca e categorias */}
      {!carregando && !erro && itens.length > 0 && (
        <View style={styles.filtros}>
          <View style={[styles.busca, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 16 }}>🔎</Text>
            <TextInput
              style={[styles.buscaInput, { color: colors.textPrimary }]}
              placeholder="Buscar item…"
              placeholderTextColor={colors.textDisabled}
              value={busca}
              onChangeText={setBusca}
              maxLength={40}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[null, ...categorias].map((c) => {
              const ativo = categoria === c;
              return (
                <TouchableOpacity
                  key={c ?? 'todas'}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: ativo ? colors.primary : colors.surfaceSecondary,
                      borderColor: ativo ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCategoria(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTexto, { color: ativo ? '#FFF' : colors.textSecondary }]}>
                    {c ? nomeCategoria(c) : 'Todas'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Lista */}
      {carregando ? (
        <SkeletonLista n={3} />
      ) : erro ? (
        <FadeIn duration={400} style={[styles.vazio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.vazioEmoji}>📡</Text>
          <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Lista indisponível</Text>
          <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
            Não foi possível carregar a lista agora. Tente novamente em alguns instantes
            ou sugira uma doação abaixo.
          </Text>
        </FadeIn>
      ) : itens.length === 0 ? (
        <FadeIn duration={400} style={[styles.vazio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.vazioEmoji}>🎉</Text>
          <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Tudo em dia por aqui!</Text>
          <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
            No momento não há itens na lista. Você ainda pode sugerir uma doação — toda ajuda é bem-vinda.
          </Text>
        </FadeIn>
      ) : filtrados.length === 0 ? (
        <View style={[styles.vazio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.vazioEmoji}>🔍</Text>
          <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Nada encontrado</Text>
          <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
            Nenhum item combina com a busca. Limpe o filtro ou sugira outro item abaixo.
          </Text>
        </View>
      ) : (
        porGrupo
          .filter((g) => g.itens.length > 0)
          .map((g) => {
            const cor = corGrupo(g.urgencia);
            return (
              <View key={g.urgencia} style={styles.secao}>
                <View style={styles.secaoTopo}>
                  <View style={[styles.secaoDot, { backgroundColor: cor.ponto }]} />
                  <Text style={[styles.secaoTitulo, { color: colors.textSecondary }]}>{g.titulo}</Text>
                  <View style={[styles.secaoCount, { backgroundColor: cor.fundo }]}>
                    <Text style={[styles.secaoCountTexto, { color: cor.texto }]}>{g.itens.length}</Text>
                  </View>
                </View>
                <Text style={[styles.secaoDesc, { color: colors.textSecondary }]}>{g.descricao}</Text>
                <Grade colunas={colunas}>
                  {g.itens.map((item, i) => (
                    <CardNecessidade key={item.id} item={item} index={i} compacto={colunas === 1} />
                  ))}
                </Grade>
              </View>
            );
          })
      )}

      {/* Outro item */}
      <TouchableOpacity
        style={[styles.outro, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
        onPress={() => router.push('/doador/doar')}
        activeOpacity={0.85}
        accessibilityLabel="Sugerir a doação de outro item"
      >
        <Text style={styles.outroEmoji}>🎁</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.outroTitulo, { color: colors.accent }]}>Quero doar outro item</Text>
          <Text style={[styles.outroSub, { color: colors.textSecondary }]}>
            Não encontrou na lista? Conte o que você gostaria de doar.
          </Text>
        </View>
        <Text style={[styles.outroSeta, { color: colors.accent }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  introEmoji: { fontSize: 26 },
  introTexto: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '500' },

  resumo: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resumoCard: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  resumoNum: { fontSize: 26, fontWeight: '800' },
  resumoLabel: { fontSize: 12, fontWeight: '600' },

  filtros: { gap: 10, marginBottom: 20 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 46 },
  buscaInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  chips: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTexto: { fontSize: 13, fontWeight: '700' },

  secao: { marginBottom: 24 },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  secaoDot: { width: 8, height: 8, borderRadius: 4 },
  secaoTitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, flex: 1 },
  secaoCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  secaoCountTexto: { fontSize: 12, fontWeight: '700' },
  secaoDesc: { fontSize: 14, marginBottom: 8, lineHeight: 20 },

  vazio: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10, marginBottom: 24 },
  vazioEmoji: { fontSize: 48 },
  vazioTitulo: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  vazioSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  outro: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1.5, padding: 18 },
  outroEmoji: { fontSize: 28 },
  outroTitulo: { fontSize: 16, fontWeight: '800' },
  outroSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  outroSeta: { fontSize: 26, fontWeight: '300' },
});
