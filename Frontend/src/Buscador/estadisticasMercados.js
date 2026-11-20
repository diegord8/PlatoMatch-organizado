import { MERCADOS } from '../Perfil/precios.js'

const PREFIJO = 'platomatch.calificaciones-mercados.'

export function calcularEstadisticasMercados(
  almacen,
  usuario,
  calificacionesActuales = {},
) {
  const resultados = Object.fromEntries(
    MERCADOS.map(mercado => [
      mercado,
      { total: 0, cantidad: 0 },
    ]),
  )

  const emailActual = usuario?.email?.trim().toLowerCase()
  const claveActual = emailActual
    ? `${PREFIJO}${encodeURIComponent(emailActual)}`
    : null

  function leerCalificaciones(clave) {
    const contenido = almacen.getItem(clave)
    if (contenido === null) return null

    let calificaciones
    try {
      calificaciones = JSON.parse(contenido)
    } catch {
      throw new Error('Las calificaciones de mercados guardadas tienen un formato inválido.')
    }

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

  function agregar(calificaciones) {
    MERCADOS.forEach(mercado => {
      const valor = calificaciones[mercado]

      if (valor !== undefined) {
        resultados[mercado].total += valor
        resultados[mercado].cantidad += 1
      }
    })
  }

  for (let i = 0; i < almacen.length; i++) {
    const clave = almacen.key(i)

    if (!clave?.startsWith(PREFIJO)) continue
    if (clave === claveActual) continue

    const calificaciones = leerCalificaciones(clave)
    if (calificaciones) agregar(calificaciones)
  }

  if (claveActual) {
    agregar(calificacionesActuales)
  }

  return Object.fromEntries(
    MERCADOS.map(mercado => {
      const { total, cantidad } = resultados[mercado]

      return [
        mercado,
        {
          cantidad,
          promedio: cantidad > 0 ? total / cantidad : null
        }
      ]
    })
  )
}