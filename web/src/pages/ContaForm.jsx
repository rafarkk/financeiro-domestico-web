import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Topo } from '../components/Layout.jsx'
import { Campo, Check, EntradaInteiro, EntradaMoeda } from '../components/Campos.jsx'
import { ModalConfirmar, Sheet, SheetAcao, useToast } from '../components/Sobreposicoes.jsx'
import { IconeLixeira } from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { TipoConta } from '../domain/enums.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { excluirConta, novaConta, salvarConta } from '../services/cadastros.js'

// "1234567812345678" -> "1234 5678 1234 5678"
const mascaraCartao = (texto) =>
  texto.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')

export default function ContaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const avisar = useToast()
  const { dados, carregando } = useCarregar(() => (id ? repos.contas.obter(id) : Promise.resolve(novaConta())), [id])
  const [conta, setConta] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (carregando) return
    if (!dados) {
      avisar('Conta não encontrada.')
      navigate('/', { replace: true })
      return
    }
    setConta(dados)
  }, [dados, carregando, avisar, navigate])

  const editando = Boolean(id)
  const editar = (campo) => (valor) => setConta((atual) => ({ ...atual, [campo]: valor }))
  const aoDigitar = (campo) => (evento) => editar(campo)(evento.target.value)

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    try {
      await salvarConta(conta)
      avisar(editando ? 'Conta atualizada com sucesso' : 'Conta criada com sucesso')
      navigate('/')
    } catch (erro) {
      avisar(erro.message)
      setSalvando(false)
    }
  }

  async function deletar() {
    await excluirConta(conta.id)
    avisar('Conta deletada com sucesso')
    navigate('/')
  }

  const credito = conta?.tipoConta === TipoConta.CREDITO

  return (
    <>
      <Topo titulo="Conta" onMenu={editando ? () => setMenuAberto((aberto) => !aberto) : undefined} />
      <div className="pagina">
        {!conta ? (
          <p className="carregando">Carregando...</p>
        ) : (
          <form className="formulario" onSubmit={salvar}>
            <Campo rotulo="Nome da conta">
              <input className="entrada" required maxLength={50} value={conta.nome} onChange={aoDigitar('nome')} />
            </Campo>
            <Campo rotulo="Responsável da conta">
              <input className="entrada" maxLength={50} value={conta.responsavel} onChange={aoDigitar('responsavel')} />
            </Campo>
            <Campo rotulo="Número Cartão">
              <input
                className="entrada"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0000 0000 0000 0000"
                value={conta.numeroCartao}
                onChange={(evento) => editar('numeroCartao')(mascaraCartao(evento.target.value))}
              />
            </Campo>
            <Campo rotulo="Informações Adicionais">
              <textarea className="entrada" maxLength={100} value={conta.infosAdicionais} onChange={aoDigitar('infosAdicionais')} />
            </Campo>

            {!editando && (
              <Check
                rotulo="Conta de crédito?"
                marcado={credito}
                onChange={(marcado) => editar('tipoConta')(marcado ? TipoConta.CREDITO : TipoConta.DEBITO)}
              />
            )}

            {credito && (
              <>
                <Campo rotulo="Limite do crédito">
                  <EntradaMoeda valor={conta.limiteCredito} onChange={editar('limiteCredito')} />
                </Campo>
                <Campo rotulo="Dia de vencimento">
                  <EntradaInteiro min={1} max={31} valor={conta.diaVencimento} onChange={editar('diaVencimento')} />
                </Campo>
                <Campo rotulo="Melhor dia de compra">
                  <EntradaInteiro min={1} max={31} valor={conta.melhorDiaCompra} onChange={editar('melhorDiaCompra')} />
                </Campo>
              </>
            )}

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
          titulo="Deletar uma Conta"
          pergunta={`Confirma a deleção da Conta ${conta.nome}? Os lançamentos dela também serão deletados.`}
          onCancelar={() => setConfirmando(false)}
          onConfirmar={deletar}
        />
      )}
    </>
  )
}
