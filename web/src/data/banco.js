import { openDB } from 'idb'

const NOME = 'dindinguru'
const VERSAO = 1

let conexao

export function abrirBanco() {
  conexao ??= openDB(NOME, VERSAO, {
    upgrade(db) {
      db.createObjectStore('contas', { keyPath: 'id' })
      db.createObjectStore('categorias', { keyPath: 'id' })
      db.createObjectStore('planejamentos', { keyPath: 'id' })
      db.createObjectStore('configuracoes', { keyPath: 'id' })
      const movimentacoes = db.createObjectStore('movimentacoes', { keyPath: 'id' })
      movimentacoes.createIndex('idConta', 'idConta')
      movimentacoes.createIndex('idMovimentacaoInicial', 'idMovimentacaoInicial')
    },
  })
  return conexao
}

// Apaga de verdade tudo o que está gravado no aparelho (não é a exclusão lógica dos repositórios).
export async function limparBanco() {
  const db = await abrirBanco()
  const nomes = [...db.objectStoreNames]
  const transacao = db.transaction(nomes, 'readwrite')
  await Promise.all(nomes.map((nome) => transacao.objectStore(nome).clear()))
  await transacao.done
}
