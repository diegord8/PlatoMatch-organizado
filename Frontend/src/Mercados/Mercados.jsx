
import { useEffect, useMemo, useState } from 'react'
import Barra from '../Head/Barra.jsx'
import Icon from '../Head/Icon.jsx'
import { soles } from '../data/platos.js'
import { BackendService } from '../services/backendService.js'

const INFO_EXTRA = {
  'Mercado Central': {
    direccion: 'Av. Abancay s/n',
    horario: 'Lunes a Domingo: 6:00 a.m. - 6:00 p.m.',
    desc: 'Mercado tradicional con una amplia variedad de productos frescos, abarrotes y precios competitivos para el hogar.',
  },
  'Mercado de Surquillo': {
    direccion: 'Paseo de la República s/n',
    horario: 'Lunes a Domingo: 7:00 a.m. - 5:00 p.m.',
    desc: 'Mercado con una gran oferta de ingredientes frescos, carnes y especias.',
  },
  'Mercado Santa Anita': {
    direccion: 'Av. Metropolitana',
    horario: 'Lunes a Sábado: 4:00 a.m. - 4:00 p.m.',
    desc: 'Centro de abastos mayorista y minorista con productos variados.',
  },
  'Mercado Productores': {
    direccion: 'Carretera Central Km 2.5',
    horario: 'Lunes a Domingo: 5:00 a.m. - 3:00 p.m.',
    desc: 'Mercado orientado a compras al por mayor y productos para el hogar.',
  },
  'Mercado San José': {
    direccion: 'Av. República Dominicana',
    horario: 'Lunes a Domingo: 7:00 a.m. - 6:00 p.m.',
    desc: 'Mercado con secciones de productos frescos, pescados y mariscos.',
  },
}

const boton = {
  border: 'none',
  borderRadius: 10,
  padding: '11px 15px',
  fontWeight: 700,
  cursor: 'pointer',
}

const campo = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 9,
  background: '#fff',
}

const celda = {
  padding: '14px 12px',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
}

const normalizar = (valor) => {
  const texto = String(valor ?? '')
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
    tomates: 'tomate',
    betarragas: 'betarraga',
  }

  return equivalencias[texto] || texto
}

const convertirUnidad = (valor) => {
  const unidad = normalizar(valor)

  const tabla = {
    kg: ['peso', 1000],
    kilogramo: ['peso', 1000],
    kilogramos: ['peso', 1000],
    kilo: ['peso', 1000],
    kilos: ['peso', 1000],
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
    atado: ['atado', 1],
    atados: ['atado', 1],
  }

  return tabla[unidad] || null
}

function centimos(valor) {
  const numero = Number(valor)

  return Number.isFinite(numero)
    ? Math.round((numero + Number.EPSILON) * 100)
    : 0
}

function preciosVigentes(registros) {
  const ultimos = new Map()

  const ordenados = [...registros].sort((a, b) => {
    const diferenciaFecha =
      Date.parse(b.fechaRegistro || 0) -
      Date.parse(a.fechaRegistro || 0)

    return (
      Number.isFinite(diferenciaFecha)
        ? diferenciaFecha
        : 0
    ) || Number(b.id || 0) - Number(a.id || 0)
  })

  for (const precio of ordenados) {
    const clave = [
      normalizar(precio.productoNombre),
      Number(precio.cantidadPrecio),
      normalizar(precio.unidadPrecio),
    ].join('|')

    if (!ultimos.has(clave)) {
      ultimos.set(clave, precio)
    }
  }

  return [...ultimos.values()]
}

