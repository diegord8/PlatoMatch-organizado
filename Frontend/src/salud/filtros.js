// Coincidencia conservadora de ingredientes declarados. NO certifica ausencia de trazas.
const ALERGENOS = {
  gluten: ['trigo', 'cebada', 'centeno', 'harina', 'pan', 'pasta', 'fideos', 'seitan'],
  lacteos: ['leche', 'queso', 'yogur', 'yogurt', 'crema', 'mantequilla', 'lactosa'],
  mariscos: ['camaron', 'langostino', 'cangrejo', 'pulpo', 'calamar', 'mejillon', 'concha'],
  nueces: ['nuez', 'almendra', 'mani', 'cacahuate', 'avellana', 'pistacho', 'castana'],
  huevo: ['huevo', 'mayonesa'],
  soya: ['soya', 'soja', 'tofu', 'salsa de soja'],
}
const CONDICIONES = {
  anemia: ['hierro', 'lenteja', 'espinaca', 'frejol'],
  diabetes: ['fibra', 'integral', 'verdura', 'sin azucar'],
  hipertension: ['bajo en sodio', 'sin sal', 'verdura', 'fruta'],
  celiaquia: ['sin gluten'],
}
export function normalizar(texto = '') {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE').trim()
}
function contieneTermino(texto, termino) {
  const escapado = normalizar(termino).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z])${escapado}([^a-z]|$)`).test(texto)
}
export function evaluarPlato(plato, perfil = {}) {
  const alergias = perfil.alergias ?? []
  const condiciones = perfil.condiciones ?? []
  const ingredientes = normalizar((plato.ingredientes ?? []).map((i) => i.nombre).join(' '))
  const declarados = [...alergias]
  if (condiciones.some((c) => normalizar(c) === 'celiaquia')) declarados.push('Gluten')
  const riesgos = []
  const noEvaluables = []
  for (const alergia of declarados) {
    const nombre = normalizar(alergia)
    const clave = nombre === 'lactosa' ? 'lacteos' : nombre
    const sinonimos = ALERGENOS[clave]
    if (!sinonimos) {
      // Personalizaciones desconocidas: se evitan afirmaciones de seguridad.
      noEvaluables.push(alergia)
    } else if (sinonimos.some((palabra) => contieneTermino(ingredientes, palabra))) {
      riesgos.push(alergia)
    }
  }
  const texto = normalizar([plato.nombre, plato.descripcion, ...(plato.etiquetas ?? [])].join(' '))
  const coincidenciasSalud = condiciones.reduce((n, c) => {
    const terminos = CONDICIONES[normalizar(c)]
    return n + (terminos?.some((t) => contieneTermino(texto, t)) ? 1 : 0)
  }, 0)
  return { riesgos, noEvaluables, coincidenciasSalud, descartado: riesgos.length > 0 || noEvaluables.length > 0 }
}
export const AVISO_SALUD = 'Filtro orientativo basado solo en los ingredientes declarados; no comprueba trazas, contaminación cruzada ni necesidades clínicas. Si tienes alergias o una condición médica, confirma ingredientes y consulta a un profesional.'
