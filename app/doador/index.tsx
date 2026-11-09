import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../theme';
import { SkeletonLista } from '../../components/SkeletonCard';
import { FadeDown, FadeIn } from '../../components/AnimEntrance';
import { NecessidadePublica, UrgenciaNecessidade } from '../../services/tipos';
import { subscribeNecessidadesPublicas } from '../../services/necessidadesPublicasService';
import { useAuth } from '../../contexts/AuthContext';
import { sairDaConta } from '../../services/authService';

// ── Grupos de urgência exibidos ao doador ────────────────────────────────────

const GRUPOS: { urgencia: UrgenciaNecessidade; titulo: string; descricao: string }[] = [
  { urgencia: 'urgente', titulo: 'PRECISAMOS COM URGÊNCIA', descricao: 'Itens em falta ou acabando' },
  { urgencia: 'atencao', titulo: 'EM BREVE',                descricao: 'Vamos precisar nas próximas semanas' },
  { urgencia: 'geral',   titulo: 'TAMBÉM AJUDAM',           descricao: 'Itens que sempre fazem diferença' },
];

// ── Card de um item da lista ─────────────────────────────────────────────────

function NecessidadeCard({ item, index }: { item: NecessidadePublica; index: number }) {
  const { colors } = useTheme();

  function handleDoar() {
    router.push({
      pathname: '/doador/doar',
      params: { produtoId: item.id, nome: item.nome, emoji: item.emoji },
    });
  }

  return (
    <FadeDown delay={Math.min(index, 6) * 70} duration={400}>
      <TouchableOpacity
        style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleDoar}
        activeOpacity={0.8}
        accessibilityLabel={`${item.nome}. Toque para sugerir uma doação deste item.`}
      >
        <View style={[styles.itemEmojiBg, { backgroundColor: colors.surfaceSecondary }]}>
          {item.fotoUrl ? (
            <Image source={{ uri: item.fotoUrl }} style={styles.itemFoto} />
          ) : (
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
          )}
        </View>

        <Text style={[styles.itemNome, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.nome}
        </Text>

        <View style={[styles.itemBotao, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.itemBotaoTexto, { color: colors.primaryDark }]}>Quero doar</Text>
        </View>
      </TouchableOpacity>
    </FadeDown>
  );
}

// ── Tela ─────────────────────────────────────────────────────────────────────

