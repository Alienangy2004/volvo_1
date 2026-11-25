import { computed, reactive } from 'vue'
import {
  INITIAL_INVENTORY,
  INITIAL_VEHICLES,
  INITIAL_WORK_ORDERS,
  SCENE_ELEMENTS_CATALOG,
  WORKSHOP_ZONES
} from '~/data/workshopData'
import type {
  AiChatMessage,
  CameraPresetId,
  EnvironmentThemeId,
  InteractiveElementInfo,
  NavSection,
  PersonnelActionMode,
  WorkOrder
} from '~/types/workshop'

export interface CustomGlbUpload {
  fileName: string
  objectUrl: string
  nonce: number
}

const state = reactive({
  activeSection: 'taller' as NavSection,
  activeWorkshopId: 'taller-1' as string,
  selectedObjectId: 'truck-fh-bay1' as string | null,
  hoveredObjectId: null as string | null,
  activeWorkOrderId: 'wo-engine' as string,
  liftRaised: false,
  autoTour: false,
  arHudMode: true,
  envTheme: 'cyber_ar' as EnvironmentThemeId,
  personnelActionMode: 'auto' as PersonnelActionMode,
  cameraCommand: {
    preset: 'overview' as CameraPresetId,
    nonce: 0
  },
  highlightTargetId: null as string | null,
  sceneStatus: 'loading' as 'loading' | 'ready' | 'fallback' | 'error',
  sceneMessage: 'Inicializando complejo industrial 3D XR...',
  loadedGlbFiles: [] as string[],
  customGlbQueue: [] as CustomGlbUpload[],
  vehicles: structuredClone(INITIAL_VEHICLES),
  workOrders: structuredClone(INITIAL_WORK_ORDERS),
  inventory: structuredClone(INITIAL_INVENTORY),
  aiMessages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Sistema VOLVO XR-AI en línea (Deepgram STT/TTS + Ollama Local). Puedes hablarme con el micrófono o escribirme para inspeccionar piezas, mover la cámara entre los 4 talleres, activar las animaciones de ingenieros u operarios, o consultar órdenes de trabajo.',
      timestamp: 'AHORA'
    }
  ] as AiChatMessage[]
})

