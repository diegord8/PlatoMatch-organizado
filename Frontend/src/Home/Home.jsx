import { useEffect, useState } from 'react'
import Icon from '../Head/Icon.jsx'
import Barra from '../Head/Barra.jsx'
import FotoPlato from '../Head/FotoPlato.jsx'
import { soles } from '../data/platos.js'
import { BackendService } from '../services/backendService.js'
import './Home.css'

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return '¡Buenos días!'
  if (h < 19) return '¡Buenas tardes!'
  return '¡Buenas noches!'
}

function TarjetaPlato({ plato, guardado, onToggle, onVer }) {
  return (
    <article className="plato" onClick={() => onVer(plato.id)}>
      <div className="plato__media">
        <FotoPlato plato={plato} />
        {plato.insignia && <span className="plato__insignia">{plato.insignia}</span>}
        <button
          type="button"
          className={`plato__guardar ${guardado ? 'plato__guardar--activo' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(plato.id)
          }}
          aria-pressed={guardado}
          aria-label={guardado ? 'Quitar de guardados' : 'Guardar plato'}
        >
          <Icon name="bookmark" size={18} fill={guardado ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="plato__cuerpo">
        <h3 className="plato__nombre">
          <button
            type="button"
            className="plato__enlace"
            onClick={(e) => {
              e.stopPropagation()
              onVer(plato.id)
            }}
          >
            {plato.nombre}
          </button>
        </h3>
        <p className="plato__descripcion">{plato.descripcion}</p>
        <div className="plato__datos">
          <span className="plato__precio">{soles(plato.precio)}</span>
          <span className="plato__kcal">{plato.kcal} kcal</span>
        </div>
        <ul className="plato__etiquetas">
          {(plato.etiquetas || []).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default function Home({
  usuario,
  recetas = [],
  mercados = [],
  tab,
  onTab,
  guardados = [],
  onToggleGuardado,
  onVerPlato,
  presupuestoBase = '',
}) {
  const [listaPlatos, setListaPlatos] = useState([])
  const [cargando, setCargando] = useState(true)

  
const [despensa, setDespensa] = useState([])
const [nuevoIngrediente, setNuevoIngrediente] = useState('')
const [cantidadNueva, setCantidadNueva] = useState('')
const [unidadNueva, setUnidadNueva] = useState('g')
const [editando, setEditando] = useState(null)
const [guardandoDespensa, setGuardandoDespensa] = useState(false)
const [errorDespensa, setErrorDespensa] = useState('')


  useEffect(() => {
    if (recetas.length > 0) {
      const mapeados = recetas.map((item) => ({
        ...item,
        precio: item.precio ?? item.costoEstimado ?? 0,
        kcal: item.kcal ?? item.calorias ?? 0,
        imagen: item.imagen ?? item.imagenUrl ?? '',
        etiquetas: item.etiquetas ?? [
          item.aptoAnemia ? 'Apto para Anemia' : null,
          item.aptoSinGluten ? 'Sin Gluten' : null,
          (item.precio ?? item.costoEstimado ?? 0) <= 12 ? 'Económico' : null,
        ].filter(Boolean),
        insignia: item.mensaje || (item.aptoAnemia ? 'Especial Anemia' : null),
      }))
      setListaPlatos(mapeados)
    }
    setCargando(false)
  }, [recetas])

  
// Normalizar nombres para evitar duplicados.
const normalizarNombre = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

// Obtener despensa desde SQL Server.
useEffect(() => {
  if (!usuario?.id) {
    setDespensa([])
    return
  }

  let activo = true

  BackendService.obtenerDespensaCantidades(usuario.id)
    .then((datos) => {
      if (activo) {
        setDespensa(Array.isArray(datos) ? datos : [])
      }
    })
    .catch((error) => {
      if (activo) setErrorDespensa(error.message)
    })

  return () => {
    activo = false
  }
}, [usuario?.id])

// Guardar en BD antes de actualizar la pantalla.
const persistirDespensa = async (nueva) => {
  if (!usuario?.id) {
    throw new Error('Debes iniciar sesión.')
  }

  setGuardandoDespensa(true)
  setErrorDespensa('')

  try {
    await BackendService.guardarDespensaCantidades(
      usuario.id,
      nueva
    )

    const actualizada =
      await BackendService.obtenerDespensaCantidades(
        usuario.id
      )

    setDespensa(actualizada || [])
    return true
  } catch (error) {
    setErrorDespensa(error.message)
    return false
  } finally {
    setGuardandoDespensa(false)
  }
}

// Crear o modificar un ingrediente.
const agregarIngrediente = async (e) => {
  e.preventDefault()

  const nombre = nuevoIngrediente.trim()
  const cantidad = Number(cantidadNueva)

  if (
    !nombre ||
    !cantidadNueva ||
    !Number.isFinite(cantidad) ||
    cantidad <= 0 ||
    cantidad > 100000
  ) {
    setErrorDespensa(
      'Indica ingrediente, cantidad y unidad válidos.'
    )
    return
  }

  const duplicado = despensa.some((item) =>
    normalizarNombre(item.nombreIngrediente) ===
      normalizarNombre(nombre) &&
    normalizarNombre(item.nombreIngrediente) !==
      normalizarNombre(editando)
  )

  if (duplicado) {
    setErrorDespensa(
      'Ese ingrediente ya existe. Usa Editar.'
    )
    return
  }

  const restantes = despensa.filter(
    (item) =>
      normalizarNombre(item.nombreIngrediente) !==
      normalizarNombre(editando)
  )

  const nueva = [
    ...restantes,
    {
      nombreIngrediente: nombre,
      cantidad,
      unidadMedida: unidadNueva,
    },
  ]

  const guardado = await persistirDespensa(nueva)

  if (guardado) {
    setNuevoIngrediente('')
    setCantidadNueva('')
    setUnidadNueva('g')
    setEditando(null)
  }
}

// Cargar un ingrediente en el formulario.
const editarIngrediente = (item) => {
  setEditando(item.nombreIngrediente)
  setNuevoIngrediente(item.nombreIngrediente)
  setCantidadNueva(
    item.cantidad == null
      ? ''
      : String(item.cantidad)
  )
  setUnidadNueva(item.unidadMedida || 'g')
  setErrorDespensa('')
}

// Quitar un ingrediente.
const quitarIngrediente = async (nombre) => {
  const nueva = despensa.filter(
    (item) =>
      normalizarNombre(item.nombreIngrediente) !==
      normalizarNombre(nombre)
  )

  const guardado = await persistirDespensa(nueva)

  if (
    guardado &&
    normalizarNombre(editando) === normalizarNombre(nombre)
  ) {
    setEditando(null)
    setNuevoIngrediente('')
    setCantidadNueva('')
  }
}


  const platosGuardados = listaPlatos.filter((p) => guardados.includes(p.id))
  const porcentaje = presupuestoBase ? 100 : 0

  return (
    <div className="home">
      <Barra activa={tab} onNavegar={onTab} />

      <section className="home__hero">
        <div className="home__hero-inner">
          <div>
            <p className="home__saludo">{saludo()}</p>
            <h1 className="home__nombre">{usuario?.nombre ?? 'Viajero Saludable'}</h1>
          </div>
          <dl className="home__stats">
            <div>
              <dt>{guardados.length}</dt>
              <dd>Guardados</dd>
            </div>
            <div>
              <dt>{listaPlatos.length}</dt>
              <dd>Platos disponibles</dd>
            </div>
          </dl>
        </div>
      </section>

      <main className="home__main">
        {tab === 'inicio' && (
          <div className="home__grid">
            <div className="home__lateral">
              
              <section className="presupuesto">
                <div>
                  <p className="presupuesto__etiqueta">Tu presupuesto base</p>
                  <p className="presupuesto__monto">
                    {presupuestoBase ? soles(Number(presupuestoBase)) : 'Sin configurar'}
                  </p>
                </div>
                <span className="presupuesto__icono" aria-hidden="true" />
                <div className="presupuesto__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje} aria-label="Tu presupuesto base">
                  <span style={{ width: `${porcentaje}%` }} />
                </div>
                <p className="presupuesto__nota">Presupuesto total por receta · editable en Perfil</p>
              </section>

              <button type="button" className="planear" onClick={() => onTab('buscar')}>
                <span className="planear__icono">
                  <Icon name="chef" size={26} />
                </span>
                <span className="planear__texto">
                  <small>¿Qué comemos hoy?</small>
                  <strong>Planear mi comida</strong>
                  <small>Encuentra platos saludables</small>
                </span>
                <span className="planear__flecha">
                  <Icon name="arrow" size={20} />
                </span>
              </button>

              
{/* DESPENSA INTELIGENTE CON CANTIDADES */}
<section className="guardados" style={{ marginTop: 20 }}>
  <div className="seccion__cabecera">
    <h2>
      <Icon name="info" size={18} />
      Tu Despensa
    </h2>
  </div>

  <div style={{
    padding: 16,
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #eaeaea',
    marginTop: 12,
  }}>
    <p style={{
      color: '#64748b',
      fontSize: 13,
    }}>
      Registra cuánto tienes de cada ingrediente
      para comprar solamente lo que te falta.
    </p>

    <form
      onSubmit={agregarIngrediente}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
      }}
    >
      <input
        type="text"
        placeholder="Ej: Arroz"
        value={nuevoIngrediente}
        onChange={(e) =>
          setNuevoIngrediente(e.target.value)
        }
        required
        style={{
          flex: '2 1 150px',
          padding: 10,
          border: '1px solid #cbd5e1',
          borderRadius: 10,
          minWidth: 0,
        }}
      />

      <input
        type="number"
        min="0.001"
        step="0.001"
        placeholder="Cantidad"
        value={cantidadNueva}
        onChange={(e) =>
          setCantidadNueva(e.target.value)
        }
        required
        style={{
          flex: '1 1 80px',
          width: 90,
          minWidth: 0,
          padding: 10,
          border: '1px solid #cbd5e1',
          borderRadius: 10,
        }}
      />

      <select
        value={unidadNueva}
        onChange={(e) =>
          setUnidadNueva(e.target.value)
        }
        style={{
          flex: '1 1 95px',
          padding: 10,
          border: '1px solid #cbd5e1',
          borderRadius: 10,
        }}
      >
        {[
          'g', 'kg', 'ml', 'l', 'unidad',
          'diente', 'taza', 'cucharada',
          'cucharadita', 'atado',
        ].map((unidad) => (
          <option key={unidad} value={unidad}>
            {unidad}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={guardandoDespensa}
        style={{
          padding: '10px 16px',
          background: '#16a34a',
          color: '#fff',
          border: 0,
          borderRadius: 10,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {guardandoDespensa
          ? 'Guardando...'
          : editando
            ? 'Actualizar'
            : 'Agregar'}
      </button>

      {editando && (
        <button
          type="button"
          onClick={() => {
            setEditando(null)
            setNuevoIngrediente('')
            setCantidadNueva('')
            setUnidadNueva('g')
          }}
        >
          Cancelar
        </button>
      )}
    </form>

    {errorDespensa && (
      <p role="alert" style={{
        color: '#b91c1c',
        fontSize: 13,
      }}>
        {errorDespensa}
      </p>
    )}

    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
    }}>
      {despensa.length === 0 && (
        <p style={{ color: '#94a3b8' }}>
          Tu despensa está vacía.
        </p>
      )}

      {despensa.map((item) => (
        <div
          key={item.nombreIngrediente}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f1f5f9',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 13,
            flexWrap: 'wrap',
          }}
        >
          <span>
            <strong>{item.nombreIngrediente}</strong>
            {' — '}
            {item.cantidad == null
              ? 'Cantidad por definir'
              : `${item.cantidad} ${item.unidadMedida}`}
          </span>

          <button
            type="button"
            disabled={guardandoDespensa}
            onClick={() => editarIngrediente(item)}
            style={{
              border: 0,
              background: 'transparent',
              color: '#047857',
              cursor: 'pointer',
            }}
          >
            Editar
          </button>

          <button
            type="button"
            disabled={guardandoDespensa}
            onClick={() =>
              quitarIngrediente(item.nombreIngrediente)
            }
            aria-label={`Quitar ${item.nombreIngrediente}`}
            style={{
              border: 0,
              background: 'transparent',
              color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
</section>


              {/* MERCADOS */}
              <section className="guardados" style={{ marginTop: '20px' }}>
                <div className="seccion__cabecera">
                  <h2>
                    <Icon name="shoppingBag" size={18} />
                    Mercados y Precios
                  </h2>
                  <button type="button" className="enlace" onClick={() => onTab('mercados')}>
                    Ver todos <Icon name="chevron" size={14} />
                  </button>
                </div>
                {mercados.length === 0 ? (
                  <div className="vacio">
                    <p className="vacio__titulo">Sin mercados registrados</p>
                  </div>
                ) : (
                  <ul className="mini">
                    {mercados.slice(0, 3).map((m) => (
                      <li key={m.id}>
                        <button type="button" className="mini__ver" onClick={() => onTab('mercados')}>
                          <span>{m.nombre}</span>
                          <small>{m.distrito || 'Lima'} · {(m.precios?.length ?? 0)} precios</small>
                        </button>
                        <span style={{ color: '#e6a523', fontSize: '13px', fontWeight: 'bold' }}>
                          ★ 4.5
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="sugerencias">
              <div className="seccion__cabecera">
                <h2>Sugerencias para ti</h2>
              </div>
              {cargando ? (
                <p style={{ padding: '24px', color: '#666' }}>Cargando recomendaciones...</p>
              ) : (
                <div className="sugerencias__grid">
                  {listaPlatos.map((p) => (
                    <TarjetaPlato
                      key={p.id}
                      plato={p}
                      guardado={guardados.includes(p.id)}
                      onToggle={onToggleGuardado}
                      onVer={onVerPlato}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'buscar' && (
          <section className="home__aparte">
            <h2>Buscar</h2>
          </section>
        )}

        {tab === 'guardados' && (
          <section className="sugerencias">
            <div className="seccion__cabecera">
              <h2>Platos guardados</h2>
            </div>
            {platosGuardados.length === 0 ? (
              <div className="vacio vacio--pagina">
                <span className="vacio__icono">
                  <Icon name="bookmark" size={22} />
                </span>
                <p className="vacio__titulo">Aún no tienes platos guardados</p>
                <p>Guarda tus recetas favoritas desde Inicio.</p>
              </div>
            ) : (
              <div className="guardados__grid">
                {platosGuardados.map((p) => (
                  <article key={p.id} className="guardado-card">
                    <div className="guardado-card__contenido">
                      <FotoPlato plato={p} className="guardado-card__foto" />
                      <div className="guardado-card__datos">
                        <h3>{p.nombre}</h3>
                        <div className="guardado-card__meta">
                          <span className="guardado-card__precio">{soles(p.precio)}</span>
                          <span className="guardado-card__kcal"><Icon name="flame" size={14} />{p.kcal} kcal</span>
                        </div>
                      </div>
                    </div>
                    <div className="guardado-card__acciones">
                      <button type="button" className="guardado-card__ver" onClick={() => onVerPlato(p.id)}>
                        Ver receta <Icon name="chevron" size={16} />
                      </button>
                      <button type="button" className="guardado-card__eliminar" onClick={() => onToggleGuardado(p.id)}>
                        <Icon name="trash" size={15} /> Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}