import * as THREE from 'three'
import type { WorkshopMaterials } from '../materials'

function createVolvoBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 256, 64)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, 248, 56)
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 34px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('VOLVO', 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createWheel(materials: WorkshopMaterials, isDual = false): THREE.Group {
  const group = new THREE.Group()
  const tireGeo = new THREE.CylinderGeometry(0.54, 0.54, isDual ? 0.62 : 0.34, 24)
  tireGeo.rotateZ(Math.PI / 2)
  const tire = new THREE.Mesh(tireGeo, materials.rubber)
  tire.castShadow = true
  tire.receiveShadow = true
  group.add(tire)

  const rimGeo = new THREE.CylinderGeometry(0.31, 0.31, isDual ? 0.65 : 0.37, 16)
  rimGeo.rotateZ(Math.PI / 2)
  const rim = new THREE.Mesh(rimGeo, materials.chrome)
  group.add(rim)

  const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, isDual ? 0.69 : 0.41, 12)
  hubGeo.rotateZ(Math.PI / 2)
  const hub = new THREE.Mesh(hubGeo, materials.darkSteel)
  group.add(hub)

  return group
}

export function buildHeavyTruck(
  variant: 'fh-tractor' | 'fmx-rigid',
  materials: WorkshopMaterials,
  interactiveId: string
): THREE.Group {
  const truck = new THREE.Group()
  truck.userData.interactiveId = interactiveId

  const paintMat = variant === 'fh-tractor' ? materials.volvoBluePaint : materials.fmxYellowPaint

  const railGeo = new THREE.BoxGeometry(0.14, 0.28, 7.6)
  const leftRail = new THREE.Mesh(railGeo, materials.darkSteel)
  leftRail.position.set(-0.48, 0.85, 0)
  leftRail.castShadow = true
  const rightRail = leftRail.clone()
  rightRail.position.x = 0.48
  truck.add(leftRail, rightRail)

  const crossGeo = new THREE.BoxGeometry(1.1, 0.16, 0.16)
  for (const z of [-3.4, -1.6, 0.5, 2.2, 3.5]) {
    const cross = new THREE.Mesh(crossGeo, materials.darkSteel)
    cross.position.set(0, 0.85, z)
    truck.add(cross)
  }

  const engineBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.78, 1.45),
    materials.brushedMetal
  )
  engineBlock.position.set(0, 1.15, 2.2)
  engineBlock.castShadow = true
  truck.add(engineBlock)

  const valveCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.22, 1.3),
    materials.darkSteel
  )
  valveCover.position.set(0, 1.62, 2.2)
  truck.add(valveCover)

  const cabHeight = variant === 'fh-tractor' ? 2.35 : 2.05
  const cabDepth = variant === 'fh-tractor' ? 2.35 : 1.95
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.42, cabHeight, cabDepth), paintMat)
  cab.position.set(0, 1.12 + cabHeight / 2, 2.35)
  cab.castShadow = true
  cab.receiveShadow = true
  truck.add(cab)

  if (variant === 'fh-tractor') {
    const aeroTop = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.36, 1.7), paintMat)
    aeroTop.position.set(0, 3.62, 2.05)
    aeroTop.castShadow = true
    truck.add(aeroTop)
  }

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.88, 0.08), materials.glass)
  windshield.position.set(0, 2.65, 2.35 + cabDepth / 2 + 0.01)
  truck.add(windshield)

  const sideWinGeo = new THREE.BoxGeometry(0.06, 0.76, 1.05)
  const leftWin = new THREE.Mesh(sideWinGeo, materials.glass)
  leftWin.position.set(-1.22, 2.62, 2.55)
  const rightWin = leftWin.clone()
  rightWin.position.x = 1.22
  truck.add(leftWin, rightWin)

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 0.1), materials.darkSteel)
  grille.position.set(0, 1.72, 2.35 + cabDepth / 2 + 0.03)
  truck.add(grille)

  const badgeMat = new THREE.MeshStandardMaterial({
    map: createVolvoBadgeTexture(),
    roughness: 0.25,
    metalness: 0.45
  })
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.06), badgeMat)
  badge.position.set(0, 2.04, 2.35 + cabDepth / 2 + 0.08)
  truck.add(badge)

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.44, 0.32), materials.darkSteel)
  bumper.position.set(0, 0.94, 2.35 + cabDepth / 2 + 0.12)
  bumper.castShadow = true
  truck.add(bumper)

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 1.1
  })
  for (const x of [-0.92, 0.92]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.08), headlightMat)
    light.position.set(x, 1.04, 2.35 + cabDepth / 2 + 0.25)
    truck.add(light)

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.16), materials.darkSteel)
    mirror.position.set(x > 0 ? 1.42 : -1.42, 2.58, 2.85)
    truck.add(mirror)
  }

  const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.55, 16)
  tankGeo.rotateX(Math.PI / 2)
  for (const x of [-0.95, 0.95]) {
    const tank = new THREE.Mesh(tankGeo, materials.brushedMetal)
    tank.position.set(x, 0.82, 0.35)
    tank.castShadow = true
    truck.add(tank)
  }

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.7, 12), materials.chrome)
  exhaust.position.set(-1.05, 2.1, 1.05)
  truck.add(exhaust)

  if (variant === 'fh-tractor') {
    const fifthWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.58, 0.18, 20),
      materials.darkSteel
    )
    fifthWheel.position.set(0, 1.12, -1.9)
    fifthWheel.castShadow = true
    truck.add(fifthWheel)

    const catwalk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.3), materials.brushedMetal)
    catwalk.position.set(0, 1.02, -0.3)
    truck.add(catwalk)
  } else {
    const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.44, 1.65, 4.75), materials.wallPanel)
    cargoBox.position.set(0, 1.88, -1.35)
    cargoBox.castShadow = true
    cargoBox.receiveShadow = true
    truck.add(cargoBox)

    const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(2.47, 0.24, 4.6), paintMat)
    sideStripe.position.set(0, 1.85, -1.35)
    truck.add(sideStripe)
  }

  const axlePositions = [
    { z: 2.45, dual: false },
    { z: -1.45, dual: true },
    { z: -2.85, dual: true }
  ]
  for (const axle of axlePositions) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.2, 10).rotateZ(Math.PI / 2),
      materials.darkSteel
    )
    shaft.position.set(0, 0.54, axle.z)
    truck.add(shaft)

    const leftWheel = createWheel(materials, axle.dual)
    leftWheel.position.set(axle.dual ? -1.08 : -1.16, 0.54, axle.z)
    const rightWheel = createWheel(materials, axle.dual)
    rightWheel.position.set(axle.dual ? 1.08 : 1.16, 0.54, axle.z)
    truck.add(leftWheel, rightWheel)
  }

  truck.traverse((node) => {
    node.userData.interactiveId = interactiveId
  })

  return truck
}
