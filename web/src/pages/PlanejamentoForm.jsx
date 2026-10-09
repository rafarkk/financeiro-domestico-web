import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Topo } from '../components/Layout.jsx'
import { Vazio } from '../components/Marca.jsx'
import { Campo, Check, EntradaInteiro, EntradaMoeda } from '../components/Campos.jsx'
import { ModalConfirmar, Sheet, SheetAcao, useToast } from '../components/Sobreposicoes.jsx'
import { IconeLixeira } from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { TipoPlanejamento } from '../domain/enums.js'
import { encontrarPar } from '../domain/movimentacoes.js'
import { nomeDoPlanejamento, novoPlanejamento, planejamentoDeMovimentacao } from '../domain/planejamento.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { salvarPlanejamento } from '../services/cadastros.js'

const TIPOS = Object.values(TipoPlanejamento)

// Três formas de chegar aqui: novo (tipo), editar (id) e a partir de um lançamento (idMovimentacao).
// `plan` volta null quando o registro de origem não existe.
async function carregar({ id, tipo, idMovimentacao }) {
  const [contas, categorias] = await Promise.all([repos.contas.listar(), repos.categorias.listar()])
  contas.sort((a, b) => a.dataCriacao.localeCompare(b.dataCriacao))
  categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  let plan = null
  if (id) {
    plan = await repos.planejamentos.obter(id)
  } else if (idMovimentacao) {
    const todas = await repos.movimentacoes.listar()
    const mov = todas.find((m) => m.id === idMovimentacao)
    if (mov) plan = planejamentoDeMovimentacao(mov, encontrarPar(mov, todas))
  } else if (TIPOS.includes(Number(tipo))) {
    plan = novoPlanejamento(Number(tipo), contas[0]?.id ?? null)
  }
  return { plan, contas, categorias }
}

function titulo(plan) {
  const nome = nomeDoPlanejamento(plan.tipoPlanejamento)
  return plan.id ? `${nome} Mensal` : `Nova ${nome} Mensal`
}

export default function PlanejamentoForm() {
  const params = useParams()
  const navigate = useNavigate()
  const avisar = useToast()
  const { dados, carregando } = useCarregar(() => carregar(params), [])
  const [plan, setPlan] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (carregando) return
    if (!dados?.plan) {
      avisar('Planejamento não encontrado.')
      navigate('/planejamentos', { replace: true })
      return
    }
    setPlan(dados.plan)
  }, [dados, carregando, avisar, navigate])

  if (!plan) {
    return (
      <>
        <Topo titulo="Planejamento Mensal" voltarPara="/planejamentos" />
        <div className="pagina">
          <p className="carregando">Carregando...</p>
        </div>
      </>
    )
  }

  const { contas, categorias } = dados
  const editando = Boolean(plan.id)
  const transferencia = plan.tipoPlanejamento === TipoPlanejamento.TRANSFERENCIA
  const editar = (campo) => (valor) => setPlan((atual) => ({ ...atual, [campo]: valor }))

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    try {
      await salvarPlanejamento(plan)
      avisar(editando ? 'Planejamento atualizado com sucesso' : 'Planejamento criado com sucesso')
      navigate('/planejamentos')
    } catch (erro) {
      avisar(erro.message)
      setSalvando(false)
    }
  }

  async function deletar() {
    await repos.planejamentos.excluir(plan.id)
    avisar('Planejamento deletado com sucesso')
    navigate('/planejamentos')
  }

  return (
    <>
      <Topo
        titulo={titulo(plan)}
        voltarPara="/planejamentos"
        onMenu={editando ? () => setMenuAberto((aberto) => !aberto) : undefined}
      />
      <div className="pagina">
        {contas.length === 0 ? (
          <Vazio texto="Cadastre uma conta antes de planejar">
            <Link className="btn btn--laranja" to="/contas/nova">Nova conta</Link>
          </Vazio>
        ) : (
          <form className="formulario" onSubmit={salvar}>
            <Campo rotulo="Valor">
              <EntradaMoeda valor={plan.valor || null} onChange={(valor) => editar('valor')(valor ?? 0)} />
            </Campo>

            <Campo rotulo="Descrição">
              <textarea className="entrada" required maxLength={150} value={plan.descricao} onChange={(evento) => editar('descricao')(evento.target.value)} />
            </Campo>

            <Campo rotulo="Escolha a conta dos lançamentos">
              <select className="entrada" value={plan.idConta ?? ''} onChange={(evento) => editar('idConta')(evento.target.value)}>
                {!contas.some((c) => c.id === plan.idConta) && <option value=""></option>}
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>{conta.nome}</option>
                ))}
              </select>
            </Campo>

            {transferencia && (
              <Campo rotulo="Escolha a conta destino dos lançamentos">
                <select className="entrada" value={plan.idContaDestino ?? ''} onChange={(evento) => editar('idContaDestino')(evento.target.value || null)}>
                  <option value=""></option>
                  {contas
                    .filter((conta) => conta.id !== plan.idConta)
                    .map((conta) => (
                      <option key={conta.id} value={conta.id}>{conta.nome}</option>
                    ))}
                </select>
              </Campo>
            )}

            <Campo rotulo="Dia vencimento">
              <EntradaInteiro min={1} max={31} valor={plan.diaVencimento} onChange={editar('diaVencimento')} />
            </Campo>

            <Campo rotulo="Categoria">
              <select className="entrada" value={plan.idCategoria ?? ''} onChange={(evento) => editar('idCategoria')(evento.target.value || null)}>
                <option value="">Sem Categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                ))}
              </select>
            </Campo>

            <Check rotulo="Valor variável?" marcado={plan.valorVariavel} onChange={editar('valorVariavel')} />

            <div className="botoes">
              <button type="submit" className="btn" disabled={salvando}>SALVAR</button>
            </div>
          </form>
        )}
      </div>

      <Sheet aberto={menuAberto} onFechar={() => setMenuAberto(false)}>
        <SheetAcao icone={<IconeLixeira />} onClick={() => setConfirmando(true)}>Deletar</SheetAcao>
      </Sheet>

      {confirmando && (
        <ModalConfirmar
          titulo="Deletar um Planejamento"
          pergunta={`Confirma a deleção do planejamento ${plan.descricao}?`}
          onCancelar={() => setConfirmando(false)}
          onConfirmar={deletar}
        />
      )}
    </>
  )
}
