import porquinho from '../assets/porquinho.svg'

export { porquinho }

// Porquinho sobre um disco claro, para aparecer bem em cima do turquesa.
export function PorquinhoSelo() {
  return (
    <span className="porquinho-selo">
      <img src={porquinho} alt="" />
    </span>
  )
}

// Logotipo: DINDINGURU + porquinho. `clara` é a versão para fundo turquesa.
export function Marca({ clara = false }) {
  return (
    <span className={`marca${clara ? ' marca--clara' : ''}`} aria-label="DinDinGuru">
      <span className="marca__nome" aria-hidden="true">
        <span>DINDIN</span>
        <span>GURU</span>
      </span>
      {clara ? <PorquinhoSelo /> : <img src={porquinho} alt="" width="34" />}
    </span>
  )
}

export function Vazio({ texto, children }) {
  return (
    <div className="vazio">
      <img src={porquinho} alt="" />
      <p>{texto}</p>
      {children}
    </div>
  )
}
