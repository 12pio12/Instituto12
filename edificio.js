// ============================================================
// INSTITUTO TECNOLÓGICO PÍO XII — VISOR 3D DEL CAMPUS
// ============================================================
// Three.js + GLTFLoader + OrbitControls + GSAP
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// 0. CONFIGURACIÓN EDITABLE DE CÁMARA POR CARRERA
// ============================================================
// Las posiciones de cada carrera se calculan como FRACCIONES
// (0 a 1) del tamaño real del edificio, una vez que el modelo
// .glb ya está cargado.
//
// Para cada destino defines:
//   piso      : 0 (planta baja), 1, 2 o 3
//   lado      : 'derecha' | 'izquierda' (opcional). Elige en qué
//               lado del piso se coloca la cámara, visto desde la
//               puerta mirando hacia adentro (derecha = +X).
//   xFraccion : posición provisional (0 = izquierda, 1 = derecha)
//               mientras termina el análisis real del edificio.
//   giro      : rotación horizontal de la cámara en grados (opcional).
//   manual    : { posicion, objetivo } para fijar el punto exacto
//               (en campus.html pulsa P para copiar coordenadas).
// ============================================================

const CONFIG_CAMARA = {

    // Duración y easing de todos los vuelos de cámara (GSAP)
    duracionDefecto: 2.4,
    easingDefecto: 'power2.inOut',

    // Fracción vertical (0 a 1) de la altura del edificio en la
    // que se ubica cada piso (posiciones provisionales).
    fraccionesPiso: {
        0: 0.05,
        1: 0.23,
        2: 0.48,
        3: 0.65
    },

    zFraccionCamaraDefecto: 0.72,
    zFraccionObjetivoDefecto: 0.27,

    // Vista general del campus (botón "Vista general").
    // Se recalcula automáticamente al cargar el modelo.
    vistaCampus: null,

    // ------------------------------------------------------------
    // INTERIOR DEL EDIFICIO (todo se detecta solo al cargar el modelo)
    // ------------------------------------------------------------
    // entradaManual     : null = automática (busca la puerta principal).
    //                     O { posicion:{x,y,z}, objetivo:{x,y,z} }
    // alturasPisoManual : null = automático. O [yPB, yP1, yP2, yP3]
    entradaManual: null,
    alturasPisoManual: null,

    // Un destino por cada botón de #menuCarreras (data-carrera="...")
    destinos: {
        administracion: { nombre: 'Administración de Empresas', piso: 0, lado: 'derecha',   xFraccion: 0.75 },  // planta baja, salón grande con sillas (derecha)
        administrativo: { nombre: 'Área Administrativa',        piso: 1, lado: 'izquierda', xFraccion: 0.25 },  // oficinas administrativas, primer piso
        contaduria:     { nombre: 'Contaduría General',         piso: 1 },   // 1.er piso
        secretariado:   { nombre: 'Secretariado Ejecutivo',     piso: 2 },   // 2.º piso
        sistemas:       { nombre: 'Sistemas Informáticos',      piso: 3 },   // 3.er piso
        gastronomia:    { nombre: 'Gastronomía', piso: 0, lado: 'izquierda', xFraccion: 0.25, giro: 180 } // ubicación anterior de Área Administrativa, mirando al lado opuesto
    }
};

// ============================================================
// INFORMACIÓN COMPLETA DE LAS CARRERAS
// ============================================================

const INFORMACION_CARRERAS = {

    contaduria: {
        titulo: 'CONTABILIDAD GENERAL',
        area: 'Área comercial y administrativa',
        resumen: 'Contabilidad financiera y gestión tributaria',
        imagen: 'imagenes/logo_carrera_conta.jpg',
        detalle: `Es una de las carreras pilares de la institución. Capacita en contabilidad financiera, auditoría básica, gestión tributaria y preparación de estados financieros para empresas públicas o privadas.

Duración general: 3 años · Nivel: Técnico Superior.`
    },

    secretariado: {
        titulo: 'SECRETARIADO EJECUTIVO',
        area: 'Área comercial y administrativa',
        resumen: 'Gestión de oficinas y asistencia administrativa',
        imagen: 'imagenes/logo_carrera_secretariado.jpg',
        detalle: `Está enfocada en la gestión de oficinas y la asistencia administrativa. Desarrolla destrezas en redacción comercial, archivo digital, relaciones públicas, etiqueta corporativa y herramientas de computación aplicadas a la oficina.

Duración general: 3 años · Nivel: Técnico Superior.`
    },

    administracion: {
        titulo: 'ADMINISTRACIÓN DE EMPRESAS',
        area: 'Área comercial y administrativa',
        resumen: 'Planificación y dirección de negocios',
        imagen: 'imagenes/logo_carrera_admi.jpg',
        detalle: `Orienta a los estudiantes en la planificación, organización, dirección y control de recursos para negocios locales y emprendimientos autónomos.

Duración general: 3 años · Nivel: Técnico Superior.`
    },

    administrativo: {
        titulo: 'ÁREA ADMINISTRATIVA',
        area: 'Gestión institucional',
        resumen: 'Trámites, inscripciones y atención al estudiante',
        imagen: 'imagenes/logo_administrativo.jpg',
        detalle: `¿Qué puedes hacer aquí?
• Inscripciones y reinscripciones
• Solicitud de certificados y documentos
• Pagos de mensualidades y consultas de cuentas
• Orientación sobre carreras, horarios y requisitos
• Atención a padres de familia y estudiantes

Atención en horario de oficina.`
    },

    sistemas: {
        titulo: 'SISTEMAS INFORMÁTICOS',
        area: 'Área de tecnología e informática',
        resumen: 'Soporte técnico, redes y bases de datos',
        imagen: 'imagenes/logo_carrera_sistemas.jpg',
        detalle: `Prepara profesionales capaces de dar soporte técnico a computadoras, diseñar redes de comunicación locales y gestionar bases de datos para optimizar los procesos de información de las empresas.

Duración general: 3 años · Nivel: Técnico Superior.`
    },

    gastronomia: {
        titulo: 'GASTRONOMÍA',
        area: 'Especialidad técnica y productiva',
        resumen: 'Cocina, repostería y gestión gastronómica',
        imagen: 'imagenes/logo_gastronomia.jpg',
        detalle: `Está enfocada en el arte culinario, las técnicas de cocina nacional e internacional, la repostería y la gestión de negocios de alimentos y bebidas.

Duración general: 3 años · Nivel: Técnico Superior.`
    }
};

// ============================================================
// 1. CONTENEDOR Y MODO
// ============================================================

const contenedor = document.getElementById('visor3D');
const modoExploracion = document.body.dataset.modo === 'exploracion';
const indicadorCarga = document.getElementById('cargaModelo');

// ============================================================
// 2. ESCENA
// ============================================================

const escena = new THREE.Scene();
escena.background = null; // deja ver el fondo PNG del CSS

// ============================================================
// 3. CÁMARA PERSPECTIVA
// ============================================================

const camara = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);
camara.position.set(0, 5, 35);

// ============================================================
// 4. RENDERIZADOR A PANTALLA COMPLETA
// ============================================================

const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.outputEncoding = THREE.sRGBEncoding;
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1.0;
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
contenedor.appendChild(renderizador.domElement);

// ============================================================
// 5. CONTROLES ORBITALES
// ============================================================

