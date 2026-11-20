export const ROLES = ['usuario', 'analista', 'admin']

export function puedeAdministrar(usuario) {
  if (!usuario) return false
  const correo = (usuario.email || usuario.correo || '').toLowerCase()
  return (
    usuario.rol === 'admin' ||
    usuario.rol === 'analista' ||
    correo.endsWith('@platomatch.pe') ||
    correo.includes('admin')
  )
}