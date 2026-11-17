import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTheme } from '../../theme';
import { SkeletonLista } from '../SkeletonCard';
import { FadeIn } from '../AnimEntrance';
import { Doacao } from '../../services/tipos';
import { subscribeMinhasDoacoes, prefixoDeHoje, LIMITE_DIARIO } from '../../services/doacoesService';
import { CardDoacao } from './CardDoacao';
import { Grade } from './Grade';
import { FILTROS_DOACAO, FiltroDoacao, filtrarDoacoes, contarPorFiltro } from '../../services/doacoesFiltro';

interface Props {
  uid: string;
  colunas: number;
  onVerNecessidades: () => void;
}

export function AbaMinhasDoacoes({ uid, colunas, onVerNecessidades }: Props) {
  const { colors } = useTheme();
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [filtro, setFiltro] = useState<FiltroDoacao>('todas');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 6000);
    const unsub = subscribeMinhasDoacoes(
      uid,
      (d) => {
        setDoacoes(d);
        setErro(false);
        setCarregando(false);
      },
      () => {
        setErro(true);
        setCarregando(false);
      }
    );
    return () => { unsub(); clearTimeout(timer); };
  }, [uid]);

  const recebidas = doacoes.filter((d) => d.status === 'recebida').length;
  const emAnalise = doacoes.filter((d) => d.status === 'pendente' || d.status === 'aprovada').length;
  const hoje = doacoes.filter((d) => d.id.startsWith(prefixoDeHoje(uid))).length;
  const restantes = Math.max(0, LIMITE_DIARIO - hoje);
  const lista = filtrarDoacoes(doacoes, filtro);
  const contagem = contarPorFiltro(doacoes);
  const filtroAtual = FILTROS_DOACAO.find((f) => f.id === filtro)!;

  return (
    <View>
      {!carregando && !erro && doacoes.length > 0 && (
        <View style={styles.resumo}>
          <View style={[styles.resumoCard, { backgroundColor: colors.riscoSeguroLight }]}>
            <Text style={[styles.resumoNum, { color: colors.riscoSeguroDark }]}>{recebidas}</Text>
            <Text style={[styles.resumoLabel, { color: colors.riscoSeguroDark }]}>recebidas</Text>
          </View>
          <View style={[styles.resumoCard, { backgroundColor: colors.riscoAtencaoLight }]}>
            <Text style={[styles.resumoNum, { color: colors.riscoAtencaoDark }]}>{emAnalise}</Text>
            <Text style={[styles.resumoLabel, { color: colors.riscoAtencaoDark }]}>em andamento</Text>
          </View>
          <View style={[styles.resumoCard, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.resumoNum, { color: colors.primaryDark }]}>{doacoes.length}</Text>
            <Text style={[styles.resumoLabel, { color: colors.primaryDark }]}>sugestões</Text>
          </View>
        </View>
      )}

      <View style={styles.linhaAviso}>
        <Text style={[styles.aviso, { color: colors.textSecondary }]}>
          {restantes > 0
            ? `Você ainda pode enviar ${restantes} ${restantes === 1 ? 'sugestão' : 'sugestões'} hoje.`
            : 'Você já enviou o máximo de sugestões de hoje. Amanhã você poderá enviar mais.'}
        </Text>
        {!carregando && !erro && doacoes.length > 0 && (
          <TouchableOpacity
            style={[
              styles.filtroBotao,
              filtro === 'todas'
                ? { backgroundColor: colors.surface, borderColor: colors.border }
                : { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => setMenuAberto((v) => !v)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar doações. Filtro atual: ${filtroAtual.rotuloCurto}`}
            accessibilityState={{ expanded: menuAberto }}
          >
            <Text style={[styles.filtroTexto, { color: filtro === 'todas' ? colors.textSecondary : colors.primaryDark }]}>
              {filtro === 'todas' ? 'Filtrar' : `${filtroAtual.emoji} ${filtroAtual.rotuloCurto}`}  {menuAberto ? '▴' : '▾'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {menuAberto && (
        <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {FILTROS_DOACAO.map((f, i) => {
            const ativo = f.id === filtro;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: i === FILTROS_DOACAO.length - 1 ? 'transparent' : colors.divider },
                  ativo && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => { setFiltro(f.id); setMenuAberto(false); }}
                activeOpacity={0.7}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: ativo }}
              >
                <Text style={styles.menuEmoji}>{f.emoji}</Text>
                <Text style={[styles.menuRotulo, { color: ativo ? colors.primaryDark : colors.textPrimary }]}>{f.rotulo}</Text>
                <Text style={[styles.menuQtd, { color: colors.textSecondary }]}>{contagem[f.id]}</Text>
                <Text style={[styles.menuCheck, { color: colors.primary }]}>{ativo ? '✓' : ''}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {carregando ? (
        <SkeletonLista n={3} />
      ) : erro ? (
        <FadeIn duration={400} style={[styles.vazio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.vazioEmoji}>📡</Text>
          <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Histórico indisponível</Text>
          <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
            Não foi possível carregar suas doações agora. Confirme seu e-mail e tente novamente em instantes.
          </Text>
        </FadeIn>
      ) : doacoes.length === 0 ? (
        <FadeIn duration={400} style={[styles.vazio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.vazioEmoji}>🎁</Text>
          <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>Nenhuma doação ainda</Text>
          <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
            Quando você sugerir uma doação, ela aparece aqui com o andamento: pendente, aprovada e recebida.
          </Text>
          <TouchableOpacity
            style={[styles.botao, { backgroundColor: colors.primary }]}
            onPress={onVerNecessidades}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoTexto}>Ver o que a ONG precisa</Text>
          </TouchableOpacity>
        </FadeIn>
      ) : lista.length === 0 ? (
        <FadeIn duration={300} style={[styles.vazio, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.vazioEmoji}>{filtroAtual.emoji}</Text>
          <Text style={[styles.vazioTitulo, { color: colors.textPrimary }]}>
            {filtro === 'concluidas' ? 'Nenhuma doação concluída ainda' : 'Nenhuma doação recusada'}
          </Text>
          <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
            {filtro === 'concluidas'
              ? 'Quando a ONG receber um item, a doação aparece aqui.'
              : 'Nenhuma das suas sugestões foi recusada pela ONG.'}
          </Text>
          <TouchableOpacity
            style={[styles.botao, { backgroundColor: colors.primary }]}
            onPress={() => setFiltro('todas')}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoTexto}>Ver todas</Text>
          </TouchableOpacity>
        </FadeIn>
      ) : (
        <Grade colunas={Math.min(colunas, 2)}>
          {lista.map((d, i) => (
            <CardDoacao key={d.id} doacao={d} index={i} />
          ))}
        </Grade>
      )}

      {!carregando && !erro && restantes > 0 && (
        <TouchableOpacity
          style={[styles.novo, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
          onPress={() => router.push('/doador/doar')}
          activeOpacity={0.85}
        >
          <Text style={[styles.novoTexto, { color: colors.accent }]}>🎁  Sugerir uma nova doação</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  resumoCard: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  resumoNum: { fontSize: 26, fontWeight: '800' },
  resumoLabel: { fontSize: 12, fontWeight: '600' },
  linhaAviso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  aviso: { flex: 1, fontSize: 13, lineHeight: 19 },
  filtroBotao: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filtroTexto: { fontSize: 13, fontWeight: '700' },
  menu: { borderWidth: 1, borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1 },
  menuEmoji: { fontSize: 16 },
  menuRotulo: { flex: 1, fontSize: 15, fontWeight: '600' },
  menuQtd: { fontSize: 13, fontWeight: '700' },
  menuCheck: { width: 18, fontSize: 16, fontWeight: '800', textAlign: 'right' },

  vazio: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10, marginBottom: 24 },
  vazioEmoji: { fontSize: 48 },
  vazioTitulo: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  vazioSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  botao: { marginTop: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22 },
  botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },

  novo: { marginTop: 16, borderRadius: 16, borderWidth: 1.5, paddingVertical: 16, alignItems: 'center' },
  novoTexto: { fontSize: 15, fontWeight: '800' },
});
