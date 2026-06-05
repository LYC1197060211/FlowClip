/** Encode mono Float32 PCM samples to a 16 kHz 16-bit WAV (Uint8Array). */
export function encodeWav(samples: Float32Array, inputSampleRate: number, targetRate = 16000): Uint8Array {
  const pcm = downsample(samples, inputSampleRate, targetRate)
  const buffer = new ArrayBuffer(44 + pcm.length * 2)
  const view = new DataView(buffer)

  writeStr(view, 0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  writeStr(view, 8, 'WAVE')
  writeStr(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // PCM fmt chunk size
  view.setUint16(20, 1, true) // audio format = PCM
  view.setUint16(22, 1, true) // channels = mono
  view.setUint32(24, targetRate, true) // sample rate
  view.setUint32(28, targetRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeStr(view, 36, 'data')
  view.setUint32(40, pcm.length * 2, true)

  let offset = 44
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return new Uint8Array(buffer)
}

function downsample(buffer: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate >= inRate) return buffer
  const ratio = inRate / outRate
  const newLen = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLen)
  for (let i = 0; i < newLen; i++) {
    const idx = i * ratio
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, buffer.length - 1)
    result[i] = buffer[i0] + (buffer[i1] - buffer[i0]) * (idx - i0)
  }
  return result
}

function writeStr(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}
