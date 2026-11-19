
import { useEffect, useMemo, useState } from 'react'
import { BackendService } from '../services/backendService.js'
import { soles } from '../data/platos.js'
import { exportarListaTexto } from './listaCompras.js'

// ESTILOS
const tarjeta = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 20,
  marginBottom: 16,
}

const boton = {
  border: 0,
  borderRadius: 12,
  padding: '13px 16px',
  fontWeight: 700,
  cursor: 'pointer',
}

// NORMALIZAR NOMBRES DE PRODUCTOS
function normalizarProducto(valor) {
  const nombre = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  const equivalencias = {
    espinacas: 'espinaca',
    'espinaca fresca': 'espinaca',
    limones: 'limon',
    zanahorias: 'zanahoria',
  }

  return equivalencias[nombre] || nombre
}

// NORMALIZAR UNIDADES
function convertirUnidad(unidad) {
  const u = String(unidad || '')
    .toLowerCase()
    .trim()

  const unidades = {
    kg: ['peso', 1000],
    kilo: ['peso', 1000],
    kilogramo: ['peso', 1000],
    kilogramos: ['peso', 1000],

    g: ['peso', 1],
    gr: ['peso', 1],
    gramo: ['peso', 1],
    gramos: ['peso', 1],

    l: ['volumen', 1000],
    litro: ['volumen', 1000],
    litros: ['volumen', 1000],

    ml: ['volumen', 1],
    mililitro: ['volumen', 1],
    mililitros: ['volumen', 1],

    unidad: ['unidad', 1],
    unidades: ['unidad', 1],
    und: ['unidad', 1],

    diente: ['diente', 1],
    dientes: ['diente', 1],

    taza: ['taza', 1],
    tazas: ['taza', 1],

    cucharada: ['cucharada', 1],
    cucharadas: ['cucharada', 1],

    cucharadita: ['cucharadita', 1],
    cucharaditas: ['cucharadita', 1],

    atado: ['atado', 1],
    atados: ['atado', 1],
  }

  return unidades[u] || null
}

// CONVERTIR VALORES A NÚMEROS
function numero(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return NaN
  }

  return Number(String(valor).replace(',', '.'))
}

// LEER LA CANTIDAD DE UN INGREDIENTE
// Ejemplo: "80 g" => 80 y "g"
function leerCantidad(ingrediente) {
  const texto = String(ingrediente.cantidad ?? '')
    .replace(',', '.')
    .trim()

  const resultado = texto.match(
    /^(\d+(?:\.\d+)?)\s*(.*)$/
  )

  if (!resultado) return null

  const cantidad = numero(resultado[1])

  const unidad =
    ingrediente.unidadMedida ||
    ingrediente.unidad ||
    resultado[2]

  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return null
  }

  return {
    cantidad,
    unidad,
  }
}

// CALCULAR COSTO SEGÚN UN MERCADO
function calcularCostoEnMercado(ingrediente, precios) {
  const cantidadReceta = leerCantidad(ingrediente)

  if (!cantidadReceta) return null

  const unidadReceta = convertirUnidad(
    cantidadReceta.unidad
  )

  if (!unidadReceta) return null

  const nombreBuscado = normalizarProducto(
    ingrediente.nombre
  )

  const costos = []

  for (const registro of precios) {
    const nombreRegistrado = normalizarProducto(
      registro.productoNombre
    )

    if (nombreRegistrado !== nombreBuscado) {
      continue
    }

    const precio = numero(registro.precio)
    const cantidadPrecio = numero(
      registro.cantidadPrecio
    )

    const unidadPrecio = convertirUnidad(
      registro.unidadPrecio
    )

    if (
      !Number.isFinite(precio) ||
      precio <= 0 ||
      !Number.isFinite(cantidadPrecio) ||
      cantidadPrecio <= 0 ||
      !unidadPrecio
    ) {
      continue
    }

    // Solo convertir unidades compatibles.
    if (unidadReceta[0] !== unidadPrecio[0]) {
      continue
    }

    const cantidadNecesariaBase =
      cantidadReceta.cantidad * unidadReceta[1]

    const cantidadRegistradaBase =
      cantidadPrecio * unidadPrecio[1]

    const costo =
      precio *
      cantidadNecesariaBase /
      cantidadRegistradaBase

    if (Number.isFinite(costo)) {
      costos.push(
        Math.round((costo + Number.EPSILON) * 100) / 100
      )
    }
  }

  if (costos.length === 0) return null

  return Math.min(...costos)
}