function calcularIngrediente(detalle, registros) {
  const mismoProducto = registros.filter(
    precio =>
      normalizar(precio.productoNombre) ===
      normalizar(detalle.ingrediente)
  )

  const unidadNecesaria = convertirUnidad(
    detalle.unidadMedida
  )

  const cantidadNecesaria = Number(
    detalle.cantidadNecesaria
  )

  const opciones = []

  for (const precio of mismoProducto) {
    const unidadPrecio = convertirUnidad(
      precio.unidadPrecio
    )

    const monto = Number(precio.precio)

    const cantidadPresentacion = Number(
      precio.cantidadPrecio
    )

    if (
      !unidadNecesaria ||
      !unidadPrecio ||
      unidadNecesaria[0] !== unidadPrecio[0] ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      !Number.isFinite(cantidadPresentacion) ||
      cantidadPresentacion <= 0 ||
      !Number.isFinite(cantidadNecesaria) ||
      cantidadNecesaria <= 0
    ) {
      continue
    }

    const importe =
      monto *
      (cantidadNecesaria * unidadNecesaria[1]) /
      (cantidadPresentacion * unidadPrecio[1])

    if (Number.isFinite(importe)) {
      opciones.push(centimos(importe))
    }
  }

  if (opciones.length) {
    const importeCentimos = Math.min(...opciones)

    return {
      ...detalle,
      costoIngrediente: importeCentimos / 100,
      precioDisponible: true,
      estado: 'disponible',
      presentacion: null,
    }
  }

  const presentacion = mismoProducto[0] || null

  return {
    ...detalle,
    costoIngrediente: null,
    precioDisponible: false,
    estado: presentacion ? 'unidad' : 'sinprecio',
    presentacion,
  }
}

function sumarCentimos(opcion) {
  return opcion.detalleIngredientes.reduce(
    (total, i) =>
      total +
      (
        i.precioDisponible
          ? centimos(i.costoIngrediente)
          : 0
      ),
    0
  )
}

function completo(opcion) {
  return (
    opcion.detalleIngredientes.length > 0 &&
    opcion.detalleIngredientes.every(
      i => i.precioDisponible
    )
  )
}

