import { esCuentaDemo } from '../services/demo.js'

const CLAVE_CUENTAS = 'platomatch.cuentas'
const CLAVE_SESION = 'platomatch.sesion'
const ITERACIONES = 310000

export function cargarSesion() {
  const contenido = window.localStorage.getItem(CLAVE_SESION)
  if (!contenido) return { usuario: null, perfilSalud: { alergias: [], condiciones: [] } }

  const sesion = JSON.parse(contenido)
  if (
    !sesion.usuario ||
    typeof sesion.usuario.nombre !== 'string' ||
    !sesion.perfilSalud ||
    !Array.isArray(sesion.perfilSalud.alergias) ||
    !Array.isArray(sesion.perfilSalud.condiciones)
  ) {
    throw new Error('La sesión guardada no tiene un formato válido. Elimina los datos de sesión e inicia sesión nuevamente.')
  }

  return sesion
}

export function guardarSesion(usuario, perfilSalud) {
  window.localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario, perfilSalud }))
}

export function eliminarSesion() {
  window.localStorage.removeItem(CLAVE_SESION)
}

function normalizarCorreo(correo) {
  return correo.trim().toLocaleLowerCase('es-PE')
}

function leerCuentas() {
  const contenido = window.localStorage.getItem(CLAVE_CUENTAS)
  if (!contenido) return []

  const cuentas = JSON.parse(contenido)
  if (!Array.isArray(cuentas)) {
    throw new Error('No se pudieron leer las cuentas guardadas en este navegador.')
  }
  return cuentas
}

function obtenerCrypto() {
  if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
    throw new Error('El navegador no ofrece almacenamiento seguro. Abre la aplicación en localhost o mediante HTTPS.')
  }
  return window.crypto
}

function bytesAHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexABytes(hex) {
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

async function derivarHash(contrasena, sal) {
  const crypto = obtenerCrypto()
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACIONES },
    material,
    256,
  )
  return new Uint8Array(hash)
}

function compararHashes(hashIngresado, hashGuardado) {
  if (hashIngresado.length !== hashGuardado.length) return false

  let diferencia = 0
  for (let indice = 0; indice < hashIngresado.length; indice += 1) {
    diferencia |= hashIngresado[indice] ^ hashGuardado[indice]
  }
  return diferencia === 0
}

export async function registrarCuenta({ nombre, email, password, perfilSalud }) {
  const cuentas = leerCuentas()
  const correoNormalizado = normalizarCorreo(email)

  if (cuentas.some((cuenta) => cuenta.email === correoNormalizado)) {
    throw new Error('Ya existe una cuenta con ese correo. Inicia sesión o utiliza otro correo.')
  }

  const crypto = obtenerCrypto()
  const sal = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivarHash(password, sal)
  const cuenta = {
    nombre,
    email: correoNormalizado,
    sal: bytesAHex(sal),
    hash: bytesAHex(hash),
    rol: 'usuario',
    perfilSalud,
  }

  window.localStorage.setItem(CLAVE_CUENTAS, JSON.stringify([...cuentas, cuenta]))
  return { nombre: cuenta.nombre, email: cuenta.email, rol: cuenta.rol ?? 'usuario', perfilSalud: cuenta.perfilSalud }
}

export async function autenticarCuenta(email, password) {
  const correoNormalizado = normalizarCorreo(email)
  const cuenta = leerCuentas().find((item) => item.email === correoNormalizado)
  if (!cuenta) return null

  const hashIngresado = await derivarHash(password, hexABytes(cuenta.sal))
  const hashGuardado = hexABytes(cuenta.hash)
  if (!compararHashes(hashIngresado, hashGuardado)) return null

  return { nombre: cuenta.nombre, email: cuenta.email, rol: cuenta.rol ?? 'usuario', perfilSalud: cuenta.perfilSalud }
}

export async function actualizarCuenta({
  emailActual,
  nombre,
  email,
  contrasenaActual,
  contrasenaNueva,
}) {
  const cuentas = leerCuentas()
  const correoActualNormalizado = normalizarCorreo(emailActual)
  const indiceCuenta = cuentas.findIndex((cuenta) => cuenta.email === correoActualNormalizado)
  if (indiceCuenta === -1) {
    throw new Error('No se encontró la cuenta para actualizar. Cierra sesión e inicia nuevamente.')
  }

  const cuenta = cuentas[indiceCuenta]
  const correoNuevoNormalizado = email === undefined ? cuenta.email : normalizarCorreo(email)
  const nombreNuevo = nombre === undefined ? cuenta.nombre : nombre.trim()
  const cambiaContrasena = Boolean(contrasenaNueva)

  if (!nombreNuevo) {
    throw new Error('El nombre no puede quedar vacío.')
  }
  if (!/^\S+@\S+\.\S+$/.test(correoNuevoNormalizado)) {
    throw new Error('Ingresa un correo electrónico válido.')
  }
  if (
    cuentas.some(
      (otraCuenta, indice) =>
        indice !== indiceCuenta && otraCuenta.email === correoNuevoNormalizado,
    )
  ) {
    throw new Error('Ya existe una cuenta con ese correo. Utiliza otro correo.')
  }

  if (cambiaContrasena) {
    if (!contrasenaActual) {
      throw new Error('Ingresa tu contraseña actual para cambiarla.')
    }
    const hashActual = await derivarHash(contrasenaActual, hexABytes(cuenta.sal))
    if (!compararHashes(hashActual, hexABytes(cuenta.hash))) {
      throw new Error('La contraseña actual es incorrecta.')
    }
    if (
      contrasenaNueva.length < 8 ||
      !/[A-Za-z]/.test(contrasenaNueva) ||
      !/\d/.test(contrasenaNueva)
    ) {
      throw new Error('La contraseña nueva debe tener al menos 8 caracteres e incluir una letra y un número.')
    }
  }

  const cuentaActualizada = {
    ...cuenta,
    nombre: nombreNuevo,
    email: correoNuevoNormalizado,
  }
  if (cambiaContrasena) {
    const crypto = obtenerCrypto()
    const sal = crypto.getRandomValues(new Uint8Array(16))
    const hash = await derivarHash(contrasenaNueva, sal)
    cuentaActualizada.sal = bytesAHex(sal)
    cuentaActualizada.hash = bytesAHex(hash)
  }

  cuentas[indiceCuenta] = cuentaActualizada
  window.localStorage.setItem(CLAVE_CUENTAS, JSON.stringify(cuentas))
  return {
    nombre: cuentaActualizada.nombre,
    email: cuentaActualizada.email,
  }
}

// Actualiza los datos del perfil de salud para que se mantengan al cerrar sesión.
export function guardarPerfilSaludCuenta(email, perfilSalud) {
  const correo = normalizarCorreo(email)
  const cuentas = leerCuentas()
  const indice = cuentas.findIndex((cuenta) => cuenta.email === correo)
  if (indice !== -1) {
    cuentas[indice] = { ...cuentas[indice], perfilSalud }
    window.localStorage.setItem(CLAVE_CUENTAS, JSON.stringify(cuentas))
  } else if (esCuentaDemo(correo)) {
    window.localStorage.setItem('platomatch.demo.salud', JSON.stringify(perfilSalud))
  }
}

export function cargarSaludDemo() {
  try { return JSON.parse(window.localStorage.getItem('platomatch.demo.salud')) ?? { alergias: [], condiciones: [] } }
  catch { return { alergias: [], condiciones: [] } }
}

// Para el panel de administración (con backend: GET /admin/metricas).
export function contarCuentas() {
  try { return leerCuentas().length } catch { return null }
}
