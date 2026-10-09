import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BotaoKebab } from '../components/Layout.jsx'
import { Marca, Vazio } from '../components/Marca.jsx'
import { Campo, EntradaMoeda, Pesquisa } from '../components/Campos.jsx'
import { ModalConfirmar, Sheet, SheetAcao, useToast } from '../components/Sobreposicoes.jsx'
import {
  IconeCadeado,
  IconeLista,
  IconeLixeira,
  IconeDespesa,
  IconeEditar,
  IconeExportar,
  IconeFiltros,
  IconeFunil,
  IconeFunilCortado,
  IconeMais,
  IconeOlho,
  IconeOlhoOculto,
  IconeReceita,
  IconeSetaAmbos,
  IconeSetaBaixo,
  IconeSetaCima,
  IconeTransferencia,
} from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { gerarCsv } from '../domain/csv.js'
import { TipoConta, TipoMovimento } from '../domain/enums.js'
import { filtrarMovimentacoes, filtrosPadrao } from '../domain/filtros.js'
import { calcularSaldosPorConta, calcularTotais } from '../domain/saldos.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { apagarTudo, carregarDadosDeExemplo } from '../services/exemplo.js'
import { desbloquearVencidas } from '../services/movimentacoes.js'
import { entregarArquivo } from '../utils/arquivos.js'
import { formatarData, hojeISO } from '../utils/datas.js'
import { VALOR_OCULTO, formatarMoeda } from '../utils/dinheiro.js'

// Os filtros sobrevivem à navegação entre telas enquanto o app estiver aberto.
let filtrosEmUso = null

// Ferramentas de teste (dados de exemplo / apagar tudo): aparecem em `npm run dev`,
// no build feito com VITE_FERRAMENTAS_TESTE=1 ou abrindo o app com ?exemplo no endereço.
const MODO_TESTE =
  import.meta.env.DEV ||
  import.meta.env.VITE_FERRAMENTAS_TESTE === '1' ||
  new URLSearchParams(window.location.search).has('exemplo')

const CONFIRMACOES = {
  exemplo: {
    titulo: 'Dados de exemplo',
    pergunta: 'Isso apaga tudo o que está gravado neste aparelho e carrega um cenário de teste. Continuar?',
    rotuloConfirmar: 'Carregar',
  },
  apagar: {
    titulo: 'Apagar todos os dados',
    pergunta: 'Isso apaga contas, lançamentos, categorias e planejamentos deste aparelho. Não dá para desfazer.',
    rotuloConfirmar: 'Apagar',
  },
}

async function carregarHome() {
  await desbloquearVencidas()
  const [contas, movimentacoes, categorias, config] = await Promise.all([
    repos.contas.listar(),
    repos.movimentacoes.listar(),
    repos.categorias.listar(),
    repos.configuracoes.obter(),
  ])
  contas.sort((a, b) => a.dataCriacao.localeCompare(b.dataCriacao))
  categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return { contas, movimentacoes, categorias, config }
}

function CardConta({ conta, saldos, oculto, onAlternarFiltro }) {
  const credito = conta.tipoConta === TipoConta.CREDITO
  const classes = ['card-conta']
  if (credito) classes.push('card-conta--credito')
  if (!conta.filtravel) classes.push('card-conta--desligada')
  const corFuturo = oculto ? '' : saldos.saldoFuturo < 0 ? 'texto-vermelho' : 'texto-verde'

  return (
    <article className={classes.join(' ')}>
      <div className="card-conta__corpo">
        <div className="card-conta__cabecalho">
          <button
            type="button"
            className="card-conta__filtro"
            onClick={onAlternarFiltro}
            aria-pressed={conta.filtravel}
            title={conta.filtravel ? 'Tirar a conta dos totais e da lista' : 'Voltar a conta aos totais e à lista'}
          >
            {conta.filtravel ? <IconeFunil tamanho={15} /> : <IconeFunilCortado tamanho={15} />}
          </button>
          <Link className="card-conta__nome" to={`/contas/${conta.id}`} title="Editar conta">
            <span>{conta.nome}</span>
            <IconeEditar tamanho={20} />
          </Link>
        </div>
        <div className="card-conta__valores">
          <span>Movimentação:</span>
          <strong>{oculto ? VALOR_OCULTO : formatarMoeda(saldos.movimentacoes)}</strong>
          <span>{credito ? 'Limite Disponível:' : 'Saldo Futuro:'}</span>
          <strong className={corFuturo}>{oculto ? VALOR_OCULTO : formatarMoeda(saldos.saldoFuturo)}</strong>
        </div>
      </div>
      <div className="card-conta__acoes">
        <Link className="card-conta__acao acao--despesa" to={`/movimentacoes/nova/${conta.id}/${TipoMovimento.DEBITO}`} title="Nova despesa" aria-label={`Nova despesa em ${conta.nome}`}>
          <IconeDespesa />
        </Link>
        <Link className="card-conta__acao acao--receita" to={`/movimentacoes/nova/${conta.id}/${TipoMovimento.CREDITO}`} title="Nova receita" aria-label={`Nova receita em ${conta.nome}`}>
          <IconeReceita />
        </Link>
        <Link className="card-conta__acao acao--transferencia" to={`/movimentacoes/nova/${conta.id}/${TipoMovimento.TRANSFERENCIA_ORIGEM}`} title="Nova transferência" aria-label={`Nova transferência a partir de ${conta.nome}`}>
          <IconeTransferencia />
        </Link>
      </div>
    </article>
  )
}

