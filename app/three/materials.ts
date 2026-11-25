import * as THREE from 'three'

export interface WorkshopMaterials {
  concreteFloor: THREE.MeshPhysicalMaterial
  wallPanel: THREE.MeshStandardMaterial
  darkSteel: THREE.MeshStandardMaterial
  brushedMetal: THREE.MeshStandardMaterial
  volvoBluePaint: THREE.MeshPhysicalMaterial
  fmxYellowPaint: THREE.MeshPhysicalMaterial
  rubber: THREE.MeshStandardMaterial
  glass: THREE.MeshPhysicalMaterial
  safetyYellow: THREE.MeshStandardMaterial
  hazardStripe: THREE.MeshStandardMaterial
  toolRed: THREE.MeshPhysicalMaterial
  chrome: THREE.MeshPhysicalMaterial
  volvoSignMaterial: THREE.MeshStandardMaterial
  diagScreenMaterial: THREE.MeshStandardMaterial
  hiVisOrange: THREE.MeshStandardMaterial
  workwearNavy: THREE.MeshStandardMaterial
  skinTone: THREE.MeshStandardMaterial
  cardboard: THREE.MeshStandardMaterial
  oilBlue: THREE.MeshStandardMaterial
  contactShadow: THREE.MeshBasicMaterial
  updateDiagScreen: (timeSec: number) => void
  dispose: () => void
}

function createEpoxyConcreteTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  // Base de epóxico industrial gris acero pulido (sin manchas circulares repetitivas)
  const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024)
  baseGrad.addColorStop(0, '#49515b')
  baseGrad.addColorStop(0.5, '#434b54')
  baseGrad.addColorStop(1, '#48505a')
  ctx.fillStyle = baseGrad
  ctx.fillRect(0, 0, 1024, 1024)

  // Micro-grano de concreto pulido de alta frecuencia
  for (let i = 0; i < 32000; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const delta = Math.floor(Math.random() * 22) - 11
    const base = 74 + delta
    ctx.fillStyle = `rgba(${base}, ${base + 3}, ${base + 7}, 0.16)`
    ctx.fillRect(x, y, 2, 2)
  }

  // Vetas sutiles de alisado de llana mecánica
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const w = 80 + Math.random() * 180
    const h = 18 + Math.random() * 45
    ctx.fillStyle = i % 2 === 0 ? 'rgba(92, 102, 114, 0.045)' : 'rgba(30, 35, 42, 0.045)'
    ctx.fillRect(x, y, w, h)
  }

  // Juntas de dilatación de losas de concreto (cuadrícula 4x4 por tile)
  ctx.strokeStyle = 'rgba(22, 26, 32, 0.52)'
  ctx.lineWidth = 2.5
  for (const pos of [0, 256, 512, 768]) {
    ctx.beginPath()
    ctx.moveTo(pos, 0)
    ctx.lineTo(pos, 1024)
    ctx.moveTo(0, pos)
    ctx.lineTo(1024, pos)
    ctx.stroke()

    // Bisel claro junto a la junta
    ctx.strokeStyle = 'rgba(120, 132, 146, 0.14)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pos + 2, 0)
    ctx.lineTo(pos + 2, 1024)
    ctx.moveTo(0, pos + 2)
    ctx.lineTo(1024, pos + 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(22, 26, 32, 0.52)'
    ctx.lineWidth = 2.5
  }

  const map = new THREE.CanvasTexture(canvas)
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping
  map.repeat.set(5, 4)
  map.anisotropy = 16
  map.colorSpace = THREE.SRGBColorSpace

  const bump = new THREE.CanvasTexture(canvas)
  bump.wrapS = THREE.RepeatWrapping
  bump.wrapT = THREE.RepeatWrapping
  bump.repeat.set(5, 4)
  bump.anisotropy = 16

  return { map, bump }
}

function createWallCladdingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#cfd6df'
  ctx.fillRect(0, 0, 512, 512)

  // Paneles arquitectónicos acanalados horizontales y verticales
  for (let y = 0; y < 512; y += 32) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
    ctx.fillRect(0, y, 512, 3)
    ctx.fillStyle = 'rgba(71, 85, 105, 0.14)'
    ctx.fillRect(0, y + 29, 512, 3)
  }

  for (let x = 0; x < 512; x += 128) {
    ctx.fillStyle = 'rgba(51, 65, 85, 0.24)'
    ctx.fillRect(x, 0, 2, 512)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 2)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#eab308'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#18181b'
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 16, 0)
    ctx.lineTo(x + 48, 64)
    ctx.lineTo(x + 32, 64)
    ctx.closePath()
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 1)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createVolvoSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 1024, 256)
  bg.addColorStop(0, '#070e1b')
  bg.addColorStop(0.5, '#0c1930')
  bg.addColorStop(1, '#070e1b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1024, 256)

  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 6
  ctx.strokeRect(10, 10, 1004, 236)

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(22, 22, 980, 212)

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 96px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('V O L V O', 512, 102)

  ctx.fillStyle = '#7dd3fc'
  ctx.font = '600 28px system-ui, sans-serif'
  ctx.fillText('SERVICIO DE CAMIONES PESADOS  •  BAHÍAS 1 – 2', 512, 186)

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 122)
  grad.addColorStop(0, 'rgba(3, 6, 12, 0.72)')
  grad.addColorStop(0.6, 'rgba(6, 10, 18, 0.36)')
  grad.addColorStop(1, 'rgba(6, 10, 18, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

export function createWorkshopMaterials(): WorkshopMaterials {
  const textures: THREE.Texture[] = []
  const { map: concreteTex, bump: concreteBump } = createEpoxyConcreteTexture()
  const wallTex = createWallCladdingTexture()
  const hazardTex = createHazardTexture()
  const signTex = createVolvoSignTexture()
  const shadowTex = createContactShadowTexture()

  // Pantalla de diagnóstico animada en vivo
  const diagCanvas = document.createElement('canvas')
  diagCanvas.width = 512
  diagCanvas.height = 320
  const diagCtx = diagCanvas.getContext('2d')!
  const diagTex = new THREE.CanvasTexture(diagCanvas)
  diagTex.colorSpace = THREE.SRGBColorSpace

  const drawDiagScreen = (t: number) => {
    diagCtx.fillStyle = '#07101d'
    diagCtx.fillRect(0, 0, 512, 320)

    diagCtx.fillStyle = '#38bdf8'
    diagCtx.font = 'bold 22px monospace'
    diagCtx.fillText('DIAGNOSTICO PESADO J1939  [EN VIVO]', 20, 38)

    const rpm = Math.round(680 + Math.sin(t * 2.2) * 18)
    const air = (9.6 + Math.sin(t * 0.8) * 0.12).toFixed(1)
    diagCtx.fillStyle = '#22c55e'
    diagCtx.font = '18px monospace'
    diagCtx.fillText(`ECU MOTOR: OK  |  RPM: ${rpm}  |  AIRE: ${air} BAR`, 20, 86)
    diagCtx.fillText('TEMP REFRIG: 84 C  |  BATERIA: 24.4 V', 20, 120)

    diagCtx.fillStyle = Math.sin(t * 5) > 0 ? '#f59e0b' : '#b45309'
    diagCtx.fillText('ALERTA EBS: VERIFICAR SENSOR EJE 2', 20, 162)

    diagCtx.strokeStyle = 'rgba(56, 189, 248, 0.16)'
    diagCtx.lineWidth = 1
    for (let y = 195; y <= 295; y += 25) {
      diagCtx.beginPath()
      diagCtx.moveTo(20, y)
      diagCtx.lineTo(492, y)
      diagCtx.stroke()
    }

    diagCtx.strokeStyle = '#38bdf8'
    diagCtx.lineWidth = 3
    diagCtx.beginPath()
    for (let x = 20; x < 490; x += 8) {
      const y = 245 + Math.sin(x * 0.055 + t * 5.2) * 24 + Math.cos(x * 0.025 - t * 2) * 8
      if (x === 20) diagCtx.moveTo(x, y)
      else diagCtx.lineTo(x, y)
    }
    diagCtx.stroke()
    diagTex.needsUpdate = true
  }
  drawDiagScreen(0)

  textures.push(concreteTex, concreteBump, wallTex, hazardTex, signTex, shadowTex, diagTex)

  const materials: Omit<WorkshopMaterials, 'dispose' | 'updateDiagScreen'> = {
    concreteFloor: new THREE.MeshPhysicalMaterial({
      map: concreteTex,
      bumpMap: concreteBump,
      bumpScale: 0.012,
      roughness: 0.56,
      metalness: 0.08,
      clearcoat: 0.36,
      clearcoatRoughness: 0.38,
      reflectivity: 0.65,
      envMapIntensity: 1.15
    }),
    wallPanel: new THREE.MeshStandardMaterial({
      map: wallTex,
      bumpMap: wallTex,
      bumpScale: 0.008,
      roughness: 0.58,
      metalness: 0.18,
      envMapIntensity: 0.9
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      roughness: 0.34,
      metalness: 0.86,
      envMapIntensity: 1.35
    }),
    brushedMetal: new THREE.MeshStandardMaterial({
      color: 0x9aa6b8,
      roughness: 0.24,
      metalness: 0.92,
      envMapIntensity: 1.5
    }),
    volvoBluePaint: new THREE.MeshPhysicalMaterial({
      color: 0x114282,
      roughness: 0.16,
      metalness: 0.62,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      ior: 1.52,
      envMapIntensity: 1.75
    }),
    fmxYellowPaint: new THREE.MeshPhysicalMaterial({
      color: 0xd99518,
      roughness: 0.2,
      metalness: 0.45,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      ior: 1.5,
      envMapIntensity: 1.65
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.88,
      metalness: 0.06
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.04,
      metalness: 0.15,
      transmission: 0.55,
      ior: 1.52,
      reflectivity: 0.95,
      transparent: true,
      opacity: 0.86,
      envMapIntensity: 2.0
    }),
    safetyYellow: new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.36,
      metalness: 0.24
    }),
    hazardStripe: new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.5,
      metalness: 0.1
    }),
    toolRed: new THREE.MeshPhysicalMaterial({
      color: 0xb91c1c,
      roughness: 0.24,
      metalness: 0.55,
      clearcoat: 0.72,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.45
    }),
    chrome: new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.07,
      metalness: 0.98,
      clearcoat: 0.5,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.1
    }),
    volvoSignMaterial: new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0x0c2444,
      emissiveMap: signTex,
      emissiveIntensity: 0.42,
      roughness: 0.26,
      metalness: 0.35
    }),
    diagScreenMaterial: new THREE.MeshStandardMaterial({
      map: diagTex,
      emissive: 0x1d4ed8,
      emissiveMap: diagTex,
      emissiveIntensity: 0.65,
      roughness: 0.16
    }),
    hiVisOrange: new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.65
    }),
    workwearNavy: new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.75
    }),
    skinTone: new THREE.MeshStandardMaterial({
      color: 0xd6a584,
      roughness: 0.7
    }),
    cardboard: new THREE.MeshStandardMaterial({
      color: 0xa18059,
      roughness: 0.88
    }),
    oilBlue: new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.28
    }),
    contactShadow: new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    })
  }

  return {
    ...materials,
    updateDiagScreen: drawDiagScreen,
    dispose() {
      Object.values(materials).forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
    }
  }
}
