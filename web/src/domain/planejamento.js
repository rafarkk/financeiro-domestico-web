import { TipoMovimento, TipoPlanejamento } from './enums.js'
import { ehTransferencia, novaMovimentacao } from './movimentacoes.js'
import { MESES, dataNoMes } from '../utils/datas.js'

export function nomeDoPlanejamento(tipo) {
  if (tipo === TipoPlanejamento.RECEITA) return 'Receita'
  if (tipo === TipoPlanejamento.DESPESA) return 'Despesa'
  return 'Transferência'
}

export function novoPlanejamento(tipoPlanejamento, idConta = null) {
  return {
    descricao: '',
    valor: 0,
    diaVencimento: 1,
    valorVariavel: false,
    idCategoria: null,
    idConta,
    idContaDestino: null,
    tipoPlanejamento,
  }
}

export function validarPlanejamento(plan) {
  if (!plan.descricao?.trim()) return 'Não é possível salvar um planejamento sem descrição.'
  const dia = Number(plan.diaVencimento)
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return 'Dia de vencimento inválido.'
  if (!plan.idConta) return 'Escolha a conta dos lançamentos.'
  if (plan.tipoPlanejamento === TipoPlanejamento.TRANSFERENCIA && !plan.id) {
    if (!plan.idContaDestino || plan.idContaDestino === plan.idConta) return 'Selecione uma conta destino válida.'
  }
  return null
}

// Uma transferência planejada vira dois planejamentos: a despesa na origem e a receita no destino.
export function desmembrarTransferencia(plan) {
  return [
    { ...plan, tipoPlanejamento: TipoPlanejamento.DESPESA },
    { ...plan, idConta: plan.idContaDestino, tipoPlanejamento: TipoPlanejamento.RECEITA },
  ]
}

// Rascunho de planejamento a partir de um lançamento existente (ação "Planejar").
// `par` é a outra ponta quando o lançamento é uma transferência.
export function planejamentoDeMovimentacao(mov, par = null) {
  let tipoPlanejamento = TipoPlanejamento.RECEITA
  let idConta = mov.idConta
  let idContaDestino = null

  if (mov.tipoMovimentacao === TipoMovimento.DEBITO) {
    tipoPlanejamento = TipoPlanejamento.DESPESA
  } else if (ehTransferencia(mov.tipoMovimentacao)) {
    tipoPlanejamento = TipoPlanejamento.TRANSFERENCIA
    const origem = mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM ? mov : par
    const destino = mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM ? par : mov
    idConta = origem?.idConta ?? mov.idConta
    idContaDestino = destino?.idConta ?? mov.idContaDestino ?? null
  }

  const dataBase = mov.dataVencimento || mov.dataMovimento
  return {
    ...novoPlanejamento(tipoPlanejamento, idConta),
    descricao: mov.descricao ?? '',
    valor: Math.abs(mov.valor),
    diaVencimento: dataBase ? Number(dataBase.slice(8, 10)) : 1,
    idCategoria: mov.idCategoria ?? null,
    idContaDestino,
  }
}

// Lançamentos previstos: cada planejamento projetado nos próximos `meses` meses, em ordem de vencimento.
export function gerarPrevisao(planejamentos, hoje, meses = 3) {
  const [ano, mes] = hoje.split('-').map(Number)
  const itens = []
  for (const plan of planejamentos) {
    for (let i = 1; i <= meses; i++) {
      const total = ano * 12 + (mes - 1) + i
      const anoAlvo = Math.floor(total / 12)
      const mesAlvo = (total % 12) + 1
      itens.push({
        chave: `${plan.id}:${anoAlvo}-${mesAlvo}`,
        idPlanejamento: plan.id,
        descricao: plan.descricao,
        valor: plan.valor,
        valorVariavel: plan.valorVariavel,
        tipoPlanejamento: plan.tipoPlanejamento,
        idConta: plan.idConta,
        idCategoria: plan.idCategoria ?? null,
        dataVencimento: dataNoMes(anoAlvo, mesAlvo, Number(plan.diaVencimento)),
      })
    }
  }
  return itens.sort(
    (a, b) =>
      a.dataVencimento.localeCompare(b.dataVencimento) ||
      a.descricao.localeCompare(b.descricao) ||
      a.tipoPlanejamento - b.tipoPlanejamento ||
      a.chave.localeCompare(b.chave),
  )
}

// [{ chave: "2026-11", titulo: "Novembro 2026", itens: [...] }]
export function agruparPorMes(itens) {
  const grupos = []
  for (const item of itens) {
    const chave = item.dataVencimento.slice(0, 7)
    let grupo = grupos[grupos.length - 1]
    if (!grupo || grupo.chave !== chave) {
      const [ano, mes] = chave.split('-').map(Number)
      grupo = { chave, titulo: `${MESES[mes - 1]} ${ano}`, itens: [] }
      grupos.push(grupo)
    }
    grupo.itens.push(item)
  }
  return grupos
}

// Lançamento gerado ao confirmar um item previsto.
export function movimentacaoDePrevisto(item, hoje) {
  const despesa = item.tipoPlanejamento === TipoPlanejamento.DESPESA
  return {
    ...novaMovimentacao({
      idConta: item.idConta,
      tipoMovimentacao: despesa ? TipoMovimento.DEBITO : TipoMovimento.CREDITO,
      hoje,
    }),
    dataVencimento: item.dataVencimento,
    descricao: item.descricao,
    idCategoria: item.idCategoria ?? null,
    valor: despesa ? -Math.abs(item.valor) : Math.abs(item.valor),
    qtdRepeticoes: 1,
  }
}
