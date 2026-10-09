const CABECALHO = [
  'IdMovimentacao',
  'DataMovimento',
  'DataVencimento',
  'Descricao',
  'Valor',
  'IdConta',
  'NomeConta',
  'IdCategoria',
  'NomeCategoria',
  'Bloqueada',
  'DesbloqueioAutomatico',
  'DataDesbloqueioAutomatico',
]

function campo(valor) {
  const texto = String(valor ?? '')
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// Exportação dos lançamentos, com as mesmas colunas do app original.
export function gerarCsv(movimentacoes, contas, categorias) {
  const nomeConta = new Map(contas.map((c) => [c.id, c.nome]))
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]))

  const linhas = movimentacoes.map((mov) => {
    const categoria = mov.idCategoria ? nomeCategoria.get(mov.idCategoria) : null
    return [
      mov.id,
      mov.dataMovimento,
      mov.dataVencimento ?? '',
      mov.descricao ?? '',
      (mov.valor / 100).toFixed(2),
      mov.idConta,
      nomeConta.get(mov.idConta) ?? '',
      categoria ? mov.idCategoria : '-',
      categoria ?? 'Sem Categoria',
      mov.bloqueada ? 'Sim' : 'Não',
      mov.desbloqueioAutomatico ? 'Sim' : 'Não',
      mov.dataDesbloqueioAutomatico ?? '-',
    ]
      .map(campo)
      .join(',')
  })

  return [CABECALHO.join(','), ...linhas].join('\r\n')
}
