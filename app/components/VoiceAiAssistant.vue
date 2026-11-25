<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorkshopState } from '~/composables/useWorkshopState'

const {
  state,
  selectedElement,
  currentWorkshopZone,
  executeNaturalLanguageCommand
} = useWorkshopState()

const isOpen = ref(true)
const isExpanded = ref(false)
const inputPrompt = ref('')
const isRecording = ref(false)
const isTranscribing = ref(false)
const isThinking = ref(false)
const isSpeaking = ref(false)
const voiceEnabled = ref(true)
const ollamaOnline = ref(false)
const ollamaModels = ref<string[]>([])
const selectedOllamaModel = ref('')
const statusHint = ref('Listo para conversar por voz o texto')
const messagesBoxRef = ref<HTMLElement | null>(null)

let mediaRecorder: MediaRecorder | null = null
let recordedChunks: BlobPart[] = []
let currentAudio: HTMLAudioElement | null = null

const quickPrompts = [
  { icon: '📋', text: '¿Qué órdenes pendientes se tienen hoy?' },
  { icon: '🔍', text: 'Pon a los ingenieros a inspeccionar el chasis' },
  { icon: '🔧', text: 'Pon a los operarios a reparar la carrocería' },
  { icon: '⬆️', text: 'Sube el elevador de la Bahía 1' }
]

async function scrollToBottom() {
  await nextTick()
  if (messagesBoxRef.value) {
    messagesBoxRef.value.scrollTo({
      top: messagesBoxRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

function prewarmSelectedModel(modelName: string) {
  if (!modelName) return
  $fetch('/api/ollama/chat', {
    method: 'POST',
    body: { model: modelName, warmup: true }
  }).catch(() => {})
}

async function fetchOllamaModels() {
  try {
    const res = await $fetch<{ ok: boolean; models: string[] }>('/api/ollama/models')
    if (res.ok && res.models.length > 0) {
      ollamaOnline.value = true
      ollamaModels.value = res.models
      if (!selectedOllamaModel.value) {
        selectedOllamaModel.value = res.models[0]!
      }
      prewarmSelectedModel(selectedOllamaModel.value)
      return
    }
  } catch {
    // Intentar directo desde navegador a localhost:11434
  }

  try {
    const directRes = await fetch('http://localhost:11434/api/tags')
    if (directRes.ok) {
      const data = (await directRes.json()) as { models?: Array<{ name: string }> }
      const list = (data.models || []).map((m) => m.name)
      ollamaOnline.value = true
      ollamaModels.value = list
      if (!selectedOllamaModel.value && list.length > 0) {
        selectedOllamaModel.value = list[0]!
      }
      prewarmSelectedModel(selectedOllamaModel.value)
      return
    }
  } catch {
    ollamaOnline.value = false
  }
}

async function speakTextWithDeepgram(text: string, force = false) {
  if ((!voiceEnabled.value && !force) || !text.trim()) return
  stopAudioPlayback()
  isSpeaking.value = true

  try {
    const res = await fetch('/api/deepgram/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      currentAudio = new Audio(url)
      currentAudio.onended = () => {
        isSpeaking.value = false
        URL.revokeObjectURL(url)
      }
      currentAudio.onerror = () => {
        isSpeaking.value = false
        URL.revokeObjectURL(url)
      }
      await currentAudio.play()
      return
    }
  } catch {
    // Respaldo con síntesis de voz del navegador
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'es-MX'
    utter.rate = 1.03
    utter.onend = () => {
      isSpeaking.value = false
    }
    utter.onerror = () => {
      isSpeaking.value = false
    }
    window.speechSynthesis.speak(utter)
  } else {
    isSpeaking.value = false
  }
}

function stopAudioPlayback() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
}

function clearConversation() {
  stopAudioPlayback()
  state.aiMessages.splice(1)
}

function buildLiveWorkshopContext(): string {
  const activeZone = currentWorkshopZone.value?.name || 'Taller 01'
  const selected = selectedElement.value
    ? `${selectedElement.value.name} (${selectedElement.value.status})`
    : 'Ninguno'
  const liftState = state.liftRaised ? 'Elevado (1.35m)' : 'En piso (0m)'
  const ordersSummary = state.workOrders
    .map(
      (w) =>
        `${w.code} [${w.status} - Prioridad ${w.priority}]: ${w.title} en ${w.bay} (${w.vehicleName}, Téc: ${w.technician})`
    )
    .join('; ')

  return `Taller actual: ${activeZone}. Seleccionado: ${selected}. Elevador Bahía 1: ${liftState}. Órdenes de trabajo hoy: ${ordersSummary}.`
}

async function sendPromptToOllama(userText: string) {
  const clean = userText.trim()
  if (!clean || isThinking.value) return

  const executedAction = executeNaturalLanguageCommand(clean)

  state.aiMessages.push({
    id: `u-${Date.now()}`,
    role: 'user',
    text: clean,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionExecuted: executedAction
  })
  inputPrompt.value = ''
  await scrollToBottom()

  isThinking.value = true
  statusHint.value = `Generando respuesta con ${selectedOllamaModel.value || 'Ollama local'}...`

  const history = state.aiMessages
    .filter((m) => m.id !== 'welcome-1' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-4)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text
    }))

  const workshopContext = buildLiveWorkshopContext()
  let replyText = ''
  let modelUsed = selectedOllamaModel.value

  try {
    const res = await $fetch<{ ok: boolean; reply: string; modelUsed: string }>(
      '/api/ollama/chat',
      {
        method: 'POST',
        body: {
          model: selectedOllamaModel.value,
          messages: history,
          workshopContext
        }
      }
    )
    replyText = res.reply
    modelUsed = res.modelUsed
    if (res.ok) {
      ollamaOnline.value = true
      if (res.modelUsed && !ollamaModels.value.includes(res.modelUsed)) {
        ollamaModels.value.push(res.modelUsed)
      }
      if (!selectedOllamaModel.value && res.modelUsed) {
        selectedOllamaModel.value = res.modelUsed
      }
    }
  } catch {
    try {
      const targetModel = selectedOllamaModel.value || ollamaModels.value[0] || 'llama3.2'
      const directRes = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          system: `Eres el Ingeniero Jefe IA del Taller Volvo 3D. Responde breve en español con estos datos: ${workshopContext}`,
          prompt: clean,
          stream: false,
          keep_alive: '30m',
          options: { num_ctx: 1024, num_predict: 140 }
        })
      })
      if (directRes.ok) {
        const d = (await directRes.json()) as { response?: string }
        replyText = d.response?.trim() || 'Comando procesado.'
        ollamaOnline.value = true
      }
    } catch {
      replyText =
        'No pude conectar con Ollama en el puerto 11434. Verifica que Ollama esté abierto en tu PC.'
    }
  }

  isThinking.value = false
  statusHint.value = `Conectado a ${modelUsed || 'Ollama'} • Voz Deepgram lista`

  const replyAction = !executedAction ? executeNaturalLanguageCommand(replyText) : undefined

  state.aiMessages.push({
    id: `a-${Date.now()}`,
    role: 'assistant',
    text: replyText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionExecuted: replyAction
  })
  await scrollToBottom()

  await speakTextWithDeepgram(replyText)
}

