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

  // Estados para la Despensa (Estilo Etiquetas)
  const [despensa, setDespensa] = useState([])
  const [nuevoIngrediente, setNuevoIngrediente] = useState('')

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

  // Cargar ingredientes únicos desde SQL
  useEffect(() => {
    if (usuario?.id) {
      BackendService.obtenerIngredientes(usuario.id)
        .then(data => {
          if (Array.isArray(data)) {
            const unicos = [...new Set(data.map(i => i.trim().toLowerCase()))].filter(Boolean)
            const presentables = unicos.map(i => i.charAt(0).toUpperCase() + i.slice(1))
            setDespensa(presentables)
            localStorage.setItem('platomatch.despensa', presentables.join(', '))
          }
        })
        .catch(() => {})
    }
  }, [usuario?.id])

  // Lógica para agregar ingredientes individuales
  const agregarIngrediente = async (e) => {
    if (e) e.preventDefault()
    const ingText = nuevoIngrediente.trim().toLowerCase()
    
    if (!ingText) return
    
    const capitalizado = ingText.charAt(0).toUpperCase() + ingText.slice(1)
    
    // Evitar que el usuario agregue uno que ya está en la lista visible
    if (despensa.some(item => item.toLowerCase() === ingText)) {
        setNuevoIngrediente('')
        return
    }

    const nuevaDespensa = [...despensa, capitalizado]
    setDespensa(nuevaDespensa)
    setNuevoIngrediente('')
    localStorage.setItem('platomatch.despensa', nuevaDespensa.join(', '))

    // Enviar nueva lista al backend
    if (usuario?.id) {
        try {
            await BackendService.registrarIngredientes(usuario.id, nuevaDespensa)
        } catch(err) { console.error("Error al guardar:", err) }
    }
  }

  // Lógica para quitar ingredientes
  const quitarIngrediente = async (ingParaBorrar) => {
    const nuevaDespensa = despensa.filter(i => i !== ingParaBorrar)
    setDespensa(nuevaDespensa)
    localStorage.setItem('platomatch.despensa', nuevaDespensa.join(', '))

    if (usuario?.id) {
        try {
            await BackendService.registrarIngredientes(usuario.id, nuevaDespensa)
        } catch(err) { console.error("Error al eliminar:", err) }
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

              {/* HU-05: DESPENSA EN ESTILO ETIQUETAS */}
              <section className="guardados" style={{ marginTop: '20px' }}>
                <div className="seccion__cabecera">
                  <h2>
                    <Icon name="info" size={18} />
                    Tu Despensa
                  </h2>
                </div>
                
                <div style={{ padding: '16px', background: '#fff', borderRadius: '16px', border: '1px solid #eaeaea', marginTop: '12px' }}>
                  <form onSubmit={agregarIngrediente} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Ej: Cebolla china..." 
                      value={nuevoIngrediente}
                      onChange={(e) => setNuevoIngrediente(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcdcdc', fontSize: '14px', outline: 'none' }}
                    />
                    <button type="submit" disabled={!nuevoIngrediente.trim()} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 16px', fontWeight: 'bold', cursor: nuevoIngrediente.trim() ? 'pointer' : 'not-allowed', opacity: nuevoIngrediente.trim() ? 1 : 0.6 }}>
                      +
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {despensa.length > 0 ? (
                      despensa.map((ing, idx) => (
                        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#f1f5f9', color: '#334155', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
                          {ing}
                          <button onClick={() => quitarIngrediente(ing)} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer', display: 'flex' }} aria-label={`Quitar ${ing}`}>
                             ✕
                          </button>
                        </span>
                      ))
                    ) : (
                      <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', width: '100%', textAlign: 'center' }}>Tu despensa está vacía. ¡Agrega lo que tienes!</p>
                    )}
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