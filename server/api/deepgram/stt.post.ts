import { defineEventHandler, getHeader, readRawBody } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiKey =
    config.deepgramApiKey || 'cab89e65549f0637541e13bc24750128daabbffc'

  const audioBuffer = await readRawBody(event, false)
  if (!audioBuffer || audioBuffer.length === 0) {
    return { ok: false, transcript: '', error: 'No se recibió audio para transcribir.' }
  }

  const contentType = getHeader(event, 'content-type') || 'audio/webm'

  try {
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true&punctuate=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': contentType
        },
        body: audioBuffer as unknown as BodyInit
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return {
        ok: false,
        transcript: '',
        error: `Deepgram STT (${response.status}): ${errText}`
      }
    }

    const data = (await response.json()) as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{ transcript?: string; confidence?: number }>
        }>
      }
    }

    const alt = data.results?.channels?.[0]?.alternatives?.[0]
    return {
      ok: true,
      transcript: (alt?.transcript || '').trim(),
      confidence: alt?.confidence ?? 0
    }
  } catch (err: unknown) {
    return {
      ok: false,
      transcript: '',
      error: err instanceof Error ? err.message : 'Error conectando con Deepgram STT'
    }
  }
})
