import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useLayout } from '../../utils/useLayout';
import { TopoBarOng } from '../../components/TopoBarOng';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.55 }}>
      {emoji}
    </Text>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { largo } = useLayout();
  // Na web em tela larga, as abas ficam numa barra horizontal no topo.
  // No celular (e no app instalado) continuam embaixo, como sempre.
  const noTopo = Platform.OS === 'web' && largo;

  return (
    <Tabs
      tabBar={noTopo ? (props) => <TopoBarOng {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarPosition: noTopo ? 'top' : 'bottom',
        tabBarLabelPosition: noTopo ? 'beside-icon' : undefined,
        // Conteúdo centralizado, com largura máxima, abaixo da barra de abas.
        sceneStyle: noTopo
          ? { width: '100%', maxWidth: 1280, alignSelf: 'center', backgroundColor: colors.background }
          : undefined,
        tabBarStyle: noTopo
          ? {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
              height: 60,
              paddingTop: 0,
              paddingBottom: 0,
              justifyContent: 'center',
            }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 64 + bottom,
              paddingBottom: Math.max(bottom, 8),
              paddingTop: 8,
            },
        tabBarItemStyle: noTopo ? { maxWidth: 200 } : undefined,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗂️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Config.',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
