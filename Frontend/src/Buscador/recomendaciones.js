import { calcularCostoReceta } from './costoReceta.js'
import { evaluarPlato, normalizar } from '../salud/filtros.js'
import { analizarOpiniones } from '../Feedback/analisis.js'

export function recomendarPlatos({ platos, presupuesto = '', personas = 1, perfilSalud = {}, ingredientesDisponibles = [], mercado = '', preciosRegistrados = [], opiniones = [] }) {
  const presupuestoNumerico = Number(presupuesto)
  const tienePresupuesto = String(presupuesto).trim() !== ''
  const opinionesPorPlato = analizarOpiniones(opiniones).porPlato
  return platos.map(plato => {
    const evaluacion = evaluarPlato(plato, perfilSalud)
    const nombresIngredientes = normalizar((plato.ingredientes ?? []).map(i => i.nombre).join(' '))
    const coincidencias = ingredientesDisponibles.filter(i => nombresIngredientes.includes(normalizar(i))).length
    const opinion = opinionesPorPlato[plato.id] || { promedio: 0, total: 0 }
    const costoMercado = mercado && calcularCostoReceta(plato, mercado, preciosRegistrados, personas)
    const costoReferencial = plato.precio * personas
    const costoTotal = costoMercado?.completo ? costoMercado.costoMaximo : costoReferencial
    return { plato, evaluacion, coincidencias, opinion, costoTotal }
  }).filter(({ evaluacion, costoTotal }) => !evaluacion.descartado &&
    (!tienePresupuesto || (Number.isFinite(presupuestoNumerico) && costoTotal <= presupuestoNumerico))
  ).sort((a, b) =>
    b.coincidencias - a.coincidencias ||
    b.evaluacion.coincidenciasSalud - a.evaluacion.coincidenciasSalud ||
    (b.opinion.total ? b.opinion.promedio : 3) - (a.opinion.total ? a.opinion.promedio : 3) ||
    a.costoTotal - b.costoTotal,
  ).map(({ plato }) => plato)
}