const controles = new OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;
controles.dampingFactor = 0.04;
controles.enableZoom = true;
controles.zoomSpeed = 0.18;
controles.enablePan = !modoExploracion;
controles.panSpeed = 0.2;
controles.rotateSpeed = 0.12;
controles.minDistance = 8;
controles.maxDistance = 400;
controles.minPolarAngle = 0.1;
controles.maxPolarAngle = Math.PI * 0.49;

// ============================================================
// 6. LUCES
// ============================================================

const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.7);
escena.add(luzAmbiental);

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.4);
luzPrincipal.castShadow = true;
luzPrincipal.shadow.mapSize.set(2048, 2048);
luzPrincipal.shadow.camera.near = 0.5;
luzPrincipal.shadow.camera.far = 500;
luzPrincipal.shadow.bias = -0.0004;
luzPrincipal.shadow.normalBias = 0.05;
escena.add(luzPrincipal);
escena.add(luzPrincipal.target);

const luzRelleno = new THREE.DirectionalLight(0x9ec9ff, 0.35);
luzRelleno.position.set(-40, 40, -50);
escena.add(luzRelleno);

const luzSuperior = new THREE.HemisphereLight(0xffffff, 0x223344, 0.35);
escena.add(luzSuperior);

// Dos focos cálidos junto a la entrada (solo se encienden de noche)
const lucesEntrada = [0, 1].map(() => {
    const luz = new THREE.PointLight(0xffc878, 0, 60, 1.5);
    escena.add(luz);
    return luz;
});

// ------------------------------------------------------------
// 6.1 CICLO DÍA / TARDE / NOCHE
// ------------------------------------------------------------

const PRESETS_LUZ = {
    dia: {
        ambiental:  { color: 0xffffff, intensidad: 0.75 },
        sol:        { color: 0xfff3df, intensidad: 1.6, direccion: [0.5, 0.8, 0.5] },
        relleno:    { color: 0x9ec9ff, intensidad: 0.35 },
        hemisferio: { cielo: 0xffffff, suelo: 0x445566, intensidad: 0.40 },
        exposicion: 1.0, ventanas: 0, focos: 0
    },
    tarde: {
        ambiental:  { color: 0xffc9a0, intensidad: 0.50 },
        sol:        { color: 0xff9a4d, intensidad: 1.5, direccion: [0.95, 0.28, 0.45] },
        relleno:    { color: 0x7a6cff, intensidad: 0.30 },
        hemisferio: { cielo: 0xffb27a, suelo: 0x2a2040, intensidad: 0.38 },
        exposicion: 0.95, ventanas: 0.25, focos: 0.3
    },
    noche: {
        ambiental:  { color: 0x3a4a8a, intensidad: 0.30 },
        sol:        { color: 0x8fb2ff, intensidad: 0.40, direccion: [-0.45, 0.75, 0.5] },
        relleno:    { color: 0x2a3a7a, intensidad: 0.22 },
        hemisferio: { cielo: 0x203060, suelo: 0x05070d, intensidad: 0.28 },
        exposicion: 0.9, ventanas: 1, focos: 1.8
    }
};

const materialesVentana = [];            // se llena al cargar el modelo
const direccionSol = new THREE.Vector3(0.5, 0.8, 0.5);
const brilloVentanas = { valor: 0 };
let distanciaSol = 100;
let lineaLuz = null;

function actualizarSol() {
    luzPrincipal.position.copy(direccionSol).normalize().multiplyScalar(distanciaSol);
}

function actualizarVentanas() {
    const v = brilloVentanas.valor;
    materialesVentana.forEach((m) => {
        if (v > 0.001) {
            m.material.emissive.setHex(0xffd98a);
            m.material.emissiveIntensity = v * 0.9;
        } else {
            m.material.emissive.copy(m.emisivoOriginal);
            m.material.emissiveIntensity = m.intensidadOriginal;
        }
    });
}

function aplicarIluminacion(nombre, instantaneo = false) {
    const p = PRESETS_LUZ[nombre];
    if (!p) return;

    document.body.dataset.luz = nombre;
    document.querySelectorAll('button[data-luz]').forEach((boton) => {
        const activo = boton.dataset.luz === nombre;
        boton.classList.toggle('activo', activo);
        boton.setAttribute('aria-pressed', String(activo));
    });

    const col = (hex) => { const k = new THREE.Color(hex); return { r: k.r, g: k.g, b: k.b }; };
    const dir = new THREE.Vector3(...p.sol.direccion).normalize();

    const cambios = [
        [luzAmbiental.color, col(p.ambiental.color)],
        [luzAmbiental, { intensity: p.ambiental.intensidad }],
        [luzPrincipal.color, col(p.sol.color)],
        [luzPrincipal, { intensity: p.sol.intensidad }],
        [luzRelleno.color, col(p.relleno.color)],
        [luzRelleno, { intensity: p.relleno.intensidad }],
        [luzSuperior.color, col(p.hemisferio.cielo)],
        [luzSuperior.groundColor, col(p.hemisferio.suelo)],
        [luzSuperior, { intensity: p.hemisferio.intensidad }],
        [direccionSol, { x: dir.x, y: dir.y, z: dir.z }],
        [renderizador, { toneMappingExposure: p.exposicion }],
        [brilloVentanas, { valor: p.ventanas }],
        ...lucesEntrada.map((luz) => [luz, { intensity: p.focos }])
    ];

    if (lineaLuz) lineaLuz.kill();

    if (instantaneo || typeof gsap === 'undefined') {
        cambios.forEach(([objeto, valores]) => Object.assign(objeto, valores));
        actualizarSol();
        actualizarVentanas();
        return;
    }

    lineaLuz = gsap.timeline({
        onUpdate: () => { actualizarSol(); actualizarVentanas(); }
    });
    cambios.forEach(([objeto, valores]) => {
        lineaLuz.to(objeto, { ...valores, duration: 1.6, ease: 'power2.inOut' }, 0);
    });
}

// Ajusta sombras y focos al tamaño REAL del edificio (se llama al cargar)
function ajustarLucesAlModelo() {
    const maxDim = Math.max(tamañoModelo.x, tamañoModelo.y, tamañoModelo.z);
    distanciaSol = maxDim * 1.6;

    const cs = luzPrincipal.shadow.camera;
    const r = maxDim * 0.8;
    cs.left = -r; cs.right = r; cs.top = r; cs.bottom = -r;
    cs.near = maxDim * 0.05;
    cs.far = maxDim * 4;
    cs.updateProjectionMatrix();

    luzPrincipal.target.position.set(0, cajaModelo.min.y + tamañoModelo.y * 0.3, 0);
    luzPrincipal.target.updateMatrixWorld();

    lucesEntrada.forEach((luz, i) => {
        luz.distance = maxDim * 0.7;
        luz.position.set(
            X_CENTRO_VISTA + (i ? 1 : -1) * tamañoModelo.x * 0.12,
            cajaModelo.min.y + tamañoModelo.y * 0.3,
            cajaModelo.max.z + tamañoModelo.z * 0.06
        );
    });
    actualizarSol();
}

aplicarIluminacion('dia', true);

// ============================================================
// 7. CARGA DEL MODELO .GLB (GLTFLoader)
// ============================================================

const cargador = new GLTFLoader();

