import { useState } from 'react'
import Icon from '../Head/Icon.jsx'
import FotoPlato from '../Head/FotoPlato.jsx'
import { soles } from '../data/platos.js'
import '../Home/Home.css'
import './Opinion.css'

const DESTACADOS = [
  'Muy productivo',
  'Fácil de preparar',
  'Económico',
  'Delicioso',
  'Buen tamaño',
  'Muy saludable',
  'Recomendado',
]

const ETIQUETAS_ESTRELLAS = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente']
const MAX_COMENTARIO = 300

export default function Opinion({ plato, onVolver, onEnviar }) {
  const [calificacion, setCalificacion] = useState(0)
  const [vista, setVista] = useState(0) // estrella sobre la que está el cursor
  const [destacados, setDestacados] = useState([])
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)

  const mostrar = vista || calificacion

  const toggleDestacado = (d) =>
    setDestacados((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const enviar = (e) => {
    e.preventDefault()
    if (calificacion === 0) return
    onEnviar?.({
      platoId: plato.id,
      calificacion,
      destacados,
      comentario: comentario.trim(),
    })
    setEnviado(true)
  }

  return (
    <div className="home opinion">
      <div className="opinion__barra">
        <button type="button" className="opinion__volver" onClick={onVolver}>
          <Icon name="back" size={20} />
          Volver al plato
        </button>
      </div>

      <main className="opinion__main">
        {enviado ? (
          <section className="opinion__tarjeta opinion__gracias">
            <span className="opinion__check">
              <Icon name="check" size={32} strokeWidth={3} />
            </span>
            <h1>¡Gracias por tu opinión!</h1>
            <p>
              Calificaste <strong>{plato.nombre}</strong> con {calificacion}{' '}
              {calificacion === 1 ? 'estrella' : 'estrellas'}. Tu opinión nos ayuda a mejorar
              las recomendaciones.
            </p>
            <button type="button" className="opinion__enviar" onClick={onVolver}>
              Volver al plato
            </button>
          </section>
        ) : (
          <form onSubmit={enviar} noValidate>
            <section className="opinion__tarjeta opinion__plato">
              <div className="opinion__miniatura">
                <FotoPlato plato={plato} className="opinion__foto" />
              </div>
              <div>
                <p className="opinion__etiqueta">Calificando</p>
                <h1>{plato.nombre}</h1>
                <p className="opinion__precio">{soles(plato.precio)}</p>
              </div>
            </section>

            <section className="opinion__tarjeta">
              <h2 className="opinion__pregunta">
                <span>
                  <Icon name="star" size={18} />
                </span>
                ¿Cómo calificarías este plato?
              </h2>

              <div className="opinion__estrellas" role="radiogroup" aria-label="Calificación">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={calificacion === n}
                    aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                    className={`estrella ${n <= mostrar ? 'estrella--activa' : ''}`}
                    onClick={() => setCalificacion(n)}
                    onMouseEnter={() => setVista(n)}
                    onMouseLeave={() => setVista(0)}
                    onFocus={() => setVista(n)}
                    onBlur={() => setVista(0)}
                  >
                    <Icon name="star" size={48} fill="currentColor" strokeWidth={1} />
                  </button>
                ))}
              </div>
              <p className="opinion__ayuda" aria-live="polite">
                {mostrar ? ETIQUETAS_ESTRELLAS[mostrar - 1] : 'Toca una estrella para calificar'}
              </p>
            </section>

            <section className="opinion__tarjeta">
              <h2 className="opinion__titulo-campo">
                ¿Qué destacas? <span>(Opcional)</span>
              </h2>
              <div className="opinion__chips">
                {DESTACADOS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`chip ${destacados.includes(d) ? 'chip--activo' : ''}`}
                    aria-pressed={destacados.includes(d)}
                    onClick={() => toggleDestacado(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <section className="opinion__tarjeta">
              <label className="opinion__titulo-campo" htmlFor="comentario">
                Comentario adicional <span>(Opcional)</span>
              </label>
              <textarea
                id="comentario"
                className="opinion__texto"
                placeholder="Cuéntanos más sobre tu experiencia con este plato..."
                maxLength={MAX_COMENTARIO}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              <p className="opinion__contador">
                {comentario.length}/{MAX_COMENTARIO}
              </p>
            </section>

            <button type="submit" className="opinion__enviar" disabled={calificacion === 0}>
              <Icon name="send" size={20} />
              Enviar opinión
            </button>
            {calificacion === 0 && (
              <p className="opinion__nota">Selecciona al menos una estrella para continuar</p>
            )}
          </form>
        )}
      </main>
    </div>
  )
}