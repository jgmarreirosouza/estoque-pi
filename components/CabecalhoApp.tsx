import { useEffect, useRef, useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';

/**
 * Cabeçalho único do app (área do doador e painel da ONG, na web):
 *  - linha de cima: logo + nome da casa + ações à direita (⚙️, entrar…)
 *  - linha de baixo: abas na largura toda, com o indicador deslizando até a aba escolhida.
 * Ocupa a largura inteira da tela; o conteúdo interno fica centralizado em `larguraMax`.
 */
export interface AbaCabecalho {
  id: string;
  emoji: string;
  label: string;
}

interface Props {
  titulo: string;
  subtitulo: string;
  abas?: AbaCabecalho[];
  /** Aba em destaque. Se não for nenhuma das abas (ex.: Configurações), o indicador some. */
  abaAtiva?: string;
  onSelecionar?: (id: string) => void;
  direita?: ReactNode;
  larguraMax?: number;
}

export function CabecalhoApp({ titulo, subtitulo, abas = [], abaAtiva, onSelecionar, direita, larguraMax = 1140 }: Props) {
  const { colors } = useTheme();
  const [larguraAbas, setLarguraAbas] = useState(0);
  const indice = abas.findIndex((a) => a.id === abaAtiva);
  const x = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(indice >= 0 ? 1 : 0)).current;
  const primeira = useRef(true);

  const larguraAba = abas.length > 0 ? larguraAbas / abas.length : 0;

  useEffect(() => {
    if (larguraAba === 0) return;
    const alvo = Math.max(indice, 0) * larguraAba;
    if (primeira.current) {
      // primeira exibição: posiciona sem animar
      x.setValue(alvo);
      primeira.current = false;
    } else {
      Animated.timing(x, { toValue: alvo, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }
    Animated.timing(opac, { toValue: indice >= 0 ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [indice, larguraAba, x, opac]);

  function aoMedir(e: LayoutChangeEvent) {
    setLarguraAbas(e.nativeEvent.layout.width);
  }

  return (
    <View style={[styles.cabecalho, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.interno, { maxWidth: larguraMax + 40 }]}>
        <View style={[styles.logo, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.logoEmoji}>🏠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]} numberOfLines={1}>{titulo}</Text>
          <Text style={[styles.subtitulo, { color: colors.textSecondary }]} numberOfLines={1}>{subtitulo}</Text>
        </View>
        {direita}
      </View>

      {abas.length > 1 && (
        <View style={[styles.abasWrap, { maxWidth: larguraMax + 40 }]}>
          <View style={styles.abas} onLayout={aoMedir} accessibilityRole="tablist">
            {abas.map((a) => {
              const ativa = a.id === abaAtiva;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={styles.aba}
                  onPress={() => onSelecionar?.(a.id)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                >
                  <Text style={[styles.abaEmoji, { opacity: ativa ? 1 : 0.65 }]}>{a.emoji}</Text>
                  <Text style={[styles.abaTexto, { color: ativa ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {larguraAba > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicador,
                  { width: larguraAba, backgroundColor: colors.primary, opacity: opac, transform: [{ translateX: x }] },
                ]}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/** Botão redondo ⚙️ do cabeçalho. */
export function BotaoEngrenagem({ ativo, onPress }: { ativo?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.engrenagem, { backgroundColor: ativo ? colors.primaryLight : colors.surfaceSecondary }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Configurações"
    >
      <Text style={styles.engrenagemIcone}>⚙️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cabecalho: { width: '100%', borderBottomWidth: 1, alignItems: 'center' },
  interno: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 24 },
  titulo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitulo: { fontSize: 12 },

  abasWrap: { width: '100%', paddingHorizontal: 20 },
  abas: { width: '100%', flexDirection: 'row', position: 'relative' },
  aba: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  abaEmoji: { fontSize: 15 },
  abaTexto: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  indicador: { position: 'absolute', left: 0, bottom: 0, height: 3, borderRadius: 2 },

  engrenagem: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  engrenagemIcone: { fontSize: 20 },
});
