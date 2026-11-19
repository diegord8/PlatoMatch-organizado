
import {
  comprobarRecordatorio,
  puedeNotificar,
} from './recordatorios.js'

export function iniciarRecordatorios(
  usuarioId,
  configuracion
) {
  const revisar = () => {
    const clave = `platomatch.alerta.${usuarioId}`

    const fechaYaAvisada =
      localStorage.getItem(clave) || ''

    const dia = comprobarRecordatorio(
      {
        ...configuracion,
        ultimoDia: fechaYaAvisada,
      },
      () => {
        if (
          puedeNotificar() &&
          Notification.permission === 'granted'
        ) {
          new Notification('PlatoMatch', {
            body: 'Es hora de planificar tu comida.',
          })
        }
      }
    )

    if (
      dia &&
      puedeNotificar() &&
      Notification.permission === 'granted'
    ) {
      localStorage.setItem(clave, dia)
    }
  }

  revisar()

  const intervalId = setInterval(revisar, 15000)

  return () => clearInterval(intervalId)
}