function CardMovimentacao({ mov, nomeConta }) {
  const cor = mov.valor < 0 ? 'texto-vermelho' : 'texto-verde'
  const Seta =
    mov.tipoMovimentacao === TipoMovimento.DEBITO
      ? IconeSetaBaixo
      : mov.tipoMovimentacao === TipoMovimento.CREDITO
        ? IconeSetaCima
        : IconeSetaAmbos

  return (
    <Link className="card-mov" to={`/movimentacoes/${mov.id}`}>
      <div className="card-mov__info">
        <Seta />
        <div className="card-mov__textos">
          <span className="card-mov__data">
            {formatarData(mov.dataMovimento)}
            {mov.bloqueada && (
              <>
                <IconeCadeado tamanho={12} aria-label="Bloqueada" aria-hidden={undefined} />
                {mov.desbloqueioAutomatico && formatarData(mov.dataDesbloqueioAutomatico)}
              </>
            )}
          </span>
          <span className={`card-mov__conta ${cor}`}>{nomeConta}</span>
          {mov.descricao && <span className="card-mov__descricao">{mov.descricao}</span>}
        </div>
      </div>
      <span className={`card-mov__valor ${cor}`}>{formatarMoeda(mov.valor)}</span>
    </Link>
  )
}

export default function Home() {
  const avisar = useToast()
  const { dados, carregando, recarregar } = useCarregar(carregarHome)
  const [filtros, setFiltros] = useState(() => filtrosEmUso ?? filtrosPadrao(hojeISO()))
  const [rascunho, setRascunho] = useState(filtros)
  const [painelAberto, setPainelAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmando, setConfirmando] = useState(null) // 'exemplo' | 'apagar'

  const contas = dados?.contas ?? []
  const movimentacoes = dados?.movimentacoes ?? []
  const categorias = dados?.categorias ?? []
  const oculto = Boolean(dados?.config.ocultarValores)

  const saldos = useMemo(() => calcularSaldosPorConta(contas, movimentacoes), [contas, movimentacoes])
  const totais = useMemo(() => calcularTotais(contas, saldos), [contas, saldos])
  const nomeConta = useMemo(() => new Map(contas.map((c) => [c.id, c.nome])), [contas])
  const lista = useMemo(() => {
    const desligadas = new Set(contas.filter((c) => !c.filtravel).map((c) => c.id))
    return filtrarMovimentacoes(movimentacoes, filtros, desligadas)
  }, [contas, movimentacoes, filtros])

  const editar = (campo) => (valor) => setRascunho((atual) => ({ ...atual, [campo]: valor }))

  function aplicar(novos) {
    filtrosEmUso = novos
    setFiltros(novos)
    setRascunho(novos)
    setPainelAberto(false)
  }

  async function alternarFiltro(conta) {
    await repos.contas.atualizar({ ...conta, filtravel: !conta.filtravel })
    recarregar()
  }

  async function alternarOcultar() {
    await repos.configuracoes.salvar({ ...dados.config, ocultarValores: !oculto })
    recarregar()
  }

  async function exportar() {
    if (lista.length === 0) {
      avisar('Não há lançamentos para exportar.')
      return
    }
    // o BOM faz o Excel abrir o arquivo como UTF-8
    const csv = '﻿' + gerarCsv(lista, contas, categorias)
    const resultado = await entregarArquivo('movimentacoes.csv', csv, 'text/csv')
    if (resultado !== 'cancelado') avisar('Exportado com sucesso!')
  }

  async function confirmarTeste() {
    const acao = confirmando
    setConfirmando(null)
    try {
      if (acao === 'exemplo') {
        const r = await carregarDadosDeExemplo()
        avisar(`Exemplo carregado: ${r.contas} contas, ${r.categorias} categorias, ${r.movimentacoes} lançamentos e ${r.planejamentos} planejamentos`)
      } else {
        await apagarTudo()
        avisar('Todos os dados foram apagados')
      }
    } catch (erro) {
      avisar(`Erro: ${erro.message}`)
    }
    aplicar(filtrosPadrao(hojeISO()))
    recarregar()
  }

  const total = (centavos) => (oculto ? VALOR_OCULTO : formatarMoeda(centavos))

  return (
    <>
      <header className="home__topo">
        <div className="home__marca">
          <Marca clara />
          <BotaoKebab onClick={() => setMenuAberto((aberto) => !aberto)} />
        </div>

        <div className="home__contas">
          <Link className="btn-nova-conta" to="/contas/nova" title="Nova conta" aria-label="Nova conta">
            <IconeMais tamanho={24} />
          </Link>
          {!carregando && contas.length === 0 ? (
            <p className="home__boas-vindas">Cadastre suas contas para poder iniciar o uso do sistema.</p>
          ) : (
            <div className="cards-contas">
              {contas.map((conta) => (
                <CardConta
                  key={conta.id}
                  conta={conta}
                  saldos={saldos.get(conta.id)}
                  oculto={oculto}
                  onAlternarFiltro={() => alternarFiltro(conta)}
                />
              ))}
            </div>
          )}
        </div>

        {contas.length > 0 && (
          <section className="totais">
            <div className="totais__titulo">
              <h2>Histórico das contas</h2>
              <button
                type="button"
                className="totais__olho"
                onClick={alternarOcultar}
                aria-pressed={oculto}
                title={oculto ? 'Exibir valores' : 'Ocultar valores'}
                aria-label={oculto ? 'Exibir valores' : 'Ocultar valores'}
              >
                {oculto ? <IconeOlhoOculto tamanho={26} /> : <IconeOlho tamanho={26} />}
              </button>
            </div>
            <div>Total: <strong>{total(totais.geral)}</strong></div>
            <div>Disponível: <strong>{total(totais.disponivel)}</strong></div>
            <div>Futuro: <strong>{total(totais.futuro)}</strong></div>
          </section>
        )}
      </header>
      <svg className="home__onda" viewBox="0 0 360 46" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0 0H360V2C240 46 110 52 0 34Z" />
      </svg>

      <main className="lancamentos">
        <h2>Lançamentos</h2>

        <div className="busca">
          <Pesquisa
            placeholder="Buscar por descrição"
            valor={rascunho.descricao}
            onChange={editar('descricao')}
            onBuscar={() => aplicar(rascunho)}
          />
          <button
            type="button"
            className="btn btn--laranja"
            onClick={() => setPainelAberto((aberto) => !aberto)}
            aria-expanded={painelAberto}
          >
            <IconeFiltros tamanho={20} /> Filtros
          </button>
        </div>

        {painelAberto && (
          <div className="filtros-avancados">
            <div className="linha-campos">
              <Campo rotulo="Data (Inicial)">
                <input type="date" className="entrada" value={rascunho.dataInicial ?? ''} onChange={(e) => editar('dataInicial')(e.target.value)} />
              </Campo>
              <Campo rotulo="Data (Final)">
                <input type="date" className="entrada" value={rascunho.dataFinal ?? ''} onChange={(e) => editar('dataFinal')(e.target.value)} />
              </Campo>
            </div>
            <div className="linha-campos">
              <Campo rotulo="Categoria">
                <select className="entrada" value={rascunho.idCategoria} onChange={(e) => editar('idCategoria')(e.target.value)}>
                  <option value="">Todas</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Tipos de movimentação">
                <select className="entrada" value={rascunho.tipo} onChange={(e) => editar('tipo')(e.target.value)}>
                  <option value="">Todos</option>
                  <option value={TipoMovimento.CREDITO}>Crédito</option>
                  <option value={TipoMovimento.DEBITO}>Débito</option>
                </select>
              </Campo>
            </div>
            <div className="linha-campos">
              <Campo rotulo="Valor (Inicial)">
                <EntradaMoeda valor={rascunho.valorInicial} onChange={editar('valorInicial')} />
              </Campo>
              <Campo rotulo="Valor (Final)">
                <EntradaMoeda valor={rascunho.valorFinal} onChange={editar('valorFinal')} />
              </Campo>
            </div>
            <div className="botoes">
              <button type="button" className="btn btn--laranja" onClick={() => aplicar(rascunho)}>Aplicar</button>
              <button type="button" className="btn btn--laranja" onClick={() => aplicar(filtrosPadrao(hojeISO()))}>Limpar</button>
            </div>
          </div>
        )}

        {carregando ? (
          <p className="carregando">Carregando...</p>
        ) : lista.length === 0 ? (
          <Vazio texto="Nenhum lançamento encontrado" />
        ) : (
          lista.map((mov) => <CardMovimentacao key={mov.id} mov={mov} nomeConta={nomeConta.get(mov.idConta) ?? ''} />)
        )}
      </main>

      <Sheet aberto={menuAberto} onFechar={() => setMenuAberto(false)}>
        <SheetAcao icone={<IconeExportar />} onClick={exportar}>Exportar Lançamentos</SheetAcao>
        {MODO_TESTE && (
          <>
            <SheetAcao icone={<IconeLista />} onClick={() => setConfirmando('exemplo')}>Dados de exemplo</SheetAcao>
            <SheetAcao icone={<IconeLixeira />} onClick={() => setConfirmando('apagar')}>Apagar tudo</SheetAcao>
          </>
        )}
      </Sheet>

      {confirmando && (
        <ModalConfirmar {...CONFIRMACOES[confirmando]} onCancelar={() => setConfirmando(null)} onConfirmar={confirmarTeste} />
      )}
    </>
  )
}
