const FRACCIONES = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
}

const UNIDADES = {
  g: { dimension: 'masa', factor: 1 },
  gr: { dimension: 'masa', factor: 1 },
  gramo: { dimension: 'masa', factor: 1 },
  gramos: { dimension: 'masa', factor: 1 },
  kg: { dimension: 'masa', factor: 1000 },
  kilo: { dimension: 'masa', factor: 1000 },
  kilos: { dimension: 'masa', factor: 1000 },
  mg: { dimension: 'masa', factor: 0.001 },
  ml: { dimension: 'volumen', factor: 1 },
  mililitro: { dimension: 'volumen', factor: 1 },
  mililitros: { dimension: 'volumen', factor: 1 },
  l: { dimension: 'volumen', factor: 1000 },
  litro: { dimension: 'volumen', factor: 1000 },
  litros: { dimension: 'volumen', factor: 1000 },
  taza: { dimension: 'volumen', factor: 240 },
  tazas: { dimension: 'volumen', factor: 240 },
  cucharada: { dimension: 'volumen', factor: 15 },
  cucharadas: { dimension: 'volumen', factor: 15 },
  cdas: { dimension: 'volumen', factor: 15 },
  cucharadita: { dimension: 'volumen', factor: 5 },
  cucharaditas: { dimension: 'volumen', factor: 5 },
  cdta: { dimension: 'volumen', factor: 5 },
  unidad: { dimension: 'unidad', factor: 1 },
  unidades: { dimension: 'unidad', factor: 1 },
  diente: { dimension: 'diente', factor: 1 },
  dientes: { dimension: 'diente', factor: 1 },
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .replace(/\s+/g, ' ')
    .trim()
}

function claveProducto(producto) {
  return normalizar(producto)
    .split(' ')
    .map((palabra) => {
      if (palabra.length > 5 && /(?:oles|ones|ores|ales|ices)$/.test(palabra)) {
        return palabra.slice(0, -2)
      }
      return palabra.length > 3 && palabra.endsWith('s') ? palabra.slice(0, -1) : palabra
    })
    .join(' ')
}

function coincideProducto(nombreReceta, productoRegistrado) {
  const receta = claveProducto(nombreReceta)
  const registrado = claveProducto(productoRegistrado)
  return receta === registrado || receta.startsWith(`${registrado} `) || registrado.startsWith(`${receta} `)
}

function analizarCantidad(cantidad, factorPorciones, nombreIngrediente) {
  if (!cantidad) return null

  const coincidencia = /^(\d+(?:[.,]\d+)?|[½¼¾⅓⅔])\s*(.*)$/.exec(cantidad.trim())
  if (!coincidencia) return null

  const valor = (FRACCIONES[coincidencia[1]] ?? Number(coincidencia[1].replace(',', '.'))) * factorPorciones
  const unidad = normalizar(coincidencia[2])
  const unidadBase = UNIDADES[unidad]
  if (!unidadBase || !Number.isFinite(valor) || valor <= 0) return null

  const equivalencias = [{
    dimension: unidadBase.dimension,
    valorBase: valor * unidadBase.factor,
    cantidadAproximada: false,
  }]
  if (unidad === 'taza' && claveProducto(nombreIngrediente) === 'arroz') {
    equivalencias.push({
      dimension: 'masa',
      valorBase: valor * 185,
      cantidadAproximada: true,
    })
  }

  return {
    equivalencias,
  }
}

function fechaOrden(fecha) {
  const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha ?? '')
  if (!coincidencia) return 0
  const [, dia, mes, anio] = coincidencia
  const fechaParsed = new Date(Number(anio), Number(mes) - 1, Number(dia))
  if (
    fechaParsed.getFullYear() !== Number(anio) ||
    fechaParsed.getMonth() !== Number(mes) - 1 ||
    fechaParsed.getDate() !== Number(dia)
  ) return 0
  return fechaParsed.getTime()
}

