
import { useEffect, useState } from 'react'
import Barra from '../Head/Barra.jsx'
import Icon from '../Head/Icon.jsx'
import { PLATOS } from '../data/platos.js'
import { puedeAdministrar } from '../services/permisos.js'

import '../Home/Home.css'
import './Perfil.css'

const OPCIONES_ALERGIAS = [
  'Gluten',
  'Lácteos',
  'Mariscos',
  'Nueces',
  'Huevo',
  'Soya',
]

const OPCIONES_CONDICIONES = [
  'Anemia',
  'Diabetes',
  'Hipertensión',
  'Celiaquía',
]

function Modal({
  titulo,
  onCerrar,
  children,
  bloqueado = false,
}) {
  return (
    <div
      className="perfil__modal-fondo"
      onMouseDown={() => {
        if (!bloqueado) onCerrar()
      }}
    >
      <section
        className="perfil__modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="perfil__modal-cabecera">
          <h2>{titulo}</h2>

          <button
            type="button"
            onClick={onCerrar}
            disabled={bloqueado}
            aria-label="Cerrar"
          >
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
  guardados = [],
  platosDisponibles = 0,
  perfilSalud = { alergias: [], condiciones: [] },
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

  // Datos de cuenta
  const [nombre, setNombre] = useState(
    usuario?.nombre ?? ''
  )

  const [nombreTemporal, setNombreTemporal] = useState(
    usuario?.nombre ?? ''
  )

  const [correoTemporal, setCorreoTemporal] = useState(
    usuario?.email ?? ''
  )

  const [contrasenaActual, setContrasenaActual] =
    useState('')

  const [contrasenaNueva, setContrasenaNueva] =
    useState('')

  const [errorCuenta, setErrorCuenta] = useState('')
  const [guardandoCuenta, setGuardandoCuenta] =
    useState(false)

  // Salud
  const [alergiasTemporales, setAlergiasTemporales] =
    useState([...(perfilSalud.alergias || [])])

  const [condicionesTemporales, setCondicionesTemporales] =
    useState([...(perfilSalud.condiciones || [])])

  const [textoAlergia, setTextoAlergia] = useState('')
  const [textoCondicion, setTextoCondicion] =
    useState('')

  // Presupuesto
  const [presupuestoTemporal, setPresupuestoTemporal] =
    useState(String(presupuestoBase ?? ''))

  // HU-19: Control de persistencia
  const [guardandoPreferencias, setGuardandoPreferencias] =
    useState(false)

  const [errorPreferencias, setErrorPreferencias] =
    useState('')

  const [mensajePreferencias, setMensajePreferencias] =
    useState('')

  useEffect(() => {
    setNombre(usuario?.nombre ?? '')
  }, [usuario?.nombre])

  const alergias = perfilSalud.alergias || []
  const condiciones = perfilSalud.condiciones || []

  const alergiasDisponibles = [
    ...new Set([
      ...OPCIONES_ALERGIAS,
      ...alergiasTemporales,
    ]),
  ]

  const condicionesDisponibles = [
    ...new Set([
      ...OPCIONES_CONDICIONES,
      ...condicionesTemporales,
    ]),
  ]

  const precioPromedio = PLATOS.length > 0
    ? PLATOS.reduce(
        (total, plato) => total + Number(plato.precio || 0),
        0
      ) / PLATOS.length
    : 0

  const alternarSeleccion = (valor, setSeleccion) => {
    setSeleccion((prev) =>
      prev.includes(valor)
        ? prev.filter((item) => item !== valor)
        : [...prev, valor]
    )
  }

  const agregarElemento = (
    valor,
    setTexto,
    setSeleccion
  ) => {
    const texto = valor.trim()

    if (!texto) return

    const normalizado =
      texto.charAt(0).toUpperCase() + texto.slice(1)

    setSeleccion((prev) => {
      const existe = prev.some(
        (item) =>
          item.toLowerCase() === normalizado.toLowerCase()
      )

      return existe
        ? prev
        : [...prev, normalizado]
    })

    setTexto('')
  }

  const abrirEdicionPerfil = () => {
    setNombreTemporal(usuario?.nombre ?? '')
    setCorreoTemporal(usuario?.email ?? '')
    setContrasenaActual('')
    setContrasenaNueva('')
    setErrorCuenta('')
    setMensajePreferencias('')
    setModal('nombre')
  }

  const cancelarEdicionPerfil = () => {
    if (guardandoCuenta) return

    setNombreTemporal(usuario?.nombre ?? '')
    setCorreoTemporal(usuario?.email ?? '')
    setContrasenaActual('')
    setContrasenaNueva('')
    setErrorCuenta('')
    setModal(null)
  }

  const abrirSalud = () => {
    setAlergiasTemporales([...alergias])
    setCondicionesTemporales([...condiciones])
    setTextoAlergia('')
    setTextoCondicion('')
    setErrorPreferencias('')
    setMensajePreferencias('')
    setModal('salud')
  }

  const abrirPresupuesto = () => {
    setPresupuestoTemporal(
      String(presupuestoBase ?? '')
    )

    setErrorPreferencias('')
    setMensajePreferencias('')
    setModal('presupuesto')
  }

  // Guardar datos básicos de la cuenta.
  const guardarPerfil = async (event) => {
    event.preventDefault()

    setErrorCuenta('')

    const actualizacion = {}

    const nuevoNombre = nombreTemporal.trim()
    const nuevoCorreo = correoTemporal.trim()

    if (nuevoNombre !== (usuario?.nombre ?? '')) {
      if (!nuevoNombre) {
        setErrorCuenta(
          'El nombre no puede quedar vacío.'
        )
        return
      }

      actualizacion.nombre = nuevoNombre
    }

    if (nuevoCorreo !== (usuario?.email ?? '')) {
      if (!/^\S+@\S+\.\S+$/.test(nuevoCorreo)) {
        setErrorCuenta(
          'Ingresa un correo electrónico válido.'
        )
        return
      }

      actualizacion.email = nuevoCorreo
    }

    if (contrasenaActual || contrasenaNueva) {
      if (!contrasenaActual || !contrasenaNueva) {
        setErrorCuenta(
          'Completa ambas contraseñas.'
        )
        return
      }

      if (
        contrasenaNueva.length < 8 ||
        !/[A-Za-z]/.test(contrasenaNueva) ||
        !/[0-9]/.test(contrasenaNueva)
      ) {
        setErrorCuenta(
          'La nueva contraseña necesita al menos ' +
          '8 caracteres, una letra y un número.'
        )
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
      const actualizado =
        await onActualizarUsuario(actualizacion)

      setNombre(actualizado.nombre)
      setNombreTemporal(actualizado.nombre)
      setCorreoTemporal(actualizado.email ?? '')
      setContrasenaActual('')
      setContrasenaNueva('')

      setModal(null)
      setMensajePreferencias(
        'Los datos de tu cuenta se actualizaron.'
      )
    } catch (error) {
      setErrorCuenta(
        error.message ||
        'No se pudieron actualizar los datos.'
      )
    } finally {
      setGuardandoCuenta(false)
    }
  }

  // HU-19: Guardar alergias y condiciones en SQL Server.
  const guardarSalud = async (event) => {
    event.preventDefault()

    setErrorPreferencias('')
    setMensajePreferencias('')

    const limpiar = (valores) => [
      ...new Set(
        valores.map((v) => v.trim()).filter(Boolean)
      ),
    ]

    const nuevasAlergias = limpiar(alergiasTemporales)
    const nuevasCondiciones = limpiar(
      condicionesTemporales
    )

    const todos = [
      ...nuevasAlergias,
      ...nuevasCondiciones,
    ]

    if (todos.some((valor) => valor.length > 100)) {
      setErrorPreferencias(
        'Cada restricción debe tener ' +
        'como máximo 100 caracteres.'
      )
      return
    }

    if (todos.some((valor) => valor.includes(','))) {
      setErrorPreferencias(
        'No utilices comas dentro de ' +
        'los nombres de las restricciones.'
      )
      return
    }

    setGuardandoPreferencias(true)

    try {
      await onGuardarSalud({
        alergias: nuevasAlergias,
        condiciones: nuevasCondiciones,
      })

      setModal(null)

      setMensajePreferencias(
        'Tus alergias y condiciones se ' +
        'guardaron correctamente.'
      )
    } catch (error) {
      setErrorPreferencias(
        error.message ||
        'No se pudo guardar el perfil de salud.'
      )
    } finally {
      setGuardandoPreferencias(false)
    }
  }

  // HU-19: Guardar presupuesto en SQL Server.
  const guardarPresupuesto = async (event) => {
    event.preventDefault()

    setErrorPreferencias('')
    setMensajePreferencias('')

    const texto = presupuestoTemporal.trim()
    const monto = Number(texto)

    if (
      !texto ||
      !Number.isFinite(monto) ||
      monto < 0.01 ||
      monto > 1000
    ) {
      setErrorPreferencias(
        'Ingresa un presupuesto entre ' +
        'S/ 0.01 y S/ 1000.'
      )
      return
    }

    setGuardandoPreferencias(true)

    try {
      await onGuardarPresupuesto(monto)

      setModal(null)

      setMensajePreferencias(
        'Tu presupuesto se guardó correctamente.'
      )
    } catch (error) {
      setErrorPreferencias(
        error.message ||
        'No se pudo actualizar el presupuesto.'
      )
    } finally {
      setGuardandoPreferencias(false)
    }
  }

  return (
    <div className="home perfil">
      <Barra
        activa="perfil"
        onNavegar={onNavegar}
      />

      {/* Confirmación después de guardar */}
      {mensajePreferencias && (
        <div
          role="status"
          style={{
            margin: '14px auto',
            maxWidth: 1100,
            background: '#dcfce7',
            color: '#166534',
            padding: 14,
            border: '1px solid #86efac',
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          ✓ {mensajePreferencias}
        </div>
      )}

      {/* Portada */}
      <section className="perfil__portada">
        <div className="perfil__portada-inner">
          <div className="perfil__identidad">
            <div
              className="perfil__avatar"
              aria-hidden="true"
            >
              {nombre.charAt(0).toUpperCase() || 'U'}
            </div>

            <div>
              <h1>{nombre || 'Viajero Saludable'}</h1>

              <p>
                {usuario?.email ??
                  'Sesión de invitado'}
              </p>

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
              <dt>
                {alergias.length || condiciones.length
                  ? 'Listo'
                  : '—'}
              </dt>
              <dd>Perfil de salud</dd>
            </div>

            <div>
              <dt>S/. {precioPromedio.toFixed(1)}</dt>
              <dd>Gasto promedio referencial</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Contenido principal */}
      <main className="perfil__contenido">
        <div className="perfil__columna">
          <section
            className="perfil__menu"
            aria-label="Opciones de cuenta"
          >
            <button
              type="button"
              className="perfil__opcion"
              onClick={onCompras}
            >
              <span className="perfil__opcion-icono perfil__opcion-icono--verde">
                <Icon name="shoppingBag" size={19} />
              </span>

              <span>
                <strong>Lista de compras</strong>
                <small>
                  Marcar ingredientes y exportar TXT
                </small>
              </span>

              <Icon name="chevron" size={17} />
            </button>

            <button
              type="button"
              className="perfil__opcion"
              onClick={onAhorro}
            >
              <span className="perfil__opcion-icono perfil__opcion-icono--amarillo">
                <Icon name="star" size={19} />
              </span>

              <span>
                <strong>Mi ahorro</strong>
                <small>
                  Gastos y ahorro comparativo
                </small>
              </span>

              <Icon name="chevron" size={17} />
            </button>

            <button
              type="button"
              className="perfil__opcion"
              onClick={abrirPresupuesto}
            >
              <span className="perfil__opcion-icono perfil__opcion-icono--verde">
                <Icon name="shoppingBag" size={19} />
              </span>

              <span>
                <strong>Presupuesto base</strong>
                <small>
                  {presupuestoBase
                    ? `S/. ${Number(presupuestoBase).toFixed(2)}`
                    : 'Configurar presupuesto'}
                </small>
              </span>

              <Icon name="chevron" size={17} />
            </button>

            <button
              type="button"
              className="perfil__opcion"
              onClick={onRecordatorios}
            >
              <span className="perfil__opcion-icono perfil__opcion-icono--azul">
                <Icon name="bell" size={19} />
              </span>

              <span>
                <strong>Notificaciones</strong>
                <small>
                  Configurar recordatorio de comidas
                </small>
              </span>

              <Icon name="chevron" size={17} />
            </button>

            <div className="perfil__opcion">
              <span className="perfil__opcion-icono perfil__opcion-icono--amarillo">
                <Icon name="star" size={19} />
              </span>

              <span>
                <strong>Plan Premium</strong>
                <small>Más recetas sin restricciones</small>
              </span>

              <Icon name="chevron" size={17} />
            </div>

            <div className="perfil__opcion">
              <span className="perfil__opcion-icono perfil__opcion-icono--violeta">
                <Icon name="info" size={19} />
              </span>

              <span>
                <strong>Ayuda y soporte</strong>
                <small>Preguntas frecuentes y contacto</small>
              </span>

              <Icon name="chevron" size={17} />
            </div>
          </section>

          {puedeAdministrar(usuario) && (
            <section className="perfil__menu perfil__admin">
              <button
                type="button"
                className="perfil__opcion"
                onClick={onAdmin}
              >
                <span className="perfil__opcion-icono perfil__opcion-icono--verde">
                  <Icon name="users" size={19} />
                </span>

                <span>
                  <strong>Panel del administrador</strong>
                  <small>
                    Gestión de datos y comentarios
                  </small>
                </span>

                <Icon name="chevron" size={17} />
              </button>
            </section>
          )}

          <button
            type="button"
            className="perfil__salir"
            onClick={onLogout}
          >
            <Icon name="back" size={19} />
            Cerrar sesión
          </button>
        </div>

        {/* Perfil de salud */}
        <section className="perfil__salud">
          <div className="perfil__salud-cabecera">
            <h2>
              <span>
                <Icon name="shield" size={18} />
              </span>
              Perfil de Salud
            </h2>

            <button
              type="button"
              onClick={abrirSalud}
            >
              <Icon name="user" size={15} />
              Actualizar
            </button>
          </div>

          <div className="perfil__salud-datos">
            <div>
              <h3>
                <Icon name="info" size={16} />
                Alergias
              </h3>

              <p>
                {alergias.length
                  ? alergias.join(', ')
                  : 'Sin alergias registradas'}
              </p>
            </div>

            <div>
              <h3>
                <Icon name="shield" size={16} />
                Condiciones de salud
              </h3>

              <p>
                {condiciones.length
                  ? condiciones.join(', ')
                  : 'Sin condiciones registradas'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL PRESUPUESTO */}
      {modal === 'presupuesto' && (
        <Modal
          titulo="Presupuesto base"
          bloqueado={guardandoPreferencias}
          onCerrar={() => setModal(null)}
        >
          <form
            className="perfil__formulario"
            onSubmit={guardarPresupuesto}
          >
            <label htmlFor="perfil-presupuesto">
              Presupuesto habitual por receta (S/.)
            </label>

            <input
              id="perfil-presupuesto"
              type="number"
              min="0.01"
              max="1000"
              step="0.01"
              required
              placeholder="Ej. 20.00"
              value={presupuestoTemporal}
              onChange={(e) =>
                setPresupuestoTemporal(e.target.value)
              }
            />

            <p>
              Este monto se utilizará como referencia
              en las búsquedas de recetas.
            </p>

            {errorPreferencias && (
              <p
                role="alert"
                style={{ color: '#b91c1c' }}
              >
                {errorPreferencias}
              </p>
            )}

            <div className="perfil__acciones">
              <button
                type="button"
                className="perfil__accion perfil__accion--secundario"
                disabled={guardandoPreferencias}
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="perfil__accion perfil__accion--primario"
                disabled={guardandoPreferencias}
              >
                {guardandoPreferencias
                  ? 'Guardando...'
                  : 'Guardar presupuesto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL CUENTA */}
      {modal === 'nombre' && (
        <Modal
          titulo="Editar perfil"
          bloqueado={guardandoCuenta}
          onCerrar={cancelarEdicionPerfil}
        >
          <form
            className="perfil__formulario perfil__formulario--cuenta"
            onSubmit={guardarPerfil}
          >
            <label htmlFor="perfil-nombre">
              Nombre
            </label>

            <input
              id="perfil-nombre"
              type="text"
              autoComplete="name"
              required
              value={nombreTemporal}
              onChange={(e) =>
                setNombreTemporal(e.target.value)
              }
            />

            <label htmlFor="perfil-correo">
              Correo electrónico
            </label>

            <input
              id="perfil-correo"
              type="email"
              autoComplete="email"
              value={correoTemporal}
              onChange={(e) =>
                setCorreoTemporal(e.target.value)
              }
              disabled={!usuario?.email}
            />

            <p className="perfil__ayuda-cuenta">
              Deja los datos como están si no
              deseas modificarlos.
            </p>

            <div className="perfil__separador-cuenta">
              <h3>Cambiar contraseña</h3>
              <p>
                Es opcional. Deja ambos campos
                vacíos para mantener la actual.
              </p>
            </div>

            <label htmlFor="perfil-contrasena-actual">
              Contraseña actual
            </label>

            <input
              id="perfil-contrasena-actual"
              type="password"
              autoComplete="current-password"
              value={contrasenaActual}
              onChange={(e) =>
                setContrasenaActual(e.target.value)
              }
              disabled={!usuario?.email}
            />

            <label htmlFor="perfil-contrasena-nueva">
              Contraseña nueva
            </label>

            <input
              id="perfil-contrasena-nueva"
              type="password"
              autoComplete="new-password"
              value={contrasenaNueva}
              onChange={(e) =>
                setContrasenaNueva(e.target.value)
              }
              disabled={!usuario?.email}
            />

            <small>
              Mínimo 8 caracteres, una letra y un número.
            </small>

            {errorCuenta && (
              <p
                role="alert"
                className="perfil__error-cuenta"
              >
                {errorCuenta}
              </p>
            )}

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
                {guardandoCuenta
                  ? 'Guardando...'
                  : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL SALUD */}
      {modal === 'salud' && (
        <Modal
          titulo="Perfil de Salud"
          bloqueado={guardandoPreferencias}
          onCerrar={() => setModal(null)}
        >
          <form
            className="perfil__formulario perfil__formulario--salud"
            onSubmit={guardarSalud}
          >
            <div className="perfil__salud-selector">
              {/* ALERGIAS */}
              <div className="perfil__selector-columna">
                <h3>Alergias</h3>

                <div className="perfil__input-agregar">
                  <input
                    type="text"
                    value={textoAlergia}
                    onChange={(e) =>
                      setTextoAlergia(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()

                        agregarElemento(
                          textoAlergia,
                          setTextoAlergia,
                          setAlergiasTemporales
                        )
                      }
                    }}
                    placeholder="Añade una alergia"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      agregarElemento(
                        textoAlergia,
                        setTextoAlergia,
                        setAlergiasTemporales
                      )
                    }
                  >
                    Agregar
                  </button>
                </div>

                <div className="perfil__lista-opciones">
                  {alergiasDisponibles.map((alergia) => (
                    <label
                      key={alergia}
                      className="perfil__check-item"
                    >
                      <input
                        type="checkbox"
                        checked={alergiasTemporales.includes(
                          alergia
                        )}
                        onChange={() =>
                          alternarSeleccion(
                            alergia,
                            setAlergiasTemporales
                          )
                        }
                      />
                      <span>{alergia}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CONDICIONES */}
              <div className="perfil__selector-columna">
                <h3>Condiciones</h3>

                <div className="perfil__input-agregar">
                  <input
                    type="text"
                    value={textoCondicion}
                    onChange={(e) =>
                      setTextoCondicion(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()

                        agregarElemento(
                          textoCondicion,
                          setTextoCondicion,
                          setCondicionesTemporales
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
                        setCondicionesTemporales
                      )
                    }
                  >
                    Agregar
                  </button>
                </div>

                <div className="perfil__lista-opciones">
                  {condicionesDisponibles.map(
                    (condicion) => (
                      <label
                        key={condicion}
                        className="perfil__check-item"
                      >
                        <input
                          type="checkbox"
                          checked={condicionesTemporales.includes(
                            condicion
                          )}
                          onChange={() =>
                            alternarSeleccion(
                              condicion,
                              setCondicionesTemporales
                            )
                          }
                        />

                        <span>{condicion}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>

            {errorPreferencias && (
              <p
                role="alert"
                style={{
                  color: '#b91c1c',
                  fontWeight: 600,
                }}
              >
                {errorPreferencias}
              </p>
            )}

            <div className="perfil__acciones">
              <button
                type="button"
                className="perfil__accion perfil__accion--secundario"
                disabled={guardandoPreferencias}
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="perfil__accion perfil__accion--primario"
                disabled={guardandoPreferencias}
              >
                {guardandoPreferencias
                  ? 'Guardando...'
                  : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
