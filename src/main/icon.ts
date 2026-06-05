import { deflateSync } from 'zlib'
import { nativeImage, type NativeImage } from 'electron'

/**
 * Self-contained icon generation. Draws the FlowClip mark into an RGBA buffer and encodes a PNG with
 * only Node built-ins. Used for the tray icon at runtime (no asset files needed)
 * and reused by scripts/make-icons.mjs for the installer .ico.
 */

type RGB = [number, number, number]

function inRoundRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): boolean {
  const hw = w / 2
  const hh = h / 2
  const cx = x + hw
  const cy = y + hh
  const rr = Math.min(r, hw, hh)
  const qx = Math.max(Math.abs(px - cx) - (hw - rr), 0)
  const qy = Math.max(Math.abs(py - cy) - (hh - rr), 0)
  return qx * qx + qy * qy <= rr * rr
}

function blend(buf: Buffer, idx: number, r: number, g: number, b: number, a: number): void {
  const ia = a / 255
  const na = buf[idx + 3] / 255
  const outA = ia + na * (1 - ia)
  if (outA <= 0) return
  buf[idx] = Math.round((r * ia + buf[idx] * na * (1 - ia)) / outA)
  buf[idx + 1] = Math.round((g * ia + buf[idx + 1] * na * (1 - ia)) / outA)
  buf[idx + 2] = Math.round((b * ia + buf[idx + 2] * na * (1 - ia)) / outA)
  buf[idx + 3] = Math.round(outA * 255)
}

function fillRoundRectGrad(
  buf: Buffer,
  W: number,
  nx: number,
  ny: number,
  nw: number,
  nh: number,
  nr: number,
  top: RGB,
  bot: RGB
): void {
  const x = nx * W
  const y = ny * W
  const w = nw * W
  const h = nh * W
  const r = nr * W
  for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
    for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
      if (px < 0 || py < 0 || px >= W || py >= W) continue
      if (!inRoundRect(px + 0.5, py + 0.5, x, y, w, h, r)) continue
      const t = Math.max(0, Math.min(1, (py - y) / h))
      blend(
        buf,
        (py * W + px) * 4,
        Math.round(top[0] + (bot[0] - top[0]) * t),
        Math.round(top[1] + (bot[1] - top[1]) * t),
        Math.round(top[2] + (bot[2] - top[2]) * t),
        255
      )
    }
  }
}

/** Render the logo into an RGBA buffer of the given size (3x supersampled). */
export function renderLogo(size: number): Buffer {
  const SS = 3
  const W = size * SS
  const big = Buffer.alloc(W * W * 4)
  fillRoundRectGrad(big, W, 0.08, 0.08, 0.84, 0.84, 0.22, [16, 24, 39], [8, 126, 130])
  fillRoundRectGrad(big, W, 0.2, 0.18, 0.5, 0.58, 0.11, [226, 255, 250], [151, 239, 221])
  fillRoundRectGrad(big, W, 0.3, 0.3, 0.5, 0.52, 0.11, [255, 255, 255], [230, 247, 244])
  fillRoundRectGrad(big, W, 0.39, 0.44, 0.31, 0.045, 0.022, [15, 118, 110], [20, 184, 166])
  fillRoundRectGrad(big, W, 0.39, 0.55, 0.24, 0.04, 0.02, [15, 118, 110], [20, 184, 166])
  fillRoundRectGrad(big, W, 0.4, 0.68, 0.055, 0.055, 0.028, [20, 184, 166], [45, 212, 191])
  fillRoundRectGrad(big, W, 0.49, 0.68, 0.055, 0.055, 0.028, [20, 184, 166], [45, 212, 191])
  fillRoundRectGrad(big, W, 0.58, 0.68, 0.055, 0.055, 0.028, [20, 184, 166], [45, 212, 191])

  const out = Buffer.alloc(size * size * 4)
  const n = SS * SS
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * W + (x * SS + dx)) * 4
          const al = big[i + 3]
          r += big[i] * al
          g += big[i + 1] * al
          b += big[i + 2] * al
          a += al
        }
      }
      const o = (y * size + x) * 4
      out[o + 3] = Math.round(a / n)
      if (a > 0) {
        out[o] = Math.round(r / a)
        out[o + 1] = Math.round(g / a)
        out[o + 2] = Math.round(b / a)
      }
    }
  }
  return out
}

// ---- PNG encoding (RGBA, 8-bit, color type 6) ----

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

export function encodePng(rgba: Buffer, width: number, height: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

export function logoPng(size: number): Buffer {
  return encodePng(renderLogo(size), size, size)
}

/** Tray icon as a NativeImage (built entirely in memory). */
export function trayImage(): NativeImage {
  return nativeImage.createFromBuffer(logoPng(32))
}
