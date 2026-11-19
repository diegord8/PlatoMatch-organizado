
import { API_URL } from './config.js'

// ========================================
// CONFIGURACIÓN GENERAL DEL BACKEND
// ========================================

async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  })

  if (!respuesta.ok) {
    const error = await respuesta.json()
      .catch(() => ({}))

    throw new Error(
      error.mensaje ||
      error.message ||
      `Error HTTP ${respuesta.status}`
    )
  }

  if (respuesta.status === 204) {
    return null
  }

  const contenido = await respuesta.text()

  if (!contenido) {
    return null
  }

  try {
    return JSON.parse(contenido)
  } catch {
    throw new Error(
      'El servidor devolvió una respuesta no válida.'
    )
  }
}


// ========================================
// SERVICIO PRINCIPAL DE PLATOMATCH
// ========================================

export const BackendService = {

  // ======================================
  // HU-01 A HU-04: USUARIOS
  // ======================================

  existeCorreo: (correo) =>
    peticion(
      `/Usuarios/existe-correo?correo=${encodeURIComponent(correo)}`
    ),

  registrar: (datos) =>
    peticion('/Usuarios/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  login: (correo, contrasena) =>
    peticion('/Usuarios/login', {
      method: 'POST',
      body: JSON.stringify({
        correo,
        contrasena,
      }),
    }),


  // ======================================
  // HU-19: PERFIL DEL USUARIO
  // ======================================

  obtenerPerfil: (usuarioId) =>
    peticion(
      `/Usuarios/${usuarioId}/perfil`
    ),

  actualizarPerfil: (usuarioId, datos) =>
    peticion(
      `/Usuarios/${usuarioId}/perfil`,
      {
        method: 'PUT',
        body: JSON.stringify(datos),
      }
    ),


  // ======================================
  // HU-05: DESPENSA
  // ======================================

  registrarIngredientes: (usuarioId, ingredientes) =>
    peticion(
      `/Usuarios/${usuarioId}/ingredientes`,
      {
        method: 'POST',
        body: JSON.stringify(ingredientes),
      }
    ),

  obtenerIngredientes: (usuarioId) =>
    peticion(
      `/Usuarios/${usuarioId}/ingredientes`
    ),


  // ======================================
  // HU-05 / HU-15:
  // DESPENSA CON CANTIDADES
  // ======================================

  obtenerDespensaCantidades: (usuarioId) =>
    peticion(
      `/Usuarios/${usuarioId}/despensa-cantidades`
    ),

  guardarDespensaCantidades: (
    usuarioId,
    ingredientes
  ) =>
    peticion(
      `/Usuarios/${usuarioId}/despensa-cantidades`,
      {
        method: 'PUT',
        body: JSON.stringify(ingredientes),
      }
    ),


  // ======================================
  // HU-20: RECORDATORIOS
  // ======================================

  guardarRecordatorio: (usuarioId, datos) =>
    peticion(
      `/Usuarios/${usuarioId}/recordatorios`,
      {
        method: 'POST',
        body: JSON.stringify(datos),
      }
    ),

  obtenerRecordatorio: (usuarioId) =>
    peticion(
      `/Usuarios/${usuarioId}/recordatorios`
    ),


  // ======================================
  // HU-07 / HU-08: RECOMENDACIONES
  // ======================================

  obtenerRecomendaciones: async (usuarioId) => {
    const respuesta = await peticion(
      `/Recetas/recomendaciones/${usuarioId}`
    )

    const recetas = Array.isArray(respuesta)
      ? respuesta
      : []

    return recetas.map((r) => ({
      id: r.id,
      nombre: r.nombre,

      precio: Number(r.costoEstimado || 0),

      kcal: r.calorias ?? 450,
      calorias: r.calorias ?? 450,

      tiempo: r.tiempoPrep,
      imagen: r.imagenUrl,
      descripcion: r.descripcion,

      ingredientes: (r.ingredientes || []).map((i) => ({
        nombre: i.nombre,

        cantidad:
          `${i.cantidadRequerida} ${i.unidadMedida}`,

        cantidadBase: i.cantidadRequerida,
        unidad: i.unidadMedida,
      })),

      aptoAnemia: r.aptoAnemia,
      aptoSinGluten: r.aptoSinGluten,

      mensaje: r.mensajeCompatibilidad,
    }))
  },


  // ======================================
  // HU-09: DETALLE DE RECETA
  // ======================================

  obtenerDetalleReceta: (recetaId) =>
    peticion(
      `/Recetas/${recetaId}`
    ),


  // ======================================
  // RECETAS FAVORITAS
  // ======================================

  obtenerFavoritos: async (usuarioId) => {
    const respuesta = await peticion(
      `/Recetas/favoritos/${usuarioId}`
    )

    return (respuesta || []).map(
      (receta) => receta.id
    )
  },

  guardarFavorito: (usuarioId, recetaId) =>
    peticion(
      '/Recetas/favoritos',
      {
        method: 'POST',
        body: JSON.stringify({
          usuarioId,
          recetaId,
        }),
      }
    ),

  eliminarFavorito: (usuarioId, recetaId) =>
    peticion(
      `/Recetas/favoritos/${usuarioId}/${recetaId}`,
      {
        method: 'DELETE',
      }
    ),


  // ======================================
  // HU-11: MERCADOS DISPONIBLES
  // ======================================

  obtenerMercados: (usuarioId = 0) =>
    peticion(
      `/Recetas/mercados?usuarioId=${Number(usuarioId)}`
    ),


  // ======================================
  // HU-12 / HU-15:
  // PRECIOS SEGÚN EL MERCADO SELECCIONADO
  // ======================================

  obtenerPreciosPorMercado: async (mercadoId) => {
    if (
      mercadoId === null ||
      mercadoId === undefined ||
      mercadoId === ''
    ) {
      throw new Error(
        'Debes seleccionar un mercado válido.'
      )
    }

    const respuesta = await peticion(
      `/Recetas/mercados/${mercadoId}/precios`
    )

    // Devuelve los precios registrados
    // en SQL Server para este mercado.
    if (Array.isArray(respuesta)) {
      return respuesta
    }

    if (Array.isArray(respuesta?.precios)) {
      return respuesta.precios
    }

    if (respuesta === null) {
      return []
    }

    throw new Error(
      'El servidor no devolvió una lista válida de precios.'
    )
  },

  
compararMercados: (recetaId, personas = 1) =>
  peticion(
    `/Recetas/${recetaId}/comparar-mercados` +
    `?personas=${Number(personas)}`
  ),



  calificarMercado: (
    usuarioId,
    mercadoId,
    estrellas
  ) =>
    peticion(
      '/Recetas/mercados/calificar',
      {
        method: 'POST',
        body: JSON.stringify({
          usuarioId,
          mercadoId,
          estrellas,
        }),
      }
    ),



  enviarFeedback: (
    usuarioId,
    recetaId,
    puntuacion,
    comentario
  ) =>
    peticion(
      '/Recetas/feedback',
      {
        method: 'POST',
        body: JSON.stringify({
          usuarioId,
          recetaId,
          puntuacion,
          comentario,
        }),
      }
    ),

  obtenerAnaliticaFeedback: (recetaId) =>
    peticion(
      `/Recetas/${recetaId}/feedback/analitica`
    ),



  generarListaCompras: (
    usuarioId,
    recetaId,
    personas = 1
  ) =>
    peticion(
      `/Compras/generar/${usuarioId}/${recetaId}` +
      `?personas=${Number(personas)}`,
      {
        method: 'POST',
      }
    ),




  obtenerUltimaLista: (usuarioId) =>
    peticion(
      `/Compras/ultima/${usuarioId}`
    ),

  obtenerSeguimientoCompras: (listaId) =>
    peticion(
      `/Compras/${listaId}/seguimiento`
    ),


  marcarItemComprado: (itemId, comprado) =>
    peticion(
      '/Compras/items/marcar',
      {
        method: 'PATCH',
        body: JSON.stringify({
          itemId,
          comprado,
        }),
      }
    ),



  exportarListaTexto: (listaId) =>
    peticion(
      `/Compras/${listaId}/exportar-texto`
    ),



  registrarPreparacion: (usuarioId, datos) =>
    peticion(
      `/Compras/registrar-preparacion/${usuarioId}`,
      {
        method: 'POST',
        body: JSON.stringify(datos),
      }
    ),



  obtenerResumenAhorro: (usuarioId) =>
    peticion(
      `/Compras/ahorro/${usuarioId}`
    ),




  obtenerResumenAdmin: () =>
    peticion(
      '/Administracion/resumen'
    ),



  registrarPrecioMercado: (datos) =>
    peticion(
      '/Administracion/precios',
      {
        method: 'POST',
        body: JSON.stringify(datos),
      }
    ),



  editarPrecioMercado: (precioId, datos) =>
    peticion(
      `/Administracion/precios/${precioId}`,
      {
        method: 'PUT',
        body: JSON.stringify(datos),
      }
    ),



  limpiarPrecios: () =>
    peticion(
      '/Administracion/precios/limpiar',
      {
        method: 'POST',
      }
    ),



  eliminarFeedback: (feedbackId) =>
    peticion(
      `/Administracion/feedbacks/${feedbackId}`,
      {
        method: 'DELETE',
      }
    ),

}
