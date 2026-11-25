<script setup lang="ts">
import { ref } from 'vue'
import { useWorkshopState } from '~/composables/useWorkshopState'
import type { NavSection } from '~/types/workshop'

const { state, workshopZones, setSection, selectWorkshopZone } = useWorkshopState()
const isCollapsed = ref(false)

const items: { id: NavSection; icon: string; label: string }[] = [
  { id: 'taller', icon: '🕶️', label: 'Visor 3D del Taller' },
  { id: 'vehiculos', icon: '🚛', label: 'Camiones y Módulos' },
  { id: 'ordenes', icon: '📋', label: 'Órdenes de Trabajo' },
  { id: 'inventario', icon: '⚙️', label: 'Piezas .GLB y Stock' }
]
</script>

<template>
  <nav
    class="sidenav"
    :class="{ collapsed: isCollapsed }"
    aria-label="Menú principal del complejo"
  >
    <div class="sidenav-top-row">
      <span v-if="!isCollapsed" class="sidenav-group-title">MENÚ PRINCIPAL</span>
      <button
        type="button"
        class="collapse-menu-btn"
        :title="isCollapsed ? 'Expandir menú' : 'Contraer menú'"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? '❯' : '❮' }}
      </button>
    </div>

    <div class="nav-list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="nav-btn"
        :class="{ active: state.activeSection === item.id }"
        :title="item.label"
        @click="setSection(item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
      </button>
    </div>

    <template v-if="!isCollapsed">
      <div class="sidenav-divider" />
      <div class="sidenav-group-title">IR A TALLERES 3D</div>

      <div class="zones-list">
        <button
          v-for="zone in workshopZones"
          :key="zone.id"
          type="button"
          class="zone-nav-btn"
          :class="{ active: state.activeWorkshopId === zone.id }"
          :style="{ '--z-color': zone.accentColor }"
          @click="selectWorkshopZone(zone.id)"
        >
          <span class="zone-nav-kicker">{{ zone.code }}</span>
          <strong>{{ zone.shortName }}</strong>
          <small>{{ zone.featuredModels.join(' • ') }}</small>
        </button>
      </div>
    </template>
  </nav>
</template>
