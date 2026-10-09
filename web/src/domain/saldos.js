// Saldos de uma conta a partir das suas movimentações (valores em centavos, despesas negativas).
//   movimentacoes = soma das não bloqueadas
//   disponivel    = movimentacoes + limite de crédito
//   pendente      = soma das bloqueadas
//   saldoFuturo   = disponivel + pendente
export function calcularSaldos(conta, movimentacoes) {
  let efetivado = 0
  let pendente = 0
  for (const mov of movimentacoes) {
    if (mov.bloqueada) pendente += mov.valor
    else efetivado += mov.valor
  }
  const disponivel = efetivado + (conta.limiteCredito ?? 0)
  return { movimentacoes: efetivado, disponivel, pendente, saldoFuturo: disponivel + pendente }
}

// Map idConta -> saldos
export function calcularSaldosPorConta(contas, movimentacoes) {
  const porConta = new Map(contas.map((conta) => [conta.id, []]))
  for (const mov of movimentacoes) porConta.get(mov.idConta)?.push(mov)
  return new Map(contas.map((conta) => [conta.id, calcularSaldos(conta, porConta.get(conta.id))]))
}

// Totais da home: só entram as contas que o usuário deixou ligadas (filtravel).
export function calcularTotais(contas, saldosPorConta) {
  const totais = { geral: 0, disponivel: 0, futuro: 0 }
  for (const conta of contas) {
    if (!conta.filtravel) continue
    const saldos = saldosPorConta.get(conta.id)
    totais.geral += saldos.movimentacoes
    totais.disponivel += saldos.disponivel
    totais.futuro += saldos.saldoFuturo
  }
  return totais
}
