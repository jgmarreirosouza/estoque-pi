import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Image } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { redefinirSenha, sairDaConta } from '../../services/authService';

type Modo = 'auto' | 'light' | 'dark';

const TEMAS: { valor: Modo; label: string; emoji: string }[] = [
  { valor: 'auto', label: 'Automático', emoji: '🔄' },
  { valor: 'light', label: 'Claro', emoji: '☀️' },
  { valor: 'dark', label: 'Escuro', emoji: '🌙' },
];

// ── subcomponentes (mesmo visual das configurações da ONG) ───────────────────

function SecaoHeader({ titulo, emoji }: { titulo: string; emoji: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.secaoHeaderWrap}>
      <Text style={styles.secaoEmoji}>{emoji}</Text>
      <Text style={[styles.secaoTitulo, { color: colors.textSecondary }]}>{titulo}</Text>
    </View>
  );
}

function Cartao({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.cartao, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

function Item({
  label,
  descricao,
  valorAtual,
  onPress,
  danger,
  ultimo,
}: {
  label: string;
  descricao?: string;
  valorAtual?: string;
  onPress?: () => void;
  danger?: boolean;
  ultimo?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.itemWrap, { borderBottomColor: ultimo ? 'transparent' : colors.divider }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={descricao ? `${label}: ${descricao}` : label}
    >
      <View style={styles.itemTextos}>
        <Text style={[styles.itemLabel, { color: danger ? colors.riscoAlto : colors.textPrimary }]}>{label}</Text>
        {!!descricao && <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{descricao}</Text>}
      </View>
      <View style={styles.itemDireita}>
        {!!valorAtual && <Text style={[styles.itemValor, { color: colors.textSecondary }]}>{valorAtual}</Text>}
        {!danger && !!onPress && <Text style={[styles.itemSeta, { color: colors.textDisabled }]}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── tela ─────────────────────────────────────────────────────────────────────

export function AbaConfiguracoes() {
  const { colors, mode, setMode } = useTheme();
  const { user } = useAuth();
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [mostraOng, setMostraOng] = useState(false);
  const [mostraPrivacidade, setMostraPrivacidade] = useState(false);

  const email = user?.email ?? '';
  const nomeExibido = user?.displayName || email.split('@')[0] || 'Doador';
  const inicial = nomeExibido.trim().charAt(0).toUpperCase() || '💙';
  const temSenha = user?.providerData.some((p) => p.providerId === 'password') ?? false;
  const isGoogle = user?.providerData.some((p) => p.providerId === 'google.com') ?? false;

  async function alterarSenha() {
    setAviso('');
    setErro('');
    try {
      await redefinirSenha(email);
      setAviso(`Enviamos um link para redefinir a senha para ${email}. Confira também o spam.`);
    } catch {
      setErro('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
    }
  }

  function sair() {
    // Alert com botões não funciona na web — usa confirm
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja mesmo sair da conta?')) sairDaConta();
      return;
    }
    Alert.alert('Sair da conta', 'Deseja mesmo sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sairDaConta() },
    ]);
  }

  return (
    <View style={styles.pagina}>
      <Text style={[styles.titulo, { color: colors.textPrimary }]}>Configurações</Text>

      {/* Perfil */}
      <View style={[styles.perfilCard, { backgroundColor: colors.primary }]}>
        <View style={styles.perfilAvatar}>
          {isGoogle && user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.perfilAvatarImg} />
          ) : (
            <Text style={styles.perfilAvatarInicial}>{inicial}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.perfilNome} numberOfLines={1}>{nomeExibido}</Text>
          <Text style={styles.perfilCargo} numberOfLines={1}>{email}</Text>
        </View>
      </View>

      {/* Aparência */}
      <SecaoHeader titulo="APARÊNCIA" emoji="🎨" />
      <Cartao>
        <View style={styles.seletorWrap}>
          <Text style={[styles.itemLabel, { color: colors.textPrimary, marginBottom: 12 }]}>Tema do app</Text>
          <View style={styles.temaOpcoes}>
            {TEMAS.map((t) => {
              const ativo = mode === t.valor;
              return (
                <TouchableOpacity
                  key={t.valor}
                  style={[
                    styles.temaChip,
                    {
                      backgroundColor: ativo ? colors.primary : colors.surfaceSecondary,
                      borderColor: ativo ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setMode(t.valor)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.temaEmoji}>{t.emoji}</Text>
                  <Text style={[styles.temaLabel, { color: ativo ? '#FFF' : colors.textSecondary }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Cartao>

      {/* Conta e segurança */}
      <SecaoHeader titulo="CONTA E SEGURANÇA" emoji="🔒" />
      <Cartao>
        {temSenha && (
          <Item
            label="Alterar senha"
            descricao="Enviaremos um link de redefinição por e-mail"
            onPress={alterarSenha}
          />
        )}
        {!!aviso && <Text style={[styles.msg, { color: colors.primaryDark }]}>{aviso}</Text>}
        {!!erro && <Text style={[styles.msg, { color: colors.riscoAlto }]}>{erro}</Text>}
        <Item label="Sair da conta" danger onPress={sair} ultimo />
      </Cartao>

      {/* Sobre */}
      <SecaoHeader titulo="SOBRE" emoji="ℹ️" />
      <Cartao>
        <Item label="Versão do app" valorAtual="1.0.0 (beta)" />
        <Item
          label="Casa da Criança"
          descricao="Itapira/SP · desde 1985"
          onPress={() => setMostraOng((v) => !v)}
        />
        {mostraOng && (
          <Text style={[styles.msg, { color: colors.textSecondary }]}>
            Instituição sem fins lucrativos que acolhe crianças em Itapira/SP e vive de doações da comunidade.
            Sua sugestão só é confirmada como doação depois que a equipe aprova e recebe o item.
          </Text>
        )}
        <Item
          label="Política de privacidade"
          onPress={() => setMostraPrivacidade((v) => !v)}
          ultimo={!mostraPrivacidade}
        />
        {mostraPrivacidade && (
          <Text style={[styles.msg, { color: colors.textSecondary }]}>
            Guardamos apenas o seu e-mail de acesso e os dados que você informa ao sugerir uma doação
            (nome, contato, item e quantidade). Esses dados são vistos somente pela equipe da Casa da
            Criança, para combinar a entrega, e não são compartilhados com terceiros.
          </Text>
        )}
      </Cartao>

      <View style={styles.rodape}>
        <Text style={styles.rodapeEmoji}>🏠</Text>
        <Text style={[styles.rodapeTexto, { color: colors.textDisabled }]}>Casa da Criança · Controle de Estoque</Text>
        <Text style={[styles.rodapeTexto, { color: colors.textDisabled }]}>Feito com carinho para quem cuida ❤️</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  titulo: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 20 },

  perfilCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: 20, marginBottom: 28 },
  perfilAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  perfilAvatarInicial: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  perfilAvatarImg: { width: '100%', height: '100%' },
  perfilNome: { fontSize: 19, fontWeight: '800', color: '#FFF' },
  perfilCargo: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  secaoHeaderWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4, paddingHorizontal: 4 },
  secaoEmoji: { fontSize: 14 },
  secaoTitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },

  cartao: {
    borderRadius: 18, borderWidth: 1, marginBottom: 20, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
      default: {},
    }),
  },

  itemWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, minHeight: 60 },
  itemTextos: { flex: 1, gap: 3 },
  itemLabel: { fontSize: 16, fontWeight: '600' },
  itemDesc: { fontSize: 13, lineHeight: 18 },
  itemDireita: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemValor: { fontSize: 15 },
  itemSeta: { fontSize: 22, fontWeight: '300' },
  msg: { fontSize: 13, lineHeight: 19, paddingHorizontal: 18, paddingBottom: 14 },

  seletorWrap: { paddingHorizontal: 18, paddingVertical: 16 },
  temaOpcoes: { flexDirection: 'row', gap: 10 },
  temaChip: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  temaEmoji: { fontSize: 22 },
  temaLabel: { fontSize: 13, fontWeight: '700' },

  rodape: { alignItems: 'center', gap: 4, paddingVertical: 24 },
  rodapeEmoji: { fontSize: 28, marginBottom: 4 },
  rodapeTexto: { fontSize: 13 },
});
