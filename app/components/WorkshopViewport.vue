<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWorkshopState } from '~/composables/useWorkshopState'
import { WorkshopEngine } from '~/three/WorkshopEngine'
import type {
  CameraPresetId,
  EnvironmentThemeId,
  PersonnelActionMode
} from '~/types/workshop'

const containerRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const hoverCoords = ref({ x: 0, y: 0 })
const isDraggingGlb = ref(false)
let engine: WorkshopEngine | null = null

const {
  state,
  workshopZones,
  hoveredElement,
  selectObject,
  setHoveredObject,
  moveCameraTo,
  selectWorkshopZone,
  resetCamera,
  toggleAutoTour,
  toggleArHudMode,
  setEnvTheme,
  setPersonnelActionMode,
  registerLoadedGlb,
  enqueueCustomGlbFiles,
  focusSceneObject,
  setSceneStatus
} = useWorkshopState()

const cameraButtons: { id: CameraPresetId; label: string }[] = [
  { id: 'overview', label: 'Complejo Global' },
  { id: 'bay1_repair', label: 'T01 • Bahía FH' },
  { id: 'bay2_diagnostic', label: 'T01 • Bahía FMX' },
  { id: 'inspection_pit', label: 'T01 • Fosa LED' },
  { id: 'workshop_body', label: 'T02 • Carrocería/Puerta' },
  { id: 'workshop_chassis', label: 'T03 • Chasis/Aire' },
  { id: 'workshop_interior', label: 'T04 • Tablero/Asientos' },
  { id: 'warehouse', label: 'Almacén y Motor D16' }
]

const truckPartShortcuts: {
  id: string
  label: string
  glb: string
  preset: CameraPresetId
}[] = [
  { id: 'part-carroceria', label: 'Carrocería', glb: 'carroceria.glb', preset: 'workshop_body' },
  { id: 'part-puerta', label: 'Puerta', glb: 'puerta.glb', preset: 'workshop_body' },
  { id: 'part-chasis', label: 'Chasis 7.5m', glb: 'chasis.glb', preset: 'workshop_chassis' },
  { id: 'part-aire', label: 'Aire', glb: 'aire.glb', preset: 'workshop_chassis' },
  { id: 'part-tablero', label: 'Tablero', glb: 'tablero.glb', preset: 'workshop_interior' },
  { id: 'part-asientos', label: 'Asientos', glb: 'asientos.glb', preset: 'workshop_interior' },
  { id: 'rack-tires', label: 'Rueda', glb: 'rueda.glb', preset: 'warehouse' }
]

const envThemes: { id: EnvironmentThemeId; label: string }[] = [
  { id: 'cyber_ar', label: 'Volvo Nocturno' },
  { id: 'sunset_industrial', label: 'Atardecer' },
  { id: 'vr_matrix', label: 'Matriz XR' }
]

const personnelModes: { id: PersonnelActionMode; label: string }[] = [
  { id: 'auto', label: 'Ambos (Ing. + Operario)' },
  { id: 'inspect', label: 'Ingeniero Inspeccionando' },
  { id: 'repair', label: 'Operario Reparando' }
]

function triggerFilePicker() {
  fileInputRef.value?.click()
}

function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    enqueueCustomGlbFiles(input.files)
    input.value = ''
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDraggingGlb.value = true
}

function onDragLeave() {
  isDraggingGlb.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDraggingGlb.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    enqueueCustomGlbFiles(e.dataTransfer.files)
  }
}

onMounted(() => {
  if (!containerRef.value) return
  try {
    engine = new WorkshopEngine(containerRef.value, {
      onSelect: (id) => selectObject(id),
      onHover: (id, pos) => {
        setHoveredObject(id)
        if (pos) hoverCoords.value = pos
      },
      onStatusChange: (status, message) => setSceneStatus(status, message),
      onModelLoaded: (fileName) => registerLoadedGlb(fileName)
    })
    engine.highlightObject(state.selectedObjectId)
  } catch (err) {
    console.error('Error inicializando WebGL:', err)
    setSceneStatus(
      'error',
      'No se pudo inicializar WebGL en este navegador. Verifica la aceleración por hardware.'
    )
  }
})

watch(
  () => state.cameraCommand.nonce,
  () => {
    engine?.setCameraPreset(state.cameraCommand.preset)
  }
)

watch(
  () => state.autoTour,
  (enabled) => {
    engine?.setAutoTour(enabled)
  }
)

watch(
  () => state.liftRaised,
  (raised) => {
    engine?.setLiftRaised(raised)
  }
)

watch(
  () => state.arHudMode,
  (visible) => {
    engine?.setArOverlayVisible(visible)
  }
)

watch(
  () => state.envTheme,
  (theme) => {
    engine?.setEnvironmentTheme(theme)
  }
)

watch(
  () => state.personnelActionMode,
  (mode) => {
    engine?.setPersonnelActionMode(mode)
  }
)

watch(
  () => state.highlightTargetId,
  (targetId) => {
    if (targetId) engine?.highlightObject(targetId)
  }
)

watch(
  () => state.customGlbQueue.length,
  async () => {
    if (!engine) return
    while (state.customGlbQueue.length > 0) {
      const item = state.customGlbQueue.shift()!
      const targetPreset = await engine.loadCustomGlbFile(item.fileName, item.objectUrl)
      if (targetPreset) {
        moveCameraTo(targetPreset)
      }
    }
  }
)

onBeforeUnmount(() => {
  engine?.dispose()
  engine = null
})
</script>

