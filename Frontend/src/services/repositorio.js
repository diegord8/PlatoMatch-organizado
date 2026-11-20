/*
 * REPOSITORIO DE DATOS — único lugar de la app que toca el almacenamiento.
 *
 * Hoy persiste en localStorage (modo "local"). Cuando exista backend, solo hay que
 * reemplazar el cuerpo de estas funciones por llamadas a `api.js` (ver docs/MODELO_DATOS.md
 * para endpoints y tablas). Las pantallas no deberían volver a usar localStorage directamente.
 * Nota: al pasar a API estas funciones serán asíncronas (async/await + estados de carga).
 */
import { PLATOS } from '../data/platos.js'
import { MERCADOS } from '../Perfil/precios.js'
import { CONFIG_INICIAL } from '../Recordatorios/recordatorios.js'
import { leerUsuario, guardarUsuario, moverDatosUsuario } from '../utils/almacen.js'

export { leerUsuario, guardarUsuario }

const CLAVE_UBICACION = 'platomatch.ubicacion'
const CLAVE_PRECIOS = 'platomatch.precios'
const CLAVE_OPINIONES = 'platomatch.opiniones'
const PREFIJO_GUARDADOS = 'platomatch.guardados.'
export const PREFIJO_CALIFICACIONES_MERCADOS = 'platomatch.calificaciones-mercados.'
const TABS_VALIDOS = ['inicio', 'buscar', 'guardados', 'perfil']
const PANTALLAS_VALIDAS = ['home', 'detalle', 'opinion', 'admin', 'registro-precios', 'compras', 'ahorro', 'recordatorios']

export function claveGuardados(usuario) {
  if (typeof usuario?.email !== 'string' || !usuario.email.trim()) return null
  const email = usuario.email.trim().toLocaleLowerCase('es-PE')
  return `${PREFIJO_GUARDADOS}${encodeURIComponent(email)}`
}

export function cargarGuardados(usuario) {
  const clave = claveGuardados(usuario)
  if (!clave) return []

  const contenido = window.localStorage.getItem(clave)
  if (!contenido) return []

  const guardados = JSON.parse(contenido)
  if (
    !Array.isArray(guardados) ||
    guardados.some((id) => !Number.isInteger(id) || !PLATOS.some((plato) => plato.id === id))
  ) {
    throw new Error('Los platos guardados tienen un formato inválido. Elimina los favoritos guardados e intenta nuevamente.')
  }
  return [...new Set(guardados)]
}

export function cargarPreciosRegistrados() {
  const contenido = window.localStorage.getItem(CLAVE_PRECIOS)
  if (!contenido) return []

  const precios = JSON.parse(contenido)
  if (
    !Array.isArray(precios) ||
    precios.some((entrada) =>
      !entrada ||
      typeof entrada.producto !== 'string' ||
      typeof entrada.mercado !== 'string' ||
      !Number.isFinite(Number(entrada.precio)) ||
      (entrada.cantidadPrecio !== undefined &&
        (!Number.isFinite(Number(entrada.cantidadPrecio)) || Number(entrada.cantidadPrecio) <= 0)) ||
      (entrada.unidadPrecio !== undefined &&
        !['kg', 'g', 'l', 'ml', 'taza', 'unidad', 'diente'].includes(entrada.unidadPrecio)) ||
      typeof entrada.fecha !== 'string'
    )
  ) {
    throw new Error('Los precios guardados tienen un formato inválido. Revisa los datos locales de precios.')
  }
  return precios
}

export function cargarOpiniones() {
  const contenido = window.localStorage.getItem(CLAVE_OPINIONES)
  if (!contenido) return []

  const opiniones = JSON.parse(contenido)
  if (
    !Array.isArray(opiniones) ||
    opiniones.some((opinion) =>
      !opinion ||
      typeof opinion.id !== 'string' ||
      !Number.isInteger(opinion.platoId) ||
      !PLATOS.some((plato) => plato.id === opinion.platoId) ||
      typeof opinion.platoNombre !== 'string' ||
      !Number.isInteger(opinion.calificacion) ||
      opinion.calificacion < 1 ||
      opinion.calificacion > 5 ||
      !Array.isArray(opinion.destacados) ||
      typeof opinion.comentario !== 'string' ||
      typeof opinion.fecha !== 'string'
    )
  ) {
    throw new Error('Las opiniones guardadas tienen un formato inválido. Revisa los datos locales de opiniones.')
  }
  return opiniones
}

export function claveCalificacionesMercados(usuario) {
  if (typeof usuario?.email !== 'string' || !usuario.email.trim()) return null
  return `${PREFIJO_CALIFICACIONES_MERCADOS}${encodeURIComponent(
    usuario.email.trim().toLocaleLowerCase('es-PE'),
  )}`
}

