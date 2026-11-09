import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { ThemeProvider, useTheme } from '../theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { OfflineBar } from '../components/OfflineBar';
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
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Na web, em telas largas, o app fica numa coluna centralizada (não estica).
  const colunaWeb =
    Platform.OS === 'web'
      ? ({ width: '100%', maxWidth: 960, alignSelf: 'center' } as const)
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={[{ flex: 1 }, colunaWeb]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate />
      <ReclassificadorOffline />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="verificar-email" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="produto/[id]"
          options={{
            headerShown: true,
            title: 'Detalhes do Produto',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="entrada/index"
          options={{
            headerShown: true,
            title: 'Registrar Entrada',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="cadastro/index"
          options={{
            headerShown: true,
            title: 'Novo Produto',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="baixa/index"
          options={{
            headerShown: true,
            title: 'Registrar Saída',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="necessidades/index"
          options={{
            headerShown: true,
            title: 'Lista de Necessidades',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="doacoes/index"
          options={{
            headerShown: true,
            title: 'Sugestões de Doação',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
        {/* Área do doador (pública) */}
        <Stack.Screen name="doador/index" />
        <Stack.Screen
          name="doador/doar"
          options={{
            headerShown: true,
            title: 'Sugerir doação',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
          }}
        />
      </Stack>
      <OfflineBar />
    </View>
    </View>
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
