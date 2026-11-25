import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const hosts = [config.ollamaHost || 'http://127.0.0.1:11434', 'http://localhost:11434']

  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3500)
      })
      if (res.ok) {
        const data = (await res.json()) as {
          models?: Array<{ name: string; size?: number }>
        }
        const models = (data.models || []).map((m) => m.name)
        return {
          ok: true,
          host,
          models
        }
      }
    } catch {
      // Intentar siguiente host local
    }
  }

  return {
    ok: false,
    host: hosts[0],
    models: [] as string[],
    error: 'Ollama local no responde en el puerto 11434.'
  }
})