let modeloCargado = null;
let pivoteGiroModelo = null;
let nivelBaseModelo = 0;
let cajaModelo = null;   // THREE.Box3 real del edificio, ya centrado y rotado
let tamañoModelo = null; // THREE.Vector3 con ancho/alto/profundidad reales
const mallasColision = [];
const mallasSuelo = [];
const mallasBarandas = [];   // barandas / pasamanos: lo único que bloquea el paso (además del borde del piso)
const mallasParedes = [];    // paredes y objetos: SIN colisión; solo se usan para orientar la cámara al ubicar carreras
const RE_BARANDA = /baranda|barandilla|barandal|pasamanos|guardarra|railing|handrail|guardrail|balaustr|parapet/i;

cargador.load(
    './modelos/ModeloInstituto12.glb',

    // --- éxito ---------------------------------------------
    (gltf) => {
        const modelo = gltf.scene;
        modeloCargado = modelo;

        modelo.traverse((objeto) => {
            if (objeto.isMesh) {
                objeto.castShadow = true;
                objeto.receiveShadow = true;
                if (objeto.material?.map) {
                    objeto.material.map.encoding = THREE.sRGBEncoding;
                }

                const lista = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
                lista.forEach((material) => {
                    const esVentana = /vidrio|glass|ventana|window|cristal/i.test(material.name + ' ' + objeto.name);
                    if (esVentana && material.emissive && !materialesVentana.some((m) => m.material === material)) {
                        materialesVentana.push({
                            material,
                            emisivoOriginal: material.emissive.clone(),
                            intensidadOriginal: material.emissiveIntensity ?? 1
                        });
                    }
                });
            }
        });

        // --- centrar el modelo en el origen (antes de rotar) ---
        const cajaPrevia = new THREE.Box3().setFromObject(modelo);
        const centroPrevio = cajaPrevia.getCenter(new THREE.Vector3());
        modelo.position.sub(centroPrevio);

        // Rotación inicial del edificio para mostrar directamente la puerta
        modelo.rotation.y = Math.PI / 1.5; // ~120° (ajusta según el modelo)

        // --- re-centrar después de rotar ---
        escena.add(modelo);

        const cajaRotada = new THREE.Box3().setFromObject(modelo);
        const centroRotado = cajaRotada.getCenter(new THREE.Vector3());
        modelo.position.x -= centroRotado.x;
        modelo.position.z -= centroRotado.z;
        // el eje Y se deja tal cual para que el edificio "pise" y=0

        // --- bounding box FINAL, ya real y ya centrado ---
        cajaModelo = new THREE.Box3().setFromObject(modelo);
        tamañoModelo = cajaModelo.getSize(new THREE.Vector3());
        nivelBaseModelo = cajaModelo.min.y;
        pivoteGiroModelo = new THREE.Group();
        pivoteGiroModelo.position.copy(cajaModelo.getCenter(new THREE.Vector3()));
        escena.add(pivoteGiroModelo);
        pivoteGiroModelo.attach(modelo);
        modelo.updateMatrixWorld(true);
        modelo.traverse((objeto) => {
            if (!objeto.isMesh) return;

            // Las barandas SIEMPRE colisionan (aunque estén dentro de una
            // escalera o sean de vidrio) y nunca sirven de suelo.
            const esBaranda = tieneAncestroConNombre(objeto, RE_BARANDA);
            const esEscalera = !esBaranda && tieneAncestroConNombre(
                objeto,
                /grada|escalera|stair|step|pelda/i
            );
            const esPuertaOVidrio = !esBaranda && tieneAncestroConNombre(
                objeto,
                /puerta|door|vidrio|glass|ventana|window|cristal/i
            );
            const materiales = Array.isArray(objeto.material)
                ? objeto.material.map((material) => crearMaterialColision(material))
                : crearMaterialColision(objeto.material);
            const mallaColision = new THREE.Mesh(objeto.geometry, materiales);
            mallaColision.matrixAutoUpdate = false;
            mallaColision.matrixWorldAutoUpdate = false;
            mallaColision.matrixWorld.copy(objeto.matrixWorld);
            if (!esPuertaOVidrio && !esBaranda) mallasSuelo.push(mallaColision);
            if (esBaranda) {
                mallasColision.push(mallaColision);
                mallasBarandas.push(mallaColision);
            } else if (!esPuertaOVidrio && !esEscalera) {
                mallasParedes.push(mallaColision);   // sin colisión
            }
        });

        const tamañoMaximo = Math.max(tamañoModelo.x, tamañoModelo.y, tamañoModelo.z);

        console.log('Modelo 3D cargado correctamente.');
        console.log('Tamaño real del edificio (x, y, z):', tamañoModelo);
        console.log('Bounding box:', cajaModelo.min, cajaModelo.max);

        // --- vistas de cámara y coordenadas reales ---
        calcularVistaCampus();
        calcularDestinosCarreras();
        ajustarLucesAlModelo();

        controles.minDistance = Math.max(tamañoMaximo * 0.15, 5);
        controles.maxDistance = Math.max(tamañoMaximo * 3, 200);

        // Modo exploración = primera persona
        if (modoExploracion) {
            controles.minDistance = 0.05;
            controles.enableZoom = false;
            controles.minPolarAngle = Math.PI * 0.2;
            controles.maxPolarAngle = Math.PI * 0.8;
        }

        // index.html: vista general ampliada · campus.html: frente a la puerta
        const vista = modoExploracion
            ? CONFIG_CAMARA.vistaEntrada
            : CONFIG_CAMARA.vistaCampus;
        camara.position.set(vista.posicion.x, vista.posicion.y, vista.posicion.z);
        controles.target.set(vista.objetivo.x, vista.objetivo.y, vista.objetivo.z);
        if (!modoExploracion) {
            const desplazamientoInicial = camara.position.clone().sub(controles.target);
            const anguloVertical = Math.acos(
                THREE.MathUtils.clamp(
                    desplazamientoInicial.y / desplazamientoInicial.length(),
                    -1,
                    1
                )
            );
            controles.minPolarAngle = anguloVertical;
            controles.maxPolarAngle = anguloVertical;
        }
        controles.update();

        // ¿Hay suelo bajo la cámara? Si sí, no dejamos caminar al vacío.
        exigirSuelo = modoExploracion
            && alturaSueloEn(camara.position.x, camara.position.y, camara.position.z, alturaJugador + 1) !== null;

        crearHotspots();
        if (modoExploracion) analizarEdificio();

        if (indicadorCarga) indicadorCarga.classList.add('oculto');
    },

    // --- progreso --------------------------------------------
    (progreso) => {
        if (progreso.total > 0 && indicadorCarga) {
            const porcentaje = (progreso.loaded / progreso.total) * 100;
            indicadorCarga.textContent = `Cargando modelo 3D... ${porcentaje.toFixed(0)}%`;
            indicadorCarga.style.setProperty('--p', porcentaje.toFixed(0) + '%');
        }
    },

    // --- error -------------------------------------------------
    (error) => {
        console.error('Error al cargar el modelo 3D:', error);
        if (indicadorCarga) {
            indicadorCarga.textContent =
                'No se pudo cargar el modelo 3D. Verifica que exista en ./modelos/.';
        }
    }
);

// ============================================================
// 7.1 VISTA GENERAL DEL CAMPUS — SIEMPRE MUESTRA TODO EL EDIFICIO
// ============================================================

// Posición X (en unidades del modelo) donde está la puerta principal.
// Si la cámara no queda justo frente a la puerta, ajusta SOLO este número.
const X_CENTRO_VISTA = -15;

