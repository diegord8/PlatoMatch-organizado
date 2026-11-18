import { MERCADOS } from '../Perfil/precios.js'
import { calcularCostoReceta } from '../Buscador/costoReceta.js'

// Compara solo los ingredientes que la persona indicó que necesita comprar.
// No indica ahorro real: utiliza precios referenciales, sin recibos.
export function compararAhorro(plato, personas, precios, lista = null) {
  const necesarios = lista?.ingredientes.filter(i => !i.enCasa).map(i => i.nombre) ??
    plato.ingredientes.map(i => i.nombre)
  if (necesarios.length === 0) return null
  const completos = MERCADOS.map((mercado) => {
    const { ingredientes } = calcularCostoReceta(plato, mercado, precios, personas)
    const aComprar = ingredientes.filter(i => necesarios.includes(i.nombre))
    return {
      mercado,
      completo: aComprar.length === necesarios.length && aComprar.every(i => i.estado === 'calculado'),
      costoMinimo: aComprar.reduce((s, i) => s + (i.costoMinimo || 0), 0),
      costoMaximo: aComprar.reduce((s, i) => s + (i.costoMaximo || 0), 0),
    }
  }).filter((m) => m.completo)
  if (completos.length < 2) return null
  const mejor = [...completos].sort((a, b) => a.costoMaximo - b.costoMaximo)[0]
  const referencia = Math.max(...completos.map((m) => m.costoMinimo))
  return {
    mercado: mejor.mercado,
    costoElegido: mejor.costoMaximo,
    referencia,
    ahorro: Math.max(0, referencia - mejor.costoMaximo),
    mercadosComparados: completos.length,
  }
}

export function resumenAhorro(registros = []) {
  return {
    operaciones: registros.length,
    ahorroTotal: registros.reduce((s, r) => s + Number(r.ahorro || 0), 0),
    fechaUltima: registros[0]?.fecha ?? null,
  }
}
