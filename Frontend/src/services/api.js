import { API_URL } from './config.js'

// Cliente HTTP mínimo, todavía sin uso. Cuando se conecte el backend, el repositorio lo usará
// así: `const guardados = await solicitar('/me/guardados')`.
// Pendiente al conectar: guardar el token fuera de localStorage si es posible (cookie httpOnly).
export async function solicitar(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    credentials: 'include',
  })
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}))
    throw new Error(detalle.mensaje ?? `Error ${respuesta.status} al llamar ${ruta}`)
  }
  return respuesta.status === 204 ? null : respuesta.json()
}
