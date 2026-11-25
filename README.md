# Complejo Industrial Volvo XR 3D (Nuxt 4 + Vue 3 + TypeScript + Three.js)

Simulador interactivo 3D estilo **Videojuego / Realidad Aumentada y Virtual (AR/VR)** con **4 Talleres Especializados**, iluminación PBR realista (`RoomEnvironment` + barniz automotriz *clearcoat*), escáneres láser holográficos, animaciones en tiempo real y carga automática o por *drag & drop* de modelos `.glb`.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Los 4 Talleres Especializados del Complejo 3D

1. **Taller 01 • Tren Motriz y Servicio Pesado (`SECTOR ALPHA-01`)**:
   - Bahía 1 con elevador electrohidráulico de 4 columnas (`volvo-fh-tractor.glb`).
   - Bahía 2 con fosa subterránea LED y estación de telemetría (`volvo-fmx-rigid.glb`, `workshop-diag-cart.glb`).
   - Zona de reconstrucción de motor diésel D16 (`diesel-engine-inline6.glb`).
2. **Taller 02 • Carrocería, Cabina y Puertas (`SECTOR BETA-02`)**:
   - Celda de escaneo láser holográfico AR para carrocería (`carroceria.glb`).
   - Bastidor hidráulico con animación de apertura para puerta de cabina (`puerta.glb`).
3. **Taller 03 • Chasis Estructural y Neumática (`SECTOR GAMMA-03`)**:
   - Bancada de alineación estructural bajo puente grúa móvil y soldadura activa (`chasis.glb`).
   - Laboratorio de aire comprimido, filtrado APM y climatización (`aire.glb`).
4. **Taller 04 • Lab. Tablero Digital y Asientos (`SECTOR DELTA-04`)**:
   - Banco electrónico antiestático CAN-Bus J1939 para tablero (`tablero.glb`).
   - Plataforma vibratoria de confort para asientos neumáticos (`asientos.glb`).

## Modelos 3D `.glb` soportados

Puedes colocar cualquiera de estos archivos en `public/models/` (o **arrastrarlos directamente a la ventana del navegador** / usar el botón **"+ Cargar .GLB"** en el HUD superior):

- `public/models/volvo-fh-tractor.glb`
- `public/models/volvo-fmx-rigid.glb`
- `public/models/diesel-engine-inline6.glb`
- `public/models/mechanic-ppe.glb` (instanciado en los 8 técnicos de los 4 talleres)
- `public/models/workshop-diag-cart.glb`
- `public/models/carroceria.glb`
- `public/models/puerta.glb`
- `public/models/chasis.glb`
- `public/models/aire.glb`
- `public/models/tablero.glb`
- `public/models/asientos.glb`