function calcularVistaCampus() {
    const maxH = Math.max(tamañoModelo.x, tamañoModelo.z);

    // Distancia reducida (factor 0.45) => el edificio se ve mucho más grande
    const distancia = (maxH / 2) / Math.tan(THREE.MathUtils.degToRad(20)) * 0.45;
    const base = cajaModelo.min.y;

    CONFIG_CAMARA.vistaCampus = {
        nombre: 'Vista general del campus',
        posicion: { x: X_CENTRO_VISTA, y: base + tamañoModelo.y * 0.85, z: distancia },
        objetivo: { x: X_CENTRO_VISTA, y: base + tamañoModelo.y * 0.30, z: 0 }
    };

    // Vista de entrada: DENTRO del edificio, justo pasando la puerta principal.
    CONFIG_CAMARA.vistaEntrada = calcularVistaEntrada();

    console.log('Vistas calculadas:', CONFIG_CAMARA.vistaCampus, CONFIG_CAMARA.vistaEntrada);
}

// ============================================================
// 7.2 COORDENADAS REALES POR CARRERA (a partir de fracciones)
// ============================================================

// Posiciones PROVISIONALES (fracciones del edificio). Sirven mientras
// termina el análisis real de pisos (unos segundos) o si este falla.
function calcularDestinosCarreras() {
    const { fraccionesPiso, zFraccionCamaraDefecto, zFraccionObjetivoDefecto } = CONFIG_CAMARA;

    Object.values(CONFIG_CAMARA.destinos).forEach((destino) => {
        if (destino.manual) {
            aplicarManual(destino);
            return;
        }
        const fraccionY = fraccionesPiso[destino.piso ?? 0] ?? 0.5;
        const y = cajaModelo.min.y + fraccionY * tamañoModelo.y;
        const x = cajaModelo.min.x + (destino.xFraccion ?? 0.3) * tamañoModelo.x;
        const zCamara = cajaModelo.min.z + zFraccionCamaraDefecto * tamañoModelo.z;
        const zObjetivo = cajaModelo.min.z + zFraccionObjetivoDefecto * tamañoModelo.z;
        const direccion = girarDireccion(0, zObjetivo - zCamara, destino.giro);

        destino.posicion = { x, y: y + tamañoModelo.y * 0.04, z: zCamara };
        destino.objetivo = { x: x + direccion.dx, y, z: zCamara + direccion.dz };
        destino.pin = { x, y, z: zObjetivo };
    });
}

function aplicarManual(destino) {
    destino.posicion = { ...destino.manual.posicion };
    destino.objetivo = { ...destino.manual.objetivo };
    destino.pin = {
        x: destino.posicion.x,
        y: destino.posicion.y,
        z: destino.posicion.z
    };
}

// ============================================================
// 7.3 ANÁLISIS AUTOMÁTICO DEL INTERIOR (puerta, pisos, escaleras)
// ============================================================

const DIST_FPS = 0.15;                      // distancia cámara→objetivo (primera persona)
const vecAbajo = new THREE.Vector3(0, -1, 0);
const vecArriba = new THREE.Vector3(0, 1, 0);

let puertaPrincipal = null;
let puntosCaminables = [];
let nivelesPiso = [];

function alturaSueloEn(x, yDesde, z, lejos = 4) {
    raycasterMovimiento.set(new THREE.Vector3(x, yDesde, z), vecAbajo);
    raycasterMovimiento.far = lejos;
    const impacto = raycasterMovimiento.intersectObjects(mallasSuelo, false)[0];
    return impacto ? impacto.point.y : null;
}

function crearVistaFPS(x, ySuelo, z, dx, dz) {
    const y = ySuelo + alturaJugador;
    return {
        posicion: { x, y, z },
        objetivo: { x: x + dx * DIST_FPS, y, z: z + dz * DIST_FPS }
    };
}

function girarDireccion(dx, dz, grados = 0) {
    const angulo = THREE.MathUtils.degToRad(grados);
    const coseno = Math.cos(angulo);
    const seno = Math.sin(angulo);
    return {
        dx: dx * coseno + dz * seno,
        dz: -dx * seno + dz * coseno
    };
}

function encontrarPuertaPrincipal() {
    let mejor = null;
    modeloCargado.traverse((objeto) => {
        if (!objeto.isMesh || !tieneAncestroConNombre(objeto, /puerta|door/i)) return;
        const caja = new THREE.Box3().setFromObject(objeto);
        if (caja.isEmpty()) return;
        if (caja.max.y - caja.min.y < alturaJugador * 0.8) return;                  // demasiado baja
        if (caja.min.y > cajaModelo.min.y + tamañoModelo.y * 0.2) return;            // no es de planta baja
        const centro = caja.getCenter(new THREE.Vector3());
        if (!mejor || centro.z > mejor.centro.z) mejor = { caja, centro };           // la más frontal
    });
    return mejor;
}

function calcularVistaEntrada() {
    if (CONFIG_CAMARA.entradaManual) {
        return { nombre: 'Entrada principal', ...CONFIG_CAMARA.entradaManual };
    }

    puertaPrincipal = encontrarPuertaPrincipal();
    let x, z, yBase;

    if (puertaPrincipal) {
        x = puertaPrincipal.centro.x;
        z = puertaPrincipal.centro.z - alturaJugador * 2;   // ~3.4 unidades dentro
        yBase = puertaPrincipal.caja.min.y;
        console.log('Puerta principal detectada en:', puertaPrincipal.centro);
    } else {
        x = X_CENTRO_VISTA;
        z = cajaModelo.max.z - tamañoModelo.z * 0.12;
        yBase = cajaModelo.min.y;
        console.warn('No encontré ninguna puerta (nombre con "puerta"/"door"). Usando posición aproximada. '
            + 'Ajusta con CONFIG_CAMARA.entradaManual (tecla P en el campus).');
    }

    const ySuelo = alturaSueloEn(x, yBase + 1.2, z) ?? yBase;
    return { nombre: 'Entrada principal', ...crearVistaFPS(x, ySuelo, z, 0, -1) };
}

function tieneTecho(p) {
    raycasterMovimiento.set(new THREE.Vector3(p.x, p.y + alturaJugador * 1.1, p.z), vecArriba);
    raycasterMovimiento.far = 8;
    return raycasterMovimiento.intersectObjects(mallasSuelo, false).length > 0;
}

function direccionMasLibre(p) {
    let mejor = { dx: 0, dz: -1, libre: 0 };
    for (let i = 0; i < 8; i++) {
        const angulo = (i * Math.PI) / 4;
        const dx = Math.sin(angulo);
        const dz = -Math.cos(angulo);
        raycasterMovimiento.set(
            new THREE.Vector3(p.x, p.y + alturaJugador * 0.6, p.z),
            new THREE.Vector3(dx, 0, dz)
        );
        raycasterMovimiento.far = 12;
        const impacto = raycasterMovimiento.intersectObjects(mallasParedes, false)[0];
        const libre = impacto ? impacto.distance : 12;
        if (libre > mejor.libre) mejor = { dx, dz, libre };
    }
    return mejor;
}

