import { normalizar } from '../salud/filtros.js'

export function generarListaCompras(plato, personas, disponibles = '') {
  const existentes = disponibles.split(',').map((i) => normalizar(i)).filter(Boolean)
  const factor = personas / (plato.porciones || 1)
  return {
    id: crypto.randomUUID(),
    platoId: plato.id,
    nombre: plato.nombre,
    personas,
    fecha: new Date().toISOString(),
    ingredientes: plato.ingredientes.map((ingrediente, indice) => {
      const nombre = ingrediente.nombre
      const encontrado = existentes.some((item) => {
        const a = normalizar(nombre)
        return a === item || a.startsWith(`${item} `) || item.startsWith(`${a} `)
      })
      return {
        id: `${indice}-${normalizar(nombre)}`,
        nombre,
        cantidad: escalarCantidad(ingrediente.cantidad, factor),
        enCasa: encontrado,
        comprado: false,
      }
    }),
  }
}

export function escalarCantidad(cantidad = '', factor = 1) {
  const fracciones = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }
  const m = /^(\d+(?:[.,]\d+)?|[½¼¾⅓⅔])\s*(.*)$/.exec(cantidad.trim())
  if (!m) return cantidad
  const n = (fracciones[m[1]] ?? Number(m[1].replace(',', '.'))) * factor
  const valor = Number.isInteger(n) ? String(n) : n.toLocaleString('es-PE', { maximumFractionDigits: 2 })
  return `${valor} ${m[2]}`.trim()
}

export function textoLista(lista) {
  const pendientes = lista.ingredientes.filter((i) => !i.enCasa)
  return [
    `PlatoMatch — Lista de compras`,
    `Receta: ${lista.nombre}`,
    `Personas: ${lista.personas}`,
    `Fecha: ${new Date(lista.fecha).toLocaleDateString('es-PE')}`,
    '', 'POR COMPRAR',
    ...pendientes.map((i) => `${i.comprado ? '[x]' : '[ ]'} ${i.nombre} — ${i.cantidad}`),
    '', 'YA DISPONIBLES EN CASA',
    ...lista.ingredientes.filter((i) => i.enCasa).map((i) => `[-] ${i.nombre} — ${i.cantidad}`),
  ].join('\n')
}

export function exportarListaTexto(lista) {
  const url = URL.createObjectURL(new Blob([textoLista(lista)], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `PlatoMatch_lista_${lista.platoId}.txt`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
