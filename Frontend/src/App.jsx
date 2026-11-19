
import { useEffect, useRef, useState } from 'react'

import { BackendService } from './services/backendService.js'

import Login from './InicioSesion/Login.jsx'
import Registro from './InicioSesion/Registro.jsx'
import Home from './Home/Home.jsx'
import Perfil from './Perfil/Perfil.jsx'
import AdminPanel from './Perfil/AdminPanel.jsx'
import RegistroPrecios from './Perfil/RegistroPrecios.jsx'
import Buscador from './Buscador/Buscador.jsx'
import Mercados from './Mercados/Mercados.jsx'
import PlatoDetalle from './DetallePlato/PlatoDetalle.jsx'
import Opinion from './DetallePlato/Opinion.jsx'

import ListaCompras from './Compras/ListaCompras.jsx'
import ResumenAhorro from './Finanzas/ResumenAhorro.jsx'
import Configuracion from './Recordatorios/Configuracion.jsx'

import {
  actualizarCuenta,
  cargarSesion,
  eliminarSesion,
  guardarSesion,
} from './InicioSesion/cuentas.js'

import {
  UBICACION_INICIAL,
  cargarUbicacion,
  guardarUbicacion as persistirUbicacion,
} from './services/repositorio.js'

import { limpiarClasificarPrecios } from './Perfil/precios.js'
import { PLATOS } from './data/platos.js'
import { puedeAdministrar } from './services/permisos.js'
import { adaptarSeguimiento } from './Compras/transformar.js'

import {
  interpretarPerfil,
  serializarPerfil,
} from './salud/perfilBackend.js'

import {
  CONFIG_INICIAL,
} from './Recordatorios/recordatorios.js'

import {
  iniciarRecordatorios,
} from './Recordatorios/programar.js'


// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function fechaVisible(fecha) {
  if (!fecha) {
    return new Date().toLocaleDateString('es-PE')
  }

  const valor = new Date(fecha)

  return Number.isNaN(valor.getTime())
    ? new Date().toLocaleDateString('es-PE')
    : valor.toLocaleDateString('es-PE')
}

function adaptarPrecio(precio, mercado) {
  return {
    id: precio.id,
    producto: precio.productoNombre,
    ingrediente: precio.productoNombre,

    precio: Number(precio.precio || 0),
    cantidadPrecio: Number(precio.cantidadPrecio || 1),
    unidadPrecio: precio.unidadPrecio || 'unidad',
    unidad: precio.unidadPrecio || 'unidad',

    mercado: mercado.nombre,
    mercadoId: mercado.id,

    fecha: fechaVisible(precio.fechaRegistro),
    tendencia: 'nuevo',
    valido: Number(precio.precio) > 0,
  }
}

function adaptarFeedback(feedback) {
  const texto = String(feedback.comentario || '')

  const coincidencia = texto.match(
    /^\[(.*?)\]\s*-\s*(.*)$/s
  )

  return {
    id: feedback.id,
    usuario:
      feedback.usuarioNombre ||
      feedback.usuario ||
      'Usuario',

    platoNombre:
      feedback.recetaNombre ||
      feedback.receta ||
      'Receta',

    calificacion: Number(
      feedback.puntuacion ??
      feedback.calificacion ??
      0
    ),

    destacados: coincidencia
      ? coincidencia[1]
          .split(',')
          .map(x => x.trim())
          .filter(Boolean)
      : [],

    comentario: coincidencia
      ? coincidencia[2]
      : texto,

    fecha:
      feedback.fechaRegistro ||
      feedback.fecha ||
      new Date().toISOString(),
  }
}


// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function App() {

  // ========================================
  // SESIÓN Y NAVEGACIÓN
  // ========================================

  const [ubicacionInicial] = useState(() => {
    try {
      return {
        ...UBICACION_INICIAL,
        ...cargarUbicacion(),
        pantalla: 'home',
        tab: 'inicio',
        platoId: null,
        indice: 0,
      }
    } catch (error) {
      console.error(
        'Error al recuperar navegación:',
        error
      )

      return { ...UBICACION_INICIAL }
    }
  })

  const [sesionInicial] = useState(() => {
    try {
      return cargarSesion()
    } catch (error) {
      console.error(
        'Error al recuperar sesión:',
        error
      )

      return {
        usuario: null,
        perfilSalud: {
          alergias: [],
          condiciones: [],
        },
      }
    }
  })

  const [usuario, setUsuario] = useState(
    sesionInicial.usuario
  )

  const [mostrarRegistro, setMostrarRegistro] =
    useState(false)

  const [pantalla, setPantalla] = useState(
    ubicacionInicial.pantalla
  )

  const [tab, setTab] = useState(
    ubicacionInicial.tab
  )

  const [platoId, setPlatoId] = useState(null)

  const [personasPlato, setPersonasPlato] = useState(
    ubicacionInicial.personasPlato || 1
  )

  const [busqueda, setBusqueda] = useState(
    ubicacionInicial.busqueda
  )

  const pasosNavegacion = useRef(0)
  const ubicacionActual = useRef(null)


  // ========================================
  // DATOS DE SQL SERVER
  // ========================================

  const [recetasApi, setRecetasApi] = useState([])
  const [mercadosApi, setMercadosApi] = useState([])
  const [preciosRegistrados, setPreciosRegistrados] =
    useState([])

  const [guardados, setGuardados] = useState([])
  const [opiniones, setOpiniones] = useState([])

  const [perfilSalud, setPerfilSalud] = useState(
    sesionInicial.perfilSalud || {
      alergias: [],
      condiciones: [],
    }
  )

  const [presupuestoBase, setPresupuestoBase] =
    useState('')

  const [listaCompras, setListaCompras] = useState(null)

  const [historialAhorro, setHistorialAhorro] =
    useState([])

  const [recordatorios, setRecordatorios] = useState(
    CONFIG_INICIAL
  )


  // ========================================
  // ESTADÍSTICAS DE MERCADOS
  // ========================================

  const estadisticasMercados = Object.fromEntries(
    mercadosApi.map((mercado) => [
      mercado.nombre,
      {
        promedio:
          mercado.calificacionPromedio == null
            ? null
            : Number(mercado.calificacionPromedio),

        cantidad: Number(
          mercado.totalCalificaciones || 0
        ),
      },
    ])
  )

  const calificacionesMercados = Object.fromEntries(
    mercadosApi
      .filter(m => m.miCalificacion != null)
      .map(m => [
        m.nombre,
        Number(m.miCalificacion),
      ])
  )


  // ========================================
  // RECETA SELECCIONADA
  // ========================================

  const platoApi = recetasApi.find(
    p => Number(p.id) === Number(platoId)
  )

  const plato = platoApi
    ? {
        ...platoApi,

        detalle:
          platoApi.descripcion ||
          platoApi.detalle,

        porciones: platoApi.porciones || 1,

        minutos:
          platoApi.tiempo ??
          platoApi.tiempoPrep ??
          25,

        ingredientes:
          platoApi.ingredientes || [],

        etiquetas: [
          platoApi.aptoAnemia
            ? 'Rico en hierro'
            : null,

          platoApi.aptoSinGluten
            ? 'Sin gluten'
            : null,

          (platoApi.precio ?? 0) <= 10
            ? 'Económico'
            : null,
        ].filter(Boolean),
      }
    : PLATOS.find(
        p => Number(p.id) === Number(platoId)
      ) || null


  // ========================================
  // GUARDAR NAVEGACIÓN
  // ========================================

  ubicacionActual.current = {
    pantalla,
    tab,
    platoId,
    personasPlato,
    busqueda,
  }

  const guardarUbicacion = (siguiente = {}) => {
    persistirUbicacion({
      ...ubicacionActual.current,
      indice: pasosNavegacion.current,
      ...siguiente,
    })
  }


  // ========================================
  // CONSULTAR PRECIOS REALES POR MERCADO
  // ========================================

  const cargarPreciosMercados = async (mercados) => {
    if (!Array.isArray(mercados)) {
      return []
    }

    const resultados = await Promise.allSettled(
      mercados.map((mercado) =>
        BackendService.obtenerPreciosPorMercado(
          mercado.id
        )
      )
    )

    const precios = mercados.flatMap((mercado, indice) => {
      const resultado = resultados[indice]

      if (resultado.status !== 'fulfilled') {
        console.error(
          `Error al obtener precios de ${mercado.nombre}:`,
          resultado.reason
        )

        return []
      }

      const registros = resultado.value

      if (!Array.isArray(registros)) {
        return []
      }

      return registros.map(precio =>
        adaptarPrecio(precio, mercado)
      )
    })

    setPreciosRegistrados(precios)

    return precios
  }


  // ========================================
  // CARGAR DATOS AL INICIAR SESIÓN
  // ========================================

  useEffect(() => {
    if (!usuario?.id || usuario.invitado) {
      return undefined
    }

    let cancelado = false

    const cargarDatos = async () => {
      const resultados = await Promise.allSettled([
        BackendService.obtenerRecomendaciones(
          usuario.id
        ),

        BackendService.obtenerFavoritos(
          usuario.id
        ),

        BackendService.obtenerMercados(
          usuario.id
        ),

        BackendService.obtenerPerfil(
          usuario.id
        ),

        BackendService.obtenerUltimaLista(
          usuario.id
        ),

        BackendService.obtenerResumenAhorro(
          usuario.id
        ),

        BackendService.obtenerRecordatorio(
          usuario.id
        ),
      ])

      if (cancelado) return

      const obtener = (indice, nombre) => {
        const resultado = resultados[indice]

        if (resultado.status === 'fulfilled') {
          return resultado.value
        }

        console.error(
          `Error al cargar ${nombre}:`,
          resultado.reason
        )

        return null
      }

      const recetas = obtener(0, 'recetas')
      const favoritos = obtener(1, 'favoritos')
      const mercados = obtener(2, 'mercados')
      const perfil = obtener(3, 'perfil')
      const lista = obtener(4, 'lista de compras')
      const ahorro = obtener(5, 'ahorro')
      const recordatorio = obtener(6, 'recordatorio')

      if (Array.isArray(recetas)) {
        setRecetasApi(recetas)
      }

      if (Array.isArray(favoritos)) {
        setGuardados(favoritos)
      }

      // Mercados reales de SQL Server
      if (Array.isArray(mercados)) {
        setMercadosApi(mercados)

        const resultadosPrecios =
          await Promise.allSettled(
            mercados.map(m =>
              BackendService.obtenerPreciosPorMercado(m.id)
            )
          )

        if (cancelado) return

        const precios = mercados.flatMap((m, indice) => {
          const resultado = resultadosPrecios[indice]

          if (
            resultado.status !== 'fulfilled' ||
            !Array.isArray(resultado.value)
          ) {
            return []
          }

          return resultado.value.map(p =>
            adaptarPrecio(p, m)
          )
        })

        setPreciosRegistrados(precios)
      }

      // Perfil
      if (perfil) {
        setPresupuestoBase(
          String(perfil.presupuesto ?? '')
        )

        setPerfilSalud(
          interpretarPerfil(
            perfil.restriccionesSalud || ''
          )
        )

        setUsuario(actual =>
          Number(actual?.id) === Number(usuario.id)
            ? {
                ...actual,
                presupuesto: perfil.presupuesto,
                cantidadPersonas:
                  perfil.cantidadPersonas || 1,
              }
            : actual
        )
      }

      // Última lista de compras
      if (resultados[4].status === 'fulfilled') {
        setListaCompras(
          adaptarSeguimiento(lista)
        )
      }

      // Historial de ahorro
      if (ahorro) {
        setHistorialAhorro(
          ahorro.detalle || []
        )
      }

      // Recordatorios
      if (resultados[6].status === 'fulfilled') {
        setRecordatorios({
          activo: Boolean(recordatorio?.activo),

          hora: String(
            recordatorio?.horaAlerta || '12:00'
          ).slice(0, 5),
        })
      }
    }

    cargarDatos().catch(error => {
      if (!cancelado) {
        console.error(
          'Error al cargar datos desde SQL Server:',
          error
        )
      }
    })

    return () => {
      cancelado = true
    }
  }, [usuario?.id])


  // ========================================
  // RECORDATORIOS
  // ========================================

  useEffect(() => {
    if (
      !usuario?.id ||
      usuario.invitado ||
      !recordatorios.activo
    ) {
      return undefined
    }

    return iniciarRecordatorios(
      usuario.id,
      recordatorios
    )
  }, [
    usuario?.id,
    usuario?.invitado,
    recordatorios.activo,
    recordatorios.hora,
  ])


  // ========================================
  // GUARDAR SESIÓN
  // ========================================

  useEffect(() => {
    if (usuario) {
      guardarSesion(usuario, perfilSalud)
    } else {
      eliminarSesion()
    }
  }, [usuario, perfilSalud])


  // ========================================
  // SCROLL
  // ========================================

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pantalla, tab])


  // ========================================
  // HISTORIAL DE NAVEGACIÓN
  // ========================================

  useEffect(() => {
    window.history.replaceState(
      {
        platomatch: true,
        indice: 0,
        pantalla: 'home',
        tab: 'inicio',
        platoId: null,
        personasPlato:
          ubicacionInicial.personasPlato || 1,
      },
      ''
    )

    const restaurarPaso = (event) => {
      if (!event.state?.platomatch) return

      const estado = event.state

      pasosNavegacion.current =
        estado.indice || 0

      setPantalla(
        estado.pantalla || 'home'
      )

      setTab(
        estado.tab || 'inicio'
      )

      setPlatoId(
        estado.platoId ?? null
      )

      setPersonasPlato(
        estado.personasPlato ?? 1
      )
    }

    window.addEventListener(
      'popstate',
      restaurarPaso
    )

    return () => {
      window.removeEventListener(
        'popstate',
        restaurarPaso
      )
    }
  }, [])


  useEffect(() => {
    guardarUbicacion()
  }, [
    pantalla,
    tab,
    platoId,
    personasPlato,
    busqueda,
  ])


  // ========================================
  // NAVEGAR ENTRE PANTALLAS
  // ========================================

  const navegar = (
    siguientePantalla,
    siguienteTab,
    siguientePlatoId = null,
    adicionales = {}
  ) => {
    const indice = pasosNavegacion.current + 1

    const estado = {
      platomatch: true,
      indice,

      pantalla: siguientePantalla,
      tab: siguienteTab,
      platoId: siguientePlatoId,

      personasPlato:
        adicionales.personasPlato ??
        personasPlato,
    }

    window.history.pushState(
      estado,
      ''
    )

    pasosNavegacion.current = indice

    setPantalla(siguientePantalla)
    setTab(siguienteTab)
    setPlatoId(siguientePlatoId)

    if (adicionales.personasPlato != null) {
      setPersonasPlato(
        adicionales.personasPlato
      )
    }

    guardarUbicacion({
      ...estado,
      ...adicionales,
    })
  }


  const volver = (
    pantallaRespaldo = 'home',
    tabRespaldo = tab
  ) => {
    if (pasosNavegacion.current > 0) {
      window.history.back()
      return
    }

    navegar(
      pantallaRespaldo,
      tabRespaldo,
      pantallaRespaldo === 'detalle'
        ? platoId
        : null
    )
  }


  const irATab = (nuevoTab) => {
    navegar('home', nuevoTab)
  }


  // ========================================
  // FAVORITOS
  // ========================================

  const handleToggleGuardado = async (recetaId) => {
    if (!usuario?.id) return

    const yaGuardado = guardados.includes(recetaId)

    try {
      if (yaGuardado) {
        await BackendService.eliminarFavorito(
          usuario.id,
          recetaId
        )
      } else {
        await BackendService.guardarFavorito(
          usuario.id,
          recetaId
        )
      }

      const actualizados =
        await BackendService.obtenerFavoritos(
          usuario.id
        )

      setGuardados(actualizados || [])
    } catch (error) {
      alert(
        `No se pudo actualizar el favorito: ${error.message}`
      )
    }
  }


  // ========================================
  // HU-19: GUARDAR PERFIL DE SALUD
  // ========================================

  const guardarSalud = async (nuevoPerfil) => {
    if (!usuario?.id) {
      throw new Error(
        'Debes iniciar sesión.'
      )
    }

    await BackendService.actualizarPerfil(
      usuario.id,
      {
        presupuesto: Number(presupuestoBase),
        cantidadPersonas:
          usuario.cantidadPersonas || 1,

        restriccionesSalud:
          serializarPerfil(nuevoPerfil),
      }
    )

    setPerfilSalud(nuevoPerfil)

    try {
      const recetas =
        await BackendService.obtenerRecomendaciones(
          usuario.id
        )

      setRecetasApi(recetas || [])
    } catch (error) {
      console.error(
        'El perfil se guardó, pero no se actualizaron las recomendaciones:',
        error
      )
    }
  }


  // ========================================
  // HU-19: GUARDAR PRESUPUESTO
  // ========================================

  const guardarPresupuestoBase = async (
    nuevoPresupuesto
  ) => {
    const monto = Number(nuevoPresupuesto)

    if (
      !usuario?.id ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      monto > 1000
    ) {
      throw new Error(
        'El presupuesto debe estar entre S/ 0.01 y S/ 1000.'
      )
    }

    await BackendService.actualizarPerfil(
      usuario.id,
      {
        presupuesto: monto,

        cantidadPersonas:
          usuario.cantidadPersonas || 1,

        restriccionesSalud:
          serializarPerfil(perfilSalud),
      }
    )

    setPresupuestoBase(String(monto))

    setUsuario(actual =>
      actual
        ? {
            ...actual,
            presupuesto: monto,
          }
        : actual
    )

    try {
      const recetas =
        await BackendService.obtenerRecomendaciones(
          usuario.id
        )

      setRecetasApi(recetas || [])
    } catch (error) {
      console.error(
        'El presupuesto se guardó, pero no se actualizaron las recomendaciones:',
        error
      )
    }
  }


  // ========================================
  // HU-15: GENERAR LISTA DE COMPRAS
  // ========================================

  const generarCompras = async (
    platoElegido,
    personas = 1
  ) => {
    if (!usuario?.id) {
      alert(
        'Debes iniciar sesión para crear la lista.'
      )
      return
    }

    try {
      const creada =
        await BackendService.generarListaCompras(
          usuario.id,
          platoElegido.id,
          personas
        )

      const seguimiento =
        await BackendService.obtenerSeguimientoCompras(
          creada.listaId
        )

      setListaCompras(
        adaptarSeguimiento(seguimiento)
      )

      navegar(
        'compras',
        tab,
        platoElegido.id
      )
    } catch (error) {
      alert(
        `No se pudo generar la lista: ${error.message}`
      )
    }
  }


  // ========================================
  // HU-16: MARCAR INGREDIENTES
  // ========================================

  const marcarComprado = async (id) => {
    const item = listaCompras?.ingredientes.find(
      i => i.id === id
    )

    if (!item) {
      throw new Error(
        'Ingrediente no encontrado.'
      )
    }

    await BackendService.marcarItemComprado(
      id,
      !item.comprado
    )

    const actualizado =
      await BackendService.obtenerSeguimientoCompras(
        listaCompras.id
      )

    setListaCompras(
      adaptarSeguimiento(actualizado)
    )
  }


  // ========================================
  // HU-18: REGISTRAR GASTO Y AHORRO
  // ========================================

  const registrarAhorro = async ({
    listaId,
    mercadoId,
    costoEjecutado,
    costoReferenciaAlternativa,
  }) => {
    if (!usuario?.id) {
      throw new Error(
        'Debes iniciar sesión.'
      )
    }

    const gasto = Number(costoEjecutado)

    if (
      !Number.isFinite(gasto) ||
      gasto < 0
    ) {
      throw new Error(
        'Gasto real no válido.'
      )
    }

    const referencia =
      costoReferenciaAlternativa == null
        ? null
        : Number(costoReferenciaAlternativa)

    if (
      referencia !== null &&
      (
        !Number.isFinite(referencia) ||
        referencia <= 0
      )
    ) {
      throw new Error(
        'Costo alternativo no válido.'
      )
    }

    await BackendService.registrarPreparacion(
      usuario.id,
      {
        listaId,

        mercadoId: mercadoId
          ? Number(mercadoId)
          : null,

        costoEjecutado: gasto,

        costoReferenciaAlternativa:
          referencia,
      }
    )

    const [seguimiento, resumen] =
      await Promise.all([
        BackendService.obtenerSeguimientoCompras(
          listaId
        ),

        BackendService.obtenerResumenAhorro(
          usuario.id
        ),
      ])

    setListaCompras(
      adaptarSeguimiento(seguimiento)
    )

    setHistorialAhorro(
      resumen?.detalle || []
    )
  }


  // ========================================
  // DETALLE DE RECETA
  // ========================================

  const verPlato = async (
    id,
    personas = 1
  ) => {
    setPersonasPlato(personas)

    try {
      const detalle =
        await BackendService.obtenerDetalleReceta(id)

      if (detalle) {
        setRecetasApi(prev =>
          prev.map(receta =>
            Number(receta.id) === Number(id)
              ? {
                  ...receta,

                  nombre:
                    detalle.nombre ??
                    receta.nombre,

                  descripcion:
                    detalle.descripcion ??
                    receta.descripcion,

                  detalle:
                    detalle.descripcion ??
                    receta.descripcion,

                  precio:
                    detalle.costoEstimado ??
                    receta.precio,

                  kcal:
                    detalle.calorias ??
                    receta.kcal,

                  minutos:
                    detalle.tiempoPrep ??
                    receta.tiempo,

                  ingredientes:
                    Array.isArray(detalle.ingredientes)
                      ? detalle.ingredientes.map(ing => ({
                          nombre:
                            ing.nombreIngrediente,

                          cantidad:
                            `${ing.cantidadBase} ${ing.unidadMedida}`,

                          cantidadBase:
                            ing.cantidadBase,

                          unidad:
                            ing.unidadMedida,
                        }))
                      : [],
                }
              : receta
          )
        )
      }
    } catch (error) {
      console.error(
        'Error al cargar detalle:',
        error
      )
    }

    navegar(
      'detalle',
      tab,
      id,
      { personasPlato: personas }
    )
  }


  // ========================================
  // CALIFICAR MERCADO
  // ========================================

  const calificarMercado = async (
    nombreMercado,
    estrellas
  ) => {
    if (!usuario?.id) {
      alert(
        'Debes iniciar sesión para calificar.'
      )
      return
    }

    const mercado = mercadosApi.find(
      m =>
        normalizar(m.nombre) ===
        normalizar(nombreMercado)
    )

    if (!mercado) {
      alert('Mercado no encontrado.')
      return
    }

    try {
      await BackendService.calificarMercado(
        usuario.id,
        mercado.id,
        estrellas
      )

      const actualizados =
        await BackendService.obtenerMercados(
          usuario.id
        )

      setMercadosApi(actualizados || [])
    } catch (error) {
      alert(
        `No se pudo guardar la calificación: ${error.message}`
      )
    }
  }


  // ========================================
  // ACTUALIZAR CUENTA
  // ========================================

  const actualizarUsuario = async (
    actualizacion
  ) => {
    if (!usuario?.email) {
      throw new Error(
        'Debes iniciar sesión.'
      )
    }

    const actualizado =
      await actualizarCuenta({
        ...actualizacion,
        emailActual: usuario.email,
      })

    setUsuario(actual => ({
      ...actual,
      ...actualizado,
    }))

    return actualizado
  }


  // ========================================
  // CERRAR SESIÓN
  // ========================================

  const cerrarSesion = () => {
    eliminarSesion()

    pasosNavegacion.current = 0

    window.history.replaceState(
      {
        platomatch: true,
        indice: 0,
        pantalla: 'home',
        tab: 'inicio',
        platoId: null,
        personasPlato: 1,
      },
      ''
    )

    persistirUbicacion(UBICACION_INICIAL)

    setUsuario(null)
    setPantalla('home')
    setTab('inicio')
    setPlatoId(null)
    setPersonasPlato(1)

    setBusqueda({
      presupuesto: '',
      ingredientes: '',
      personas: 1,
    })

    setGuardados([])
    setRecetasApi([])
    setMercadosApi([])
    setPreciosRegistrados([])
    setOpiniones([])
    setListaCompras(null)
    setHistorialAhorro([])
    setRecordatorios(CONFIG_INICIAL)
    setPresupuestoBase('')

    setPerfilSalud({
      alergias: [],
      condiciones: [],
    })
  }


  // ========================================
  // REGISTRAR FEEDBACK
  // ========================================

  const registrarOpinion = async (opinion) => {
    if (!usuario?.id) {
      throw new Error('Debes iniciar sesión.')
    }

    const textoCompleto = [
      opinion.destacados?.length
        ? `[${opinion.destacados.join(', ')}]`
        : '',

      opinion.comentario,
    ]
      .filter(Boolean)
      .join(' - ')

    await BackendService.enviarFeedback(
      usuario.id,
      opinion.platoId,
      Number(opinion.calificacion),
      textoCompleto ||
        'Sin comentarios adicionales'
    )

    setOpiniones(prev => [
      {
        ...opinion,
        id: `reciente-${Date.now()}`,
        platoNombre:
          recetasApi.find(
            p => p.id === opinion.platoId
          )?.nombre || 'Receta',

        usuario:
          usuario.nombre || 'Usuario',

        fecha:
          new Date().toISOString(),

        destacados:
          opinion.destacados || [],

        comentario:
          opinion.comentario || '',
      },
      ...prev,
    ])
  }


  // ========================================
  // ADMIN: CONSULTAR FEEDBACKS
  // ========================================

  const cargarAdmin = async () => {
    const respuesta =
      await BackendService.obtenerResumenAdmin()

    if (Array.isArray(respuesta?.feedbacks)) {
      setOpiniones(
        respuesta.feedbacks.map(adaptarFeedback)
      )
    }

    return respuesta
  }

  useEffect(() => {
    if (
      pantalla !== 'admin' ||
      !usuario?.id ||
      !puedeAdministrar(usuario)
    ) {
      return
    }

    cargarAdmin().catch(error => {
      console.error(
        'No se pudo cargar el panel Admin:',
        error
      )
    })
  }, [
    pantalla,
    usuario?.id,
  ])


  // ========================================
  // ADMIN: REGISTRAR PRECIO EN SQL SERVER
  // ========================================

  const registrarPrecio = async (entrada) => {
    const nombreMercado = entrada.mercado

    const mercado = mercadosApi.find(
      m =>
        normalizar(m.nombre) ===
        normalizar(nombreMercado)
    )

    if (!mercado) {
      throw new Error(
        `El mercado "${nombreMercado}" no existe en SQL Server.`
      )
    }

    const producto = String(
      entrada.producto ||
      entrada.ingrediente ||
      ''
    ).trim()

    const precio = Number(entrada.precio)
    const cantidadPrecio =
      Number(entrada.cantidadPrecio)

    if (!producto) {
      throw new Error(
        'Ingresa el nombre del producto.'
      )
    }

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      throw new Error(
        'El precio debe ser mayor que cero.'
      )
    }

    if (
      !Number.isFinite(cantidadPrecio) ||
      cantidadPrecio <= 0
    ) {
      throw new Error(
        'La cantidad de presentación no es válida.'
      )
    }

    if (!entrada.unidadPrecio) {
      throw new Error(
        'Selecciona la unidad del precio.'
      )
    }

    await BackendService.registrarPrecioMercado({
      productoNombre: producto,
      precio,
      mercadoId: Number(mercado.id),
      cantidadPrecio,
      unidadPrecio: entrada.unidadPrecio,
    })

    // Volver a consultar los precios desde SQL Server.
    await cargarPreciosMercados(mercadosApi)
  }


  // ========================================
  // ADMIN: EDITAR PRESENTACIÓN DEL PRECIO
  // ========================================

  const actualizarPresentacion = async (
    indice,
    presentacion
  ) => {
    const anterior =
      preciosRegistrados[indice]

    if (!anterior?.id) {
      throw new Error(
        'No se encontró el registro de precio.'
      )
    }

    const datos = {
      productoNombre: anterior.producto,
      precio: Number(anterior.precio),
      mercadoId: Number(anterior.mercadoId),

      cantidadPrecio:
        Number(presentacion.cantidadPrecio),

      unidadPrecio:
        presentacion.unidadPrecio,
    }

    await BackendService.editarPrecioMercado(
      anterior.id,
      datos
    )

    await cargarPreciosMercados(mercadosApi)
  }


  // ========================================
  // ADMIN: LIMPIEZA VISUAL DE PRECIOS
  // ========================================

  const limpiarPrecios = () => {
    const resultado =
      limpiarClasificarPrecios(
        preciosRegistrados
      )

    setPreciosRegistrados(
      resultado.registros
    )

    return resultado
  }


  // ========================================
  // PANTALLA DE REGISTRO
  // ========================================

  if (!usuario && mostrarRegistro) {
    return (
      <Registro
        onVolver={() =>
          setMostrarRegistro(false)
        }

        onCrearCuenta={async (datosCuenta) => {
          try {
            const salud =
              datosCuenta.perfilSalud || {
                alergias: [],
                condiciones: [],
              }

            const respuesta =
              await BackendService.registrar({
                nombre: datosCuenta.nombre,
                correo: datosCuenta.email,
                contrasena: datosCuenta.password,

                presupuesto: 50,
                cantidadPersonas: 1,

                restriccionesSalud:
                  serializarPerfil(salud),
              })

            const nuevoUsuario = {
              id:
                respuesta.usuarioId ||
                respuesta.id,

              nombre:
                datosCuenta.nombre,

              email:
                datosCuenta.email,

              presupuesto: 50,
              cantidadPersonas: 1,

              rol:
                datosCuenta.email
                  .toLowerCase()
                  .includes('admin')
                    ? 'admin'
                    : 'usuario',
            }

            setUsuario(nuevoUsuario)
            setPerfilSalud(salud)
            setPresupuestoBase('50')
            setGuardados([])
            setMostrarRegistro(false)

            setPantalla('home')
            setTab('inicio')
          } catch (error) {
            alert(
              error.message ||
              'No se pudo registrar.'
            )
          }
        }}
      />
    )
  }


  // ========================================
  // PANTALLA DE LOGIN
  // ========================================

  if (!usuario) {
    return (
      <Login
        onLogin={async ({
          email,
          password,
        }) => {
          try {
            const respuesta =
              await BackendService.login(
                email,
                password
              )

            const u =
              respuesta.usuario ||
              respuesta

            const autenticado = {
              id: u.id,
              nombre: u.nombre,
              email: u.correo || email,

              rol:
                u.rol ||
                (String(u.correo || email)
                  .toLowerCase()
                  .includes('admin')
                    ? 'admin'
                    : 'usuario'),

              cantidadPersonas:
                u.cantidadPersonas || 1,

              presupuesto:
                u.presupuesto,
            }

            setUsuario(autenticado)

            setPerfilSalud(
              interpretarPerfil(
                u.restriccionesSalud || ''
              )
            )

            setPresupuestoBase(
              String(u.presupuesto ?? '')
            )

            setPantalla('home')
            setTab('inicio')
            setPlatoId(null)

            return true
          } catch (error) {
            console.error(
              'Error de inicio de sesión:',
              error
            )

            return false
          }
        }}

        onGuest={() => {
          setUsuario({
            id: 0,
            nombre: 'Viajero Saludable',
            invitado: true,
            rol: 'invitado',
          })

          setPantalla('home')
          setTab('inicio')
          setGuardados([])

          setPerfilSalud({
            alergias: [],
            condiciones: [],
          })
        }}

        onRegister={() =>
          setMostrarRegistro(true)
        }
      />
    )
  }


  // ========================================
  // HU-15 / HU-16 / HU-17:
  // LISTA DE COMPRAS
  // ========================================

  if (pantalla === 'compras') {
    return (
      <ListaCompras
        lista={listaCompras}
        mercados={mercadosApi}

        onMarcar={marcarComprado}

        onVolver={() =>
          navegar('home', 'perfil')
        }

        onVerRecetas={() =>
          navegar('home', 'buscar')
        }

        onRegistrarAhorro={registrarAhorro}

        onVerAhorro={() =>
          navegar('ahorro', 'perfil')
        }
      />
    )
  }


  // ========================================
  // HU-18: MI AHORRO
  // ========================================

  if (pantalla === 'ahorro') {
    return (
      <ResumenAhorro
        usuarioId={usuario.id}

        onVolver={() =>
          navegar('home', 'perfil')
        }

        onCompras={() =>
          navegar('compras', 'perfil')
        }
      />
    )
  }


  // ========================================
  // HU-20: RECORDATORIOS
  // ========================================

  if (pantalla === 'recordatorios') {
    return (
      <Configuracion
        configuracion={recordatorios}

        onGuardar={async (nuevaConfig) => {
          if (!usuario?.id) {
            throw new Error(
              'Debes iniciar sesión.'
            )
          }

          await BackendService.guardarRecordatorio(
            usuario.id,
            {
              horaAlerta: nuevaConfig.hora,
              frecuencia: 'Diario',

              activo:
                Boolean(nuevaConfig.activo),
            }
          )

          setRecordatorios(nuevaConfig)
        }}

        onVolver={() =>
          navegar('home', 'perfil')
        }
      />
    )
  }


  // ========================================
  // DETALLE DEL PLATO
  // ========================================

  if (pantalla === 'detalle' && plato) {
    return (
      <PlatoDetalle
        plato={plato}

        personas={personasPlato}

        onCambiarPersonas={
          setPersonasPlato
        }

        guardado={
          guardados.includes(plato.id)
        }

        onToggleGuardado={
          handleToggleGuardado
        }

        onVolver={() =>
          volver('home', tab)
        }

        onNavegar={irATab}

        onOpinion={() =>
          navegar(
            'opinion',
            tab,
            plato.id
          )
        }

        perfilSalud={perfilSalud}

        onGenerarCompras={() =>
          generarCompras(
            plato,
            personasPlato
          )
        }
      />
    )
  }


  // ========================================
  // OPINIÓN DEL PLATO
  // ========================================

  if (pantalla === 'opinion' && plato) {
    return (
      <Opinion
        plato={plato}

        onVolver={() =>
          volver('detalle')
        }

        onEnviar={registrarOpinion}
      />
    )
  }


  // ========================================
  // PANEL ADMINISTRATIVO
  // ========================================

  if (
    pantalla === 'admin' &&
    puedeAdministrar(usuario)
  ) {
    return (
      <AdminPanel
        onSalir={() =>
          navegar('home', 'perfil')
        }

        onRegistroPrecios={() =>
          navegar(
            'registro-precios',
            'perfil'
          )
        }

        onLimpiarPrecios={limpiarPrecios}

        cantidadPrecios={
          preciosRegistrados.length
        }

        opiniones={opiniones}
      />
    )
  }


  // ========================================
  // ADMIN: REGISTRO DE PRECIOS
  // ========================================

  if (
    pantalla === 'registro-precios' &&
    puedeAdministrar(usuario)
  ) {
    return (
      <RegistroPrecios
        entradasRegistradas={
          preciosRegistrados
        }

        onRegistrarPrecio={(entrada) => {
          registrarPrecio(entrada).catch(error => {
            alert(
              `No se pudo registrar el precio: ${error.message}`
            )
          })
        }}

        onActualizarPresentacion={(
          indice,
          presentacion
        ) => {
          actualizarPresentacion(
            indice,
            presentacion
          ).catch(error => {
            alert(
              `No se pudo actualizar el precio: ${error.message}`
            )
          })
        }}

        onVolver={() =>
          navegar('admin', 'perfil')
        }
      />
    )
  }


  // ========================================
  // HU-19: PERFIL
  // ========================================

  if (tab === 'perfil') {
    return (
      <Perfil
        usuario={usuario}
        guardados={guardados}
        platosDisponibles={
          recetasApi.length || PLATOS.length
        }

        perfilSalud={perfilSalud}

        onGuardarSalud={
          guardarSalud
        }

        presupuestoBase={
          presupuestoBase
        }

        onGuardarPresupuesto={
          guardarPresupuestoBase
        }

        onCompras={() =>
          navegar('compras', 'perfil')
        }

        onAhorro={() =>
          navegar('ahorro', 'perfil')
        }

        onRecordatorios={() =>
          navegar('recordatorios', 'perfil')
        }

        onActualizarUsuario={
          actualizarUsuario
        }

        onNavegar={irATab}

        onAdmin={() =>
          navegar('admin', 'perfil')
        }

        onLogout={cerrarSesion}
      />
    )
  }


  // ========================================
  // BUSCADOR
  // ========================================

  if (tab === 'buscar') {
    return (
      <Buscador
        usuario={usuario}
        platos={recetasApi}
        perfilSalud={perfilSalud}

        preciosRegistrados={
          preciosRegistrados
        }

        calificacionesMercados={
          calificacionesMercados
        }

        estadisticasMercados={
          estadisticasMercados
        }

        onCalificarMercado={
          calificarMercado
        }

        guardados={guardados}

        onToggleGuardado={
          handleToggleGuardado
        }

        onNavegar={irATab}
        onVerPlato={verPlato}

        busqueda={busqueda}

        presupuestoBase={
          presupuestoBase
        }

        opiniones={opiniones}

        onActualizarBusqueda={
          setBusqueda
        }
      />
    )
  }


  // ========================================
  // MERCADOS
  // ========================================

  if (tab === 'mercados') {
    return (
      <Mercados
        mercados={mercadosApi}

        preciosRegistrados={
          preciosRegistrados
        }

        calificacionesMercados={
          calificacionesMercados
        }

        estadisticasMercados={
          estadisticasMercados
        }

        onCalificarMercado={
          calificarMercado
        }

        platosReales={recetasApi}

        onNavegar={irATab}
      />
    )
  }


  // ========================================
  // INICIO DE PLATOMATCH
  // ========================================

  return (
    <Home
      usuario={usuario}

      recetas={recetasApi}
      mercados={mercadosApi}

      perfilSalud={perfilSalud}

      tab={tab}
      onTab={irATab}

      guardados={guardados}

      onToggleGuardado={
        handleToggleGuardado
      }

      onVerPlato={verPlato}

      presupuestoBase={
        presupuestoBase
      }

      onCompras={() =>
        navegar('compras', 'perfil')
      }
    />
  )
}

export default App
