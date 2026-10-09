import { useRef } from 'react'

const FOLGA = 5

// Rola uma lista horizontal arrastando com o mouse (no toque o navegador já faz isso).
// Devolve as props para espalhar no elemento que rola.
export function useArrastarParaRolar() {
  const arrasto = useRef(null)

  const soltar = () => {
    if (arrasto.current) arrasto.current.solto = true
  }

  return {
    onPointerDown(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      arrasto.current = { x: e.clientX, inicio: e.currentTarget.scrollLeft, moveu: false, solto: false }
    },
    onPointerMove(e) {
      const a = arrasto.current
      if (!a || a.solto) return
      const distancia = e.clientX - a.x
      if (!a.moveu && Math.abs(distancia) < FOLGA) return
      if (!a.moveu) {
        a.moveu = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      e.currentTarget.scrollLeft = a.inicio - distancia
    },
    onPointerUp: soltar,
    onPointerCancel: soltar,
    // soltar o botão depois de arrastar não pode acionar o que estava embaixo do cursor
    onClickCapture(e) {
      if (arrasto.current?.moveu) {
        e.preventDefault()
        e.stopPropagation()
      }
      arrasto.current = null
    },
    onDragStart: (e) => e.preventDefault(),
  }
}
