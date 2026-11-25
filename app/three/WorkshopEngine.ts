import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { CameraPresetId, EnvironmentThemeId, PersonnelActionMode } from '~/types/workshop'
import { createWorkshopMaterials, type WorkshopMaterials } from './materials'
import {
  buildWorkshopScene,
  createRoleBadgeTexture,
  type WorkshopSceneRefs
} from './builders/buildWorkshop'
import { tryLoadGlbModel } from './modelLoader'

interface CameraPreset {
  position: THREE.Vector3
  target: THREE.Vector3
}

const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  overview: {
    position: new THREE.Vector3(-18.5, 14.5, 25.5),
    target: new THREE.Vector3(0, 1.8, 0.5)
  },
  bay1_repair: {
    position: new THREE.Vector3(-11.4, 4.3, 5.6),
    target: new THREE.Vector3(-5.5, 1.9, -0.8)
  },
  bay2_diagnostic: {
    position: new THREE.Vector3(7.8, 4.3, 5.8),
    target: new THREE.Vector3(2.1, 1.8, -0.8)
  },
  inspection_pit: {
    position: new THREE.Vector3(2.1, 2.5, 6.2),
    target: new THREE.Vector3(2.0, 0.7, -1.0)
  },
  warehouse: {
    position: new THREE.Vector3(6.0, 4.6, 5.0),
    target: new THREE.Vector3(11.2, 1.6, -2.8)
  },
  workshop_body: {
    position: new THREE.Vector3(15.5, 5.4, 7.6),
    target: new THREE.Vector3(23.8, 1.7, -1.6)
  },
  workshop_chassis: {
    position: new THREE.Vector3(-14.8, 5.5, 7.8),
    target: new THREE.Vector3(-23.5, 1.8, -1.2)
  },
  workshop_interior: {
    position: new THREE.Vector3(-6.8, 4.4, 19.2),
    target: new THREE.Vector3(0, 1.3, 12.2)
  }
}

const STREET_VIEW_WAYPOINTS: Array<{ x: number; z: number; lookX: number; lookZ: number }> = [
  { x: -5.5, z: 5.5, lookX: -5.5, lookZ: -1.0 },
  { x: 2.0, z: 5.5, lookX: 2.0, lookZ: -1.0 },
  { x: 9.2, z: 4.8, lookX: 10.5, lookZ: 1.5 },
  { x: 18.2, z: 3.8, lookX: 21.5, lookZ: -1.6 },
  { x: 26.8, z: 3.5, lookX: 28.8, lookZ: -1.2 },
  { x: -18.2, z: 4.2, lookX: -21.6, lookZ: -1.2 },
  { x: -27.5, z: 3.8, lookX: -29.2, lookZ: -1.2 },
  { x: -3.8, z: 15.8, lookX: -3.8, lookZ: 12.2 },
  { x: 3.8, z: 15.8, lookX: 3.8, lookZ: 12.2 },
  { x: 0, z: 6.5, lookX: 0, lookZ: -1.5 }
]

export interface CameraNavTelemetry {
  x: number
  z: number
  yawDeg: number
  streetView: boolean
}

export interface WorkshopEngineCallbacks {
  onSelect: (id: string | null) => void
  onHover: (id: string | null, screenPos?: { x: number; y: number }) => void
  onStatusChange: (status: 'loading' | 'ready' | 'fallback' | 'error', message: string) => void
  onModelLoaded?: (fileName: string) => void
  onCameraTelemetry?: (telemetry: CameraNavTelemetry) => void
}