async function toggleMicrophoneRecording() {
  if (isRecording.value) {
    mediaRecorder?.stop()
    isRecording.value = false
    return
  }

  stopAudioPlayback()
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks = []
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    mediaRecorder = new MediaRecorder(stream, { mimeType })
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const audioBlob = new Blob(recordedChunks, { type: mimeType })
      if (audioBlob.size < 400) return

      isTranscribing.value = true
      statusHint.value = 'Deepgram Nova-2 transcribiendo tu voz...'

      try {
        const res = await fetch('/api/deepgram/stt', {
          method: 'POST',
          headers: { 'Content-Type': mimeType },
          body: audioBlob
        })
        const data = (await res.json()) as {
          ok: boolean
          transcript?: string
          error?: string
        }
        isTranscribing.value = false

        if (data.ok && data.transcript) {
          statusHint.value = `Escuché: "${data.transcript}"`
          await sendPromptToOllama(data.transcript)
        } else {
          statusHint.value = data.error || 'No se escuchó con claridad. Intenta de nuevo.'
        }
      } catch {
        isTranscribing.value = false
        statusHint.value = 'Error al conectar con Deepgram STT.'
      }
    }

    mediaRecorder.start()
    isRecording.value = true
    statusHint.value = 'Escuchando... Pulsa "Enviar Voz" cuando termines de hablar'
  } catch {
    statusHint.value = 'Permiso de micrófono no concedido en el navegador.'
  }
}

onMounted(() => {
  fetchOllamaModels()
})

onBeforeUnmount(() => {
  stopAudioPlayback()
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
  }
})
</script>

