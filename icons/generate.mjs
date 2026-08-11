/**
 * Regenerates the raster icons in public/ from the two SVG sources.
 *
 * The outputs are committed, so a normal install and build never needs this.
 * Run it only when the artwork changes:
 *
 *   npm i -D playwright && node icons/generate.mjs
 *
 * Playwright is deliberately not a project dependency — it would pull a browser
 * download into every install to serve a once-in-a-while maintenance task.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public')

// Sizes iOS and Android ask for by name, so nothing is ever upscaled on device.
// 152 = iPad, 167 = iPad Pro, 180 = iPhone @3x, 192/512 = web app manifest.
// All carry the "500" wordmark; all are large enough to read it.
// No 1024 master: the SVGs are the vector masters, a PNG of one would be dead
// weight in the deployed bundle.
const LARGE = [512, 192, 180, 167, 152]
// Rasterised from public/favicon.svg, which has no wordmark — three digits in
// 16px is unreadable. Held in memory as the .ico entries rather than written
// out, since favicon.ico is what browsers ask for and separate 16/32/48 PNGs
// would just be unreferenced files in public/.
const SMALL = [48, 32, 16]

const EXECUTABLE = process.env.CHROME_PATH || undefined

async function raster(browser, svg, size) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  await page.setContent(
    `<style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}` +
      `svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    { waitUntil: 'load' },
  )
  const buffer = await page.screenshot({ omitBackground: false })
  await ctx.close()
  return buffer
}

/**
 * Minimal multi-image ICO writer: 6-byte ICONDIR, then one 16-byte ICONDIRENTRY
 * per image, then the PNG payloads. PNG-in-ICO is understood by every browser
 * that is still shipping, and avoids hand-rolling BMP with its bottom-up rows
 * and AND-mask padding.
 */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries = []
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // 0 encodes 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size, 0 for truecolour
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

const browser = await chromium.launch({ executablePath: EXECUTABLE })

const largeSvg = fs.readFileSync(path.join(ROOT, 'icons', 'app-icon.svg'), 'utf8')
const smallSvg = fs.readFileSync(path.join(OUT, 'favicon.svg'), 'utf8')

for (const size of LARGE) {
  const buffer = await raster(browser, largeSvg, size)
  const name =
    size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  fs.writeFileSync(path.join(OUT, name), buffer)
  console.log(`${name} (${size}px, ${buffer.length} bytes)`)
}

const icoImages = []
for (const size of SMALL) {
  const buffer = await raster(browser, smallSvg, size)
  icoImages.push({ size, data: buffer })
  console.log(`  ico entry ${size}px (${buffer.length} bytes)`)
}

// Largest first so pickers that stop at the first usable entry get the best one.
const ico = buildIco([...icoImages].sort((a, b) => b.size - a.size))
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico)
console.log(`favicon.ico (${SMALL.join('/')} px, ${ico.length} bytes)`)

await browser.close()
