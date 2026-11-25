import { defineEventHandler, readBody } from 'h3'

interface ChatTurn {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const candidateHosts = [
    config.ollamaHost || 'http://127.0.0.1:11434',
    'http://localhost:11434'
  ]

  const body = await readBody<{
    messages?: ChatTurn[]
    model?: string
    workshopContext?: string
    warmup?: boolean
  }>(event)

  // 1. Detectar cuál host de Ollama responde a /api/tags (sin duplicar llamadas lentas de inferencia)
  let activeHost = ''
  let availableModels: string[] = []

  for (const host of candidateHosts) {
    try {
      const tagsRes = await fetch(`${host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3500)
      })
      if (tagsRes.ok) {
        const tagsData = (await tagsRes.json()) as {
          models?: Array<{ name: string }>
        }
        activeHost = host
        availableModels = (tagsData.models || []).map((m) => m.name)
        break
      }
    } catch {
      // Probar siguiente candidato
    }
  }

  if (!activeHost) {
    return {
      ok: false,
      modelUsed: 'offline',
      reply:
        'No se pudo conectar con Ollama en http://127.0.0.1:11434. Verifica que la aplicación Ollama esté ejecutándose.'
    }
  }

  if (availableModels.length === 0) {
    return {
      ok: false,
      modelUsed: 'sin-modelos',
      reply:
        'Ollama está activo, pero no tiene modelos instalados. Ejecuta "ollama pull llama3.2" en tu terminal.'
    }
  }

  // Seleccionar el modelo pedido por el usuario (ej. examinador-diesel:latest) o el primero disponible
  let targetModel = body?.model?.trim() || ''
  if (!targetModel || !availableModels.includes(targetModel)) {
    targetModel = availableModels[0]!
  }

  // Si es solo pre-calentamiento del modelo en RAM al abrir el visor
  if (body?.warmup) {
    fetch(`${activeHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        prompt: 'Hola',
        stream: false,
        keep_alive: '30m',
        options: { num_predict: 1, num_ctx: 512 }
      })
    }).catch(() => {})
    return { ok: true, modelUsed: targetModel, reply: 'warmed' }
  }

  // 2. Prompt de sistema compacto (~100 tokens) para inferencia rápida en CPU/GPU local
  const systemPrompt = `Eres el Ingeniero Jefe IA del Complejo Taller Volvo 3D (4 talleres: T01 Tren Motriz FH16/FMX/Motor D16, T02 Carrocería/Puerta, T03 Chasis 6x4/Aire, T04 Tablero/Asientos). Responde en español en máximo 3 oraciones claras con los datos del taller:
${body?.workshopContext || ''}`

  // Filtrar historial para que empiece siempre con un mensaje 'user' y máximo los últimos 4 turnos
  const rawTurns = (body?.messages || []).filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0
  )
  while (rawTurns.length > 0 && rawTurns[0]?.role !== 'user') {
    rawTurns.shift()
  }
  const cleanTurns = rawTurns.slice(-4)
  const lastUserQuestion =
    cleanTurns.filter((m) => m.role === 'user').pop()?.content || 'Reporte del taller'

  const ollamaOptions = {
    num_ctx: 1024,
    num_predict: 140,
    temperature: 0.35
  }

  // 3. Intentar con /api/chat (timeout amplio de 120s para la primera carga en frío del modelo en RAM)
  try {
    const chatRes = await fetch(`${activeHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        stream: false,
        keep_alive: '30m',
        options: ollamaOptions,
        messages: [{ role: 'system', content: systemPrompt }, ...cleanTurns]
      }),
      signal: AbortSignal.timeout(120000)
    })

    if (chatRes.ok) {
      const chatData = (await chatRes.json()) as {
        message?: { content?: string }
      }
      const content = chatData.message?.content?.trim()
      if (content) {
        return {
          ok: true,
          modelUsed: targetModel,
          reply: content
        }
      }
    }
  } catch {
    // Si /api/chat falla o el Modelfile personalizado requiere /api/generate, usar /api/generate abajo
  }

  // 4. Respaldo directo con /api/generate (ideal para Modelfiles personalizados como examinador-diesel:latest)
  try {
    const genRes = await fetch(`${activeHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        system: systemPrompt,
        prompt: lastUserQuestion,
        stream: false,
        keep_alive: '30m',
        options: ollamaOptions
      }),
      signal: AbortSignal.timeout(120000)
    })

    if (genRes.ok) {
      const genData = (await genRes.json()) as { response?: string }
      const content = genData.response?.trim()
      if (content) {
        return {
          ok: true,
          modelUsed: targetModel,
          reply: content
        }
      }
    } else {
      const errText = await genRes.text()
      return {
        ok: false,
        modelUsed: targetModel,
        reply: `El modelo local "${targetModel}" devolvió un error (${genRes.status}): ${errText.slice(0, 140)}`
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Tiempo de espera agotado'
    return {
      ok: false,
      modelUsed: targetModel,
      reply: `El modelo "${targetModel}" tardó demasiado en cargar en memoria (${msg}). Vuelve a enviar tu mensaje ahora que Ollama ya inició la carga del modelo en RAM.`
    }
  }

  return {
    ok: false,
    modelUsed: targetModel,
    reply: `No se recibió respuesta del modelo "${targetModel}".`
  }
})
