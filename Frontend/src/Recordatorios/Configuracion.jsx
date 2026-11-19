
import { useEffect, useState } from 'react'

import {
  pedirPermiso,
  puedeNotificar,
} from './recordatorios.js'

import '../Compras/Compras.css'

export default function Configuracion({
  configuracion = {},
  onGuardar,
  onVolver,
}) {
  const [activo, setActivo] = useState(
    Boolean(configuracion.activo)
  )

  const [hora, setHora] = useState(
    configuracion.hora || '12:00'
  )

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Recuperar los datos enviados desde SQL Server.
  useEffect(() => {
    setActivo(Boolean(configuracion.activo))
    setHora(configuracion.hora || '12:00')
  }, [
    configuracion.activo,
    configuracion.hora,
  ])

  const guardar = async (event) => {
    event.preventDefault()

    setMensaje('')
    setError('')

    if (!/^\d{2}:\d{2}$/.test(hora)) {
      setError('Selecciona una hora válida.')
      return
    }

    setGuardando(true)

    try {
      // App.jsx se comunica con SQL Server.
      await onGuardar({
        activo,
        hora,
      })

      if (!activo) {
        setMensaje(
          'Recordatorio desactivado correctamente.'
        )
      } else {
        const permitido = await pedirPermiso()

        if (permitido) {
          setMensaje(
            'Recordatorio guardado correctamente. ' +
            'Recibirás avisos mientras PlatoMatch esté abierto.'
          )
        } else {
          setMensaje(
            'Horario guardado. Debes permitir las ' +
            'notificaciones del navegador para recibir avisos.'
          )
        }
      }
    } catch (err) {
      setError(
        err.message ||
        'No se pudo guardar el recordatorio.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'Arial, sans-serif',
    }}>
      <header style={{
        background:
          'linear-gradient(120deg, #065f46, #059669)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        color: '#fff',
      }}>
        <button
          type="button"
          onClick={onVolver}
          style={{
            border: '1px solid #ffffff55',
            background: '#ffffff22',
            borderRadius: 10,
            padding: '11px 16px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Volver al perfil
        </button>

        <h1 style={{
          margin: 0,
          color: '#fff',
          fontSize: 22,
        }}>
          Recordatorios de comidas
        </h1>
      </header>

      <main style={{
        maxWidth: 650,
        margin: '40px auto',
        padding: '0 20px',
      }}>
        <section style={{
          background: '#fff',
          padding: 28,
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px #0000000b',
        }}>
          <div style={{
            width: 65,
            height: 65,
            display: 'grid',
            placeItems: 'center',
            fontSize: 34,
            background: '#ecfdf5',
            borderRadius: 16,
            marginBottom: 20,
          }}>
            🔔
          </div>

          <h2 style={{
            color: '#065f46',
            fontSize: 24,
            marginBottom: 10,
          }}>
            Planifica tu próxima comida
          </h2>

          <p style={{
            color: '#64748b',
            lineHeight: 1.6,
            marginBottom: 24,
          }}>
            Activa un recordatorio y elige la hora
            en la que deseas recibir un aviso
            para organizar tu comida.
          </p>

          <form
            onSubmit={guardar}
            style={{
              display: 'grid',
              gap: 20,
            }}
          >
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              background: activo
                ? '#ecfdf5'
                : '#f8fafc',
              border: activo
                ? '1px solid #10b981'
                : '1px solid #e2e8f0',
              borderRadius: 12,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) =>
                  setActivo(e.target.checked)
                }
                style={{
                  width: 20,
                  height: 20,
                  accentColor: '#059669',
                }}
              />

              <div>
                <strong style={{
                  display: 'block',
                  color: '#0f172a',
                }}>
                  Activar recordatorio
                </strong>

                <small style={{
                  color: '#64748b',
                }}>
                  Aviso diario a la hora seleccionada
                </small>
              </div>
            </label>

            <label style={{
              display: 'grid',
              gap: 10,
            }}>
              <strong style={{
                color: '#334155',
              }}>
                Hora del recordatorio
              </strong>

              <input
                type="time"
                value={hora}
                onChange={(e) =>
                  setHora(e.target.value)
                }
                disabled={!activo}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  fontSize: 17,
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  background: activo
                    ? '#fff'
                    : '#f1f5f9',
                  color: '#334155',
                }}
              />
            </label>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 12,
              background: activo
                ? '#ecfdf5'
                : '#f1f5f9',
            }}>
              <span style={{ fontSize: 23 }}>
                {activo ? '✅' : '⏸️'}
              </span>

              <span style={{
                color: activo
                  ? '#047857'
                  : '#64748b',
                fontSize: 14,
              }}>
                {activo
                  ? `Aviso seleccionado para las ${hora}`
                  : 'Recordatorios desactivados'}
              </span>
            </div>

            <button
              type="submit"
              disabled={guardando}
              style={{
                background: guardando
                  ? '#94a3b8'
                  : '#059669',
                border: 0,
                borderRadius: 12,
                padding: 15,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: guardando
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {guardando
                ? 'Guardando...'
                : 'Guardar recordatorio'}
            </button>
          </form>

          {mensaje && (
            <div
              role="status"
              style={{
                marginTop: 20,
                padding: 15,
                background: '#dcfce7',
                color: '#166534',
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              ✓ {mensaje}
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 20,
                padding: 15,
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{
            marginTop: 25,
            padding: 16,
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}>
            <strong style={{
              color: '#334155',
            }}>
              Información del recordatorio
            </strong>

            <p style={{
              color: '#64748b',
              fontSize: 13,
              lineHeight: 1.7,
            }}>
              El horario se guarda en SQL Server.
              Los avisos funcionan mientras
              PlatoMatch esté abierto y el navegador
              tenga permiso para mostrar notificaciones.
            </p>

            {!puedeNotificar() && (
              <p style={{
                color: '#b45309',
                fontSize: 13,
              }}>
                Tu navegador no admite notificaciones
                en este contexto.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