export default function Mercados({
  mercados = [],
  calificacionesMercados = {},
  estadisticasMercados = {},
  onCalificarMercado,
  platosReales = [],
  onNavegar,
}) {
  const [vista, setVista] = useState('lista')
  const [mercadoElegido, setMercadoElegido] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('calificacion')

  const [preciosDetalle, setPreciosDetalle] = useState([])
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false)

  const [errorDetalle, setErrorDetalle] = useState('')

  const [recetaId, setRecetaId] = useState('')
  const [personas, setPersonas] = useState(1)

  const [comparativa, setComparativa] = useState(null)

  const [preciosPorMercado, setPreciosPorMercado] =
    useState({})

  const [erroresMercado, setErroresMercado] =
    useState({})

  const [cargando, setCargando] = useState(false)

  const [errorComparativa, setErrorComparativa] =
    useState('')

  const [revision, setRevision] = useState(0)

  const idsMercados = mercados.map(m => m.id).join(',')

  useEffect(() => {
    const existe = platosReales.some(
      plato => String(plato.id) === String(recetaId)
    )

    if (!existe) {
      setRecetaId(
        platosReales.length
          ? String(platosReales[0].id)
          : ''
      )
    }
  }, [platosReales, recetaId])

  useEffect(() => {
    if (
      vista !== 'detalle' ||
      !mercadoElegido?.id
    ) {
      return undefined
    }

    let cancelado = false

    setCargandoDetalle(true)
    setErrorDetalle('')

    BackendService.obtenerPreciosPorMercado(
      mercadoElegido.id
    )
      .then(datos => {
        if (!cancelado) {
          setPreciosDetalle(
            Array.isArray(datos) ? datos : []
          )
        }
      })
      .catch(err => {
        if (!cancelado) {
          setErrorDetalle(err.message)
          setPreciosDetalle([])
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoDetalle(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [vista, mercadoElegido?.id, revision])

  useEffect(() => {
    if (
      vista !== 'comparacion' ||
      !recetaId
    ) {
      return undefined
    }

    let cancelado = false

    setCargando(true)
    setErrorComparativa('')
    setComparativa(null)
    setPreciosPorMercado({})
    setErroresMercado({})

    async function cargar() {
      try {
        const comparacion =
          await BackendService.compararMercados(
            recetaId,
            personas
          )

        const resultados = await Promise.allSettled(
          mercados.map(
            m => BackendService.obtenerPreciosPorMercado(
              m.id
            )
          )
        )

        if (cancelado) return

        const precios = {}
        const errores = {}

        mercados.forEach((mercado, indice) => {
          const resultado = resultados[indice]

          if (
            resultado.status === 'fulfilled' &&
            Array.isArray(resultado.value)
          ) {
            precios[String(mercado.id)] =
              preciosVigentes(resultado.value)
          } else {
            errores[String(mercado.id)] =
              resultado.status === 'rejected'
                ? resultado.reason?.message ||
                  'No se pudo consultar'
                : 'Respuesta inválida del servidor'
          }
        })

        setComparativa(comparacion)
        setPreciosPorMercado(precios)
        setErroresMercado(errores)
      } catch (err) {
        if (!cancelado) {
          setErrorComparativa(
            err.message || 'Error de conexión'
          )
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    cargar()

    return () => {
      cancelado = true
    }
  }, [
    vista,
    recetaId,
    personas,
    idsMercados,
    revision,
  ])

  const opciones = useMemo(() => {
    const resultados =
      comparativa?.comparativaPorMercado || []

    return resultados.map(opcion => {
      const registros =
        preciosPorMercado[String(opcion.mercadoId)]

      const error =
        erroresMercado[String(opcion.mercadoId)]

      if (!Array.isArray(registros) || error) {
        return {
          ...opcion,
          error: error || 'No hay datos del mercado',

          detalleIngredientes:
            (opcion.detalleIngredientes || []).map(
              i => ({
                ...i,
                precioDisponible: false,
                costoIngrediente: null,
                estado: 'error',
              })
            ),
        }
      }

      return {
        ...opcion,
        error: null,

        detalleIngredientes:
          (opcion.detalleIngredientes || []).map(
            i => calcularIngrediente(i, registros)
          ),
      }
    })
  }, [
    comparativa,
    preciosPorMercado,
    erroresMercado,
  ])

  const mejorTotal = opciones
    .filter(o => !o.error && completo(o))
    .map(sumarCentimos)
    .reduce(
      (minimo, valor) =>
        minimo === null
          ? valor
          : Math.min(minimo, valor),
      null
    )

  const esMejor = opcion =>
    !opcion.error &&
    completo(opcion) &&
    mejorTotal !== null &&
    sumarCentimos(opcion) === mejorTotal

  const ingredientes =
    opciones[0]?.detalleIngredientes || []

  const mercadosFiltrados = [...mercados]
    .filter(m =>
      normalizar(m.nombre).includes(
        normalizar(busqueda)
      )
    )
    .sort((a, b) => {
      if (orden === 'nombre') {
        return a.nombre.localeCompare(
          b.nombre,
          'es'
        )
      }

      if (orden === 'distrito') {
        return (a.distrito || '').localeCompare(
          b.distrito || '',
          'es'
        )
      }

      return Number(
        estadisticasMercados[b.nombre]?.promedio || 0
      ) - Number(
        estadisticasMercados[a.nombre]?.promedio || 0
      )
    })

  const calificacion = nombre => {
    const estadistica =
      estadisticasMercados[nombre]

    if (
      !estadistica?.cantidad ||
      estadistica.promedio == null
    ) {
      return 'Sin calificaciones'
    }

    return `★ ${Number(
      estadistica.promedio
    ).toFixed(1)}`
  }

  const titulo =
    vista === 'lista'
      ? 'Mercados'
      : vista === 'detalle'
        ? 'Detalle de mercado'
        : 'Comparación de precios (HU-12)'

  const volver = () => {
    if (vista === 'comparacion') {
      setVista('detalle')
    } else if (vista === 'detalle') {
      setVista('lista')
    } else {
      onNavegar?.('inicio')
    }
  }

  return (
    <div
      className="home"
      style={{
        minHeight: '100vh',
        background: '#f5f9f7',
      }}
    >
      <Barra
        activa="mercados"
        onNavegar={onNavegar}
      />

      <header
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={volver}
          style={{
            ...boton,
            background: '#f1f5f9',
            color: '#0f172a',
          }}
        >
          <Icon name="back" size={20} />
        </button>

        <h1
          style={{
            fontSize: 20,
            margin: 0,
            flex: 1,
          }}
        >
          {titulo}
        </h1>

        {vista !== 'lista' && (
          <button
            type="button"
            onClick={() =>
              setRevision(v => v + 1)
            }
            style={{
              ...boton,
              color: '#065f46',
              background: '#d1fae5',
            }}
          >
            Actualizar precios
          </button>
        )}
      </header>

      {vista === 'lista' && (
        <main
          style={{
            maxWidth: 850,
            margin: '24px auto',
            padding: '0 18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <input
              style={{
                ...campo,
                flex: 1,
              }}
              value={busqueda}
              onChange={e =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar mercado"
            />

            <select
              style={{
                ...campo,
                width: 190,
              }}
              value={orden}
              onChange={e =>
                setOrden(e.target.value)
              }
            >
              <option value="calificacion">
                Mejor puntuados
              </option>
              <option value="nombre">
                Nombre (A-Z)
              </option>
              <option value="distrito">
                Distrito (A-Z)
              </option>
            </select>
          </div>

          <h2 style={{ fontSize: 18 }}>
            Mercados disponibles ({mercadosFiltrados.length})
          </h2>

          {mercadosFiltrados.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMercadoElegido(m)
                setVista('detalle')
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                padding: 20,
                marginBottom: 12,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 28 }}>
                🏪
              </span>

              <span style={{ flex: 1 }}>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 17,
                  }}
                >
                  {m.nombre}
                </strong>

                <span
                  style={{
                    display: 'block',
                    color: '#b7791f',
                    marginTop: 5,
                  }}
                >
                  {calificacion(m.nombre)}
                  {' '}(
                  {estadisticasMercados[m.nombre]
                    ?.cantidad || 0}
                  {' '}calificaciones)
                </span>

                <small style={{ color: '#64748b' }}>
                  {m.distrito || 'Distrito no indicado'}
                </small>
              </span>

              <Icon name="chevron" size={20} />
            </button>
          ))}
        </main>
      )}

      {vista === 'detalle' && mercadoElegido && (
        <main
          style={{
            maxWidth: 850,
            margin: '24px auto',
            padding: '0 18px',
          }}
        >
          <section
            style={{
              background: '#fff',
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#176f4b',
                padding: 24,
                textAlign: 'center',
                color: '#fff',
              }}
            >
              <h2 style={{ margin: 0 }}>
                {mercadoElegido.nombre}
              </h2>
            </div>

            <div style={{ padding: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 15,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2>{mercadoElegido.nombre}</h2>

                  <p style={{ color: '#b7791f' }}>
                    {calificacion(mercadoElegido.nombre)}
                    {' '}(
                    {estadisticasMercados[
                      mercadoElegido.nombre
                    ]?.cantidad || 0}
                    {' '}calificaciones)
                  </p>

                  <p>
                    📍{' '}
                    {INFO_EXTRA[mercadoElegido.nombre]
                      ?.direccion ||
                      'Dirección no disponible'}
                    ,{' '}
                    {mercadoElegido.distrito || 'Lima'}
                  </p>

                  <p>
                    🕒{' '}
                    {INFO_EXTRA[mercadoElegido.nombre]
                      ?.horario ||
                      'Horario no disponible'}
                  </p>
                </div>

                {onCalificarMercado && (
                  <div>
                    <small>
                      Tu calificación:
                    </small>

                    <div>
                      {[1, 2, 3, 4, 5].map(estrella => (
                        <button
                          key={estrella}
                          type="button"
                          style={{
                            background: 'transparent',
                            border: 0,
                            fontSize: 25,
                            color:
                              estrella <= (
                                calificacionesMercados[
                                  mercadoElegido.nombre
                                ] || 0
                              )
                                ? '#e6a523'
                                : '#cbd5e1',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            onCalificarMercado(
                              mercadoElegido.nombre,
                              estrella
                            )
                          }
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 12,
                  padding: 16,
                  margin: '20px 0',
                }}
              >
                <h3>Sobre el mercado</h3>

                <p>
                  {INFO_EXTRA[mercadoElegido.nombre]
                    ?.desc ||
                    'Mercado registrado en PlatoMatch.'}
                </p>

                <p>
                  🛍️ Variedad　♨️ Accesibles　💧 Frescos　🛡️ Seguros
                </p>
              </div>

              <h3>
                Precios registrados en SQL Server
              </h3>

              {cargandoDetalle ? (
                <p>Consultando precios...</p>
              ) : errorDetalle ? (
                <p
                  role="alert"
                  style={{ color: '#b91c1c' }}
                >
                  {errorDetalle}
                </p>
              ) : preciosDetalle.length === 0 ? (
                <p>No hay precios registrados.</p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gap: 9,
                  }}
                >
                  {preciosDetalle.map((p, i) => (
                    <li
                      key={p.id || i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        background: '#f5f9f7',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <span>
                        <strong>
                          {p.productoNombre}
                        </strong>

                        <small
                          style={{
                            display: 'block',
                            color: '#64748b',
                          }}
                        >
                          {p.cantidadPrecio}
                          {' '}
                          {p.unidadPrecio}
                        </small>
                      </span>

                      <strong
                        style={{ color: '#059669' }}
                      >
                        {soles(Number(p.precio))}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() =>
                  setVista('comparacion')
                }
                style={{
                  ...boton,
                  width: '100%',
                  background: '#059669',
                  color: '#fff',
                  marginTop: 18,
                }}
              >
                Comparar precios de una receta
              </button>
            </div>
          </section>
        </main>
      )}

      {vista === 'comparacion' && (
        <main
          style={{
            maxWidth: 1120,
            margin: '25px auto',
            padding: '0 18px',
          }}
        >
          <section
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'end',
              flexWrap: 'wrap',
              background: '#f8fafc',
              padding: 17,
              borderRadius: 14,
              marginBottom: 22,
            }}
          >
            <label
              style={{
                flex: 1,
                minWidth: 240,
                fontWeight: 700,
              }}
            >
              Receta a comparar:

              <select
                value={recetaId}
                onChange={e =>
                  setRecetaId(e.target.value)
                }
                style={{
                  ...campo,
                  display: 'block',
                  marginTop: 7,
                }}
              >
                {platosReales.map(plato => (
                  <option
                    value={String(plato.id)}
                    key={plato.id}
                  >
                    {plato.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                width: 115,
                fontWeight: 700,
              }}
            >
              Personas:

              <input
                type="number"
                min="1"
                max="30"
                step="1"
                value={personas}
                onChange={e =>
                  setPersonas(
                    Math.min(
                      30,
                      Math.max(
                        1,
                        Math.trunc(
                          Number(e.target.value) || 1
                        )
                      )
                    )
                  )
                }
                style={{
                  ...campo,
                  display: 'block',
                  marginTop: 7,
                }}
              />
            </label>
          </section>

          {cargando ? (
            <p>
              Consultando precios de SQL Server...
            </p>
          ) : errorComparativa ? (
            <p
              role="alert"
              style={{ color: '#b91c1c' }}
            >
              {errorComparativa}
            </p>
          ) : opciones.length === 0 ? (
            <p>
              No hay datos para comparar esta receta.
            </p>
          ) : (
            <>
              <div
                style={{
                  overflowX: 'auto',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: 900,
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#f8fafc',
                      }}
                    >
                      <th
                        style={{
                          ...celda,
                          minWidth: 170,
                        }}
                      >
                        Ingrediente
                      </th>

                      {opciones.map(op => (
                        <th
                          key={op.mercadoId}
                          style={{
                            ...celda,
                            minWidth: 145,
                            background: esMejor(op)
                              ? '#dcfce7'
                              : '#f8fafc',
                          }}
                        >
                          {op.mercadoNombre}

                          {esMejor(op) && (
                            <small
                              style={{
                                display: 'block',
                                color: '#15803d',
                              }}
                            >
                              ★ Más económico
                            </small>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {ingredientes.map(
                      (ingrediente, indice) => (
                        <tr
                          key={
                            `${ingrediente.ingrediente}-${indice}`
                          }
                        >
                          <td style={celda}>
                            <strong>
                              {ingrediente.ingrediente}
                            </strong>

                            <small
                              style={{
                                display: 'block',
                                color: '#64748b',
                                marginTop: 5,
                              }}
                            >
                              {ingrediente.cantidadNecesaria}
                              {' '}
                              {ingrediente.unidadMedida}
                            </small>
                          </td>

                          {opciones.map(op => {
                            const dato =
                              op.detalleIngredientes[indice]

                            const tiene =
                              dato?.precioDisponible

                            return (
                              <td
                                key={op.mercadoId}
                                style={celda}
                              >
                                {tiene ? (
                                  <strong
                                    style={{
                                      fontWeight: 500,
                                    }}
                                  >
                                    {soles(
                                      Number(
                                        dato.costoIngrediente
                                      )
                                    )}
                                  </strong>
                                ) : (
                                  <span
                                    style={{
                                      color: '#b45309',
                                      fontSize: 13,
                                    }}
                                  >
                                    {dato?.estado === 'unidad'
                                      ? 'Unidad incompatible'
                                      : dato?.estado === 'error'
                                        ? 'Error de consulta'
                                        : 'Sin precio'}

                                    {dato?.estado === 'unidad' &&
                                      dato.presentacion && (
                                      <small
                                        style={{
                                          display: 'block',
                                          marginTop: 5,
                                          color: '#64748b',
                                        }}
                                      >
                                        Registrado:{' '}
                                        {soles(
                                          Number(
                                            dato.presentacion.precio
                                          )
                                        )}
                                        {' '}por{' '}
                                        {dato.presentacion.cantidadPrecio}
                                        {' '}
                                        {dato.presentacion.unidadPrecio}
                                      </small>
                                    )}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    )}
                  </tbody>

                  <tfoot>
                    <tr
                      style={{
                        background: '#ecfdf5',
                      }}
                    >
                      <td
                        style={{
                          ...celda,
                          fontWeight: 700,
                        }}
                      >
                        Total estimado ({personas} pers.)
                      </td>

                      {opciones.map(op => {
                        const disponibles =
                          op.detalleIngredientes.filter(
                            i => i.precioDisponible
                          ).length

                        return (
                          <td
                            style={{
                              ...celda,
                              fontWeight: 700,
                            }}
                            key={op.mercadoId}
                          >
                            {disponibles === 0
                              ? 'Sin total'
                              : soles(
                                  sumarCentimos(op) / 100
                                )}

                            <small
                              style={{
                                display: 'block',
                                fontWeight: 400,
                                marginTop: 5,
                                color: completo(op)
                                  ? '#15803d'
                                  : '#b45309',
                              }}
                            >
                              {op.error
                                ? 'Error al consultar este mercado'
                                : completo(op)
                                  ? 'Total completo'
                                  : `Subtotal parcial (${disponibles}/${op.detalleIngredientes.length})`}
                            </small>
                          </td>
                        )
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {opciones.some(
                op => !completo(op)
              ) && (
                <p
                  style={{
                    padding: 15,
                    borderRadius: 10,
                    background: '#fef3c7',
                    color: '#92400e',
                    marginTop: 18,
                  }}
                >
                  Los ingredientes sin precio compatible
                  no se suman. Un subtotal parcial no
                  permite comparar cuál mercado tiene
                  el menor costo total.
                </p>
              )}
            </>
          )}
        </main>
      )}
    </div>
  )
}
