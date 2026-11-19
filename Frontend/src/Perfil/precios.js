const CATEGORIAS_PRODUCTOS = [
  { nombre: 'Granos y legumbres', palabras: ['arroz', 'quinua', 'avena', 'trigo', 'lenteja', 'frejol', 'frijol', 'garbanzo', 'arveja', 'maiz'] },
  { nombre: 'Verduras', palabras: ['espinaca', 'tomate', 'cebolla', 'zanahoria', 'brocoli', 'coliflor', 'papa', 'camote', 'lechuga', 'pimiento', 'betarraga', 'ajo'] },
  { nombre: 'Frutas', palabras: ['manzana', 'platano', 'banana', 'naranja', 'limon', 'palta', 'fresa', 'papaya', 'mango', 'uva', 'pera'] },
  { nombre: 'Proteínas', palabras: ['pollo', 'carne', 'pescado', 'atun', 'huevo', 'cerdo', 'pavo', 'mariscos'] },
  { nombre: 'Lácteos', palabras: ['leche', 'queso', 'yogur', 'yogurt', 'mantequilla', 'crema'] },
  { nombre: 'Condimentos', palabras: ['sal', 'pimienta', 'comino', 'aceite', 'vinagre', 'azucar', 'oregano'] },
]
export const MERCADOS = [
  'Mercado Central',
  'Mercado de Surquillo',
  'Mercado Santa Anita',
  'Supermercado Metro',
]

function normalizarClave(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .replace(/\s+/g, ' ')
    .trim()
}

function capitalizar(texto) {
  const limpio = texto.replace(/\s+/g, ' ').trim().toLocaleLowerCase('es-PE')
  return limpio.charAt(0).toLocaleUpperCase('es-PE') + limpio.slice(1)
}

function normalizarMercado(mercado) {
  return MERCADOS.find(
    (opcion) => normalizarClave(opcion) === normalizarClave(mercado),
  ) ?? capitalizar(mercado)
}

function categoriaProducto(producto) {
  const clave = normalizarClave(producto)
  return CATEGORIAS_PRODUCTOS.find(({ palabras }) =>
    palabras.some((palabra) =>
      new RegExp(`(?:^|[^a-z])${palabra}(?:s|es)?(?=$|[^a-z])`).test(clave),
    ),
  )?.nombre ?? 'Otros'
}

function fechaAOrden(fecha) {
  const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha)
  if (!coincidencia) return null
  const [, dia, mes, anio] = coincidencia
  const valor = new Date(Number(anio), Number(mes) - 1, Number(dia))
  if (
    valor.getFullYear() !== Number(anio) ||
    valor.getMonth() !== Number(mes) - 1 ||
    valor.getDate() !== Number(dia)
  ) return null
  return valor.getTime()
}

export function clasificarProducto(producto) {
  return categoriaProducto(producto)
}

export function limpiarClasificarPrecios(entradas) {
  const registrosValidos = []
  let eliminados = 0
  let normalizados = 0
  const vistos = new Set()

  entradas.forEach((entrada) => {
    const producto = capitalizar(entrada.producto)
    const mercado = normalizarMercado(entrada.mercado)
    const precio = Number(entrada.precio)
    const fechaOrden = fechaAOrden(entrada.fecha)
    if (!producto || !mercado || !Number.isFinite(precio) || precio <= 0 || fechaOrden === null) {
      eliminados += 1
      return
    }

    const clave = [
      normalizarClave(producto),
      normalizarClave(mercado),
      entrada.fecha,
      precio.toFixed(2),
      String(entrada.cantidadPrecio ?? ''),
      normalizarClave(String(entrada.unidadPrecio ?? '')),
    ].join('|')
    if (vistos.has(clave)) {
      eliminados += 1
      return
    }
    vistos.add(clave)

    const registro = {
      ...entrada,
      producto,
      mercado,
      precio: Number(precio.toFixed(2)),
      categoria: categoriaProducto(producto),
      tendencia: 'nuevo',
    }
    if (
      registro.producto !== entrada.producto ||
      registro.mercado !== entrada.mercado ||
      registro.precio !== entrada.precio ||
      registro.categoria !== entrada.categoria
    ) normalizados += 1
    registrosValidos.push({ registro, fechaOrden, indice: registrosValidos.length })
  })

  const anteriores = new Map()
  registrosValidos
    .sort((a, b) => a.fechaOrden - b.fechaOrden || a.indice - b.indice)
    .forEach(({ registro }) => {
      const clave = `${normalizarClave(registro.producto)}|${normalizarClave(registro.mercado)}|${registro.cantidadPrecio ?? ''}|${registro.unidadPrecio ?? ''}`
      const precioAnterior = anteriores.get(clave)
      if (precioAnterior !== undefined) {
        registro.tendencia =
          registro.precio > precioAnterior ? 'sube' :
            registro.precio < precioAnterior ? 'baja' : 'igual'
      }
      anteriores.set(clave, registro.precio)
    })

  return {
    registros: registrosValidos
      .sort((a, b) => b.fechaOrden - a.fechaOrden || b.indice - a.indice)
      .map(({ registro }) => registro),
    eliminados,
    normalizados,
  }
}
