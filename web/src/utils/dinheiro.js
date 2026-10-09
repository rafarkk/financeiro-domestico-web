// Todo valor monetário do sistema é um inteiro em centavos.

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const VALOR_OCULTO = '•••••'

// 123456 -> "R$ 1.234,56"
export function formatarMoeda(centavos) {
  return moeda.format((centavos || 0) / 100).replace(/ /g, ' ')
}

// 123456 -> "1.234,56"
export function formatarValor(centavos) {
  return numero.format((centavos || 0) / 100)
}

// Máscara de digitação: só os dígitos contam, os dois últimos são os centavos.
// "1.234,56" -> 123456 | "" -> null
export function centavosDeTexto(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '').slice(0, 13)
  return digitos ? parseInt(digitos, 10) : null
}
