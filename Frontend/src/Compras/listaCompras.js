
/**
 * HU-17: Generar el texto de la lista de compras.
 */
export function textoLista(lista) {
  if (!lista) {
    return 'No hay una lista de compras disponible.'
  }

  const ingredientes = lista.ingredientes || []

  // Sumar únicamente los precios disponibles.
  const subtotal = ingredientes.reduce(
    (total, ingrediente) =>
      total + Number(ingrediente.precio || 0),
    0
  )

  // Contar ingredientes sin precio.
  const sinPrecio = ingredientes.filter(
    (ingrediente) => !ingrediente.precioDisponible
  ).length

  // Identificar ingredientes pendientes y comprados.
  const pendientes = ingredientes.filter(
    (ingrediente) => !ingrediente.comprado
  )

  const comprados = ingredientes.filter(
    (ingrediente) => ingrediente.comprado
  )

  const fecha = lista.fecha
    ? new Date(lista.fecha).toLocaleDateString('es-PE')
    : new Date().toLocaleDateString('es-PE')

  const formatearIngrediente = (ingrediente) => {
    const marca = ingrediente.comprado
      ? '[X]'
      : '[ ]'

    const precio = ingrediente.precioDisponible
      ? `S/ ${Number(ingrediente.precio || 0).toFixed(2)}`
      : 'Sin precio disponible'

    return (
      `${marca} ${ingrediente.nombre} - ` +
      `${ingrediente.cantidad} - ${precio}`
    )
  }

  const lineas = [
    '================================',
    '   PLATOMATCH - LISTA DE COMPRAS',
    '================================',
    '',
    `Receta: ${lista.nombre || 'Sin nombre'}`,
    `Personas: ${lista.personas || 1}`,
    `Fecha: ${fecha}`,
    '',
    '--------------------------------',
    `PENDIENTES (${pendientes.length})`,
    '--------------------------------',

    ...(
      pendientes.length > 0
        ? pendientes.map(formatearIngrediente)
        : ['No hay ingredientes pendientes.']
    ),

    '',
    '--------------------------------',
    `COMPRADOS (${comprados.length})`,
    '--------------------------------',

    ...(
      comprados.length > 0
        ? comprados.map(formatearIngrediente)
        : ['Aún no hay ingredientes comprados.']
    ),

    '',
    '================================',
    'RESUMEN DE COSTOS',
    '================================',

    `Subtotal conocido: S/ ${subtotal.toFixed(2)}`,

    sinPrecio > 0
      ? `${sinPrecio} ingrediente(s) sin precio registrado.`
      : 'Todos los ingredientes tienen precio.',

    sinPrecio > 0
      ? 'El costo total está incompleto.'
      : 'Costo referencial completo.',

    '',
    'Lista generada con PlatoMatch.',
  ]

  return lineas.join('\n')
}


/**
 * HU-17: Exportar la lista a un archivo TXT.
 * El archivo descargado puede consultarse sin internet.
 */
export function exportarListaTexto(lista) {
  if (!lista) {
    alert('No hay una lista de compras para exportar.')
    return
  }

  // Generar el contenido del archivo.
  const contenido = textoLista(lista)

  // Crear archivo TXT.
  const archivo = new Blob(
    [contenido],
    {
      type: 'text/plain;charset=utf-8',
    }
  )

  // Generar enlace temporal de descarga.
  const url = URL.createObjectURL(archivo)

  const enlace = document.createElement('a')

  enlace.href = url

  enlace.download =
    `PlatoMatch_lista_${lista.id || 'compras'}.txt`

  // Descargar.
  document.body.appendChild(enlace)

  enlace.click()

  // Limpiar enlace temporal.
  enlace.remove()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}