// COMPONENTE PRINCIPAL
export default function ListaCompras({
  lista,
  mercados = [],
  onMarcar,
  onVolver,
  onRegistrarAhorro,
  onVerAhorro,
  onVerRecetas,
}) {
  const [mercadoId, setMercadoId] = useState('')

  const [preciosMercado, setPreciosMercado] = useState([])
  const [cargandoPrecios, setCargandoPrecios] = useState(false)
  const [errorPrecios, setErrorPrecios] = useState('')

  const [gastoConfirmado, setGastoConfirmado] = useState('')
  const [costoReferencia, setCostoReferencia] = useState('')

  const [marcando, setMarcando] = useState(null)
  const [registrando, setRegistrando] = useState(false)
  const [error, setError] = useState('')

  const ingredientes = useMemo(
    () => Array.isArray(lista?.ingredientes)
      ? lista.ingredientes
      : [],
    [lista?.ingredientes]
  )

  // SELECCIONAR EL PRIMER MERCADO DISPONIBLE
  useEffect(() => {
    const existe = mercados.some(
      m => String(m.id) === mercadoId
    )

    if (!existe) {
      setMercadoId(
        mercados.length > 0
          ? String(mercados[0].id)
          : ''
      )
    }
  }, [mercados, mercadoId])

  // CONSULTAR LOS PRECIOS DEL MERCADO SELECCIONADO
  useEffect(() => {
    let activo = true

    if (!mercadoId) {
      setPreciosMercado([])
      setCargandoPrecios(false)
      return undefined
    }

    const cargarPrecios = async () => {
      setCargandoPrecios(true)
      setErrorPrecios('')
      setPreciosMercado([])

      try {
        const respuesta =
          await BackendService.obtenerPreciosPorMercado(
            Number(mercadoId)
          )

        const precios = Array.isArray(respuesta)
          ? respuesta
          : respuesta?.precios

        if (!Array.isArray(precios)) {
          throw new Error(
            'El backend no devolvió una lista válida de precios.'
          )
        }

        if (activo) {
          setPreciosMercado(precios)
        }
      } catch (err) {
        if (activo) {
          setPreciosMercado([])
          setErrorPrecios(
            err.message ||
            'No se pudieron cargar los precios.'
          )
        }
      } finally {
        if (activo) {
          setCargandoPrecios(false)
        }
      }
    }

    cargarPrecios()

    return () => {
      activo = false
    }
  }, [mercadoId])

  // CAMBIAR DE MERCADO
  const cambiarMercado = (event) => {
    const nuevoId = event.target.value

    setPreciosMercado([])
    setCargandoPrecios(true)
    setErrorPrecios('')
    setMercadoId(nuevoId)
  }

  const mercadoSeleccionado = mercados.find(
    m => String(m.id) === mercadoId
  )

  // RECALCULAR TODOS LOS PRECIOS
  const ingredientesCalculados = useMemo(() => {
    return ingredientes.map((ingrediente) => {
      const costo =
        mercadoId &&
        !cargandoPrecios &&
        !errorPrecios
          ? calcularCostoEnMercado(
              ingrediente,
              preciosMercado
            )
          : null

      return {
        ...ingrediente,
        precio: costo,
        precioDisponible: costo !== null,
      }
    })
  }, [
    ingredientes,
    preciosMercado,
    mercadoId,
    cargandoPrecios,
    errorPrecios,
  ])

  // SEPARAR INGREDIENTES
  const pendientes = ingredientesCalculados.filter(
    i => !i.comprado
  )

  const comprados = ingredientesCalculados.filter(
    i => i.comprado
  )

  const sinPrecio = ingredientesCalculados.filter(
    i => !i.precioDisponible
  )

  // SUBTOTAL SEGÚN EL MERCADO ELEGIDO
  const subtotal = ingredientesCalculados.reduce(
    (total, i) => total + Number(i.precio ?? 0),
    0
  )

  // IMPORTE PENDIENTE SEGÚN EL MERCADO
  const importePendiente = pendientes.reduce(
    (total, i) => total + Number(i.precio ?? 0),
    0
  )

  const completado =
    Boolean(lista) && pendientes.length === 0

  // REINICIAR EL FORMULARIO CON UNA LISTA NUEVA
  useEffect(() => {
    setGastoConfirmado('')
    setCostoReferencia('')
    setError('')
  }, [lista?.id])

  // MARCAR Y DESMARCAR
  const marcar = async (id) => {
    setMarcuandoSeguro(id)

    try {
      await onMarcar(id)
      setError('')
    } catch (err) {
      setError(
        err.message ||
        'No se pudo actualizar el ingrediente.'
      )
    } finally {
      setMarcuandoSeguro(null)
    }
  }

  function setMarcuandoSeguro(valor) {
    setMarcando(valor)
  }

  // REGISTRAR GASTO REAL
  const guardarCompra = async (event) => {
    event.preventDefault()
    setError('')

    if (!mercadoId) {
      setError('Selecciona un mercado.')
      return
    }

    if (gastoConfirmado.trim() === '') {
      setError('Indica el gasto real de la compra.')
      return
    }

    const gasto = numero(gastoConfirmado)

    const referencia = costoReferencia.trim() === ''
      ? null
      : numero(costoReferencia)

    if (
      !Number.isFinite(gasto) ||
      gasto < 0 ||
      (ingredientes.length > 0 && gasto === 0)
    ) {
      setError('El gasto real no es válido.')
      return
    }

    if (
      referencia !== null &&
      (!Number.isFinite(referencia) || referencia <= 0)
    ) {
      setError('El costo alternativo no es válido.')
      return
    }

    const aceptado = window.confirm(
      `¿Confirmas un gasto real de ${soles(gasto)}?`
    )

    if (!aceptado) return

    setRegistrando(true)

    try {
      await onRegistrarAhorro({
        listaId: lista.id,
        mercadoId: Number(mercadoId),
        costoEjecutado: gasto,
        costoReferenciaAlternativa: referencia,
      })
    } catch (err) {
      setError(
        err.message ||
        'No se pudo guardar el gasto.'
      )
    } finally {
      setRegistrando(false)
    }
  }

  // EXPORTAR TXT CON PRECIOS DEL MERCADO SELECCIONADO
  const descargarTexto = () => {
    exportarListaTexto({
      ...lista,
      mercado: mercadoSeleccionado?.nombre || '',
      ingredientes: ingredientesCalculados,
    })
  }

  // INGREDIENTE VISUAL
  const mostrarIngrediente = (ing) => (
    <li
      key={ing.id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <label style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={Boolean(ing.comprado)}
          disabled={lista.registrada || marcando !== null}
          onChange={() => marcar(ing.id)}
          style={{
            width: 20,
            height: 20,
            accentColor: '#059669',
          }}
        />

        <span style={{
          color: ing.comprado ? '#94a3b8' : '#0f172a',
          textDecoration: ing.comprado
            ? 'line-through'
            : 'none',
        }}>
          <strong>{ing.nombre}</strong>

          <small style={{
            display: 'block',
            marginTop: 4,
          }}>
            {ing.cantidad}
          </small>
        </span>
      </label>

      <strong style={{
        color: ing.precioDisponible
          ? '#047857'
          : '#b45309',
        textAlign: 'right',
        fontSize: 13,
      }}>
        {cargandoPrecios
          ? 'Calculando...'
          : ing.precioDisponible
            ? soles(ing.precio)
            : 'Sin precio en este mercado'}
      </strong>
    </li>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      paddingBottom: 40,
    }}>
      {/* ENCABEZADO */}
      <header style={{
        background:
          'linear-gradient(120deg, #065f46, #059669)',
        color: '#fff',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 15,
      }}>
        <button
          type="button"
          onClick={onVolver}
          style={{
            ...boton,
            background: '#ffffff25',
            color: '#fff',
          }}
        >
          ←
        </button>

        <h1 style={{
          margin: 0,
          fontSize: 21,
          flex: 1,
        }}>
          Mi lista de compras
        </h1>

        {lista && (
          <strong>
            {comprados.length}/{ingredientes.length}
          </strong>
        )}
      </header>

      <main style={{
        maxWidth: 650,
        margin: '25px auto',
        padding: '0 18px',
      }}>
        {!lista ? (
          <section style={tarjeta}>
            <h2>No tienes una lista activa</h2>
            <p>Selecciona una receta para generar tu lista.</p>

            <button
              type="button"
              onClick={onVerRecetas}
              style={boton}
            >
              Buscar recetas
            </button>
          </section>
        ) : (
          <>
            {/* RECETA */}
            <section style={tarjeta}>
              <strong style={{
                color: '#059669',
                fontSize: 12,
              }}>
                RECETA SELECCIONADA
              </strong>

              <h2 style={{ color: '#065f46' }}>
                {lista.nombre}
              </h2>

              <p>
                Para {lista.personas} personas
              </p>

              <p style={{ color: '#64748b' }}>
                Ingredientes faltantes identificados
                según tu despensa.
              </p>

              <strong>
                {comprados.length} de {ingredientes.length}
                {' '}ingredientes comprados
              </strong>
            </section>

            {/* NUEVA SELECCIÓN DE MERCADOS */}
            <section style={{
              ...tarjeta,
              background: '#ecfdf5',
            }}>
              <h3 style={{
                color: '#065f46',
                marginTop: 0,
              }}>
                🏪 Selecciona el mercado
              </h3>

              <p style={{
                color: '#64748b',
                fontSize: 13,
              }}>
                Los precios se actualizarán según
                el mercado que elijas.
              </p>

              <select
                value={mercadoId}
                onChange={cambiarMercado}
                disabled={mercados.length === 0}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  border: '1px solid #86efac',
                  background: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#065f46',
                  cursor: 'pointer',
                }}
              >
                {mercados.length === 0 && (
                  <option value="">
                    No hay mercados disponibles
                  </option>
                )}

                {mercados.map(m => (
                  <option
                    key={m.id}
                    value={String(m.id)}
                  >
                    {m.nombre}
                  </option>
                ))}
              </select>

              {cargandoPrecios && (
                <p style={{
                  color: '#047857',
                  fontSize: 13,
                }}>
                  Consultando precios de SQL Server...
                </p>
              )}

              {errorPrecios && (
                <p role="alert" style={{
                  color: '#b91c1c',
                  fontSize: 13,
                }}>
                  {errorPrecios}
                </p>
              )}

              {mercadoSeleccionado && !cargandoPrecios && (
                <p style={{
                  color: '#047857',
                  fontSize: 13,
                  marginBottom: 0,
                }}>
                  Mercado seleccionado:
                  {' '}<strong>{mercadoSeleccionado.nombre}</strong>
                </p>
              )}
            </section>

            {/* PENDIENTES */}
            <section style={tarjeta}>
              <h3 style={{ color: '#b45309' }}>
                🛒 Pendientes ({pendientes.length})
              </h3>

              {pendientes.length === 0 ? (
                <p>No quedan ingredientes pendientes.</p>
              ) : (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {pendientes.map(mostrarIngrediente)}
                </ul>
              )}
            </section>

            {/* COMPRADOS */}
            <section style={tarjeta}>
              <h3 style={{ color: '#047857' }}>
                ✓ Comprados ({comprados.length})
              </h3>

              {comprados.length === 0 ? (
                <p>Aún no has marcado ingredientes.</p>
              ) : (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {comprados.map(mostrarIngrediente)}
                </ul>
              )}
            </section>

            {/* RESUMEN DE COSTOS */}
            <section style={tarjeta}>
              <h3>Resumen de costos</h3>

              <p style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <span>Subtotal conocido</span>
                <strong>
                  {cargandoPrecios
                    ? 'Calculando...'
                    : soles(subtotal)}
                </strong>
              </p>

              <p style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <span>Importe pendiente conocido</span>
                <strong>
                  {cargandoPrecios
                    ? 'Calculando...'
                    : soles(importePendiente)}
                </strong>
              </p>

              {!cargandoPrecios && sinPrecio.length > 0 && (
                <p style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 13,
                }}>
                  Hay {sinPrecio.length} ingredientes
                  sin precio compatible en este mercado.
                  El subtotal es parcial.
                </p>
              )}
            </section>

            {/* REGISTRAR COMPRA */}
            {completado && !lista.registrada && (
              <form
                onSubmit={guardarCompra}
                style={{
                  ...tarjeta,
                  background: '#ecfdf5',
                  display: 'grid',
                  gap: 15,
                }}
              >
                <h3>Registrar compra en Mi Ahorro</h3>

                <p>
                  Mercado:
                  {' '}<strong>
                    {mercadoSeleccionado?.nombre ||
                      'No seleccionado'}
                  </strong>
                </p>

                <label>
                  Gasto real confirmado (S/)

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={gastoConfirmado}
                    onChange={e =>
                      setGastoConfirmado(e.target.value)
                    }
                    placeholder="Ej. 12.50"
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: 12,
                      marginTop: 8,
                      borderRadius: 10,
                    }}
                  />
                </label>

                <label>
                  Costo de otra alternativa (S/) — opcional

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={costoReferencia}
                    onChange={e =>
                      setCostoReferencia(e.target.value)
                    }
                    placeholder="Ej. 18.00"
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: 12,
                      marginTop: 8,
                      borderRadius: 10,
                    }}
                  />
                </label>

                <small style={{ color: '#64748b' }}>
                  El subtotal es referencial.
                  Ingresa cuánto pagaste realmente.
                </small>

                <button
                  type="submit"
                  disabled={registrando}
                  style={{
                    ...boton,
                    background: '#059669',
                    color: '#fff',
                  }}
                >
                  {registrando
                    ? 'Guardando...'
                    : 'Confirmar y guardar gasto'}
                </button>
              </form>
            )}

            {/* COMPRA REGISTRADA */}
            {lista.registrada && (
              <section style={{
                ...tarjeta,
                background: '#dcfce7',
              }}>
                <strong style={{ color: '#166534' }}>
                  ✓ Compra registrada correctamente.
                </strong>

                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={onVerAhorro}
                    style={{
                      ...boton,
                      background: '#059669',
                      color: '#fff',
                    }}
                  >
                    Ver Mi Ahorro
                  </button>
                </div>
              </section>
            )}

            {error && (
              <p role="alert" style={{
                color: '#b91c1c',
                padding: 12,
                background: '#fee2e2',
                borderRadius: 10,
              }}>
                {error}
              </p>
            )}

            <div style={{
              display: 'grid',
              gap: 10,
            }}>
              <button
                type="button"
                onClick={descargarTexto}
                disabled={cargandoPrecios}
                style={{
                  ...boton,
                  color: '#fff',
                  background: '#1e293b',
                }}
              >
                Exportar lista a TXT
              </button>

              <button
                type="button"
                onClick={onVerRecetas}
                style={{
                  ...boton,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                }}
              >
                Crear otra lista
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
