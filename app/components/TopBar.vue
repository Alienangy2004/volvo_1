<script setup lang="ts">
import { useWorkshopState } from '~/composables/useWorkshopState'

const { state, metrics } = useWorkshopState()
</script>

<template>
  <header class="topbar">
    <div class="brand-block">
      <span class="brand-wordmark">VOLVO XR</span>
      <div>
        <h1 class="brand-title">Complejo Industrial de Servicio Pesado • Simulador AR / VR</h1>
        <p class="brand-subtitle">
          4 Talleres Especializados • Telemetría J1939 • Escaneo Láser Holográfico 3D
        </p>
      </div>
    </div>

    <div class="kpi-strip">
      <div class="kpi-pill">
        <span class="kpi-label">TALLERES ACTIVOS</span>
        <strong>{{ metrics.totalWorkshops }} SECTORES</strong>
      </div>
      <div class="kpi-pill">
        <span class="kpi-label">TÉCNICOS EN PLANTA</span>
        <strong>{{ metrics.totalTechnicians }} ESPECIALISTAS</strong>
      </div>
      <div class="kpi-pill">
        <span class="kpi-label">ÓRDENES ACTIVAS</span>
        <strong>{{ metrics.activeOrders }} OT</strong>
      </div>
      <div class="kpi-pill accent">
        <span class="kpi-label">ASSETS .GLB</span>
        <strong>{{ metrics.loadedGlbCount }} CARGADOS</strong>
      </div>
    </div>

    <div class="tech-status">
      <span class="conn-badge" :class="state.sceneStatus === 'error' ? 'offline' : 'online'">
        <span class="dot" />
        {{ state.sceneStatus === 'error' ? 'WEBGL OFFLINE' : 'XR SIM • 60 FPS' }}
      </span>
      <div class="profile-chip">
        <span class="avatar">CM</span>
        <div class="profile-text">
          <strong>Carlos Méndez</strong>
          <small>Director de Planta XR</small>
        </div>
      </div>
    </div>
  </header>
</template>