// `lado` (opcional): 'derecha' | 'izquierda'. Desde la puerta mirando
// hacia el interior, la derecha es +X. Si no se indica, se usa el centro.
function mejorPuntoEnNivel(y, lado) {
    const enNivel = puntosCaminables.filter((p) => Math.abs(p.y - y) < 0.35);
    if (enNivel.length === 0) return null;

    const cx = enNivel.reduce((a, p) => a + p.x, 0) / enNivel.length;
    const cz = enNivel.reduce((a, p) => a + p.z, 0) / enNivel.length;

    if (lado === 'derecha' || lado === 'izquierda') {
        const xs = enNivel.map((p) => p.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const xObjetivo = lado === 'derecha'
            ? minX + (maxX - minX) * 0.8
            : minX + (maxX - minX) * 0.2;
        enNivel.sort((a, b) =>
            ((a.x - xObjetivo) ** 2 + (a.z - cz) ** 2) - ((b.x - xObjetivo) ** 2 + (b.z - cz) ** 2));
    } else {
        enNivel.sort((a, b) =>
            ((a.x - cx) ** 2 + (a.z - cz) ** 2) - ((b.x - cx) ** 2 + (b.z - cz) ** 2));
    }

    let respaldo = null;
    for (const p of enNivel.slice(0, 80)) {
        if (!tieneTecho(p)) continue;                 // descarta patios / exteriores
        const dir = direccionMasLibre(p);
        if (!respaldo) respaldo = { p, dir, techo: true };
        if (dir.libre >= 2.5) return { p, dir, techo: true };
    }
    if (respaldo) return respaldo;
    return { p: enNivel[0], dir: direccionMasLibre(enNivel[0]), techo: false };
}

function detectarNiveles() {
    const bin = 0.25;
    const conteo = new Map();
    puntosCaminables.forEach((p) => {
        const k = Math.round(p.y / bin);
        conteo.set(k, (conteo.get(k) || 0) + 1);
    });
    if (conteo.size === 0) { nivelesPiso = []; return; }

    // Solo cuentan los niveles con MUCHA superficie (pisos); los peldaños
    // de una escalera tienen poca cada uno y se descartan.
    const maxN = Math.max(...conteo.values());
    const umbral = Math.max(6, maxN * 0.10);
    const claves = [...conteo.keys()].filter((k) => conteo.get(k) >= umbral).sort((a, b) => a - b);

    let grupos = [];
    claves.forEach((k) => {
        const n = conteo.get(k);
        const g = grupos[grupos.length - 1];
        if (g && k - g.ultima <= 1) { g.n += n; g.suma += k * bin * n; g.ultima = k; }
        else grupos.push({ n, suma: k * bin * n, ultima: k });
    });
    grupos = grupos.map((g) => ({ y: g.suma / g.n, n: g.n }));

    // La planta baja es el nivel donde está la puerta principal
    let inicio = 0;
    if (puertaPrincipal) {
        let mejorD = Infinity;
        grupos.forEach((g, idx) => {
            const d = Math.abs(g.y - puertaPrincipal.caja.min.y);
            if (d < mejorD) { mejorD = d; inicio = idx; }
        });
    }

    const niveles = [];
    grupos.slice(inicio).forEach((g) => {
        const ultimo = niveles[niveles.length - 1];
        if (ultimo && g.y - ultimo.y < 2.0) {
            if (g.n > ultimo.n) { ultimo.y = g.y; ultimo.n = g.n; }
        } else niveles.push({ ...g });
    });

    nivelesPiso = niveles.map((n) => n.y);
    console.log('Pisos detectados (índice 0 = planta baja):');
    console.table(niveles.map((n, i) => ({ piso: i, y: +n.y.toFixed(2), superficie: n.n })));
}

function ubicarCasita(destino) {
    let caja = null;
    let nombre = '';
    modeloCargado.traverse((objeto) => {
        if (caja || !/casita|casa|gastro|cocina|kiosk|quiosco|restaur/i.test(objeto.name)) return;
        const b = new THREE.Box3().setFromObject(objeto);
        if (b.isEmpty()) return;
        const t = b.getSize(new THREE.Vector3());
        if (t.x > tamañoModelo.x * 0.6 || t.z > tamañoModelo.z * 0.6 || t.y > tamañoModelo.y * 0.8) return;
        caja = b;
        nombre = objeto.name;
    });

    if (caja) {
        const centro = caja.getCenter(new THREE.Vector3());
        const t = caja.getSize(new THREE.Vector3());
        const x = centro.x;
        const z = caja.max.z + Math.max(4, t.z * 0.6 + 3);
        const ySuelo = alturaSueloEn(x, caja.min.y + 2, z) ?? caja.min.y;
        const v = crearVistaFPS(x, ySuelo, z, 0, -1);
        destino.posicion = v.posicion;
        destino.objetivo = v.objetivo;
        destino.pin = { x: centro.x, y: caja.min.y + Math.min(t.y, 3), z: centro.z };
        console.log(`Gastronomía: casita detectada ("${nombre}")`, centro);
        return;
    }

    if (puertaPrincipal) {
        const x = puertaPrincipal.centro.x;
        const z = puertaPrincipal.centro.z + alturaJugador * 3;
        const ySuelo = alturaSueloEn(x, puertaPrincipal.caja.min.y + 1.2, z) ?? puertaPrincipal.caja.min.y;
        const v = crearVistaFPS(x, ySuelo, z, 0, -1);
        destino.posicion = v.posicion;
        destino.objetivo = v.objetivo;
        destino.pin = { x, y: ySuelo + alturaJugador, z: puertaPrincipal.centro.z + alturaJugador };
        console.warn('Gastronomía: no hallé la casita por nombre. Uso la zona frente a la puerta. '
            + 'Camina hasta la casita, pulsa P y pega el resultado en destinos.gastronomia.manual');
    }
}

function colocarDestinosEnPisos() {
    Object.entries(CONFIG_CAMARA.destinos).forEach(([clave, destino]) => {
        if (destino.manual) { aplicarManual(destino); return; }
        if (destino.tipo === 'casita') { ubicarCasita(destino); return; }

        const y = nivelesPiso[destino.piso];
        if (y === undefined) {
            console.warn(`"${clave}": no se detectó el piso ${destino.piso}; queda la posición provisional.`);
            return;
        }
        const sel = mejorPuntoEnNivel(y, destino.lado);
        if (!sel) return;

        const direccion = girarDireccion(sel.dir.dx, sel.dir.dz, destino.giro);
        const v = crearVistaFPS(sel.p.x, sel.p.y, sel.p.z, direccion.dx, direccion.dz);
        destino.posicion = v.posicion;
        destino.objetivo = v.objetivo;
        destino.pin = { x: sel.p.x, y: sel.p.y + alturaJugador * 0.9, z: sel.p.z };
        console.log(`"${clave}" -> piso ${destino.piso}`, destino.posicion,
            sel.techo ? '(interior verificado)' : '(⚠ sin techo detectado: revisa)');
    });
}

function analizarEdificio() {
    if (Array.isArray(CONFIG_CAMARA.alturasPisoManual)) {
        const base = cajaModelo.min.y;
        nivelesPiso = CONFIG_CAMARA.alturasPisoManual.slice();
        // si los números parecen relativos a la base, también se aceptan
        if (nivelesPiso.every((n) => n < tamañoModelo.y)) nivelesPiso = nivelesPiso.map((n) => base + n);
        colocarDestinosEnPisos();
        return;
    }

    const paso = Math.max(tamañoModelo.x, tamañoModelo.z) / 45;
    const celdas = [];
    for (let x = cajaModelo.min.x + paso / 2; x < cajaModelo.max.x; x += paso) {
        for (let z = cajaModelo.min.z + paso / 2; z < cajaModelo.max.z; z += paso) celdas.push([x, z]);
    }

    const rayo = new THREE.Raycaster();
    rayo.far = tamañoModelo.y + 4;
    const origenY = cajaModelo.max.y + 2;
    puntosCaminables = [];
    let i = 0;

    // En lotes pequeños para no congelar la página
    const procesarLote = () => {
        const fin = Math.min(i + 25, celdas.length);
        for (; i < fin; i++) {
            const [x, z] = celdas[i];
            rayo.set(new THREE.Vector3(x, origenY, z), vecAbajo);
            for (const impacto of rayo.intersectObjects(mallasSuelo, false)) {
                if (!impacto.face) continue;
                const normal = impacto.face.normal.clone().transformDirection(impacto.object.matrixWorld);
                if (normal.y > 0.7) puntosCaminables.push({ x, y: impacto.point.y, z });
            }
        }
        if (i < celdas.length) {
            requestAnimationFrame(procesarLote);
        } else {
            detectarNiveles();
            colocarDestinosEnPisos();
            mostrarAviso(`Mapa de pisos listo: ${nivelesPiso.length} niveles detectados`);
        }
    };
    requestAnimationFrame(procesarLote);
}

function mostrarAviso(texto, ms = 4000) {
    let el = document.getElementById('aviso');
    if (!el) {
        el = document.createElement('div');
        el.id = 'aviso';
        document.body.appendChild(el);
    }
    el.textContent = texto;
    el.classList.add('visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), ms);
}

// ============================================================
// 8. PERSONAJE FBX ANIMADO (solo fuera del modo exploración)
// ============================================================

let mezcladorPersonaje = null;
let accionCaminar = null;
let personajeCargado = null;

if (!modoExploracion) {
    const cargadorFBX = new FBXLoader();

    cargadorFBX.load(
        './modelos/camninando.fbx',
        (personaje) => {
            personajeCargado = personaje;
            mezcladorPersonaje = new THREE.AnimationMixer(personaje);

            if (personaje.animations.length > 0) {
                accionCaminar = mezcladorPersonaje.clipAction(personaje.animations[0]);
                accionCaminar.loop = THREE.LoopOnce;
                accionCaminar.clampWhenFinished = true;
            }

            personaje.traverse((objeto) => {
                if (objeto.isMesh) {
                    objeto.castShadow = true;
                    objeto.receiveShadow = true;
                }
            });

            const cajaPersonaje = new THREE.Box3().setFromObject(personaje);
            const tamañoPersonaje = cajaPersonaje.getSize(new THREE.Vector3());
            const escala = 6 / tamañoPersonaje.y;
            personaje.scale.setScalar(escala);
            personaje.position.set(25, nivelBaseModelo + 2, 34);
            personaje.rotation.y = Math.PI;

            escena.add(personaje);
        },
        undefined,
        (error) => console.error('No se pudo cargar el personaje FBX:', error)
    );
}

// ============================================================
// 9. NAVEGACIÓN ENTRE CARRERAS — VUELO DE CÁMARA CON GSAP
// ============================================================

let animacionCamaraActiva = null; // referencia al tween activo de GSAP

function volarCamaraA(destino) {

    if (!destino || !destino.posicion || !destino.objetivo) {
        console.warn('El modelo todavía no terminó de cargar: espera un momento antes de navegar.');
        return;
    }

    if (typeof gsap === 'undefined') {
        console.warn('GSAP no está cargado: no se puede animar la cámara.');
        camara.position.set(destino.posicion.x, destino.posicion.y, destino.posicion.z);
        controles.target.set(destino.objetivo.x, destino.objetivo.y, destino.objetivo.z);
        controles.update();
        return;
    }

    // Si ya hay un vuelo en curso, lo cancelamos limpiamente
    if (animacionCamaraActiva) {
        animacionCamaraActiva.kill();
        animacionCamaraActiva = null;
    }

    const duracion = destino.duracion ?? CONFIG_CAMARA.duracionDefecto;
    const easing = destino.easing ?? CONFIG_CAMARA.easingDefecto;

    // Timeline única para animar posición + objetivo en paralelo
    const linea = gsap.timeline({

        onStart: () => {
            controles.enabled = false;
        },

        onUpdate: () => {
            controles.update();
        },

        onComplete: () => {
            controles.enabled = true;
            animacionCamaraActiva = null;
        }
    });

    linea.to(camara.position, {
        x: destino.posicion.x,
        y: destino.posicion.y,
        z: destino.posicion.z,
        duration: duracion,
        ease: easing
    }, 0);

    linea.to(controles.target, {
        x: destino.objetivo.x,
        y: destino.objetivo.y,
        z: destino.objetivo.z,
        duration: duracion,
        ease: easing
    }, 0);

    animacionCamaraActiva = linea;
}

// ============================================================
// MOSTRAR INFORMACIÓN DE LA CARRERA
// ============================================================

// Título grande en el centro de la pantalla (desaparece al moverse)
function mostrarTituloCentral(info) {
    const el = document.getElementById('tituloCarrera');
    if (!el) return;
    el.querySelector('.titulo-area').textContent = info.area;
    el.querySelector('.titulo-nombre').textContent = info.titulo;
    el.classList.remove('visible');
    void el.offsetWidth;            // reinicia la animación
    el.classList.add('visible');
}

function mostrarInformacionCarrera(carrera) {
    const info = INFORMACION_CARRERAS[carrera];
    const panel = document.getElementById('infoCarrera');
    if (!info || !panel) return;

    document.getElementById('infoCarreraArea').textContent = info.area;
    document.getElementById('infoCarreraTitulo').textContent = info.titulo;
    document.getElementById('infoCarreraResumen').textContent = info.resumen;
    document.getElementById('infoCarreraDetalle').textContent = info.detalle;

    const imagen = document.getElementById('infoCarreraImagen');
    imagen.style.display = '';
    imagen.onerror = () => { imagen.style.display = 'none'; };
    imagen.src = info.imagen;
    imagen.alt = `Imagen de ${info.titulo}`;

    mostrarTituloCentral(info);

    panel.hidden = false;
    document.body.classList.add('mostrando-info');

    document.querySelectorAll('#menuCarreras [data-carrera]').forEach((b) => {
        b.classList.toggle('activo', b.dataset.carrera === carrera);
    });
}

function ocultarInformacionCarrera() {

    const panel = document.getElementById('infoCarrera');

    if (!panel) return;

    panel.hidden = true;
    document.body.classList.remove('mostrando-info');
    document.getElementById('tituloCarrera')?.classList.remove('visible');
    document.querySelectorAll('#menuCarreras [data-carrera]').forEach((b) => b.classList.remove('activo'));

}

function irACarrera(carrera) {

    const destino = CONFIG_CAMARA.destinos[carrera];

    if (!destino) {
        console.warn('No existe configuración de cámara para la carrera:', carrera);
        return;
    }

    console.log(`Volando hacia: ${destino.nombre} (piso ${destino.piso})`);

    // Primero mostramos la información
    mostrarInformacionCarrera(carrera);

    // Después hacemos el vuelo de cámara
    volarCamaraA(destino);

}

function volverAlCampus() {
    console.log('Regresando a la vista general del campus.');
    volarCamaraA(CONFIG_CAMARA.vistaCampus);
}

// Se exponen por si se necesitan invocar desde otro script/HTML
window.irACarrera = irACarrera;
window.volverAlCampus = volverAlCampus;

// ============================================================
// 10. BOTONES DEL MENÚ DE CARRERAS
// ============================================================

document.querySelectorAll('#menuCarreras [data-carrera]').forEach((boton) => {
    boton.addEventListener('click', () => irACarrera(boton.dataset.carrera));
});

document.getElementById('volverCampus')?.addEventListener('click', volverAlCampus);

function irAEntrada() {
    ocultarInformacionCarrera();
    volarCamaraA(CONFIG_CAMARA.vistaEntrada);
}
window.irAEntrada = irAEntrada;

document.getElementById('irEntrada')?.addEventListener('click', irAEntrada);
document.getElementById('cerrarInfoCarrera')?.addEventListener('click', ocultarInformacionCarrera);

document.querySelectorAll('button[data-luz]').forEach((boton) => {
    boton.addEventListener('click', () => aplicarIluminacion(boton.dataset.luz));
});

// Atajos: 1 = día · 2 = tarde · 3 = noche · Esc = cerrar panel
window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const atajos = { Digit1: 'dia', Digit2: 'tarde', Digit3: 'noche' };
    if (atajos[e.code] && document.querySelector('button[data-luz]')) aplicarIluminacion(atajos[e.code]);
    if (e.code === 'Escape') ocultarInformacionCarrera();

    // P = copiar la posición actual (para fijar a mano una carrera o la entrada)
    if (e.code === 'KeyP' && modoExploracion && !e.repeat) {
        const f = (n) => +n.toFixed(2);
        const c = camara.position;
        const t = controles.target;
        const texto = `manual: { posicion: { x: ${f(c.x)}, y: ${f(c.y)}, z: ${f(c.z)} }, `
            + `objetivo: { x: ${f(t.x)}, y: ${f(t.y)}, z: ${f(t.z)} } }`;
        console.log('Coordenadas actuales →', texto);
        navigator.clipboard?.writeText(texto)?.catch(() => {});
        mostrarAviso('📋 Coordenadas copiadas (también en la consola)');
    }
});

