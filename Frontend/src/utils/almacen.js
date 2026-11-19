// Persistencia local para el prototipo. No se sincroniza entre dispositivos.
export function claveUsuario(usuario, modulo) {
  const identidad = usuario?.email?.trim().toLocaleLowerCase('es-PE') || (usuario?.invitado ? 'invitado' : null)
  return identidad ? `platomatch.${modulo}.${encodeURIComponent(identidad)}` : null
}

export function leerUsuario(usuario, modulo, predeterminado) {
  const clave = claveUsuario(usuario, modulo)
  if (!clave) return predeterminado
  try {
    const dato = JSON.parse(window.localStorage.getItem(clave) || 'null')
    return dato ?? predeterminado
  } catch {
    return predeterminado
  }
}

export function guardarUsuario(usuario, modulo, valor) {
  const clave = claveUsuario(usuario, modulo)
  if (clave) window.localStorage.setItem(clave, JSON.stringify(valor))
}

export function moverDatosUsuario(anterior, nuevo) {
  const modulos = ['guardados', 'calificaciones-mercados', 'lista-compras', 'historial-ahorro', 'recordatorios', 'presupuesto-base']
  for (const modulo of modulos) {
    const a = claveUsuario(anterior, modulo)
    const b = claveUsuario(nuevo, modulo)
    if (!a || !b || a === b) continue
    const valor = window.localStorage.getItem(a)
    if (valor !== null && window.localStorage.getItem(b) === null) {
      window.localStorage.setItem(b, valor)
    }
    window.localStorage.removeItem(a)
  }
}
