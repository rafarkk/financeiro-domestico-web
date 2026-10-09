import { limparBanco } from '../data/banco.js'
import { repos } from '../data/index.js'
import { Intervalo, TipoConta, TipoMovimento, TipoPlanejamento } from '../domain/enums.js'
import { novaMovimentacao } from '../domain/movimentacoes.js'
import { novoPlanejamento } from '../domain/planejamento.js'
import { hojeISO, somarDias, somarMeses } from '../utils/datas.js'
import { novaConta, salvarCategoria, salvarConta, salvarPlanejamento } from './cadastros.js'
import { salvarMovimentacao } from './movimentacoes.js'

const { CREDITO, DEBITO, TRANSFERENCIA_ORIGEM } = TipoMovimento
const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms))

export { limparBanco as apagarTudo }

// Substitui os dados do aparelho por um cenário de teste que exercita todas as áreas do app:
// contas comuns e de crédito, conta desligada, categorias, receitas, despesas, parcelas,
// transferências, lançamentos bloqueados (com e sem desbloqueio automático), uma série repetida,
// lançamentos fora do período padrão do filtro e planejamentos de todos os tipos.
// As datas são relativas a `hoje`, para o cenário fazer sentido em qualquer dia.
export async function carregarDadosDeExemplo(hoje = hojeISO()) {
  await limparBanco()
  const dia = (deslocamento) => somarDias(hoje, deslocamento)

  /* ---------- categorias ---------- */
  const cat = {}
  for (const nome of ['Salário', 'Renda extra', 'Moradia', 'Mercado', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Impostos']) {
    cat[nome] = (await salvarCategoria({ nome })).id
  }

  /* ---------- contas ---------- */
  async function conta(dados) {
    const criada = await salvarConta({ ...novaConta(), ...dados })
    await pausa(3) // garante datas de criação distintas, que definem a ordem dos cards
    return criada.id
  }
  const corrente = await conta({ nome: 'Conta Corrente', responsavel: 'Ana', infosAdicionais: 'Banco do Brasil, ag. 1234-5, c/c 67890-1' })
  const carteira = await conta({ nome: 'Carteira', responsavel: 'Ana', infosAdicionais: 'Dinheiro em espécie' })
  const poupanca = await conta({ nome: 'Poupança', responsavel: 'Bruno' })
  const nubank = await conta({
    nome: 'Nubank',
    responsavel: 'Ana',
    numeroCartao: '5162 3048 7791 0425',
    tipoConta: TipoConta.CREDITO,
    limiteCredito: 500000,
    diaVencimento: 10,
    melhorDiaCompra: 3,
  })
  const cartaoLoja = await conta({
    nome: 'Cartão da Loja',
    responsavel: 'Bruno',
    numeroCartao: '4024 0071 5580 9963',
    infosAdicionais: 'Desligado dos totais na home',
    tipoConta: TipoConta.CREDITO,
    limiteCredito: 200000,
    diaVencimento: 20,
    melhorDiaCompra: 13,
    filtravel: false,
  })

  /* ---------- lançamentos ---------- */
  function lancar(idConta, tipoMovimentacao, valor, descricao, data, extra = {}) {
    return salvarMovimentacao(
      {
        ...novaMovimentacao({ idConta, tipoMovimentacao, hoje }),
        valor,
        descricao,
        dataMovimento: data,
        dataVencimento: data,
        ...extra,
      },
      hoje,
    )
  }
  const receita = (idConta, valor, descricao, data, categoria, extra) =>
    lancar(idConta, CREDITO, valor, descricao, data, { idCategoria: cat[categoria] ?? null, ...extra })
  const despesa = (idConta, valor, descricao, data, categoria, extra) =>
    lancar(idConta, DEBITO, valor, descricao, data, { idCategoria: cat[categoria] ?? null, ...extra })
  const transferir = (origem, destino, valor, descricao, data, extra) =>
    lancar(origem, TRANSFERENCIA_ORIGEM, valor, descricao, data, { idContaDestino: destino, ...extra })

  // saldos de partida e um lançamento antigo, fora do filtro padrão de 3 meses
  await receita(poupanca, 1500000, 'Saldo inicial', dia(-80))
  await receita(carteira, 30000, 'Saldo inicial', dia(-80))
  await despesa(corrente, 145000, 'IPVA', dia(-150), 'Impostos')

  // três meses de salário, moradia e contas da casa
  for (const inicio of [-62, -32, -2]) {
    await receita(corrente, 650000, 'Salário', dia(inicio), 'Salário')
  }
  await despesa(corrente, 180000, 'Aluguel', dia(-57), 'Moradia')
  await despesa(corrente, 180000, 'Aluguel', dia(-27), 'Moradia')
  await despesa(corrente, 21437, 'Conta de luz', dia(-48), 'Moradia')
  await despesa(corrente, 19862, 'Conta de luz', dia(-18), 'Moradia')
  await despesa(corrente, 11990, 'Internet', dia(-42), 'Moradia')
  await despesa(corrente, 11990, 'Internet', dia(-12), 'Moradia')
  await receita(corrente, 120000, 'Freelance: site da padaria', dia(-45), 'Renda extra')
  await despesa(corrente, 35000, 'Curso de inglês', dia(-20), 'Educação')

  // bloqueados: contam só no saldo futuro
  await despesa(corrente, 180000, 'Aluguel (agendado)', hoje, 'Moradia', {
    bloqueada: true,
    desbloqueioAutomatico: true,
    dataDesbloqueioAutomatico: dia(5),
  })
  await receita(carteira, 35000, 'Reembolso a receber', dia(-3), 'Renda extra', { bloqueada: true })

  // série repetida: 6 mensalidades, começando há 2 meses (as futuras nascem bloqueadas)
  await despesa(corrente, 12990, 'Academia', somarMeses(hoje, -2), 'Saúde', {
    lancarRepetido: true,
    qtdRepeticoes: 6,
    prazoRepeticoes: 1,
    intervaloRepeticoes: Intervalo.MESES,
  })

  // dia a dia na carteira
  await despesa(carteira, 6400, 'Feira', dia(-6), 'Mercado')
  await despesa(carteira, 2390, 'Uber', dia(-4), 'Transporte')
  await despesa(carteira, 1850, 'Padaria', dia(-1), 'Mercado')
  await despesa(carteira, 4500, 'Estacionamento', dia(-13), 'Transporte')

  // cartões de crédito (com parcelas)
  await despesa(nubank, 42350, 'Supermercado', dia(-20), 'Mercado')
  await despesa(nubank, 18990, 'Supermercado', dia(-8), 'Mercado')
  await despesa(nubank, 31275, 'Supermercado', dia(-1), 'Mercado')
  await despesa(nubank, 360000, 'Notebook', dia(-15), 'Educação', { parcelas: 10 })
  await despesa(nubank, 8760, 'Farmácia', dia(-10), 'Saúde')
  await despesa(nubank, 15980, 'Gasolina', dia(-5), 'Transporte')
  await despesa(cartaoLoja, 7200, 'Cinema', dia(-9), 'Lazer')
  await despesa(cartaoLoja, 45900, 'Tênis', dia(-22), 'Lazer', { parcelas: 3 })

  // transferências entre contas
  await transferir(corrente, poupanca, 80000, 'Reserva mensal', dia(-30))
  await transferir(corrente, poupanca, 80000, 'Reserva mensal', dia(-1))
  await transferir(corrente, nubank, 60000, 'Pagamento da fatura', dia(-25))
  await transferir(corrente, carteira, 20000, 'Saque', dia(-7))

  /* ---------- planejamento mensal ---------- */
  const planejar = (tipo, idConta, valor, descricao, diaVencimento, categoria, extra = {}) =>
    salvarPlanejamento({
      ...novoPlanejamento(tipo, idConta),
      valor,
      descricao,
      diaVencimento,
      idCategoria: cat[categoria] ?? null,
      ...extra,
    })
  const { RECEITA, DESPESA, TRANSFERENCIA } = TipoPlanejamento
  await planejar(RECEITA, corrente, 650000, 'Salário', 5, 'Salário')
  await planejar(DESPESA, corrente, 180000, 'Aluguel', 10, 'Moradia')
  await planejar(DESPESA, corrente, 11990, 'Internet', 15, 'Moradia')
  await planejar(DESPESA, corrente, 22000, 'Conta de luz', 20, 'Moradia', { valorVariavel: true })
  await planejar(DESPESA, corrente, 35000, 'Curso de inglês', 25, 'Educação')
  // dia 31: testa o ajuste para meses mais curtos
  await planejar(DESPESA, corrente, 95000, 'Fatura do Nubank', 31, null, { valorVariavel: true })
  // vira dois planejamentos: despesa na origem e receita no destino
  await planejar(TRANSFERENCIA, corrente, 80000, 'Reserva mensal', 6, null, { idContaDestino: poupanca })

  const [contas, categorias, movimentacoes, planejamentos] = await Promise.all([
    repos.contas.listar(),
    repos.categorias.listar(),
    repos.movimentacoes.listar(),
    repos.planejamentos.listar(),
  ])
  return {
    contas: contas.length,
    categorias: categorias.length,
    movimentacoes: movimentacoes.length,
    planejamentos: planejamentos.length,
  }
}
