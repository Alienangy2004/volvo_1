<script setup lang="ts">
import { onMounted, ref } from 'vue'
import TopBar from '~/components/TopBar.vue'
import SideNav from '~/components/SideNav.vue'
import WorkshopViewport from '~/components/WorkshopViewport.vue'
import ContextPanel from '~/components/ContextPanel.vue'
import SectionOverlay from '~/components/SectionOverlay.vue'
import VoiceAiAssistant from '~/components/VoiceAiAssistant.vue'

const showWelcomeSplash = ref(true)
const isLaunching = ref(false)
const splashStatus = ref('Sistema Corporativo Volvo Group • HapticBus Trainer 3D')
let welcomeSpoken = false

async function playWelcomeVoiceAndEnter() {
  if (isLaunching.value) return
  isLaunching.value = true
  splashStatus.value = 'Iniciando asistente de voz: "Bienvenido al sistema de IA de Volvo"...'

  const welcomePhrase = 'Bienvenido al sistema de IA de Volvo'

  if (!welcomeSpoken) {
    welcomeSpoken = true
    let playedWithDeepgram = false

    try {
      const res = await fetch('/api/deepgram/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomePhrase })
      })

      if (res.ok) {
        const blob = await res.blob()
        if (blob.size > 100) {
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          await new Promise<void>((resolve) => {
            audio.onended = () => {
              URL.revokeObjectURL(url)
              resolve()
            }
            audio.onerror = () => {
              URL.revokeObjectURL(url)
              resolve()
            }
            audio.play().catch(() => {
              URL.revokeObjectURL(url)
              resolve()
            })
          })
          playedWithDeepgram = true
        }
      }
    } catch {
      // Si falla red, usar síntesis del navegador
    }

    if (!playedWithDeepgram && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      await new Promise<void>((resolve) => {
        const utter = new SpeechSynthesisUtterance(welcomePhrase)
        utter.lang = 'es-MX'
        utter.rate = 1.02
        utter.onend = () => resolve()
        utter.onerror = () => resolve()
        window.speechSynthesis.speak(utter)
        setTimeout(resolve, 3400)
      })
    }
  }

  showWelcomeSplash.value = false
}

onMounted(() => {
  // Intentar saludo automático al cargar; si el navegador exige un clic para audio, el botón en pantalla lo lanza de inmediato
  setTimeout(async () => {
    try {
      const res = await fetch('/api/deepgram/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Bienvenido al sistema de IA de Volvo' })
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        await audio.play()
        welcomeSpoken = true
        isLaunching.value = true
        splashStatus.value = '🔊 "Bienvenido al sistema de IA de Volvo"'
        audio.onended = () => {
          URL.revokeObjectURL(url)
          showWelcomeSplash.value = false
        }
      }
    } catch {
      // El navegador espera interacción del usuario para reproducir audio con sonido
    }
  }, 350)
})
</script>

<template>
  <div class="app-shell">
    <!-- PANTALLA DE BIENVENIDA CORPORATIVA VOLVO × HAPTICBUS TRAINER -->
    <Transition name="splash-fade">
      <div
        v-if="showWelcomeSplash"
        class="volvo-splash-screen"
        @click="playWelcomeVoiceAndEnter"
      >
        <div class="splash-card" @click.stop="playWelcomeVoiceAndEnter">
          <div class="splash-top-pill">VOLVO GROUP • PLATAFORMA DE ENTRENAMIENTO E IA</div>

          <div class="splash-logo-frame">
            <img
              src="/images/hapticbus-volvo-logo.jpg"
              alt="HapticBus Trainer Volvo Logo"
              class="splash-hero-logo"
            />
          </div>

          <h1 class="splash-welcome-title">Bienvenido al Sistema de IA de Volvo</h1>
          <p class="splash-welcome-sub">
            {{ splashStatus }}
          </p>

          <div class="splash-progress-track">
            <div class="splash-progress-bar" :class="{ active: isLaunching }" />
          </div>

          <button
            type="button"
            class="splash-enter-btn"
            @click.stop="playWelcomeVoiceAndEnter"
          >
            {{
              isLaunching
                ? '🔊 Reproduciendo bienvenida... Ingresando al taller'
                : '🔊 Iniciar Sistema de IA de Volvo'
            }}
          </button>
        </div>
      </div>
    </Transition>

    <TopBar />

    <main class="workspace">
      <SideNav />

      <div class="stage-area">
        <ClientOnly>
          <WorkshopViewport />
          <template #fallback>
            <div class="ssr-fallback">
              Preparando visor 3D interactivo del complejo Volvo HapticBus...
            </div>
          </template>
        </ClientOnly>

        <SectionOverlay />
        <ContextPanel />
        <ClientOnly>
          <VoiceAiAssistant />
        </ClientOnly>
      </div>
    </main>
  </div>
</template>
