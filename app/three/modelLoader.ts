import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
const gltfCache = new Map<string, Promise<GLTF | null>>()

export type GlbMaterialProfile = 'vehicle' | 'character' | 'equipment' | 'engine'

export interface GlbLoadOptions {
  /** Escala para que la longitud horizontal principal (eje Z tras alinear) mida estos metros */
  targetLength?: number
  /** Opcional: fuerza el ancho (eje X) a estos metros (útil para igualar el ancho del chasis al de los camiones) */
  targetWidth?: number
  /** Alternativa o complemento: escala para alcanzar esta altura (eje Y) en metros */
  targetHeight?: number
  /**
   * Si true y el modelo viene más largo en X que en Z (como exporta Meshy los camiones y chasis,
   * con el frente hacia -X), rota +90° en Y para que el frente apunte hacia +Z.
   */
  alignLongestAxisToZ?: boolean
  /** Rotación adicional en Y (radianes) sobre el modelo ya alineado */
  rotationY?: number
  /** Desplazamiento vertical adicional sobre el suelo (min.y = 0) */
  groundOffset?: number
  /** Perfil PBR para enriquecer materiales, reflejos, clearcoat y mapas normales */
  materialProfile?: GlbMaterialProfile
  /** Anisotropía aplicada a las texturas del GLB */
  maxAnisotropy?: number
  /** ID interactivo asignado al grupo y a su proxy rápido de raycasting */
  interactiveId?: string
  /** Añade un decal de oclusión ambiental (sombra de contacto) bajo la base del modelo */
  addContactShadow?: boolean
}

let sharedContactShadowTex: THREE.CanvasTexture | null = null

function getContactShadowTexture(): THREE.CanvasTexture {
  if (sharedContactShadowTex) return sharedContactShadowTex
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createRadialGradient(128, 128, 18, 128, 128, 124)
  grad.addColorStop(0, 'rgba(3, 6, 12, 0.78)')
  grad.addColorStop(0.55, 'rgba(5, 9, 16, 0.48)')
  grad.addColorStop(0.82, 'rgba(8, 12, 20, 0.16)')
  grad.addColorStop(1, 'rgba(8, 12, 20, 0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)

  sharedContactShadowTex = new THREE.CanvasTexture(canvas)
  return sharedContactShadowTex
}

function simplifyHeavyGeometry(geometry: THREE.BufferGeometry, gridRes = 128): THREE.BufferGeometry {
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  const idxAttr = geometry.getIndex()
  if (!posAttr || !idxAttr || posAttr.count < 450_000) return geometry

  const normAttr = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined
  const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined

  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const minX = box.min.x
  const minY = box.min.y
  const minZ = box.min.z
  const invX = gridRes / Math.max(1e-5, box.max.x - minX)
  const invY = gridRes / Math.max(1e-5, box.max.y - minY)
  const invZ = gridRes / Math.max(1e-5, box.max.z - minZ)

  const vCount = posAttr.count
  const posArr = posAttr.array as Float32Array
  const normArr = normAttr ? (normAttr.array as Float32Array) : null
  const uvArr = uvAttr ? (uvAttr.array as Float32Array) : null

  const totalCells = gridRes * gridRes * gridRes
  const cellFirstOut = new Int32Array(totalCells).fill(-1)
  const vertCell = new Int32Array(vCount)
  const oldToNew = new Int32Array(vCount)

  const outPos: number[] = []
  const outNorm: number[] = []
  const outUv: number[] = []
  let outCount = 0

  for (let i = 0; i < vCount; i++) {
    const i3 = i * 3
    const gx = Math.min(gridRes - 1, Math.max(0, ((posArr[i3]! - minX) * invX) | 0))
    const gy = Math.min(gridRes - 1, Math.max(0, ((posArr[i3 + 1]! - minY) * invY) | 0))
    const gz = Math.min(gridRes - 1, Math.max(0, ((posArr[i3 + 2]! - minZ) * invZ) | 0))
    const cell = (gx * gridRes + gy) * gridRes + gz
    vertCell[i] = cell

    const repOut = cellFirstOut[cell]!
    if (repOut === -1) {
      cellFirstOut[cell] = outCount
      oldToNew[i] = outCount
      outPos.push(posArr[i3]!, posArr[i3 + 1]!, posArr[i3 + 2]!)
      if (normArr) outNorm.push(normArr[i3]!, normArr[i3 + 1]!, normArr[i3 + 2]!)
      if (uvArr) outUv.push(uvArr[i * 2]!, uvArr[i * 2 + 1]!)
      outCount++
    } else if (uvArr) {
      const u = uvArr[i * 2]!
      const v = uvArr[i * 2 + 1]!
      const ru = outUv[repOut * 2]!
      const rv = outUv[repOut * 2 + 1]!
      if (Math.abs(u - ru) > 0.045 || Math.abs(v - rv) > 0.045) {
        oldToNew[i] = outCount
        outPos.push(posArr[i3]!, posArr[i3 + 1]!, posArr[i3 + 2]!)
        if (normArr) outNorm.push(normArr[i3]!, normArr[i3 + 1]!, normArr[i3 + 2]!)
        outUv.push(u, v)
        outCount++
      } else {
        oldToNew[i] = repOut
      }
    } else {
      oldToNew[i] = repOut
    }
  }

  const idxArr = idxAttr.array
  const outIndices: number[] = []
  for (let i = 0, n = idxAttr.count; i < n; i += 3) {
    const a = idxArr[i]!
    const b = idxArr[i + 1]!
    const c = idxArr[i + 2]!
    const ca = vertCell[a]
    const cb = vertCell[b]
    const cc = vertCell[c]
    if (ca !== cb && cb !== cc && ca !== cc) {
      outIndices.push(oldToNew[a]!, oldToNew[b]!, oldToNew[c]!)
    }
  }

  const simplified = new THREE.BufferGeometry()
  simplified.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3))
  if (normArr) {
    simplified.setAttribute('normal', new THREE.Float32BufferAttribute(outNorm, 3))
  }
  if (uvArr) {
    simplified.setAttribute('uv', new THREE.Float32BufferAttribute(outUv, 2))
  }
  simplified.setIndex(outIndices)
  if (!normArr) simplified.computeVertexNormals()
  simplified.computeBoundingBox()
  simplified.computeBoundingSphere()
  return simplified
}