function costoIngrediente(ingrediente, mercado, preciosRegistrados, factorPorciones) {
  const cantidadReceta = analizarCantidad(ingrediente.cantidad, factorPorciones, ingrediente.nombre)
  let cantidadAproximada = Boolean(ingrediente.cantidadAproximada)
  if (!cantidadReceta) {
    return {
      nombre: ingrediente.nombre,
      cantidad: ingrediente.cantidad,
      cantidadAproximada,
      estado: 'cantidad-incompatible',
    }
  }

  const registros = preciosRegistrados.filter(
    (entrada) => entrada.mercado === mercado && coincideProducto(ingrediente.nombre, entrada.producto),
  )
  if (registros.length === 0) {
    return {
      nombre: ingrediente.nombre,
      cantidad: ingrediente.cantidad,
      cantidadAproximada,
      estado: 'sin-precio',
    }
  }

  const costosValidos = registros.map((entrada) => {
    const cantidadPrecio = Number(entrada.cantidadPrecio)
    const unidadPrecio = UNIDADES[normalizar(entrada.unidadPrecio ?? '')]
    const precio = Number(entrada.precio)
    const equivalencia = cantidadReceta.equivalencias.find(
      (cantidad) => cantidad.dimension === unidadPrecio?.dimension,
    )
    if (
      !Number.isFinite(cantidadPrecio) ||
      cantidadPrecio <= 0 ||
      !unidadPrecio ||
      !equivalencia ||
      !Number.isFinite(precio) ||
      precio <= 0
    ) return null

    return {
      fecha: fechaOrden(entrada.fecha),
      costo: (equivalencia.valorBase / (cantidadPrecio * unidadPrecio.factor)) * precio,
      cantidadAproximada: equivalencia.cantidadAproximada,
    }
  })

  if (costosValidos.every((costo) => costo === null)) {
    const registrosRecientes = [...registros].sort(
      (a, b) => fechaOrden(b.fecha) - fechaOrden(a.fecha),
    )
    const registro = registrosRecientes[0]
    const cantidadPrecio = Number(registro.cantidadPrecio)
    const unidadPrecio = registro.unidadPrecio
    return {
      nombre: ingrediente.nombre,
      cantidad: ingrediente.cantidad,
      cantidadAproximada,
      estado: 'unidad-incompatible',
      precioRegistrado: Number.isFinite(Number(registro.precio))
        ? Number(registro.precio)
        : null,
      presentacionRegistrada:
        Number.isFinite(cantidadPrecio) && cantidadPrecio > 0 && unidadPrecio
          ? `${cantidadPrecio} ${unidadPrecio}`
          : null,
    }
  }

  const costosCompatibles = costosValidos.filter(Boolean)
  const fechaMasReciente = Math.max(...costosCompatibles.map((entrada) => entrada.fecha))
  const costosRecientes = costosCompatibles
    .filter((entrada) => entrada.fecha === fechaMasReciente)
    .map((entrada) => entrada.costo)
  cantidadAproximada ||= costosCompatibles
    .some((entrada) => entrada.fecha === fechaMasReciente && entrada.cantidadAproximada)

  return {
    nombre: ingrediente.nombre,
    cantidad: ingrediente.cantidad,
    cantidadAproximada,
    estado: 'calculado',
    costoMinimo: Math.min(...costosRecientes),
    costoMaximo: Math.max(...costosRecientes),
  }
}

export function calcularCostoReceta(plato, mercado, preciosRegistrados, personas = plato.porciones) {
  const factorPorciones = personas / (plato.porciones || 1)
  const ingredientes = plato.ingredientes.map((ingrediente) =>
    costoIngrediente(ingrediente, mercado, preciosRegistrados, factorPorciones),
  )
  const faltantes = ingredientes.filter((ingrediente) => ingrediente.estado !== 'calculado')
  const costosCalculados = ingredientes.filter((ingrediente) => ingrediente.estado === 'calculado')

  return {
    ingredientes,
    faltantes,
    completo: faltantes.length === 0,
    costoMinimo: costosCalculados.reduce((total, ingrediente) => total + ingrediente.costoMinimo, 0),
    costoMaximo: costosCalculados.reduce((total, ingrediente) => total + ingrediente.costoMaximo, 0),
  }
}
