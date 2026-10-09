import { Intervalo, TipoMovimento } from './enums.js'
import { somarAnos, somarDias, somarMeses } from '../utils/datas.js'

export function ehTransferencia(tipo) {
  return tipo === TipoMovimento.TRANSFERENCIA_ORIGEM || tipo === TipoMovimento.TRANSFERENCIA_DESTINO
}

export function ehSaida(tipo) {
  return tipo === TipoMovimento.DEBITO || tipo === TipoMovimento.TRANSFERENCIA_ORIGEM
}

// Saídas são gravadas negativas; entradas, positivas.
export function valorAssinado(tipo, valor) {
  const absoluto = Math.abs(valor || 0)
  return ehSaida(tipo) ? -absoluto : absoluto
}

export function nomeDoTipo(tipo) {
  if (tipo === TipoMovimento.CREDITO) return 'Receita'
  if (tipo === TipoMovimento.DEBITO) return 'Despesa'
  return 'Transferência'
}

export function novaMovimentacao({ idConta, tipoMovimentacao, hoje }) {
  return {
    idConta,
    idContaDestino: null,
    idMovimentacaoDestino: null,
    idCategoria: null,
    tipoMovimentacao,
    valor: 0,
    dataMovimento: hoje,
    dataVencimento: hoje,
    descricao: '',
    parcelas: 1,
    bloqueada: false,
    desbloqueioAutomatico: false,
    dataDesbloqueioAutomatico: null,
    lancarRepetido: false,
    qtdRepeticoes: 2,
    prazoRepeticoes: 1,
    intervaloRepeticoes: Intervalo.MESES,
    numeroRepeticaoAtual: null,
    idMovimentacaoInicial: null,
  }
}

// A outra ponta de uma transferência: a origem guarda o id do destino em idMovimentacaoDestino.
export function encontrarPar(mov, todas) {
  if (mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM) {
    return todas.find((m) => m.id === mov.idMovimentacaoDestino) ?? null
  }
  if (mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_DESTINO) {
    return todas.find((m) => m.idMovimentacaoDestino === mov.id) ?? null
  }
  return null
}

export function deveDesbloquear(mov, hoje) {
  return Boolean(
    mov.bloqueada &&
      mov.desbloqueioAutomatico &&
      mov.dataDesbloqueioAutomatico &&
      mov.dataDesbloqueioAutomatico <= hoje,
  )
}

function deslocar(data, intervalo, quantidade) {
  if (!data) return data
  switch (intervalo) {
    case Intervalo.DIAS:
      return somarDias(data, quantidade)
    case Intervalo.SEMANAS:
      return somarDias(data, quantidade * 7)
    case Intervalo.ANOS:
      return somarAnos(data, quantidade)
    default:
      return somarMeses(data, quantidade)
  }
}

// Gera as repetições seguintes de um lançamento já gravado (a primeira ocorrência é o próprio `inicial`).
// As que caem no futuro nascem bloqueadas, ou seja, contam apenas no saldo futuro.
export function gerarRepeticoes(inicial, hoje) {
  const total = Math.max(1, Number(inicial.qtdRepeticoes) || 1)
  const prazo = Number(inicial.prazoRepeticoes) || 0
  const repeticoes = []
  for (let i = 1; i < total; i++) {
    const { id, dataCriacao, dataAlteracao, ...base } = inicial
    const dataMovimento = deslocar(inicial.dataMovimento, inicial.intervaloRepeticoes, prazo * i)
    repeticoes.push({
      ...base,
      dataMovimento,
      dataVencimento: deslocar(inicial.dataVencimento, inicial.intervaloRepeticoes, prazo * i),
      numeroRepeticaoAtual: i,
      idMovimentacaoInicial: inicial.id,
      bloqueada: dataMovimento > hoje,
      desbloqueioAutomatico: false,
      dataDesbloqueioAutomatico: null,
    })
  }
  return repeticoes
}

// Devolve a mensagem de erro ou null se estiver tudo certo. `mov.valor` aqui é o valor digitado (positivo).
export function validarMovimentacao(mov, hoje) {
  if (!mov.valor || mov.valor <= 0) return 'Informe um valor maior que zero.'
  if (!mov.dataMovimento) return 'Informe a data do lançamento.'
  if (mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM) {
    if (!mov.idContaDestino || mov.idContaDestino === mov.idConta) return 'Selecione uma conta destino válida.'
  }
  if (mov.bloqueada && mov.desbloqueioAutomatico) {
    if (!mov.dataDesbloqueioAutomatico || mov.dataDesbloqueioAutomatico <= hoje) {
      return 'Selecione uma data FUTURA para o desbloqueio automático.'
    }
  }
  if (mov.lancarRepetido && !mov.id) {
    const qtd = Number(mov.qtdRepeticoes)
    const prazo = Number(mov.prazoRepeticoes)
    if (!Number.isInteger(qtd) || qtd < 2 || qtd > 99) return 'A quantidade de repetições deve ficar entre 2 e 99.'
    if (!Number.isInteger(prazo) || prazo < 1) return 'Informe um prazo de repetição maior que zero.'
  }
  return null
}
