export type NavSection = 'taller' | 'vehiculos' | 'ordenes' | 'inventario'

export type CameraPresetId =
  | 'overview'
  | 'bay1_repair'
  | 'bay2_diagnostic'
  | 'inspection_pit'
  | 'warehouse'
  | 'workshop_body'
  | 'workshop_chassis'
  | 'workshop_interior'

export type EnvironmentThemeId = 'cyber_ar' | 'sunset_industrial' | 'vr_matrix'

export type PersonnelActionMode = 'auto' | 'inspect' | 'repair'

export type ObjectCategory =
  | 'vehiculo'
  | 'componente'
  | 'equipamiento'
  | 'herramienta'
  | 'zona'
  | 'personal'
  | 'inventario'

export interface WorkshopZoneInfo {
  id: string
  code: string
  name: string
  shortName: string
  specialty: string
  cameraPreset: CameraPresetId
  activeTechnicians: number
  featuredModels: string[]
  accentColor: string
}

export interface InteractiveElementInfo {
  id: string
  name: string
  category: ObjectCategory
  role: string
  status: string
  statusTone: 'ok' | 'warning' | 'active' | 'info'
  location: string
  details: string[]
  glbFileName?: string
  cameraPreset?: CameraPresetId
  relatedWorkOrderId?: string
  supportsLiftToggle?: boolean
}

export interface RepairStep {
  id: string
  title: string
  description: string
  completed: boolean
  highlightTargetId: string
  recommendedCamera: CameraPresetId
  requiresLiftUp?: boolean
}

export interface WorkOrder {
  id: string
  code: string
  title: string
  vehicleId: string
  vehicleName: string
  bay: string
  technician: string
  priority: 'Alta' | 'Media' | 'Normal'
  status: 'Pendiente' | 'En progreso' | 'Completada'
  steps: RepairStep[]
}

export interface VehicleRecord {
  id: string
  name: string
  type: 'Tractocamión' | 'Camión rígido' | 'Subensamble estructural'
  plate: string
  bay: string
  mileageKm: number
  status: 'En reparación' | 'En diagnóstico' | 'En ensamblaje' | 'En espera'
  cameraPreset: CameraPresetId
  sceneObjectId: string
  notes: string
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: 'Motor' | 'Neumáticos' | 'Lubricantes' | 'Frenos' | 'Carrocería' | 'Cabina y Aire'
  stock: number
  minStock: number
  location: string
  sceneObjectId: string
}

export interface AiChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp: string
  actionExecuted?: string
}