export function cargarCalificacionesMercados(usuario) {
  const clave = claveCalificacionesMercados(usuario)
  if (!clave) return {}

  const contenido = window.localStorage.getItem(clave)
  if (!contenido) return {}

  const calificaciones = JSON.parse(contenido)
  if (
    !calificaciones ||
    typeof calificaciones !== 'object' ||
    Array.isArray(calificaciones) ||
    Object.entries(calificaciones).some(
      ([mercado, valor]) =>
        !MERCADOS.includes(mercado) ||
        !Number.isInteger(valor) ||
        valor < 1 ||
        valor > 5,
    )
  ) {
    throw new Error('Las calificaciones de mercados guardadas tienen un formato inválido.')
  }
  return calificaciones
}

export function cargarUbicacion() {
  const contenido = window.localStorage.getItem(CLAVE_UBICACION)
  if (!contenido) {
    return {
      pantalla: 'home',
      tab: 'inicio',
      platoId: null,
      personasPlato: 1,
      busqueda: { presupuesto: '', ingredientes: '', personas: 1 },
      indice: 0,
    }
  }

  const ubicacion = JSON.parse(contenido)
  if (
    !PANTALLAS_VALIDAS.includes(ubicacion.pantalla) ||
    !TABS_VALIDOS.includes(ubicacion.tab) ||
    !ubicacion.busqueda ||
    typeof ubicacion.busqueda.presupuesto !== 'string' ||
    typeof ubicacion.busqueda.ingredientes !== 'string' ||
    !Number.isInteger(ubicacion.busqueda.personas) ||
    ubicacion.busqueda.personas < 1
  ) {
    throw new Error('La ubicación guardada no es válida. Elimina los datos de navegación e intenta nuevamente.')
  }

  return {
    pantalla: ubicacion.pantalla,
    tab: ubicacion.tab,
    platoId: ubicacion.platoId ?? null,
    personasPlato: Number.isInteger(ubicacion.personasPlato) && ubicacion.personasPlato > 0
      ? ubicacion.personasPlato
      : 1,
    busqueda: ubicacion.busqueda,
    indice: Number.isInteger(ubicacion.indice) && ubicacion.indice >= 0 ? ubicacion.indice : 0,
  }
}

export const UBICACION_INICIAL = {
  pantalla: 'home',
  tab: 'inicio',
  platoId: null,
  personasPlato: 1,
  busqueda: { presupuesto: '', ingredientes: '', personas: 1 },
  indice: 0,
}

export function guardarUbicacion(ubicacion) {
  window.localStorage.setItem(CLAVE_UBICACION, JSON.stringify(ubicacion))
}

export function guardarGuardados(usuario, ids) {
  const clave = claveGuardados(usuario)
  if (clave) window.localStorage.setItem(clave, JSON.stringify(ids))
}

export function guardarPreciosRegistrados(precios) {
  window.localStorage.setItem(CLAVE_PRECIOS, JSON.stringify(precios))
}

export function guardarOpiniones(opiniones) {
  window.localStorage.setItem(CLAVE_OPINIONES, JSON.stringify(opiniones))
}

export function guardarCalificacionesMercados(usuario, calificaciones) {
  const clave = claveCalificacionesMercados(usuario)
  if (clave) window.localStorage.setItem(clave, JSON.stringify(calificaciones))
}

// Almacén de solo lectura para calcular promedios de mercados entre cuentas (HU-11).
// Con backend, el promedio lo devolverá el servidor y esto desaparece.
export const almacenCalificaciones = () => window.localStorage

// Avisa cuando otra pestaña cambia calificaciones. Con backend: polling o websockets.
export function suscribirCalificaciones(usuario, alCambiar) {
  const manejar = (event) => {
    if (event.key !== null && !event.key.startsWith(PREFIJO_CALIFICACIONES_MERCADOS)) return
    const propia = claveCalificacionesMercados(usuario)
    alCambiar({ propias: Boolean(propia && (event.key === propia || event.key === null)) })
  }
  window.addEventListener('storage', manejar)
  return () => window.removeEventListener('storage', manejar)
}

// Datos que acompañan al usuario cuando cambia su correo (clave de almacenamiento).
export function migrarDatosUsuario(anterior, nuevo) {
  moverDatosUsuario(anterior, nuevo)
  for (const clave of [claveGuardados, claveCalificacionesMercados]) {
    const a = clave(anterior)
    const b = clave(nuevo)
    if (!a || !b || a === b || window.localStorage.getItem(b) !== null) continue
    const valor = window.localStorage.getItem(a)
    if (valor !== null) window.localStorage.setItem(b, valor)
  }
}

// Carga en bloque los datos por cuenta (equivale a GET /me/datos).
export function cargarDatosPorUsuario(usuario) {
  return {
    listaCompras: leerUsuario(usuario, 'lista-compras', null),
    historialAhorro: leerUsuario(usuario, 'historial-ahorro', []),
    recordatorios: leerUsuario(usuario, 'recordatorios', CONFIG_INICIAL),
    presupuestoBase: leerUsuario(usuario, 'presupuesto-base', ''),
  }
}