document.getElementById('botonAyuda')?.addEventListener('click', () => {
    document.getElementById('panelAyuda')?.classList.toggle('visible');
});
document.getElementById('menuToggle')?.addEventListener('click', () => {
    const menu = document.getElementById('menuCarreras');
    const boton = document.getElementById('menuToggle');
    if (!menu || !boton) return;
    const plegado = menu.classList.toggle('plegado');
    boton.setAttribute('aria-expanded', String(!plegado));
    boton.setAttribute('aria-label', plegado ? 'Mostrar menú de carreras' : 'Plegar menú de carreras');
});

// ============================================================
// 11. REDIMENSIONAMIENTO DE VENTANA
// ============================================================

window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// 12. GIRO AUTOMÁTICO DEL MODELO (solo en index.html)
// ============================================================

const velocidadGiroAutomatico = 0.035; // radianes por segundo

// ============================================================
// 13. MOVIMIENTO CON TECLADO (solo en campus.html, deshabilitado
//     durante el vuelo de cámara)
// ============================================================

const teclasPresionadas = new Set();
const velocidadMovimiento = 2;
const velocidadGiroTeclado = 1.2;
const vectorArriba = new THREE.Vector3(0, 1, 0);
const raycasterMovimiento = new THREE.Raycaster();
const alturaJugador = 1.7;
const radioJugador = 0.3;
const alturaPaso = 0.65;    // altura máxima de un escalón que se sube solo
const bajadaMaxima = 1.2;   // desnivel máximo que se baja caminando
let exigirSuelo = false;   // true = no se puede caminar donde no hay suelo (bordes, huecos)

