<script setup lang="ts">
import TopBar from '~/components/TopBar.vue'
import SideNav from '~/components/SideNav.vue'
import WorkshopViewport from '~/components/WorkshopViewport.vue'
import ContextPanel from '~/components/ContextPanel.vue'
import SectionOverlay from '~/components/SectionOverlay.vue'
import VoiceAiAssistant from '~/components/VoiceAiAssistant.vue'
</script>

<template>
  <div class="app-shell">
    <TopBar />

    <main class="workspace">
      <SideNav />

      <div class="stage-area">
        <ClientOnly>
          <WorkshopViewport />
          <template #fallback>
            <div class="ssr-fallback">
              Preparando visor 3D interactivo del complejo Volvo XR...
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
