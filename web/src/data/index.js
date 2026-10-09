import { criarRepositorio } from './repositorio.js'

// Ponto único de acesso aos dados. Hoje tudo fica no IndexedDB do aparelho; quando o modo
// online existir, basta trocar estas implementações por outras que falem com a API
// (mesmos métodos: listar, obter, criar, atualizar, excluir) sem mexer nas telas.

const movimentacoes = criarRepositorio('movimentacoes')
const configuracoes = criarRepositorio('configuracoes')

const ID_CONFIG = 'app'
const CONFIG_PADRAO = { id: ID_CONFIG, ocultarValores: false }

export const repos = {
  contas: criarRepositorio('contas'),
  categorias: criarRepositorio('categorias'),
  planejamentos: criarRepositorio('planejamentos'),

  movimentacoes: {
    ...movimentacoes,
    listarPorConta: (idConta) => movimentacoes.listarPorIndice('idConta', idConta),
    listarRepeticoes: (idInicial) => movimentacoes.listarPorIndice('idMovimentacaoInicial', idInicial),
  },

  configuracoes: {
    async obter() {
      return (await configuracoes.obter(ID_CONFIG)) ?? CONFIG_PADRAO
    },
    async salvar(config) {
      return configuracoes.atualizar({ ...config, id: ID_CONFIG })
    },
  },
}

export { novoId } from './repositorio.js'
