import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Topo } from '../components/Layout.jsx'
import { Campo, Check, EntradaInteiro, EntradaMoeda } from '../components/Campos.jsx'
import { ModalConfirmar, Sheet, SheetAcao, useToast } from '../components/Sobreposicoes.jsx'
import {
  IconeCopiar,
  IconeDespesa,
  IconeLixeira,
  IconePlanejar,
  IconeReceita,
  IconeTransferencia,
} from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { INTERVALOS, TipoConta, TipoMovimento } from '../domain/enums.js'
import { encontrarPar, nomeDoTipo, novaMovimentacao } from '../domain/movimentacoes.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { excluirMovimentacao, salvarMovimentacao } from '../services/movimentacoes.js'
import { hojeISO } from '../utils/datas.js'

const TIPOS_NOVOS = [TipoMovimento.CREDITO, TipoMovimento.DEBITO, TipoMovimento.TRANSFERENCIA_ORIGEM]

const APARENCIA = {
  [TipoMovimento.CREDITO]: { classe: 'acao--receita', Icone: IconeReceita },
  [TipoMovimento.DEBITO]: { classe: 'acao--despesa', Icone: IconeDespesa },
  [TipoMovimento.TRANSFERENCIA_ORIGEM]: { classe: 'acao--transferencia', Icone: IconeTransferencia },
}

// Três formas de chegar aqui: novo (idConta + tipo), editar (id) e copiar (idOrigem).
// Devolve null quando o lançamento ou a conta não existem.
async function carregar({ id, idOrigem, idConta, tipo }) {
  const [contas, categorias] = await Promise.all([repos.contas.listar(), repos.categorias.listar()])
  contas.sort((a, b) => a.dataCriacao.localeCompare(b.dataCriacao))
  categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  let mov
  if (id || idOrigem) {
    const todas = await repos.movimentacoes.listar()
    mov = todas.find((m) => m.id === (id ?? idOrigem))
    if (!mov) return null

    // uma transferência é sempre editada pela ponta de origem
    if (mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_DESTINO) {
      mov = encontrarPar(mov, todas) ?? { ...mov, tipoMovimentacao: TipoMovimento.CREDITO }
    }
    if (mov.tipoMovimentacao === TipoMovimento.TRANSFERENCIA_ORIGEM && !mov.idContaDestino) {
      mov = { ...mov, idContaDestino: encontrarPar(mov, todas)?.idConta ?? null }
    }
    mov = { ...mov, valor: Math.abs(mov.valor) }

    if (idOrigem) {
      const { id: _id, dataCriacao: _criacao, dataAlteracao: _alteracao, ...copia } = mov
      mov = {
        ...copia,
        idMovimentacaoDestino: null,
        idMovimentacaoInicial: null,
        numeroRepeticaoAtual: null,
        lancarRepetido: false,
      }
    }
  } else {
    const tipoMovimentacao = Number(tipo)
    if (!TIPOS_NOVOS.includes(tipoMovimentacao)) return null
    mov = novaMovimentacao({ idConta, tipoMovimentacao, hoje: hojeISO() })
  }

  const conta = contas.find((c) => c.id === mov.idConta)
  if (!conta) return null
  return { mov, conta, contas, categorias }
}