<template>
  <div class="ai-chat-container">
    <!-- Botón flotante moderno cuando el chat está minimizado -->
    <Transition name="fade-scale">
      <button
        v-if="!isOpen"
        type="button"
        class="ai-fab-launcher"
        @click="isOpen = true"
      >
        <span class="fab-avatar">✨</span>
        <div class="fab-text">
          <strong>Asistente IA Volvo</strong>
          <small>{{ ollamaOnline ? 'Ollama + Deepgram en línea' : 'Abrir chat inteligente' }}</small>
        </div>
        <span class="fab-online-dot" :class="{ online: ollamaOnline }" />
      </button>
    </Transition>

    <!-- Ventana de Chat estilo IA Moderna (ChatGPT / Gemini / Claude) -->
    <Transition name="chat-window-pop">
      <section
        v-if="isOpen"
        class="ai-modern-window"
        :class="{ expanded: isExpanded }"
        aria-label="Asistente de Inteligencia Artificial"
      >
        <!-- Cabecera del Chat -->
        <header class="ai-header">
          <div class="ai-brand">
            <div class="ai-brand-avatar">
              <span>✨</span>
              <span class="status-ring" :class="{ online: ollamaOnline }" />
            </div>
            <div class="ai-brand-info">
              <h2>Ingeniero IA Volvo</h2>
              <div class="ai-model-row">
                <select
                  v-if="ollamaModels.length > 0"
                  v-model="selectedOllamaModel"
                  class="modern-model-select"
                  aria-label="Seleccionar modelo de Ollama"
                  @change="prewarmSelectedModel(selectedOllamaModel)"
                >
                  <option v-for="m in ollamaModels" :key="m" :value="m">
                    🟢 {{ m }}
                  </option>
                </select>
                <button
                  v-else
                  type="button"
                  class="detect-ollama-pill"
                  @click="fetchOllamaModels"
                >
                  🔄 Conectar Ollama
                </button>
                <span class="deepgram-pill">🎙 Deepgram Voz</span>
              </div>
            </div>
          </div>

          <div class="ai-header-actions">
            <button
              type="button"
              class="icon-ctrl-btn"
              :class="{ active: voiceEnabled }"
              :title="voiceEnabled ? 'Voz activada (clic para silenciar)' : 'Voz silenciada'"
              @click="voiceEnabled = !voiceEnabled"
            >
              {{ voiceEnabled ? '🔊' : '🔇' }}
            </button>
            <button
              type="button"
              class="icon-ctrl-btn"
              title="Limpiar conversación"
              @click="clearConversation"
            >
              🗑
            </button>
            <button
              type="button"
              class="icon-ctrl-btn"
              :title="isExpanded ? 'Tamaño normal' : 'Agrandar ventana de chat'"
              @click="isExpanded = !isExpanded"
            >
              {{ isExpanded ? '🗗' : '⤢' }}
            </button>
            <button
              type="button"
              class="icon-ctrl-btn minimize"
              title="Minimizar chat"
              @click="isOpen = false"
            >
              —
            </button>
          </div>
        </header>

        <!-- Cuerpo de Mensajes con Burbujas Modernas -->
        <div ref="messagesBoxRef" class="ai-chat-feed">
          <article
            v-for="msg in state.aiMessages"
            :key="msg.id"
            class="chat-turn"
            :class="msg.role"
          >
            <div class="turn-avatar">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>

            <div class="turn-content-wrap">
              <div class="turn-sender-line">
                <strong>{{ msg.role === 'user' ? 'Tú' : 'Ingeniero IA Volvo' }}</strong>
                <span class="turn-time">{{ msg.timestamp }}</span>
              </div>

              <div class="turn-bubble">
                <p>{{ msg.text }}</p>

                <div v-if="msg.actionExecuted" class="turn-action-badge">
                  <span>⚡</span>
                  <span>{{ msg.actionExecuted }}</span>
                </div>
              </div>

              <div v-if="msg.role === 'assistant'" class="turn-footer-tools">
                <button
                  type="button"
                  class="replay-voice-btn"
                  @click="speakTextWithDeepgram(msg.text, true)"
                >
                  🔊 Escuchar respuesta
                </button>
              </div>
            </div>
          </article>

          <!-- Indicador animado cuando la IA está pensando o transcribiendo -->
          <div v-if="isTranscribing || isThinking" class="chat-turn assistant thinking-turn">
            <div class="turn-avatar">🤖</div>
            <div class="turn-content-wrap">
              <div class="turn-bubble thinking-bubble">
                <div class="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span class="thinking-text">
                  {{
                    isTranscribing
                      ? 'Transcribiendo tu voz con Deepgram...'
                      : `Pensando con ${selectedOllamaModel || 'Ollama'}...`
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sugerencias Rápidas Amigables -->
        <div class="ai-suggestions-carousel">
          <button
            v-for="(qp, idx) in quickPrompts"
            :key="idx"
            type="button"
            class="suggestion-pill"
            @click="sendPromptToOllama(qp.text)"
          >
            <span class="s-icon">{{ qp.icon }}</span>
            <span>{{ qp.text }}</span>
          </button>
        </div>

        <!-- Barra de Entrada Moderna tipo ChatGPT / Gemini -->
        <footer class="ai-composer-area">
          <form class="composer-box" @submit.prevent="sendPromptToOllama(inputPrompt)">
            <button
              type="button"
              class="voice-record-btn"
              :class="{ recording: isRecording, busy: isTranscribing }"
              :disabled="isTranscribing"
              title="Hablar por micrófono con Deepgram"
              @click="toggleMicrophoneRecording"
            >
              <span class="v-icon">{{ isRecording ? '⏹' : '🎙' }}</span>
              <span>{{ isRecording ? 'Enviar Voz' : 'Voz' }}</span>
            </button>

            <input
              v-model="inputPrompt"
              type="text"
              class="composer-input"
              placeholder="Pregúntame cualquier cosa o pide una acción en el taller..."
              :disabled="isThinking"
            />

            <button
              type="submit"
              class="composer-send-btn"
              :disabled="!inputPrompt.trim() || isThinking"
              title="Enviar mensaje"
            >
              ➤
            </button>
          </form>

          <div class="composer-status-bar">
            <span>{{ statusHint }}</span>
            <button
              v-if="isSpeaking"
              type="button"
              class="stop-speech-pill"
              @click="stopAudioPlayback"
            >
              ⏹ Detener voz
            </button>
          </div>
        </footer>
      </section>
    </Transition>
  </div>
</template>
