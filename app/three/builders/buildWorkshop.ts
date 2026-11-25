import * as THREE from 'three'
import type { WorkshopMaterials } from '../materials'
import { buildHeavyTruck } from './buildTruck'

export interface SpecialistActionRig {
  id: string
  defaultRole: 'engineer' | 'operator'
  nameLabel: string
  targetLabel: string
  root: THREE.Group
  characterSlot: THREE.Group
  characterMesh: THREE.Object3D
  engineerRig: THREE.Group
  scanCone: THREE.Mesh
  scanReticle: THREE.Mesh
  operatorRig: THREE.Group
  repairSparks: THREE.Points
  arcCore: THREE.Mesh
  badgeMat: THREE.SpriteMaterial
  baseX: number
  baseZ: number
  baseRotY: number
  patrolDx: number
  patrolDz: number
}

export interface WorkshopSceneRefs {
  root: THREE.Group
  liftPlatformGroup: THREE.Group
  truckBay1: THREE.Group
  truckBay2: THREE.Group
  diagCart: THREE.Group
  engineStand: THREE.Group
  enginePayloadGroup: THREE.Group
  engineFan: THREE.Group
  tireRack: THREE.Group
  partCarroceriaSlot: THREE.Group
  partCarroceriaMesh: THREE.Object3D
  partPuertaSlot: THREE.Group
  partPuertaMesh: THREE.Object3D
  partChasisSlot: THREE.Group
  partChasisMesh: THREE.Object3D
  partAireSlot: THREE.Group
  partAireMesh: THREE.Object3D
  partTableroSlot: THREE.Group
  partTableroMesh: THREE.Object3D
  partAsientosSlot: THREE.Group
  partAsientosMesh: THREE.Object3D
  specialists: SpecialistActionRig[]
  laserScannerBody: THREE.Mesh
  laserScannerChassis: THREE.Mesh
  gantryCraneBridge: THREE.Group
  airTurbineRotor: THREE.Group
  weldingSparks: THREE.Points
  weldingFlashLight: THREE.PointLight
  arHoloGroup: THREE.Group
  arRings: THREE.Mesh[]
  ambientParticles: THREE.Points
  skyDomeMat: THREE.MeshBasicMaterial
  bayStatusLights: {
    bay1: THREE.MeshStandardMaterial
    bay2: THREE.MeshStandardMaterial
  }
  interactiveGroups: Map<string, THREE.Object3D>
}

function tagInteractive(obj: THREE.Object3D, id: string, map: Map<string, THREE.Object3D>) {
  obj.userData.interactiveId = id
  obj.traverse((child) => {
    child.userData.interactiveId = id
  })
  map.set(id, obj)
}

export function createRoleBadgeTexture(
  roleType: 'engineer' | 'operator',
  nameText: string,
  actionText: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  const isEng = roleType === 'engineer'
  const accent = isEng ? '#38bdf8' : '#f59e0b'

  ctx.fillStyle = 'rgba(5, 11, 24, 0.88)'
  ctx.fillRect(8, 12, 496, 104)
  ctx.strokeStyle = accent
  ctx.lineWidth = 5
  ctx.strokeRect(8, 12, 496, 104)

  ctx.fillStyle = accent
  ctx.fillRect(18, 22, 476, 32)
  ctx.fillStyle = '#040812'
  ctx.font = 'bold 21px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    isEng ? `INGENIERO AUTOMOTRIZ • ${nameText}` : `OPERARIO MECÁNICO • ${nameText}`,
    256,
    38
  )

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 24px system-ui, sans-serif'
  ctx.fillText(actionText, 256, 84)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createZoneSignTexture(
  code: string,
  title: string,
  subtitle: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 1024, 256)
  bg.addColorStop(0, '#050b16')
  bg.addColorStop(0.5, '#0b182e')
  bg.addColorStop(1, '#050b16')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1024, 256)

  ctx.strokeStyle = accentHex
  ctx.lineWidth = 8
  ctx.strokeRect(10, 10, 1004, 236)

  ctx.fillStyle = accentHex
  ctx.fillRect(26, 26, 230, 38)
  ctx.fillStyle = '#040812'
  ctx.font = 'bold 24px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(code, 141, 46)

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 52px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, 512, 122)

  ctx.fillStyle = '#93c5fd'
  ctx.font = '600 26px monospace'
  ctx.fillText(subtitle, 512, 194)

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createBayFloorLabelTexture(
  text: string,
  color = 'rgba(250, 204, 21, 0.85)'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 512, 128)
  ctx.fillStyle = color
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function addContactShadowDecal(
  parent: THREE.Object3D,
  w: number,
  d: number,
  x: number,
  z: number,
  mat: THREE.Material
) {
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat)
  decal.position.set(x, 0.008, z)
  decal.raycast = () => {}
  parent.add(decal)
}

function createArRing(radius: number, colorHex: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(radius * 0.88, radius, 40)
  geo.rotateX(-Math.PI / 2)
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 0.022
  mesh.raycast = () => {}
  return mesh
}

function buildFallbackMechanicMesh(
  materials: WorkshopMaterials,
  withHardHat: boolean
): THREE.Group {
  const m = new THREE.Group()

  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.85, 12)
  const leftLeg = new THREE.Mesh(legGeo, materials.workwearNavy)
  leftLeg.position.set(-0.11, 0.42, 0)
  leftLeg.castShadow = true
  const rightLeg = leftLeg.clone()
  rightLeg.position.x = 0.11

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.62, 0.24), materials.hiVisOrange)
  torso.position.set(0, 1.14, 0)
  torso.castShadow = true

  const armGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.56, 12)
  const leftArm = new THREE.Mesh(armGeo, materials.workwearNavy)
  leftArm.position.set(-0.28, 1.12, 0.08)
  leftArm.rotation.x = -0.45
  const rightArm = new THREE.Mesh(armGeo, materials.workwearNavy)
  rightArm.position.set(0.28, 1.12, 0.12)
  rightArm.rotation.x = -0.65

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), materials.skinTone)
  head.position.set(0, 1.6, 0)
  head.castShadow = true

  m.add(leftLeg, rightLeg, torso, leftArm, rightArm, head)

  if (withHardHat) {
    const hat = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.safetyYellow
    )
    hat.position.set(0, 1.63, 0)
    m.add(hat)
  }

  return m
}

