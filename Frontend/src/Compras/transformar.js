
export function adaptarSeguimiento(datos) {
  if (!datos) return null

  const items = [
    ...(datos.pendientes || []),
    ...(datos.comprados || []),
  ]

  return {
    id: datos.listaId,
    platoId: datos.recetaId,
    nombre: datos.recetaNombre,
    personas: datos.cantidadPersonas || 1,
    fecha: datos.fechaCreacion,
    registrada: Boolean(datos.registrada),

    ingredientes: items.map((ing) => ({
      id: ing.id,
      nombre: ing.ingrediente,
      cantidad: `${ing.cantidad} ${ing.unidadMedida}`,
      precioDisponible: Boolean(ing.precioDisponible),

      precio: ing.precioDisponible
        ? Number(ing.precioEstimado)
        : null,

      comprado: Boolean(ing.comprado),
      enCasa: false,
    })).sort((a, b) => a.id - b.id),
  }
}
