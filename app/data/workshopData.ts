import type {
  InteractiveElementInfo,
  InventoryItem,
  VehicleRecord,
  WorkOrder,
  WorkshopZoneInfo
} from '~/types/workshop'

export const WORKSHOP_ZONES: WorkshopZoneInfo[] = [
  {
    id: 'taller-1',
    code: 'SECTOR ALPHA-01',
    name: 'Taller 01 • Tren Motriz y Servicio Pesado',
    shortName: 'T01 • Tren Motriz',
    specialty: 'Elevador electrohidráulico 30T, fosa subterránea y reconstrucción de motor D16',
    cameraPreset: 'bay1_repair',
    activeTechnicians: 3,
    featuredModels: ['volvo-fh-tractor.glb', 'volvo-fmx-rigid.glb', 'diesel-engine-inline6.glb'],
    accentColor: '#38bdf8'
  },
  {
    id: 'taller-2',
    code: 'SECTOR BETA-02',
    name: 'Taller 02 • Carrocería, Cabina y Puertas',
    shortName: 'T02 • Carrocería y Puertas',
    specialty: 'Escaneo láser de cabina aerodinámica, soldadura y calibración de puertas',
    cameraPreset: 'workshop_body',
    activeTechnicians: 3,
    featuredModels: ['carroceria.glb', 'puerta.glb'],
    accentColor: '#a855f7'
  },
  {
    id: 'taller-3',
    code: 'SECTOR GAMMA-03',
    name: 'Taller 03 • Chasis Estructural y Neumática',
    shortName: 'T03 • Chasis y Aire',
    specialty: 'Bancada de torsión con puente grúa y laboratorio de aire comprimido / climatización',
    cameraPreset: 'workshop_chassis',
    activeTechnicians: 2,
    featuredModels: ['chasis.glb', 'aire.glb'],
    accentColor: '#f59e0b'
  },
  {
    id: 'taller-4',
    code: 'SECTOR DELTA-04',
    name: 'Taller 04 • Lab. Tablero, Asientos y Confort',
    shortName: 'T04 • Tablero y Asientos',
    specialty: 'Integración de tablero digital CAN-Bus y banco vibratorio de asientos neumáticos',
    cameraPreset: 'workshop_interior',
    activeTechnicians: 2,
    featuredModels: ['tablero.glb', 'asientos.glb'],
    accentColor: '#22c55e'
  }
]

