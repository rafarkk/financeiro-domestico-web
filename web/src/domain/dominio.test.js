import { describe, expect, it } from 'vitest'
import { Intervalo, TipoMovimento, TipoPlanejamento } from './enums.js'
import { calcularSaldos, calcularSaldosPorConta, calcularTotais } from './saldos.js'
import {
  deveDesbloquear,
  encontrarPar,
  gerarRepeticoes,
  novaMovimentacao,
  validarMovimentacao,
  valorAssinado,
} from './movimentacoes.js'
import { filtrarMovimentacoes, filtrosPadrao } from './filtros.js'
import {
  agruparPorMes,
  desmembrarTransferencia,
  gerarPrevisao,
  movimentacaoDePrevisto,
  planejamentoDeMovimentacao,
} from './planejamento.js'
import { gerarCsv } from './csv.js'
import { centavosDeTexto, formatarMoeda, formatarValor } from '../utils/dinheiro.js'
import { dataNoMes, formatarData, somarAnos, somarDias, somarMeses } from '../utils/datas.js'

describe('dinheiro', () => {
  it('formata centavos em reais', () => {
    expect(formatarMoeda(123456)).toBe('R$ 1.234,56')
    expect(formatarMoeda(-990)).toBe('-R$ 9,90')
    expect(formatarValor(5)).toBe('0,05')
  })

  it('lê a máscara de digitação', () => {
    expect(centavosDeTexto('1.234,56')).toBe(123456)
    expect(centavosDeTexto('R$ 0,07')).toBe(7)
    expect(centavosDeTexto('')).toBeNull()
  })
})

describe('datas', () => {
  it('soma dias, meses e anos respeitando o fim do mês', () => {
    expect(somarDias('2026-12-30', 3)).toBe('2027-01-02')
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28')
    expect(somarMeses('2026-11-15', 3)).toBe('2027-02-15')
    expect(somarMeses('2026-01-10', -3)).toBe('2025-10-10')
    expect(somarAnos('2024-02-29', 1)).toBe('2025-02-28')
  })

  it('ajusta o dia ao tamanho do mês', () => {
    expect(dataNoMes(2026, 11, 31)).toBe('2026-11-30')
    expect(dataNoMes(2027, 2, 30)).toBe('2027-02-28')
    expect(formatarData('2026-10-09')).toBe('09/10/2026')
  })
})

describe('saldos', () => {
  const movs = [
    { idConta: 'a', valor: 100000, bloqueada: false },
    { idConta: 'a', valor: -25000, bloqueada: false },
    { idConta: 'a', valor: -10000, bloqueada: true },
    { idConta: 'b', valor: -30000, bloqueada: false },
  ]
  const contas = [
    { id: 'a', limiteCredito: null, filtravel: true },
    { id: 'b', limiteCredito: 200000, filtravel: true },
    { id: 'c', limiteCredito: null, filtravel: false },
  ]

  it('separa efetivado de pendente e soma o limite', () => {
    expect(calcularSaldos(contas[0], movs.slice(0, 3))).toEqual({
      movimentacoes: 75000,
      disponivel: 75000,
      pendente: -10000,
      saldoFuturo: 65000,
    })
    expect(calcularSaldos(contas[1], [movs[3]])).toEqual({
      movimentacoes: -30000,
      disponivel: 170000,
      pendente: 0,
      saldoFuturo: 170000,
    })
  })

  it('totaliza apenas as contas ligadas', () => {
    const saldos = calcularSaldosPorConta(contas, [...movs, { idConta: 'c', valor: 999900, bloqueada: false }])
    expect(calcularTotais(contas, saldos)).toEqual({ geral: 45000, disponivel: 245000, futuro: 235000 })
  })
})

