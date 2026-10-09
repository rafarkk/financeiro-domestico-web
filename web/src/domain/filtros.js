import { TipoMovimento } from './enums.js'
import { somarMeses } from '../utils/datas.js'

// Padrão da home: dos últimos 3 meses até hoje.
export function filtrosPadrao(hoje) {
  return {
    descricao: '',
    dataInicial: somarMeses(hoje, -3),
    dataFinal: hoje,
    idCategoria: '',
    tipo: '',
    valorInicial: null,
    valorFinal: null,
  }
}

const TIPOS_POR_FILTRO = {
  [TipoMovimento.CREDITO]: [TipoMovimento.CREDITO, TipoMovimento.TRANSFERENCIA_DESTINO],
  [TipoMovimento.DEBITO]: [TipoMovimento.DEBITO, TipoMovimento.TRANSFERENCIA_ORIGEM],
}

// `idsContasOcultas` é um Set com as contas desligadas nos cards da home.
export function filtrarMovimentacoes(movimentacoes, filtros, idsContasOcultas = new Set()) {
  const texto = (filtros.descricao ?? '').trim().toLowerCase()
  const tipos = filtros.tipo === '' || filtros.tipo == null ? null : TIPOS_POR_FILTRO[Number(filtros.tipo)]

  return movimentacoes
    .filter((mov) => {
      if (idsContasOcultas.has(mov.idConta)) return false
      if (texto && !(mov.descricao ?? '').toLowerCase().includes(texto)) return false
      if (filtros.idCategoria && mov.idCategoria !== filtros.idCategoria) return false
      if (tipos && !tipos.includes(mov.tipoMovimentacao)) return false
      const absoluto = Math.abs(mov.valor)
      if (filtros.valorInicial != null && absoluto < filtros.valorInicial) return false
      if (filtros.valorFinal != null && absoluto > filtros.valorFinal) return false
      if (filtros.dataInicial && mov.dataMovimento < filtros.dataInicial) return false
      if (filtros.dataFinal && mov.dataMovimento > filtros.dataFinal) return false
      return true
    })
    .sort(
      (a, b) =>
        b.dataMovimento.localeCompare(a.dataMovimento) ||
        (b.dataCriacao ?? '').localeCompare(a.dataCriacao ?? ''),
    )
}
