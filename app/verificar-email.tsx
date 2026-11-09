import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { reenviarVerificacao, sairDaConta } from '../services/authService';

/**
 * Tela exibida enquanto o e-mail da conta não foi confirmado.
 * Vale para doadores e para a equipe: ninguém usa o app sem confirmar o e-mail.
 */
export default function VerificarEmailScreen() {
  const { colors } = useTheme();
  const { user, recarregar } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  async function jaConfirmei() {
    setCarregando(true);
    setErro('');
    setAviso('');
    try {
      await recarregar();
      // Se confirmou, o AuthGate leva para a tela certa. Se não, avisamos aqui.
      setAviso('Ainda não encontramos a confirmação. Abra o link do e-mail e tente de novo.');
    } catch {
      setErro('Não foi possível verificar agora. Confira a conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function reenviar() {
    setCarregando(true);
    setErro('');
    setAviso('');
    try {
      await reenviarVerificacao();
      setAviso('E-mail reenviado! Confira também a caixa de spam.');
    } catch {
      setErro('Não foi possível reenviar agora. Aguarde um minuto e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.coluna}>
        <View style={[styles.logo, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.logoEmoji}>✉️</Text>
        </View>
        <Text style={[styles.titulo, { color: colors.textPrimary }]}>Confirme seu e-mail</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Enviamos um link de confirmação para{'\n'}
          <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{user?.email}</Text>
          {'\n'}Abra o link e depois volte aqui.
        </Text>

        {!!aviso && (
          <View style={[styles.caixa, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.caixaTexto, { color: colors.primaryDark }]}>{aviso}</Text>
          </View>
        )}
        {!!erro && (
          <View style={[styles.caixa, { backgroundColor: colors.riscoAltoLight, borderColor: colors.riscoAlto }]}>
            <Text style={[styles.caixaTexto, { color: colors.riscoAltoDark }]}>{erro}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.botao, { backgroundColor: colors.primary }, carregando && { opacity: 0.6 }]}
          onPress={jaConfirmei}
          disabled={carregando}
          activeOpacity={0.85}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Já confirmei</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botaoSec, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={reenviar}
          disabled={carregando}
          activeOpacity={0.8}
        >
          <Text style={[styles.botaoSecTexto, { color: colors.textPrimary }]}>Reenviar e-mail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => sairDaConta()}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginTop: 20 }}
        >
          <Text style={[styles.sair, { color: colors.textDisabled }]}>Usar outra conta · Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center' },
  coluna: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
  },
  logo: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoEmoji: { fontSize: 46 },
  titulo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  caixa: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 12 },
  caixaTexto: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  botao: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as object, default: {} }),
  },
  botaoTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
  botaoSec: { width: '100%', borderRadius: 16, borderWidth: 1.5, paddingVertical: 15, alignItems: 'center' },
  botaoSecTexto: { fontSize: 16, fontWeight: '600' },
  sair: { fontSize: 13, textDecorationLine: 'underline' },
});
