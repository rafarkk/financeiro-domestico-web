// Datas sem hora trafegam como texto "AAAA-MM-DD" (o mesmo formato do <input type="date">),
// o que permite comparar e ordenar como string e evita problemas de fuso horário.

const pad = (n) => String(n).padStart(2, '0')

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function paraISO(data) {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
}

export function hojeISO() {
  return paraISO(new Date())
}

function partes(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return { ano, mes, dia }
}

// mes de 1 a 12
export function ultimoDiaDoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate()
}

// Monta a data do dia pedido naquele mês; dia 31 em mês de 30 vira dia 30.
export function dataNoMes(ano, mes, dia) {
  return `${ano}-${pad(mes)}-${pad(Math.min(Math.max(dia, 1), ultimoDiaDoMes(ano, mes)))}`
}

export function somarDias(iso, dias) {
  const { ano, mes, dia } = partes(iso)
  return paraISO(new Date(ano, mes - 1, dia + dias))
}

export function somarMeses(iso, meses) {
  const { ano, mes, dia } = partes(iso)
  const total = ano * 12 + (mes - 1) + meses
  return dataNoMes(Math.floor(total / 12), (total % 12) + 1, dia)
}

export function somarAnos(iso, anos) {
  return somarMeses(iso, anos * 12)
}

// "2026-10-09" -> "09/10/2026"
export function formatarData(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
