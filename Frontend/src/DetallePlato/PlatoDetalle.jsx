import { useState } from 'react'
import Icon from '../Head/Icon.jsx'
import Barra from '../Head/Barra.jsx'
import FotoPlato from '../Head/FotoPlato.jsx'
import { soles } from '../data/platos.js'
import { evaluarPlato, AVISO_SALUD } from '../salud/filtros.js'
import '../Home/Home.css'
import './Detalle.css'

export default function PlatoDetalle({
  plato,
  personas = plato.porciones || 1,
  guardado,
  onToggleGuardado,
  onVolver,
  onNavegar,
  onOpinion,
  onGenerarCompras,
  perfilSalud = {},
}) {
  const [aviso, setAviso] = useState('')
  const evaluacion = evaluarPlato(plato, perfilSalud)

  // Aseguramos que los ingredientes no vengan repetidos desde la base de datos
  const ingredientesLimpio = plato.ingredientes 
    ? [...new Map(plato.ingredientes.map(i => [i.nombre, i])).values()] 
    : []

  const compartir = async () => {
    const texto = `${plato.nombre} — ${soles(plato.precio * personas)} para ${personas} ${personas === 1 ? 'persona' : 'personas'} (PlatoMatch)`
    try {
      if (navigator.share) {
        await navigator.share({ title: plato.nombre, text: texto })
      } else {
        await navigator.clipboard.writeText(texto)
        setAviso('Texto copiado')
        setTimeout(() => setAviso(''), 2000)
      }
    } catch {
      /* el usuario canceló o el navegador no lo permite */
    }
  }

  return (
    <div className="home detalle">
      <Barra activa={null} onNavegar={onNavegar} />

      <div className="detalle__subbarra">
        <div className="detalle__subbarra-inner">
          <button type="button" className="detalle__volver" onClick={onVolver}>
            <Icon name="back" size={20} />
            Volver a resultados
          </button>
          <button type="button" className="detalle__compartir" onClick={compartir}>
            <Icon name="share" size={16} />
            {aviso || 'Compartir'}
          </button>
        </div>
      </div>

      <main className="detalle__main">
        {/* ---------- Columna izquierda ---------- */}
        <div>
          <div className="detalle__imagen">
            <FotoPlato plato={plato} className="detalle__foto" />
            <div className="detalle__costo">
              <small>Costo estimado</small>
              <p>
                {soles(plato.precio * personas)} <span>/ {personas === 1 ? 'persona' : `${personas} personas`}</span>
              </p>
            </div>
            {plato.insigniaDetalle && (
              <span className="detalle__insignia">{plato.insigniaDetalle}</span>
            )}
          </div>

          <dl className="detalle__datos">
            <div className="dato dato--calorias">
              <Icon name="flame" size={20} />
              <dt>{plato.kcal}</dt>
              <dd>kcal</dd>
              <small>Calorías</small>
            </div>
            <div className="dato dato--porciones">
              <Icon name="users" size={20} />
              <dt>{personas}</dt>
              <dd>{personas === 1 ? 'persona' : 'personas'}</dd>
              <small>Porciones</small>
            </div>
            <div className="dato dato--tiempo">
              <Icon name="clock" size={20} />
              <dt>{plato.minutos}</dt>
              <dd>min</dd>
              <small>Preparación</small>
            </div>
          </dl>
        </div>

        {/* ---------- Columna derecha ---------- */}
        <div>
          <h1 className="detalle__titulo">{plato.nombre}</h1>

          <div className="detalle__apto" role="status">
            <span className="detalle__apto-icono">
              <Icon name="shield" size={18} />
            </span>
            <div>
              <p>{evaluacion.descartado ? 'Revisar restricciones antes de preparar' : 'Plato revisado y compatible'}</p>
              <small>{evaluacion.riesgos.length > 0 ? `Coincidencias de alergias: ${evaluacion.riesgos.join(', ')}` : evaluacion.noEvaluables.length > 0 ? `Alergias no evaluables: ${evaluacion.noEvaluables.join(', ')}` : 'Apto según tu perfil de salud.'}</small>
            </div>
          </div>

          <p className="detalle__descripcion">{plato.detalle ?? plato.descripcion}</p>

          <ul className="detalle__etiquetas">
            {(plato.etiquetasDetalle ?? plato.etiquetas).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>

          <h2 className="detalle__subtitulo">
            <span>
              <Icon name="chef" size={18} />
            </span>
            Ingredientes
          </h2>
          <p className="detalle__porciones-nota">
            Cantidades ajustadas para {personas} {personas === 1 ? 'persona' : 'personas'}.
          </p>

          {/* Cambiado <ol> por <ul> para que no salga el "1. 1" duplicado */}
          <ul className="detalle__ingredientes">
            {ingredientesLimpio.map((ing, i) => (
              <li key={ing.nombre}>
                <span className="detalle__numero">{i + 1}</span>
                <span className="detalle__ingrediente">
                  {ing.cantidad ? `${ing.nombre} (${ing.cantidad})` : ing.nombre}
                </span>
                {ing.destacado && (
                  <span className="detalle__nutriente">
                    <Icon name="droplet" size={12} fill="currentColor" />
                    {ing.destacado}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <aside className="detalle__aviso">
            <span>
              <Icon name="info" size={18} />
            </span>
            <p>
              <strong>Aviso importante:</strong> {AVISO_SALUD}
            </p>
          </aside>

          <div className="detalle__acciones">
            <button
              type="button"
              className={`detalle__guardar ${guardado ? 'detalle__guardar--activo' : ''}`}
              onClick={() => onToggleGuardado(plato.id)}
              aria-pressed={guardado}
            >
              <Icon name="bookmark" size={22} fill={guardado ? 'currentColor' : 'none'} />
              {guardado ? 'Plato guardado' : 'Guardar plato'}
            </button>
            <button type="button" className="detalle__opinar" onClick={onGenerarCompras}>
              <Icon name="shoppingBag" size={20} />
              Generar lista de compras
            </button>
            <button type="button" className="detalle__opinar" onClick={onOpinion}>
              <Icon name="message" size={20} />
              ¿Qué te pareció?
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}