// Mesmos valores numéricos do app original, para manter compatibilidade com dados exportados.

export const TipoConta = { CREDITO: 0, DEBITO: 1 }

export const TipoMovimento = {
  CREDITO: 0,
  DEBITO: 1,
  TRANSFERENCIA_ORIGEM: 2,
  TRANSFERENCIA_DESTINO: 3,
}

export const TipoPlanejamento = { RECEITA: 0, DESPESA: 1, TRANSFERENCIA: 2 }

export const Intervalo = { DIAS: 0, SEMANAS: 1, MESES: 2, ANOS: 3 }

export const INTERVALOS = [
  { valor: Intervalo.DIAS, nome: 'Dias' },
  { valor: Intervalo.SEMANAS, nome: 'Semanas' },
  { valor: Intervalo.MESES, nome: 'Meses' },
  { valor: Intervalo.ANOS, nome: 'Anos' },
]
