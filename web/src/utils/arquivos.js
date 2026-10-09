// Entrega um arquivo gerado no app: no celular abre o compartilhamento nativo
// (equivalente ao "clique para compartilhar" do app original); no desktop faz o download.
// Devolve 'compartilhado', 'baixado' ou 'cancelado'.
export async function entregarArquivo(nome, conteudo, tipo) {
  const arquivo = new File([conteudo], nome, { type: tipo })
  const toque = window.matchMedia?.('(pointer: coarse)').matches

  if (toque && navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: nome })
      return 'compartilhado'
    } catch (erro) {
      if (erro.name === 'AbortError') return 'cancelado'
      // qualquer outra falha cai no download
    }
  }

  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'baixado'
}
