
export const CONFIG_INICIAL = {
  activo: false,
  hora: '12:00',
  ultimoDia: '',
}

export function puedeNotificar() {
  return (
    typeof Notification !== 'undefined' &&
    window.isSecureContext
  )
}

export async function pedirPermiso() {
  if (!puedeNotificar()) return false

  if (Notification.permission === 'granted')
    return true

  if (Notification.permission === 'denied')
    return false

  return (
    await Notification.requestPermission()
  ) === 'granted'
}

export function comprobarRecordatorio(config, avisar) {
  if (!config?.activo) return false

  if (!/^\d\d:\d\d$/.test(config.hora))
    return false

  const ahora = new Date()

  const dia = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    String(ahora.getDate()).padStart(2, '0'),
  ].join('-')

  const hora = [
    String(ahora.getHours()).padStart(2, '0'),
    String(ahora.getMinutes()).padStart(2, '0'),
  ].join(':')

  if (
    hora !== config.hora ||
    config.ultimoDia === dia
  ) {
    return false
  }

  avisar('Es hora de planificar tu comida en PlatoMatch')

  return dia
}