export function useWorkshopState() {
  const selectedElement = computed<InteractiveElementInfo | null>(() => {
    if (!state.selectedObjectId) return null
    return SCENE_ELEMENTS_CATALOG[state.selectedObjectId] ?? null
  })

  const hoveredElement = computed<InteractiveElementInfo | null>(() => {
    if (!state.hoveredObjectId) return null
    return SCENE_ELEMENTS_CATALOG[state.hoveredObjectId] ?? null
  })

  const activeWorkOrder = computed<WorkOrder | undefined>(() =>
    state.workOrders.find((wo) => wo.id === state.activeWorkOrderId)
  )

  const currentWorkshopZone = computed(
    () => WORKSHOP_ZONES.find((z) => z.id === state.activeWorkshopId) ?? WORKSHOP_ZONES[0]
  )

  const metrics = computed(() => {
    const totalWorkshops = WORKSHOP_ZONES.length
    const totalBays = 8
    const activeOrders = state.workOrders.filter((w) => w.status !== 'Completada').length
    const totalTechnicians = WORKSHOP_ZONES.reduce((acc, z) => acc + z.activeTechnicians, 0)
    return {
      totalWorkshops,
      availableBays: 2,
      totalBays,
      activeOrders,
      totalTechnicians,
      vehiclesInService: state.vehicles.length,
      loadedGlbCount: state.loadedGlbFiles.length
    }
  })

  function setSection(section: NavSection) {
    state.activeSection = section
  }

  function selectObject(objectId: string | null) {
    state.selectedObjectId = objectId
  }

  function setHoveredObject(objectId: string | null) {
    state.hoveredObjectId = objectId
  }

  function moveCameraTo(preset: CameraPresetId) {
    state.autoTour = false
    if (preset === 'workshop_body') state.activeWorkshopId = 'taller-2'
    else if (preset === 'workshop_chassis') state.activeWorkshopId = 'taller-3'
    else if (preset === 'workshop_interior') state.activeWorkshopId = 'taller-4'
    else if (
      preset === 'bay1_repair' ||
      preset === 'bay2_diagnostic' ||
      preset === 'inspection_pit' ||
      preset === 'warehouse'
    ) {
      state.activeWorkshopId = 'taller-1'
    }

    state.cameraCommand = {
      preset,
      nonce: state.cameraCommand.nonce + 1
    }
  }

  function selectWorkshopZone(zoneId: string) {
    state.activeWorkshopId = zoneId
    const zone = WORKSHOP_ZONES.find((z) => z.id === zoneId)
    if (zone) {
      moveCameraTo(zone.cameraPreset)
    }
  }

  function resetCamera() {
    state.autoTour = false
    state.highlightTargetId = null
    moveCameraTo('overview')
  }

  function toggleAutoTour() {
    state.autoTour = !state.autoTour
  }

  function toggleLift(forceValue?: boolean) {
    state.liftRaised = typeof forceValue === 'boolean' ? forceValue : !state.liftRaised
  }

  function toggleArHudMode() {
    state.arHudMode = !state.arHudMode
  }

  function setEnvTheme(theme: EnvironmentThemeId) {
    state.envTheme = theme
  }

  function setPersonnelActionMode(mode: PersonnelActionMode) {
    state.personnelActionMode = mode
  }

  function registerLoadedGlb(fileName: string) {
    if (!state.loadedGlbFiles.includes(fileName)) {
      state.loadedGlbFiles.push(fileName)
    }
  }

  function enqueueCustomGlbFiles(files: FileList | File[]) {
    const list = Array.from(files)
    for (const file of list) {
      if (!file.name.toLowerCase().endsWith('.glb')) continue
      const objectUrl = URL.createObjectURL(file)
      state.customGlbQueue.push({
        fileName: file.name.toLowerCase(),
        objectUrl,
        nonce: Date.now() + Math.random()
      })
    }
  }

  function selectWorkOrder(workOrderId: string) {
    state.activeWorkOrderId = workOrderId
    const order = state.workOrders.find((w) => w.id === workOrderId)
    if (!order) return

    const firstPending = order.steps.find((s) => !s.completed) ?? order.steps[0]
    if (firstPending) {
      state.highlightTargetId = firstPending.highlightTargetId
      state.selectedObjectId = firstPending.highlightTargetId
      moveCameraTo(firstPending.recommendedCamera)
    }
  }

  function toggleWorkOrderStep(workOrderId: string, stepId: string) {
    const order = state.workOrders.find((w) => w.id === workOrderId)
    if (!order) return

    const step = order.steps.find((s) => s.id === stepId)
    if (!step) return

    step.completed = !step.completed

    if (typeof step.requiresLiftUp === 'boolean') {
      state.liftRaised = step.completed ? step.requiresLiftUp : !step.requiresLiftUp
    }

    const completedCount = order.steps.filter((s) => s.completed).length
    if (completedCount === 0) {
      order.status = 'Pendiente'
    } else if (completedCount === order.steps.length) {
      order.status = 'Completada'
    } else {
      order.status = 'En progreso'
    }

    const nextStep = order.steps.find((s) => !s.completed) ?? step
    state.highlightTargetId = nextStep.highlightTargetId
    state.selectedObjectId = nextStep.highlightTargetId
    moveCameraTo(nextStep.recommendedCamera)
  }

  function focusSceneObject(objectId: string, preset?: CameraPresetId) {
    state.selectedObjectId = objectId
    state.highlightTargetId = objectId
    const info = SCENE_ELEMENTS_CATALOG[objectId]
    moveCameraTo(preset ?? info?.cameraPreset ?? 'overview')
    state.activeSection = 'taller'
  }

  function setSceneStatus(status: typeof state.sceneStatus, message: string) {
    state.sceneStatus = status
    state.sceneMessage = message
  }

  /**
   * Analiza tanto el mensaje del usuario como la respuesta de Ollama para ejecutar acciones 3D automáticas
   */
  function executeNaturalLanguageCommand(rawText: string): string | undefined {
    const text = rawText.toLowerCase()
    const actions: string[] = []

    // 1. Control de modo de animación (Ingeniero Inspeccionando vs Operario Reparando)
    if (
      text.includes('inspeccion') ||
      text.includes('ingeniero') ||
      text.includes('escanear') ||
      text.includes('escaneo')
    ) {
      setPersonnelActionMode('inspect')
      actions.push('Animación: Ingenieros Automotrices Inspeccionando')
    } else if (
      text.includes('reparar') ||
      text.includes('reparando') ||
      text.includes('operario') ||
      text.includes('soldar') ||
      text.includes('soldadura')
    ) {
      setPersonnelActionMode('repair')
      actions.push('Animación: Operarios Mecánicos Reparando')
    } else if (text.includes('ambos') || text.includes('automatico') || text.includes('mixto')) {
      setPersonnelActionMode('auto')
      actions.push('Animación: Modo Mixto (Inspección + Reparación)')
    }

    // 2. Control de elevador hidráulico
    if (
      (text.includes('sube') || text.includes('subir') || text.includes('eleva')) &&
      text.includes('elevador')
    ) {
      toggleLift(true)
      actions.push('Elevador Bahía 1: Elevado')
    } else if (
      (text.includes('baja') || text.includes('bajar') || text.includes('desciende')) &&
      text.includes('elevador')
    ) {
      toggleLift(false)
      actions.push('Elevador Bahía 1: Descendido')
    }

    // 3. Navegación a piezas y talleres 3D
    if (text.includes('chasis') || text.includes('taller 3') || text.includes('taller 03')) {
      focusSceneObject('part-chasis', 'workshop_chassis')
      actions.push('Cámara -> Taller 03 (Chasis 6x4)')
    } else if (text.includes('aire') || text.includes('neumatic') || text.includes('compresor')) {
      focusSceneObject('part-aire', 'workshop_chassis')
      actions.push('Cámara -> Taller 03 (Sistema de Aire)')
    } else if (
      text.includes('carroceria') ||
      text.includes('cabina') ||
      text.includes('taller 2') ||
      text.includes('taller 02')
    ) {
      focusSceneObject('part-carroceria', 'workshop_body')
      actions.push('Cámara -> Taller 02 (Carrocería)')
    } else if (text.includes('puerta')) {
      focusSceneObject('part-puerta', 'workshop_body')
      actions.push('Cámara -> Taller 02 (Puerta)')
    } else if (
      text.includes('tablero') ||
      text.includes('taller 4') ||
      text.includes('taller 04')
    ) {
      focusSceneObject('part-tablero', 'workshop_interior')
      actions.push('Cámara -> Taller 04 (Tablero CAN-Bus)')
    } else if (text.includes('asiento')) {
      focusSceneObject('part-asientos', 'workshop_interior')
      actions.push('Cámara -> Taller 04 (Asientos Neumáticos)')
    } else if (text.includes('rueda') || text.includes('neumatico') || text.includes('llanta')) {
      focusSceneObject('rack-tires', 'warehouse')
      actions.push('Cámara -> Estación de Ruedas (rueda.glb)')
    } else if (text.includes('motor')) {
      focusSceneObject('spare-engine-stand', 'warehouse')
      actions.push('Cámara -> Motor Diésel D16')
    } else if (text.includes('fmx') || text.includes('bahia 2') || text.includes('bahía 2')) {
      focusSceneObject('truck-fmx-bay2', 'bay2_diagnostic')
      actions.push('Cámara -> Bahía 2 (Volvo FMX)')
    } else if (
      text.includes('fh') ||
      text.includes('bahia 1') ||
      text.includes('bahía 1') ||
      text.includes('taller 1') ||
      text.includes('taller 01')
    ) {
      focusSceneObject('truck-fh-bay1', 'bay1_repair')
      actions.push('Cámara -> Bahía 1 (Volvo FH16)')
    } else if (text.includes('fosa')) {
      focusSceneObject('inspection-pit', 'inspection_pit')
      actions.push('Cámara -> Fosa Subterránea LED')
    } else if (text.includes('vista general') || text.includes('complejo')) {
      resetCamera()
      actions.push('Cámara -> Vista Global del Complejo')
    }

    // 4. Fondos 3D
    if (text.includes('atardecer')) {
      setEnvTheme('sunset_industrial')
      actions.push('Fondo -> Atardecer Industrial')
    } else if (text.includes('matriz') || text.includes('matrix')) {
      setEnvTheme('vr_matrix')
      actions.push('Fondo -> Matriz VR')
    } else if (text.includes('nocturno') || text.includes('cyber')) {
      setEnvTheme('cyber_ar')
      actions.push('Fondo -> Cyber-AR Nocturno')
    }

    return actions.length > 0 ? actions.join(' • ') : undefined
  }

  return {
    state,
    workshopZones: WORKSHOP_ZONES,
    selectedElement,
    hoveredElement,
    activeWorkOrder,
    currentWorkshopZone,
    metrics,
    setSection,
    selectObject,
    setHoveredObject,
    moveCameraTo,
    selectWorkshopZone,
    resetCamera,
    toggleAutoTour,
    toggleLift,
    toggleArHudMode,
    setEnvTheme,
    setPersonnelActionMode,
    registerLoadedGlb,
    enqueueCustomGlbFiles,
    selectWorkOrder,
    toggleWorkOrderStep,
    focusSceneObject,
    setSceneStatus,
    executeNaturalLanguageCommand
  }
}
