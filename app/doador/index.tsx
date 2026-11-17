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
import { CabecalhoApp, BotaoEngrenagem } from '../../components/CabecalhoApp';

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
      {/* Cabeçalho (mesmo componente do painel da ONG) */}
      <CabecalhoApp
        titulo="Casa da Criança"
        subtitulo="Itapira/SP · Como você pode ajudar"
        larguraMax={larguraMax}
        abas={abasVisiveis}
        abaAtiva={abaAtual === 'config' ? undefined : abaAtual}
        onSelecionar={(id) => setAba(id as Aba)}
        direita={
          logado ? (
            <>
              {papel === 'equipe' && (
                <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.8}>
                  <Text style={[styles.link, { color: colors.primary }]}>Painel da ONG</Text>
                </TouchableOpacity>
              )}
              <BotaoEngrenagem
                ativo={abaAtual === 'config'}
                onPress={() => setAba(abaAtual === 'config' ? ABA_INICIAL : 'config')}
              />
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
          )
        }
      />

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
  link: { fontSize: 14, fontWeight: '700' },
  entrar: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  entrarTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },


  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, alignItems: 'center' },
  coluna: { width: '100%' },
});