const teclasValidas = new Set([
    'KeyW', 'KeyD', 'KeyS', 'KeyA', 'KeyZ', 'KeyX'
]);

window.addEventListener('keydown', (evento) => {

    if (animacionCamaraActiva) return;

    if (!modoExploracion) return;

    if (teclasValidas.has(evento.code)) {

        teclasPresionadas.add(evento.code);

        evento.preventDefault();

        // AL COMENZAR A EXPLORAR, OCULTAMOS LA INFORMACIÓN Y EL TÍTULO GRANDE
        ocultarInformacionCarrera();

    }

});

window.addEventListener('keyup', (evento) => teclasPresionadas.delete(evento.code));

document.querySelectorAll('[data-movimiento]').forEach((boton) => {
    const codigo = boton.dataset.movimiento;
    let pointerActivo = null;

    boton.addEventListener('pointerdown', (evento) => {
        if (animacionCamaraActiva || !modoExploracion || evento.button !== 0) return;
        evento.preventDefault();
        pointerActivo = evento.pointerId;
        boton.setPointerCapture(evento.pointerId);
        boton.classList.add('presionado');
        teclasPresionadas.add(codigo);
        ocultarInformacionCarrera();
    });

    const soltarMovimiento = (evento) => {
        if (pointerActivo !== evento.pointerId) return;
        pointerActivo = null;
        boton.classList.remove('presionado');
        teclasPresionadas.delete(codigo);
    };

    boton.addEventListener('pointerup', soltarMovimiento);
    boton.addEventListener('pointercancel', soltarMovimiento);
    boton.addEventListener('lostpointercapture', soltarMovimiento);
});

window.addEventListener('blur', () => teclasPresionadas.clear());

function moverConTeclado(deltaSegundos) {
    if (!modoExploracion) return;
    if (animacionCamaraActiva) return;
    if (teclasPresionadas.size === 0) return;

    let giro = 0;
    if (teclasPresionadas.has('KeyZ')) giro += 1;
    if (teclasPresionadas.has('KeyX')) giro -= 1;
    if (giro !== 0) {
        const direccionVista = controles.target.clone().sub(camara.position);
        direccionVista.applyAxisAngle(vectorArriba, giro * velocidadGiroTeclado * deltaSegundos);
        controles.target.copy(camara.position).add(direccionVista);
    }

    const frente = controles.target.clone().sub(camara.position);
    const derecha = new THREE.Vector3();
    const desplazamiento = new THREE.Vector3();

    frente.y = 0;
    if (frente.lengthSq() > 0) frente.normalize();
    derecha.crossVectors(frente, vectorArriba).normalize();

    const velocidad = velocidadMovimiento * deltaSegundos;

    if (teclasPresionadas.has('KeyW')) desplazamiento.addScaledVector(frente, velocidad);
    if (teclasPresionadas.has('KeyS')) desplazamiento.addScaledVector(frente, -velocidad);
    if (teclasPresionadas.has('KeyD')) desplazamiento.addScaledVector(derecha, velocidad);
    if (teclasPresionadas.has('KeyA')) desplazamiento.addScaledVector(derecha, -velocidad);
    if (teclasPresionadas.has('KeyQ')) desplazamiento.y += velocidad;
    if (teclasPresionadas.has('KeyE')) desplazamiento.y -= velocidad;

    if (desplazamiento.lengthSq() === 0) return;

    const movimientoHorizontal = new THREE.Vector3(desplazamiento.x, 0, desplazamiento.z);
    if (movimientoHorizontal.lengthSq() > 0) {
        moverHorizontalConColisiones(movimientoHorizontal);
    }

    if (desplazamiento.y !== 0) {
        const direccionVertical = new THREE.Vector3(0, Math.sign(desplazamiento.y), 0);
        const permitido = obtenerDistanciaLibre(
            camara.position,
            direccionVertical,
            Math.abs(desplazamiento.y),
            radioJugador
        );
        const movimientoVertical = direccionVertical.multiplyScalar(permitido);
        camara.position.add(movimientoVertical);
        controles.target.add(movimientoVertical);
    }
}

