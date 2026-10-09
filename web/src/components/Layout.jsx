import { Link, NavLink, Outlet } from 'react-router-dom'
import { IconeCasa, IconeGrade, IconeKebab, IconeLista, IconeVoltar } from './Icones.jsx'
import { Marca, PorquinhoSelo } from './Marca.jsx'

const classeItem = ({ isActive }) => `nav__item${isActive ? ' ativo' : ''}`

// Casca do app: conteúdo + navegação (barra inferior no celular, lateral no desktop).
export default function Layout() {
  return (
    <div className="app">
      <Outlet />
      <nav className="nav" aria-label="Navegação principal">
        <div className="nav__marca">
          <Marca />
        </div>
        <NavLink to="/" end className={classeItem} title="Início">
          <IconeCasa />
          <span className="nav__rotulo">Início</span>
        </NavLink>
        <NavLink to="/categorias" className={classeItem} title="Categorias">
          <IconeGrade />
          <span className="nav__rotulo">Categorias</span>
        </NavLink>
        <NavLink to="/planejamentos" className={classeItem} title="Planejamento mensal">
          <IconeLista />
          <span className="nav__rotulo">Planejamento</span>
        </NavLink>
      </nav>
    </div>
  )
}

export function BotaoKebab({ onClick }) {
  return (
    <button type="button" className="btn-kebab" onClick={onClick} aria-label="Mais opções">
      <IconeKebab tamanho={28} />
    </button>
  )
}

// Barra do topo das telas internas: voltar, título, porquinho e o menu "Mais Opções".
export function Topo({ titulo, voltarPara = '/', onMenu }) {
  return (
    <header className="topo">
      <div className="topo__esquerda">
        <Link className="topo__voltar" to={voltarPara} aria-label="Voltar">
          <IconeVoltar />
        </Link>
        <h1 className="topo__titulo">{titulo}</h1>
      </div>
      <div className="topo__direita">
        <PorquinhoSelo />
        {onMenu && <BotaoKebab onClick={onMenu} />}
      </div>
    </header>
  )
}
