import { useEffect, useMemo, useState } from 'react'
import Barra from '../Head/Barra.jsx'
import FotoPlato from '../Head/FotoPlato.jsx'
import Icon from '../Head/Icon.jsx'
import { soles } from '../data/platos.js'
import { evaluarPlato, AVISO_SALUD, normalizar } from '../salud/filtros.js'
import { recomendarPlatos } from './recomendaciones.js'
import './Buscador.css'
import { BackendService } from '../services/backendService.js'

const MONTOS_RAPIDOS = [3, 5, 8, 10]

function PlatoResultado({ plato, personas, guardado, onVerPlato, onToggleGuardado }) {
  const etiquetas = plato.etiquetasDetalle ?? plato.etiquetas ?? []

  return (
    <article className="buscador__resultado">
      <div className="buscador__resultado-media">
        <FotoPlato plato={plato} className="buscador__foto" />
        {plato.insigniaDetalle && (
          <span className="buscador__insignia">{plato.insigniaDetalle}</span>
        )}
        <span className="buscador__precio">
          {soles(plato.precio)} <small>/ porción</small>
        </span>
        <button
          type="button"
          className={guardado ? 'buscador__guardar buscador__guardar--activo' : 'buscador__guardar'}
          onClick={() => onToggleGuardado(plato.id)}
          aria-label={guardado ? `Quitar ${plato.nombre} de guardados` : `Guardar ${plato.nombre}`}
          aria-pressed={guardado}
        >
          <Icon name="bookmark" size={17} fill={guardado ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="buscador__resultado-info">
        <button
          type="button"
          className="buscador__resultado-titulo"
          onClick={() => onVerPlato(plato.id, personas)}
        >
          {plato.nombre}
          <Icon name="chevron" size={17} />
        </button>
        <p>{plato.descripcion}</p>
        <div className="buscador__resultado-meta">
          <span><Icon name="flame" size={14} /> {plato.kcal} kcal</span>
          <span><Icon name="shoppingBag" size={14} /> {plato.ingredientes?.length ?? 0} ingredientes</span>
          {plato.insigniaDetalle && <span><Icon name="shield" size={14} /> Hierro</span>}
        </div>
        <div className="buscador__etiquetas">
          {etiquetas.map((etiqueta) => <span key={etiqueta}>{etiqueta}</span>)}
        </div>
        <p className="buscador__costo-total">
          {soles(plato.precio * personas)} total para {personas} {personas === 1 ? 'persona' : 'personas'}
        </p>
      </div>
    </article>
  )
}

export default function Buscador({
  usuario,
  platos = [],
  perfilSalud,
  preciosRegistrados = [],
  guardados,
  onToggleGuardado,
  onNavegar,
  onVerPlato,
  busqueda,
  presupuestoBase = '',
  opiniones = [],
  onActualizarBusqueda,
}) {
  const { presupuesto, ingredientes, personas, mercado } = busqueda
  const [usarBase, setUsarBase] = useState(true)
  const presupuestoEfectivo = presupuesto.trim() || (usarBase ? String(presupuestoBase || '') : '')
  const actualizarBusqueda = (cambios) =>
    onActualizarBusqueda((actual) => ({ ...actual, ...cambios }))
  const [busquedaEnviada, setBusquedaEnviada] = useState(
    () => Boolean(window.history.state?.buscadorResultados),
  )
  const [filtroActivo, setFiltroActivo] = useState('Todos')
  const [error, setError] = useState('')

  useEffect(() => {
    if (busquedaEnviada) window.scrollTo(0, 0)
  }, [busquedaEnviada])

  useEffect(() => {
    const restaurarVista = (event) => {
      setBusquedaEnviada(Boolean(event.state?.buscadorResultados))
    }
    window.addEventListener('popstate', restaurarVista)
    return () => window.removeEventListener('popstate', restaurarVista)
  }, [])


  const alergias = perfilSalud?.alergias ?? []
  const condiciones = perfilSalud?.condiciones ?? []
  const ingredientesDisponibles = useMemo(
    () =>
      ingredientes
        .split(',')
        .map((ingrediente) => normalizar(ingrediente.trim()))
        .filter(Boolean),
    [ingredientes],
  )

  const resultados = useMemo(() => {
    if (!busquedaEnviada) return []
    const limitePresupuesto = presupuestoEfectivo.trim() !== '' ? Number(presupuestoEfectivo) : Infinity;
    let filtrados = platos.filter((plato) => {
        
        const evaluacion = evaluarPlato(plato, perfilSalud);
        if (evaluacion.descartado) return false;

        const costoPorPersona = plato.precio ?? plato.costoEstimado ?? 0;
        const costoTotal = costoPorPersona * personas;
        if (costoTotal > limitePresupuesto) return false;

        if (ingredientesDisponibles.length > 0) {
            const ingPlatoTexto = (plato.ingredientes || []).map(i => i.nombre?.toLowerCase() || '').join(' ');
            const nombrePlato = plato.nombre?.toLowerCase() || '';
            
            const contieneAlMenosUno = ingredientesDisponibles.some(ingresado => 
                ingPlatoTexto.includes(ingresado) || nombrePlato.includes(ingresado)
            );

            if (!contieneAlMenosUno) return false; 
        }

        return true;
    });

    if (ingredientesDisponibles.length > 1) {
        filtrados.sort((a, b) => {
            const txtA = (a.ingredientes || []).map(i => i.nombre?.toLowerCase()).join(' ') + ' ' + a.nombre?.toLowerCase();
            const txtB = (b.ingredientes || []).map(i => i.nombre?.toLowerCase()).join(' ') + ' ' + b.nombre?.toLowerCase();
            
            const coincidenciasA = ingredientesDisponibles.filter(ing => txtA.includes(ing)).length;
            const coincidenciasB = ingredientesDisponibles.filter(ing => txtB.includes(ing)).length;
            
            return coincidenciasB - coincidenciasA;
        });
    }

    return filtrados;

  }, [busquedaEnviada, presupuestoEfectivo, personas, perfilSalud, ingredientesDisponibles, platos])

  const buscarPlatos = (event) => {
    event.preventDefault()
    const presupuestoIngresado = presupuestoEfectivo.trim() !== ''
    const presupuestoNumerico = Number(presupuestoEfectivo)
    if (
      presupuestoIngresado &&
      (!Number.isFinite(presupuestoNumerico) || presupuestoNumerico <= 0)
    ) {
      setError('Ingresa un presupuesto mayor que S/. 0 o deja el campo vacío.')
      setBusquedaEnviada(false)
      return
    }
    
    setError('')
    setFiltroActivo('Todos')
    window.history.pushState(
      { ...window.history.state, buscadorResultados: true },
      '',
    )
    setBusquedaEnviada(true)
  }

  const etiquetasDisponibles = [...new Set(resultados.flatMap((plato) =>
    plato.etiquetasDetalle ?? plato.etiquetas ?? [],
  ))]
  
  const resultadosFiltrados = filtroActivo === 'Todos'
    ? resultados
    : resultados.filter((plato) =>
      (plato.etiquetasDetalle ?? plato.etiquetas ?? []).includes(filtroActivo),
    )
    
  const tieneAnemia = condiciones.some((condicion) => normalizar(condicion) === 'anemia')
  
  const condicionesDesconocidas = [...(perfilSalud?.alergias ?? []),
    ...((perfilSalud?.condiciones ?? []).filter(c => normalizar(c) === 'celiaquia').map(() => 'Gluten'))]
    .filter((a) => platos.every(p => evaluarPlato(p, { alergias: [a] }).noEvaluables.length > 0))

  return (
    <div className="home buscador">
      <Barra activa="buscar" onNavegar={onNavegar} />

      {busquedaEnviada ? (
        <>
          <section className="buscador__resultados-hero">
            <div className="buscador__resultados-hero-inner">
              <button
                type="button"
                className="buscador__volver"
                onClick={() => setBusquedaEnviada(false)}
              >
                <Icon name="back" size={17} />
                Volver a búsqueda
              </button>
              <div className="buscador__resumen">
                <div>
                  <h1>Resultados para ti</h1>
                  <p>
                    {presupuestoEfectivo.trim()
                      ? <>Presupuesto total máximo: <strong>{soles(Number(presupuestoEfectivo))}</strong></>
                      : <>Sin límite de presupuesto</>}
                    {ingredientesDisponibles.length > 0 && (
                      <>
                        <span aria-hidden="true"> · </span>
                        Ingredientes: <strong>{ingredientes}</strong>
                      </>
                    )}
                    <span aria-hidden="true"> · </span>{resultados.length} platos encontrados
                    <span aria-hidden="true"> · </span>
                    <Icon name="users" size={15} /> {personas} {personas === 1 ? 'persona' : 'personas'}
                  </p>
                </div>
              </div>
              {etiquetasDisponibles.length > 0 && (
                <div className="buscador__chips" aria-label="Filtrar resultados por etiqueta">
                  {['Todos', ...etiquetasDisponibles].map((etiqueta) => (
                    <button
                      key={etiqueta}
                      type="button"
                      className={filtroActivo === etiqueta ? 'activo' : ''}
                      aria-pressed={filtroActivo === etiqueta}
                      onClick={() => setFiltroActivo(etiqueta)}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <main className="buscador__resultados-main">
            {tieneAnemia && (
              <aside className="buscador__aviso-salud">
                <Icon name="shield" size={20} />
                <p><strong>Perfil de anemia activo</strong> — Priorizamos platos ricos en hierro para ti.</p>
              </aside>
            )}

            <section className="buscador__resultados" aria-live="polite">
              {resultadosFiltrados.length === 0 ? (
                <p className="buscador__sin-resultados">
                  No encontramos platos que coincidan con tus criterios. Intenta subir tu presupuesto.
                </p>
              ) : (
                <div className="buscador__lista-resultados">
                  {resultadosFiltrados.map((plato) => (
                    <PlatoResultado
                      key={plato.id}
                      plato={plato}
                      personas={personas}
                      guardado={guardados.includes(plato.id)}
                      onVerPlato={onVerPlato}
                      onToggleGuardado={onToggleGuardado}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </>
      ) : (
        <>
          <section className="buscador__hero">
            <div className="buscador__hero-inner">
              <p className="buscador__eyebrow">
                <span><Icon name="search" size={18} /></span>
                Planificador de comidas
              </p>
              <h1>¿Qué vamos a comer?</h1>
              <p>Busca con tu presupuesto, los ingredientes que tienes en casa o ambos</p>
            </div>
          </section>

          <main className="buscador__main">
            <form className="buscador__formulario" onSubmit={buscarPlatos}>
              <div className="buscador__campos">
                <section className="buscador__presupuesto">
                  <div className="buscador__etiqueta-fila">
                    <label htmlFor="buscador-presupuesto">Presupuesto total máximo <span>Opcional</span></label>
                    <small>ⓘ Total de la receta para las personas seleccionadas</small>
                  </div>
                  <div className="buscador__campo-presupuesto">
                    <span>S/.</span>
                    <input
                      id="buscador-presupuesto"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={presupuesto}
                      onChange={(event) => actualizarBusqueda({ presupuesto: event.target.value })}
                      placeholder={presupuestoBase ? `Base: S/. ${presupuestoBase}` : "0.00"}
                      aria-invalid={Boolean(error && presupuesto.trim())}
                    />
                  </div>
                  {presupuestoBase && <label className="buscador__subtitulo" style={{display:'flex', gap:8, alignItems:'center'}}>
                    <input type="checkbox" checked={usarBase} onChange={(event) => setUsarBase(event.target.checked)} /> Usar presupuesto base cuando el campo esté vacío
                  </label>}
                  <p className="buscador__subtitulo">Montos rápidos para toda la receta:</p>
                  <p className="buscador__subtitulo">{presupuestoEfectivo ? `Límite aplicado: S/. ${Number(presupuestoEfectivo).toFixed(2)} para ${personas} personas.` : 'Sin presupuesto configurado.'}</p>
                  <div className="buscador__montos">
                    {MONTOS_RAPIDOS.map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        className={Number(presupuesto) === monto ? 'seleccionado' : ''}
                        onClick={() => {
                          actualizarBusqueda({ presupuesto: String(monto) })
                          setError('')
                        }}
                      >
                        S/.{monto}
                      </button>
                    ))}
                  </div>

                  <div className="buscador__personas">
                    <label htmlFor="buscador-personas">
                      <Icon name="users" size={17} />
                      ¿Para cuántas personas?
                    </label>
                    <div className="buscador__control-personas">
                      <button
                        type="button"
                        onClick={() =>
                          actualizarBusqueda({ personas: Math.max(1, personas - 1) })
                        }
                        disabled={personas <= 1}
                        aria-label="Quitar una persona"
                      >
                        −
                      </button>
                      <output id="buscador-personas">{personas}</output>
                      <button
                        type="button"
                        onClick={() => actualizarBusqueda({ personas: personas + 1 })}
                        aria-label="Agregar una persona"
                      >
                        +
                      </button>
                    </div>
                    <small>
                      Ajustaremos las cantidades de ingredientes y el costo total para {personas}{' '}
                      {personas === 1 ? 'persona' : 'personas'}.
                    </small>
                  </div>
                </section>

                <section className="buscador__ingredientes">
                  <label htmlFor="buscador-ingredientes">
                    Ingredientes disponibles <span>Opcional</span>
                  </label>
                  <div className="buscador__campo-ingredientes">
                    <Icon name="shoppingBag" size={18} />
                    <textarea
                      id="buscador-ingredientes"
                      value={ingredientes}
                      onChange={(event) => actualizarBusqueda({ ingredientes: event.target.value })}
                      placeholder="Ej: arroz, lentejas, tomate, cebolla..."
                      rows={4}
                    />
                  </div>
                  <small>Separa los ingredientes con comas. Puedes buscar solo con ellos o combinarlos con un presupuesto.</small>
                </section>

                <aside className="buscador__filtros">
                  <h2>Filtros de perfil</h2>
                  <div className="buscador__filtros-panel">
                    {alergias.length === 0 && condiciones.length === 0 ? (
                      <p className="buscador__sin-restricciones">Perfil sin restricción</p>
                    ) : (
                      <>
                        {alergias.length > 0 && (
                          <div className="buscador__restriccion">
                            <h3>Alergias</h3>
                            <div className="buscador__restricciones-lista">
                              {alergias.map((alergia) => (
                                <span key={alergia}>{alergia}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {condiciones.length > 0 && (
                          <div className="buscador__restriccion">
                            <h3>Condiciones</h3>
                            <div className="buscador__restricciones-lista">
                              {condiciones.map((condicion) => (
                                <span key={condicion}>{condicion}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </aside>
              </div>

              {error && <p className="buscador__error" role="alert">{error}</p>}
              <button className="buscador__boton-buscar" type="submit">
                <Icon name="search" size={21} />
                Buscar platos saludables
              </button>
            </form>
          </main>
        </>
      )}
    </div>
  )
}