// Generates PWA PNG icons from an inline SVG using sharp.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public')

// Crossed tomahawks mark, drawn within a 26x26 reference box and scaled.
function mark(scale, tx, ty) {
  return `
    <g transform="translate(${tx} ${ty}) scale(${scale})" stroke="#c9a45c" stroke-width="2" stroke-linecap="round">
      <line x1="4" y1="22" x2="20" y2="6"/>
      <line x1="22" y1="22" x2="6" y2="6"/>
    </g>
    <g transform="translate(${tx} ${ty}) scale(${scale})" fill="#c9a45c">
      <path d="M 17 3 L 23 5 L 21 9 L 17 7 Z"/>
      <path d="M 9 3 L 3 5 L 5 9 L 9 7 Z"/>
    </g>`
}

// Full-bleed icon: mark fills ~70% of the canvas, centered.
function fullSvg(size) {
  const markSpan = size * 0.62
  const scale = markSpan / 26
  const tx = (size - markSpan) / 2
  const ty = (size - markSpan) / 2
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#1c1b18"/>
    <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.92}" rx="${size * 0.14}" fill="none" stroke="#33312a" stroke-width="${size * 0.012}"/>
    ${mark(scale, tx, ty)}
  </svg>`
}

// Maskable icon: smaller mark inside the safe zone (mark ~46% so it survives
// Android's circular/rounded mask crop).
function maskableSvg(size) {
  const markSpan = size * 0.46
  const scale = markSpan / 26
  const tx = (size - markSpan) / 2
  const ty = (size - markSpan) / 2
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#1c1b18"/>
    ${mark(scale, tx, ty)}
  </svg>`
}

async function render(svg, file, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(out, file))
  console.log('wrote', file)
}

await render(fullSvg(192), 'icon-192.png', 192)
await render(fullSvg(512), 'icon-512.png', 512)
await render(maskableSvg(512), 'icon-512-maskable.png', 512)
await render(fullSvg(180), 'apple-touch-icon.png', 180)
console.log('done')
