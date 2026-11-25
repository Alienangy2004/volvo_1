<script setup lang="ts">
import { useWorkshopState } from '~/composables/useWorkshopState'

const { state, metrics } = useWorkshopState()
</script>

<template>
  <header class="topbar">
    <div class="brand-block">
      <img
        src="/images/hapticbus-volvo-logo.jpg"
        alt="Volvo HapticBus Trainer Logo"
        class="brand-logo-img"
      />
      <span class="brand-wordmark">VOLVO</span>
      <div>
        <h1 class="brand-title">HapticBus Trainer • Sistema IA de Servicio Pesado</h1>
        <p class="brand-subtitle">
          Capacita • Practica • Soluciona — Complejo Industrial 3D de 4 Talleres
        </p>
      </div>
    </div>

    <div class="kpi-strip">
      <div class="kpi-pill">
        <span class="kpi-label">TALLERES ACTIVOS</span>
        <strong>{{ metrics.totalWorkshops }} SECTORES</strong>
      </div>
      <div class="kpi-pill">
        <span class="kpi-label">ESPECIALISTAS</span>
        <strong>{{ metrics.totalTechnicians }} EN PLANTA</strong>
      </div>
      <div class="kpi-pill">
        <span class="kpi-label">ÓRDENES ACTIVAS</span>
        <strong>{{ metrics.activeOrders }} OT</strong>
      </div>
      <div class="kpi-pill accent">
        <span class="kpi-label">MODELOS .GLB</span>
        <strong>{{ metrics.loadedGlbCount }} ACTIVOS</strong>
      </div>
    </div>

    <div class="tech-status">
      <span class="conn-badge" :class="state.sceneStatus === 'error' ? 'offline' : 'online'">
        <span class="dot" />
        {{ state.sceneStatus === 'error' ? 'WEBGL OFFLINE' : 'VOLVO IA • EN LÍNEA' }}
      </span>
      <div class="profile-chip">
        <span class="avatar">CM</span>
        <div class="profile-text">
          <strong>Carlos Méndez</strong>
          <small>Ingeniero Jefe Volvo</small>
        </div>
      </div>
    </div>
  </header>
</template>
