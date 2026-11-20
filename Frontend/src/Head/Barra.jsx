import Icon from './Icon.jsx'
import '../Home/Home.css'

const TABS = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'buscar', label: 'Buscar', icon: 'search' },
  { id: 'guardados', label: 'Guardados', icon: 'bookmark' },
  { id: 'perfil', label: 'Perfil', icon: 'user' },
]

/* Barra superior compartida. `activa` es el id de la pestaña marcada
   (null si ninguna, por ejemplo en el detalle de un plato). */
export default function Barra({ activa = null, onNavegar }) {
  return (
    <header className="home__top">
      <div className="home__top-inner">
        <div className="home__brand">
          <span className="home__logo">
            <Icon name="leaf" size={22} />
          </span>
          PlatoMatch
        </div>

        <nav className="home__nav" aria-label="Principal">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`home__tab ${activa === t.id ? 'home__tab--activa' : ''}`}
              aria-current={activa === t.id ? 'page' : undefined}
              onClick={() => onNavegar?.(t.id)}
            >
              <Icon name={t.icon} size={18} />
              {t.label}
            </button>
          ))}
        </nav>

        <button type="button" className="home__bell" aria-label="Notificaciones">
          <Icon name="bell" size={20} />
          <span className="home__bell-punto" />
        </button>
      </div>
    </header>
  )
}