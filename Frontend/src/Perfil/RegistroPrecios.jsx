import { useState } from 'react'
import Icon from '../Head/Icon.jsx'
import { clasificarProducto, MERCADOS } from './precios.js'
import './RegistroPrecios.css'

function fechaHoy() {
  const fecha = new Date()
  const zonaHoraria = fecha.getTimezoneOffset() * 60000
  return new Date(fecha.getTime() - zonaHoraria).toISOString().slice(0, 10)
}

function fechaVisible(fecha) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export default function RegistroPrecios({
  entradasRegistradas,
  onRegistrarPrecio,
  onActualizarPresentacion,
  onVolver,
}) {
  const entradas = entradasRegistradas
  const [producto, setProducto] = useState('')
  const [precio, setPrecio] = useState('')
  const [cantidadPrecio, setCantidadPrecio] = useState('1')
  const [unidadPrecio, setUnidadPrecio] = useState('')
  const [fecha, setFecha] = useState(fechaHoy)
  const [mercado, setMercado] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [indiceEdicion, setIndiceEdicion] = useState(null)
  const [cantidadEdicion, setCantidadEdicion] = useState('1')
  const [unidadEdicion, setUnidadEdicion] = useState('')

  const registrarPrecio = (event) => {
    event.preventDefault()
    const precioNumerico = Number(precio)
    if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
      setMensaje('Ingresa un precio mayor que S/. 0.')
      return
    }
    const cantidadNumerica = Number(cantidadPrecio)
    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      setMensaje('Ingresa una cantidad de presentación mayor que 0.')
      return
    }
    if (!unidadPrecio) {
      setMensaje('Selecciona la unidad de la presentación del precio.')
      return
    }

    const nombreNormalizado = producto.trim().toLocaleLowerCase('es-PE')
    const nombreProducto =
      nombreNormalizado.charAt(0).toLocaleUpperCase('es-PE') + nombreNormalizado.slice(1)

    onRegistrarPrecio({
      producto: nombreProducto,
      precio: precioNumerico,
      cantidadPrecio: cantidadNumerica,
      unidadPrecio,
      mercado,
      tendencia: 'nuevo',
      fecha: fechaVisible(fechaHoy()),
    })
    setProducto('')
    setPrecio('')
    setCantidadPrecio('1')
    setUnidadPrecio('')
    setFecha(fechaHoy())
    setMercado('')
    setMensaje('Precio registrado correctamente.')
  }

  const guardarPresentacion = (indice) => {
    const cantidadNumerica = Number(cantidadEdicion)
    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0 || !unidadEdicion) {
      setMensaje('Ingresa una cantidad válida y selecciona su unidad.')
      return
    }
    onActualizarPresentacion(indice, {
      cantidadPrecio: cantidadNumerica,
      unidadPrecio: unidadEdicion,
    })
    setIndiceEdicion(null)
    setMensaje('Presentación del precio actualizada.')
  }

  return (
    <div className="home registro-precios">
      <header className="registro-precios__barra">
        <div className="registro-precios__barra-inner">
          <button type="button" onClick={onVolver}>
            <Icon name="back" size={17} />
            Admin
          </button>
          <span aria-hidden="true" />
          <Icon name="shoppingBag" size={18} />
          <strong>Registro de Precios</strong>
        </div>
      </header>

      <section className="registro-precios__portada">
        <div className="registro-precios__portada-inner">
          <h1>Registro de precios de mercado</h1>
          <p>Indica a qué cantidad corresponde cada precio para comparar el costo real de las recetas.</p>
        </div>
      </section>

      <main className="registro-precios__contenido">
        <section className="registro-precios__tarjeta registro-precios__formulario-tarjeta">
          <header className="registro-precios__tarjeta-cabecera">
            <h2><span className="registro-precios__icono-agregar">+</span>Registrar nuevo precio</h2>
          </header>
          <form className="registro-precios__formulario" onSubmit={registrarPrecio}>
            <label htmlFor="registro-producto">Nombre del producto <b>*</b></label>
            <input
              id="registro-producto"
              type="text"
              value={producto}
              onChange={(event) => setProducto(event.target.value)}
              placeholder="Ej: Lentejas, Quinua, Tomate..."
              required
            />

            <div className="registro-precios__campos">
              <div>
                <label htmlFor="registro-precio">Precio (S/.) <b>*</b></label>
                <div className="registro-precios__precio-input">
                  <span>S/.</span>
                  <input
                    id="registro-precio"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={precio}
                    onChange={(event) => setPrecio(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="registro-cantidad-precio">Presentación del precio <b>*</b></label>
                <div className="registro-precios__presentacion">
                  <input
                    id="registro-cantidad-precio"
                    type="number"
                    min="0.001"
                    step="any"
                    value={cantidadPrecio}
                    onChange={(event) => setCantidadPrecio(event.target.value)}
                    required
                  />
                  <select
                    id="registro-unidad-precio"
                    aria-label="Unidad de la presentación"
                    value={unidadPrecio}
                    onChange={(event) => setUnidadPrecio(event.target.value)}
                    required
                  >
                    <option value="" disabled>Unidad</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">L</option>
                    <option value="ml">ml</option>
                    <option value="taza">taza</option>
                    <option value="unidad">unidad</option>
                    <option value="diente">diente</option>
                  </select>
                </div>
                <small className="registro-precios__ayuda-presentacion">
                  Ejemplo: S/. 4 por 1 kg.
                </small>
              </div>
              <div>
                <label htmlFor="registro-fecha">Fecha de registro</label>
                <input
                  id="registro-fecha"
                  type="date"
                  value={fecha}
                  readOnly
                  required
                />
              </div>
            </div>

            <label htmlFor="registro-mercado">Mercado <b>*</b></label>
            <select
              id="registro-mercado"
              value={mercado}
              onChange={(event) => setMercado(event.target.value)}
              required
            >
              <option value="" disabled>Seleccionar mercado...</option>
              {MERCADOS.map((opcion) => <option key={opcion}>{opcion}</option>)}
            </select>

            {mensaje && <p className="registro-precios__mensaje" role="status">{mensaje}</p>}
            <button className="registro-precios__registrar" type="submit">
              <span aria-hidden="true">+</span>
              Registrar Precio
            </button>
          </form>
        </section>

        {entradas.length > 0 && (
          <section className="registro-precios__tarjeta registro-precios__entradas">
            <header className="registro-precios__tarjeta-cabecera">
              <h2><span className="registro-precios__icono-amarillo"><Icon name="shoppingBag" size={17} /></span>Entradas recientes</h2>
              <span className="registro-precios__contador">{entradas.length} registros</span>
            </header>
            <div className="registro-precios__tabla-contenedor">
              <table className="registro-precios__tabla">
                <thead>
                  <tr><th>Producto</th><th>Categoría</th><th>Presentación</th><th>Precio</th><th>Mercado</th><th>Tendencia</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {entradas.map((entrada, indice) => (
                    <tr key={`${entrada.producto}-${entrada.fecha}-${indice}`}>
                      <td>{entrada.producto}</td>
                      <td>{entrada.categoria ?? clasificarProducto(entrada.producto)}</td>
                      <td>
                        {indiceEdicion === indice ? (
                          <div className="registro-precios__editar-presentacion">
                            <input
                              aria-label={`Cantidad de presentación para ${entrada.producto}`}
                              type="number"
                              min="0.001"
                              step="any"
                              value={cantidadEdicion}
                              onChange={(event) => setCantidadEdicion(event.target.value)}
                            />
                            <select
                              aria-label={`Unidad de presentación para ${entrada.producto}`}
                              value={unidadEdicion}
                              onChange={(event) => setUnidadEdicion(event.target.value)}
                            >
                              <option value="" disabled>Unidad</option>
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="l">L</option>
                              <option value="ml">ml</option>
                              <option value="taza">taza</option>
                              <option value="unidad">unidad</option>
                              <option value="diente">diente</option>
                            </select>
                            <button type="button" onClick={() => guardarPresentacion(indice)}>
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setIndiceEdicion(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            {entrada.cantidadPrecio && entrada.unidadPrecio
                              ? `${entrada.cantidadPrecio} ${entrada.unidadPrecio}`
                              : 'Unidad no registrada'}
                            <button
                              type="button"
                              className="registro-precios__editar-boton"
                              onClick={() => {
                                setIndiceEdicion(indice)
                                setCantidadEdicion(String(entrada.cantidadPrecio ?? '1'))
                                setUnidadEdicion(entrada.unidadPrecio ?? '')
                              }}
                            >
                              Completar / editar
                            </button>
                            {entrada.unidadPrecio === 'unidad' && (
                              <small className="registro-precios__nota-unidad">
                                Para comparar con gramos, usa el peso real de esta unidad o atado.
                              </small>
                            )}
                          </>
                        )}
                      </td>
                      <td className="registro-precios__valor">{`S/. ${entrada.precio.toFixed(2)}`}</td>
                      <td className="registro-precios__mercado">{entrada.mercado}</td>
                      <td>
                        <span
                          className={`registro-precios__tendencia registro-precios__tendencia--${entrada.tendencia}`}
                          aria-label={`Tendencia: ${entrada.tendencia}`}
                        >
                          {entrada.tendencia === 'sube' ? '↗' : entrada.tendencia === 'baja' ? '↘' : entrada.tendencia === 'nuevo' ? '＋' : '—'}
                        </span>
                      </td>
                      <td>{entrada.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
