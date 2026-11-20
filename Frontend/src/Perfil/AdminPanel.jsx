import { useState } from 'react'
import Icon from '../Head/Icon.jsx'
import { PLATOS } from '../data/platos.js'
import { analizarOpiniones } from '../Feedback/analisis.js'
import { contarCuentas } from '../InicioSesion/cuentas.js'
import './AdminPanel.css'

const ACCESOS = [
  { icono: 'shoppingBag', titulo: 'Registro de Precios', detalle: 'Mercados y actualizaciones', color: 'verde' },
  { icono: 'users', titulo: 'Gestión de Usuarios', detalle: 'Ver perfiles y datos', color: 'azul' },
  { icono: 'message', titulo: 'Moderar Feedbacks', detalle: 'Aprobar y revisar', color: 'amarillo' },
]

function AdminPanel({ onSalir, onRegistroPrecios, onLimpiarPrecios, cantidadPrecios, opiniones }) {
  const [aviso, setAviso] = useState('')
  const feedbacksRecientes = opiniones.slice(0, 10)
  const analisis = analizarOpiniones(opiniones)
  const promedioCalificacion = opiniones.length
    ? opiniones.reduce((total, opinion) => total + opinion.calificacion, 0) / opiniones.length
    : 0
  const porcentajeSatisfaccion = opiniones.length
    ? Math.round(
        (opiniones.filter((opinion) => opinion.calificacion >= 4).length / opiniones.length) * 100,
      )
    : 0
  const conteoEstrellas = [5, 4, 3, 2, 1].map((calificacion) => ({
    calificacion,
    cantidad: opiniones.filter((opinion) => opinion.calificacion === calificacion).length,
  }))
  const aspectosFrecuentes = [...opiniones.reduce((conteos, opinion) => {
    opinion.destacados.forEach((aspecto) => {
      conteos.set(aspecto, (conteos.get(aspecto) ?? 0) + 1)
    })
    return conteos
  }, new Map())]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, 3)

  return (
    <div className="home admin-panel">
      <header className="admin-panel__barra">
        <div className="admin-panel__barra-inner">
          <div className="admin-panel__marca">
            <button type="button" onClick={onSalir}>
              <Icon name="back" size={17} />
              Salir
            </button>
            <span aria-hidden="true" />
            <Icon name="info" size={17} />
            <strong>Panel de Administración</strong>
          </div>
          <small>PlatoMatch Admin · v1.0</small>
        </div>
      </header>

      <section className="admin-panel__portada">
        <div className="admin-panel__portada-inner">
          <p>Resumen del sistema</p>
          <h1>Dashboard general</h1>
          <span>Datos almacenados en este navegador · {new Date().toLocaleDateString('es-PE')}</span>
        </div>
      </section>

      <main className="admin-panel__contenido">
        <section className="admin-panel__metricas" aria-label="Resumen del sistema">
          <article className="admin-panel__metrica admin-panel__metrica--azul">
            <div><span aria-hidden="true">👥</span><small>↗ +12%</small></div>
            <strong>{contarCuentas() ?? '—'}</strong>
            <p>Cuentas registradas en este navegador</p>
          </article>
          <article className="admin-panel__metrica admin-panel__metrica--verde">
            <div><span aria-hidden="true">🍽️</span><small>↗ +3</small></div>
            <strong>{PLATOS.length}</strong>
            <p>Platos en catálogo</p>
          </article>
          <article className="admin-panel__metrica admin-panel__metrica--amarillo">
            <div><span aria-hidden="true">💬</span><small>Locales</small></div>
            <strong>{opiniones.length}</strong>
            <p>Feedbacks recibidos</p>
          </article>
          <article className="admin-panel__metrica admin-panel__metrica--violeta">
            <div><span aria-hidden="true">⭐</span><small>Promedio</small></div>
            <strong>{opiniones.length ? `${promedioCalificacion.toFixed(1)}/5` : '—'}</strong>
            <p>Calificación de platos</p>
          </article>
        </section>

        <div className="admin-panel__columnas">
          <section className="admin-panel__tarjeta admin-panel__feedbacks">
            <header className="admin-panel__tarjeta-cabecera">
              <div>
                <h2><span className="admin-panel__icono admin-panel__icono--verde"><Icon name="message" size={17} /></span>Feedbacks recientes</h2>
                <p className="admin-panel__feedback-origen">Opiniones enviadas desde «¿Qué te pareció?»</p>
              </div>
              <span className="admin-panel__contador">{opiniones.length} entradas</span>
            </header>
            <div className="admin-panel__feedback-resumen">
              <article>
                <span>Satisfacción (4–5 estrellas)</span>
                <strong>{opiniones.length ? `${porcentajeSatisfaccion}%` : '—'}</strong>
              </article>
              <article className="admin-panel__distribucion">
                <span>Distribución de calificaciones</span>
                <div>
                  {conteoEstrellas.map(({ calificacion, cantidad }) => (
                    <span key={calificacion} title={`${calificacion} estrellas: ${cantidad}`}>
                      {calificacion}★ <strong>{cantidad}</strong>
                    </span>
                  ))}
                </div>
              </article>
              <article>
                <span>Aspectos más destacados</span>
                <strong className="admin-panel__aspectos">
                  {aspectosFrecuentes.length
                    ? aspectosFrecuentes.map(([aspecto, cantidad]) => `${aspecto} (${cantidad})`).join(' · ')
                    : 'Sin aspectos destacados'}
                </strong>
              </article>
            </div>
            <div className="admin-panel__feedback-resumen" aria-label="Clasificación automática de feedback">
              <article><span>Opiniones positivas (4–5)</span><strong>{analisis.clasificacion.positiva}</strong></article>
              <article><span>Neutrales (3)</span><strong>{analisis.clasificacion.neutral}</strong></article>
              <article><span>Negativas (1–2)</span><strong>{analisis.clasificacion.negativa}</strong></article>
            </div>
            <p className="admin-panel__feedback-origen" style={{padding:'10px 18px'}}>
              Patrones detectados por palabras clave: {Object.entries(analisis.temas).map(([tema, n])=>`${tema}: ${n}`).join(' · ')}.
              Las calificaciones se utilizan para ordenar recomendaciones de alimentos cuando los filtros anteriores empatan.
            </p>
            <div className="admin-panel__tabla-contenedor">
              <table className="admin-panel__tabla">
                <thead>
                  <tr><th>Usuario</th><th>Plato</th><th>Calificación</th><th>Aspectos y comentario</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {feedbacksRecientes.length === 0 ? (
                    <tr><td colSpan="5">Aún no hay opiniones guardadas.</td></tr>
                  ) : feedbacksRecientes.map((feedback) => {
                    const fecha = new Date(feedback.fecha)
                    return (
                    <tr key={feedback.id}>
                      <td><span className="admin-panel__usuario"><i>{feedback.usuario.charAt(0).toUpperCase() || 'U'}</i>{feedback.usuario}</span></td>
                      <td>{feedback.platoNombre}</td>
                      <td><span className="admin-panel__rating" aria-label={`${feedback.calificacion} de 5 estrellas`}>{'★'.repeat(feedback.calificacion)}{'☆'.repeat(5 - feedback.calificacion)}</span></td>
                      <td>
                        {[...feedback.destacados, feedback.comentario].filter(Boolean).join(' · ') || 'Sin comentario'}
                      </td>
                      <td>{Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString('es-PE')}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="admin-panel__lateral">
            <section className="admin-panel__tarjeta admin-panel__mantenimiento">
              <h2><span className="admin-panel__icono admin-panel__icono--violeta"><Icon name="zap" size={18} /></span>Mantenimiento</h2>
              <p className="admin-panel__duplicados">
                <Icon name="info" size={15} />
                {cantidadPrecios} precios registrados. La limpieza normaliza los datos, clasifica productos y elimina duplicados exactos.
              </p>
              <button
                type="button"
                className="admin-panel__limpieza"
                onClick={() => {
                  const resultado = onLimpiarPrecios()
                  setAviso(
                    `Limpieza completada: ${resultado.registros.length} registros procesados, ${resultado.eliminados} duplicados o inválidos eliminados y ${resultado.normalizados} registros normalizados. Categorías y tendencias actualizadas.`,
                  )
                }}
              >
                <Icon name="zap" size={17} />
                Ejecutar Limpieza
              </button>
              {aviso && <p className="admin-panel__aviso" role="status">{aviso}</p>}
            </section>

            <section className="admin-panel__tarjeta admin-panel__accesos">
              <h2>Accesos rápidos</h2>
              {ACCESOS.map((acceso) => (
                <button
                  type="button"
                  className="admin-panel__acceso"
                  key={acceso.titulo}
                  onClick={() => {
                    if (acceso.titulo === 'Registro de Precios') {
                      onRegistroPrecios()
                      return
                    }
                    setAviso(`${acceso.titulo}: sección disponible al conectar el módulo correspondiente.`)
                  }}
                >
                  <span className={`admin-panel__icono admin-panel__icono--${acceso.color}`}><Icon name={acceso.icono} size={16} /></span>
                  <span><strong>{acceso.titulo}</strong><small>{acceso.detalle}</small></span>
                  <Icon name="chevron" size={17} />
                </button>
              ))}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default AdminPanel
