import { useMemo, useState } from 'react'
import Icon from '../Head/Icon.jsx'
import { PLATOS, soles } from '../data/platos.js'
import { MERCADOS } from '../Perfil/precios.js'

const descargarArchivoTxt = (lista) => {
  if (!lista || !lista.ingredientes) return
  const fecha = new Date().toLocaleDateString('es-PE')
  const texto = `🛒 LISTA DE COMPRAS: ${lista.nombre.toUpperCase()}\n`
    + `Para ${lista.personas} personas | Fecha: ${fecha}\n`
    + `=========================================\n\n`
    + lista.ingredientes.map(ing => `[${ing.comprado ? 'X' : ' '}] ${ing.nombre} - ${ing.cantidad}`).join('\n')
    + `\n\n=========================================\nGenerado por PlatoMatch`

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = `Lista_${lista.nombre.replace(/\s+/g, '_')}.txt`
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
}

export default function ListaCompras({
  lista,
  historial,
  onMarcar,
  onVolver,
  onRegistrarAhorro,
  onVerAhorro,
  onVerRecetas,
}) {
  const [registroAhorro, setRegistroAhorro] = useState(false)
  const [mercadoElegido, setMercadoElegido] = useState(MERCADOS[0])

  if (!lista) {
    return (
      <div className="home" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
          <button onClick={onVolver} style={{ background: 'none', border: 'none', padding: 0, marginRight: '16px', cursor: 'pointer' }}>
            <Icon name="back" size={20} />
          </button>
          <h1 style={{ fontSize: '18px', margin: 0 }}>Tu Lista de Compras</h1>
        </header>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center' }}>
          <Icon name="shoppingBag" size={50} fill="#cbd5e1" />
          <h2 style={{ fontSize: '18px', color: '#334155', margin: '20px 0 8px' }}>Aún no tienes una lista activa</h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '300px', marginBottom: '24px' }}>
            Genera una lista desde el detalle de la receta que vayas a preparar.
          </p>
          <button onClick={onVerRecetas} style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Buscar recetas
          </button>
        </main>
      </div>
    )
  }

  const ingredientesFaltantes = lista.ingredientes.filter(i => !i.comprado)
  const costoFaltantes = ingredientesFaltantes.reduce((sum, ing) => sum + (Number(ing.precio) || 0), 0)
  
  // Calculamos visualmente cuántos ingredientes se descartaron por estar en despensa
  const recetaOriginal = PLATOS.find(p => p.id === Number(lista.platoId))
  const cantidadOriginal = recetaOriginal?.ingredientes?.length || lista.ingredientes.length
  const enCasaCount = Math.max(0, cantidadOriginal - lista.ingredientes.length)

  const completado = ingredientesFaltantes.length === 0
  const puedeRegistrar = completado && !historial?.some(h => h.listaId === lista.id)

  const manejarGuardadoAhorro = (e) => {
    e.preventDefault()
    onRegistrarAhorro({
      listaId: lista.id,
      platoId: lista.platoId,
      plato: lista.nombre,
      costoElegido: costoFaltantes || 15,
      fecha: new Date().toISOString(),
    })
    setRegistroAhorro(true)
  }

  return (
    <div className="home" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onVolver} style={{ background: 'none', border: 'none', padding: 0, marginRight: '16px', cursor: 'pointer' }}>
            <Icon name="back" size={20} />
          </button>
          <h1 style={{ fontSize: '18px', margin: 0, color: '#1e293b' }}>Tu Lista de Compras</h1>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', background: '#ecfdf5', padding: '4px 8px', borderRadius: '12px' }}>
          {lista.ingredientes.length - ingredientesFaltantes.length}/{lista.ingredientes.length}
        </span>
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
          <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
            <Icon name="chef" size={30} fill="#94a3b8"/>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}>🛒 Receta seleccionada</p>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{lista.nombre}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{lista.personas} porciones</p>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
          Ingredientes que te faltan comprar <span style={{ color: '#10b981' }}>(Descartamos lo que ya tienes en casa)</span>
        </p>

        {enCasaCount > 0 && (
          <div style={{ background: '#ecfdf5', color: '#047857', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>
            ✓ {enCasaCount} {enCasaCount === 1 ? 'ingrediente ya tienes' : 'ingredientes ya tienes'} en casa ✓
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          {ingredientesFaltantes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold', margin: '20px 0' }}>✓ ¡Todos los ingredientes listos!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ingredientesFaltantes.map((ing) => (
                <li key={ing.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}>
                    <div style={{ width: '22px', height: '22px', border: '2px solid #cbd5e1', borderRadius: '6px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input type="checkbox" checked={ing.comprado} onChange={() => onMarcar(ing.id)} style={{ opacity: 0, position: 'absolute' }} />
                    </div>
                    <span style={{ fontSize: '15px', color: '#334155', fontWeight: '500' }}>{ing.nombre}</span>
                  </label>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>{ing.cantidad}</span>
                    <strong style={{ fontSize: '14px', color: '#10b981' }}>{ing.precio ? soles(ing.precio) : '--'}</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Total a pagar (aprox)</span>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ display: 'block', fontSize: '20px', color: '#10b981' }}>{soles(costoFaltantes)}</strong>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>{ingredientesFaltantes.length} productos por comprar</small>
            </div>
          </div>
        </div>

        {puedeRegistrar && !registroAhorro && (
          <div style={{ marginTop: '24px', padding: '20px', background: '#ecfdf5', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', color: '#065f46', margin: '0 0 8px' }}>¡Todo comprado!</h3>
            <p style={{ fontSize: '13px', color: '#047857', margin: '0 0 16px' }}>Selecciona dónde compraste y registra tu compra en el historial.</p>
            <form onSubmit={manejarGuardadoAhorro}>
              <select value={mercadoElegido} onChange={(e) => setMercadoElegido(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '12px' }}>
                {MERCADOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button type="submit" style={{ width: '100%', padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Guardar en Historial
              </button>
            </form>
          </div>
        )}

        {registroAhorro && (
          <div style={{ marginTop: '24px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: '#166534', fontWeight: 'bold', margin: '0 0 12px' }}>✓ ¡Preparación registrada!</p>
            <button type="button" onClick={onVerAhorro} style={{ padding: '10px 20px', background: '#fff', color: '#16a34a', border: '1px solid #16a34a', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Ver mi ahorro
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
          <button onClick={() => descargarArchivoTxt(lista)} style={{ width: '100%', padding: '14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
            Compartir / Exportar a TXT
          </button>
          <button onClick={onVerRecetas} style={{ width: '100%', padding: '14px', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <Icon name="refresh" size={16} /> Empezar nueva lista
          </button>
        </div>
      </main>
    </div>
  )
}