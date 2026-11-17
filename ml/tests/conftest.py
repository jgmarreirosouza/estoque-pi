"""
Fixtures dos testes da API de ML (Pytest + FastAPI TestClient).

O modelo da Árvore de Decisão (modelo/classificador.joblib) não fica no repositório:
ele é gerado por gerar_dataset.py + treinar_modelo.py. Para o teste não depender de
nenhum arquivo externo, a fixture abaixo treina o modelo UMA vez numa pasta temporária
(sem tocar em services/arvore_decisao.json nem em nenhum arquivo do projeto) e carrega
o app.py a partir de uma cópia nessa mesma pasta.
"""
import importlib.util
import os
import shutil
import subprocess
import sys

import pytest
from fastapi.testclient import TestClient

ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture(scope='session')
def pasta_temp(tmp_path_factory):
    return tmp_path_factory.mktemp('ml')


@pytest.fixture(scope='session')
def app_modulo(pasta_temp):
    raiz = str(pasta_temp)
    ml = os.path.join(raiz, 'ml')
    os.makedirs(os.path.join(raiz, 'services'))           # destino do JSON da árvore (descartável)
    os.makedirs(os.path.join(ml, 'space', 'modelo'))
    for nome in ('gerar_dataset.py', 'treinar_modelo.py'):
        shutil.copy(os.path.join(ML_DIR, nome), ml)

    # No Windows a codificação padrão (cp1252) não escreve os caracteres especiais que os
    # scripts de treino imprimem; forçar UTF-8 deixa o resultado igual em qualquer sistema.
    env = {**os.environ, 'PYTHONUTF8': '1', 'PYTHONIOENCODING': 'utf-8'}
    for script in ('gerar_dataset.py', 'treinar_modelo.py'):
        r = subprocess.run([sys.executable, script], cwd=ml, capture_output=True,
                           text=True, encoding='utf-8', env=env)
        assert r.returncode == 0, f'{script} falhou:\n{r.stdout}\n{r.stderr}'

    shutil.move(os.path.join(ml, 'modelo', 'classificador.joblib'),
                os.path.join(ml, 'space', 'modelo', 'classificador.joblib'))
    shutil.copy(os.path.join(ML_DIR, 'space', 'app.py'), os.path.join(ml, 'space', 'app.py'))

    spec = importlib.util.spec_from_file_location('app_ml', os.path.join(ml, 'space', 'app.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.ARVORE_JSON_TEMP = os.path.join(raiz, 'services', 'arvore_decisao.json')
    return mod


@pytest.fixture(scope='session')
def client(app_modulo):
    return TestClient(app_modulo.app)
