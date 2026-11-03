import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '../../theme';
import { ScaleIn, FadeDown } from '../../components/AnimEntrance';
import { criarDoacao } from '../../services/doacoesService';
import { mensagemErro } from '../../utils/erros';

const EMOJI_PADRAO = '🎁';

// ── Validações ───────────────────────────────────────────────────────────────

function contatoValido(valor: string): boolean {
  const v = valor.trim();
  if (/^\S+@\S+\.\S+$/.test(v)) return true; // e-mail
  const digitos = v.replace(/\D/g, '');
  return digitos.length >= 10 && digitos.length <= 13; // telefone com DDD
}

/** Rejeita se a gravação não for confirmada a tempo (ex.: sem internet). */
function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promessa.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

// ── Tela de sucesso ──────────────────────────────────────────────────────────

function Sucesso({ onNova, onVoltar }: { onNova: () => void; onVoltar: () => void }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.sucessoWrap}>
        <ScaleIn style={[styles.sucessoCirculo, { backgroundColor: colors.riscoSeguroLight }]}>
          <Text style={styles.sucessoIcon}>✓</Text>
        </ScaleIn>
        <FadeDown delay={200} style={styles.sucessoTextos}>
          <Text style={[styles.sucessoTitulo, { color: colors.textPrimary }]}>Sugestão enviada!</Text>
          <Text style={[styles.sucessoSub, { color: colors.textSecondary }]}>
            Obrigado pelo carinho! A equipe da Casa da Criança vai analisar sua sugestão e entrar
            em contato para combinar a entrega.
          </Text>
          <View style={[styles.avisoCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.avisoTexto, { color: colors.primaryDark }]}>
              A doação só é confirmada depois que a equipe aprovar e receber o item.
            </Text>
          </View>
        </FadeDown>
        <View style={styles.sucessoBotoes}>
          <TouchableOpacity
            style={[styles.botaoPrincipal, { backgroundColor: colors.primary }]}
            onPress={onVoltar}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoPrincipalTexto}>Ver lista de necessidades</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botaoSecundario, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={onNova}
            activeOpacity={0.8}
          >
            <Text style={[styles.botaoSecundarioTexto, { color: colors.textPrimary }]}>
              Sugerir outra doação
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Formulário ───────────────────────────────────────────────────────────────

