import { useEffect, useState } from 'react'
import Barra from '../Head/Barra.jsx'
import Icon from '../Head/Icon.jsx'
import { soles } from '../data/platos.js'
import { BackendService } from '../services/backendService.js'

// Diccionario local para enriquecer visualmente los mercados que vienen de la BD
const INFO_EXTRA = {
  'Mercado Central': { direccion: 'Av. Abancay s/n', horario: 'Lunes a Domingo: 6:00 a.m. - 6:00 p.m.', desc: 'Mercado tradicional con una amplia variedad de productos frescos, abarrotes y precios altamente competitivos para el hogar.' },
  'Mercado de Surquillo': { direccion: 'Paseo de la República s/n', horario: 'Lunes a Domingo: 7:00 a.m. - 5:00 p.m.', desc: 'Famoso por su gran oferta de ingredientes frescos, carnes de primera y especias.' },
  'Mercado Santa Anita': { direccion: 'Av. Metropolitana', horario: 'Lunes a Sábado: 4:00 a.m. - 4:00 p.m.', desc: 'Principal centro de abastos mayorista y minorista con los precios más económicos en tubérculos y verduras.' },
  'Mercado Productores': { direccion: 'Carretera Central Km 2.5', horario: 'Lunes a Domingo: 5:00 a.m. - 3:00 p.m.', desc: 'Ideal para compras al por mayor y despensas mensuales grandes.' },
  'Mercado San José': { direccion: 'Av. República Dominicana', horario: 'Lunes a Domingo: 7:00 a.m. - 6:00 p.m.', desc: 'Mercado ordenado y limpio, conocido por su excelente sección de pescados y mariscos.' }
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
  const [preciosDetalle, setPreciosDetalle] = useState([])
  const [cargandoPrecios, setCargandoPrecios] = useState(false)

  const [filtroOrden, setFiltroOrden] = useState('calificacion')
  const [busquedaMercado, setBusquedaMercado] = useState('')

  const [recetaId, setRecetaId] = useState('')
  const [personas, setPersonas] = useState(1)
  const [comparativaApi, setComparativaApi] = useState(null)
  const [cargandoComparativa, setCargandoComparativa] = useState(false)

  useEffect(() => {
    if (!recetaId && platosReales.length > 0) setRecetaId(String(platosReales[0].id))
  }, [platosReales, recetaId])

  useEffect(() => {
    if (vista !== 'detalle' || !mercadoElegido?.id) return
    setCargandoPrecios(true)
    BackendService.obtenerPreciosPorMercado(mercadoElegido.id)
      .then((data) => setPreciosDetalle(Array.isArray(data) ? data : []))
      .catch(() => setPreciosDetalle([]))
      .finally(() => setCargandoPrecios(false))
  }, [vista, mercadoElegido])

  useEffect(() => {
    if (vista !== 'comparacion' || !recetaId) return
    setCargandoComparativa(true)
    BackendService.compararMercados(recetaId)
      .then((data) => setComparativaApi(data))
      .catch(() => setComparativaApi(null))
      .finally(() => setCargandoComparativa(false))
  }, [vista, recetaId])

  const mercadosFiltrados = [...mercados]
    .filter((m) => m.nombre.toLowerCase().includes(busquedaMercado.trim().toLowerCase()))
    .sort((a, b) => {
      if (filtroOrden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      if (filtroOrden === 'distrito') return (a.distrito || '').localeCompare(b.distrito || '', 'es', { sensitivity: 'base' })
      const promA = estadisticasMercados[a.nombre]?.promedio ?? 4.5
      const promB = estadisticasMercados[b.nombre]?.promedio ?? 4.5
      return promB - promA || a.id - b.id
    })

  // --- PANTALLA 1: LISTA ---
  if (vista === 'lista') {
    return (
      <div className="home">
        <Barra activa="mercados" onNavegar={onNavegar} />
        <header style={{ padding: '20px 24px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button type="button" onClick={() => onNavegar('inicio')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="back" size={20} />
          </button>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Mercados</h1>
        </header>

        <main style={{ padding: '24px', maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Buscar mercado por nombre..." value={busquedaMercado} onChange={(e) => setBusquedaMercado(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcdcdc' }} />
            <select value={filtroOrden} onChange={(e) => setFiltroOrden(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcdcdc', background: '#fff' }}>
              <option value="calificacion">Mejor puntuados</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="distrito">Distrito (A-Z)</option>
            </select>
          </div>

          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Mercados disponibles ({mercadosFiltrados.length})</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Selecciona un mercado para ver sus precios vigentes en SQL Server.</p>

          <div style={{ display: 'grid', gap: '14px' }}>
            {mercadosFiltrados.map((m) => {
              const promedio = estadisticasMercados[m.nombre]?.promedio ?? 4.5
              const valoraciones = estadisticasMercados[m.nombre]?.cantidad ?? 0
              return (
                <article key={m.id} onClick={() => { setMercadoElegido(m); setVista('detalle') }} style={{ display: 'flex', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eaeaea', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '100px', background: '#e8f6ef', display: 'grid', placeItems: 'center', color: '#278957' }}><Icon name="shoppingBag" size={34} /></div>
                  <div style={{ padding: '16px', flex: 1 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{m.nombre}</h3>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#e6a523', fontWeight: 'bold' }}>★ {promedio.toFixed(1)} <span style={{ color: '#888', fontWeight: 'normal' }}>({valoraciones} calificaciones)</span></p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>📍 Distrito: {m.distrito || 'Lima'}</p>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', alignItems: 'center', color: '#aaa' }}><Icon name="chevron" size={20} /></div>
                </article>
              )
            })}
          </div>
        </main>
      </div>
    )
  }

  // --- PANTALLA 2: DETALLE (TU DISEÑO + DETALLES DEL MOCKUP) ---
  if (vista === 'detalle' && mercadoElegido) {
    const promedio = estadisticasMercados[mercadoElegido.nombre]?.promedio ?? 4.5
    const miCalificacion = calificacionesMercados[mercadoElegido.nombre] ?? 0
    const infoExtra = INFO_EXTRA[mercadoElegido.nombre] || { direccion: 'Av. Principal s/n', horario: 'Lunes a Domingo', desc: 'Mercado local con variedad de productos frescos.' }

    return (
      <div className="home">
        <Barra activa="mercados" onNavegar={onNavegar} />
        <header style={{ padding: '20px 24px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button type="button" onClick={() => setVista('lista')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="back" size={20} /></button>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Detalle de mercado</h1>
        </header>

        <main style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '40px' }}>
          {/* Tu cabecera original */}
          <div style={{ height: '140px', background: 'linear-gradient(135deg, #1b5e3a, #278957)', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <h2 style={{ fontSize: '24px', margin: 0 }}>{mercadoElegido.nombre}</h2>
          </div>

          <div style={{ padding: '24px', background: '#fff', borderRadius: '0 0 20px 20px', border: '1px solid #eee' }}>
            
            {/* Calificación y ubicación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0' }}>{mercadoElegido.nombre}</h2>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#e6a523', fontWeight: 'bold' }}>★ {promedio.toFixed(1)} <span style={{ color: '#888', fontWeight: 'normal' }}>({estadisticasMercados[mercadoElegido.nombre]?.cantidad ?? 0} calificaciones)</span></p>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#555' }}>📍 {infoExtra.direccion}, {mercadoElegido.distrito || 'Lima'}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>🕒 {infoExtra.horario}</p>
              </div>

              {onCalificarMercado && (
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Tu calificación:</span>
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <button key={estrella} type="button" onClick={() => onCalificarMercado(mercadoElegido.nombre, estrella)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: estrella <= miCalificacion ? '#e6a523' : '#ccc' }}>★</button>
                  ))}
                </div>
              )}
            </div>

            {/* Nueva sección: Sobre el mercado (del mockup) */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 8px 0', color: '#1e293b' }}>Sobre el mercado</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>{infoExtra.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                <div><Icon name="shoppingBag" size={20} color="#047857" /><span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Variedad</span></div>
                <div><Icon name="flame" size={20} color="#047857" /><span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Accesibles</span></div>
                <div><Icon name="droplet" size={20} color="#047857" /><span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Frescos</span></div>
                <div><Icon name="shield" size={20} color="#047857" /><span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Seguros</span></div>
              </div>
            </div>

            {/*lista de precios original  */}
            <h3 style={{ fontSize: '16px', borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '10px' }}>
              Precios vigentes registrados en BD
            </h3>

            {cargandoPrecios ? (
              <p style={{ color: '#666', fontSize: '14px' }}>Consultando precios...</p>
            ) : preciosDetalle.length === 0 ? (
              <p style={{ color: '#777', fontSize: '14px' }}>Aún no hay precios registrados para este mercado en la base de datos.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0', display: 'grid', gap: '8px' }}>
                {preciosDetalle.map((p, idx) => (
                  <li key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f5f9f7', borderRadius: '10px', fontSize: '14px' }}>
                    <span>{p.productoNombre}</span>
                    <strong style={{ color: '#16a34a' }}>{soles(Number(p.precio))}</strong>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" onClick={() => setVista('comparacion')} style={{ width: '100%', marginTop: '24px', padding: '15px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Comparar precios de una receta
            </button>
          </div>
        </main>
      </div>
    )
  }

  // --- PANTALLA 3: MATRIZ COMPARATIVA (SE MANTIENE INTACTA) ---
  const platoElegido = platosReales.find((p) => String(p.id) === recetaId) || platosReales[0]
  const opcionesMercado = comparativaApi?.comparativaPorMercado || []
  const menorCosto = opcionesMercado.length > 0 ? Math.min(...opcionesMercado.map((o) => o.costoTotalProyectado * personas)) : null
  const ingredientesLista = opcionesMercado[0]?.detalleIngredientes || []

  return (
    <div className="home">
      <Barra activa="mercados" onNavegar={onNavegar} />
      <header style={{ padding: '20px 24px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button type="button" onClick={() => setVista('detalle')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="back" size={20} /></button>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Comparación de precios (HU-12)</h1>
      </header>

      <main style={{ padding: '24px', maxWidth: '950px', margin: '0 auto' }}>
        <div style={{ background: '#f5f9f7', padding: '16px', borderRadius: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Receta a comparar:</label>
            <select value={recetaId} onChange={(e) => setRecetaId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
              {platosReales.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Personas:</label>
            <input type="number" min="1" value={personas} onChange={(e) => setPersonas(Math.max(1, Number(e.target.value)))} style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
        </div>

        {cargandoComparativa ? (
          <p style={{ color: '#666' }}>Calculando comparativa entre mercados...</p>
        ) : opcionesMercado.length === 0 ? (
          <p style={{ color: '#666' }}>No hay datos de comparación disponibles para esta receta.</p>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '12px', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Ingrediente</th>
                  {opcionesMercado.map((op) => {
                    const total = op.costoTotalProyectado * personas
                    const esMasBarato = total === menorCosto
                    return (
                      <th key={op.mercadoId} style={{ padding: '12px', borderBottom: '2px solid #ddd', background: esMasBarato ? '#e8f6ef' : 'transparent' }}>
                        {op.mercadoNombre}
                        {esMasBarato && <span style={{ display: 'block', fontSize: '11px', color: '#16a34a' }}>★ Más económico</span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {ingredientesLista.map((ing, idx) => (
                  <tr key={ing.ingrediente || idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}><strong>{ing.ingrediente}</strong></td>
                    {opcionesMercado.map((op) => {
                      const det = op.detalleIngredientes?.[idx]
                      return (
                        <td key={op.mercadoId} style={{ padding: '12px', color: '#444' }}>
                          {det ? soles(Number(det.precioUnitarioReferencial)) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0faf4' }}>
                  <td style={{ padding: '14px', fontWeight: 'bold' }}>Total estimado ({personas} pers.)</td>
                  {opcionesMercado.map((op) => {
                    const total = op.costoTotalProyectado * personas
                    return (
                      <td key={op.mercadoId} style={{ padding: '14px', fontWeight: 'bold', color: total === menorCosto ? '#16a34a' : '#333' }}>
                        {soles(total)}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}