export default function MovimentacaoForm() {
  const params = useParams()
  const navigate = useNavigate()
  const avisar = useToast()
  const { dados, carregando } = useCarregar(() => carregar(params), [])
  const [mov, setMov] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const copiando = Boolean(params.idOrigem)

  useEffect(() => {
    if (carregando) return
    if (!dados) {
      avisar('Lançamento não encontrado.')
      navigate('/', { replace: true })
      return
    }
    setMov(dados.mov)
    if (copiando) avisar('Dados carregados com sucesso, salve para gerar um novo lançamento')
  }, [dados, carregando, copiando, avisar, navigate])

  if (!mov) {
    return (
      <>
        <Topo titulo="Movimentação" />
        <div className="pagina">
          <p className="carregando">Carregando...</p>
        </div>
      </>
    )
  }

  const { conta, contas, categorias } = dados
  const tipo = mov.tipoMovimentacao
  const editando = Boolean(mov.id)
  const transferencia = tipo === TipoMovimento.TRANSFERENCIA_ORIGEM
  const contaCredito = conta.tipoConta === TipoConta.CREDITO
  const { classe, Icone } = APARENCIA[tipo]

  const editar = (campo) => (valor) => setMov((atual) => ({ ...atual, [campo]: valor }))
  const aoDigitar = (campo) => (evento) => editar(campo)(evento.target.value)

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    try {
      await salvarMovimentacao(mov)
      if (transferencia) avisar('Transferência feita com sucesso')
      else if (editando) avisar('Lançamento atualizado com sucesso')
      else avisar(`${nomeDoTipo(tipo)} lançada com sucesso`)
      navigate('/')
    } catch (erro) {
      avisar(erro.message)
      setSalvando(false)
    }
  }

  async function deletar() {
    await excluirMovimentacao(mov.id)
    avisar('Lançamento deletado com sucesso')
    navigate('/')
  }

  return (
    <>
      <Topo titulo="Movimentação" onMenu={editando ? () => setMenuAberto((aberto) => !aberto) : undefined} />
      <div className="pagina">
        <div className="faixa-tipo">
          <div className={`selo-tipo ${classe}`} title={nomeDoTipo(tipo)}>
            <Icone />
            <span>{conta.nome}</span>
          </div>
        </div>

        <form className="formulario" onSubmit={salvar}>
          <Campo rotulo="Valor">
            <EntradaMoeda valor={mov.valor || null} onChange={(valor) => editar('valor')(valor ?? 0)} autoFocus={!editando} />
          </Campo>

          {transferencia && (
            <Campo rotulo="Conta de destino">
              <select className="entrada" value={mov.idContaDestino ?? ''} onChange={aoDigitar('idContaDestino')} disabled={editando}>
                <option value=""></option>
                {contas
                  .filter((c) => c.id !== mov.idConta)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
              </select>
            </Campo>
          )}

          <Campo rotulo="Data do lançamento">
            <input type="date" className="entrada" required value={mov.dataMovimento ?? ''} onChange={aoDigitar('dataMovimento')} />
          </Campo>
          <Campo rotulo="Data de vencimento">
            <input type="date" className="entrada" value={mov.dataVencimento ?? ''} onChange={(evento) => editar('dataVencimento')(evento.target.value || null)} />
          </Campo>

          {tipo === TipoMovimento.DEBITO && contaCredito && (
            <Campo rotulo="Quantidade de parcelas">
              <EntradaInteiro min={1} max={99} valor={mov.parcelas} onChange={editar('parcelas')} />
            </Campo>
          )}

          <Campo rotulo="Descrição">
            <textarea className="entrada" maxLength={150} value={mov.descricao ?? ''} onChange={aoDigitar('descricao')} />
          </Campo>

          <Campo rotulo="Categoria">
            <select className="entrada" value={mov.idCategoria ?? ''} onChange={(evento) => editar('idCategoria')(evento.target.value || null)}>
              <option value="">Sem Categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>
          </Campo>

          <Check rotulo="Bloqueada?" marcado={mov.bloqueada} onChange={editar('bloqueada')} />
          {mov.bloqueada && (
            <>
              <Check rotulo="Desbloquear Automaticamente?" marcado={mov.desbloqueioAutomatico} onChange={editar('desbloqueioAutomatico')} />
              {mov.desbloqueioAutomatico && (
                <Campo rotulo="Data de desbloqueio">
                  <input type="date" className="entrada" value={mov.dataDesbloqueioAutomatico ?? ''} onChange={(evento) => editar('dataDesbloqueioAutomatico')(evento.target.value || null)} />
                </Campo>
              )}
            </>
          )}

          {!contaCredito && !transferencia && (
            <>
              <Check rotulo="Repetir?" marcado={mov.lancarRepetido} onChange={editar('lancarRepetido')} disabled={editando} />
              {mov.lancarRepetido && (
                <>
                  <Campo rotulo="Quantidade de Repetições">
                    <EntradaInteiro min={2} max={99} valor={mov.qtdRepeticoes} onChange={editar('qtdRepeticoes')} disabled={editando} />
                  </Campo>
                  <Campo rotulo="Prazo">
                    <EntradaInteiro min={1} valor={mov.prazoRepeticoes} onChange={editar('prazoRepeticoes')} disabled={editando} />
                  </Campo>
                  <Campo rotulo="Intervalo">
                    <select className="entrada" value={mov.intervaloRepeticoes} onChange={(evento) => editar('intervaloRepeticoes')(Number(evento.target.value))} disabled={editando}>
                      {INTERVALOS.map((intervalo) => (
                        <option key={intervalo.valor} value={intervalo.valor}>{intervalo.nome}</option>
                      ))}
                    </select>
                  </Campo>
                </>
              )}
            </>
          )}

          <div className="botoes">
            <button type="submit" className="btn" disabled={salvando}>SALVAR</button>
          </div>
        </form>
      </div>

      <Sheet aberto={menuAberto} onFechar={() => setMenuAberto(false)}>
        <SheetAcao icone={<IconeCopiar />} to={`/movimentacoes/transformar/${mov.id}`}>Copiar</SheetAcao>
        <SheetAcao icone={<IconePlanejar />} to={`/planejamentos/createEdit/transformar/${mov.id}`}>Planejar</SheetAcao>
        <SheetAcao icone={<IconeLixeira />} onClick={() => setConfirmando(true)}>Deletar</SheetAcao>
      </Sheet>

      {confirmando && (
        <ModalConfirmar
          titulo="Deletar um Lançamento"
          pergunta={`Confirma a deleção da ${nomeDoTipo(tipo)}?`}
          onCancelar={() => setConfirmando(false)}
          onConfirmar={deletar}
        />
      )}
    </>
  )
}
