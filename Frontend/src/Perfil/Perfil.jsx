import { useState } from 'react'
import Barra from '../Head/Barra.jsx'
import Icon from '../Head/Icon.jsx'
import { PLATOS } from '../data/platos.js'
import { puedeAdministrar } from '../services/permisos.js'
import '../Home/Home.css'
import './Perfil.css'

const OPCIONES_ALERGIAS = ['Gluten', 'Lácteos', 'Mariscos', 'Nueces', 'Huevo', 'Soya']
const OPCIONES_CONDICIONES = ['Anemia', 'Diabetes', 'Hipertensión', 'Celiaquía']

function Modal({ titulo, onCerrar, children }) {
  return (
    <div className="perfil__modal-fondo" onMouseDown={onCerrar}>
      <section
        className="perfil__modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="perfil__modal-cabecera">
          <h2>{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export default function Perfil({
  usuario,
  guardados,
  platosDisponibles,
  perfilSalud,
  onGuardarSalud,
  onActualizarUsuario,
  presupuestoBase,
  onGuardarPresupuesto,
  onCompras,
  onAhorro,
  onRecordatorios,
  onNavegar,
  onAdmin,
  onLogout,
}) {
  const [modal, setModal] = useState(null)
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [nombreTemporal, setNombreTemporal] = useState(usuario?.nombre ?? '')
  const [correoTemporal, setCorreoTemporal] = useState(usuario?.email ?? '')
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [errorCuenta, setErrorCuenta] = useState('')
  const [guardandoCuenta, setGuardandoCuenta] = useState(false)
  const [alergiasTemporales, setAlergiasTemporales] = useState([...perfilSalud.alergias])
  const [condicionesTemporales, setCondicionesTemporales] = useState([...perfilSalud.condiciones])
  const [textoAlergia, setTextoAlergia] = useState('')
  const [textoCondicion, setTextoCondicion] = useState('')
  const [presupuestoTemporal, setPresupuestoTemporal] = useState(String(presupuestoBase || ''))

  const precioPromedio =
    PLATOS.length > 0
      ? PLATOS.reduce((total, plato) => total + plato.precio, 0) / PLATOS.length
      : 0
  const alergias = perfilSalud.alergias
  const condiciones = perfilSalud.condiciones
  const alergiasDisponibles = [...new Set([...OPCIONES_ALERGIAS, ...alergiasTemporales])]
  const condicionesDisponibles = [...new Set([...OPCIONES_CONDICIONES, ...condicionesTemporales])]

  const alternarSeleccion = (valor, setSeleccion) => {
    setSeleccion((prev) =>
      prev.includes(valor) ? prev.filter((item) => item !== valor) : [...prev, valor],
    )
  }

  const agregarElemento = (valor, setTexto, setSeleccion, seleccionActual) => {
    const textoLimpio = valor.trim()
    if (!textoLimpio) return

    const normalizado = textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1)
    if (seleccionActual.includes(normalizado)) {
      setTexto('')
      return
    }

    setSeleccion((prev) => [...prev, normalizado])
    setTexto('')
  }

  const abrirEdicionPerfil = () => {
    setNombreTemporal(usuario?.nombre ?? '')
    setCorreoTemporal(usuario?.email ?? '')
    setContrasenaActual('')
    setContrasenaNueva('')
    setErrorCuenta('')
    setModal('nombre')
  }

  const cancelarEdicionPerfil = () => {
    setNombreTemporal(usuario?.nombre ?? '')
    setCorreoTemporal(usuario?.email ?? '')
    setContrasenaActual('')
    setContrasenaNueva('')
    setErrorCuenta('')
    setModal(null)
  }

  const guardarPerfil = async (event) => {
    event.preventDefault()
    setErrorCuenta('')
    const actualizacion = {}
    const nombreActualizado = nombreTemporal.trim()
    const correoActualizado = correoTemporal.trim()

    if (nombreActualizado !== usuario?.nombre) {
      if (!nombreActualizado) {
        setErrorCuenta('El nombre no puede quedar vacío.')
        return
      }
      actualizacion.nombre = nombreActualizado
    }
    if (correoActualizado !== usuario?.email) {
      if (!/^\S+@\S+\.\S+$/.test(correoActualizado)) {
        setErrorCuenta('Ingresa un correo electrónico válido.')
        return
      }
      actualizacion.email = correoActualizado
    }

    if (contrasenaActual || contrasenaNueva) {
      if (!contrasenaActual || !contrasenaNueva) {
        setErrorCuenta('Completa la contraseña actual y la contraseña nueva.')
        return
      }
      actualizacion.contrasenaActual = contrasenaActual
      actualizacion.contrasenaNueva = contrasenaNueva
    }

    if (Object.keys(actualizacion).length === 0) {
      cancelarEdicionPerfil()
      return
    }

    setGuardandoCuenta(true)
    try {
      const usuarioActualizado = await onActualizarUsuario(actualizacion)
      setNombre(usuarioActualizado.nombre)
      setNombreTemporal(usuarioActualizado.nombre)
      setCorreoTemporal(usuarioActualizado.email ?? '')
      setContrasenaActual('')
      setContrasenaNueva('')
      setModal(null)
    } catch (error) {
      setErrorCuenta(error.message || 'No se pudo actualizar el perfil. Inténtalo nuevamente.')
    } finally {
      setGuardandoCuenta(false)
    }
  }

  const guardarSalud = (event) => {
    event.preventDefault()
    onGuardarSalud({
      alergias: alergiasTemporales,
      condiciones: condicionesTemporales,
    })
    setModal(null)
  }

  return (
    <div className="home perfil">
      <Barra activa="perfil" onNavegar={onNavegar} />

      <section className="perfil__portada">
        <div className="perfil__portada-inner">
          <div className="perfil__identidad">
            <div className="perfil__avatar" aria-hidden="true">
              {nombre.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1>{nombre || 'Viajero Saludable'}</h1>
              <p>{usuario?.email ?? 'Sesión de invitado'}</p>
              <span className="perfil__estado">
                <i />
                {alergias.length || condiciones.length
                  ? 'Perfil de salud configurado'
                  : 'Perfil de salud sin configurar'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="perfil__editar"
            onClick={abrirEdicionPerfil}
          >
            <Icon name="user" size={17} />
            Editar perfil
          </button>
          <dl className="perfil__estadisticas">
            <div>
              <dt>{platosDisponibles}</dt>
              <dd>Platos disponibles</dd>
            </div>
            <div>
              <dt>{alergias.length}</dt>
              <dd>Alergias</dd>
            </div>
            <div>
              <dt>{condiciones.length}</dt>
              <dd>Condiciones</dd>
            </div>
            <div>
              <dt>{guardados.length}</dt>
              <dd>Guardados</dd>
            </div>
            <div>
              <dt>{alergias.length || condiciones.length ? 'Listo' : '—'}</dt>
              <dd>Perfil de salud</dd>
            </div>
            <div>
              <dt>S/. {precioPromedio.toFixed(1)}</dt>
              <dd>Gasto promedio</dd>
            </div>
          </dl>
        </div>
      </section>

      <main className="perfil__contenido">
        <div className="perfil__columna">
          <section className="perfil__menu" aria-label="Opciones de cuenta">
            <button type="button" className="perfil__opcion" onClick={onCompras}>
              <span className="perfil__opcion-icono perfil__opcion-icono--verde"><Icon name="shoppingBag" size={19}/></span>
              <span><strong>Lista de compras</strong><small>Marcar ingredientes y exportar TXT</small></span><Icon name="chevron" size={17}/>
            </button>
            <button type="button" className="perfil__opcion" onClick={onAhorro}>
              <span className="perfil__opcion-icono perfil__opcion-icono--amarillo"><Icon name="star" size={19}/></span>
              <span><strong>Mi ahorro</strong><small>Resumen de ahorro potencial</small></span><Icon name="chevron" size={17}/>
            </button>
            <button type="button" className="perfil__opcion" onClick={() => { setPresupuestoTemporal(String(presupuestoBase || '')); setModal('presupuesto') }}>
              <span className="perfil__opcion-icono perfil__opcion-icono--verde"><Icon name="shoppingBag" size={19}/></span>
              <span><strong>Presupuesto base</strong><small>{presupuestoBase ? `S/. ${Number(presupuestoBase).toFixed(2)} para la receta completa` : 'Configurar monto predeterminado'}</small></span><Icon name="chevron" size={17}/>
            </button>
            <button type="button" className="perfil__opcion" onClick={onRecordatorios}>
              <span className="perfil__opcion-icono perfil__opcion-icono--azul">
                <Icon name="bell" size={19} />
              </span>
              <span><strong>Notificaciones</strong><small>Alertas y recordatorios</small></span>
              <Icon name="chevron" size={17} />
            </button>
            <div className="perfil__opcion">
              <span className="perfil__opcion-icono perfil__opcion-icono--amarillo">
                <Icon name="star" size={19} />
              </span>
              <span><strong>Plan Premium</strong><small>Más recetas sin restricciones</small></span>
              <Icon name="chevron" size={17} />
            </div>
            <div className="perfil__opcion">
              <span className="perfil__opcion-icono perfil__opcion-icono--violeta">
                <Icon name="info" size={19} />
              </span>
              <span><strong>Ayuda y soporte</strong><small>Preguntas frecuentes y contacto</small></span>
              <Icon name="chevron" size={17} />
            </div>
          </section>

          {puedeAdministrar(usuario) && <section className="perfil__menu perfil__admin">
            <button type="button" className="perfil__opcion" onClick={onAdmin}>
              <span className="perfil__opcion-icono perfil__opcion-icono--verde">
                <Icon name="users" size={19} />
              </span>
              <span><strong>Panel del administrador</strong><small>Gestión de datos y comentarios</small></span>
              <Icon name="chevron" size={17} />
            </button>
          </section>}

          <button type="button" className="perfil__salir" onClick={onLogout}>
            <Icon name="back" size={19} />
            Cerrar sesión
          </button>
        </div>

        <section className="perfil__salud">
          <div className="perfil__salud-cabecera">
            <h2>
              <span><Icon name="shield" size={18} /></span>
              Perfil de Salud
            </h2>
            <button
              type="button"
              onClick={() => {
                setAlergiasTemporales([...alergias])
                setCondicionesTemporales([...condiciones])
                setModal('salud')
              }}
            >
              <Icon name="user" size={15} />
              Actualizar
            </button>
          </div>
          <div className="perfil__salud-datos">
            <div>
              <h3><Icon name="info" size={16} /> Alergias</h3>
              <p>{alergias.length ? alergias.join(', ') : 'Sin alergias registradas'}</p>
            </div>
            <div>
              <h3><Icon name="shield" size={16} /> Condiciones de salud</h3>
              <p>{condiciones.length ? condiciones.join(', ') : 'Sin condiciones registradas'}</p>
            </div>
          </div>
        </section>
      </main>

      {modal === 'presupuesto' && (
        <Modal titulo="Presupuesto base" onCerrar={() => setModal(null)}>
          <form className="perfil__formulario" onSubmit={(e) => {
            e.preventDefault()
            const monto = presupuestoTemporal.trim()
            if (monto && (!Number.isFinite(Number(monto)) || Number(monto) <= 0)) return
            onGuardarPresupuesto(monto)
            setModal(null)
          }}>
            <label htmlFor="perfil-presupuesto">Presupuesto total habitual para preparar una receta (S/.)</label>
            <input id="perfil-presupuesto" type="number" min="0.01" step="0.01"
              placeholder="Ej. 20.00" value={presupuestoTemporal}
              onChange={(e) => setPresupuestoTemporal(e.target.value)}/>
            <p>Se sugerirá este monto en la búsqueda. Puedes cambiarlo para cada receta o dejarlo vacío.</p>
            <div className="perfil__acciones"><button type="button" className="perfil__accion perfil__accion--secundario" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="perfil__accion perfil__accion--primario">Guardar presupuesto</button></div>
          </form>
        </Modal>
      )}

      {modal === 'nombre' && (
        <Modal titulo="Editar perfil" onCerrar={() => setModal(null)}>
          <form className="perfil__formulario perfil__formulario--cuenta" onSubmit={guardarPerfil}>
            <label htmlFor="perfil-nombre">Nombre</label>
            <input
              id="perfil-nombre"
              type="text"
              autoComplete="name"
              value={nombreTemporal}
              onChange={(event) => setNombreTemporal(event.target.value)}
              autoFocus
            />
            <label htmlFor="perfil-correo">Correo electrónico</label>
            <input
              id="perfil-correo"
              type="email"
              autoComplete="email"
              value={correoTemporal}
              onChange={(event) => setCorreoTemporal(event.target.value)}
              disabled={!usuario?.email}
            />
            <p className="perfil__ayuda-cuenta">
              Deja tus datos como están si no quieres modificarlos.
            </p>
            <div className="perfil__separador-cuenta">
              <h3>Cambiar contraseña</h3>
              <p>Es opcional. Si no la cambias, deja ambos campos vacíos.</p>
            </div>
            <label htmlFor="perfil-contrasena-actual">Contraseña actual</label>
            <input
              id="perfil-contrasena-actual"
              type="password"
              autoComplete="current-password"
              value={contrasenaActual}
              onChange={(event) => setContrasenaActual(event.target.value)}
              disabled={!usuario?.email}
            />
            <label htmlFor="perfil-contrasena-nueva">Contraseña nueva</label>
            <input
              id="perfil-contrasena-nueva"
              type="password"
              autoComplete="new-password"
              value={contrasenaNueva}
              onChange={(event) => setContrasenaNueva(event.target.value)}
              disabled={!usuario?.email}
            />
            <small>La nueva contraseña debe tener al menos 8 caracteres, una letra y un número.</small>
            {!usuario?.email && (
              <p className="perfil__ayuda-cuenta">Inicia sesión con una cuenta para editar el correo o la contraseña.</p>
            )}
            {errorCuenta && <p className="perfil__error-cuenta" role="alert">{errorCuenta}</p>}
            <div className="perfil__acciones perfil__acciones--cuenta">
              <button
                type="button"
                className="perfil__accion perfil__accion--secundario"
                onClick={cancelarEdicionPerfil}
                disabled={guardandoCuenta}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="perfil__accion perfil__accion--primario"
                disabled={guardandoCuenta}
              >
                {guardandoCuenta ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'salud' && (
        <Modal titulo="Perfil de Salud" onCerrar={() => setModal(null)}>
          <form className="perfil__formulario perfil__formulario--salud" onSubmit={guardarSalud}>
            <div className="perfil__salud-selector">
              <div className="perfil__selector-columna">
                <h3>Alergias</h3>
                <div className="perfil__input-agregar">
                  <input
                    type="text"
                    value={textoAlergia}
                    onChange={(event) => setTextoAlergia(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        agregarElemento(textoAlergia, setTextoAlergia, setAlergiasTemporales, alergiasTemporales)
                      }
                    }}
                    placeholder="Añade una alergia"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      agregarElemento(textoAlergia, setTextoAlergia, setAlergiasTemporales, alergiasTemporales)
                    }
                  >
                    Agregar
                  </button>
                </div>
                <div className="perfil__lista-opciones">
                  {alergiasDisponibles.map((alergia) => (
                    <label key={alergia} className="perfil__check-item">
                      <input
                        type="checkbox"
                        checked={alergiasTemporales.includes(alergia)}
                        onChange={() => alternarSeleccion(alergia, setAlergiasTemporales)}
                      />
                      <span>{alergia}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="perfil__selector-columna">
                <h3>Condiciones</h3>
                <div className="perfil__input-agregar">
                  <input
                    type="text"
                    value={textoCondicion}
                    onChange={(event) => setTextoCondicion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        agregarElemento(
                          textoCondicion,
                          setTextoCondicion,
                          setCondicionesTemporales,
                          condicionesTemporales,
                        )
                      }
                    }}
                    placeholder="Añade una condición"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      agregarElemento(
                        textoCondicion,
                        setTextoCondicion,
                        setCondicionesTemporales,
                        condicionesTemporales,
                      )
                    }
                  >
                    Agregar
                  </button>
                </div>
                <div className="perfil__lista-opciones">
                  {condicionesDisponibles.map((condicion) => (
                    <label key={condicion} className="perfil__check-item">
                      <input
                        type="checkbox"
                        checked={condicionesTemporales.includes(condicion)}
                        onChange={() => alternarSeleccion(condicion, setCondicionesTemporales)}
                      />
                      <span>{condicion}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="perfil__acciones">
              <button type="button" className="perfil__accion perfil__accion--secundario" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="submit" className="perfil__accion perfil__accion--primario">
                Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}