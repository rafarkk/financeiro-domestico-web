import { novoId, repos } from '../data/index.js'
import { TipoMovimento } from '../domain/enums.js'
import {
  deveDesbloquear,
  encontrarPar,
  gerarRepeticoes,
  validarMovimentacao,
  valorAssinado,
} from '../domain/movimentacoes.js'
import { movimentacaoDePrevisto } from '../domain/planejamento.js'
import { hojeISO } from '../utils/datas.js'

// Campos que as duas pontas de uma transferência compartilham.
function espelhar(origem) {
  return {
    valor: Math.abs(origem.valor),
    dataMovimento: origem.dataMovimento,
    dataVencimento: origem.dataVencimento,
    descricao: origem.descricao,
    idCategoria: origem.idCategoria,
    parcelas: origem.parcelas,
    bloqueada: origem.bloqueada,
    desbloqueioAutomatico: origem.desbloqueioAutomatico,
    dataDesbloqueioAutomatico: origem.dataDesbloqueioAutomatico,
  }
}

async function salvarTransferencia(origem) {
  if (!origem.id) {
    const idDestino = novoId()
    await repos.movimentacoes.criar({
      ...origem,
      ...espelhar(origem),
      id: idDestino,
      idConta: origem.idContaDestino,
      idContaDestino: null,
      idMovimentacaoDestino: null,
      tipoMovimentacao: TipoMovimento.TRANSFERENCIA_DESTINO,
    })
    return repos.movimentacoes.criar({ ...origem, id: novoId(), idMovimentacaoDestino: idDestino })
  }

  const destino = await repos.movimentacoes.obter(origem.idMovimentacaoDestino)
  if (destino) await repos.movimentacoes.atualizar({ ...destino, ...espelhar(origem) })
  return repos.movimentacoes.atualizar(origem)
}

// `dados.valor` chega como digitado (positivo); o sinal é aplicado aqui conforme o tipo.
// Sem `dados.id` cria; com `dados.id` atualiza.
export async function salvarMovimentacao(dados, hoje = hojeISO()) {
  const erro = validarMovimentacao(dados, hoje)
  if (erro) throw new Error(erro)

  const bloqueada = Boolean(dados.bloqueada)
  const automatico = bloqueada && Boolean(dados.desbloqueioAutomatico)
  const mov = {
    ...dados,
    valor: valorAssinado(dados.tipoMovimentacao, dados.valor),
    descricao: (dados.descricao ?? '').trim(),
    idCategoria: dados.idCategoria || null,
    parcelas: Math.max(1, Number(dados.parcelas) || 1),
    bloqueada,
    desbloqueioAutomatico: automatico,
    dataDesbloqueioAutomatico: automatico ? dados.dataDesbloqueioAutomatico : null,
  }

  if (mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM) {
    return salvarTransferencia({ ...mov, lancarRepetido: false })
  }

  if (!mov.id) {
    const criada = await repos.movimentacoes.criar({
      ...mov,
      qtdRepeticoes: Number(mov.qtdRepeticoes) || 1,
      prazoRepeticoes: Number(mov.prazoRepeticoes) || 0,
    })
    if (criada.lancarRepetido) {
      for (const repeticao of gerarRepeticoes(criada, hoje)) await repos.movimentacoes.criar(repeticao)
    }
    return criada
  }

  const atualizada = await repos.movimentacoes.atualizar(mov)
  // Editar o lançamento inicial de uma série leva valor, descrição e categoria às repetições,
  // preservando a data e o bloqueio de cada uma.
  for (const repeticao of await repos.movimentacoes.listarRepeticoes(mov.id)) {
    await repos.movimentacoes.atualizar({
      ...repeticao,
      valor: mov.valor,
      descricao: mov.descricao,
      idCategoria: mov.idCategoria,
      parcelas: mov.parcelas,
    })
  }
  return atualizada
}

// Excluir uma ponta de transferência exclui também a outra.
export async function excluirMovimentacao(id) {
  const mov = await repos.movimentacoes.obter(id)
  if (!mov) return
  const par = encontrarPar(mov, await repos.movimentacoes.listar())
  if (par) await repos.movimentacoes.excluir(par.id)
  await repos.movimentacoes.excluir(mov.id)
}

// Libera os lançamentos bloqueados cuja data de desbloqueio automático já chegou.
export async function desbloquearVencidas(hoje = hojeISO()) {
  const vencidas = (await repos.movimentacoes.listar()).filter((mov) => deveDesbloquear(mov, hoje))
  for (const mov of vencidas) {
    await repos.movimentacoes.atualizar({
      ...mov,
      bloqueada: false,
      desbloqueioAutomatico: false,
      dataDesbloqueioAutomatico: null,
    })
  }
  return vencidas.length
}

// Lança os itens selecionados na tela de lançamentos previstos.
// Itens cuja conta não existe mais são ignorados e contados em `semConta`.
export async function lancarPrevistos(itens, hoje = hojeISO()) {
  const idsContas = new Set((await repos.contas.listar()).map((conta) => conta.id))
  let lancados = 0
  let semConta = 0
  for (const item of itens) {
    if (!idsContas.has(item.idConta)) {
      semConta++
      continue
    }
    await repos.movimentacoes.criar(movimentacaoDePrevisto(item, hoje))
    lancados++
  }
  return { lancados, semConta }
}