function buildSpecialistActionRig(
  cfg: {
    id: string
    defaultRole: 'engineer' | 'operator'
    nameLabel: string
    targetLabel: string
    x: number
    z: number
    rotY: number
    patrolDx: number
    patrolDz: number
    hardHat: boolean
  },
  materials: WorkshopMaterials
): SpecialistActionRig {
  const root = new THREE.Group()
  root.position.set(cfg.x, 0, cfg.z)
  root.rotation.y = cfg.rotY

  const characterSlot = new THREE.Group()
  const characterMesh = buildFallbackMechanicMesh(materials, cfg.hardHat)
  characterSlot.add(characterMesh)
  root.add(characterSlot)

  // 1. RIG DE INGENIERO AUTOMOTRIZ (Tablet holográfica + Cono de escaneo láser AR + Retícula)
  const engineerRig = new THREE.Group()
  const tabletBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.24, 0.025),
    materials.diagScreenMaterial
  )
  tabletBody.position.set(0, 1.18, 0.36)
  tabletBody.rotation.x = -0.45
  engineerRig.add(tabletBody)

  // Cono volumétrico de escaneo láser que apunta hacia el camión/componente (+Z local)
  const coneGeo = new THREE.CylinderGeometry(0.03, 0.52, 1.85, 20, 1, true)
  coneGeo.rotateX(Math.PI / 2)
  coneGeo.translate(0, 0, 1.05)
  const scanCone = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  scanCone.position.set(0, 1.2, 0.38)
  scanCone.raycast = () => {}
  engineerRig.add(scanCone)

  // Retícula circular holográfica proyectada sobre la pieza inspeccionada
  const scanReticle = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.44, 28),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  scanReticle.position.set(0, 1.2, 2.2)
  scanReticle.raycast = () => {}
  engineerRig.add(scanReticle)
  root.add(engineerRig)

  // 2. RIG DE OPERARIO DE REPARACIÓN (Soplete / Pistola de Impacto + Arco + Chispas 3D)
  const operatorRig = new THREE.Group()
  const toolGun = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.42), materials.toolRed)
  toolGun.position.set(0.18, 1.05, 0.38)
  const toolNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.32, 10).rotateX(Math.PI / 2),
    materials.chrome
  )
  toolNozzle.position.set(0.18, 1.05, 0.68)
  operatorRig.add(toolGun, toolNozzle)

  const arcCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.92
    })
  )
  arcCore.position.set(0.18, 1.05, 0.88)
  arcCore.raycast = () => {}
  operatorRig.add(arcCore)

  // Partículas de chispas de reparación en la punta de la herramienta
  const spCount = 28
  const spPos = new Float32Array(spCount * 3)
  for (let i = 0; i < spCount; i++) {
    spPos[i * 3] = (Math.random() - 0.5) * 0.5
    spPos[i * 3 + 1] = (Math.random() - 0.3) * 0.5
    spPos[i * 3 + 2] = Math.random() * 0.55
  }
  const spGeo = new THREE.BufferGeometry()
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3))
  const repairSparks = new THREE.Points(
    spGeo,
    new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.075,
      transparent: true,
      opacity: 0.9
    })
  )
  repairSparks.position.set(0.18, 1.05, 0.88)
  repairSparks.raycast = () => {}
  operatorRig.add(repairSparks)
  root.add(operatorRig)

  // 3. Etiqueta Holográfica 3D Flotante sobre el Especialista
  const badgeTex = createRoleBadgeTexture(
    cfg.defaultRole,
    cfg.nameLabel,
    cfg.defaultRole === 'engineer'
      ? `INSPECCIONANDO: ${cfg.targetLabel}`
      : `REPARANDO: ${cfg.targetLabel}`
  )
  const badgeMat = new THREE.SpriteMaterial({
    map: badgeTex,
    transparent: true,
    depthWrite: false
  })
  const badgeSprite = new THREE.Sprite(badgeMat)
  badgeSprite.position.set(0, 2.15, 0)
  badgeSprite.scale.set(1.85, 0.46, 1)
  badgeSprite.raycast = () => {}
  root.add(badgeSprite)

  engineerRig.visible = cfg.defaultRole === 'engineer'
  operatorRig.visible = cfg.defaultRole === 'operator'

  return {
    id: cfg.id,
    defaultRole: cfg.defaultRole,
    nameLabel: cfg.nameLabel,
    targetLabel: cfg.targetLabel,
    root,
    characterSlot,
    characterMesh,
    engineerRig,
    scanCone,
    scanReticle,
    operatorRig,
    repairSparks,
    arcCore,
    badgeMat,
    baseX: cfg.x,
    baseZ: cfg.z,
    baseRotY: cfg.rotY,
    patrolDx: cfg.patrolDx,
    patrolDz: cfg.patrolDz
  }
}

function buildFallbackCarroceria(materials: WorkshopMaterials): THREE.Group {
  const g = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.35, 6.8), materials.volvoBluePaint)
  shell.position.y = 1.18
  shell.castShadow = true
  shell.receiveShadow = true
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.42, 2.4), materials.volvoBluePaint)
  roof.position.set(0, 2.52, 1.8)
  roof.castShadow = true
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.92, 0.08), materials.glass)
  windshield.position.set(0, 1.68, 3.41)
  g.add(shell, roof, windshield)
  return g
}

function buildFallbackPuerta(materials: WorkshopMaterials): THREE.Group {
  const g = new THREE.Group()
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 1.18), materials.volvoBluePaint)
  lower.position.y = 0.48
  lower.castShadow = true
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 1.14), materials.darkSteel)
  windowFrame.position.y = 1.3
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.98), materials.glass)
  glass.position.y = 1.3
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.16), materials.chrome)
  mirror.position.set(0.14, 1.28, 0.48)
  g.add(lower, windowFrame, glass, mirror)
  return g
}

