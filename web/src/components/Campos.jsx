import { IconeLupa } from './Icones.jsx'
import { centavosDeTexto, formatarValor } from '../utils/dinheiro.js'

export function Campo({ rotulo, children }) {
  return (
    <label className="campo">
      <span className="campo__rotulo">{rotulo}</span>
      {children}
    </label>
  )
}

// Campo de dinheiro com máscara: `valor` e `onChange` trabalham em centavos (null = vazio).
export function EntradaMoeda({ valor, onChange, ...props }) {
  return (
    <div className="entrada-moeda">
      <span className="entrada-moeda__simbolo">R$</span>
      <input
        className="entrada"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        value={valor == null ? '' : formatarValor(valor)}
        onChange={(evento) => onChange(centavosDeTexto(evento.target.value))}
        {...props}
      />
    </div>
  )
}

// Número inteiro curto (dia, parcelas...). Fica '' enquanto o campo está vazio.
export function EntradaInteiro({ valor, onChange, ...props }) {
  return (
    <input
      className="entrada entrada--curta"
      type="number"
      inputMode="numeric"
      value={valor ?? ''}
      onChange={(evento) => onChange(evento.target.value === '' ? '' : Number(evento.target.value))}
      {...props}
    />
  )
}

export function Check({ rotulo, marcado, onChange, ...props }) {
  return (
    <label className="check">
      <input type="checkbox" checked={Boolean(marcado)} onChange={(evento) => onChange(evento.target.checked)} {...props} />
      <span>{rotulo}</span>
    </label>
  )
}

export function Pesquisa({ valor, onChange, onBuscar, placeholder }) {
  const enviar = (evento) => {
    evento.preventDefault()
    onBuscar?.()
  }
  return (
    <form className="pesquisa" role="search" onSubmit={enviar}>
      <input
        className="pesquisa__entrada"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
      />
      <button type="submit" className="pesquisa__botao" aria-label="Buscar">
        <IconeLupa tamanho={22} />
      </button>
    </form>
  )
}