function createSkyDomeTexture(theme: EnvironmentThemeId): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  if (theme === 'sunset_industrial') {
    grad.addColorStop(0, '#070b19')
    grad.addColorStop(0.32, '#1b1938')
    grad.addColorStop(0.46, '#6d284f')
    grad.addColorStop(0.54, '#ea580c')
    grad.addColorStop(0.58, '#fbbf24')
    grad.addColorStop(0.64, '#1e1b24')
    grad.addColorStop(1, '#090b10')
  } else if (theme === 'vr_matrix') {
    grad.addColorStop(0, '#01050c')
    grad.addColorStop(0.45, '#031528')
    grad.addColorStop(0.52, '#0ea5e9')
    grad.addColorStop(0.56, '#022c22')
    grad.addColorStop(1, '#010409')
  } else {
    grad.addColorStop(0, '#040711')
    grad.addColorStop(0.35, '#0b152c')
    grad.addColorStop(0.49, '#1e1b4b')
    grad.addColorStop(0.53, '#0284c7')
    grad.addColorStop(0.57, '#0f172a')
    grad.addColorStop(1, '#050811')
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)

  ctx.fillStyle = 'rgba(224, 242, 254, 0.55)'
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 230
    const r = Math.random() * 1.6
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle =
    theme === 'sunset_industrial'
      ? 'rgba(251, 191, 36, 0.25)'
      : theme === 'vr_matrix'
        ? 'rgba(34, 211, 238, 0.35)'
        : 'rgba(56, 189, 248, 0.28)'
  ctx.lineWidth = 2
  for (let y = 250; y <= 290; y += 10) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class WorkshopEngine {
  private container: HTMLElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private materials: WorkshopMaterials
  private refs: WorkshopSceneRefs
  private raycaster = new THREE.Raycaster()
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private pointer = new THREE.Vector2()
  private callbacks: WorkshopEngineCallbacks
  private clock = new THREE.Clock()
  private mainDirLight!: THREE.DirectionalLight
  private hemiLight!: THREE.HemisphereLight

  private animationFrameId = 0
  private targetCameraPos: THREE.Vector3 | null = null
  private targetControlsLook: THREE.Vector3 | null = null
  private desiredLiftY = 0
  private autoTourEnabled = false
  private streetViewMode = false
  private leftClickPanMode = false
  private personnelActionMode: PersonnelActionMode = 'auto'
  private selectionRing: THREE.Mesh
  private selectionBaseScale = 1
  private currentHighlightedId: string | null = null
  private pointerDownPos = { x: 0, y: 0 }
  private lastDiagDraw = 0
  private lastTelemetryTime = 0
  private disposed = false

  // Elementos de navegación estilo Google Maps / Street View
  private streetCursorGroup: THREE.Group
  private waypointMeshes: THREE.Mesh[] = []
  private keysPressed = new Set<string>()

  constructor(container: HTMLElement, callbacks: WorkshopEngineCallbacks) {
    this.container = container
    this.callbacks = callbacks

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x060b14)
    this.scene.fog = new THREE.FogExp2(0x060b14, 0.0095)

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.15, 140)
    this.camera.position.copy(CAMERA_PRESETS.overview.position)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.24
    container.appendChild(this.renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    pmrem.compileEquirectangularShader()
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture
    this.scene.environmentIntensity = 1.18
    pmrem.dispose()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    // Panning paralelo al suelo (igual que Google Maps 3D)
    this.controls.screenSpacePanning = false
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02
    this.controls.minDistance = 0.8
    this.controls.maxDistance = 52
    this.controls.target.copy(CAMERA_PRESETS.overview.target)

    this.setupLights()
    this.materials = createWorkshopMaterials()
    this.refs = buildWorkshopScene(this.materials)
    this.scene.add(this.refs.root)
    this.setEnvironmentTheme('cyber_ar')

    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.32, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    )
    this.selectionRing.visible = false
    this.scene.add(this.selectionRing)

    // Cursor de suelo estilo Google Street View (círculo + disco central que sigue al puntero en el piso)
    this.streetCursorGroup = this.buildStreetViewGroundCursor()
    this.scene.add(this.streetCursorGroup)

    // Nodos / puntos de paso Street View en los pasillos de los 4 talleres
    this.buildStreetViewWaypoints()

    this.bindEvents()
    this.loadOptionalExternalModels()
    this.animate()
  }

  private buildStreetViewGroundCursor(): THREE.Group {
    const g = new THREE.Group()
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 36).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    )
    const innerDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    )
    g.add(outerRing, innerDisc)
    g.position.y = 0.028
    g.visible = false
    g.traverse((c) => {
      c.raycast = () => {}
    })
    return g
  }

  private buildStreetViewWaypoints() {
    const wpGeo = new THREE.RingGeometry(0.35, 0.56, 32).rotateX(-Math.PI / 2)
    const wpInnerGeo = new THREE.CircleGeometry(0.24, 24).rotateX(-Math.PI / 2)

    for (const wp of STREET_VIEW_WAYPOINTS) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(wpGeo, mat)
      mesh.position.set(wp.x, 0.026, wp.z)
      mesh.userData.streetWaypoint = wp

      const inner = new THREE.Mesh(
        wpInnerGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      )
      inner.userData.streetWaypoint = wp
      mesh.add(inner)

      this.scene.add(mesh)
      this.waypointMeshes.push(mesh)
    }
  }

  private setupLights() {
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.58)
    this.scene.add(this.hemiLight)

    this.mainDirLight = new THREE.DirectionalLight(0xfffbeb, 1.95)
    this.mainDirLight.position.set(14, 22, 15)
    this.mainDirLight.castShadow = true
    this.mainDirLight.shadow.mapSize.set(4096, 4096)
    this.mainDirLight.shadow.camera.near = 2
    this.mainDirLight.shadow.camera.far = 68
    this.mainDirLight.shadow.camera.left = -34
    this.mainDirLight.shadow.camera.right = 34
    this.mainDirLight.shadow.camera.top = 22
    this.mainDirLight.shadow.camera.bottom = -22
    this.mainDirLight.shadow.bias = -0.0003
    this.mainDirLight.shadow.normalBias = 0.022
    this.mainDirLight.shadow.radius = 2.1
    this.scene.add(this.mainDirLight)

    const rimDir = new THREE.DirectionalLight(0x93c5fd, 0.75)
    rimDir.position.set(-18, 13, -15)
    this.scene.add(rimDir)

    const createBaySpot = (
      color: number,
      intensity: number,
      x: number,
      y: number,
      z: number
    ) => {
      const spot = new THREE.SpotLight(color, intensity, 24, Math.PI / 3, 0.68, 1.45)
      spot.position.set(x, y, z)
      spot.target.position.set(x, 0, z)
      this.scene.add(spot, spot.target)
    }

    createBaySpot(0xe0f2fe, 40, -5.5, 8.8, -1.0)
    createBaySpot(0xfef3c7, 36, 2.0, 8.8, -1.0)
    createBaySpot(0xf3e8ff, 38, 23.5, 8.8, -1.5)
    createBaySpot(0xfef3c7, 38, -23.5, 8.8, -1.5)
    createBaySpot(0xdcfce7, 34, 0, 8.2, 12.2)

    const pitUpLight = new THREE.PointLight(0xbae6fd, 6.5, 7.5)
    pitUpLight.position.set(2.0, 0.35, -1.0)
    this.scene.add(pitUpLight)
  }

  public setEnvironmentTheme(theme: EnvironmentThemeId) {
    if (this.refs.skyDomeMat.map) {
      this.refs.skyDomeMat.map.dispose()
    }
    this.refs.skyDomeMat.map = createSkyDomeTexture(theme)
    this.refs.skyDomeMat.needsUpdate = true

    if (theme === 'sunset_industrial') {
      this.scene.background = new THREE.Color(0x14101c)
      this.scene.fog = new THREE.FogExp2(0x16111d, 0.0085)
      this.mainDirLight.color.setHex(0xffedd5)
      this.mainDirLight.intensity = 2.25
      this.hemiLight.color.setHex(0xfde68a)
    } else if (theme === 'vr_matrix') {
      this.scene.background = new THREE.Color(0x020813)
      this.scene.fog = new THREE.FogExp2(0x020813, 0.01)
      this.mainDirLight.color.setHex(0xe0f2fe)
      this.mainDirLight.intensity = 1.85
      this.hemiLight.color.setHex(0x38bdf8)
    } else {
      this.scene.background = new THREE.Color(0x060b14)
      this.scene.fog = new THREE.FogExp2(0x060b14, 0.009)
      this.mainDirLight.color.setHex(0xfffbeb)
      this.mainDirLight.intensity = 1.98
      this.hemiLight.color.setHex(0xdbeafe)
    }
  }

  public setPersonnelActionMode(mode: PersonnelActionMode) {
    this.personnelActionMode = mode
    for (const sp of this.refs.specialists) {
      const effectiveRole: 'engineer' | 'operator' =
        mode === 'inspect' ? 'engineer' : mode === 'repair' ? 'operator' : sp.defaultRole

      sp.engineerRig.visible = effectiveRole === 'engineer'
      sp.operatorRig.visible = effectiveRole === 'operator'

      if (sp.badgeMat.map) sp.badgeMat.map.dispose()
      sp.badgeMat.map = createRoleBadgeTexture(
        effectiveRole,
        sp.nameLabel,
        effectiveRole === 'engineer'
          ? `INSPECCIONANDO: ${sp.targetLabel}`
          : `REPARANDO: ${sp.targetLabel}`
      )
      sp.badgeMat.needsUpdate = true
    }
  }

  public setArOverlayVisible(visible: boolean) {
    this.refs.arHoloGroup.visible = visible
    this.refs.laserScannerBody.visible = visible
    this.refs.laserScannerChassis.visible = visible
  }

  /**
   * Alterna entre modo Mapa 3D Aéreo y modo Street View (Caminar a pie a 1.78m de altura)
   */
  public setStreetViewMode(enabled: boolean) {
    this.streetViewMode = enabled
    this.autoTourEnabled = false
    this.controls.autoRotate = false

    const dir = new THREE.Vector3()
      .subVectors(this.controls.target, this.camera.position)
      .setY(0)
    if (dir.lengthSq() < 0.01) dir.set(0, 0, -1)
    dir.normalize()

    if (enabled) {
      // Bajar cámara a nivel de ojos (1.78m) frente al punto observado
      const standX = THREE.MathUtils.clamp(this.controls.target.x - dir.x * 3.8, -33, 33)
      const standZ = THREE.MathUtils.clamp(this.controls.target.z - dir.z * 3.8, -10.5, 16.5)
      this.targetCameraPos = new THREE.Vector3(standX, 1.78, standZ)
      this.targetControlsLook = new THREE.Vector3(
        standX + dir.x * 2.5,
        1.72,
        standZ + dir.z * 2.5
      )
    } else {
      // Elevar cámara a vista Mapa 3D Aéreo conservando posición actual
      const basePos = this.camera.position
      this.targetCameraPos = new THREE.Vector3(
        basePos.x - dir.x * 6.5,
        7.8,
        basePos.z - dir.z * 6.5
      )
      this.targetControlsLook = new THREE.Vector3(
        basePos.x + dir.x * 3.2,
        1.5,
        basePos.z + dir.z * 3.2
      )
    }
  }

  public isStreetViewActive(): boolean {
    return this.streetViewMode
  }

  /**
   * Cambia el botón izquierdo del ratón entre Rotar 3D y Arrastrar Mapa (como Google Maps)
   */
  public setLeftClickPanMode(panWithLeft: boolean) {
    this.leftClickPanMode = panWithLeft
    if (panWithLeft) {
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
    } else {
      this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    }
  }

  /**
   * Desplaza al usuario hacia cualquier coordenada (x, z) del piso (estilo clic en Google Street View / Minimapa)
   */
  public walkOrGlideToFloorPoint(x: number, z: number, lookAtX?: number, lookAtZ?: number) {
    this.autoTourEnabled = false
    this.controls.autoRotate = false

    const clampedX = THREE.MathUtils.clamp(x, -34, 34)
    const clampedZ = THREE.MathUtils.clamp(z, -11, 17.5)

    const currentForward = new THREE.Vector3()
      .subVectors(this.controls.target, this.camera.position)
      .setY(0)
    if (currentForward.lengthSq() < 0.001) currentForward.set(0, 0, -1)
    currentForward.normalize()

    if (this.streetViewMode) {
      // En Street View: caminar a nivel de ojos (1.78m) hasta el punto clicado
      let dirX = currentForward.x
      let dirZ = currentForward.z
      if (typeof lookAtX === 'number' && typeof lookAtZ === 'number') {
        const toTarget = new THREE.Vector2(lookAtX - clampedX, lookAtZ - clampedZ)
        if (toTarget.lengthSq() > 0.01) {
          toTarget.normalize()
          dirX = toTarget.x
          dirZ = toTarget.y
        }
      } else {
        const walkDir = new THREE.Vector2(
          clampedX - this.camera.position.x,
          clampedZ - this.camera.position.z
        )
        if (walkDir.lengthSq() > 0.25) {
          walkDir.normalize()
          dirX = walkDir.x
          dirZ = walkDir.y
        }
      }

      this.targetCameraPos = new THREE.Vector3(clampedX, 1.78, clampedZ)
      this.targetControlsLook = new THREE.Vector3(
        clampedX + dirX * 2.5,
        1.72,
        clampedZ + dirZ * 2.5
      )
    } else {
      // En modo Mapa 3D: desplazar cámara y objetivo manteniendo el vector de observación actual
      const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target)
      const newTarget = new THREE.Vector3(clampedX, 1.4, clampedZ)
      this.targetControlsLook = newTarget
      this.targetCameraPos = newTarget.clone().add(offset)
    }
  }

  /**
   * Controles de navegación tipo Google Maps: avanzar/retroceder/lateral, rotar, zoom y orientar al Norte
   */
  public stepMove(forwardDelta: number, rightDelta: number) {
    this.targetCameraPos = null
    this.targetControlsLook = null

    const forward = new THREE.Vector3()
      .subVectors(this.controls.target, this.camera.position)
      .setY(0)
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1)
    forward.normalize()

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const moveVec = new THREE.Vector3()
      .addScaledVector(forward, forwardDelta)
      .addScaledVector(right, rightDelta)

    this.camera.position.add(moveVec)
    this.controls.target.add(moveVec)

    // Mantener dentro de los límites del complejo
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -35, 35)
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -12, 24)
    if (this.streetViewMode) {
      this.camera.position.y = 1.78
      this.controls.target.y = 1.72
    }
  }

  public stepZoom(zoomFactor: number) {
    this.targetCameraPos = null
    this.targetControlsLook = null
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target)
    const dist = offset.length()
    const newDist = THREE.MathUtils.clamp(dist * zoomFactor, 1.2, 48)
    offset.setLength(newDist)
    this.camera.position.copy(this.controls.target).add(offset)
  }

  public stepRotateYaw(angleRad: number) {
    this.targetCameraPos = null
    this.targetControlsLook = null

    if (this.streetViewMode) {
      // En Street View giramos la mirada alrededor de la posición de los ojos
      const lookOffset = new THREE.Vector3().subVectors(this.controls.target, this.camera.position)
      lookOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad)
      this.controls.target.copy(this.camera.position).add(lookOffset)
    } else {
      // En modo Mapa 3D orbitamos alrededor del objetivo
      const camOffset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target)
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad)
      this.camera.position.copy(this.controls.target).add(camOffset)
    }
  }

  public resetCompassNorth() {
    const dist = this.camera.position.distanceTo(this.controls.target)
    const t = this.controls.target.clone()
    if (this.streetViewMode) {
      this.targetCameraPos = this.camera.position.clone()
      this.targetControlsLook = new THREE.Vector3(
        this.camera.position.x,
        1.72,
        this.camera.position.z - 2.5
      )
    } else {
      const horizDist = Math.max(3.5, dist * 0.78)
      const height = Math.max(3.5, this.camera.position.y)
      this.targetControlsLook = t
      this.targetCameraPos = new THREE.Vector3(t.x, height, t.z + horizDist)
    }
  }

  private notifyGlbLoaded(fileName: string) {
    this.callbacks.onModelLoaded?.(fileName)
  }

  private replaceSlotContent(
    slot: THREE.Group,
    currentMesh: THREE.Object3D,
    newModel: THREE.Group,
    interactiveId: string
  ): THREE.Group {
    slot.remove(currentMesh)
    slot.add(newModel)
    newModel.traverse((c) => {
      c.userData.interactiveId = interactiveId
    })
    return newModel
  }

  private async loadOptionalExternalModels() {
    const maxAnisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy() || 8, 16)

    const [fhModel, fmxModel, diagCartModel, mechTemplate] = await Promise.all([
      tryLoadGlbModel('/models/volvo-fh-tractor.glb', {
        targetLength: 7.2,
        alignLongestAxisToZ: true,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'truck-fh-bay1',
        addContactShadow: true
      }),
      tryLoadGlbModel('/models/volvo-fmx-rigid.glb', {
        targetLength: 7.5,
        alignLongestAxisToZ: true,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'truck-fmx-bay2',
        addContactShadow: true
      }),
      tryLoadGlbModel('/models/workshop-diag-cart.glb', {
        targetHeight: 1.48,
        rotationY: -0.45,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'diag-station',
        addContactShadow: true
      }),
      tryLoadGlbModel('/models/mechanic-ppe.glb', {
        targetHeight: 1.78,
        materialProfile: 'character',
        maxAnisotropy,
        addContactShadow: true
      })
    ])

    if (this.disposed) return

    if (fhModel) {
      fhModel.position.copy(this.refs.truckBay1.position)
      this.refs.liftPlatformGroup.remove(this.refs.truckBay1)
      this.refs.liftPlatformGroup.add(fhModel)
      this.refs.truckBay1 = fhModel
      this.refs.interactiveGroups.set('truck-fh-bay1', fhModel)
      this.notifyGlbLoaded('volvo-fh-tractor.glb')
    }

    if (fmxModel) {
      fmxModel.position.copy(this.refs.truckBay2.position)
      this.refs.root.remove(this.refs.truckBay2)
      this.refs.root.add(fmxModel)
      this.refs.truckBay2 = fmxModel
      this.refs.interactiveGroups.set('truck-fmx-bay2', fmxModel)
      this.notifyGlbLoaded('volvo-fmx-rigid.glb')
    }

    if (diagCartModel) {
      diagCartModel.position.copy(this.refs.diagCart.position)
      this.refs.root.remove(this.refs.diagCart)
      this.refs.root.add(diagCartModel)
      this.refs.diagCart = diagCartModel
      this.refs.interactiveGroups.set('diag-station', diagCartModel)
      this.notifyGlbLoaded('workshop-diag-cart.glb')
    }

    if (mechTemplate) {
      this.notifyGlbLoaded('mechanic-ppe.glb')
      const mechPromises = this.refs.specialists.map((sp) =>
        tryLoadGlbModel('/models/mechanic-ppe.glb', {
          targetHeight: 1.78,
          materialProfile: 'character',
          maxAnisotropy,
          interactiveId: sp.id,
          addContactShadow: true
        })
      )
      const loadedMechs = await Promise.all(mechPromises)
      if (!this.disposed) {
        loadedMechs.forEach((mModel, idx) => {
          const sp = this.refs.specialists[idx]
          if (!mModel || !sp) return
          sp.characterSlot.remove(sp.characterMesh)
          sp.characterSlot.add(mModel)
          sp.characterMesh = mModel
        })
      }
    }

    const [
      carroceriaGlb,
      puertaGlb,
      chasisGlb,
      aireGlb,
      tableroGlb,
      asientosGlb,
      ruedaGlb
    ] = await Promise.all([
      tryLoadGlbModel('/models/carroceria.glb', {
        targetLength: 7.2,
        alignLongestAxisToZ: true,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'part-carroceria',
        addContactShadow: true
      }),
      tryLoadGlbModel('/models/puerta.glb', {
        targetHeight: 1.65,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'part-puerta',
        addContactShadow: true
      }),
      tryLoadGlbModel('/models/chasis.glb', {
        targetLength: 7.45,
        targetWidth: 2.95,
        targetHeight: 1.48,
        alignLongestAxisToZ: true,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'part-chasis',
        addContactShadow: true
      }),
      tryLoadGlbModel('/models/aire.glb', {
        targetLength: 1.45,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'part-aire',
        addContactShadow: false
      }),
      tryLoadGlbModel('/models/tablero.glb', {
        targetLength: 2.1,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'part-tablero',
        addContactShadow: false
      }),
      tryLoadGlbModel('/models/asientos.glb', {
        targetHeight: 1.38,
        materialProfile: 'character',
        maxAnisotropy,
        interactiveId: 'part-asientos',
        addContactShadow: false
      }),
      tryLoadGlbModel('/models/rueda.glb', {
        targetHeight: 1.12,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'rack-tires',
        addContactShadow: true
      })
    ])

    if (this.disposed) return

    if (carroceriaGlb) {
      this.refs.partCarroceriaMesh = this.replaceSlotContent(
        this.refs.partCarroceriaSlot,
        this.refs.partCarroceriaMesh,
        carroceriaGlb,
        'part-carroceria'
      )
      this.notifyGlbLoaded('carroceria.glb')
    }
    if (puertaGlb) {
      this.refs.partPuertaMesh = this.replaceSlotContent(
        this.refs.partPuertaSlot,
        this.refs.partPuertaMesh,
        puertaGlb,
        'part-puerta'
      )
      this.notifyGlbLoaded('puerta.glb')
    }
    if (chasisGlb) {
      this.refs.partChasisMesh = this.replaceSlotContent(
        this.refs.partChasisSlot,
        this.refs.partChasisMesh,
        chasisGlb,
        'part-chasis'
      )
      this.notifyGlbLoaded('chasis.glb')
    }
    if (aireGlb) {
      this.refs.partAireMesh = this.replaceSlotContent(
        this.refs.partAireSlot,
        this.refs.partAireMesh,
        aireGlb,
        'part-aire'
      )
      this.notifyGlbLoaded('aire.glb')
    }
    if (tableroGlb) {
      this.refs.partTableroMesh = this.replaceSlotContent(
        this.refs.partTableroSlot,
        this.refs.partTableroMesh,
        tableroGlb,
        'part-tablero'
      )
      this.notifyGlbLoaded('tablero.glb')
    }
    if (asientosGlb) {
      this.refs.partAsientosMesh = this.replaceSlotContent(
        this.refs.partAsientosSlot,
        this.refs.partAsientosMesh,
        asientosGlb,
        'part-asientos'
      )
      this.notifyGlbLoaded('asientos.glb')
    }
    if (ruedaGlb) {
      this.refs.tireRack.clear()
      for (let i = 0; i < 4; i++) {
        const wheelClone = i === 0 ? ruedaGlb : ruedaGlb.clone(true)
        wheelClone.position.set(0, 0, -1.5 + i * 1.0)
        this.refs.tireRack.add(wheelClone)
      }
      this.notifyGlbLoaded('rueda.glb')
    }

    if (this.currentHighlightedId) {
      this.highlightObject(this.currentHighlightedId)
    }

    this.callbacks.onStatusChange(
      'ready',
      'Complejo XR activo con navegación estilo Google Maps y Street View.'
    )

    tryLoadGlbModel('/models/diesel-engine-inline6.glb', {
      targetLength: 1.35,
      groundOffset: 0.56,
      materialProfile: 'engine',
      maxAnisotropy,
      interactiveId: 'spare-engine-stand',
      addContactShadow: false
    }).then((engineModel) => {
      if (!engineModel || this.disposed) return
      this.refs.engineStand.remove(this.refs.enginePayloadGroup)
      this.refs.engineStand.add(engineModel)
      this.refs.enginePayloadGroup = engineModel
      this.notifyGlbLoaded('diesel-engine-inline6.glb')
      if (this.currentHighlightedId === 'spare-engine-stand') {
        this.highlightObject('spare-engine-stand')
      }
    })
  }

  public async loadCustomGlbFile(
    fileName: string,
    objectUrl: string
  ): Promise<CameraPresetId | null> {
    const cleanName = fileName.toLowerCase().trim()
    const maxAnisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy() || 8, 16)

    if (cleanName.includes('carroceria')) {
      const model = await tryLoadGlbModel(objectUrl, {
        targetLength: 7.2,
        alignLongestAxisToZ: true,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'part-carroceria',
        addContactShadow: true
      })
      if (model && !this.disposed) {
        this.refs.partCarroceriaMesh = this.replaceSlotContent(
          this.refs.partCarroceriaSlot,
          this.refs.partCarroceriaMesh,
          model,
          'part-carroceria'
        )
        this.notifyGlbLoaded('carroceria.glb')
        this.highlightObject('part-carroceria')
        return 'workshop_body'
      }
    } else if (cleanName.includes('puerta')) {
      const model = await tryLoadGlbModel(objectUrl, {
        targetHeight: 1.65,
        materialProfile: 'vehicle',
        maxAnisotropy,
        interactiveId: 'part-puerta',
        addContactShadow: true
      })
      if (model && !this.disposed) {
        this.refs.partPuertaMesh = this.replaceSlotContent(
          this.refs.partPuertaSlot,
          this.refs.partPuertaMesh,
          model,
          'part-puerta'
        )
        this.notifyGlbLoaded('puerta.glb')
        this.highlightObject('part-puerta')
        return 'workshop_body'
      }
    } else if (cleanName.includes('chasis')) {
      const model = await tryLoadGlbModel(objectUrl, {
        targetLength: 7.45,
        targetWidth: 2.95,
        targetHeight: 1.48,
        alignLongestAxisToZ: true,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'part-chasis',
        addContactShadow: true
      })
      if (model && !this.disposed) {
        this.refs.partChasisMesh = this.replaceSlotContent(
          this.refs.partChasisSlot,
          this.refs.partChasisMesh,
          model,
          'part-chasis'
        )
        this.notifyGlbLoaded('chasis.glb')
        this.highlightObject('part-chasis')
        return 'workshop_chassis'
      }
    } else if (cleanName.includes('aire')) {
      const model = await tryLoadGlbModel(objectUrl, {
        targetLength: 1.45,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'part-aire',
        addContactShadow: false
      })
      if (model && !this.disposed) {
        this.refs.partAireMesh = this.replaceSlotContent(
          this.refs.partAireSlot,
          this.refs.partAireMesh,
          model,
          'part-aire'
        )
        this.notifyGlbLoaded('aire.glb')
        this.highlightObject('part-aire')
        return 'workshop_chassis'
      }
    } else if (cleanName.includes('tablero')) {
      const model = await tryLoadGlbModel(objectUrl, {
        targetLength: 2.1,
        materialProfile: 'equipment',
        maxAnisotropy,
        interactiveId: 'part-tablero',
        addContactShadow: false
      })
      if (model && !this.disposed) {
        this.refs.partTableroMesh = this.replaceSlotContent(
          this.refs.partTableroSlot,
          this.refs.partTableroMesh,
          model,
          'part-tablero'
        )
        this.notifyGlbLoaded('tablero.glb')
        this.highlightObject('part-tablero')
        return 'workshop_interior'
      }
    } else if (cleanName.includes('asiento')) {
      const model = await tryLoadGlbModel(objectUrl, {
        targetHeight: 1.38,
        materialProfile: 'character',
        maxAnisotropy,
        interactiveId: 'part-asientos',
        addContactShadow: false
      })
      if (model && !this.disposed) {
        this.refs.partAsientosMesh = this.replaceSlotContent(
          this.refs.partAsientosSlot,
          this.refs.partAsientosMesh,
          model,
          'part-asientos'
        )
        this.notifyGlbLoaded('asientos.glb')
        this.highlightObject('part-asientos')
        return 'workshop_interior'
      }
    }
    return null
  }

  public setCameraPreset(presetId: CameraPresetId) {
    this.autoTourEnabled = false
    this.streetViewMode = false
    const preset = CAMERA_PRESETS[presetId] ?? CAMERA_PRESETS.overview
    this.targetCameraPos = preset.position.clone()
    this.targetControlsLook = preset.target.clone()
  }

  public setAutoTour(enabled: boolean) {
    this.autoTourEnabled = enabled
    this.controls.autoRotate = enabled
    this.controls.autoRotateSpeed = 0.75
  }

  public setLiftRaised(raised: boolean) {
    this.desiredLiftY = raised ? 1.35 : 0
    this.refs.bayStatusLights.bay1.color.setHex(raised ? 0x38bdf8 : 0x22c55e)
    this.refs.bayStatusLights.bay1.emissive.setHex(raised ? 0x38bdf8 : 0x22c55e)
  }

  public highlightObject(id: string | null) {
    this.currentHighlightedId = id
    if (!id) {
      this.selectionRing.visible = false
      return
    }
    const target = this.refs.interactiveGroups.get(id)
    if (!target) {
      this.selectionRing.visible = false
      return
    }
    const box = new THREE.Box3().setFromObject(target)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.z) * 0.52

    this.selectionRing.position.set(center.x, 0.04, center.z)
    this.selectionBaseScale = Math.max(0.85, radius)
    this.selectionRing.scale.setScalar(this.selectionBaseScale)
    this.selectionRing.visible = true
  }

  private updatePointerNDC(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  private getFloorIntersection(clientX: number, clientY: number): THREE.Vector3 | null {
    this.updatePointerNDC(clientX, clientY)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hitPoint = new THREE.Vector3()
    const hit = this.raycaster.ray.intersectPlane(this.floorPlane, hitPoint)
    if (!hit) return null
    if (Math.abs(hitPoint.x) > 35.5 || hitPoint.z < -12 || hitPoint.z > 18.5) return null
    return hitPoint
  }

  private getHitWaypoint(
    clientX: number,
    clientY: number
  ): { x: number; z: number; lookX: number; lookZ: number } | null {
    this.updatePointerNDC(clientX, clientY)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.waypointMeshes, true)
    for (const h of hits) {
      if (h.object.userData?.streetWaypoint) {
        return h.object.userData.streetWaypoint
      }
    }
    return null
  }

  private getHitInteractiveId(clientX: number, clientY: number): string | null {
    this.updatePointerNDC(clientX, clientY)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.refs.root.children, true)
    for (const hit of hits) {
      if (hit.object.userData?.interactiveId) {
        return hit.object.userData.interactiveId as string
      }
    }
    return null
  }

  private onPointerMove = (e: PointerEvent) => {
    const wp = this.getHitWaypoint(e.clientX, e.clientY)
    const hitId = wp ? null : this.getHitInteractiveId(e.clientX, e.clientY)
    const floorPt = this.getFloorIntersection(e.clientX, e.clientY)

    if (floorPt && (!hitId || this.streetViewMode)) {
      this.streetCursorGroup.visible = true
      this.streetCursorGroup.position.set(floorPt.x, 0.028, floorPt.z)
    } else {
      this.streetCursorGroup.visible = false
    }

    if (wp || hitId || this.streetViewMode) {
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.renderer.domElement.style.cursor = this.leftClickPanMode ? 'move' : 'grab'
    }

    this.callbacks.onHover(hitId, { x: e.clientX, y: e.clientY })
  }

  private onPointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY }
    this.targetCameraPos = null
    this.targetControlsLook = null
  }

  private onPointerUp = (e: PointerEvent) => {
    const dx = Math.abs(e.clientX - this.pointerDownPos.x)
    const dy = Math.abs(e.clientY - this.pointerDownPos.y)
    if (dx > 6 || dy > 6) return

    // 1. Si hizo clic en un nodo Street View del piso, caminar/deslizarse hacia ese nodo
    const wp = this.getHitWaypoint(e.clientX, e.clientY)
    if (wp) {
      this.walkOrGlideToFloorPoint(wp.x, wp.z, wp.lookX, wp.lookZ)
      return
    }

    // 2. Si hizo clic en un objeto interactivo 3D (camión, pieza GLB, técnico)
    const hitId = this.getHitInteractiveId(e.clientX, e.clientY)
    if (hitId) {
      this.highlightObject(hitId)
      this.callbacks.onSelect(hitId)
      return
    }

    // 3. En modo Street View, un clic directo sobre cualquier parte del suelo camina hasta allí
    if (this.streetViewMode) {
      const floorPt = this.getFloorIntersection(e.clientX, e.clientY)
      if (floorPt) {
        this.walkOrGlideToFloorPoint(floorPt.x, floorPt.z)
        return
      }
    }

    this.highlightObject(null)
    this.callbacks.onSelect(null)
  }

  /**
   * Doble clic en cualquier punto del suelo te desplaza hacia ese lugar (igual que Google Maps / Street View)
   */
  private onDoubleClick = (e: MouseEvent) => {
    const floorPt = this.getFloorIntersection(e.clientX, e.clientY)
    if (floorPt) {
      this.walkOrGlideToFloorPoint(floorPt.x, floorPt.z)
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    this.keysPressed.add(e.key.toLowerCase())
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.key.toLowerCase())
  }

  private onResize = () => {
    if (!this.container) return
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private bindEvents() {
    const dom = this.renderer.domElement
    dom.addEventListener('pointermove', this.onPointerMove)
    dom.addEventListener('pointerdown', this.onPointerDown)
    dom.addEventListener('pointerup', this.onPointerUp)
    dom.addEventListener('dblclick', this.onDoubleClick)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('resize', this.onResize)
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate)
    const elapsed = this.clock.getElapsedTime()

    // 0. Movimiento continuo por teclado (WASD / Flechas estilo Google Street View)
    if (this.keysPressed.size > 0) {
      const speed = this.streetViewMode ? 0.14 : 0.22
      let fwd = 0
      let right = 0
      if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) fwd += speed
      if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) fwd -= speed
      if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) right += speed
      if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) right -= speed
      if (fwd !== 0 || right !== 0) {
        this.stepMove(fwd, right)
      }
    }

    // 1. Movimiento suave del elevador hidráulico
    this.refs.liftPlatformGroup.position.y +=
      (this.desiredLiftY - this.refs.liftPlatformGroup.position.y) * 0.06

    // 2. Rotación de ventilador de motor D16 y turbina neumática
    this.refs.engineFan.rotation.z = elapsed * 4.5
    this.refs.airTurbineRotor.rotation.z = elapsed * 6.5

    // 3. Animación cinemática de Operarios e Ingenieros Automotrices
    this.refs.specialists.forEach((sp, idx) => {
      const effectiveRole: 'engineer' | 'operator' =
        this.personnelActionMode === 'inspect'
          ? 'engineer'
          : this.personnelActionMode === 'repair'
            ? 'operator'
            : sp.defaultRole

      const phase = elapsed * 1.1 + idx * 1.7
      const patrolWave = Math.sin(phase * 0.75)
      const isMoving = Math.abs(Math.cos(phase * 0.75)) > 0.45

      sp.root.position.x = sp.baseX + patrolWave * sp.patrolDx
      sp.root.position.z = sp.baseZ + patrolWave * sp.patrolDz

      if (effectiveRole === 'engineer') {
        const walkBob = isMoving ? Math.abs(Math.sin(elapsed * 6.5 + idx)) * 0.045 : 0
        sp.characterSlot.position.y = walkBob
        sp.characterSlot.rotation.x = isMoving ? 0.04 : 0.14 + Math.sin(elapsed * 2.5 + idx) * 0.05
        sp.characterSlot.rotation.z = isMoving ? Math.sin(elapsed * 6.5 + idx) * 0.035 : 0
        sp.root.rotation.y = sp.baseRotY + Math.sin(elapsed * 1.4 + idx) * 0.28

        sp.scanCone.rotation.x = Math.sin(elapsed * 3.2 + idx) * 0.25
        sp.scanCone.rotation.y = Math.cos(elapsed * 2.4 + idx) * 0.22
        sp.scanReticle.rotation.z = elapsed * 3.8
        const reticleScale = 0.85 + Math.sin(elapsed * 5.0 + idx) * 0.18
        sp.scanReticle.scale.setScalar(reticleScale)
      } else {
        const workCycle = Math.sin(elapsed * 2.2 + idx)
        const isWorkingHard = workCycle > -0.2
        const crouchY = isWorkingHard ? -0.09 + Math.sin(elapsed * 18 + idx) * 0.012 : 0
        sp.characterSlot.position.y = Math.max(-0.1, crouchY)
        sp.characterSlot.rotation.x = isWorkingHard
          ? 0.24 + Math.sin(elapsed * 16 + idx) * 0.04
          : 0.06
        sp.characterSlot.rotation.z = isWorkingHard ? Math.cos(elapsed * 14 + idx) * 0.03 : 0
        sp.root.rotation.y = sp.baseRotY + Math.sin(elapsed * 1.8 + idx) * 0.18

        const sparkBurst = isWorkingHard
          ? Math.max(0.15, Math.sin(elapsed * 24 + idx * 3))
          : 0.05
        sp.arcCore.scale.setScalar(0.6 + sparkBurst * 0.9)
        sp.repairSparks.rotation.z = elapsed * 8.5
        sp.repairSparks.scale.setScalar(0.5 + sparkBurst * 0.85)
      }
    })

    // 4. Escáneres láser AR, Puente Grúa y pruebas dinámicas
    this.refs.laserScannerBody.position.y = 1.9 + Math.sin(elapsed * 1.8) * 1.45
    this.refs.laserScannerChassis.position.z = Math.sin(elapsed * 1.25) * 3.1
    this.refs.gantryCraneBridge.position.z = Math.sin(elapsed * 0.55) * 2.5
    this.refs.partPuertaSlot.rotation.y = Math.sin(elapsed * 1.15) * 0.22
    this.refs.partAsientosSlot.position.y = 0.32 + Math.sin(elapsed * 3.4) * 0.032

    // 5. Chispas de soldadura en Taller 03
    const weldPulse = Math.max(0, Math.sin(elapsed * 19) * Math.cos(elapsed * 7.5))
    this.refs.weldingFlashLight.intensity = weldPulse * 14
    this.refs.weldingSparks.rotation.y = elapsed * 5.2
    this.refs.weldingSparks.scale.setScalar(0.7 + weldPulse * 0.65)

    // 6. Anillos holográficos y nodos Street View
    this.refs.arRings.forEach((ring, i) => {
      const s = 1 + Math.sin(elapsed * 2.6 + i) * 0.035
      ring.scale.setScalar(s)
    })
    this.waypointMeshes.forEach((wp, i) => {
      const s = 1 + Math.sin(elapsed * 3.2 + i * 0.8) * 0.08
      wp.scale.setScalar(s)
    })
    this.refs.ambientParticles.rotation.y = elapsed * 0.025

    // 7. Pulso en balizas y anillo de selección
    this.refs.bayStatusLights.bay1.emissiveIntensity = 1.1 + Math.sin(elapsed * 3.5) * 0.35
    this.refs.bayStatusLights.bay2.emissiveIntensity = 1.1 + Math.cos(elapsed * 4.0) * 0.4
    if (this.selectionRing.visible) {
      const pulse = 1 + Math.sin(elapsed * 4.5) * 0.04
      this.selectionRing.scale.setScalar(this.selectionBaseScale * pulse)
    }

    // 8. Pantalla de telemetría en vivo
    if (elapsed - this.lastDiagDraw > 0.065) {
      this.materials.updateDiagScreen(elapsed)
      this.lastDiagDraw = elapsed
    }

    // 9. Transición suave de cámara
    if (this.targetCameraPos && this.targetControlsLook && !this.autoTourEnabled) {
      this.camera.position.lerp(this.targetCameraPos, 0.085)
      this.controls.target.lerp(this.targetControlsLook, 0.085)
      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.06) {
        this.targetCameraPos = null
        this.targetControlsLook = null
      }
    }

    this.controls.update()

    // 10. Emitir telemetría de brújula y minimapa Google Maps (~15 FPS)
    if (elapsed - this.lastTelemetryTime > 0.065 && this.callbacks.onCameraTelemetry) {
      const dir = new THREE.Vector3()
        .subVectors(this.controls.target, this.camera.position)
        .setY(0)
      const yawRad = Math.atan2(dir.x, -dir.z)
      const posRef = this.streetViewMode ? this.camera.position : this.controls.target
      this.callbacks.onCameraTelemetry({
        x: posRef.x,
        z: posRef.z,
        yawDeg: THREE.MathUtils.radToDeg(yawRad),
        streetView: this.streetViewMode
      })
      this.lastTelemetryTime = elapsed
    }

    this.renderer.render(this.scene, this.camera)
  }

  public dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationFrameId)
    const dom = this.renderer.domElement
    dom.removeEventListener('pointermove', this.onPointerMove)
    dom.removeEventListener('pointerdown', this.onPointerDown)
    dom.removeEventListener('pointerup', this.onPointerUp)
    dom.removeEventListener('dblclick', this.onDoubleClick)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('resize', this.onResize)
    this.controls.dispose()
    this.materials.dispose()
    this.renderer.dispose()
    if (dom.parentElement) dom.parentElement.removeChild(dom)
  }
}