// Chasis de respaldo de 7.45m x 2.95m (exactamente del mismo tamaño que los 2 camiones)
function buildFallbackChasis(materials: WorkshopMaterials): THREE.Group {
  const g = new THREE.Group()
  const railGeo = new THREE.BoxGeometry(0.22, 0.38, 7.45)
  for (const x of [-0.72, 0.72]) {
    const rail = new THREE.Mesh(railGeo, materials.darkSteel)
    rail.position.set(x, 0.55, 0)
    rail.castShadow = true
    g.add(rail)
  }
  const crossGeo = new THREE.BoxGeometry(1.55, 0.24, 0.22)
  for (const z of [-3.3, -1.7, 0, 1.7, 3.3]) {
    const cross = new THREE.Mesh(crossGeo, materials.brushedMetal)
    cross.position.set(0, 0.55, z)
    cross.castShadow = true
    g.add(cross)
  }
  const axleGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.95, 14).rotateZ(Math.PI / 2)
  for (const az of [-2.75, -1.35, 2.55]) {
    const axle = new THREE.Mesh(axleGeo, materials.darkSteel)
    axle.position.set(0, 0.45, az)
    g.add(axle)
  }
  const fifthWheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.66, 0.16, 20),
    materials.chrome
  )
  fifthWheel.position.set(0, 0.82, -1.9)
  g.add(fifthWheel)
  return g
}

function buildFallbackAire(materials: WorkshopMaterials): THREE.Group {
  const g = new THREE.Group()
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.68, 0.75), materials.darkSteel)
  housing.position.y = 0.34
  housing.castShadow = true
  const tank1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.88, 18).rotateZ(Math.PI / 2),
    materials.brushedMetal
  )
  tank1.position.set(0, 0.82, -0.15)
  tank1.castShadow = true
  const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.55, 18), materials.oilBlue)
  filter.position.set(0.28, 0.82, 0.22)
  g.add(housing, tank1, filter)
  return g
}

function buildFallbackTablero(materials: WorkshopMaterials): THREE.Group {
  const g = new THREE.Group()
  const dashBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 0.68), materials.darkSteel)
  dashBody.position.y = 0.32
  dashBody.castShadow = true
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.32, 0.06),
    materials.diagScreenMaterial
  )
  screen.position.set(-0.35, 0.72, 0.18)
  screen.rotation.x = -0.25
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.032, 12, 24), materials.rubber)
  wheel.position.set(-0.52, 0.74, 0.42)
  wheel.rotation.x = 0.6
  g.add(dashBody, screen, wheel)
  return g
}

function buildFallbackAsientos(materials: WorkshopMaterials): THREE.Group {
  const g = new THREE.Group()
  for (const x of [-0.46, 0.46]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.54), materials.darkSteel)
    base.position.set(x, 0.17, 0)
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.58), materials.workwearNavy)
    cushion.position.set(x, 0.42, 0.04)
    cushion.castShadow = true
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.92, 0.16), materials.workwearNavy)
    back.position.set(x, 0.94, -0.2)
    back.rotation.x = -0.12
    back.castShadow = true
    const headrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.24, 0.14),
      materials.hiVisOrange
    )
    headrest.position.set(x, 1.48, -0.26)
    g.add(base, cushion, back, headrest)
  }
  return g
}

