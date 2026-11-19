import test from 'node:test'
import assert from 'node:assert/strict'
import { PLATOS } from '../src/data/platos.js'
import { evaluarPlato } from '../src/salud/filtros.js'
import { recomendarPlatos } from '../src/Buscador/recomendaciones.js'
import { generarListaCompras, escalarCantidad, textoLista } from '../src/Compras/listaCompras.js'
import { compararAhorro } from '../src/Finanzas/ahorro.js'
import { analizarOpiniones } from '../src/Feedback/analisis.js'
import { limpiarClasificarPrecios } from '../src/Perfil/precios.js'
import { comprobarRecordatorio } from '../src/Recordatorios/recordatorios.js'

const receta = PLATOS[0]

test('HU02-03-06: el presupuesto aplica al costo total de todas las personas', () => {
  const opciones = recomendarPlatos({ platos: PLATOS, presupuesto: '5', personas: 2 })
  assert.ok(opciones.every(p => p.precio * 2 <= 5))
  assert.equal(opciones.length, 0)
  assert.ok(recomendarPlatos({ platos: PLATOS, presupuesto: '6', personas: 2 }).some(p => p.id === 4))
})

test('HU04: la alergia conocida filtra coincidencias y las desconocidas no se certifican', () => {
  const conHuevo = { ingredientes: [{ nombre: 'Huevo' }], etiquetas: [] }
  assert.equal(evaluarPlato(conHuevo, { alergias: ['Huevo'] }).descartado, true)
  assert.equal(evaluarPlato(receta, { alergias: ['Ingrediente personalizado'] }).descartado, true)
  assert.equal(evaluarPlato(receta, {}).descartado, false)
})

test('HU05: ingredientes en casa priorizan recetas sin excluir las restantes', () => {
  const opciones = recomendarPlatos({ platos: PLATOS, ingredientesDisponibles: ['quinua'] })
  assert.equal(opciones[0].id, 2)
  assert.equal(opciones.length, PLATOS.length)
})

test('HU13-14: opiniones cambian el desempate y se clasifican por temas', () => {
  const platos = PLATOS.filter(p => p.id === 2 || p.id === 5)
  const opiniones = [{ platoId: 5, calificacion: 5, comentario: 'Muy fácil, rico y barato', destacados: [] },
    { platoId: 2, calificacion: 1, comentario: 'Muy caro', destacados: [] }]
  const opciones = recomendarPlatos({ platos, opiniones })
  assert.equal(opciones[0].id, 5)
  const resumen = analizarOpiniones(opiniones)
  assert.deepEqual(resumen.clasificacion, { positiva: 1, neutral: 0, negativa: 1 })
  assert.equal(resumen.temas.precio, 2)
})

test('HU15-17: lista omite productos en casa, escala cantidades y exporta texto', () => {
  const lista = generarListaCompras(receta, 2, 'lentejas, ajo')
  assert.equal(lista.personas, 2)
  assert.equal(lista.ingredientes.find(i => i.nombre === 'Lentejas').enCasa, true)
  assert.equal(lista.ingredientes.find(i => i.nombre === 'Espinacas').cantidad, '160 g')
  assert.equal(escalarCantidad('½ taza', 2), '1 taza')
  const texto = textoLista(lista)
  assert.ok(texto.includes('POR COMPRAR'))
  assert.ok(texto.includes('YA DISPONIBLES EN CASA'))
})

test('HU10: precios con distinta presentación no se eliminan entre sí', () => {
  const base = { producto: 'Arroz', mercado: 'Mercado Central', precio: 5, fecha: '01/11/2026' }
  const valores = [ { ...base, cantidadPrecio: 1, unidadPrecio: 'kg' },
    { ...base, cantidadPrecio: 500, unidadPrecio: 'g' } ]
  assert.equal(limpiarClasificarPrecios(valores).registros.length, 2)
})

test('HU18: sólo se calcula ahorro con dos mercados y presentaciones comparables', () => {
  const prueba = { ...receta, ingredientes: [{nombre:'Arroz',cantidad:'100 g'}] }
  const precios = [
    { producto:'Arroz',mercado:'Mercado Central',precio:5,cantidadPrecio:1,unidadPrecio:'kg',fecha:'01/11/2026' },
    { producto:'Arroz',mercado:'Mercado de Surquillo',precio:7,cantidadPrecio:1,unidadPrecio:'kg',fecha:'01/11/2026' },
  ]
  const ahorro = compararAhorro(prueba, 1, precios)
  assert.equal(ahorro.mercado, 'Mercado Central')
  assert.ok(Math.abs(ahorro.ahorro - .2) < .00001)
  assert.equal(compararAhorro(prueba, 1, precios.slice(0,1)), null)
})