export default function DoarScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ produtoId?: string; nome?: string; emoji?: string }>();

  // Item vindo da lista de necessidades (pode ser trocado por um item livre).
  const [itemDaLista, setItemDaLista] = useState(!!params.nome);
  const [itemLivre, setItemLivre] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [observacao, setObservacao] = useState('');

  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  const nomeItem = itemDaLista ? (params.nome ?? '') : itemLivre.trim();
  const qtd = Number(quantidade);

  const itemOk = nomeItem.length >= 2;
  const qtdOk = Number.isInteger(qtd) && qtd >= 1 && qtd <= 9999;
  const nomeOk = nome.trim().length >= 2;
  const contatoOk = contatoValido(contato);
  const formOk = itemOk && qtdOk && nomeOk && contatoOk;

  async function handleEnviar() {
    setTentou(true);
    setErro('');
    if (!formOk || enviando) return;

    setEnviando(true);
    try {
      await comTimeout(
        criarDoacao({
          produtoId: itemDaLista ? params.produtoId : undefined,
          nomeItem,
          emoji: itemDaLista ? (params.emoji ?? EMOJI_PADRAO) : EMOJI_PADRAO,
          quantidade: qtd,
          doadorNome: nome,
          doadorContato: contato,
          observacao,
        }),
        20000
      );
      setEnviado(true);
    } catch (e) {
      const msg = e instanceof Error && e.message === 'timeout'
        ? 'Não conseguimos confirmar o envio agora. Verifique sua conexão e tente novamente.'
        : mensagemErro(e, 'Não foi possível enviar sua sugestão. Tente novamente.');
      setErro(msg);
    } finally {
      setEnviando(false);
    }
  }

  function novaSugestao() {
    setItemDaLista(false);
    setItemLivre('');
    setQuantidade('1');
    setObservacao('');
    setTentou(false);
    setErro('');
    setEnviado(false);
  }

  if (enviado) {
    return <Sucesso onNova={novaSugestao} onVoltar={() => router.replace('/doador')} />;
  }

  const inputWrap = (invalido: boolean) => [
    styles.inputWrap,
    { borderColor: invalido ? colors.riscoAlto : colors.border, backgroundColor: colors.surface },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.coluna}>
            <Text style={[styles.passoTitulo, { color: colors.textPrimary }]}>O que você quer doar?</Text>
            <Text style={[styles.passoSub, { color: colors.textSecondary }]}>
              Preencha os dados abaixo. Esta é uma sugestão: a equipe vai analisar e entrar em contato.
            </Text>

            {/* Item */}
            {itemDaLista ? (
              <View style={[styles.itemResumo, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={styles.itemResumoEmoji}>{params.emoji ?? EMOJI_PADRAO}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemResumoNome, { color: colors.primaryDark }]}>{params.nome}</Text>
                  <Text style={[styles.itemResumoSub, { color: colors.primary }]}>Item da lista de necessidades ✓</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setItemDaLista(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Trocar por outro item"
                >
                  <Text style={[styles.trocar, { color: colors.primary }]}>Trocar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.campoWrap}>
                <Text style={[styles.campoLabel, { color: colors.textSecondary }]}>Item *</Text>
                <View style={inputWrap(tentou && !itemOk)}>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Ex.: Arroz 5kg, fraldas, sabonete…"
                    placeholderTextColor={colors.textDisabled}
                    value={itemLivre}
                    onChangeText={setItemLivre}
                    maxLength={80}
                  />
                </View>
                {tentou && !itemOk && (
                  <Text style={[styles.erroCampo, { color: colors.riscoAlto }]}>Informe o que você quer doar.</Text>
                )}
              </View>
            )}

            {/* Quantidade */}
            <View style={styles.campoWrap}>
              <Text style={[styles.campoLabel, { color: colors.textSecondary }]}>Quantidade *</Text>
              <View style={styles.qtdRow}>
                <TouchableOpacity
                  style={[styles.qtdBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => setQuantidade(String(Math.max(1, (Number(quantidade) || 1) - 1)))}
                  accessibilityLabel="Diminuir quantidade"
                >
                  <Text style={[styles.qtdBtnTexto, { color: colors.textPrimary }]}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtdInput, { color: colors.textPrimary, borderColor: tentou && !qtdOk ? colors.riscoAlto : colors.border, backgroundColor: colors.surface }]}
                  value={quantidade}
                  onChangeText={(t) => setQuantidade(t.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  textAlign="center"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={[styles.qtdBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => setQuantidade(String(Math.min(9999, (Number(quantidade) || 0) + 1)))}
                  accessibilityLabel="Aumentar quantidade"
                >
                  <Text style={[styles.qtdBtnTexto, { color: colors.textPrimary }]}>＋</Text>
                </TouchableOpacity>
              </View>
              {tentou && !qtdOk && (
                <Text style={[styles.erroCampo, { color: colors.riscoAlto }]}>Informe uma quantidade de 1 a 9999.</Text>
              )}
            </View>

            {/* Doador */}
            <View style={styles.campoWrap}>
              <Text style={[styles.campoLabel, { color: colors.textSecondary }]}>Seu nome *</Text>
              <View style={inputWrap(tentou && !nomeOk)}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Como podemos te chamar?"
                  placeholderTextColor={colors.textDisabled}
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  maxLength={80}
                />
              </View>
              {tentou && !nomeOk && (
                <Text style={[styles.erroCampo, { color: colors.riscoAlto }]}>Informe seu nome.</Text>
              )}
            </View>

            <View style={styles.campoWrap}>
              <Text style={[styles.campoLabel, { color: colors.textSecondary }]}>Telefone (com DDD) ou e-mail *</Text>
              <View style={inputWrap(tentou && !contatoOk)}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="(19) 99999-9999 ou nome@email.com"
                  placeholderTextColor={colors.textDisabled}
                  value={contato}
                  onChangeText={setContato}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  maxLength={80}
                />
              </View>
              {tentou && !contatoOk && (
                <Text style={[styles.erroCampo, { color: colors.riscoAlto }]}>
                  Informe um telefone com DDD ou um e-mail válido.
                </Text>
              )}
            </View>

            <View style={styles.campoWrap}>
              <Text style={[styles.campoLabel, { color: colors.textSecondary }]}>Observação (opcional)</Text>
              <View style={inputWrap(false)}>
                <TextInput
                  style={[styles.input, styles.inputMultilinha, { color: colors.textPrimary }]}
                  placeholder="Ex.: validade, marca, melhor horário para entrega…"
                  placeholderTextColor={colors.textDisabled}
                  value={observacao}
                  onChangeText={setObservacao}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Text style={[styles.privacidade, { color: colors.textDisabled }]}>
              🔒 Seu nome e contato serão usados somente pela equipe da Casa da Criança para falar
              sobre esta doação.
            </Text>

            {erro.length > 0 && (
              <View style={[styles.erroWrap, { backgroundColor: colors.riscoAltoLight }]}>
                <Text style={[styles.erroTexto, { color: colors.riscoAltoDark }]}>{erro}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.botaoPrincipal, { backgroundColor: enviando ? colors.surfaceSecondary : colors.primary }]}
              onPress={handleEnviar}
              disabled={enviando}
              activeOpacity={0.85}
              accessibilityLabel="Enviar sugestão de doação"
            >
              {enviando ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.botaoPrincipalTexto}>Enviar sugestão</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  coluna: { width: '100%', maxWidth: 640, alignSelf: 'center' },

  passoTitulo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  passoSub:    { fontSize: 15, lineHeight: 22, marginBottom: 22 },

  itemResumo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 20,
  },
  itemResumoEmoji: { fontSize: 30 },
  itemResumoNome:  { fontSize: 17, fontWeight: '800' },
  itemResumoSub:   { fontSize: 13, marginTop: 2, fontWeight: '600' },
  trocar:          { fontSize: 14, fontWeight: '700' },

  campoWrap:  { marginBottom: 18 },
  campoLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
  inputWrap:  { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, minHeight: 52, justifyContent: 'center' },
  input:      { fontSize: 16 },
  inputMultilinha: { minHeight: 72 },
  erroCampo:  { fontSize: 13, fontWeight: '600', marginTop: 6 },

  qtdRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtdBtn:      { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtdBtnTexto: { fontSize: 24, fontWeight: '700' },
  qtdInput:    { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, fontSize: 20, fontWeight: '700' },

  privacidade: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  erroWrap:  { borderRadius: 12, padding: 14, marginBottom: 14 },
  erroTexto: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  botaoPrincipal:      { borderRadius: 16, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  botaoPrincipalTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  botaoSecundario:     { borderRadius: 16, borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
  botaoSecundarioTexto:{ fontSize: 16, fontWeight: '600' },

  // Sucesso
  sucessoWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' },
  sucessoCirculo: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sucessoIcon:    { fontSize: 48 },
  sucessoTextos:  { alignItems: 'center', gap: 12 },
  sucessoTitulo:  { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sucessoSub:     { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  avisoCard:      { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4 },
  avisoTexto:     { fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  sucessoBotoes:  { width: '100%', gap: 10, marginTop: 8 },
});
