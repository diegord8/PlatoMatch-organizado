import { useEffect, useState } from 'react'
import Icon from '../Head/Icon.jsx'
import { BackendService } from '../services/backendService.js'
import { soles } from '../data/platos.js'

export default function ResumenAhorro({ usuarioId, historial = [], onVolver }) {
  const [resumenApi, setResumenApi] = useState(null)

  useEffect(() => {
    const id = usuarioId || JSON.parse(localStorage.getItem('platomatch.sesion') || '{}')?.usuario?.id
    if (!id) return
    BackendService.obtenerResumenAhorro(id)
      .then((data) => setResumenApi(data))
      .catch(() => {})
  }, [usuarioId])

  const presupuesto = resumenApi?.presupuestoAsignado ?? 50
  const preparaciones = resumenApi?.detalle ?? historial
  
  // Cálculo matemático lógico:
  const gastado = resumenApi?.totalGastoEjecutado ?? preparaciones.reduce((acc, p) => acc + (Number(p.gastoReal) || 0), 0)
  // El ahorro total es lo que te sobró de tu presupuesto. Si gastaste más, es 0.
  const ahorroCalculado = Math.max(0, presupuesto - gastado)
  const ahorroTotal = resumenApi?.ahorroAcumulado ?? ahorroCalculado

  const porcentajeGasto = presupuesto > 0 ? Math.min(100, Math.round((gastado / presupuesto) * 100)) : 0

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', padding: 0, marginRight: '16px', cursor: 'pointer' }}>
          <Icon name="back" size={20} />
        </button>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#1e293b' }}>Mi Ahorro</h1>
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: '24px', padding: '24px', color: '#fff', boxShadow: '0 10px 25px rgba(5,150,105,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          
          <p style={{ margin: '0 0 8px', fontSize: '14px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="shield" size={16} /> Ahorro total acumulado
          </p>
          <h2 style={{ margin: '0 0 16px', fontSize: '48px', fontWeight: '800' }}>{soles(ahorroTotal)}</h2>
          {ahorroTotal > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              📈 Vas por buen camino
            </span>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.8 }}>Presupuesto total</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{soles(presupuesto)}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.8 }}>Gasto real</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{soles(gastado)}</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', marginTop: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1e293b' }}>Gasto de preparaciones</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Presupuesto máximo vs gasto real</p>
            </div>
            <span style={{ color: porcentajeGasto >= 100 ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: '18px' }}>{porcentajeGasto}%</span>
          </div>

          <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ width: `${porcentajeGasto}%`, height: '100%', background: porcentajeGasto >= 100 ? '#ef4444' : '#10b981', borderRadius: '99px' }} />
          </div>

          <p style={{ margin: '12px 0 0', fontSize: '13px', color: porcentajeGasto >= 100 ? '#ef4444' : '#047857', fontWeight: '500' }}>
            {porcentajeGasto >= 100 ? 'Has superado tu presupuesto asignado.' : `🎉 Tienes disponible ${soles(presupuesto - gastado)} para gastar`}
          </p>
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '16px' }}>Últimas comidas registradas</h3>
          {preparaciones.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px', background: '#fff', padding: '16px', borderRadius: '16px' }}>
              No has guardado preparaciones aún.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {preparaciones.map((item, idx) => (
                <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '12px', display: 'grid', placeItems: 'center', marginRight: '16px' }}>
                      <Icon name="chef" size={24} fill="#94a3b8" />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#1e293b' }}>{item.receta || item.plato}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{item.fecha ? new Date(item.fecha).toLocaleDateString('es-PE') : 'Hoy'}</p>
                    </div>
                  </div>
                  <div style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '99px', fontSize: '13px', fontWeight: 'bold' }}>
                    Gasto: {soles(Number(item.gastoReal ?? item.ahorro ?? 0))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}