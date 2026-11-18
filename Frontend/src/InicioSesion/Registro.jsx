import { useState } from 'react'
import Icon from '../Head/Icon.jsx'
import './Registro.css'

const ALERGIAS = ['Gluten', 'Lácteos', 'Mariscos', 'Nueces', 'Huevo', 'Soya']
const CONDICIONES = ['Anemia', 'Diabetes', 'Hipertensión', 'Celiaquía']

function Marca() {
  return (
    <div className="registro__marca">
      <span><Icon name="leaf" size={23} /></span>
      <strong>PlatoMatch</strong>
    </div>
  )
}

function Ojo({ visible }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible && <path d="m3 3 18 18" />}
    </svg>
  )
}

export default function Registro({ onVolver, onCrearCuenta }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [alergias, setAlergias] = useState([])
  const [condiciones, setCondiciones] = useState([])
  const [sinAlergias, setSinAlergias] = useState(false)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)

  const alternarOpcion = (opcion, seleccionadas, setSeleccionadas) => {
    setSeleccionadas((actuales) =>
      actuales.includes(opcion)
        ? actuales.filter((item) => item !== opcion)
        : [...actuales, opcion],
    )
  }

  const continuar = async (event) => {
    event.preventDefault()
    if (!nombre.trim()) { setError('Ingresa tu nombre completo.'); return }
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) { setError('Ingresa un correo electrónico válido.'); return }
    if (contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
      setError('La contraseña debe tener al menos 8 caracteres e incluir una letra y un número.')
      return
    }
    try {
      const resp = await fetch(
        `http://localhost:5116/api/Usuarios/existe-correo?correo=${encodeURIComponent(correo.trim())}`
      )
      if (resp.ok) {
        const data = await resp.json()
        if (data.existe) {
          setError('Este correo electrónico ya está registrado. Inicia sesión o usa otro.')
          return
        }
      }
    } catch (err) {
      console.warn('No se pudo verificar el correo en línea:', err)
    }

    setError('')
    setPaso(2)
  }


  const crearCuenta = async () => {
    setCreando(true)
    setError('')
    try {
      await onCrearCuenta({
        nombre: nombre.trim(),
        email: correo.trim(),
        password: contrasena,
        perfilSalud: { alergias: sinAlergias ? [] : alergias, condiciones },
      })
    } catch (errorRegistro) {
      setError(errorRegistro.message || 'No se pudo crear la cuenta. Inténtalo nuevamente.')
    } finally {
      setCreando(false)
    }
  }

  return (
    <main className={`registro registro--paso-${paso}`}>
      <header className="registro__cabecera">
        <div className="registro__cabecera-inner">
          <Marca />
          <h1>{paso === 1 ? 'Crea tu cuenta' : 'Tu perfil de salud'}</h1>
          <p>{paso === 1 ? 'Empieza a comer mejor con tu presupuesto' : 'Personaliza tus recomendaciones'}</p>
          <div className="registro__progreso" aria-label={`Paso ${paso} de 2`}>
            <span className={paso >= 1 ? 'activo' : ''} />
            <span className={paso >= 2 ? 'activo' : ''} />
          </div>
          <small>Paso {paso} de 2</small>
        </div>
      </header>

      <section className="registro__cuerpo">
        {paso === 1 ? (
          <form className="registro__tarjeta registro__formulario" onSubmit={continuar} noValidate>
            <label htmlFor="registro-nombre">Nombre completo <b>*</b></label>
            <input
              id="registro-nombre"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej: María García"
            />

            <div className="registro__campos-cuenta">
              <div>
                <label htmlFor="registro-correo">Correo electrónico <b>*</b></label>
                <input
                  id="registro-correo"
                  type="email"
                  autoComplete="email"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div>
                <label htmlFor="registro-contrasena">Contraseña <b>*</b></label>
                <div className="registro__contrasena">
                  <input
                    id="registro-contrasena"
                    type={mostrarContrasena ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={contrasena}
                    onChange={(event) => setContrasena(event.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContrasena((visible) => !visible)}
                    aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Ojo visible={mostrarContrasena} />
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="registro__error" role="alert">{error}</p>}
            <button className="registro__boton" type="submit">
              Continuar <Icon name="chevron" size={19} />
            </button>
            <p className="registro__enlace">
              ¿Ya tienes cuenta? <button type="button" onClick={onVolver}>Inicia sesión aquí</button>
            </p>
          </form>
        ) : (
          <section className="registro__tarjeta registro__salud">
            <div className="registro__selecciones">
              <section className="registro__grupo registro__grupo--alergias">
                <header>
                  <h2><span aria-hidden="true" />Alergias alimentarias</h2>
                  <p>Selecciona las que apliquen a ti</p>
                </header>
                <div className="registro__opciones registro__opciones--dos-columnas">
                  {ALERGIAS.map((alergia) => (
                    <label className="registro__opcion" key={alergia}>
                      <input
                        type="checkbox"
                        checked={!sinAlergias && alergias.includes(alergia)}
                        disabled={sinAlergias}
                        onChange={() => alternarOpcion(alergia, alergias, setAlergias)}
                      />
                      <span>{alergia}</span>
                    </label>
                  ))}
                </div>
                <label className="registro__opcion registro__opcion--sin-alergias">
                  <input
                    type="checkbox"
                    checked={sinAlergias}
                    onChange={(event) => {
                      setSinAlergias(event.target.checked)
                      if (event.target.checked) setAlergias([])
                    }}
                  />
                  <span>No presento alergias alimentarias</span>
                </label>
              </section>

              <section className="registro__grupo registro__grupo--condiciones">
                <header>
                  <h2><span aria-hidden="true">✚</span>Condiciones de salud</h2>
                  <p>Para adaptar mejor tus recomendaciones</p>
                </header>
                <div className="registro__opciones">
                  {CONDICIONES.map((condicion) => (
                    <label className="registro__opcion" key={condicion}>
                      <input
                        type="checkbox"
                        checked={condiciones.includes(condicion)}
                        onChange={() => alternarOpcion(condicion, condiciones, setCondiciones)}
                      />
                      <span>{condicion}</span>
                      {condicion === 'Anemia' && <small>+ Hierro</small>}
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="registro__acciones">
              {error && <p className="registro__error" role="alert">{error}</p>}
              <button className="registro__boton" type="button" onClick={crearCuenta} disabled={creando}>
                {creando ? 'Creando cuenta...' : <>Crear mi cuenta <Icon name="chevron" size={19} /></>}
              </button>
              <button className="registro__omitir" type="button" onClick={crearCuenta} disabled={creando}>
                Omitir por ahora
              </button>
            </div>
            <p className="registro__enlace">
              ¿Ya tienes cuenta? <button type="button" onClick={onVolver}>Inicia sesión aquí</button>
            </p>
          </section>
        )}
      </section>
    </main>
  )
}
