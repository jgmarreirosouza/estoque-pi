/**
 * Testes unitários (Jest) de services/risco.ts — RF05 do plano de testes.
 * Cobrem: CT-08 (lote vencido), CT-09 (vence em ~5 dias) e CT-10 (vence em 6 meses),
 * além das funções de apoio (dias para vencer, código do lote, risco geral do produto).
 */
import {
  calcularRisco,
  classificarRiscoLocal,
  diasParaVencer,
  gerarCodigoLote,
  getRiscoProduto,
  aplicarRisco,
  aplicarRiscoMulti,
} from '../services/risco';

// "Hoje" fixo para os testes não dependerem do dia em que rodam.
const HOJE = new Date('2026-11-11T12:00:00');

/** Data ISO (AAAA-MM-DD) a `dias` dias de HOJE. */
function emDias(dias: number): string {
  const d = new Date(HOJE);
  d.setDate(d.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

beforeAll(() => {
  jest.useFakeTimers({ now: HOJE });
});
afterAll(() => {
  jest.useRealTimers();
});

describe('diasParaVencer', () => {
  it('é 0 para um lote que vence hoje', () => {
    expect(diasParaVencer(emDias(0))).toBe(0);
  });
  it('conta dias futuros', () => {
    expect(diasParaVencer(emDias(1))).toBe(1);
    expect(diasParaVencer(emDias(30))).toBe(30);
    expect(diasParaVencer(emDias(180))).toBe(180);
  });
  it('é negativo para lote vencido', () => {
    expect(diasParaVencer(emDias(-1))).toBe(-1);
    expect(diasParaVencer(emDias(-10))).toBe(-10);
  });
});

describe('calcularRisco (regra por prazo — usada como alternativa)', () => {
  it.each([
    [-3, 'risco_alto'],
    [0, 'risco_alto'],
    [7, 'risco_alto'],
    [8, 'atencao'],
    [30, 'atencao'],
    [31, 'seguro'],
    [365, 'seguro'],
  ])('lote a %i dia(s) do vencimento → %s', (dias, esperado) => {
    expect(calcularRisco(emDias(dias))).toBe(esperado);
  });
});

describe('classificarRiscoLocal (árvore de decisão) — CT-08, CT-09, CT-10', () => {
  it('CT-08: lote já vencido é Consumo Imediato (risco_alto)', () => {
    expect(classificarRiscoLocal(-5, 7, 10)).toBe('risco_alto');
    expect(classificarRiscoLocal(0, 7, 10)).toBe('risco_alto');
  });

  it('CT-09: lote que vence em cerca de 5 dias nunca é classificado como seguro', () => {
    for (const media of [1, 3, 7, 15, 30, 60]) {
      for (const qtd of [1, 5, 20, 100, 500]) {
        expect(classificarRiscoLocal(5, media, qtd)).not.toBe('seguro');
      }
    }
  });

  it('CT-10: lote que vence em 6 meses (consumo normal) é seguro', () => {
    expect(classificarRiscoLocal(180, 7, 10)).toBe('seguro');
    expect(classificarRiscoLocal(180, 15, 30)).toBe('seguro');
  });

  it('trata valores fora do domínio (dias negativos, média 0, quantidade 0) sem quebrar', () => {
    expect(['risco_alto', 'atencao', 'seguro']).toContain(classificarRiscoLocal(-100, 0, 0));
  });

  it('sempre devolve um dos três níveis conhecidos', () => {
    for (const dias of [-30, 0, 3, 10, 20, 45, 90, 400]) {
      expect(['risco_alto', 'atencao', 'seguro']).toContain(classificarRiscoLocal(dias, 7, 10));
    }
  });
});

describe('aplicarRisco / aplicarRiscoMulti', () => {
  it('aplicarRisco mantém os campos do lote e acrescenta o risco', () => {
    const lotes = [
      { id: 'a', validade: emDias(-2), quantidade: 5 },
      { id: 'b', validade: emDias(200), quantidade: 5 },
    ];
    const r = aplicarRisco(lotes, 7);
    expect(r.map((l) => l.id)).toEqual(['a', 'b']);
    expect(r[0].risco).toBe('risco_alto');
    expect(r[1].risco).toBe('seguro');
  });

  it('aplicarRiscoMulti usa a média de consumo de cada produto', () => {
    const lotes = [
      { produtoId: 'p1', validade: emDias(-1), quantidade: 3 },
      { produtoId: 'p2', validade: emDias(300), quantidade: 3 },
    ];
    const r = aplicarRiscoMulti(lotes, [
      { id: 'p1', mediaConsumoDias: 7 },
      { id: 'p2', mediaConsumoDias: 7 },
    ]);
    expect(r[0].risco).toBe('risco_alto');
    expect(r[1].risco).toBe('seguro');
  });

  it('aplicarRiscoMulti não quebra quando o produto do lote não está na lista', () => {
    const r = aplicarRiscoMulti([{ produtoId: 'x', validade: emDias(-1), quantidade: 1 }], []);
    expect(r[0].risco).toBe('risco_alto');
  });
});

describe('getRiscoProduto (risco geral = pior lote)', () => {
  it('risco_alto vence qualquer outro', () => {
    expect(getRiscoProduto([{ risco: 'seguro' }, { risco: 'risco_alto' }, { risco: 'atencao' }])).toBe('risco_alto');
  });
  it('atencao vence seguro', () => {
    expect(getRiscoProduto([{ risco: 'seguro' }, { risco: 'atencao' }])).toBe('atencao');
  });
  it('seguro quando todos seguros, sem lotes ou com risco ainda não calculado (null)', () => {
    expect(getRiscoProduto([{ risco: 'seguro' }])).toBe('seguro');
    expect(getRiscoProduto([])).toBe('seguro');
    expect(getRiscoProduto([{ risco: null }])).toBe('seguro');
  });
});

describe('gerarCodigoLote', () => {
  it('usa as iniciais do nome (até 3 letras), o ano e 2 dígitos', () => {
    expect(gerarCodigoLote('Arroz Integral Tipo Um')).toMatch(/^AIT2026\d{2}$/);
    expect(gerarCodigoLote('arroz integral')).toMatch(/^AI2026\d{2}$/);
  });
  it('completa com X quando o nome tem uma só letra inicial', () => {
    expect(gerarCodigoLote('Feijão')).toMatch(/^FX2026\d{2}$/);
  });
  it('não quebra com nome vazio', () => {
    expect(gerarCodigoLote('   ')).toMatch(/^XX2026\d{2}$/);
  });
});