function enhanceGlbMaterial(
  mat: THREE.Material,
  profile: GlbMaterialProfile,
  anisotropy: number
): THREE.Material {
  const std = mat as THREE.MeshStandardMaterial
  if (!std.isMeshStandardMaterial) return mat

  const configureTex = (tex: THREE.Texture | null | undefined, isColor = false) => {
    if (!tex) return
    tex.anisotropy = anisotropy
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
  }

  configureTex(std.map, true)
  configureTex(std.emissiveMap, true)
  configureTex(std.normalMap, false)
  configureTex(std.roughnessMap, false)
  configureTex(std.metalnessMap, false)
  configureTex(std.aoMap, false)

  const physical = new THREE.MeshPhysicalMaterial({
    color: std.color ? std.color.clone() : new THREE.Color(0xffffff),
    map: std.map ?? null,
    normalMap: std.normalMap ?? null,
    roughnessMap: std.roughnessMap ?? null,
    metalnessMap: std.metalnessMap ?? null,
    aoMap: std.aoMap ?? null,
    aoMapIntensity: 1.15,
    emissive: std.emissive ? std.emissive.clone() : new THREE.Color(0x000000),
    emissiveMap: std.emissiveMap ?? null,
    emissiveIntensity: std.emissiveIntensity ?? 1.0,
    transparent: std.transparent,
    opacity: std.opacity,
    alphaTest: std.alphaTest,
    side: THREE.FrontSide,
    shadowSide: THREE.FrontSide
  })

  if (profile === 'vehicle') {
    physical.roughness = 0.54
    physical.metalness = 0.82
    physical.clearcoat = 0.82
    physical.clearcoatRoughness = 0.14
    physical.ior = 1.52
    physical.reflectivity = 0.92
    physical.envMapIntensity = 1.85
    physical.normalScale = new THREE.Vector2(1.35, 1.35)
  } else if (profile === 'equipment' || profile === 'engine') {
    physical.roughness = 0.56
    physical.metalness = 0.88
    physical.clearcoat = 0.42
    physical.clearcoatRoughness = 0.22
    physical.envMapIntensity = 1.65
    physical.normalScale = new THREE.Vector2(1.4, 1.4)
  } else if (profile === 'character') {
    physical.roughness = 0.78
    physical.metalness = 0.55
    physical.clearcoat = 0.14
    physical.clearcoatRoughness = 0.38
    physical.sheen = 0.35
    physical.sheenRoughness = 0.55
    physical.sheenColor = new THREE.Color(0xf8fafc)
    physical.envMapIntensity = 1.25
    physical.normalScale = new THREE.Vector2(1.25, 1.25)
  }

  return physical
}

async function fetchGltfCached(url: string): Promise<GLTF | null> {
  if (!gltfCache.has(url)) {
    const promise = (async () => {
      try {
        const isBlob = url.startsWith('blob:')
        if (!isBlob) {
          const response = await fetch(url, { method: 'HEAD' })
          if (!response.ok) return null
        }
        const gltf = await loader.loadAsync(url)
        gltf.scene.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh && mesh.geometry) {
            const pos = mesh.geometry.getAttribute('position')
            if (pos && pos.count >= 450_000) {
              mesh.geometry = simplifyHeavyGeometry(mesh.geometry, 128)
            }
          }
        })
        return gltf
      } catch {
        return null
      }
    })()
    gltfCache.set(url, promise)
  }
  return gltfCache.get(url)!
}

