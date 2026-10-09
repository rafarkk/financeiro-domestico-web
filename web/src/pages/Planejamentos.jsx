import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Topo } from '../components/Layout.jsx'
import { Vazio } from '../components/Marca.jsx'
import { Pesquisa } from '../components/Campos.jsx'
import { Sheet, SheetAcao } from '../components/Sobreposicoes.jsx'
import {
  IconeDespesa,
  IconeDivisas,
  IconePreview,
  IconeReceita,
  IconeTransferencia,
} from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { TipoPlanejamento } from '../domain/enums.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { formatarMoeda } from '../utils/dinheiro.js'

async function carregar() {
  const [planejamentos, contas] = await Promise.all([repos.planejamentos.listar(), repos.contas.listar()])
  const nomeConta = new Map(contas.map((conta) => [conta.id, conta.nome]))
  for (const plan of planejamentos) plan.nomeConta = nomeConta.get(plan.idConta) ?? '—'
  return planejamentos.sort(
    (a, b) =>
      a.diaVencimento - b.diaVencimento ||
      a.descricao.localeCompare(b.descricao, 'pt-BR') ||
      a.tipoPlanejamento - b.tipoPlanejamento,
  )
}

export default function Planejamentos() {
  const { dados: planejamentos } = useCarregar(carregar)
  const [filtro, setFiltro] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)

  const texto = filtro.trim().toLowerCase()
  const visiveis = (planejamentos ?? []).filter((p) => p.descricao.toLowerCase().includes(texto))

  return (
    <>
      <Topo titulo="Planejamento Mensal" onMenu={() => setMenuAberto((aberto) => !aberto)} />
      <div className="pagina">
        <div className="atalhos-plan">
          <Link className="btn" to={`/planejamentos/createEdit/tipo/${TipoPlanejamento.RECEITA}`}>
            <IconeReceita /> Receita
          </Link>
          <Link className="btn btn--vermelho" to={`/planejamentos/createEdit/tipo/${TipoPlanejamento.DESPESA}`}>
            <IconeDespesa /> Despesa
          </Link>
          <Link className="btn btn--roxo" to={`/planejamentos/createEdit/tipo/${TipoPlanejamento.TRANSFERENCIA}`}>
            <IconeTransferencia /> Transferência
          </Link>
        </div>

        <Pesquisa placeholder="Buscar por descrição" valor={filtro} onChange={setFiltro} />

        {!planejamentos ? (
          <p className="carregando">Carregando...</p>
        ) : visiveis.length === 0 ? (
          <Vazio texto="Nenhum planejamento encontrado" />
        ) : (
          <div style={{ marginTop: 16 }}>
            {visiveis.map((plan) => (
              <div key={plan.id} className={`card-listagem ${plan.valorVariavel ? 'card-listagem--variavel' : 'card-listagem--fixo'}`}>
                <div className="card-listagem__dados">
                  <div className="dado">
                    <span className="dado__titulo">Descrição</span>
                    <span className="dado__valor">{plan.descricao}</span>
                  </div>
                  <div className="card-listagem__linha">
                    <div className="dado">
                      <span className="dado__titulo">Conta</span>
                      <span className="dado__valor">{plan.nomeConta}</span>
                    </div>
                    <div className="dado">
                      <span className="dado__titulo">Valor</span>
                      <span className={`dado__valor ${plan.tipoPlanejamento === TipoPlanejamento.DESPESA ? 'texto-vermelho' : 'texto-verde'}`}>
                        {formatarMoeda(plan.valor)}
                      </span>
                    </div>
                    <div className="dado">
                      <span className="dado__titulo">Dia Venc.</span>
                      <span className="dado__valor">{plan.diaVencimento}</span>
                    </div>
                  </div>
                </div>
                <Link className="card-listagem__acao" to={`/planejamentos/createEdit/${plan.id}`} aria-label={`Editar ${plan.descricao}`}>
                  <IconeDivisas />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet aberto={menuAberto} onFechar={() => setMenuAberto(false)}>
        <SheetAcao icone={<IconePreview />} to="/planejamentos/previewDespesas">Pré-Visualizar</SheetAcao>
      </Sheet>
    </>
  )
}
