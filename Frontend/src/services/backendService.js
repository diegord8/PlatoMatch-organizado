
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
  // CALIFICACIONES DE MERCADOS
  // ======================================

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


  
  // ======================================
  // HU-15: GENERAR LISTA DE COMPRAS
  // ======================================

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


  // ======================================
  // HU-15 / HU-16:
  // RECUPERAR LISTAS Y SEGUIMIENTO
  // ======================================

  obtenerUltimaLista: (usuarioId) =>
    peticion(
      `/Compras/ultima/${usuarioId}`
    ),

  obtenerSeguimientoCompras: (listaId) =>
    peticion(
      `/Compras/${listaId}/seguimiento`
    ),


  // ======================================
  // HU-16: MARCAR INGREDIENTES
  // ======================================

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



  // ======================================
  // ADMINISTRACIÓN
  // ======================================

  obtenerResumenAdmin: () =>
    peticion(
      '/Administracion/resumen'
    ),


  // ======================================
  // ADMIN: REGISTRAR PRECIOS
  // ======================================

  registrarPrecioMercado: (datos) =>
    peticion(
      '/Administracion/precios',
      {
        method: 'POST',
        body: JSON.stringify(datos),
      }
    ),


  // ======================================
  // ADMIN: EDITAR PRECIOS
  // ======================================

  editarPrecioMercado: (precioId, datos) =>
    peticion(
      `/Administracion/precios/${precioId}`,
      {
        method: 'PUT',
        body: JSON.stringify(datos),
      }
    ),


  // ======================================
  // ADMIN: LIMPIEZA DE PRECIOS
  // ======================================

  limpiarPrecios: () =>
    peticion(
      '/Administracion/precios/limpiar',
      {
        method: 'POST',
      }
    ),


  // ======================================
  // ADMIN: ELIMINAR FEEDBACK
  // ======================================

  eliminarFeedback: (feedbackId) =>
    peticion(
      `/Administracion/feedbacks/${feedbackId}`,
      {
        method: 'DELETE',
      }
    ),

}