function moverHorizontalConColisiones(movimiento) {
    const distancia = movimiento.length();
    const direccion = movimiento.clone().normalize();
    const derecha = new THREE.Vector3(-direccion.z, 0, direccion.x);
    const pieActual = camara.position.y - alturaJugador;
    const origenSuelo = new THREE.Vector3(
        camara.position.x + movimiento.x,
        pieActual + alturaPaso,
        camara.position.z + movimiento.z
    );

    raycasterMovimiento.set(origenSuelo, new THREE.Vector3(0, -1, 0));
    raycasterMovimiento.far = alturaPaso + bajadaMaxima;
    const interseccionesSuelo = raycasterMovimiento.intersectObjects(mallasSuelo, false);
    const suelo = interseccionesSuelo.find((interseccion) => {
        // Solo superficies que "miran hacia arriba" (pisos, peldaños, rampas);
        // se ignoran paredes, contrahuellas y techos.
        if (interseccion.face) {
            const normal = interseccion.face.normal.clone().transformDirection(interseccion.object.matrixWorld);
            if (normal.y < 0.3) return false;
        }
        const diferenciaAltura = interseccion.point.y - pieActual;
        return diferenciaAltura <= alturaPaso && diferenciaAltura >= -bajadaMaxima;
    });

    // Borde de piso, hueco de escalera o vacío: no avanzar
    if (!suelo && exigirSuelo) return;

    const alturaDestino = suelo ? suelo.point.y + alturaJugador : camara.position.y;
    const desplazamientoVertical = alturaDestino - camara.position.y;
    const desplazamientoPermitido = obtenerDistanciaHorizontalLibre(
        camara.position,
        direccion,
        distancia,
        derecha,
        desplazamientoVertical
    );
    const movimientoPermitido = direccion.multiplyScalar(desplazamientoPermitido);
    movimientoPermitido.y = desplazamientoVertical * (desplazamientoPermitido / distancia);
    camara.position.add(movimientoPermitido);
    controles.target.add(movimientoPermitido);
}

function crearMaterialColision(material) {
    const materialColision = material.clone();
    materialColision.side = THREE.DoubleSide;
    if (
        materialColision.transparent
        || /vidrio|glass|cristal/i.test(materialColision.name)
    ) {
        materialColision.visible = false;
    }
    return materialColision;
}

function tieneAncestroConNombre(objeto, patron) {
    let actual = objeto;
    while (actual) {
        if (patron.test(actual.name)) return true;
        actual = actual.parent;
    }
    return false;
}

function obtenerDistanciaHorizontalLibre(origen, direccion, distancia, derecha, desplazamientoVertical) {
    const piesDestino = camara.position.y - alturaJugador + desplazamientoVertical;
    const desplazamientosLaterales = [-radioJugador, -radioJugador / 2, 0, radioJugador / 2, radioJugador];
    let distanciaLibre = distancia;

    const lanzar = (altura, lateral, mallas) => {
        const puntoOrigen = new THREE.Vector3(
            origen.x + derecha.x * lateral,
            piesDestino + altura,
            origen.z + derecha.z * lateral
        );
        raycasterMovimiento.set(puntoOrigen, direccion);
        raycasterMovimiento.far = distanciaLibre + radioJugador;
        const interseccion = raycasterMovimiento.intersectObjects(mallas, false)[0];
        if (interseccion) {
            distanciaLibre = Math.min(
                distanciaLibre,
                Math.max(0, interseccion.distance - radioJugador)
            );
        }
    };

    // Las paredes NO colisionan. Solo bloquean las barandas
    // (rayos densos: barrotes finos, pasamanos). Los pisos y escaleras
    // no bloquean: se caminan encima siguiendo la altura del suelo.
    if (mallasBarandas.length > 0) {
        for (const altura of [0.3, 0.55, 0.75, 0.95, 1.1, 1.3]) {
            for (const lateral of desplazamientosLaterales) lanzar(altura, lateral, mallasBarandas);
        }
    }

    return distanciaLibre;
}

function obtenerDistanciaLibre(origen, direccion, distancia, margen) {
    const puntos = [
        new THREE.Vector3(origen.x, origen.y - alturaJugador + margen, origen.z),
        origen.clone(),
        new THREE.Vector3(origen.x, origen.y + alturaJugador * 0.45, origen.z)
    ];
    let distanciaLibre = distancia;

    for (const punto of puntos) {
        raycasterMovimiento.set(punto, direccion);
        raycasterMovimiento.far = distanciaLibre + margen;
        const interseccion = raycasterMovimiento.intersectObjects(mallasColision, false)[0];
        if (interseccion) {
            distanciaLibre = Math.min(
                distanciaLibre,
                Math.max(0, interseccion.distance - margen)
            );
        }
    }

    return distanciaLibre;
}

// ============================================================
// 13.5 PINES INTERACTIVOS SOBRE EL EDIFICIO (solo campus.html)
// ============================================================

const hotspots = [];
const vectorProyeccion = new THREE.Vector3();

function crearHotspots() {
    const capa = document.getElementById('hotspots');
    if (!modoExploracion || !capa) return;

    Object.entries(CONFIG_CAMARA.destinos).forEach(([clave, destino], indice) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'hotspot';
        boton.setAttribute('aria-label', `Ir a ${destino.nombre}`);
        boton.innerHTML = `<span class="hotspot-pin">${indice + 1}</span><span class="hotspot-label">${destino.nombre}</span>`;
        boton.addEventListener('click', () => irACarrera(clave));
        capa.appendChild(boton);
        hotspots.push({ clave, destino, boton });
    });
}

function actualizarHotspots() {
    if (hotspots.length === 0) return;
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    const cerca = Math.max(tamañoModelo.x, tamañoModelo.y, tamañoModelo.z) * 0.12;

    hotspots.forEach(({ destino, boton }) => {
        const ancla = destino.pin ?? destino.objetivo;
        vectorProyeccion.set(ancla.x, ancla.y, ancla.z);
        const distancia = camara.position.distanceTo(vectorProyeccion);
        vectorProyeccion.project(camara);

        const visible = !animacionCamaraActiva
            && vectorProyeccion.z < 1
            && Math.abs(vectorProyeccion.x) < 1.05
            && Math.abs(vectorProyeccion.y) < 1.05
            && distancia > cerca;

        boton.style.display = visible ? '' : 'none';
        if (!visible) return;

        const x = (vectorProyeccion.x * 0.5 + 0.5) * ancho;
        const y = (-vectorProyeccion.y * 0.5 + 0.5) * alto;
        boton.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
}

// ============================================================
// 14. BUCLE DE ANIMACIÓN
// ============================================================

const reloj = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);

    const deltaSegundos = reloj.getDelta();

    if (mezcladorPersonaje) mezcladorPersonaje.update(deltaSegundos);

    // --- giro automático del modelo (solo index.html) ---
    if (pivoteGiroModelo && !modoExploracion && !animacionCamaraActiva) {
        pivoteGiroModelo.rotation.y += velocidadGiroAutomatico * deltaSegundos;
    }

    moverConTeclado(deltaSegundos);

    controles.update();
    actualizarHotspots();

    renderizador.render(escena, camara);
}

animar();
        