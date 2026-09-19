/**
 * Rasterises the brand mark into every file the two toolchains want:
 *
 *   assets/    the source set `npx capacitor-assets generate --ios` expands
 *              into the Xcode asset catalogue
 *   public/    the PWA icons index.html and the web manifest point at
 *
 * Run with `npm run assets`, then `npm run assets:ios` to cut the iOS sizes.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import {
  backgroundSvg,
  iconForegroundSvg,
  iconSvg,
  maskableSvg,
  splashSvg,
} from './brand-mark.mjs'

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

const TARGETS = [
  // Source set for capacitor-assets.
  { path: 'assets/icon-only.png', svg: iconSvg(), size: 1024 },
  { path: 'assets/icon-foreground.png', svg: iconForegroundSvg(), size: 1024 },
  { path: 'assets/icon-background.png', svg: backgroundSvg(), size: 1024 },
  { path: 'assets/splash.png', svg: splashSvg(), size: 2732 },
  // The design is dark to begin with, so the dark variant is the same image.
  { path: 'assets/splash-dark.png', svg: splashSvg(), size: 2732 },

  // Web / PWA.
  { path: 'public/icon-192.png', svg: iconSvg(), size: 192 },
  { path: 'public/icon-512.png', svg: iconSvg(), size: 512 },
  { path: 'public/icon-maskable-512.png', svg: maskableSvg(), size: 512 },
  // iOS home-screen bookmarks ignore the manifest and read this one.
  { path: 'public/apple-touch-icon.png', svg: iconSvg(), size: 180 },
  { path: 'public/favicon-32.png', svg: iconSvg(), size: 32 },
]

await mkdir('assets', { recursive: true })
await mkdir('public', { recursive: true })

for (const { path, svg, size } of TARGETS) {
  await writeFile(path, await png(svg, size))
  console.log(`${path}  ${size}×${size}`)
}