export async function tryLoadGlbModel(
  url: string,
  options: GlbLoadOptions = {}
): Promise<THREE.Group | null> {
  const gltf = await fetchGltfCached(url)
  if (!gltf) return null

  const rawModel = gltf.scene.clone(true)
  const profile = options.materialProfile ?? 'vehicle'
  const anisotropy = options.maxAnisotropy ?? 16

  rawModel.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return

    if (mesh.geometry && !mesh.geometry.getAttribute('normal')) {
      mesh.geometry.computeVertexNormals()
    }

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => enhanceGlbMaterial(m, profile, anisotropy))
    } else if (mesh.material) {
      mesh.material = enhanceGlbMaterial(mesh.material, profile, anisotropy)
    }

    mesh.castShadow = true
    mesh.receiveShadow = true

    if (options.interactiveId) {
      mesh.userData.interactiveId = options.interactiveId
      mesh.raycast = () => {}
    }
  })

  // 1. Medir bounding box inicial
  rawModel.updateMatrixWorld(true)
  const initialBox = new THREE.Box3().setFromObject(rawModel)
  const initialSize = initialBox.getSize(new THREE.Vector3())

  // 2. Rotar dentro de orientGroup para que los ejes X (ancho), Y (alto) y Z (largo) queden alineados al mundo
  if (options.alignLongestAxisToZ && initialSize.x > initialSize.z) {
    rawModel.rotation.y += Math.PI / 2
  }
  if (typeof options.rotationY === 'number') {
    rawModel.rotation.y += options.rotationY
  }

  const orientGroup = new THREE.Group()
  orientGroup.add(rawModel)
  orientGroup.updateMatrixWorld(true)

  const rotatedBox = new THREE.Box3().setFromObject(orientGroup)
  const rotatedSize = rotatedBox.getSize(new THREE.Vector3())

  // 3. Escalar en espacio alineado al mundo (soporta escala uniforme o ajuste exacto al tamaño de camión)
  if (options.targetLength && options.targetWidth) {
    const sz = options.targetLength / Math.max(rotatedSize.z, 0.001)
    const sx = options.targetWidth / Math.max(rotatedSize.x, 0.001)
    const sy = options.targetHeight
      ? options.targetHeight / Math.max(rotatedSize.y, 0.001)
      : (sx + sz) * 0.5
    orientGroup.scale.set(sx, sy, sz)
  } else if (options.targetLength && options.targetLength > 0) {
    const currentHorizLength = Math.max(rotatedSize.x, rotatedSize.z, 0.001)
    orientGroup.scale.setScalar(options.targetLength / currentHorizLength)
  } else if (options.targetHeight && options.targetHeight > 0) {
    const currentHeight = Math.max(rotatedSize.y, 0.001)
    orientGroup.scale.setScalar(options.targetHeight / currentHeight)
  }

  orientGroup.updateMatrixWorld(true)

  // 4. Centrar pivote en X/Z y apoyar la base exactamente en Y = 0
  const finalBox = new THREE.Box3().setFromObject(orientGroup)
  const finalCenter = finalBox.getCenter(new THREE.Vector3())
  const finalSize = finalBox.getSize(new THREE.Vector3())

  orientGroup.position.x -= finalCenter.x
  orientGroup.position.z -= finalCenter.z
  orientGroup.position.y += -finalBox.min.y + (options.groundOffset ?? 0)
  orientGroup.updateMatrixWorld(true)

  const wrapper = new THREE.Group()
  wrapper.add(orientGroup)

  // 5. Sombra de contacto (Ambient Occlusion decal)
  if (options.addContactShadow !== false) {
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(finalSize.x * 1.06, finalSize.z * 1.06).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        map: getContactShadowTexture(),
        transparent: true,
        opacity: profile === 'vehicle' ? 0.72 : 0.55,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1
      })
    )
    shadowPlane.position.y = 0.012
    shadowPlane.raycast = () => {}
    wrapper.add(shadowPlane)
  }

  // 6. Proxy de colisión invisible de 12 triángulos para selección/hover instantáneo
  if (options.interactiveId) {
    wrapper.userData.interactiveId = options.interactiveId
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false })
    const hitProxy = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(0.4, finalSize.x),
        Math.max(0.4, finalSize.y),
        Math.max(0.4, finalSize.z)
      ),
      proxyMat
    )
    hitProxy.position.y = finalSize.y / 2 + (options.groundOffset ?? 0)
    hitProxy.userData.interactiveId = options.interactiveId
    wrapper.add(hitProxy)
  }

  return wrapper
}
