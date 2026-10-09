import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconeFechar } from './Icones.jsx'
import { porquinho } from './Marca.jsx'

function useEscape(ativo, onFechar) {
  useEffect(() => {
    if (!ativo) return
    const aoTeclar = (evento) => evento.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [ativo, onFechar])
}

/* ---------- painel "Mais Opções" ---------- */

export function Sheet({ aberto, onFechar, children }) {
  useEscape(aberto, onFechar)
  return (
    <>
      {aberto && <div className="sheet-fundo" onClick={onFechar} />}
      <section className="sheet" hidden={!aberto} aria-label="Mais opções">
        <div className="sheet__cabecalho">
          <img src={porquinho} alt="" />
          <h2>Mais Opções</h2>
          <button type="button" className="sheet__fechar" onClick={onFechar} aria-label="Fechar">
            <IconeFechar tamanho={16} />
          </button>
        </div>
        {/* qualquer ação escolhida fecha o painel */}
        <div className="sheet__acoes" onClick={onFechar}>
          {children}
        </div>
      </section>
    </>
  )
}

export function SheetAcao({ icone, to, onClick, children }) {
  const conteudo = (
    <>
      {icone}
      <span>{children}</span>
    </>
  )
  return to ? (
    <Link className="sheet__acao" to={to}>
      {conteudo}
    </Link>
  ) : (
    <button type="button" className="sheet__acao" onClick={onClick}>
      {conteudo}
    </button>
  )
}

/* ---------- modal ---------- */

export function Modal({ titulo, onFechar, children }) {
  useEscape(true, onFechar)
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal__caixa">
        <div className="modal__cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={onFechar} aria-label="Fechar">
            <IconeFechar tamanho={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalConfirmar({ titulo, pergunta, onCancelar, onConfirmar, rotuloConfirmar = 'Deletar' }) {
  return (
    <Modal titulo={titulo} onFechar={onCancelar}>
      <p>{pergunta}</p>
      <div className="botoes">
        <button type="button" className="btn" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="btn btn--vermelho" onClick={onConfirmar}>
          {rotuloConfirmar}
        </button>
      </div>
    </Modal>
  )
}

/* ---------- avisos (toast) ---------- */

const ToastContext = createContext(() => {})
let proximoId = 0

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((mensagem) => {
    const id = ++proximoId
    // no máximo dois avisos na tela ao mesmo tempo
    setAvisos((lista) => [...lista.slice(-1), { id, mensagem }])
    setTimeout(() => setAvisos((lista) => lista.filter((aviso) => aviso.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={avisar}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className="toast">
            {aviso.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// const avisar = useToast(); avisar('Conta criada com sucesso')
export const useToast = () => useContext(ToastContext)
