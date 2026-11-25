<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkshopState } from '~/composables/useWorkshopState'

const {
  state,
  activeWorkOrder,
  setSection,
  focusSceneObject,
  selectWorkOrder,
  toggleWorkOrderStep
} = useWorkshopState()

const inventoryFilter = ref('Todos')
const inventoryCategories = [
  'Todos',
  'Carrocería',
  'Cabina y Aire',
  'Motor',
  'Neumáticos',
  'Lubricantes'
]

const filteredInventory = computed(() => {
  if (inventoryFilter.value === 'Todos') return state.inventory
  return state.inventory.filter((item) => item.category === inventoryFilter.value)
})

function getProgress(orderId: string) {
  const order = state.workOrders.find((w) => w.id === orderId)
  if (!order || order.steps.length === 0) return 0
  const done = order.steps.filter((s) => s.completed).length
  return Math.round((done / order.steps.length) * 100)
}
</script>

<template>
  <Transition name="drawer-slide-left">
    <section v-if="state.activeSection !== 'taller'" class="section-drawer">
      <div class="drawer-header">
        <h2 v-if="state.activeSection === 'vehiculos'">🚛 Unidades y Subensambles</h2>
        <h2 v-else-if="state.activeSection === 'ordenes'">📋 Órdenes de Trabajo</h2>
        <h2 v-else>⚙️ Piezas .GLB e Inventario</h2>

        <button type="button" class="close-btn" @click="setSection('taller')">
          ✕ Volver al 3D
        </button>
      </div>

      <div v-if="state.activeSection === 'vehiculos'" class="card-stack">
        <article v-for="veh in state.vehicles" :key="veh.id" class="info-card">
          <div class="card-top">
            <strong>{{ veh.name }}</strong>
            <span class="pill">{{ veh.status }}</span>
          </div>
          <p class="muted">
            {{ veh.type }} • Placa {{ veh.plate }} • {{ veh.mileageKm.toLocaleString() }} km
          </p>
          <p class="small-note">{{ veh.notes }}</p>
          <button
            type="button"
            class="action-btn primary"
            @click="focusSceneObject(veh.sceneObjectId, veh.cameraPreset)"
          >
            🎯 Ir al taller en 3D
          </button>
        </article>
      </div>

      <div v-else-if="state.activeSection === 'ordenes'" class="orders-layout">
        <div class="order-tabs">
          <button
            v-for="wo in state.workOrders"
            :key="wo.id"
            type="button"
            class="order-tab"
            :class="{ active: wo.id === state.activeWorkOrderId }"
            @click="selectWorkOrder(wo.id)"
          >
            <span>{{ wo.code }}</span>
            <small>{{ wo.status }} ({{ getProgress(wo.id) }}%)</small>
          </button>
        </div>

        <div v-if="activeWorkOrder" class="active-order-box">
          <h3>{{ activeWorkOrder.title }}</h3>
          <p class="muted">
            {{ activeWorkOrder.vehicleName }} • {{ activeWorkOrder.bay }} • Especialista:
            {{ activeWorkOrder.technician }}
          </p>

          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${getProgress(activeWorkOrder.id)}%` }" />
          </div>

          <ul class="steps-list">
            <li
              v-for="step in activeWorkOrder.steps"
              :key="step.id"
              class="step-item"
              :class="{ done: step.completed }"
            >
              <label class="step-label">
                <input
                  type="checkbox"
                  :checked="step.completed"
                  @change="toggleWorkOrderStep(activeWorkOrder.id, step.id)"
                />
                <div>
                  <strong>{{ step.title }}</strong>
                  <p>{{ step.description }}</p>
                </div>
              </label>
              <button
                type="button"
                class="mini-focus-btn"
                @click="focusSceneObject(step.highlightTargetId, step.recommendedCamera)"
              >
                Ver en 3D
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="inventory-layout">
        <div class="filter-row">
          <button
            v-for="cat in inventoryCategories"
            :key="cat"
            type="button"
            class="filter-chip"
            :class="{ active: inventoryFilter === cat }"
            @click="inventoryFilter = cat"
          >
            {{ cat }}
          </button>
        </div>

        <div class="card-stack">
          <article v-for="item in filteredInventory" :key="item.id" class="info-card">
            <div class="card-top">
              <strong>{{ item.name }}</strong>
              <span class="pill" :class="{ warn: item.stock <= item.minStock }">
                Stock: {{ item.stock }}
              </span>
            </div>
            <p class="muted">SKU: {{ item.sku }} • {{ item.location }}</p>
            <button
              type="button"
              class="action-btn primary"
              @click="focusSceneObject(item.sceneObjectId)"
            >
              🔍 Inspeccionar pieza en 3D
            </button>
          </article>
        </div>
      </div>
    </section>
  </Transition>
</template>
