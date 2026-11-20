
import { useEffect, useState } from 'react'
import { BackendService } from '../services/backendService.js'
import { soles } from '../data/platos.js'

export default function ResumenAhorro({
  usuarioId,
  onVolver,
  onCompras,
}) {
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!usuarioId) return

    let activo = true

    BackendService.obtenerResumenAhorro(usuarioId)
      .then(datos => {
        if (activo) setResumen(datos)
      })
      .catch(e => {
        if (activo) setError(e.message)
      })

    return () => { activo = false }
  }, [usuarioId])

  const preparaciones = resumen?.detalle || []
  const meses = resumen?.ahorrosMensuales || []

  const presupuesto = Number(
    resumen?.presupuestoAsignado || 0
  )

  const gasto = Number(
    resumen?.totalGastoEjecutado || 0
  )

  const ahorro = Number(
    resumen?.ahorroAcumulado || 0
  )

  const comparables = Number(
    resumen?.preparacionesConReferencia || 0
  )

  const tarjeta = {
    background: '#fff',
    borderRadius: 17,
    padding: 20,
    marginBottom: 16,
    border: '1px solid #e2e8f0',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      <header style={{
        background: '#065f46',
        padding: 20,
        color: '#fff',
      }}>
        <button
          type="button"
          onClick={onVolver}
          style={{
            border: 0,
            borderRadius: 9,
            padding: 10,
            cursor: 'pointer',
          }}
        >
          ← Volver al perfil
        </button>

        <h1>Mi Ahorro</h1>
      </header>

      <main style={{
        maxWidth: 650,
        padding: 20,
        margin: '0 auto',
      }}>
        {!resumen && !error && (
          <p>Cargando datos desde SQL Server...</p>
        )}

        {error && (
          <p role="alert" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        )}

        {resumen && (
          <>
            <section style={{
              ...tarjeta,
              background: '#047857',
              color: '#fff',
            }}>
              <p>Ahorro comparativo acumulado</p>

              <h2 style={{ fontSize: 35 }}>
                {comparables > 0
                  ? soles(ahorro)
                  : 'Sin datos comparativos'}
              </h2>

              <p>
                {comparables} preparaciones con
                costo alternativo informado.
              </p>
            </section>

            <section style={tarjeta}>
              <h3>Resumen de gastos</h3>

              <p>
                Presupuesto acumulado:
                {' '}<strong>{soles(presupuesto)}</strong>
              </p>

              <p>
                Gasto confirmado:
                {' '}<strong>{soles(gasto)}</strong>
              </p>

              <p>
                Saldo frente al presupuesto:
                {' '}<strong>{soles(presupuesto - gasto)}</strong>
              </p>
            </section>

            <section style={tarjeta}>
              <h3>Ahorro acumulado por mes</h3>

              {meses.length === 0 && (
                <p>
                  Registra una compra con costo alternativo
                  para empezar a calcular el ahorro.
                </p>
              )}

              {meses.map(mes => (
                <div key={mes.mes} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '12px 0',
                  gap: 12,
                }}>
                  <div>
                    <strong>{mes.mes}</strong>

                    <small style={{
                      display: 'block',
                      color: '#64748b',
                    }}>
                      {mes.preparaciones} preparaciones
                    </small>
                  </div>

                  <strong style={{
                    color: mes.ahorro >= 0
                      ? '#047857'
                      : '#b91c1c',
                  }}>
                    {soles(mes.ahorro)}
                  </strong>
                </div>
              ))}
            </section>

            <section style={tarjeta}>
              <h3>Ahorro por preparación</h3>

              {preparaciones.length === 0 && (
                <p>
                  Aún no tienes preparaciones registradas.
                </p>
              )}

              {preparaciones.map(p => (
                <article key={p.id} style={{
                  padding: '14px 0',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <strong>{p.receta}</strong>

                  <p style={{
                    color: '#64748b',
                    fontSize: 13,
                  }}>
                    {new Date(p.fecha)
                      .toLocaleDateString('es-PE')}
                  </p>

                  <p>
                    Gasto real: {soles(p.gastoReal)}
                  </p>

                  <p>
                    Costo alternativo:
                    {' '}
                    {p.costoReferenciaAlternativa == null
                      ? 'Sin registrar'
                      : soles(p.costoReferenciaAlternativa)}
                  </p>

                  <strong style={{
                    color: p.ahorroComparado >= 0
                      ? '#047857'
                      : '#b91c1c',
                  }}>
                    {p.ahorroComparado == null
                      ? 'Ahorro no calculado'
                      : `Ahorro comparativo: ${soles(
                          p.ahorroComparado
                        )}`}
                  </strong>
                </article>
              ))}
            </section>

            <p style={{
              fontSize: 12,
              color: '#64748b',
            }}>
              El ahorro se calcula usando el costo
              alternativo ingresado por el usuario.
              No representa una comparación
              verificada automáticamente por PlatoMatch.
            </p>

            <button
              type="button"
              onClick={onCompras}
              style={{
                padding: 13,
                background: '#059669',
                border: 0,
                color: '#fff',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              Volver a compras
            </button>
          </>
        )}
      </main>
    </div>
  )
}
