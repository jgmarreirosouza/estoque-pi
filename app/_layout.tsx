import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { ThemeProvider, useTheme } from '../theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { OfflineBar } from '../components/OfflineBar';
import { BotaoVoltar } from '../components/BotaoVoltar';
import { getLotesSemRisco, atualizarRiscoLote } from '../services/lotesService';
import { getProdutoById } from '../services/produtosService';
import { classificarRiscoML } from '../services/mlService';
import { diasParaVencer } from '../services/risco';

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  (Constants as any).appOwnership === 'expo';

if (!isExpoGo) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Roda em background e reclassifica lotes que foram salvos sem `risco`
 * (criados enquanto o app estava sem internet).
 * Dispara ao montar (se já online) e toda vez que a conexão for restaurada.
 */
function ReclassificadorOffline() {
  const { papel, verificado } = useAuth();
  // Só a equipe (com e-mail confirmado) pode ler os lotes. Doadores e contas
  // ainda não confirmadas não têm permissão e causariam erro de acesso.
  const ativo = papel === 'equipe' && verificado;

  useEffect(() => {
    if (!ativo) return;

    let emExecucao = false;

    async function reclassificar() {
      if (emExecucao) return;
      emExecucao = true;
      try {
        const estado = await NetInfo.fetch();
        if (!estado.isConnected || !estado.isInternetReachable) return;

        const pendentes = await getLotesSemRisco();
        for (const lote of pendentes) {
          try {
            const produto = await getProdutoById(lote.produtoId);
            if (!produto) continue;
            const dias = diasParaVencer(lote.validade);
            const risco = await classificarRiscoML(dias, produto.mediaConsumoDias, lote.quantidade);
            await atualizarRiscoLote(lote.id, risco);
          } catch {
            // Ignora erros individuais — tenta de novo na próxima chamada
          }
        }
      } catch {
        // Sem permissão ou sem rede agora: tenta de novo quando a conexão voltar
      } finally {
        emExecucao = false;
      }
    }

    // Tenta ao montar (cobre lotes pendentes de sessões anteriores offline)
    reclassificar();

    // Re-tenta sempre que a conectividade for restaurada
    const unsubNetInfo = NetInfo.addEventListener((estado) => {
      if (estado.isConnected && estado.isInternetReachable) reclassificar();
    });

    return () => unsubNetInfo();
  }, [ativo]);

  return null;
}

function AuthGate() {
  const { user, loading, papel, verificado } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inLogin = segments[0] === 'login';
    const inDoador = segments[0] === 'doador';
    const inVerificar = segments[0] === 'verificar-email';

    // Sem conta: só o login e a lista pública de necessidades (/doador) são acessíveis.
    if (!user) {
      if (!inLogin && !inDoador) router.replace('/login');
      return;
    }
    // Conta criada, mas e-mail ainda não confirmado.
    if (!verificado) {
      if (!inVerificar) router.replace('/verificar-email');
      return;
    }
    // Doador: só a área do doador. Equipe: painel de estoque.
    if (papel === 'doador') {
      if (!inDoador) router.replace('/doador');
      return;
    }
    if (inLogin || inVerificar) router.replace('/');
  }, [user, loading, papel, verificado, segments]);

  return null;
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { loading } = useAuth();
  const segments = useSegments();

  // Opções comuns das telas internas. Na web o botão de voltar é desenhado
  // por BotaoVoltar (o ícone padrão some em alguns navegadores).
  const cabecalho = (title: string, fallback = '/') => ({
    headerShown: true,
    title,
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' as const },
    ...(Platform.OS === 'web'
      ? {
          headerLeft: () => <BotaoVoltar fallback={fallback} />,
          // Cabeçalho de ponta a ponta; só o conteúdo fica numa coluna centralizada.
          contentStyle: { backgroundColor: colors.background, width: '100%', maxWidth: 1200, alignSelf: 'center' } as const,
        }
      : {}),
  });

  // O fundo padrão do React Navigation é claro: sem isto aparecem faixas brancas
  // nas laterais quando o conteúdo é centralizado em telas largas.
  const temaNav = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.primary,
      text: colors.textPrimary,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Na web, em telas largas, login e verificação ficam numa coluna centralizada.
  // As demais telas cuidam da própria largura: o cabeçalho ocupa a tela toda e o
  // conteúdo é centralizado (sceneStyle das abas e contentStyle das telas internas).
  const colunaWeb =
    Platform.OS === 'web' && (segments[0] === 'login' || segments[0] === 'verificar-email')
      ? ({ width: '100%', maxWidth: 1200, alignSelf: 'center' } as const)
      : null;

  return (
    <NavThemeProvider value={temaNav}>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={[{ flex: 1 }, colunaWeb]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate />
      <ReclassificadorOffline />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="verificar-email" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="produto/[id]"
          options={cabecalho('Detalhes do Produto')}
        />
        <Stack.Screen
          name="entrada/index"
          options={cabecalho('Registrar Entrada')}
        />
        <Stack.Screen
          name="cadastro/index"
          options={cabecalho('Novo Produto')}
        />
        <Stack.Screen
          name="baixa/index"
          options={cabecalho('Registrar Saída')}
        />
        <Stack.Screen
          name="necessidades/index"
          options={cabecalho('Lista de Necessidades')}
        />
        <Stack.Screen
          name="doacoes/index"
          options={cabecalho('Sugestões de Doação')}
        />
        {/* Área do doador (pública) */}
        <Stack.Screen name="doador/index" />
        <Stack.Screen
          name="doador/doar"
          options={cabecalho('Sugerir doação', '/doador')}
        />
      </Stack>
      <OfflineBar />
    </View>
    </View>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