export function buildWorkshopScene(materials: WorkshopMaterials): WorkshopSceneRefs {
  const root = new THREE.Group()
  const interactiveGroups = new Map<string, THREE.Object3D>()
  const arHoloGroup = new THREE.Group()
  const arRings: THREE.Mesh[] = []
  root.add(arHoloGroup)

  // 0. Domo de cielo 360°
  const skyDomeMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    depthWrite: false
  })
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(85, 36, 24), skyDomeMat)
  skyDome.raycast = () => {}
  root.add(skyDome)

  const holoGrid = new THREE.GridHelper(130, 65, 0x38bdf8, 0x1e3a5f)
  holoGrid.position.y = -0.02
  ;(holoGrid.material as THREE.Material).transparent = true
  ;(holoGrid.material as THREE.Material).opacity = 0.28
  arHoloGroup.add(holoGrid)

  // 1. Suelo de concreto epóxico industrial (72m x 38m)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(72, 38), materials.concreteFloor)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  root.add(floor)

  const lineMat = materials.safetyYellow
  const createFloorLine = (w: number, d: number, x: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.014, d), lineMat)
    mesh.position.set(x, 0.008, z)
    mesh.receiveShadow = true
    root.add(mesh)
  }

  // Demarcaciones de los 4 talleres
  createFloorLine(0.13, 11.4, -9.3, -1)
  createFloorLine(0.13, 11.4, -1.7, -1)
  createFloorLine(0.13, 11.4, 5.9, -1)
  createFloorLine(15.33, 0.13, -1.7, 4.7)
  createFloorLine(15.33, 0.13, -1.7, -6.7)

  createFloorLine(0.13, 11.4, 16.0, -1.5)
  createFloorLine(0.13, 11.4, 31.8, -1.5)
  createFloorLine(15.9, 0.13, 23.9, 4.2)
  createFloorLine(15.9, 0.13, 23.9, -7.2)

  createFloorLine(0.13, 11.4, -31.8, -1.5)
  createFloorLine(0.13, 11.4, -16.0, -1.5)
  createFloorLine(15.9, 0.13, -23.9, 4.2)
  createFloorLine(15.9, 0.13, -23.9, -7.2)

  createFloorLine(0.13, 7.6, -9.0, 12.6)
  createFloorLine(0.13, 7.6, 9.0, 12.6)
  createFloorLine(18.1, 0.13, 0, 8.8)
  createFloorLine(18.1, 0.13, 0, 16.4)

  const floorLabels: [string, number, number, string][] = [
    ['TALLER 01 • BAHÍA FH', -5.5, 5.4, 'rgba(56, 189, 248, 0.9)'],
    ['TALLER 01 • BAHÍA FMX', 2.0, 5.4, 'rgba(250, 204, 21, 0.9)'],
    ['TALLER 02 • CARROCERÍA Y PUERTAS', 23.9, 5.0, 'rgba(192, 132, 252, 0.92)'],
    ['TALLER 03 • CHASIS Y NEUMÁTICA', -23.9, 5.0, 'rgba(251, 191, 36, 0.92)'],
    ['TALLER 04 • LAB. TABLERO Y ASIENTOS', 0, 8.1, 'rgba(74, 222, 128, 0.92)']
  ]
  for (const [text, lx, lz, col] of floorLabels) {
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 0.85).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        map: createBayFloorLabelTexture(text, col),
        transparent: true,
        depthWrite: false
      })
    )
    labelMesh.position.set(lx, 0.012, lz)
    labelMesh.raycast = () => {}
    root.add(labelMesh)
  }

  // 2. Muros, cerchas y rótulos luminosos de los 4 talleres
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(72, 10.2, 0.42), materials.wallPanel)
  backWall.position.set(0, 5.1, -12.5)
  backWall.receiveShadow = true
  root.add(backWall)

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 10.2, 38), materials.wallPanel)
  leftWall.position.set(-35.8, 5.1, 6.5)
  leftWall.receiveShadow = true
  root.add(leftWall)

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 10.2, 38), materials.wallPanel)
  rightWall.position.set(35.8, 5.1, 6.5)
  rightWall.receiveShadow = true
  root.add(rightWall)

  const backDado = new THREE.Mesh(new THREE.BoxGeometry(71.8, 1.7, 0.48), materials.darkSteel)
  backDado.position.set(0, 0.85, -12.45)
  root.add(backDado)

  const backHazardTrim = new THREE.Mesh(
    new THREE.BoxGeometry(71.8, 0.16, 0.5),
    materials.hazardStripe
  )
  backHazardTrim.position.set(0, 1.72, -12.44)
  root.add(backHazardTrim)

  const lampGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xbae6fd,
    emissiveIntensity: 2.5,
    roughness: 0.1
  })

  for (const x of [-30, -22, -14, -5.5, 2.0, 10.5, 18, 26, 33]) {
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10.0, 0.4), materials.darkSteel)
    column.position.set(x, 5.0, -12.15)
    column.castShadow = true
    root.add(column)

    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 28), materials.darkSteel)
    truss.position.set(x, 9.5, 1.0)
    root.add(truss)

    for (const lz of [-4.5, 1.5, 9.5]) {
      const lampHousing = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.14, 0.52),
        materials.darkSteel
      )
      lampHousing.position.set(x, 9.15, lz)
      root.add(lampHousing)

      const lampGlow = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.05, 0.38), lampGlowMat)
      lampGlow.position.set(x, 9.06, lz)
      root.add(lampGlow)
    }
  }

  const createSignMesh = (
    code: string,
    title: string,
    sub: string,
    accent: string,
    w: number,
    h: number
  ) => {
    const tex = createZoneSignTexture(code, title, sub, accent)
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(accent),
      emissiveMap: tex,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.4
    })
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), mat)
  }

  const signTaller1 = createSignMesh(
    'TALLER 01',
    'TREN MOTRIZ Y SERVICIO PESADO',
    'BAHÍA 1: VOLVO FH16  •  BAHÍA 2: VOLVO FMX  •  MOTOR D16',
    '#38bdf8',
    10.5,
    2.3
  )
  signTaller1.position.set(-1.75, 7.5, -12.1)
  root.add(signTaller1)

  const signTaller2 = createSignMesh(
    'TALLER 02',
    'CARROCERÍA, CABINA Y PUERTAS',
    'CELDA DE ESCANEO LÁSER AR  •  CARROCERIA.GLB & PUERTA.GLB',
    '#a855f7',
    10.2,
    2.3
  )
  signTaller2.position.set(23.9, 7.5, -12.1)
  root.add(signTaller2)

  const signTaller3 = createSignMesh(
    'TALLER 03',
    'CHASIS ESTRUCTURAL Y NEUMÁTICA',
    'PUENTE GRÚA Y LABORATORIO DE AIRE  •  CHASIS.GLB & AIRE.GLB',
    '#f59e0b',
    10.2,
    2.3
  )
  signTaller3.position.set(-23.9, 7.5, -12.1)
  root.add(signTaller3)

  const signTaller4 = createSignMesh(
    'TALLER 04',
    'LAB. TABLERO DIGITAL Y ASIENTOS',
    'SIMULACIÓN CAN-BUS J1939 Y CONFORT  •  TABLERO.GLB & ASIENTOS.GLB',
    '#22c55e',
    8.6,
    1.85
  )
  signTaller4.position.set(0, 5.2, 16.9)
  signTaller4.rotation.y = Math.PI
  root.add(signTaller4)

  for (const px of [-4.4, 4.4]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.5, 0.24), materials.darkSteel)
    pillar.position.set(px, 2.75, 16.9)
    root.add(pillar)
  }

  for (const x of [-23.9, -5.5, 2.0, 23.9]) {
    const doorGroup = new THREE.Group()
    doorGroup.position.set(x, 0, -12.22)

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5.65, 0.24), materials.darkSteel)
    doorFrame.position.y = 2.825
    doorGroup.add(doorFrame)

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(5.15, 5.45, 0.18),
      materials.brushedMetal
    )
    doorPanel.position.set(0, 2.75, 0.04)
    doorPanel.receiveShadow = true
    doorGroup.add(doorPanel)

    for (let sy = 0.75; sy <= 4.9; sy += 0.72) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(5.16, 0.04, 0.2), materials.darkSteel)
      seam.position.set(0, sy, 0.05)
      doorGroup.add(seam)
    }

    for (const wx of [-1.5, -0.5, 0.5, 1.5]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.21), materials.glass)
      win.position.set(wx, 3.95, 0.05)
      doorGroup.add(win)
    }

    const bollardGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.15, 14)
    for (const bx of [-2.85, 2.85]) {
      const bollard = new THREE.Mesh(bollardGeo, materials.safetyYellow)
      bollard.position.set(bx, 0.575, 0.35)
      bollard.castShadow = true
      doorGroup.add(bollard)
    }

    root.add(doorGroup)
  }

  const bay1LightMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 1.6
  })
  const bay2LightMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.6
  })
  const beacon1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bay1LightMat)
  beacon1.position.set(-5.5, 5.9, -11.95)
  const beacon2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bay2LightMat)
  beacon2.position.set(2.0, 5.9, -11.95)
  root.add(beacon1, beacon2)

  // ============================================================================
  // 3. TALLER 01: TREN MOTRIZ
  // ============================================================================
  const liftGroup = new THREE.Group()
  liftGroup.position.set(-5.5, 0, -1)

  const colPositions: [number, number][] = [
    [-2.22, -3.35],
    [2.22, -3.35],
    [-2.22, 3.35],
    [2.22, 3.35]
  ]
  for (const [cx, cz] of colPositions) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.35, 0.3), materials.volvoBluePaint)
    post.position.set(cx, 2.175, cz)
    post.castShadow = true
    post.receiveShadow = true
    liftGroup.add(post)

    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.14), materials.brushedMetal)
    rail.position.set(cx > 0 ? cx - 0.13 : cx + 0.13, 2.15, cz)
    liftGroup.add(rail)

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), materials.darkSteel)
    base.position.set(cx, 0.06, cz)
    base.castShadow = true
    liftGroup.add(base)

    addContactShadowDecal(liftGroup, 0.95, 0.95, cx, cz, materials.contactShadow)
  }
  tagInteractive(liftGroup, 'lift-bay1', interactiveGroups)
  root.add(liftGroup)

  const liftPlatformGroup = new THREE.Group()
  liftPlatformGroup.position.set(-5.5, 0, -1)

  const runwayGeo = new THREE.BoxGeometry(1.12, 0.14, 8.6)
  for (const rx of [-1.12, 1.12]) {
    const runway = new THREE.Mesh(runwayGeo, materials.darkSteel)
    runway.position.set(rx, 0.08, 0)
    runway.castShadow = true
    runway.receiveShadow = true
    liftPlatformGroup.add(runway)

    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.15, 8.6),
      materials.safetyYellow
    )
    sideTrim.position.set(rx > 0 ? rx + 0.55 : rx - 0.55, 0.085, 0)
    liftPlatformGroup.add(sideTrim)

    const approachRamp = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, 0.06, 0.85),
      materials.safetyYellow
    )
    approachRamp.position.set(rx, 0.05, 4.65)
    approachRamp.rotation.x = 0.11
    liftPlatformGroup.add(approachRamp)

    const wheelStop = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, 0.16, 0.14),
      materials.safetyYellow
    )
    wheelStop.position.set(rx, 0.2, -4.22)
    liftPlatformGroup.add(wheelStop)
  }

  for (const bz of [-3.35, 3.35]) {
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.18, 0.34), materials.darkSteel)
    crossBeam.position.set(0, 0.09, bz)
    crossBeam.castShadow = true
    liftPlatformGroup.add(crossBeam)
  }

  const truckBay1 = buildHeavyTruck('fh-tractor', materials, 'truck-fh-bay1')
  truckBay1.position.set(0, 0.15, 0)
  liftPlatformGroup.add(truckBay1)
  interactiveGroups.set('truck-fh-bay1', truckBay1)
  root.add(liftPlatformGroup)

  const pitGroup = new THREE.Group()
  pitGroup.position.set(2.0, 0.015, -1)

  const pitInterior = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.04, 8.2),
    new THREE.MeshStandardMaterial({ color: 0x070a0f, roughness: 0.92 })
  )
  pitGroup.add(pitInterior)

  const pitLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xbae6fd,
    emissiveIntensity: 2.2
  })
  for (const px of [-0.64, 0.64]) {
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 7.4), pitLedMat)
    ledStrip.position.set(px, 0.03, 0)
    pitGroup.add(ledStrip)
  }

  const pitBorderL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 8.6), materials.hazardStripe)
  pitBorderL.position.set(-0.8, 0.015, 0)
  const pitBorderR = pitBorderL.clone()
  pitBorderR.position.x = 0.8
  pitGroup.add(pitBorderL, pitBorderR)

  const pitBorderFront = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 0.055, 0.22),
    materials.hazardStripe
  )
  pitBorderFront.position.set(0, 0.015, 4.2)
  const pitBorderBack = pitBorderFront.clone()
  pitBorderBack.position.z = -4.2
  pitGroup.add(pitBorderFront, pitBorderBack)

  tagInteractive(pitGroup, 'inspection-pit', interactiveGroups)
  root.add(pitGroup)

  const truckBay2 = buildHeavyTruck('fmx-rigid', materials, 'truck-fmx-bay2')
  truckBay2.position.set(2.0, 0, -1.0)
  root.add(truckBay2)
  interactiveGroups.set('truck-fmx-bay2', truckBay2)

  const diagCart = new THREE.Group()
  diagCart.position.set(4.55, 0, 1.35)
  const diagBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.65), materials.darkSteel)
  diagBody.position.y = 0.62
  diagBody.castShadow = true
  const diagScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.5, 0.06),
    materials.diagScreenMaterial
  )
  diagScreen.position.set(0, 1.45, -0.05)
  diagScreen.rotation.y = -0.35
  diagCart.add(diagBody, diagScreen)
  addContactShadowDecal(diagCart, 1.3, 1.1, 0, 0, materials.contactShadow)
  tagInteractive(diagCart, 'diag-station', interactiveGroups)
  root.add(diagCart)

  const toolGroup = new THREE.Group()
  toolGroup.position.set(-9.9, 0, 1.4)
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.96, 0.64), materials.toolRed)
  cartBody.position.y = 0.56
  cartBody.castShadow = true
  const cartTop = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.06, 0.68), materials.darkSteel)
  cartTop.position.y = 1.06
  for (const dy of [0.32, 0.56, 0.8]) {
    const drawerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.03, 0.04), materials.chrome)
    drawerHandle.position.set(0, dy, 0.34)
    toolGroup.add(drawerHandle)
  }
  const jackBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.95), materials.safetyYellow)
  jackBody.position.set(1.05, 0.14, 0.3)
  const jackHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.25, 10),
    materials.chrome
  )
  jackHandle.position.set(1.05, 0.68, 0.85)
  jackHandle.rotation.x = 0.4
  toolGroup.add(cartBody, cartTop, jackBody, jackHandle)
  addContactShadowDecal(toolGroup, 1.6, 1.1, 0, 0, materials.contactShadow)
  tagInteractive(toolGroup, 'tool-cart-1', interactiveGroups)
  root.add(toolGroup)

  const benchGroup = new THREE.Group()
  benchGroup.position.set(-13.4, 0, -2.5)
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 3.6), materials.brushedMetal)
  benchTop.position.y = 0.95
  benchTop.castShadow = true
  const benchBase = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.9, 3.4), materials.darkSteel)
  benchBase.position.y = 0.45
  const lampArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
    materials.safetyYellow
  )
  lampArm.position.set(0.2, 1.5, 0.8)
  benchGroup.add(benchTop, benchBase, lampArm)
  addContactShadowDecal(benchGroup, 1.6, 4.1, 0, 0, materials.contactShadow)
  tagInteractive(benchGroup, 'workbench-1', interactiveGroups)
  root.add(benchGroup)

  const compGroup = new THREE.Group()
  compGroup.position.set(-12.5, 0, -9.8)
  const compTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 1.95, 22).rotateZ(Math.PI / 2),
    materials.volvoBluePaint
  )
  compTank.position.y = 0.62
  compTank.castShadow = true
  const compMotor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.55), materials.darkSteel)
  compMotor.position.set(0, 1.25, 0)
  compGroup.add(compTank, compMotor)
  addContactShadowDecal(compGroup, 2.4, 1.3, 0, 0, materials.contactShadow)
  tagInteractive(compGroup, 'air-compressor', interactiveGroups)
  root.add(compGroup)

  const partsRack = new THREE.Group()
  partsRack.position.set(11.2, 0, -8.5)
  for (const y of [0.3, 1.35, 2.4, 3.45]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 1.1), materials.darkSteel)
    shelf.position.y = y
    shelf.castShadow = true
    partsRack.add(shelf)
  }
  for (const x of [-2.05, 0, 2.05]) {
    for (const z of [-0.5, 0.5]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.8, 0.08), materials.safetyYellow)
      post.position.set(x, 1.9, z)
      partsRack.add(post)
    }
  }
  for (let i = 0; i < 4; i++) {
    const oilCan = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.32), materials.oilBlue)
    oilCan.position.set(-1.5 + i * 0.55, 0.6, 0)
    partsRack.add(oilCan)

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.55), materials.cardboard)
    box.position.set(-1.4 + i * 0.9, 1.65, 0)
    partsRack.add(box)
  }
  addContactShadowDecal(partsRack, 4.6, 1.6, 0, 0, materials.contactShadow)
  tagInteractive(partsRack, 'rack-parts', interactiveGroups)
  root.add(partsRack)

  const tireRack = new THREE.Group()
  tireRack.position.set(12.2, 0, -2.5)
  const spareTireGeo = new THREE.TorusGeometry(0.45, 0.17, 16, 28)
  for (let i = 0; i < 6; i++) {
    const tire = new THREE.Mesh(spareTireGeo, materials.rubber)
    tire.position.set(0, 0.56, -1.7 + i * 0.68)
    tire.rotation.y = Math.PI / 2
    tire.castShadow = true
    tireRack.add(tire)
  }
  addContactShadowDecal(tireRack, 1.5, 4.6, 0, 0, materials.contactShadow)
  tagInteractive(tireRack, 'rack-tires', interactiveGroups)
  root.add(tireRack)

  const engineStand = new THREE.Group()
  engineStand.position.set(10.2, 0, 2.2)
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.5), materials.toolRed)
  standBase.position.y = 0.08
  standBase.castShadow = true
  const standPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.05, 0.2), materials.toolRed)
  standPost.position.set(0, 0.6, -0.5)

  const enginePayloadGroup = new THREE.Group()
  const spareBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.78, 1.15),
    materials.brushedMetal
  )
  spareBlock.position.set(0, 1.05, 0.15)
  spareBlock.castShadow = true

  const engineFan = new THREE.Group()
  engineFan.position.set(0, 1.05, 0.78)
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.03), materials.darkSteel)
    blade.rotation.z = (i * Math.PI) / 4
    engineFan.add(blade)
  }
  enginePayloadGroup.add(spareBlock, engineFan)

  engineStand.add(standBase, standPost, enginePayloadGroup)
  addContactShadowDecal(engineStand, 1.8, 1.9, 0, 0, materials.contactShadow)
  tagInteractive(engineStand, 'spare-engine-stand', interactiveGroups)
  root.add(engineStand)

  // ============================================================================
  // 4. TALLER 02: CARROCERÍA Y PUERTAS
  // ============================================================================
  const bodyCellGroup = new THREE.Group()
  bodyCellGroup.position.set(21.5, 0, -1.6)

  const turntable = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.14, 7.6),
    materials.darkSteel
  )
  turntable.position.y = 0.07
  turntable.receiveShadow = true
  bodyCellGroup.add(turntable)

  for (const gx of [-2.4, 2.4]) {
    const archPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.4, 0.24), materials.darkSteel)
    archPost.position.set(gx, 2.2, 0)
    bodyCellGroup.add(archPost)
  }
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 0.28), materials.darkSteel)
  archTop.position.set(0, 4.4, 0)
  bodyCellGroup.add(archTop)

  const laserScannerBody = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 6.8).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  laserScannerBody.position.set(0, 1.8, 0)
  laserScannerBody.raycast = () => {}
  bodyCellGroup.add(laserScannerBody)

  const partCarroceriaSlot = new THREE.Group()
  partCarroceriaSlot.position.set(0, 0.14, 0)
  const partCarroceriaMesh = buildFallbackCarroceria(materials)
  partCarroceriaSlot.add(partCarroceriaMesh)
  bodyCellGroup.add(partCarroceriaSlot)

  const ringCarroceria = createArRing(3.8, 0xa855f7)
  ringCarroceria.position.set(21.5, 0.025, -1.6)
  arHoloGroup.add(ringCarroceria)
  arRings.push(ringCarroceria)

  tagInteractive(bodyCellGroup, 'part-carroceria', interactiveGroups)
  root.add(bodyCellGroup)

  const doorStationGroup = new THREE.Group()
  doorStationGroup.position.set(28.8, 0, -1.2)

  const jigBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 2.1), materials.darkSteel)
  jigBase.position.y = 0.07
  jigBase.receiveShadow = true
  const jigPillar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.3, 0.18), materials.safetyYellow)
  jigPillar.position.set(-0.55, 1.15, -0.75)
  doorStationGroup.add(jigBase, jigPillar)

  const partPuertaSlot = new THREE.Group()
  partPuertaSlot.position.set(0, 0.35, 0)
  const partPuertaMesh = buildFallbackPuerta(materials)
  partPuertaSlot.add(partPuertaMesh)
  doorStationGroup.add(partPuertaSlot)

  const ringPuerta = createArRing(1.6, 0x38bdf8)
  ringPuerta.position.set(28.8, 0.025, -1.2)
  arHoloGroup.add(ringPuerta)
  arRings.push(ringPuerta)

  tagInteractive(doorStationGroup, 'part-puerta', interactiveGroups)
  root.add(doorStationGroup)

  // ============================================================================
  // 5. TALLER 03: CHASIS ESTRUCTURAL (7.45m x 2.95m, MISMO TAMAÑO QUE LOS CAMIONES) Y NEUMÁTICA
  // ============================================================================
  const chassisStationGroup = new THREE.Group()
  chassisStationGroup.position.set(-21.6, 0, -1.2)

  // Caballetes hidráulicos anchos (2.85m) para soportar el chasis de tamaño completo de camión
  for (const sz of [-2.75, 0, 2.75]) {
    const trestle = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.36, 0.26), materials.safetyYellow)
    trestle.position.set(0, 0.18, sz)
    trestle.castShadow = true
    chassisStationGroup.add(trestle)
  }

  for (const gx of [-3.4, 3.4]) {
    for (const gz of [-5.2, 4.8]) {
      const craneCol = new THREE.Mesh(new THREE.BoxGeometry(0.26, 6.8, 0.26), materials.darkSteel)
      craneCol.position.set(gx, 3.4, gz)
      chassisStationGroup.add(craneCol)
    }
    const craneRail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 10.6), materials.safetyYellow)
    craneRail.position.set(gx, 6.8, -0.2)
    chassisStationGroup.add(craneRail)
  }

  const gantryCraneBridge = new THREE.Group()
  gantryCraneBridge.position.set(0, 6.95, 0)
  const bridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.32, 0.38), materials.safetyYellow)
  const hoistTrolley = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.65), materials.toolRed)
  hoistTrolley.position.y = -0.25
  const cableL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 4.6, 8),
    materials.chrome
  )
  cableL.position.set(-0.65, -2.5, 0)
  const cableR = cableL.clone()
  cableR.position.x = 0.65
  gantryCraneBridge.add(bridgeBeam, hoistTrolley, cableL, cableR)
  chassisStationGroup.add(gantryCraneBridge)

  const laserScannerChassis = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.4),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  laserScannerChassis.position.set(0, 1.3, 0)
  laserScannerChassis.raycast = () => {}
  chassisStationGroup.add(laserScannerChassis)

  const partChasisSlot = new THREE.Group()
  partChasisSlot.position.set(0, 0.36, 0)
  const partChasisMesh = buildFallbackChasis(materials)
  partChasisSlot.add(partChasisMesh)
  chassisStationGroup.add(partChasisSlot)

  const ringChasis = createArRing(4.1, 0xf59e0b)
  ringChasis.position.set(-21.6, 0.025, -1.2)
  arHoloGroup.add(ringChasis)
  arRings.push(ringChasis)

  tagInteractive(chassisStationGroup, 'part-chasis', interactiveGroups)
  root.add(chassisStationGroup)

  const sparkCount = 45
  const sparkPositions = new Float32Array(sparkCount * 3)
  for (let i = 0; i < sparkCount; i++) {
    sparkPositions[i * 3] = (Math.random() - 0.5) * 0.6
    sparkPositions[i * 3 + 1] = Math.random() * 0.6
    sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.6
  }
  const sparkGeo = new THREE.BufferGeometry()
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
  const weldingSparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.09,
      transparent: true,
      opacity: 0.9
    })
  )
  weldingSparks.position.set(-20.4, 1.15, -0.5)
  weldingSparks.raycast = () => {}
  root.add(weldingSparks)

  const weldingFlashLight = new THREE.PointLight(0x38bdf8, 8, 6)
  weldingFlashLight.position.set(-20.4, 1.3, -0.5)
  root.add(weldingFlashLight)

  // Laboratorio de Aire (aire.glb)
  const airStationGroup = new THREE.Group()
  airStationGroup.position.set(-29.2, 0, -1.2)

  const airBench = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.82, 1.45), materials.darkSteel)
  airBench.position.y = 0.41
  airBench.castShadow = true
  const airBenchTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.08, 1.55),
    materials.brushedMetal
  )
  airBenchTop.position.y = 0.85
  airStationGroup.add(airBench, airBenchTop)

  const airTurbineRotor = new THREE.Group()
  airTurbineRotor.position.set(0.75, 1.15, 0.55)
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.02), materials.safetyYellow)
    blade.rotation.z = (i * Math.PI) / 3
    airTurbineRotor.add(blade)
  }
  airStationGroup.add(airTurbineRotor)

  const partAireSlot = new THREE.Group()
  partAireSlot.position.set(0, 0.89, 0)
  const partAireMesh = buildFallbackAire(materials)
  partAireSlot.add(partAireMesh)
  airStationGroup.add(partAireSlot)

  const ringAire = createArRing(1.65, 0x38bdf8)
  ringAire.position.set(-29.2, 0.025, -1.2)
  arHoloGroup.add(ringAire)
  arRings.push(ringAire)

  tagInteractive(airStationGroup, 'part-aire', interactiveGroups)
  root.add(airStationGroup)

  // ============================================================================
  // 6. TALLER 04: LAB. TABLERO DIGITAL Y ASIENTOS
  // ============================================================================
  const dashStationGroup = new THREE.Group()
  dashStationGroup.position.set(-3.8, 0, 12.2)

  const dashStand = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.78, 1.15), materials.darkSteel)
  dashStand.position.y = 0.39
  dashStand.castShadow = true
  const dashPad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.25), materials.volvoBluePaint)
  dashPad.position.y = 0.81
  dashStationGroup.add(dashStand, dashPad)

  const partTableroSlot = new THREE.Group()
  partTableroSlot.position.set(0, 0.84, 0)
  const partTableroMesh = buildFallbackTablero(materials)
  partTableroSlot.add(partTableroMesh)
  dashStationGroup.add(partTableroSlot)

  const ringTablero = createArRing(1.9, 0x22c55e)
  ringTablero.position.set(-3.8, 0.025, 12.2)
  arHoloGroup.add(ringTablero)
  arRings.push(ringTablero)

  tagInteractive(dashStationGroup, 'part-tablero', interactiveGroups)
  root.add(dashStationGroup)

  const seatsStationGroup = new THREE.Group()
  seatsStationGroup.position.set(3.8, 0, 12.2)

  const vibBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.6, 0.32, 28),
    materials.darkSteel
  )
  vibBase.position.y = 0.16
  vibBase.castShadow = true
  seatsStationGroup.add(vibBase)

  const partAsientosSlot = new THREE.Group()
  partAsientosSlot.position.set(0, 0.32, 0)
  const partAsientosMesh = buildFallbackAsientos(materials)
  partAsientosSlot.add(partAsientosMesh)
  seatsStationGroup.add(partAsientosSlot)

  const ringAsientos = createArRing(1.85, 0x22c55e)
  ringAsientos.position.set(3.8, 0.025, 12.2)
  arHoloGroup.add(ringAsientos)
  arRings.push(ringAsientos)

  tagInteractive(seatsStationGroup, 'part-asientos', interactiveGroups)
  root.add(seatsStationGroup)

  // ============================================================================
  // 7. EQUIPO DE 8 ESPECIALISTAS (INGENIEROS AUTOMOTRICES + OPERARIOS DE REPARACIÓN)
  // ============================================================================
  const specialistConfigs: {
    id: string
    defaultRole: 'engineer' | 'operator'
    nameLabel: string
    targetLabel: string
    x: number
    z: number
    rotY: number
    patrolDx: number
    patrolDz: number
    hardHat: boolean
  }[] = [
    {
      id: 'mechanic-1',
      defaultRole: 'operator',
      nameLabel: 'CARLOS MÉNDEZ',
      targetLabel: 'MOTOR VOLVO FH16',
      x: -7.7,
      z: 1.2,
      rotY: 1.25,
      patrolDx: 0.25,
      patrolDz: 1.15,
      hardHat: true
    },
    {
      id: 'mechanic-2',
      defaultRole: 'engineer',
      nameLabel: 'ING. LAURA MORALES',
      targetLabel: 'TELEMETRÍA VOLVO FMX',
      x: 4.1,
      z: 1.4,
      rotY: -1.45,
      patrolDx: 0.2,
      patrolDz: 1.25,
      hardHat: false
    },
    {
      id: 'mechanic-3',
      defaultRole: 'engineer',
      nameLabel: 'ING. MARCO RUIZ',
      targetLabel: 'CARROCERÍA.GLB',
      x: 18.8,
      z: -1.2,
      rotY: 1.48,
      patrolDx: 0.2,
      patrolDz: 1.35,
      hardHat: true
    },
    {
      id: 'mechanic-4',
      defaultRole: 'operator',
      nameLabel: 'SOFÍA VEGA',
      targetLabel: 'PUERTA.GLB',
      x: 27.1,
      z: -0.2,
      rotY: 1.85,
      patrolDx: 0.35,
      patrolDz: 0.55,
      hardHat: true
    },
    {
      id: 'mechanic-5',
      defaultRole: 'operator',
      nameLabel: 'DIEGO HERRERA',
      targetLabel: 'CHASIS.GLB 6x4',
      x: -19.2,
      z: -0.8,
      rotY: -1.52,
      patrolDx: 0.22,
      patrolDz: 1.45,
      hardHat: true
    },
    {
      id: 'mechanic-6',
      defaultRole: 'engineer',
      nameLabel: 'ING. ANDRÉS SILVA',
      targetLabel: 'AIRE.GLB 12.5 BAR',
      x: -27.2,
      z: 0.2,
      rotY: -2.1,
      patrolDx: 0.4,
      patrolDz: 0.45,
      hardHat: false
    },
    {
      id: 'mechanic-7',
      defaultRole: 'engineer',
      nameLabel: 'ING. ELENA CASTRO',
      targetLabel: 'TABLERO.GLB CAN-BUS',
      x: -3.8,
      z: 14.3,
      rotY: Math.PI,
      patrolDx: 0.75,
      patrolDz: 0.18,
      hardHat: false
    },
    {
      id: 'mechanic-8',
      defaultRole: 'operator',
      nameLabel: 'MIGUEL TORRES',
      targetLabel: 'ASIENTOS.GLB',
      x: 5.7,
      z: 13.4,
      rotY: -2.05,
      patrolDx: 0.35,
      patrolDz: 0.55,
      hardHat: true
    }
  ]

  const specialists: SpecialistActionRig[] = []
  for (const cfg of specialistConfigs) {
    const rig = buildSpecialistActionRig(cfg, materials)
    tagInteractive(rig.root, cfg.id, interactiveGroups)
    root.add(rig.root)
    specialists.push(rig)
  }

  // 8. Partículas holográficas ambientales
  const pCount = 220
  const pPositions = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 68
    pPositions[i * 3 + 1] = 0.5 + Math.random() * 8.5
    pPositions[i * 3 + 2] = -10 + Math.random() * 28
  }
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
  const ambientParticles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.11,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
  )
  ambientParticles.raycast = () => {}
  arHoloGroup.add(ambientParticles)

  return {
    root,
    liftPlatformGroup,
    truckBay1,
    truckBay2,
    diagCart,
    engineStand,
    enginePayloadGroup,
    engineFan,
    tireRack,
    partCarroceriaSlot,
    partCarroceriaMesh,
    partPuertaSlot,
    partPuertaMesh,
    partChasisSlot,
    partChasisMesh,
    partAireSlot,
    partAireMesh,
    partTableroSlot,
    partTableroMesh,
    partAsientosSlot,
    partAsientosMesh,
    specialists,
    laserScannerBody,
    laserScannerChassis,
    gantryCraneBridge,
    airTurbineRotor,
    weldingSparks,
    weldingFlashLight,
    arHoloGroup,
    arRings,
    ambientParticles,
    skyDomeMat,
    bayStatusLights: {
      bay1: bay1LightMat,
      bay2: bay2LightMat
    },
    interactiveGroups
  }
}
