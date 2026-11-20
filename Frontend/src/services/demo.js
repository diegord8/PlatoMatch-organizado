// Cuenta de demostración. Solo disponible en desarrollo, o si se define VITE_HABILITAR_DEMO=true.
// Debe quedar deshabilitada en producción (las credenciales viajan dentro del bundle).
const entorno = import.meta.env ?? {}

export const DEMO_HABILITADO = Boolean(entorno.DEV) || entorno.VITE_HABILITAR_DEMO === 'true'
export const DEMO_EMAIL = 'maria@ejemplo.com'
export const DEMO_PASSWORD = 'Platom@tch1'

export function esCuentaDemo(email = '') {
  return DEMO_HABILITADO && email.trim().toLocaleLowerCase('es-PE') === DEMO_EMAIL
}

export function esCredencialDemo(email = '', password = '') {
  return esCuentaDemo(email) && password === DEMO_PASSWORD
}
