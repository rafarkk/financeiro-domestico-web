import { useCallback, useEffect, useState } from 'react'

// Carrega dados assíncronos ao montar (e quando `deps` mudam).
// `recarregar()` busca de novo mantendo os dados atuais na tela até os novos chegarem.
export function useCarregar(carregar, deps = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true
    carregar().then(
      (dados) => ativo && setEstado({ dados, carregando: false, erro: null }),
      (erro) => ativo && setEstado({ dados: null, carregando: false, erro }),
    )
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  return { ...estado, recarregar }
}
