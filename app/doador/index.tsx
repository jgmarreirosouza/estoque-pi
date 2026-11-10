import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../utils/useLayout';
import { NecessidadePublica } from '../../services/tipos';
import { subscribeNecessidadesPublicas } from '../../services/necessidadesPublicasService';
import { AbaNecessidades } from '../../components/doador/AbaNecessidades';
import { AbaMinhasDoacoes } from '../../components/doador/AbaMinhasDoacoes';
import { AbaConfiguracoes } from '../../components/doador/AbaConfiguracoes';

type Aba = 'necessidades' | 'doacoes' | 'config';

const ABA_INICIAL: Aba = 'necessidades';

// As configurações abrem pelo ícone ⚙️ do cabeçalho, não por uma aba.
const ABAS: { id: Aba; emoji: string; label: string }[] = [
  { id: 'necessidades', emoji: '💙', label: 'Necessidades' },
  { id: 'doacoes',      emoji: '🎁', label: 'Minhas doações' },
];

/**
 * Painel do doador. Sem conta, qualquer pessoa vê a lista de necessidades.
 * Com conta (e-mail confirmado), aparecem também "Minhas doações" e "Configurações".
 */
export default function DoadorScreen() {
  const { colors } = useTheme();
  const { user, verificado, papel } = useAuth();
  const { faixa, colunas } = useLayout();
  const [aba, setAba] = useState<Aba>(ABA_INICIAL);

  const [itens, setItens] = useState<NecessidadePublica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 6000);
    const unsub = subscribeNecessidadesPublicas(
      (d) => { setItens(d); setErro(false); setCarregando(false); },
      () => { setErro(true); setCarregando(false); }
    );
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const logado = !!user && verificado;
  const abasVisiveis = logado ? ABAS : [];
  const abaAtual: Aba = logado ? aba : 'necessidades';
  const larguraMax = faixa === 'desktop' ? 1100 : faixa === 'tablet' ? 760 : 640;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Cabeçalho */}
      <View style={[styles.cabecalho, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.cabecalhoInterno, { maxWidth: larguraMax + 40 }]}>
          <View style={[styles.logo, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.logoEmoji}>🏠</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: colors.textPrimary }]} numberOfLines={1}>Casa da Criança</Text>
            <Text style={[styles.subtitulo, { color: colors.textSecondary }]} numberOfLines={1}>
              Itapira/SP · Como você pode ajudar
            </Text>
          </View>
          {logado ? (
            <>
              {papel === 'equipe' && (
                <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.8}>
                  <Text style={[styles.link, { color: colors.primary }]}>Painel da ONG</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.engrenagem,
                  { backgroundColor: abaAtual === 'config' ? colors.primaryLight : colors.surfaceSecondary },
                ]}
                onPress={() => setAba(abaAtual === 'config' ? ABA_INICIAL : 'config')}
                activeOpacity={0.75}
                accessibilityLabel="Configurações"
              >
                <Text style={styles.engrenagemIcone}>⚙️</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.entrar, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/login')}
              activeOpacity={0.85}
              accessibilityLabel="Entrar ou criar conta"
            >
              <Text style={styles.entrarTexto}>{faixa === 'celular' ? 'Entrar' : 'Entrar ou criar conta'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Abas */}
        {abasVisiveis.length > 1 && (
          <View style={[styles.abas, { maxWidth: larguraMax + 40 }]}>
            {abasVisiveis.map((a) => {
              const ativa = abaAtual === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.aba, ativa && { borderBottomColor: colors.primary }]}
                  onPress={() => setAba(a.id)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                >
                  <Text style={styles.abaEmoji}>{a.emoji}</Text>
                  <Text
                    style={[styles.abaTexto, { color: ativa ? colors.primary : colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Conteúdo */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.coluna, { maxWidth: larguraMax }]}>
          {abaAtual === 'necessidades' && (
            <AbaNecessidades itens={itens} carregando={carregando} erro={erro} colunas={colunas} />
          )}
          {abaAtual === 'doacoes' && user && (
            <AbaMinhasDoacoes
              uid={user.uid}
              colunas={colunas}
              onVerNecessidades={() => setAba('necessidades')}
            />
          )}
          {abaAtual === 'config' && <AbaConfiguracoes />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  cabecalho: { width: '100%', borderBottomWidth: 1, alignItems: 'center' },
  cabecalhoInterno: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 24 },
  titulo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitulo: { fontSize: 12 },
  link: { fontSize: 14, fontWeight: '700' },
  engrenagem: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  engrenagemIcone: { fontSize: 20 },
  entrar: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  entrarTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },

  abas: { width: '100%', flexDirection: 'row', paddingHorizontal: 20 },
  aba: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  abaEmoji: { fontSize: 15 },
  abaTexto: { fontSize: 13, fontWeight: '700', flexShrink: 1 },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, alignItems: 'center' },
  coluna: { width: '100%' },
});
