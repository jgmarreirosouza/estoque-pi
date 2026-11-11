import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../theme';
import { SkeletonLista } from '../../components/SkeletonCard';
import { FadeDown, FadeIn } from '../../components/AnimEntrance';
import { Doacao, StatusDoacao } from '../../services/tipos';
import { subscribeToDoacoes, atualizarStatusDoacao, MOTIVO_MIN, MOTIVO_MAX } from '../../services/doacoesService';
import { mensagemErro } from '../../utils/erros';

// ── Configuração de status e ações ───────────────────────────────────────────

const FILTROS: { valor: StatusDoacao; label: string; emoji: string }[] = [
  { valor: 'pendente', label: 'Pendentes', emoji: '⏳' },
  { valor: 'aprovada', label: 'Aprovadas', emoji: '👍' },
  { valor: 'recebida', label: 'Recebidas', emoji: '✅' },
  { valor: 'recusada', label: 'Recusadas', emoji: '🚫' },
];

const ROTULO_STATUS: Record<StatusDoacao, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada — aguardando entrega',
  recebida: 'Recebida',
  recusada: 'Recusada',
};

interface Acao {
  label: string;
  destino: StatusDoacao;
  tipo: 'primaria' | 'secundaria' | 'link';
}

// Cada transição é reversível, então não há confirmação: um clique errado se desfaz.
const ACOES: Record<StatusDoacao, Acao[]> = {
  pendente: [
    { label: 'Aprovar', destino: 'aprovada', tipo: 'primaria' },
    { label: 'Recusar', destino: 'recusada', tipo: 'secundaria' },
  ],
  aprovada: [
    { label: 'Marcar como recebida', destino: 'recebida', tipo: 'primaria' },
    { label: 'Recusar', destino: 'recusada', tipo: 'secundaria' },
  ],
  recebida: [{ label: 'Desfazer', destino: 'aprovada', tipo: 'link' }],
  recusada: [{ label: 'Reabrir', destino: 'pendente', tipo: 'secundaria' }],
};

// ── Auxiliares ───────────────────────────────────────────────────────────────

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

function linkContato(contato: string): { url: string; label: string } | null {
  const c = contato.trim();
  if (c.includes('@')) return { url: `mailto:${c}`, label: '✉️ E-mail' };
  const digitos = c.replace(/\D/g, '');
  if (digitos.length >= 10) {
    const comPais = digitos.startsWith('55') && digitos.length >= 12 ? digitos : `55${digitos}`;
    return { url: `https://wa.me/${comPais}`, label: '💬 WhatsApp' };
  }
  return null;
}

// ── Card de uma sugestão ─────────────────────────────────────────────────────

