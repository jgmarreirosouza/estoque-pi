"""
Testes da API de ML (FastAPI) — Pytest + TestClient.

Rotas cobertas: GET /, POST /classificar, POST /agrupar-doacoes, POST /prever-fim-estoque,
com entradas válidas e inválidas (validação do Pydantic → HTTP 422).
"""
import json
import os

import pytest

NIVEIS = {'consumo_imediato', 'risco_vencimento', 'seguro'}


# ── Health check ─────────────────────────────────────────────────────────────

def test_raiz_responde_ok(client):
    r = client.get('/')
    assert r.status_code == 200
    corpo = r.json()
    assert corpo['status'] == 'ok'
    assert set(corpo['modelos']) == {'classificador-validade', 'kmeans-doacoes', 'regressao-demanda'}


# ── /classificar (Árvore de Decisão) ─────────────────────────────────────────

def post_classificar(client, dias, media, qtd):
    return client.post('/classificar', json={
        'dias_ate_vencer': dias, 'media_consumo_dias': media, 'quantidade': qtd})


def test_classificar_lote_no_vencimento_e_consumo_imediato(client):
    r = post_classificar(client, 0, 7, 10)
    assert r.status_code == 200
    assert r.json()['risco'] == 'consumo_imediato'


def test_classificar_lote_vence_em_5_dias_nunca_e_seguro(client):
    for media in (1, 3, 7, 15, 30, 60):
        for qtd in (1, 5, 20, 100, 500):
            assert post_classificar(client, 5, media, qtd).json()['risco'] != 'seguro'


def test_classificar_lote_com_validade_longa_e_seguro(client):
    assert post_classificar(client, 180, 7, 10).json()['risco'] == 'seguro'


def test_classificar_devolve_nivel_valido_e_descricao(client):
    corpo = post_classificar(client, 20, 7, 10).json()
    assert corpo['risco'] in NIVEIS
    assert corpo['descricao']


@pytest.mark.parametrize('payload', [
    {'dias_ate_vencer': -1, 'media_consumo_dias': 7, 'quantidade': 10},    # dias negativos
    {'dias_ate_vencer': 10, 'media_consumo_dias': 0, 'quantidade': 10},    # média < 1
    {'dias_ate_vencer': 10, 'media_consumo_dias': 7, 'quantidade': 0},     # quantidade < 1
    {'dias_ate_vencer': 10, 'media_consumo_dias': 7},                      # campo ausente
    {'dias_ate_vencer': 'abc', 'media_consumo_dias': 7, 'quantidade': 1},  # tipo errado
    {},                                                                    # corpo vazio
])
def test_classificar_entrada_invalida_retorna_422(client, payload):
    assert client.post('/classificar', json=payload).status_code == 422


def test_modelo_da_api_concorda_com_a_arvore_local_do_app(client):
    """
    O app avalia a árvore localmente (services/arvore_decisao.json); a API usa o modelo
    treinado. Os dois precisam dar a MESMA classificação, senão o app e a API divergem.
    """
    raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    with open(os.path.join(raiz, 'services', 'arvore_decisao.json'), encoding='utf-8') as f:
        arvore = json.load(f)
    nos = arvore['nos']

    def local(dias, media, qtd):
        feats = [max(0, dias), max(1, media), max(1, qtd)]
        i = 0
        while 'classe' not in nos[i]:
            n = nos[i]
            i = n['esq'] if feats[n['feature']] <= n['limite'] else n['dir']
        return nos[i]['classe']

    divergencias = []
    for dias in (0, 2, 5, 7, 10, 15, 30, 60, 120, 365):
        for media in (1, 7, 15, 30, 90):
            for qtd in (1, 10, 100, 500):
                api = post_classificar(client, dias, media, qtd).json()['risco']
                if api != local(dias, media, qtd):
                    divergencias.append((dias, media, qtd, api, local(dias, media, qtd)))
    assert not divergencias, f'{len(divergencias)} divergências, ex.: {divergencias[:3]}'


# ── /agrupar-doacoes (K-Means) ───────────────────────────────────────────────

def historico(n_meses, base=100):
    """n_meses consecutivos a partir de jan/2025, 3 categorias, volumes variados."""
    out = []
    for i in range(n_meses):
        ano, mes = 2025 + i // 12, i % 12 + 1
        for cat, fator in (('alimentos', 1.0), ('higiene', 0.5), ('limpeza', 0.3)):
            out.append({'ano': ano, 'mes': mes, 'categoria': cat,
                        'total_unid': int(base * fator * (1 + (i % 4) * 0.5))})
    return out


def test_agrupar_historico_insuficiente(client):
    r = client.post('/agrupar-doacoes', json={'historico': historico(5)})
    assert r.status_code == 200
    corpo = r.json()
    assert corpo['suficiente'] is False
    assert corpo['clusters'] == []
    assert 'insuficiente' in corpo['motivo'].lower()


def test_agrupar_historico_suficiente_cobre_todos_os_meses(client):
    r = client.post('/agrupar-doacoes', json={'historico': historico(12), 'n_clusters': 3})
    corpo = r.json()
    assert r.status_code == 200 and corpo['suficiente'] is True
    assert 1 <= len(corpo['clusters']) <= 3
    assert sum(c['n_meses'] for c in corpo['clusters']) == 12
    for c in corpo['clusters']:
        assert set(c['perfil']) == {'alimentos', 'higiene', 'limpeza'}
        assert c['descricao']


