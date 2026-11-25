export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    deepgramApiKey: 'cab89e65549f0637541e13bc24750128daabbffc',
    ollamaHost: 'http://127.0.0.1:11434',
    public: {
      deepgramApiKey: 'cab89e65549f0637541e13bc24750128daabbffc',
      ollamaHost: 'http://localhost:11434'
    }
  },
  app: {
    head: {
      title: 'Complejo Industrial Volvo XR 3D | IA Deepgram + Ollama',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Simulador interactivo 3D AR/VR de 4 talleres mecánicos Volvo con asistente de voz Deepgram y Ollama local.'
        }
      ]
    }
  },
  typescript: {
    strict: true
  }
})
