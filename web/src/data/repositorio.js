import { abrirBanco } from './banco.js'

// Ids são UUIDs gerados no cliente, para que os registros criados offline
// possam ser sincronizados com a API no futuro sem conflito de chave.
export function novoId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  // crypto.randomUUID só existe em contexto seguro (https/localhost)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const agora = () => new Date().toISOString()
const ativo = (registro) => registro && !registro.excluidoEm

// Repositório genérico sobre um object store. A exclusão é lógica (excluidoEm) e todo
// registro carrega dataAlteracao: é o que a sincronização online vai precisar.
export function criarRepositorio(store) {
  return {
    async listar() {
      const db = await abrirBanco()
      return (await db.getAll(store)).filter(ativo)
    },

    async listarPorIndice(indice, valor) {
      const db = await abrirBanco()
      return (await db.getAllFromIndex(store, indice, valor)).filter(ativo)
    },

    async obter(id) {
      if (!id) return null
      const db = await abrirBanco()
      const registro = await db.get(store, id)
      return ativo(registro) ? registro : null
    },

    async criar(dados) {
      const db = await abrirBanco()
      const momento = agora()
      const registro = { ...dados, id: dados.id ?? novoId(), dataCriacao: momento, dataAlteracao: momento }
      await db.put(store, registro)
      return registro
    },

    async atualizar(dados) {
      const db = await abrirBanco()
      const registro = { ...dados, dataAlteracao: agora() }
      await db.put(store, registro)
      return registro
    },

    async excluir(id) {
      const db = await abrirBanco()
      const registro = await db.get(store, id)
      if (!ativo(registro)) return
      const momento = agora()
      await db.put(store, { ...registro, excluidoEm: momento, dataAlteracao: momento })
    },
  }
}