export default function DoadorInicioScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [itens, setItens] = useState<NecessidadePublica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 6000);
    const unsub = subscribeNecessidadesPublicas(
      (d) => {
        setItens(d);
        setErro(false);
        setCarregando(false);
      },
      () => {
        setErro(true);
        setCarregando(false);
      }
    );
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const porGrupo = useMemo(
    () => GRUPOS.map((g) => ({ ...g, itens: itens.filter((i) => i.urgencia === g.urgencia) })),
    [itens]
  );

  const corGrupo = (u: UrgenciaNecessidade) =>
    u === 'urgente'
      ? { ponto: colors.riscoAlto,    fundo: colors.riscoAltoLight,    texto: colors.riscoAltoDark }
      : u === 'atencao'
        ? { ponto: colors.riscoAtencao, fundo: colors.riscoAtencaoLight, texto: colors.riscoAtencaoDark }
        : { ponto: colors.riscoSeguro,  fundo: colors.riscoSeguroLight,  texto: colors.riscoSeguroDark };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.coluna}>

          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.logoEmoji}>🏠</Text>
            </View>
            <Text style={[styles.titulo, { color: colors.textPrimary }]}>Casa da Criança</Text>
            <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
              Itapira/SP · Como você pode ajudar
            </Text>
          </View>

          {/* Introdução */}
          <View style={[styles.introCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={styles.introEmoji}>💙</Text>
            <Text style={[styles.introTexto, { color: colors.primaryDark }]}>
              Veja o que estamos precisando e escolha um item para sugerir sua doação. A nossa
              equipe analisa cada sugestão e combina a entrega com você.
            </Text>
          </View>

          {/* Lista */}
          {carregando ? (
            <SkeletonLista n={3} />
          ) : erro ? (
            <FadeIn duration={400} style={[styles.vazioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.vazioEmoji}>📡</Text>
              <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Lista indisponível</Text>
              <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
                Não foi possível carregar a lista agora. Tente novamente em alguns instantes
                ou sugira uma doação abaixo.
              </Text>
            </FadeIn>
          ) : itens.length === 0 ? (
            <FadeIn duration={400} style={[styles.vazioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.vazioEmoji}>🎉</Text>
              <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Tudo em dia por aqui!</Text>
              <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
                No momento não há itens na lista. Você ainda pode sugerir uma doação — toda ajuda é bem-vinda.
              </Text>
            </FadeIn>
          ) : (
            porGrupo
              .filter((g) => g.itens.length > 0)
              .map((g) => {
                const cor = corGrupo(g.urgencia);
                return (
                  <View key={g.urgencia} style={styles.secao}>
                    <View style={styles.secaoHeaderRow}>
                      <View style={[styles.secaoDot, { backgroundColor: cor.ponto }]} />
                      <Text style={[styles.secaoTitulo, { color: colors.textSecondary }]}>{g.titulo}</Text>
                      <View style={[styles.secaoCount, { backgroundColor: cor.fundo }]}>
                        <Text style={[styles.secaoCountTexto, { color: cor.texto }]}>{g.itens.length}</Text>
                      </View>
                    </View>
                    <Text style={[styles.secaoDesc, { color: colors.textSecondary }]}>{g.descricao}</Text>
                    <View style={styles.lista}>
                      {g.itens.map((item, i) => (
                        <NecessidadeCard key={item.id} item={item} index={i} />
                      ))}
                    </View>
                  </View>
                );
              })
          )}

          {/* Outro item */}
          <TouchableOpacity
            style={[styles.outroBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
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

          {/* Conta */}
          <View style={styles.rodape}>
            {user ? (
              <TouchableOpacity
                onPress={() => sairDaConta()}
                activeOpacity={0.6}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Sair da conta"
              >
                <Text style={[styles.rodapeTexto, { color: colors.textDisabled }]}>
                  {user.email} · Sair
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/login')}
                activeOpacity={0.6}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Entrar ou criar conta"
              >
                <Text style={[styles.rodapeTexto, { color: colors.textDisabled }]}>
                  Entrar ou criar conta · Equipe da ONG também entra por aqui
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  // Em telas largas (navegador) mantém uma coluna legível no centro.
  coluna: { width: '100%', maxWidth: 640, alignSelf: 'center' },

  header:     { alignItems: 'center', gap: 8, marginBottom: 22 },
  logoWrap:   { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logoEmoji:  { fontSize: 44 },
  titulo:     { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo:  { fontSize: 15, textAlign: 'center' },

  introCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 28 },
  introEmoji: { fontSize: 26 },
  introTexto: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '500' },

  // Seções
  secao:          { marginBottom: 28 },
  secaoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  secaoDot:       { width: 8, height: 8, borderRadius: 4 },
  secaoTitulo:    { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, flex: 1 },
  secaoCount:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  secaoCountTexto:{ fontSize: 12, fontWeight: '700' },
  secaoDesc:      { fontSize: 14, marginBottom: 12, lineHeight: 20 },

  lista: { gap: 10 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  itemEmojiBg:    { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  itemEmoji:      { fontSize: 26 },
  itemFoto:       { width: 50, height: 50, borderRadius: 14 },
  itemNome:       { flex: 1, fontSize: 17, fontWeight: '700' },
  itemBotao:      { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
  itemBotaoTexto: { fontSize: 14, fontWeight: '700' },

  // Estado vazio / erro
  vazioCard:   { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10, marginBottom: 24 },
  vazioEmoji:  { fontSize: 48 },
  vazioTitulo: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  vazioSub:    { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // Doar outro item
  outroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1.5, padding: 18,
  },
  outroEmoji:  { fontSize: 28 },
  outroTitulo: { fontSize: 16, fontWeight: '800' },
  outroSub:    { fontSize: 13, marginTop: 2, lineHeight: 18 },
  outroSeta:   { fontSize: 26, fontWeight: '300' },

  rodape:      { alignItems: 'center', marginTop: 32 },
  rodapeTexto: { fontSize: 13, textDecorationLine: 'underline' },
});
