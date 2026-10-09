// Gera os ícones do PWA em public/ a partir do porquinho (src/assets/porquinho.svg).
// Uso: npm run icones
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publico = path.join(raiz, 'public')
const TURQUESA = '#28A6BB'

const porquinho = (await readFile(path.join(raiz, 'src/assets/porquinho.svg'), 'utf8'))
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')

// proporcao = quanto do lado do ícone o porquinho ocupa (ícones "maskable" precisam de mais margem)
function icone({ proporcao, raio = 0 }) {
  const lado = 512
  const altura = lado * proporcao
  const largura = (altura * 96) / 104
  const x = (lado - largura) / 2
  const y = (lado - altura) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" rx="${raio}" fill="${TURQUESA}"/>
  <circle cx="${lado / 2}" cy="${lado / 2}" r="${lado * proporcao * 0.64}" fill="#F3FBFC"/>
  <svg x="${x}" y="${y}" width="${largura}" height="${altura}" viewBox="0 0 96 104" fill="none">${porquinho}</svg>
</svg>`
}

async function png(svg, tamanho, nome) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(tamanho, tamanho).png().toFile(path.join(publico, nome))
  console.log('gerado', nome)
}

await mkdir(publico, { recursive: true })

const normal = icone({ proporcao: 0.62 })
const mascaravel = icone({ proporcao: 0.48 })
const favicon = icone({ proporcao: 0.66, raio: 112 })

await writeFile(path.join(publico, 'favicon.svg'), favicon)
console.log('gerado favicon.svg')
await png(favicon, 48, 'favicon.png')
await png(normal, 192, 'pwa-192.png')
await png(normal, 512, 'pwa-512.png')
await png(mascaravel, 512, 'pwa-maskable-512.png')
await png(normal, 180, 'apple-touch-icon.png')
