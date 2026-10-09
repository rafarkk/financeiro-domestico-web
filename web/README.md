# DinDinGuru (web)

Controle financeiro doméstico: contas, lançamentos, categorias e planejamento mensal.
Versão web/PWA do app DinDinGuru (o original em .NET MAUI está em `../referencias`).

React + Vite, JavaScript puro, CSS puro (sem TypeScript, Tailwind ou biblioteca de componentes).
Os dados ficam no aparelho, em IndexedDB, e o app funciona sem internet.

## Comandos

```
npm install
npm run dev       # desenvolvimento em http://localhost:5173
npm test          # testes das regras de negócio e dos serviços
npm run build     # gera dist/ (com service worker e manifest)
npm run preview   # serve o build; é aqui que dá para testar instalação e modo offline
npm run icones    # regenera os ícones do PWA a partir de src/assets/porquinho.svg
```

Para instalar no celular o app precisa ser servido por HTTPS (ou `localhost`).

## Publicação

Cada push na `main` roda os testes, gera o build e publica no GitHub Pages
(`.github/workflows/pages.yml`). Como lá o app fica em uma subpasta, o build recebe o caminho em
`BASE_PATH` (ex.: `/financeiro-domestico-web/`); sem essa variável o app é gerado para a raiz.

## Dados de exemplo

Na home, o menu ⋮ ("Mais Opções") tem duas ferramentas de teste: **Dados de exemplo** (apaga o que
houver no aparelho e carrega um cenário completo, definido em `src/services/exemplo.js`) e
**Apagar tudo**. Elas aparecem em `npm run dev`; no build, só ao abrir o app com `?exemplo` no
endereço (ex.: `http://localhost:4173/?exemplo`).

## Estrutura

```
src/
  pages/        telas (mesmas rotas do app original)
  components/   layout, navegação, painel "Mais Opções", modal, avisos, campos e ícones
  domain/       regras de negócio puras: saldos, repetições, transferências, filtros, previsão, CSV
  services/     casos de uso que combinam regras e gravação
  data/         acesso a dados (IndexedDB)
  utils/        dinheiro, datas, arquivos
  styles/       tokens de cor e CSS
```

## Convenções

- **Dinheiro** é sempre um inteiro em centavos. Despesas e saídas de transferência são gravadas negativas.
- **Datas sem hora** são texto `AAAA-MM-DD`.
- **Saldos não são gravados**: são calculados a partir dos lançamentos (`domain/saldos.js`).
- **Ids** são UUIDs gerados no cliente, todo registro tem `dataAlteracao` e a exclusão é lógica
  (`excluidoEm`). Isso existe para a futura sincronização com a API.

## Modo online (futuro)

As telas só conhecem `repos` (`src/data/index.js`). Para ligar a API ASP.NET Core, basta fornecer
repositórios com os mesmos métodos (`listar`, `obter`, `criar`, `atualizar`, `excluir`) que falem
HTTP, e sincronizar os registros locais usando `dataAlteracao` e `excluidoEm`.

## Diferenças em relação ao app original

Correções:

- A pré-visualização do planejamento funciona de outubro a dezembro e com dia 31 em meses menores.
- Editar uma categoria não acusa mais "já existe uma categoria com este nome".
- Editar o lançamento inicial de uma série atualiza as repetições.
- A busca por descrição não diferencia maiúsculas de minúsculas.
- Excluir uma conta exclui também a outra ponta das transferências dela.
- "Limpar" filtros respeita as contas desligadas nos cards.

Fora desta versão: a tela de Projeções (inacabada no original) e a migração de dados do app Android.
