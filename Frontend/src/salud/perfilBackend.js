
const CONDICIONES = [
  'Anemia',
  'Diabetes',
  'Hipertensión',
  'Celiaquía',
]

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export function interpretarPerfil(texto = '') {
  const partes = String(texto || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  return {
    alergias: partes
      .filter((p) =>
        p.startsWith('A:') ||
        (
          !p.startsWith('C:') &&
          !CONDICIONES.some(
            (c) => normalizar(c) === normalizar(p)
          )
        )
      )
      .map((p) =>
        p.startsWith('A:') ? p.slice(2) : p
      ),

    condiciones: partes
      .filter((p) =>
        p.startsWith('C:') ||
        CONDICIONES.some(
          (c) => normalizar(c) === normalizar(p)
        )
      )
      .map((p) =>
        p.startsWith('C:') ? p.slice(2) : p
      ),
  }
}

export function serializarPerfil(perfil = {}) {
  return [
    ...(perfil.condiciones || [])
      .map((c) => `C:${c}`),

    ...(perfil.alergias || [])
      .map((a) => `A:${a}`),
  ].join(', ')
}
