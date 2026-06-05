import { useCallback, useEffect, useRef, useState } from 'react'
import { encodeWav } from './wav'

interface Recorder {
  recording: boolean
  error: string | null
  start: () => Promise<void>
  /** Stop and return 16 kHz mono WAV bytes (null if nothing was captured). */
  stop: () => Promise<Uint8Array | null>
  cancel: () => void
}

interface RecRef {
  ctx: AudioContext
  stream: MediaStream
  processor: ScriptProcessorNode
  source: MediaStreamAudioSourceNode
  mute: GainNode
  chunks: Float32Array[]
}

export function useRecorder(): Recorder {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<RecRef | null>(null)

  const cleanup = useCallback(() => {
    const r = ref.current
    if (!r) return
    try {
      r.processor.disconnect()
    } catch {
      /* ignore */
    }
    try {
      r.mute.disconnect()
    } catch {
      /* ignore */
    }
    try {
      r.source.disconnect()
    } catch {
      /* ignore */
    }
    try {
      r.stream.getTracks().forEach((t) => t.stop())
    } catch {
      /* ignore */
    }
    try {
      void r.ctx.close()
    } catch {
      /* ignore */
    }
    ref.current = null
  }, [])

  // Stop the mic if the component unmounts mid-recording.
  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      const mute = ctx.createGain()
      mute.gain.value = 0 // keep the graph pulling audio without audible playback
      const chunks: Float32Array[] = []
      processor.onaudioprocess = (e) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
      }
      source.connect(processor)
      processor.connect(mute)
      mute.connect(ctx.destination)
      ref.current = { ctx, stream, processor, source, mute, chunks }
      setRecording(true)
    } catch {
      setError('无法访问麦克风,请检查系统的麦克风权限设置')
      setRecording(false)
    }
  }, [])

  const stop = useCallback(async (): Promise<Uint8Array | null> => {
    const r = ref.current
    setRecording(false)
    if (!r) return null
    const sampleRate = r.ctx.sampleRate
    const chunks = r.chunks
    cleanup()
    const total = chunks.reduce((n, c) => n + c.length, 0)
    if (total === 0) return null
    const merged = new Float32Array(total)
    let off = 0
    for (const c of chunks) {
      merged.set(c, off)
      off += c.length
    }
    return encodeWav(merged, sampleRate, 16000)
  }, [cleanup])

  const cancel = useCallback(() => {
    setRecording(false)
    cleanup()
  }, [cleanup])

  return { recording, error, start, stop, cancel }
}
