import { useState } from 'react'
import { Topo } from '../components/Layout.jsx'
import { Vazio } from '../components/Marca.jsx'
import { Pesquisa } from '../components/Campos.jsx'
import { Modal, Sheet, SheetAcao, useToast } from '../components/Sobreposicoes.jsx'
import { IconeDivisas, IconeMais } from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { salvarCategoria } from '../services/cadastros.js'

async function carregar() {
  const categorias = await repos.categorias.listar()
  return categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export default function Categorias() {
  const avisar = useToast()
  const { dados: categorias, recarregar } = useCarregar(carregar)
  const [filtro, setFiltro] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  // categoria aberta no modal: { nome } para criar, { id, nome, ... } para editar
  const [emEdicao, setEmEdicao] = useState(null)

  const texto = filtro.trim().toLowerCase()
  const visiveis = (categorias ?? []).filter((c) => c.nome.toLowerCase().includes(texto))

  async function salvar(evento) {
    evento.preventDefault()
    try {
      await salvarCategoria(emEdicao)
      avisar(emEdicao.id ? 'Categoria atualizada com sucesso' : 'Categoria criada com sucesso')
      setEmEdicao(null)
      recarregar()
    } catch (erro) {
      avisar(erro.message)
    }
  }

  async function deletar() {
    await repos.categorias.excluir(emEdicao.id)
    avisar('Categoria deletada com sucesso')
    setEmEdicao(null)
    recarregar()
  }

  return (
    <>
      <Topo titulo="Categorias" onMenu={() => setMenuAberto((aberto) => !aberto)} />
      <div className="pagina">
        <Pesquisa placeholder="Buscar por nome" valor={filtro} onChange={setFiltro} />

        {!categorias ? (
          <p className="carregando">Carregando...</p>
        ) : visiveis.length === 0 ? (
          <Vazio texto="Nenhuma categoria encontrada" />
        ) : (
          <div style={{ marginTop: 16 }}>
            {visiveis.map((categoria) => (
              <div key={categoria.id} className="card-listagem">
                <div className="dado">
                  <span className="dado__titulo">Descrição</span>
                  <span className="dado__valor">{categoria.nome}</span>
                </div>
                <button
                  type="button"
                  className="card-listagem__acao"
                  onClick={() => setEmEdicao(categoria)}
                  aria-label={`Editar ${categoria.nome}`}
                >
                  <IconeDivisas />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet aberto={menuAberto} onFechar={() => setMenuAberto(false)}>
        <SheetAcao icone={<IconeMais />} onClick={() => setEmEdicao({ nome: '' })}>Nova Categoria</SheetAcao>
      </Sheet>

      {emEdicao && (
        <Modal titulo={emEdicao.id ? 'Editar Categoria' : 'Criar Categoria'} onFechar={() => setEmEdicao(null)}>
          <form onSubmit={salvar}>
            <input
              className="entrada"
              autoFocus
              maxLength={60}
              placeholder="Digite o nome da categoria"
              aria-label="Nome da categoria"
              value={emEdicao.nome}
              onChange={(evento) => setEmEdicao({ ...emEdicao, nome: evento.target.value })}
            />
            <div className="botoes">
              <button type="submit" className="btn">SALVAR</button>
              {emEdicao.id && (
                <button type="button" className="btn btn--vermelho" onClick={deletar}>DELETAR</button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
