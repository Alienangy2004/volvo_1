import { defineEventHandler, readBody, setResponseHeader, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiKey =
    config.deepgramApiKey || 'cab89e65549f0637541e13bc24750128daabbffc'

  const body = await readBody<{ text?: string; model?: string }>(event)
  const text = (body?.text || '').trim()
  if (!text) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'Texto vacío para síntesis de voz.' }
  }

  const candidateModels = [
    body?.model || 'aura-2-celeste-es',
    'aura-2-estrella-es',
    'aura-2-nestor-es',
    'aura-asteria-en'
  ]

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        }
      )

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer()
        setResponseHeader(event, 'Content-Type', 'audio/mpeg')
        return new Uint8Array(arrayBuf)
      }
    } catch {
      // Probar siguiente modelo candidato
    }
  }

  setResponseStatus(event, 502)
  return { ok: false, error: 'No fue posible sintetizar voz con Deepgram TTS.' }
})
