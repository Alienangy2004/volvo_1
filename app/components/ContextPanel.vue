<script setup lang="ts">
import { useWorkshopState } from '~/composables/useWorkshopState'

const {
  state,
  selectedElement,
  selectObject,
  moveCameraTo,
  toggleLift,
  selectWorkOrder,
  setSection
} = useWorkshopState()

function openRelatedOrder(orderId: string) {
  selectWorkOrder(orderId)
  setSection('ordenes')
}
</script>

<template>
  <Transition name="panel-slide-right">
    <aside v-if="selectedElement" class="context-panel">
      <div class="context-header">
        <span class="cat-badge">{{ selectedElement.category }}</span>
        <button
          type="button"
          class="close-btn"
          aria-label="Cerrar panel"
          @click="selectObject(null)"
        >
          ✕
        </button>
      </div>

      <h2 class="context-title">{{ selectedElement.name }}</h2>
      <p class="context-role">{{ selectedElement.role }}</p>

      <div v-if="selectedElement.glbFileName" class="glb-asset-badge">
        <span>Archivo 3D:</span>
        <code>{{ selectedElement.glbFileName }}</code>
        <strong
          :class="
            state.loadedGlbFiles.includes(selectedElement.glbFileName) ? 'glb-live' : 'glb-sim'
          "
        >
          {{
            state.loadedGlbFiles.includes(selectedElement.glbFileName)
              ? 'GLB Activo'
              : '3D Procedural'
          }}
        </strong>
      </div>

      <div class="status-row" :class="selectedElement.statusTone">
        <strong>Estado:</strong> {{ selectedElement.status }}
      </div>

      <p class="location-line"><strong>Ubicación:</strong> {{ selectedElement.location }}</p>

      <ul class="detail-list">
        <li v-for="(item, idx) in selectedElement.details" :key="idx">{{ item }}</li>
      </ul>

      <div class="context-actions">
        <button
          v-if="selectedElement.cameraPreset"
          type="button"
          class="action-btn primary"
          @click="moveCameraTo(selectedElement.cameraPreset)"
        >
          🎯 Enfocar en 3D
        </button>

        <button
          v-if="selectedElement.supportsLiftToggle"
          type="button"
          class="action-btn"
          @click="toggleLift()"
        >
          {{ state.liftRaised ? '⬇️ Bajar Elevador Hidráulico' : '⬆️ Subir Elevador Hidráulico' }}
        </button>

        <button
          v-if="selectedElement.relatedWorkOrderId"
          type="button"
          class="action-btn"
          @click="openRelatedOrder(selectedElement.relatedWorkOrderId)"
        >
          📋 Ver Orden de Trabajo
        </button>
      </div>
    </aside>
  </Transition>
</template>