def test_agrupar_identifica_cluster_do_mes_atual(client):
    r = client.post('/agrupar-doacoes', json={
        'historico': historico(12), 'mes_atual': 3, 'ano_atual': 2025, 'n_clusters': 3})
    corpo = r.json()
    assert corpo['cluster_mes_atual'] in {c['id'] for c in corpo['clusters']}
    assert corpo['descricao_mes_atual']


def test_agrupar_mes_atual_sem_dados_usa_estimativa(client):
    r = client.post('/agrupar-doacoes', json={
        'historico': historico(12), 'mes_atual': 6, 'ano_atual': 2030, 'n_clusters': 3})
    assert r.status_code == 200
    assert r.json()['cluster_mes_atual'] is not None


def test_agrupar_limita_k_ao_numero_de_meses(client):
    r = client.post('/agrupar-doacoes', json={'historico': historico(6), 'n_clusters': 6})
    corpo = r.json()
    assert r.status_code == 200 and len(corpo['clusters']) <= 6


def test_agrupar_ignora_categoria_desconhecida(client):
    h = historico(8) + [{'ano': 2025, 'mes': 1, 'categoria': 'brinquedos', 'total_unid': 999}]
    r = client.post('/agrupar-doacoes', json={'historico': h, 'n_clusters': 3})
    assert r.status_code == 200 and r.json()['suficiente'] is True


@pytest.mark.parametrize('payload', [
    {'historico': []},                                                             # vazio
    {},                                                                            # sem histórico
    {'historico': [{'ano': 2025, 'mes': 13, 'categoria': 'alimentos', 'total_unid': 1}]},  # mês 13
    {'historico': [{'ano': 2025, 'mes': 1, 'categoria': 'alimentos', 'total_unid': -5}]},  # negativo
    {'historico': [{'ano': 2025, 'mes': 1, 'categoria': 'alimentos', 'total_unid': 1}], 'n_clusters': 1},
    {'historico': [{'ano': 2025, 'mes': 1, 'categoria': 'alimentos', 'total_unid': 1}], 'n_clusters': 7},
])
def test_agrupar_entrada_invalida_retorna_422(client, payload):
    assert client.post('/agrupar-doacoes', json=payload).status_code == 422


# ── /prever-fim-estoque (Regressão Linear) ───────────────────────────────────

def saidas_diarias(n, qtd=1, inicio='2026-10-01'):
    from datetime import date, timedelta
    d0 = date.fromisoformat(inicio)
    return [{'data': (d0 + timedelta(days=i)).isoformat(), 'quantidade': qtd} for i in range(n)]


def prever(client, saidas, estoque):
    return client.post('/prever-fim-estoque', json={'saidas': saidas, 'estoque_atual': estoque})


def test_prever_estoque_zerado(client):
    corpo = prever(client, saidas_diarias(5), 0).json()
    assert corpo['dias_restantes'] == 0 and corpo['suficiente'] is True
    assert corpo['mensagem'] == 'Estoque zerado.'


def test_prever_dados_insuficientes(client):
    corpo = prever(client, saidas_diarias(2), 50).json()
    assert corpo['suficiente'] is False and corpo['dias_restantes'] is None


def test_prever_consumo_regular_estima_dias_corretamente(client):
    # 1 unidade por dia durante 10 dias, 20 unidades em estoque → ~20 dias
    corpo = prever(client, saidas_diarias(10, qtd=1), 20).json()
    assert corpo['suficiente'] is True
    assert corpo['taxa_unid_dia'] == pytest.approx(1.0, abs=0.01)
    assert corpo['dias_restantes'] == 20
    assert corpo['r2'] == pytest.approx(1.0, abs=0.01)


def test_prever_mensagem_de_urgencia_quando_acaba_em_ate_3_dias(client):
    corpo = prever(client, saidas_diarias(10, qtd=5), 10).json()   # 5/dia, 10 em estoque → 2 dias
    assert corpo['dias_restantes'] <= 3
    assert 'urgente' in corpo['mensagem']


def test_prever_mensagem_de_conforto_quando_dura_mais_de_30_dias(client):
    corpo = prever(client, saidas_diarias(10, qtd=1), 500).json()
    assert corpo['dias_restantes'] > 30
    assert 'confortável' in corpo['mensagem']


def test_prever_aceita_saidas_fora_de_ordem(client):
    saidas = list(reversed(saidas_diarias(10)))
    corpo = prever(client, saidas, 20).json()
    assert corpo['dias_restantes'] == 20


def test_prever_data_invalida_retorna_422(client):
    saidas = saidas_diarias(3)
    saidas[1]['data'] = '2026-13-45'
    assert prever(client, saidas, 10).status_code == 422


@pytest.mark.parametrize('payload', [
    {'saidas': [], 'estoque_atual': 10},                                            # sem saídas
    {'saidas': [{'data': '2026-10-01', 'quantidade': 0}], 'estoque_atual': 10},     # quantidade 0
    {'saidas': [{'data': '2026-10-01', 'quantidade': 1}], 'estoque_atual': -1},     # estoque negativo
    {'estoque_atual': 10},                                                          # sem saídas (campo)
])
def test_prever_entrada_invalida_retorna_422(client, payload):
    assert client.post('/prever-fim-estoque', json=payload).status_code == 422


def test_prever_varias_saidas_no_mesmo_dia_nao_detecta_consumo(client):
    """
    Limite conhecido do modelo: se TODAS as saídas ocorrem no mesmo dia, não há
    variação no tempo para a regressão e a API responde 'consumo não detectado'.
    """
    saidas = [{'data': '2026-10-01', 'quantidade': 2} for _ in range(4)]
    corpo = prever(client, saidas, 30).json()
    assert corpo['dias_restantes'] is None
    assert 'não detectado' in corpo['mensagem']