export const INITIAL_VEHICLES: VehicleRecord[] = [
  {
    id: 'veh-fh16',
    name: 'Volvo FH16 (Tractocamión 6x4)',
    type: 'Tractocamión',
    plate: 'TRK-842-MX',
    bay: 'Taller 01 — Bahía 1 (Elevador Pesado)',
    mileageKm: 412850,
    status: 'En reparación',
    cameraPreset: 'bay1_repair',
    sceneObjectId: 'truck-fh-bay1',
    notes: 'Servicio mayor de motor D16 y tren motriz sobre elevador electrohidráulico.'
  },
  {
    id: 'veh-fmx',
    name: 'Volvo FMX (Camión Rígido 6x4)',
    type: 'Camión rígido',
    plate: 'RIG-319-MX',
    bay: 'Taller 01 — Bahía 2 (Fosa de Diagnóstico)',
    mileageKm: 238400,
    status: 'En diagnóstico',
    cameraPreset: 'bay2_diagnostic',
    sceneObjectId: 'truck-fmx-bay2',
    notes: 'Telemetría J1939 en vivo, revisión de válvulas EBS y líneas desde fosa iluminada.'
  },
  {
    id: 'veh-cab-assy',
    name: 'Módulo Cabina Globetrotter XL + Puertas',
    type: 'Subensamble estructural',
    plate: 'CAB-904-XR',
    bay: 'Taller 02 — Celda Láser de Carrocería',
    mileageKm: 120500,
    status: 'En ensamblaje',
    cameraPreset: 'workshop_body',
    sceneObjectId: 'part-carroceria',
    notes: 'Alineación dimensional por escáner láser AR y montaje de puerta lateral.'
  },
  {
    id: 'veh-chassis-assy',
    name: 'Bastidor Estructural 6x4 + Sistema de Aire',
    type: 'Subensamble estructural',
    plate: 'CHS-511-XR',
    bay: 'Taller 03 — Bancada de Chasis y Neumática',
    mileageKm: 185000,
    status: 'En reparación',
    cameraPreset: 'workshop_chassis',
    sceneObjectId: 'part-chasis',
    notes: 'Refuerzo de largueros bajo puente grúa y presurización del módulo de aire.'
  }
]

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-engine',
    code: 'OT-2026-104',
    title: 'Inspección general de motor y sistema de enfriamiento',
    vehicleId: 'veh-fh16',
    vehicleName: 'Volvo FH16 (Tractocamión 6x4)',
    bay: 'Taller 01 • Bahía 1',
    technician: 'Carlos Méndez',
    priority: 'Alta',
    status: 'En progreso',
    steps: [
      {
        id: 'step-eng-1',
        title: 'Asegurar unidad y activar elevador de bahía',
        description: 'Verificar calzas, frenos de estacionamiento y elevar plataforma para inspección inferior.',
        completed: false,
        highlightTargetId: 'lift-bay1',
        recommendedCamera: 'bay1_repair',
        requiresLiftUp: true
      },
      {
        id: 'step-eng-2',
        title: 'Inspeccionar bloque de motor y fugas de refrigerante',
        description: 'Revisar mangueras principales, turbocompresor y niveles de aceite en el compartimento del motor.',
        completed: false,
        highlightTargetId: 'truck-fh-bay1',
        recommendedCamera: 'bay1_repair'
      },
      {
        id: 'step-eng-3',
        title: 'Validar motor diésel D16 en banco rotatorio',
        description: 'Comparar compresión y giro en el soporte de motor de 6 cilindros en línea.',
        completed: false,
        highlightTargetId: 'spare-engine-stand',
        recommendedCamera: 'warehouse',
        requiresLiftUp: false
      }
    ]
  },
  {
    id: 'wo-diag',
    code: 'OT-2026-108',
    title: 'Diagnóstico electrónico J1939 y sensores de frenado',
    vehicleId: 'veh-fmx',
    vehicleName: 'Volvo FMX (Camión Rígido 6x4)',
    bay: 'Taller 01 • Bahía 2',
    technician: 'Laura Morales',
    priority: 'Media',
    status: 'En progreso',
    steps: [
      {
        id: 'step-diag-1',
        title: 'Conectar estación de diagnóstico OBD pesado',
        description: 'Enlazar interfaz de diagnóstico al camión rígido en Bahía 2 para lectura de códigos activos.',
        completed: true,
        highlightTargetId: 'diag-station',
        recommendedCamera: 'bay2_diagnostic'
      },
      {
        id: 'step-diag-2',
        title: 'Verificar chasis y líneas neumáticas en fosa',
        description: 'Revisar válvulas moduladoras y posibles fugas de aire desde la fosa de inspección.',
        completed: false,
        highlightTargetId: 'inspection-pit',
        recommendedCamera: 'inspection_pit'
      },
      {
        id: 'step-diag-3',
        title: 'Borrar códigos y emitir reporte de liberación',
        description: 'Confirmar parámetros estables en el camión rígido tras la calibración.',
        completed: false,
        highlightTargetId: 'truck-fmx-bay2',
        recommendedCamera: 'bay2_diagnostic'
      }
    ]
  },
  {
    id: 'wo-body',
    code: 'OT-2026-115',
    title: 'Escaneo láser de carrocería y ajuste de puerta de cabina',
    vehicleId: 'veh-cab-assy',
    vehicleName: 'Módulo Cabina Globetrotter XL',
    bay: 'Taller 02 • Carrocería y Puertas',
    technician: 'Marco Ruiz & Sofía Vega',
    priority: 'Alta',
    status: 'En progreso',
    steps: [
      {
        id: 'step-body-1',
        title: 'Ejecutar barrido holográfico en carrocería (carroceria.glb)',
        description: 'Validar tolerancias aerodinámicas y puntos de soldadura en la plataforma del Taller 02.',
        completed: false,
        highlightTargetId: 'part-carroceria',
        recommendedCamera: 'workshop_body'
      },
      {
        id: 'step-body-2',
        title: 'Calibrar bisagras y sellos en puerta lateral (puerta.glb)',
        description: 'Ajustar mecanismo de cierre hermético, elevalunas y aislamiento acústico en bastidor.',
        completed: false,
        highlightTargetId: 'part-puerta',
        recommendedCamera: 'workshop_body'
      }
    ]
  },
  {
    id: 'wo-chassis',
    code: 'OT-2026-121',
    title: 'Alineación estructural de chasis y módulo de aire',
    vehicleId: 'veh-chassis-assy',
    vehicleName: 'Bastidor Estructural 6x4',
    bay: 'Taller 03 • Chasis y Neumática',
    technician: 'Diego Herrera & Andrés Silva',
    priority: 'Alta',
    status: 'Pendiente',
    steps: [
      {
        id: 'step-chs-1',
        title: 'Verificar paralelismo de largueros de chasis (chasis.glb)',
        description: 'Inspeccionar travesaños remachados y puntos de anclaje de suspensión con el puente grúa.',
        completed: false,
        highlightTargetId: 'part-chasis',
        recommendedCamera: 'workshop_chassis'
      },
      {
        id: 'step-chs-2',
        title: 'Presurizar sistema de aire y secador neumático (aire.glb)',
        description: 'Comprobar estanqueidad a 12.5 bar, compresor, filtro coalescente y climatización.',
        completed: false,
        highlightTargetId: 'part-aire',
        recommendedCamera: 'workshop_chassis'
      }
    ]
  },
  {
    id: 'wo-interior',
    code: 'OT-2026-128',
    title: 'Pruebas de tablero digital CAN-Bus y asientos neumáticos',
    vehicleId: 'veh-cab-assy',
    vehicleName: 'Laboratorio de Cabina e Interiores',
    bay: 'Taller 04 • Electrónica y Confort',
    technician: 'Elena Castro & Miguel Torres',
    priority: 'Normal',
    status: 'Pendiente',
    steps: [
      {
        id: 'step-int-1',
        title: 'Diagnosticar clúster y arnés de tablero (tablero.glb)',
        description: 'Simular señales J1939 en pantallas digitales, tacógrafo y controles del conductor.',
        completed: false,
        highlightTargetId: 'part-tablero',
        recommendedCamera: 'workshop_interior'
      },
      {
        id: 'step-int-2',
        title: 'Calibrar amortiguación de asientos neumáticos (asientos.glb)',
        description: 'Regular válvula niveladora, soporte lumbar neumático y sensores de cinturón.',
        completed: false,
        highlightTargetId: 'part-asientos',
        recommendedCamera: 'workshop_interior'
      }
    ]
  }
]

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'GLB-CARROCERIA-XL',
    name: 'Casco de Carrocería Cabina Aerodinámica (carroceria.glb)',
    category: 'Carrocería',
    stock: 3,
    minStock: 2,
    location: 'Taller 02 — Celda Láser Central',
    sceneObjectId: 'part-carroceria'
  },
  {
    id: 'inv-2',
    sku: 'GLB-PUERTA-LH',
    name: 'Puerta de Cabina Completa con Cristal y Espejo (puerta.glb)',
    category: 'Carrocería',
    stock: 6,
    minStock: 3,
    location: 'Taller 02 — Bastidor de Puertas',
    sceneObjectId: 'part-puerta'
  },
  {
    id: 'inv-3',
    sku: 'GLB-CHASIS-6X4',
    name: 'Bastidor de Chasis Estructural Acero HSLA (chasis.glb)',
    category: 'Carrocería',
    stock: 2,
    minStock: 2,
    location: 'Taller 03 — Bancada Bajo Puente Grúa',
    sceneObjectId: 'part-chasis'
  },
  {
    id: 'inv-4',
    sku: 'GLB-AIRE-MOD',
    name: 'Módulo de Aire Comprimido, Admisión y A/C (aire.glb)',
    category: 'Cabina y Aire',
    stock: 5,
    minStock: 3,
    location: 'Taller 03 — Banco Neumático',
    sceneObjectId: 'part-aire'
  },
  {
    id: 'inv-5',
    sku: 'GLB-TABLERO-DIG',
    name: 'Tablero de Instrumentos Digital 12" CAN-Bus (tablero.glb)',
    category: 'Cabina y Aire',
    stock: 4,
    minStock: 2,
    location: 'Taller 04 — Mesa Antiestática',
    sceneObjectId: 'part-tablero'
  },
  {
    id: 'inv-6',
    sku: 'GLB-ASIENTOS-AIR',
    name: 'Par de Asientos Neumáticos Ergonómicos (asientos.glb)',
    category: 'Cabina y Aire',
    stock: 7,
    minStock: 4,
    location: 'Taller 04 — Plataforma Vibratoria',
    sceneObjectId: 'part-asientos'
  },
  {
    id: 'inv-7',
    sku: 'ENG-INLINE6-D16',
    name: 'Motor Diésel 6 Cilindros en Línea Remanufacturado (diesel-engine-inline6.glb)',
    category: 'Motor',
    stock: 2,
    minStock: 2,
    location: 'Taller 01 — Soporte Giratorio',
    sceneObjectId: 'spare-engine-stand'
  },
  {
    id: 'inv-8',
    sku: 'TIR-315-80R22',
    name: 'Neumático radial 315/80 R22.5 Eje Motriz',
    category: 'Neumáticos',
    stock: 8,
    minStock: 4,
    location: 'Taller 01 — Rack de Neumáticos B',
    sceneObjectId: 'rack-tires'
  },
  {
    id: 'inv-9',
    sku: 'OIL-15W40-20L',
    name: 'Aceite sintético diésel 15W-40 (Bidón 20L)',
    category: 'Lubricantes',
    stock: 5,
    minStock: 6,
    location: 'Taller 01 — Estantería A Nivel 1',
    sceneObjectId: 'rack-parts'
  }
]