<template>
  <div
    class="viewport-wrapper"
    :class="{ 'ar-visor-active': state.arHudMode, 'dragging-glb': isDraggingGlb }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div ref="containerRef" class="three-canvas-host" />

    <!-- Marco Holográfico AR / VR -->
    <div v-if="state.arHudMode" class="xr-visor-overlay" aria-hidden="true">
      <span class="xr-corner tl" />
      <span class="xr-corner tr" />
      <span class="xr-corner bl" />
      <span class="xr-corner br" />
      <div class="xr-scanline" />
    </div>

    <!-- Barra Superior Flotante: Selector de los 4 Talleres + Piezas GLB + Personal + Fondos -->
    <div class="hud-top-cluster">
      <div class="workshop-zones-bar" role="navigation" aria-label="Selector de talleres 3D">
        <button
          v-for="zone in workshopZones"
          :key="zone.id"
          type="button"
          class="zone-card-btn"
          :class="{ active: state.activeWorkshopId === zone.id }"
          :style="{ '--zone-accent': zone.accentColor }"
          @click="selectWorkshopZone(zone.id)"
        >
          <div class="zone-card-head">
            <span class="zone-code">{{ zone.code }}</span>
            <span class="zone-tech-count">{{ zone.activeTechnicians }} ESP.</span>
          </div>
          <strong class="zone-title">{{ zone.shortName }}</strong>
        </button>
      </div>

      <div class="parts-hud-strip">
        <span class="parts-hud-label">PIEZAS GLB:</span>
        <button
          v-for="part in truckPartShortcuts"
          :key="part.id"
          type="button"
          class="part-chip"
          :class="{
            active: state.selectedObjectId === part.id,
            loaded: state.loadedGlbFiles.includes(part.glb)
          }"
          @click="focusSceneObject(part.id, part.preset)"
        >
          <span class="part-dot" />
          {{ part.label }}
        </button>

        <span class="hud-sep">|</span>
        <span class="parts-hud-label">PERSONAL:</span>
        <button
          v-for="pm in personnelModes"
          :key="pm.id"
          type="button"
          class="part-chip action-mode-chip"
          :class="{ active: state.personnelActionMode === pm.id }"
          @click="setPersonnelActionMode(pm.id)"
        >
          {{ pm.label }}
        </button>

        <span class="hud-sep">|</span>
        <span class="parts-hud-label">FONDO:</span>
        <button
          v-for="t in envThemes"
          :key="t.id"
          type="button"
          class="part-chip"
          :class="{ active: state.envTheme === t.id }"
          @click="setEnvTheme(t.id)"
        >
          {{ t.label }}
        </button>

        <button
          type="button"
          class="part-chip"
          :class="{ active: state.arHudMode }"
          @click="toggleArHudMode"
        >
          {{ state.arHudMode ? 'Visor XR: ON' : 'Visor XR: OFF' }}
        </button>

        <button
          type="button"
          class="part-chip upload-glb-btn"
          title="Selecciona o arrastra tus archivos .glb"
          @click="triggerFilePicker"
        >
          + .GLB
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".glb"
          multiple
          hidden
          @change="onFileInputChange"
        />
      </div>
    </div>

    <!-- Overlay al arrastrar archivos .GLB sobre la escena -->
    <div v-if="isDraggingGlb" class="glb-drop-overlay">
      <div class="glb-drop-box">
        <strong>SOLTAR ARCHIVOS .GLB AQUÍ</strong>
        <p>
          Soporta: carroceria.glb, puerta.glb, chasis.glb, aire.glb, tablero.glb, asientos.glb,
          rueda.glb, volvo-fh-tractor.glb, volvo-fmx-rigid.glb
        </p>
      </div>
    </div>

    <div v-if="state.sceneStatus === 'loading'" class="scene-banner">
      <div class="loader-hud">
        <span class="hud-spinner" />
        <strong>INICIALIZANDO COMPLEJO 3D VOLVO HAPTICBUS...</strong>
      </div>
    </div>
    <div v-else-if="state.sceneStatus === 'error'" class="scene-error-card">
      <h3>Error de renderizado 3D</h3>
      <p>{{ state.sceneMessage }}</p>
    </div>

    <!-- Tooltip al apuntar objetos 3D -->
    <div
      v-if="hoveredElement"
      class="hover-tooltip"
      :style="{ left: `${hoverCoords.x + 18}px`, top: `${hoverCoords.y - 16}px` }"
    >
      <div class="tooltip-tag">VOLVO // {{ hoveredElement.category.toUpperCase() }}</div>
      <strong>{{ hoveredElement.name }}</strong>
      <span>{{ hoveredElement.status }}</span>
      <small v-if="hoveredElement.glbFileName" class="tooltip-glb">
        MODELO: {{ hoveredElement.glbFileName }}
      </small>
    </div>

    <!-- Barra Inferior de Cámaras y Recorrido 360° -->
    <div class="camera-toolbar" role="toolbar" aria-label="Vistas de cámara 3D">
      <button
        v-for="btn in cameraButtons"
        :key="btn.id"
        type="button"
        class="cam-btn"
        :class="{ active: !state.autoTour && state.cameraCommand.preset === btn.id }"
        @click="moveCameraTo(btn.id)"
      >
        {{ btn.label }}
      </button>
      <button
        type="button"
        class="cam-btn"
        :class="{ active: state.autoTour }"
        @click="toggleAutoTour"
      >
        {{ state.autoTour ? 'Detener 360°' : 'Órbita 360°' }}
      </button>
      <button type="button" class="cam-btn cam-reset" @click="resetCamera">
        Restablecer
      </button>
    </div>

    <div class="controls-hint">
      Haz clic en cualquiera de los 36 círculos azules del piso (o doble clic en el suelo) para
      desplazarte • Usa W A S D o las flechas para caminar
    </div>
  </div>
</template>
