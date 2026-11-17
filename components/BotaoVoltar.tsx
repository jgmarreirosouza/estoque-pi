import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme';

interface Props {
  /** Para onde ir quando não há tela anterior (ex.: página aberta direto pelo link). */
  fallback?: string;
}

/**
 * Botão de voltar do cabeçalho (usado na web).
 *
 * O ícone padrão do React Navigation é uma imagem PNG preta que o navegador
 * precisa pintar com um filtro SVG; em alguns navegadores o filtro falha e a
 * seta fica preta sobre o fundo escuro (invisível, mas ainda clicável).
 * Aqui a seta é desenhada com estilos, na cor do tema, sem imagem nem filtro.
 */
export function BotaoVoltar({ fallback = '/' }: Props) {
  const { colors } = useTheme();

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }

  return (
    <TouchableOpacity
      onPress={voltar}
      style={styles.area}
      activeOpacity={0.6}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
    >
      <View style={[styles.seta, { borderColor: colors.primary }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  area: {
    width: 40,
    height: 40,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seta: {
    width: 13,
    height: 13,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
});
