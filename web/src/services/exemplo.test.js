import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { repos } from '../data/index.js'
import { TipoConta, TipoMovimento, TipoPlanejamento } from '../domain/enums.js'
import { filtrarMovimentacoes, filtrosPadrao } from '../domain/filtros.js'
import { gerarPrevisao } from '../domain/planejamento.js'
import { calcularSaldosPorConta, calcularTotais } from '../domain/saldos.js'
import { apagarTudo, carregarDadosDeExemplo } from './exemplo.js'

const hoje = '2026-10-09'

describe('dados de exemplo', () => {
  it('preenche todas as áreas e pode ser recarregado sem duplicar', async () => {
    await carregarDadosDeExemplo(hoje)
    const resumo = await carregarDadosDeExemplo(hoje)
    expect(resumo).toEqual({ contas: 5, categorias: 9, movimentacoes: 42, planejamentos: 8 })

    const contas = await repos.contas.listar()
    const movs = await repos.movimentacoes.listar()
    const planos = await repos.planejamentos.listar()

    // cobre os casos que as telas precisam mostrar
    expect(contas.filter((c) => c.tipoConta === TipoConta.CREDITO)).toHaveLength(2)
    expect(contas.filter((c) => !c.filtravel)).toHaveLength(1)
    expect(new Set(movs.map((m) => m.tipoMovimentacao)).size).toBe(4)
    expect(movs.filter((m) => m.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM)).toHaveLength(4)
    expect(movs.filter((m) => m.bloqueada && m.desbloqueioAutomatico)).toHaveLength(1)
    expect(movs.filter((m) => m.idMovimentacaoInicial)).toHaveLength(5)
    expect(movs.filter((m) => m.parcelas > 1)).toHaveLength(2)
    expect(movs.every((m) => contas.some((c) => c.id === m.idConta))).toBe(true)
    expect(planos.filter((p) => p.valorVariavel)).toHaveLength(2)
    expect(planos.filter((p) => p.tipoPlanejamento === TipoPlanejamento.RECEITA)).toHaveLength(2)

    // há lançamentos antigos e futuros fora do filtro padrão da home
    const visiveis = filtrarMovimentacoes(movs, filtrosPadrao(hoje))
    expect(visiveis.length).toBeGreaterThan(30)
    expect(visiveis.length).toBeLessThan(movs.length)
    expect(gerarPrevisao(planos, hoje)).toHaveLength(24)

    const totais = calcularTotais(contas, calcularSaldosPorConta(contas, movs))
    expect(totais.geral).toBeGreaterThan(0)
    expect(totais.futuro).not.toBe(totais.disponivel)

    await apagarTudo()
    expect(await repos.contas.listar()).toHaveLength(0)
    expect(await repos.movimentacoes.listar()).toHaveLength(0)
  })
})
