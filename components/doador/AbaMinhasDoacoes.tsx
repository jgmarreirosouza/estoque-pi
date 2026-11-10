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

      <Text style={[styles.aviso, { color: colors.textSecondary }]}>
        {restantes > 0
          ? `Você ainda pode enviar ${restantes} ${restantes === 1 ? 'sugestão' : 'sugestões'} hoje.`
          : 'Você já enviou o máximo de sugestões de hoje. Amanhã você poderá enviar mais.'}
      </Text>

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
      ) : (
        <Grade colunas={Math.min(colunas, 2)}>
          {doacoes.map((d, i) => (
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
  aviso: { fontSize: 13, marginBottom: 14, lineHeight: 19 },

  vazio: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10, marginBottom: 24 },
  vazioEmoji: { fontSize: 48 },
  vazioTitulo: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  vazioSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  botao: { marginTop: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22 },
  botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },

  novo: { marginTop: 16, borderRadius: 16, borderWidth: 1.5, paddingVertical: 16, alignItems: 'center' },
  novoTexto: { fontSize: 15, fontWeight: '800' },
});