describe('movimentações', () => {
  const hoje = '2026-10-09'

  it('grava saídas como valor negativo', () => {
    expect(valorAssinado(TipoMovimento.DEBITO, 5000)).toBe(-5000)
    expect(valorAssinado(TipoMovimento.TRANSFERENCIA_ORIGEM, 5000)).toBe(-5000)
    expect(valorAssinado(TipoMovimento.CREDITO, -5000)).toBe(5000)
  })

  it('gera repetições mensais a partir da data inicial, bloqueando as futuras', () => {
    const inicial = {
      ...novaMovimentacao({ idConta: 'a', tipoMovimentacao: TipoMovimento.DEBITO, hoje }),
      id: 'm1',
      valor: -9900,
      dataMovimento: '2026-08-31',
      dataVencimento: '2026-08-31',
      lancarRepetido: true,
      qtdRepeticoes: 4,
      prazoRepeticoes: 1,
      intervaloRepeticoes: Intervalo.MESES,
    }
    const repeticoes = gerarRepeticoes(inicial, hoje)
    expect(repeticoes.map((r) => r.dataMovimento)).toEqual(['2026-09-30', '2026-10-31', '2026-11-30'])
    expect(repeticoes.map((r) => r.bloqueada)).toEqual([false, true, true])
    expect(repeticoes.map((r) => r.numeroRepeticaoAtual)).toEqual([1, 2, 3])
    expect(repeticoes.every((r) => r.idMovimentacaoInicial === 'm1' && r.id === undefined)).toBe(true)
  })

  it('gera repetições em semanas', () => {
    const inicial = { id: 'm1', dataMovimento: hoje, dataVencimento: null, qtdRepeticoes: 3, prazoRepeticoes: 2, intervaloRepeticoes: Intervalo.SEMANAS }
    expect(gerarRepeticoes(inicial, hoje).map((r) => r.dataMovimento)).toEqual(['2026-10-23', '2026-11-06'])
  })

  it('encontra a outra ponta da transferência', () => {
    const origem = { id: 'o', tipoMovimentacao: TipoMovimento.TRANSFERENCIA_ORIGEM, idMovimentacaoDestino: 'd' }
    const destino = { id: 'd', tipoMovimentacao: TipoMovimento.TRANSFERENCIA_DESTINO }
    const comum = { id: 'x', tipoMovimentacao: TipoMovimento.DEBITO }
    const todas = [origem, destino, comum]
    expect(encontrarPar(origem, todas)).toBe(destino)
    expect(encontrarPar(destino, todas)).toBe(origem)
    expect(encontrarPar(comum, todas)).toBeNull()
  })

  it('desbloqueia apenas quando a data chegou', () => {
    const mov = { bloqueada: true, desbloqueioAutomatico: true, dataDesbloqueioAutomatico: '2026-10-09' }
    expect(deveDesbloquear(mov, '2026-10-08')).toBe(false)
    expect(deveDesbloquear(mov, '2026-10-09')).toBe(true)
    expect(deveDesbloquear({ ...mov, desbloqueioAutomatico: false }, '2026-12-01')).toBe(false)
  })

  it('valida os dados do formulário', () => {
    const base = { ...novaMovimentacao({ idConta: 'a', tipoMovimentacao: TipoMovimento.DEBITO, hoje }), valor: 100 }
    expect(validarMovimentacao(base, hoje)).toBeNull()
    expect(validarMovimentacao({ ...base, valor: 0 }, hoje)).toMatch(/valor/)
    expect(
      validarMovimentacao({ ...base, bloqueada: true, desbloqueioAutomatico: true, dataDesbloqueioAutomatico: hoje }, hoje),
    ).toMatch(/FUTURA/)
    expect(
      validarMovimentacao({ ...base, tipoMovimentacao: TipoMovimento.TRANSFERENCIA_ORIGEM, idContaDestino: 'a' }, hoje),
    ).toMatch(/destino/)
    expect(validarMovimentacao({ ...base, lancarRepetido: true, qtdRepeticoes: 1 }, hoje)).toMatch(/repetições/)
  })
})

describe('filtros', () => {
  const hoje = '2026-10-09'
  const movs = [
    { id: '1', idConta: 'a', descricao: 'Mercado do Bairro', valor: -15000, dataMovimento: '2026-10-01', tipoMovimentacao: TipoMovimento.DEBITO, idCategoria: 'c1' },
    { id: '2', idConta: 'a', descricao: 'Salário', valor: 500000, dataMovimento: '2026-10-05', tipoMovimentacao: TipoMovimento.CREDITO, idCategoria: null },
    { id: '3', idConta: 'b', descricao: null, valor: 20000, dataMovimento: '2026-09-10', tipoMovimentacao: TipoMovimento.TRANSFERENCIA_DESTINO, idCategoria: null },
    { id: '4', idConta: 'a', descricao: 'Antigo', valor: -100, dataMovimento: '2026-01-01', tipoMovimentacao: TipoMovimento.DEBITO, idCategoria: null },
    { id: '5', idConta: 'a', descricao: 'Futuro', valor: -100, dataMovimento: '2026-11-01', tipoMovimentacao: TipoMovimento.DEBITO, idCategoria: null },
  ]
  const ids = (filtros, ocultas) => filtrarMovimentacoes(movs, { ...filtrosPadrao(hoje), ...filtros }, ocultas).map((m) => m.id)

  it('usa os últimos 3 meses por padrão, do mais recente para o mais antigo', () => {
    expect(ids({})).toEqual(['2', '1', '3'])
  })

  it('busca a descrição sem diferenciar maiúsculas', () => {
    expect(ids({ descricao: 'MERCADO' })).toEqual(['1'])
  })

  it('filtra por tipo incluindo as pontas de transferência', () => {
    expect(ids({ tipo: String(TipoMovimento.CREDITO) })).toEqual(['2', '3'])
    expect(ids({ tipo: TipoMovimento.DEBITO })).toEqual(['1'])
  })

  it('filtra por categoria, faixa de valor e contas ocultas', () => {
    expect(ids({ idCategoria: 'c1' })).toEqual(['1'])
    expect(ids({ valorInicial: 15000, valorFinal: 20000 })).toEqual(['1', '3'])
    expect(ids({}, new Set(['a']))).toEqual(['3'])
  })
})

