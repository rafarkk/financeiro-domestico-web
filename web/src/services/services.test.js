import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { repos } from '../data/index.js'
import { TipoConta, TipoMovimento, TipoPlanejamento } from '../domain/enums.js'
import { novaMovimentacao } from '../domain/movimentacoes.js'
import { calcularSaldos } from '../domain/saldos.js'
import { excluirConta, novaConta, salvarCategoria, salvarConta, salvarPlanejamento } from './cadastros.js'
import { desbloquearVencidas, excluirMovimentacao, lancarPrevistos, salvarMovimentacao } from './movimentacoes.js'

const hoje = '2026-10-09'
let sequencia = 0
const criarConta = (extra = {}) => salvarConta({ ...novaConta(), nome: `Conta ${++sequencia}`, ...extra })
const lancamento = (idConta, tipoMovimentacao, extra = {}) => ({
  ...novaMovimentacao({ idConta, tipoMovimentacao, hoje }),
  valor: 10000,
  ...extra,
})
const saldosDe = async (conta) => calcularSaldos(conta, await repos.movimentacoes.listarPorConta(conta.id))

describe('contas e categorias', () => {
  it('não aceita nome vazio nem repetido', async () => {
    await criarConta({ nome: 'Nubank' })
    await expect(salvarConta({ ...novaConta(), nome: ' nubank ' })).rejects.toThrow('Já existe')
    await expect(salvarConta({ ...novaConta(), nome: '  ' })).rejects.toThrow('nome')
  })

  it('valida os dias da conta de crédito e zera o limite da conta comum', async () => {
    await expect(criarConta({ tipoConta: TipoConta.CREDITO, diaVencimento: 32 })).rejects.toThrow('inválidos')
    const comum = await criarConta({ limiteCredito: 5000 })
    expect(comum.limiteCredito).toBeNull()
  })

  it('permite editar a categoria mantendo o próprio nome', async () => {
    const categoria = await salvarCategoria({ nome: 'Lazer' })
    await expect(salvarCategoria({ ...categoria, nome: 'Lazer' })).resolves.toMatchObject({ id: categoria.id })
    await expect(salvarCategoria({ nome: 'lazer' })).rejects.toThrow('Já existe')
  })
})

describe('lançamentos', () => {
  it('cria despesa negativa e a série de repetições', async () => {
    const conta = await criarConta()
    const inicial = await salvarMovimentacao(
      lancamento(conta.id, TipoMovimento.DEBITO, { lancarRepetido: true, qtdRepeticoes: 3, prazoRepeticoes: 1 }),
      hoje,
    )
    const todas = await repos.movimentacoes.listarPorConta(conta.id)
    expect(todas).toHaveLength(3)
    expect(todas.every((m) => m.valor === -10000)).toBe(true)
    expect(await saldosDe(conta)).toMatchObject({ movimentacoes: -10000, pendente: -20000, saldoFuturo: -30000 })

    await salvarMovimentacao({ ...inicial, valor: 12000, descricao: 'Academia' }, hoje)
    const repeticoes = await repos.movimentacoes.listarRepeticoes(inicial.id)
    expect(repeticoes).toHaveLength(2)
    expect(repeticoes.every((m) => m.valor === -12000 && m.descricao === 'Academia' && m.bloqueada)).toBe(true)
  })

  it('cria, edita e exclui as duas pontas da transferência', async () => {
    const origem = await criarConta()
    const destino = await criarConta()
    const mov = await salvarMovimentacao(
      lancamento(origem.id, TipoMovimento.TRANSFERENCIA_ORIGEM, { idContaDestino: destino.id }),
      hoje,
    )
    expect(mov.valor).toBe(-10000)
    expect((await saldosDe(origem)).movimentacoes).toBe(-10000)
    expect((await saldosDe(destino)).movimentacoes).toBe(10000)

    await salvarMovimentacao({ ...mov, valor: 25000, bloqueada: true }, hoje)
    expect(await saldosDe(origem)).toMatchObject({ movimentacoes: 0, pendente: -25000 })
    expect(await saldosDe(destino)).toMatchObject({ movimentacoes: 0, pendente: 25000 })

    // excluir pelo lado do destino remove também a origem
    await excluirMovimentacao(mov.idMovimentacaoDestino)
    expect(await repos.movimentacoes.listarPorConta(origem.id)).toHaveLength(0)
    expect(await repos.movimentacoes.listarPorConta(destino.id)).toHaveLength(0)
  })

  it('ao excluir a conta leva junto a outra ponta das transferências', async () => {
    const a = await criarConta()
    const b = await criarConta()
    await salvarMovimentacao(lancamento(a.id, TipoMovimento.TRANSFERENCIA_ORIGEM, { idContaDestino: b.id }), hoje)
    await salvarMovimentacao(lancamento(b.id, TipoMovimento.TRANSFERENCIA_ORIGEM, { idContaDestino: a.id }), hoje)
    await salvarMovimentacao(lancamento(b.id, TipoMovimento.CREDITO), hoje)

    await excluirConta(a.id)
    expect(await repos.contas.obter(a.id)).toBeNull()
    const restantes = await repos.movimentacoes.listarPorConta(b.id)
    expect(restantes.map((m) => m.tipoMovimentacao)).toEqual([TipoMovimento.CREDITO])
  })

  it('desbloqueia automaticamente na data marcada', async () => {
    const conta = await criarConta()
    await salvarMovimentacao(
      lancamento(conta.id, TipoMovimento.CREDITO, { bloqueada: true, desbloqueioAutomatico: true, dataDesbloqueioAutomatico: '2026-10-20' }),
      hoje,
    )
    expect(await desbloquearVencidas('2026-10-19')).toBe(0)
    expect(await desbloquearVencidas('2026-10-20')).toBe(1)
    expect(await saldosDe(conta)).toMatchObject({ movimentacoes: 10000, pendente: 0 })
  })
})

describe('planejamentos', () => {
  it('salva a transferência como dois planejamentos e lança os previstos', async () => {
    const a = await criarConta()
    const b = await criarConta()
    await salvarPlanejamento({ descricao: 'Reserva', valor: 30000, diaVencimento: 10, valorVariavel: false, idCategoria: null, idConta: a.id, idContaDestino: b.id, tipoPlanejamento: TipoPlanejamento.TRANSFERENCIA })
    const planos = (await repos.planejamentos.listar()).filter((p) => p.descricao === 'Reserva')
    expect(planos.map((p) => [p.idConta, p.tipoPlanejamento]).sort()).toEqual(
      [[a.id, TipoPlanejamento.DESPESA], [b.id, TipoPlanejamento.RECEITA]].sort(),
    )

    const itens = planos.map((p) => ({ ...p, dataVencimento: '2026-11-10' }))
    const resultado = await lancarPrevistos([...itens, { ...itens[0], idConta: 'conta-apagada' }], hoje)
    expect(resultado).toEqual({ lancados: 2, semConta: 1 })
    expect((await saldosDe(a)).movimentacoes).toBe(-30000)
    expect((await saldosDe(b)).movimentacoes).toBe(30000)
  })

  it('exige descrição e dia válido', async () => {
    const conta = await criarConta()
    const base = { descricao: 'Luz', valor: 100, diaVencimento: 10, idConta: conta.id, tipoPlanejamento: TipoPlanejamento.DESPESA }
    await expect(salvarPlanejamento({ ...base, descricao: ' ' })).rejects.toThrow('descrição')
    await expect(salvarPlanejamento({ ...base, diaVencimento: 0 })).rejects.toThrow('inválido')
  })
})
