import { repos } from '../data/index.js'
import { TipoConta, TipoPlanejamento } from '../domain/enums.js'
import { encontrarPar } from '../domain/movimentacoes.js'
import { desmembrarTransferencia, validarPlanejamento } from '../domain/planejamento.js'

const igual = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()
const diaValido = (dia) => Number.isInteger(dia) && dia >= 1 && dia <= 31

export function novaConta() {
  return {
    nome: '',
    responsavel: '',
    numeroCartao: '',
    infosAdicionais: '',
    tipoConta: TipoConta.DEBITO,
    limiteCredito: null,
    diaVencimento: 1,
    melhorDiaCompra: 1,
    filtravel: true,
  }
}

export async function salvarConta(dados) {
  const nome = (dados.nome ?? '').trim()
  if (!nome) throw new Error('Informe o nome da conta.')

  const credito = dados.tipoConta === TipoConta.CREDITO
  const diaVencimento = Number(dados.diaVencimento)
  const melhorDiaCompra = Number(dados.melhorDiaCompra)
  if (credito && (!diaValido(diaVencimento) || !diaValido(melhorDiaCompra))) {
    throw new Error('Dia de vencimento e/ou Melhor dia de compra inválidos.')
  }

  const contas = await repos.contas.listar()
  if (contas.some((c) => c.id !== dados.id && igual(c.nome, nome))) {
    throw new Error('Já existe uma conta com este nome.')
  }

  const conta = {
    ...dados,
    nome,
    responsavel: (dados.responsavel ?? '').trim(),
    limiteCredito: credito ? (dados.limiteCredito ?? 0) : null,
    diaVencimento: credito ? diaVencimento : 1,
    melhorDiaCompra: credito ? melhorDiaCompra : 1,
  }
  return conta.id ? repos.contas.atualizar(conta) : repos.contas.criar(conta)
}

// Exclui a conta, os lançamentos dela e a outra ponta das transferências que a envolvem.
export async function excluirConta(id) {
  const todas = await repos.movimentacoes.listar()
  for (const mov of todas.filter((m) => m.idConta === id)) {
    const par = encontrarPar(mov, todas)
    if (par) await repos.movimentacoes.excluir(par.id)
    await repos.movimentacoes.excluir(mov.id)
  }
  await repos.contas.excluir(id)
}

export async function salvarCategoria(dados) {
  const nome = (dados.nome ?? '').trim()
  if (!nome) throw new Error('Não é possível cadastrar categorias sem um nome.')

  const categorias = await repos.categorias.listar()
  if (categorias.some((c) => c.id !== dados.id && igual(c.nome, nome))) {
    throw new Error('Já existe uma categoria com este nome.')
  }
  return dados.id ? repos.categorias.atualizar({ ...dados, nome }) : repos.categorias.criar({ nome })
}

export async function salvarPlanejamento(dados) {
  const erro = validarPlanejamento(dados)
  if (erro) throw new Error(erro)

  const plan = {
    ...dados,
    descricao: dados.descricao.trim(),
    diaVencimento: Number(dados.diaVencimento),
    idCategoria: dados.idCategoria || null,
    valor: Math.abs(dados.valor || 0),
  }
  if (plan.id) return repos.planejamentos.atualizar(plan)

  if (plan.tipoPlanejamento === TipoPlanejamento.TRANSFERENCIA) {
    for (const parte of desmembrarTransferencia(plan)) await repos.planejamentos.criar(parte)
    return null
  }
  return repos.planejamentos.criar(plan)
}
