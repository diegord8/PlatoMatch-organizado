import { useState } from 'react'
import './Login.css'

import { DEMO_EMAIL, DEMO_HABILITADO, DEMO_PASSWORD } from '../services/demo.js'

const FEATURES = [
  { icon: 'shield', text: 'Filtros para alergias y condiciones médicas' },
  { icon: 'trend', text: 'Recomendaciones dentro de tu presupuesto' },
  { icon: 'heart', text: 'Perfil nutricional personalizado' },
]

const STATS = [
  { value: 'Más de 5000', label: 'Usuarios' },
  { value: '48', label: 'Platos' },
  { value: 'S/. 3', label: 'Desde' },
]

/* Iconos en SVG para no instalar ninguna librería */
function Icon({ name, size = 20 }) {
  const paths = {
    leaf: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </>
    ),
    shield: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    trend: (
      <>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </>
    ),
    heart: (
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    ),
    eye: (
      <>
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
        <path d="m2 2 20 20" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand__logo">
        <Icon name="leaf" size={28} />
      </span>
      <div>
        <p className="brand__name">PlatoMatch</p>
        <p className="brand__tagline">Come bien, gasta menos</p>
      </div>
    </div>
  )
}

export default function Login({ onLogin, onGuest, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('El correo no tiene un formato válido.')
      return
    }

    setCargando(true)
    try {
      const resultado = await onLogin?.({ email: email.trim(), password })
      if (!resultado) {
        setError('Correo o contraseña incorrectos.')
      } else {
        setError('')
      }
    } catch (errorAutenticacion) {
      setError(errorAutenticacion.message || 'No se pudo iniciar sesión. Inténtalo nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="login">
      <aside className="login__aside">
        <Brand />

        <div className="login__pitch">
          <h1 className="login__headline">
            Come bien,
            <span>gasta menos</span>
          </h1>
          <p className="login__lead">
            Encuentra opciones de comida saludable y económica adaptadas a tu
            perfil de salud y presupuesto diario.
          </p>
          <ul className="login__features">
            {FEATURES.map((f) => (
              <li key={f.text}>
                <span className="login__feature-icon">
                  <Icon name={f.icon} size={20} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <dl className="login__stats">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt>{s.value}</dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <section className="login__panel">
        <div className="login__card">
          <div className="login__mobile-brand">
            <Brand />
          </div>

          <h2 className="login__title">Bienvenido de vuelta</h2>
          <p className="login__subtitle">
            Inicia sesión para acceder a tus recomendaciones
          </p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <div className="field__row">
                <label htmlFor="password">Contraseña</label>
                <a href="#recuperar" className="link link--small">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="field__password">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={22} />
                </button>
              </div>
            </div>

            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn--primary" disabled={cargando}>
              {cargando ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="divider">
            <span>o continúa con</span>
          </div>

          <button type="button" className="btn btn--ghost" onClick={() => onGuest?.()}>
            Entrar como invitado
          </button>

          <p className="login__register">
            ¿No tienes cuenta?{' '}
            <a
              href="#registro"
              className="link"
              onClick={(e) => {
                e.preventDefault()
                onRegister?.()
              }}
            >
              Regístrate aquí
            </a>
          </p>

          {DEMO_HABILITADO && <p className="login__demo">
            <strong>Demostración:</strong> usa <code>{DEMO_EMAIL}</code> /{' '}
            <code>{DEMO_PASSWORD}</code>
          </p>}
        </div>
      </section>
    </main>
  )
}