function DoacaoCard({
  doacao,
  index,
  ocupado,
  onMudar,
}: {
  doacao: Doacao;
  index: number;
  ocupado: boolean;
  onMudar: (id: string, destino: StatusDoacao, motivo?: string) => void;
}) {
  const { colors } = useTheme();
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');

  function confirmarRecusa() {
    if (motivo.trim().length < MOTIVO_MIN) {
      setErroMotivo(`Explique o motivo (mínimo de ${MOTIVO_MIN} caracteres). O doador vai ler este texto.`);
      return;
    }
    onMudar(doacao.id, 'recusada', motivo.trim());
  }

  const cor =
    doacao.status === 'pendente' ? { fundo: colors.riscoAtencaoLight, texto: colors.riscoAtencaoDark, borda: colors.riscoAtencao }
    : doacao.status === 'aprovada' ? { fundo: colors.primaryLight,      texto: colors.primaryDark,      borda: colors.primary }
    : doacao.status === 'recebida' ? { fundo: colors.riscoSeguroLight,  texto: colors.riscoSeguroDark,   borda: colors.riscoSeguro }
    :                                { fundo: colors.surfaceSecondary,  texto: colors.textSecondary,     borda: colors.border };

  const contato = linkContato(doacao.doadorContato);

  function handleRegistrarEstoque() {
    if (doacao.produtoId) {
      router.push({ pathname: '/entrada', params: { produtoId: doacao.produtoId } });
    } else {
      router.push('/entrada');
    }
  }

  return (
    <FadeDown delay={Math.min(index, 6) * 70} duration={400}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: cor.borda }]}>

        {/* Item + quantidade */}
        <View style={styles.cardTopo}>
          <View style={[styles.emojiBg, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={styles.emoji}>{doacao.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemNome, { color: colors.textPrimary }]} numberOfLines={2}>
              {doacao.nomeItem}
            </Text>
            <Text style={[styles.itemQtd, { color: colors.textSecondary }]}>
              {doacao.quantidade} {doacao.quantidade === 1 ? 'unidade' : 'unidades'}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cor.fundo }]}>
            <Text style={[styles.statusTexto, { color: cor.texto }]} numberOfLines={1}>
              {ROTULO_STATUS[doacao.status].split(' — ')[0]}
            </Text>
          </View>
        </View>

        {/* Doador */}
        <View style={[styles.divisor, { backgroundColor: colors.divider }]} />
        <Text style={[styles.doador, { color: colors.textPrimary }]}>👤 {doacao.doadorNome}</Text>
        <Text style={[styles.contato, { color: colors.textSecondary }]} selectable>
          {doacao.doadorContato}
        </Text>
        {doacao.observacao ? (
          <Text style={[styles.observacao, { color: colors.textSecondary }]}>“{doacao.observacao}”</Text>
        ) : null}
        <Text style={[styles.data, { color: colors.textDisabled }]}>
          Enviada em {formatarDataHora(doacao.criadoEm)}
        </Text>

        {doacao.status === 'recusada' && !!doacao.motivoRecusa && (
          <Text style={[styles.dica, { color: colors.riscoAltoDark }]}>Motivo informado: {doacao.motivoRecusa}</Text>
        )}
        {doacao.status === 'aprovada' && (
          <Text style={[styles.dica, { color: colors.primaryDark }]}>
            Combine a entrega com o doador e marque como recebida quando o item chegar.
          </Text>
        )}
        {doacao.status === 'recebida' && (
          <Text style={[styles.dica, { color: colors.riscoSeguroDark }]}>
            Doação concluída. Lembre-se de registrar a entrada no estoque.
          </Text>
        )}

        {/* Recusa: o motivo é obrigatório e aparece para o doador */}
        {recusando && (
          <View style={[styles.motivoBox, { borderColor: colors.riscoAlto, backgroundColor: colors.background }]}>
            <Text style={[styles.motivoLabel, { color: colors.textPrimary }]}>Motivo da recusa (obrigatório)</Text>
            <TextInput
              style={[styles.motivoInput, { color: colors.textPrimary, borderColor: erroMotivo ? colors.riscoAlto : colors.border, backgroundColor: colors.surface }]}
              value={motivo}
              onChangeText={(t) => { setMotivo(t.slice(0, MOTIVO_MAX)); if (erroMotivo) setErroMotivo(''); }}
              placeholder="Ex.: já temos bastante desse item no momento"
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
              maxLength={MOTIVO_MAX}
              autoFocus
            />
            <Text style={[styles.motivoContador, { color: colors.textDisabled }]}>{motivo.length}/{MOTIVO_MAX}</Text>
            {erroMotivo.length > 0 && (
              <Text style={[styles.motivoErro, { color: colors.riscoAltoDark }]}>{erroMotivo}</Text>
            )}
            <View style={styles.acoesRow}>
              <TouchableOpacity
                style={[styles.btnPrimario, { backgroundColor: colors.riscoAlto }]}
                onPress={confirmarRecusa}
                disabled={ocupado}
                activeOpacity={0.85}
              >
                {ocupado
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.btnPrimarioTexto}>Confirmar recusa</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSecundario, { borderColor: colors.border }]}
                onPress={() => { setRecusando(false); setMotivo(''); setErroMotivo(''); }}
                disabled={ocupado}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnSecundarioTexto, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ações */}
        <View style={styles.acoesRow}>
          {contato && (
            <TouchableOpacity
              style={[styles.btnSecundario, { borderColor: colors.border }]}
              onPress={() => Linking.openURL(contato.url).catch(() => {})}
              activeOpacity={0.75}
              accessibilityLabel={`Falar com ${doacao.doadorNome}`}
            >
              <Text style={[styles.btnSecundarioTexto, { color: colors.textSecondary }]}>{contato.label}</Text>
            </TouchableOpacity>
          )}

          {doacao.status === 'recebida' && (
            <TouchableOpacity
              style={[styles.btnPrimario, { backgroundColor: colors.primary }]}
              onPress={handleRegistrarEstoque}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimarioTexto}>📥 Registrar no estoque</Text>
            </TouchableOpacity>
          )}

          {ACOES[doacao.status].filter((a) => !(recusando && a.destino === 'recusada')).map((a) => {
            if (a.tipo === 'link') {
              return (
                <TouchableOpacity
                  key={a.label}
                  onPress={() => onMudar(doacao.id, a.destino)}
                  disabled={ocupado}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.btnLink}
                >
                  <Text style={[styles.btnLinkTexto, { color: colors.textDisabled }]}>{a.label}</Text>
                </TouchableOpacity>
              );
            }
            const primaria = a.tipo === 'primaria';
            return (
              <TouchableOpacity
                key={a.label}
                style={primaria
                  ? [styles.btnPrimario, { backgroundColor: ocupado ? colors.surfaceSecondary : colors.primary }]
                  : [styles.btnSecundario, { borderColor: colors.border }]}
                onPress={() => (a.destino === 'recusada' ? setRecusando(true) : onMudar(doacao.id, a.destino))}
                disabled={ocupado}
                activeOpacity={0.8}
              >
                {ocupado && primaria ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={primaria ? styles.btnPrimarioTexto : [styles.btnSecundarioTexto, { color: colors.textSecondary }]}>
                    {a.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </FadeDown>
  );
}

// ── Tela ─────────────────────────────────────────────────────────────────────

export default function DoacoesScreen() {
  const { colors } = useTheme();
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');
  const [filtro, setFiltro] = useState<StatusDoacao>('pendente');
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 6000);
    const unsub = subscribeToDoacoes(
      (d) => {
        setDoacoes(d);
        setErroCarga('');
        setCarregando(false);
      },
      (e) => {
        setErroCarga(mensagemErro(e, 'Não foi possível carregar as sugestões.'));
        setCarregando(false);
      }
    );
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const contagem = useMemo(() => {
    const c: Record<StatusDoacao, number> = { pendente: 0, aprovada: 0, recebida: 0, recusada: 0 };
    doacoes.forEach((d) => { c[d.status] += 1; });
    return c;
  }, [doacoes]);

  const unidadesRecebidas = useMemo(
    () => doacoes.filter((d) => d.status === 'recebida').reduce((s, d) => s + d.quantidade, 0),
    [doacoes]
  );

  const visiveis = useMemo(() => doacoes.filter((d) => d.status === filtro), [doacoes, filtro]);

  async function handleMudar(id: string, destino: StatusDoacao, motivo?: string) {
    setAtualizandoId(id);
    setErroAcao('');
    try {
      await atualizarStatusDoacao(id, destino, motivo);
    } catch (e) {
      setErroAcao(mensagemErro(e, 'Não foi possível atualizar a sugestão. Tente novamente.'));
    } finally {
      setAtualizandoId(null);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={[styles.headerIconBg, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.headerIcon}>📬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: colors.textPrimary }]}>Sugestões de Doação</Text>
            <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
              {contagem.pendente === 0
                ? 'Nenhuma sugestão pendente'
                : `${contagem.pendente} ${contagem.pendente === 1 ? 'sugestão aguardando' : 'sugestões aguardando'} análise`}
            </Text>
          </View>
        </View>

        {/* Resumo das doações concluídas */}
        {contagem.recebida > 0 && (
          <FadeIn duration={400} style={[styles.resumoCard, { backgroundColor: colors.riscoSeguroLight, borderColor: colors.riscoSeguro }]}>
            <Text style={styles.resumoEmoji}>✅</Text>
            <Text style={[styles.resumoTexto, { color: colors.riscoSeguroDark }]}>
              {contagem.recebida} {contagem.recebida === 1 ? 'doação recebida' : 'doações recebidas'} · {unidadesRecebidas}{' '}
              {unidadesRecebidas === 1 ? 'unidade' : 'unidades'}
            </Text>
          </FadeIn>
        )}

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {FILTROS.map((f) => {
            const ativo = filtro === f.valor;
            return (
              <TouchableOpacity
                key={f.valor}
                style={[styles.chip, { backgroundColor: ativo ? colors.primary : colors.surface, borderColor: ativo ? colors.primary : colors.border }]}
                onPress={() => setFiltro(f.valor)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipEmoji}>{f.emoji}</Text>
                <Text style={[styles.chipLabel, { color: ativo ? '#FFFFFF' : colors.textSecondary }]}>
                  {f.label} ({contagem[f.valor]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {erroAcao.length > 0 && (
          <View style={[styles.erroWrap, { backgroundColor: colors.riscoAltoLight }]}>
            <Text style={[styles.erroTexto, { color: colors.riscoAltoDark }]}>{erroAcao}</Text>
          </View>
        )}

        {/* Lista */}
        {carregando ? (
          <SkeletonLista n={3} />
        ) : erroCarga ? (
          <View style={[styles.vazioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.vazioEmoji}>⚠️</Text>
            <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Não foi possível carregar</Text>
            <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>{erroCarga}</Text>
          </View>
        ) : visiveis.length === 0 ? (
          <View style={[styles.vazioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.vazioEmoji}>{FILTROS.find((f) => f.valor === filtro)?.emoji}</Text>
            <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Nada por aqui</Text>
            <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
              {filtro === 'pendente'
                ? 'Quando um doador enviar uma sugestão, ela aparece aqui para você analisar.'
                : 'Nenhuma sugestão neste estado.'}
            </Text>
          </View>
        ) : (
          <View style={styles.lista}>
            {visiveis.map((d, i) => (
              <DoacaoCard
                key={d.id}
                doacao={d}
                index={i}
                ocupado={atualizandoId === d.id}
                onMudar={handleMudar}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24, width: '100%', maxWidth: 720, alignSelf: 'center' },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerIconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerIcon:   { fontSize: 30 },
  titulo:       { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitulo:    { fontSize: 14, marginTop: 2, lineHeight: 20 },

  resumoCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  resumoEmoji: { fontSize: 20 },
  resumoTexto: { flex: 1, fontSize: 14, fontWeight: '700' },

  chipsRow:  { gap: 8, paddingBottom: 16 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1, minHeight: 44 },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 14, fontWeight: '600' },

  erroWrap:  { borderRadius: 12, padding: 14, marginBottom: 14 },
  erroTexto: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  lista: { gap: 12 },
  card: {
    borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardTopo:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiBg:    { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji:      { fontSize: 24 },
  itemNome:   { fontSize: 17, fontWeight: '700' },
  itemQtd:    { fontSize: 13, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, maxWidth: 110 },
  statusTexto:{ fontSize: 12, fontWeight: '700' },

  divisor:    { height: 1, marginVertical: 12 },
  doador:     { fontSize: 15, fontWeight: '700' },
  contato:    { fontSize: 14, marginTop: 2 },
  observacao: { fontSize: 14, fontStyle: 'italic', marginTop: 8, lineHeight: 20 },
  data:       { fontSize: 12, marginTop: 8 },
  dica:       { fontSize: 13, fontWeight: '600', marginTop: 10, lineHeight: 18 },

  acoesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 },
  btnPrimario:      { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnPrimarioTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnSecundario:    { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnSecundarioTexto: { fontSize: 14, fontWeight: '600' },
  motivoBox:    { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 14, gap: 6 },
  motivoLabel:  { fontSize: 14, fontWeight: '700' },
  motivoInput:  { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 76, fontSize: 15, textAlignVertical: 'top' },
  motivoContador: { fontSize: 12, textAlign: 'right' },
  motivoErro:   { fontSize: 13, fontWeight: '600' },
  btnLink:      { paddingHorizontal: 6, paddingVertical: 10 },
  btnLinkTexto: { fontSize: 13, textDecorationLine: 'underline' },

  vazioCard:   { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10, marginTop: 4 },
  vazioEmoji:  { fontSize: 44 },
  vazioTitulo: { fontSize: 20, fontWeight: '800' },
  vazioSub:    { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