describe('planejamento', () => {
  const planos = [
    { id: 'p1', descricao: 'Aluguel', valor: 150000, diaVencimento: 31, valorVariavel: false, tipoPlanejamento: TipoPlanejamento.DESPESA, idConta: 'a', idCategoria: 'c1' },
    { id: 'p2', descricao: 'Salário', valor: 500000, diaVencimento: 5, valorVariavel: false, tipoPlanejamento: TipoPlanejamento.RECEITA, idConta: 'a', idCategoria: null },
  ]

  it('projeta os próximos 3 meses virando o ano e ajustando o dia 31', () => {
    const previsao = gerarPrevisao(planos, '2026-11-20')
    expect(previsao.map((i) => i.dataVencimento)).toEqual([
      '2026-12-05', '2026-12-31', '2027-01-05', '2027-01-31', '2027-02-05', '2027-02-28',
    ])
    expect(agruparPorMes(previsao).map((g) => [g.titulo, g.itens.length])).toEqual([
      ['Dezembro 2026', 2], ['Janeiro 2027', 2], ['Fevereiro 2027', 2],
    ])
  })

  it('transforma um item previsto em lançamento com o sinal certo', () => {
    const [receita, despesa] = gerarPrevisao(planos, '2026-10-09')
    const lancDespesa = movimentacaoDePrevisto(despesa, '2026-10-09')
    expect(lancDespesa).toMatchObject({ valor: -150000, tipoMovimentacao: TipoMovimento.DEBITO, dataMovimento: '2026-10-09', dataVencimento: '2026-11-30', idCategoria: 'c1', bloqueada: false })
    expect(movimentacaoDePrevisto(receita, '2026-10-09')).toMatchObject({ valor: 500000, tipoMovimentacao: TipoMovimento.CREDITO })
  })

  it('desmembra a transferência em despesa na origem e receita no destino', () => {
    const [despesa, receita] = desmembrarTransferencia({ descricao: 'Poupança', valor: 1000, idConta: 'a', idContaDestino: 'b', tipoPlanejamento: TipoPlanejamento.TRANSFERENCIA })
    expect(despesa).toMatchObject({ idConta: 'a', tipoPlanejamento: TipoPlanejamento.DESPESA })
    expect(receita).toMatchObject({ idConta: 'b', tipoPlanejamento: TipoPlanejamento.RECEITA })
  })

  it('cria o rascunho a partir de um lançamento', () => {
    const despesa = { idConta: 'a', valor: -4590, descricao: 'Internet', dataVencimento: '2026-10-17', dataMovimento: '2026-10-09', idCategoria: 'c1', tipoMovimentacao: TipoMovimento.DEBITO }
    expect(planejamentoDeMovimentacao(despesa)).toMatchObject({ valor: 4590, diaVencimento: 17, tipoPlanejamento: TipoPlanejamento.DESPESA, idConta: 'a', idCategoria: 'c1' })

    const destino = { idConta: 'b', valor: 1000, dataMovimento: '2026-10-09', tipoMovimentacao: TipoMovimento.TRANSFERENCIA_DESTINO }
    const origem = { idConta: 'a', valor: -1000, dataMovimento: '2026-10-09', tipoMovimentacao: TipoMovimento.TRANSFERENCIA_ORIGEM }
    expect(planejamentoDeMovimentacao(destino, origem)).toMatchObject({ tipoPlanejamento: TipoPlanejamento.TRANSFERENCIA, idConta: 'a', idContaDestino: 'b' })
  })
})

describe('csv', () => {
  it('exporta com cabeçalho, ponto decimal e campos escapados', () => {
    const csv = gerarCsv(
      [{ id: 'm1', dataMovimento: '2026-10-01', dataVencimento: null, descricao: 'Pão, leite e "café"', valor: -1250, idConta: 'a', idCategoria: 'apagada', bloqueada: true, desbloqueioAutomatico: false, dataDesbloqueioAutomatico: null }],
      [{ id: 'a', nome: 'Carteira' }],
      [],
    )
    const [cabecalho, linha] = csv.split('\r\n')
    expect(cabecalho.split(',')).toHaveLength(12)
    expect(linha).toBe('m1,2026-10-01,,"Pão, leite e ""café""",-12.50,a,Carteira,-,Sem Categoria,Sim,Não,-')
  })
})