export const SCENE_ELEMENTS_CATALOG: Record<string, InteractiveElementInfo> = {
  'truck-fh-bay1': {
    id: 'truck-fh-bay1',
    name: 'Volvo FH16 — Tractocamión 6x4',
    category: 'vehiculo',
    glbFileName: 'volvo-fh-tractor.glb',
    role: 'Unidad de carga pesada en mantenimiento preventivo y revisión de motor.',
    status: 'En reparación (Taller 01 • Bahía 1)',
    statusTone: 'active',
    location: 'Taller 01 — Elevador Electrohidráulico',
    details: [
      'Modelo 3D: volvo-fh-tractor.glb con pintura PBR clearcoat',
      'Orden activa: OT-2026-104 (Inspección de motor D16)',
      'Plataforma hidráulica sincronizada de 30 toneladas'
    ],
    cameraPreset: 'bay1_repair',
    relatedWorkOrderId: 'wo-engine',
    supportsLiftToggle: true
  },
  'truck-fmx-bay2': {
    id: 'truck-fmx-bay2',
    name: 'Volvo FMX — Camión Rígido 6x4',
    category: 'vehiculo',
    glbFileName: 'volvo-fmx-rigid.glb',
    role: 'Camión rígido de obra en escaneo electrónico y verificación neumática.',
    status: 'En diagnóstico (Taller 01 • Bahía 2)',
    statusTone: 'warning',
    location: 'Taller 01 — Fosa de Diagnóstico',
    details: [
      'Modelo 3D: volvo-fmx-rigid.glb alineado sobre fosa iluminada',
      'Orden activa: OT-2026-108 (Diagnóstico electrónico J1939)',
      'Conectado a terminal de telemetría en tiempo real'
    ],
    cameraPreset: 'bay2_diagnostic',
    relatedWorkOrderId: 'wo-diag'
  },
  'part-carroceria': {
    id: 'part-carroceria',
    name: 'Carrocería y Cabina Exterior (carroceria.glb)',
    category: 'componente',
    glbFileName: 'carroceria.glb',
    role: 'Estructura aerodinámica de cabina en celda de escaneo láser AR y soldadura.',
    status: 'Escaneo láser AR activo (98.4% precisión)',
    statusTone: 'active',
    location: 'Taller 02 — Celda Central de Carrocería',
    details: [
      'Archivo GLB vinculado: public/models/carroceria.glb',
      'Pórtico holográfico verificando geometría y puntos de soldadura',
      '2 técnicos especialistas aplicando tratamiento anticorrosivo y alineación'
    ],
    cameraPreset: 'workshop_body',
    relatedWorkOrderId: 'wo-body'
  },
  'part-puerta': {
    id: 'part-puerta',
    name: 'Módulo de Puerta de Cabina (puerta.glb)',
    category: 'componente',
    glbFileName: 'puerta.glb',
    role: 'Subensamble de puerta lateral en banco de ajuste de bisagras, cerradura y sellos.',
    status: 'Prueba cíclica de apertura activa',
    statusTone: 'ok',
    location: 'Taller 02 — Bastidor Hidráulico de Puertas',
    details: [
      'Archivo GLB vinculado: public/models/puerta.glb',
      'Verificación de aislamiento acústico, espejo retrovisor y elevalunas',
      'Animación de prueba de apertura angular controlada'
    ],
    cameraPreset: 'workshop_body',
    relatedWorkOrderId: 'wo-body'
  },
  'part-chasis': {
    id: 'part-chasis',
    name: 'Chasis y Bastidor Estructural (chasis.glb)',
    category: 'componente',
    glbFileName: 'chasis.glb',
    role: 'Largueros de acero de ultra-alta resistencia en bancada de alineación bajo puente grúa.',
    status: 'Alineación láser y soldadura en curso',
    statusTone: 'warning',
    location: 'Taller 03 — Bancada Estructural de Chasis',
    details: [
      'Archivo GLB vinculado: public/models/chasis.glb',
      'Asistido por puente grúa móvil superior y escáner de torsión',
      '2 técnicos verificando travesaños, quinta rueda y soportes de suspensión'
    ],
    cameraPreset: 'workshop_chassis',
    relatedWorkOrderId: 'wo-chassis'
  },
  'part-aire': {
    id: 'part-aire',
    name: 'Sistema de Aire y Climatización (aire.glb)',
    category: 'componente',
    glbFileName: 'aire.glb',
    role: 'Módulo neumático de compresión, filtrado APM y climatización de cabina.',
    status: 'Presurizado a 12.2 bar — Sin fugas',
    statusTone: 'ok',
    location: 'Taller 03 — Laboratorio Neumático',
    details: [
      'Archivo GLB vinculado: public/models/aire.glb',
      'Prueba de caudal, secador electrónico y válvulas distribuidoras',
      'Monitoreo de presión diferencial por telemetría XR'
    ],
    cameraPreset: 'workshop_chassis',
    relatedWorkOrderId: 'wo-chassis'
  },
  'part-tablero': {
    id: 'part-tablero',
    name: 'Tablero Digital e Instrumentación (tablero.glb)',
    category: 'componente',
    glbFileName: 'tablero.glb',
    role: 'Consola ergonómica con clúster digital de 12", pantalla secundaria y red CAN-Bus.',
    status: 'Simulación de bus J1939 activa',
    statusTone: 'active',
    location: 'Taller 04 — Banco Electrónico Antiestático',
    details: [
      'Archivo GLB vinculado: public/models/tablero.glb',
      'Pruebas de encendido de displays, volante multifunción y módulos ECU',
      'Holograma de telemetría proyectado sobre la consola'
    ],
    cameraPreset: 'workshop_interior',
    relatedWorkOrderId: 'wo-interior'
  },
  'part-asientos': {
    id: 'part-asientos',
    name: 'Asientos con Suspensión Neumática (asientos.glb)',
    category: 'componente',
    glbFileName: 'asientos.glb',
    role: 'Asientos ergonómicos de conductor y acompañante con amortiguación neumática activa.',
    status: 'Prueba dinámica de amortiguación OK',
    statusTone: 'ok',
    location: 'Taller 04 — Plataforma Vibratoria de Confort',
    details: [
      'Archivo GLB vinculado: public/models/asientos.glb',
      'Simulación de vibración en cabina y ajuste lumbar de 3 zonas',
      'Sensores de presencia y pretensores pirotécnicos verificados'
    ],
    cameraPreset: 'workshop_interior',
    relatedWorkOrderId: 'wo-interior'
  },
  'lift-bay1': {
    id: 'lift-bay1',
    name: 'Elevador Electrohidráulico de 4 Columnas',
    category: 'equipamiento',
    role: 'Elevación sincronizada de tractocamiones hasta 30 toneladas.',
    status: 'Operativo — Bloqueo de seguridad activo',
    statusTone: 'ok',
    location: 'Taller 01 — Bahía 1',
    details: [
      '4 columnas sincronizadas con paro de emergencia',
      'Permite elevar o descender el Volvo FH en tiempo real'
    ],
    cameraPreset: 'bay1_repair',
    supportsLiftToggle: true
  },
  'inspection-pit': {
    id: 'inspection-pit',
    name: 'Fosa de Inspección Subterránea LED',
    category: 'zona',
    role: 'Inspección segura de chasis, transmisión, diferencial y líneas de aire.',
    status: 'Despejada e iluminada',
    statusTone: 'ok',
    location: 'Taller 01 — Bahía 2',
    details: [
      'Perímetro señalizado con franjas de precaución',
      'Iluminación LED lateral antideslumbrante hacia el chasis'
    ],
    cameraPreset: 'inspection_pit',
    relatedWorkOrderId: 'wo-diag'
  },
  'diag-station': {
    id: 'diag-station',
    name: 'Estación Móvil de Diagnóstico J1939',
    category: 'herramienta',
    glbFileName: 'workshop-diag-cart.glb',
    role: 'Lectura de ECUs, calibración de inyectores y pruebas de actuadores.',
    status: 'Enlazada con Bahía 2 (Telemetría en vivo)',
    statusTone: 'active',
    location: 'Taller 01 — Lateral Bahía 2',
    details: [
      'Modelo 3D: workshop-diag-cart.glb',
      'Interfaz de comunicación pesada J1939 y osciloscopio en vivo'
    ],
    cameraPreset: 'bay2_diagnostic',
    relatedWorkOrderId: 'wo-diag'
  },
  'tool-cart-1': {
    id: 'tool-cart-1',
    name: 'Carro de Herramientas y Gato Hidráulico',
    category: 'herramienta',
    role: 'Almacenamiento móvil de llaves de impacto, torquímetros y dados pesados.',
    status: 'Completo y disponible',
    statusTone: 'ok',
    location: 'Taller 01 — Entre Bahía 1 y Banco 1',
    details: [
      'Incluye pistola neumática de 1" y torquímetro calibrado',
      'Gato hidráulico de patín de 20 toneladas adyacente'
    ],
    cameraPreset: 'bay1_repair'
  },
  'air-compressor': {
    id: 'air-compressor',
    name: 'Compresor Industrial de Tornillo',
    category: 'equipamiento',
    role: 'Suministro de aire comprimido a 10 bar para herramientas neumáticas.',
    status: 'Presión nominal (9.8 bar)',
    statusTone: 'ok',
    location: 'Taller 01 — Muro Norte',
    details: [
      'Tanque acumulador de 500 L con mangueras retráctiles',
      'Alimentación conectada a Taller 01 y Taller 03'
    ],
    cameraPreset: 'bay1_repair'
  },
  'workbench-1': {
    id: 'workbench-1',
    name: 'Banco de Trabajo Pesado y Lámpara LED',
    category: 'zona',
    role: 'Desarmado de subconjuntos, prensado y verificación dimensional.',
    status: 'En uso',
    statusTone: 'info',
    location: 'Taller 01 — Lateral Oeste',
    details: [
      'Tornillo de banco industrial y lámpara articulada LED',
      'Componentes de freno listos para montaje'
    ],
    cameraPreset: 'bay1_repair'
  },
  'rack-parts': {
    id: 'rack-parts',
    name: 'Estantería de Repuestos y Lubricantes',
    category: 'inventario',
    role: 'Almacenamiento clasificado de filtros, bidones de aceite y cajas técnicas.',
    status: '1 artículo bajo mínimo',
    statusTone: 'warning',
    location: 'Taller 01 — Zona de Almacén',
    details: [
      'Filtros D13/D16, aceites 15W-40 y refacciones eléctricas',
      'Consulta existencias completas en la sección Inventario'
    ],
    cameraPreset: 'warehouse'
  },
  'rack-tires': {
    id: 'rack-tires',
    name: 'Estación de Ruedas y Neumáticos 22.5" (rueda.glb)',
    category: 'inventario',
    glbFileName: 'rueda.glb',
    role: 'Resguardo vertical de neumáticos radiales para ejes direccional y motriz.',
    status: 'Stock óptimo (8 unidades)',
    statusTone: 'ok',
    location: 'Taller 01 — Zona de Almacén',
    details: [
      'Neumáticos 315/80 R22.5 listos para montaje',
      'Zona delimitada con acceso para montacargas'
    ],
    cameraPreset: 'warehouse'
  },
  'spare-engine-stand': {
    id: 'spare-engine-stand',
    name: 'Motor Diésel D16 en Soporte Giratorio',
    category: 'inventario',
    glbFileName: 'diesel-engine-inline6.glb',
    role: 'Bloque de motor de 6 cilindros en banco rotatorio para reconstrucción.',
    status: 'Prueba de giro activa',
    statusTone: 'info',
    location: 'Taller 01 — Zona de Motores',
    details: [
      'Modelo 3D: diesel-engine-inline6.glb optimizado',
      'Accesible 360° para entrenamiento y armado'
    ],
    cameraPreset: 'warehouse',
    relatedWorkOrderId: 'wo-engine'
  },
  'mechanic-1': {
    id: 'mechanic-1',
    name: 'Técnico Carlos Méndez (Jefe Tren Motriz)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Ejecución de orden OT-2026-104 en Bahía 1.',
    status: 'Activo — EPP completo',
    statusTone: 'active',
    location: 'Taller 01 — Bahía 1',
    details: [
      'Especialista en motores D13/D16 y transmisión I-Shift',
      'Asignado a Volvo FH16 Tractocamión'
    ],
    cameraPreset: 'bay1_repair',
    relatedWorkOrderId: 'wo-engine'
  },
  'mechanic-2': {
    id: 'mechanic-2',
    name: 'Técnica Laura Morales (Diagnóstico J1939)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Análisis de módulos electrónicos en Bahía 2.',
    status: 'Activa — Visor AR conectado',
    statusTone: 'active',
    location: 'Taller 01 — Bahía 2',
    details: [
      'Monitoreo de telemetría CAN-Bus y sensores EBS',
      'Asignada a Volvo FMX Camión Rígido'
    ],
    cameraPreset: 'bay2_diagnostic',
    relatedWorkOrderId: 'wo-diag'
  },
  'mechanic-3': {
    id: 'mechanic-3',
    name: 'Técnico Marco Ruiz (Especialista Carrocería)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Alineación láser y soldadura de cabina en Taller 02.',
    status: 'Operando escáner láser AR',
    statusTone: 'active',
    location: 'Taller 02 — Celda de Carrocería',
    details: [
      'Control dimensional sobre modelo carroceria.glb',
      'Orden activa: OT-2026-115'
    ],
    cameraPreset: 'workshop_body',
    relatedWorkOrderId: 'wo-body'
  },
  'mechanic-4': {
    id: 'mechanic-4',
    name: 'Técnica Sofía Vega (Ensamblaje de Puertas)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Calibración de bisagras, cerraduras y sellos de puerta lateral.',
    status: 'En calibración de puerta.glb',
    statusTone: 'ok',
    location: 'Taller 02 — Bastidor de Puertas',
    details: [
      'Ajuste de mecanismo eléctrico y hermeticidad acústica',
      'Orden activa: OT-2026-115'
    ],
    cameraPreset: 'workshop_body',
    relatedWorkOrderId: 'wo-body'
  },
  'mechanic-5': {
    id: 'mechanic-5',
    name: 'Técnico Diego Herrera (Estructuras y Chasis)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Inspección de torsión y soldadura en bastidor 6x4.',
    status: 'Operando puente grúa y soldadura',
    statusTone: 'warning',
    location: 'Taller 03 — Bancada de Chasis',
    details: [
      'Trabajo directo sobre bastidor chasis.glb',
      'Orden activa: OT-2026-121'
    ],
    cameraPreset: 'workshop_chassis',
    relatedWorkOrderId: 'wo-chassis'
  },
  'mechanic-6': {
    id: 'mechanic-6',
    name: 'Técnico Andrés Silva (Neumática y Aire)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Pruebas de presión en compresor, secador APM y climatización.',
    status: 'Certificando módulo aire.glb',
    statusTone: 'ok',
    location: 'Taller 03 — Laboratorio de Aire',
    details: [
      'Pruebas a 12.5 bar en unidad aire.glb',
      'Orden activa: OT-2026-121'
    ],
    cameraPreset: 'workshop_chassis',
    relatedWorkOrderId: 'wo-chassis'
  },
  'mechanic-7': {
    id: 'mechanic-7',
    name: 'Técnica Elena Castro (Instrumentación y Tablero)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Integración de pantallas digitales y arnés principal en tablero.',
    status: 'Simulando red CAN-Bus en tablero.glb',
    statusTone: 'active',
    location: 'Taller 04 — Banco de Tableros',
    details: [
      'Diagnóstico de clúster digital en modelo tablero.glb',
      'Orden activa: OT-2026-128'
    ],
    cameraPreset: 'workshop_interior',
    relatedWorkOrderId: 'wo-interior'
  },
  'mechanic-8': {
    id: 'mechanic-8',
    name: 'Técnico Miguel Torres (Ergonomía y Asientos)',
    category: 'personal',
    glbFileName: 'mechanic-ppe.glb',
    role: 'Calibración de válvulas neumáticas y amortiguación en asientos.',
    status: 'Probando suspensión en asientos.glb',
    statusTone: 'ok',
    location: 'Taller 04 — Plataforma de Asientos',
    details: [
      'Pruebas dinámicas de confort sobre modelo asientos.glb',
      'Orden activa: OT-2026-128'
    ],
    cameraPreset: 'workshop_interior',
    relatedWorkOrderId: 'wo-interior'
  }
}
