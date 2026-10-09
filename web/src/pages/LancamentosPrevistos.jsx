import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topo } from '../components/Layout.jsx'
import { Vazio } from '../components/Marca.jsx'
import { Sheet, SheetAcao, useToast } from '../components/Sobreposicoes.jsx'
import { IconeDespesa, IconeMais, IconeReceita } from '../components/Icones.jsx'
import { repos } from '../data/index.js'
import { TipoPlanejamento } from '../domain/enums.js'
import { agruparPorMes, gerarPrevisao } from '../domain/planejamento.js'
import { useCarregar } from '../hooks/useCarregar.js'
import { lancarPrevistos } from '../services/movimentacoes.js'
import { formatarData, hojeISO } from '../utils/datas.js'
import { formatarMoeda } from '../utils/dinheiro.js'

async function carregar() {
  const [planejamentos, contas] = await Promise.all([repos.planejamentos.listar(), repos.contas.listar()])
  const nomeConta = new Map(contas.map((conta) => [conta.id, conta.nome]))
  return gerarPrevisao(planejamentos, hojeISO()).map((item) => ({
    ...item,
    nomeConta: nomeConta.get(item.idConta) ?? '—',
  }))
}

export default function LancamentosPrevistos() {
  const navigate = useNavigate()
  const avisar = useToast()
  const { dados: previsao } = useCarregar(carregar)
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [menuAberto, setMenuAberto] = useState(false)
  const grupos = useMemo(() => agruparPorMes(previsao ?? []), [previsao])

  function alternar(chave) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (!novo.delete(chave)) novo.add(chave)
      return novo
    })
  }

  async function lancar() {
    const itens = previsao.filter((item) => selecionados.has(item.chave))
    if (itens.length === 0) {
      avisar('Selecione ao menos um lançamento.')
      return
    }
    const { lancados, semConta } = await lancarPrevistos(itens)
    if (semConta > 0) avisar('Uma das contas não está mais ativa, não é possível realizar o lançamento')
    if (lancados > 0) avisar('Movimentos lançados com sucesso!')
    navigate('/')
  }

  return (
    <>
      <Topo titulo="Lançamentos Previstos" voltarPara="/planejamentos" onMenu={() => setMenuAberto((aberto) => !aberto)} />
      <div className="pagina">
        {!previsao ? (
          <p className="carregando">Carregando...</p>
        ) : grupos.length === 0 ? (
          <Vazio texto="Nenhuma despesa encontrada" />
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.chave}>
              <h2 className="divisor-mes">{grupo.titulo}</h2>
              {grupo.itens.map((item) => {
                const despesa = item.tipoPlanejamento === TipoPlanejamento.DESPESA
                return (
                  <div key={item.chave} className={`card-listagem ${item.valorVariavel ? 'card-listagem--variavel' : 'card-listagem--fixo'}`}>
                    <div className="card-listagem__dados">
                      <div className="card-previsto__topo">
                        <span className={`selo-previsto ${despesa ? 'acao--despesa' : 'acao--receita'}`}>
                          {despesa ? <IconeDespesa /> : <IconeReceita />}
                        </span>
                        <div className="dado">
                          <span className="dado__titulo">Descrição</span>
                          <span className="dado__valor">{item.descricao}</span>
                        </div>
                      </div>
                      <div className="card-listagem__linha">
                        <div className="dado">
                          <span className="dado__titulo">Conta</span>
                          <span className="dado__valor">{item.nomeConta}</span>
                        </div>
                        <div className="dado">
                          <span className="dado__titulo">Valor</span>
                          <span className={`dado__valor ${despesa ? 'texto-vermelho' : 'texto-verde'}`}>{formatarMoeda(item.valor)}</span>
                        </div>
                        <div className="dado">
                          <span className="dado__titulo">Vencimento</span>
                          <span className="dado__valor">{formatarData(item.dataVencimento)}</span>
                        </div>
                      </div>
                    </div>
                    <label className="card-previsto__check">
                      <input
                        type="checkbox"
                        checked={selecionados.has(item.chave)}
                        onChange={() => alternar(item.chave)}
                        aria-label={`Selecionar ${item.descricao} de ${formatarData(item.dataVencimento)}`}
                      />
                    </label>
                  </div>
                )
              })}
            </section>
          ))
        )}
      </div>

      <Sheet aberto={menuAberto} onFechar={() => setMenuAberto(false)}>
        <SheetAcao icone={<IconeMais />} onClick={lancar}>Lançar Selecionados</SheetAcao>
      </Sheet>
    </>
  )
}
