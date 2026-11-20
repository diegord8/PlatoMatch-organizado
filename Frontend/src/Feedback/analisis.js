const ETIQUETAS = {
  precio: ['caro', 'barato', 'precio', 'costoso', 'economico', 'gasto'],
  sabor: ['rico', 'sabroso', 'sabor', 'salado', 'insipido'],
  facilidad: ['facil', 'dificil', 'rapido', 'preparar', 'tiempo'],
  porciones: ['porcion', 'cantidad', 'rinde'],
}
const limpiar = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function analizarOpiniones(opiniones = []) {
  const porPlato = {}
  const clasificacion = { positiva: 0, neutral: 0, negativa: 0 }
  const temas = Object.fromEntries(Object.keys(ETIQUETAS).map((t) => [t, 0]))
  for (const opinion of opiniones) {
    const id = opinion.platoId
    const actual = porPlato[id] || { suma: 0, total: 0, promedio: 0 }
    actual.suma += opinion.calificacion
    actual.total++
    actual.promedio = actual.suma / actual.total
    porPlato[id] = actual
    const tipo = opinion.calificacion >= 4 ? 'positiva' : opinion.calificacion <= 2 ? 'negativa' : 'neutral'
    clasificacion[tipo]++
    const texto = limpiar([opinion.comentario, ...(opinion.destacados ?? [])].join(' '))
    for (const [tema, palabras] of Object.entries(ETIQUETAS)) {
      if (palabras.some((palabra) => texto.includes(palabra))) temas[tema]++
    }
  }
  return { porPlato, clasificacion, temas }
}