test('HU20: sin activación no aparece recordatorio', () => {
  assert.equal(comprobarRecordatorio({ activo: false, hora: '12:00' }, () => {}), false)
})

test('HU11: promedio compartido entre cuentas de un mismo navegador', async () => {
  const { calcularEstadisticasMercados } = await import('../src/Buscador/estadisticasMercados.js')
  const values = new Map([
    ['platomatch.calificaciones-mercados.a%40ejemplo.com', JSON.stringify({ 'Mercado Central': 5 })],
    ['platomatch.calificaciones-mercados.b%40ejemplo.com', JSON.stringify({ 'Mercado Central': 3 })],
  ])
  const storage = { get length() {return values.size}, key: (i) => [...values.keys()][i], getItem: (k) => values.get(k) ?? null }
  const stats = calcularEstadisticasMercados(storage, { email:'a@ejemplo.com' }, { 'Mercado Central':5 })
  assert.equal(stats['Mercado Central'].promedio, 4)
  assert.equal(stats['Mercado Central'].cantidad, 2)
})

test('HU01 y HU19: la cuenta guarda el perfil y mantiene actualizaciones de salud al volver a iniciar sesión', async () => {
  const { registrarCuenta, autenticarCuenta, guardarPerfilSaludCuenta } = await import('../src/InicioSesion/cuentas.js')
  const datos = new Map()
  const guardar = (k,v)=> datos.set(k,v)
  globalThis.window = {
    crypto: globalThis.crypto,
    localStorage: { getItem: (k) => datos.get(k) || null, setItem: guardar, removeItem: (k) => datos.delete(k) },
  }
  const perfil = { alergias: ['Gluten'], condiciones: [] }
  await registrarCuenta({ nombre: 'Demo', email:'demo@ejemplo.com',password:'Password123', perfilSalud:perfil })
  const login = await autenticarCuenta('demo@ejemplo.com', 'Password123')
  assert.deepEqual(login.perfilSalud, perfil)
  const nuevo = { alergias:[], condiciones:['Anemia'] }
  guardarPerfilSaludCuenta('demo@ejemplo.com', nuevo)
  assert.deepEqual((await autenticarCuenta('demo@ejemplo.com', 'Password123')).perfilSalud, nuevo)
  assert.equal(await autenticarCuenta('demo@ejemplo.com','incorrecto'), null)
  delete globalThis.window
})

test('Roles: una cuenta nueva es usuario y no administra; analista y admin sí', async () => {
  const { registrarCuenta, autenticarCuenta } = await import('../src/InicioSesion/cuentas.js')
  const { puedeAdministrar } = await import('../src/services/permisos.js')
  const datos = new Map()
  globalThis.window = {
    crypto: globalThis.crypto,
    localStorage: { getItem: (k) => datos.get(k) || null, setItem: (k, v) => datos.set(k, v), removeItem: (k) => datos.delete(k) },
  }
  await registrarCuenta({ nombre: 'Ana', email: 'ana@ejemplo.com', password: 'Password123', perfilSalud: { alergias: [], condiciones: [] } })
  const ana = await autenticarCuenta('ana@ejemplo.com', 'Password123')
  assert.equal(ana.rol, 'usuario')
  assert.equal(puedeAdministrar(ana), false)
  assert.equal(puedeAdministrar({ rol: 'analista' }), true)
  assert.equal(puedeAdministrar({ rol: 'admin' }), true)
  assert.equal(puedeAdministrar(null), false)
  delete globalThis.window
})

test('Repositorio: guardados, precios y opiniones se guardan y se leen por la capa central', async () => {
  const datos = new Map()
  globalThis.window = {
    localStorage: { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v), removeItem: (k) => datos.delete(k) },
  }
  const repo = await import('../src/services/repositorio.js')
  const usuario = { email: 'Ana@ejemplo.com' }
  repo.guardarGuardados(usuario, [1, 2])
  assert.deepEqual(repo.cargarGuardados(usuario), [1, 2])
  assert.deepEqual(repo.cargarGuardados({ email: 'otra@ejemplo.com' }), [])
  repo.guardarCalificacionesMercados(usuario, { 'Mercado Central': 4 })
  assert.deepEqual(repo.cargarCalificacionesMercados(usuario), { 'Mercado Central': 4 })
  repo.migrarDatosUsuario(usuario, { email: 'nueva@ejemplo.com' })
  assert.deepEqual(repo.cargarGuardados({ email: 'nueva@ejemplo.com' }), [1, 2])
  assert.deepEqual(repo.cargarPreciosRegistrados(), [])
  assert.deepEqual(repo.cargarDatosPorUsuario(usuario).presupuestoBase, '')
  delete globalThis.window
})
