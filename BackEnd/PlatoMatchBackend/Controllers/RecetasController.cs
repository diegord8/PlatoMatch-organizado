
using Microsoft.AspNetCore.Mvc;
using PlatoMatchBackend.Models;
using PlatoMatchBackend.Repositories;

namespace PlatoMatchBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecetasController : ControllerBase
    {
        private readonly IRecetaRepository _recetaRepo;
        private readonly IUsuarioRepository _usuarioRepo;

        public RecetasController(
            IRecetaRepository recetaRepo,
            IUsuarioRepository usuarioRepo)
        {
            _recetaRepo = recetaRepo;
            _usuarioRepo = usuarioRepo;
        }

        [HttpGet("recomendaciones/{usuarioId}")]
        public async Task<IActionResult> ObtenerRecomendaciones(
            int usuarioId)
        {
            var usuario =
                await _usuarioRepo.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado"
                });
            }

            var todasRecetas =
                await _recetaRepo.ObtenerTodasAsync();

            var ingredientesCasa =
                await _usuarioRepo
                    .ObtenerIngredientesPorUsuarioAsync(usuarioId);

            var candidatas = todasRecetas
                .Where(r =>
                    usuario.Presupuesto <= 0 ||
                    r.CostoEstimado <= usuario.Presupuesto)
                .ToList();

            var restricciones =
                (usuario.RestriccionesSalud ?? "").ToLower();

            if (restricciones.Contains("sin gluten") ||
                restricciones.Contains("gluten"))
            {
                candidatas = candidatas
                    .Where(r => r.AptoSinGluten)
                    .ToList();
            }

            if (restricciones.Contains("anemia"))
            {
                candidatas = candidatas
                    .Where(r => r.AptoAnemia)
                    .ToList();
            }

            var resultado = candidatas.Select(r =>
            {
                int coincidencias = 0;

                foreach (var ing in ingredientesCasa)
                {
                    if (
                        r.Nombre.Contains(
                            ing,
                            StringComparison.OrdinalIgnoreCase) ||
                        (
                            r.Descripcion != null &&
                            r.Descripcion.Contains(
                                ing,
                                StringComparison.OrdinalIgnoreCase)
                        )
                    )
                    {
                        coincidencias++;
                    }
                }

                return new RecetaRecomendadaDto
                {
                    Id = r.Id,
                    Nombre = r.Nombre,
                    Descripcion = r.Descripcion,
                    CostoEstimado = r.CostoEstimado,
                    TiempoPrep = r.TiempoPrep,
                    AptoAnemia = r.AptoAnemia,
                    AptoSinGluten = r.AptoSinGluten,
                    ImagenUrl = r.ImagenUrl,

                    IngredientesEnCasaCoincidentes =
                        coincidencias,

                    MensajeCompatibilidad =
                        coincidencias > 0
                            ? $"Aprovecha {coincidencias} ingrediente(s) de tu despensa"
                            : "Compatible con tu presupuesto y salud"
                };
            })
            .OrderByDescending(
                r => r.IngredientesEnCasaCoincidentes)
            .ThenBy(r => r.CostoEstimado)
            .ToList();

            return Ok(resultado);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerDetalle(int id)
        {
            var receta =
                await _recetaRepo.ObtenerPorIdAsync(id);

            if (receta == null)
                return NotFound(new
                {
                    mensaje = "Receta no encontrada"
                });

            var ingredientes =
                await _recetaRepo
                    .ObtenerIngredientesPorRecetaAsync(id);

            return Ok(new
            {
                id = receta.Id,
                nombre = receta.Nombre,
                descripcion = receta.Descripcion,
                costoEstimado = receta.CostoEstimado,
                calorias = receta.Calorias,
                tiempoPrep = receta.TiempoPrep,
                aptoAnemia = receta.AptoAnemia,
                aptoSinGluten = receta.AptoSinGluten,
                imagenUrl = receta.ImagenUrl,

                ingredientes = ingredientes.Select(i => new
                {
                    nombreIngrediente = i.NombreIngrediente,
                    cantidadBase = i.CantidadBase,
                    unidadMedida = i.UnidadMedida
                }).ToList()
            });
        }

        [HttpGet("mercados/{mercadoId:int}/precios")]
        public async Task<IActionResult> ObtenerPreciosMercado(
            int mercadoId)
        {
            if (mercadoId <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "Mercado no válido."
                });
            }

            var precios =
                await _recetaRepo
                    .ObtenerPreciosPorMercadoAsync(mercadoId);

            return Ok(precios);
        }

        [HttpGet("precios/buscar")]
        public async Task<IActionResult> BuscarPrecio(
            [FromQuery] string producto)
        {
            if (string.IsNullOrWhiteSpace(producto))
            {
                return BadRequest(new
                {
                    mensaje = "Ingrese un producto a buscar"
                });
            }

            var precios =
                await _recetaRepo
                    .BuscarPreciosPorProductoAsync(producto);

            return Ok(precios);
        }

        [HttpPost("favoritos")]
        public async Task<IActionResult> GuardarFavorito(
            [FromBody] GuardarPlatoDto dto)
        {
            var receta =
                await _recetaRepo.ObtenerPorIdAsync(
                    dto.RecetaId);

            if (receta == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "La receta especificada no existe"
                });
            }

            var guardado =
                await _recetaRepo.GuardarPlatoFavoritoAsync(
                    dto.UsuarioId,
                    dto.RecetaId);

            if (!guardado)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El plato ya se encuentra en favoritos"
                });
            }

            return Ok(new
            {
                mensaje =
                    "Plato guardado en favoritos exitosamente"
            });
        }

        [HttpGet("favoritos/{usuarioId:int}")]
        public async Task<IActionResult> ObtenerFavoritos(
            int usuarioId)
        {
            var favoritos =
                await _recetaRepo.ObtenerPlatosGuardadosAsync(
                    usuarioId);

            return Ok(favoritos);
        }

        [HttpDelete("favoritos/{usuarioId:int}/{recetaId:int}")]
        public async Task<IActionResult> EliminarFavorito(
            int usuarioId,
            int recetaId)
        {
            var eliminado =
                await _recetaRepo.EliminarPlatoGuardadoAsync(
                    usuarioId,
                    recetaId);

            if (!eliminado)
            {
                return NotFound(new
                {
                    mensaje =
                        "No se encontró el plato en favoritos"
                });
            }

            return Ok(new
            {
                mensaje = "Plato eliminado de favoritos"
            });
        }

        [HttpGet("{recetaId:int}/escalar")]
        public async Task<IActionResult> EscalarPorciones(
            int recetaId,
            [FromQuery] int personas)
        {
            if (personas <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La cantidad de personas debe ser mayor a 0"
                });
            }

            var receta =
                await _recetaRepo.ObtenerPorIdAsync(
                    recetaId);

            if (receta == null)
            {
                return NotFound(new
                {
                    mensaje = "Receta no encontrada"
                });
            }

            var ingredientesBase =
                await _recetaRepo
                    .ObtenerIngredientesPorRecetaAsync(
                        recetaId);

            var respuesta = new RecetaEscaladaDto
            {
                RecetaId = receta.Id,
                NombreReceta = receta.Nombre,
                CantidadPersonas = personas,

                CostoTotalEstimado = Math.Round(
                    receta.CostoEstimado * personas,
                    2),

                Ingredientes = ingredientesBase
                    .Select(i => new IngredienteEscaladoDto
                    {
                        Nombre = i.NombreIngrediente,

                        CantidadRequerida = Math.Round(
                            i.CantidadBase * personas,
                            2),

                        UnidadMedida = i.UnidadMedida
                    })
                    .ToList()
            };

            return Ok(respuesta);
        }

        [HttpGet("lista-compras/{usuarioId:int}/{recetaId:int}")]
        public async Task<IActionResult> GenerarListaCompras(
            int usuarioId,
            int recetaId)
        {
            var usuario =
                await _usuarioRepo.ObtenerPorIdAsync(
                    usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado"
                });
            }

            var receta =
                await _recetaRepo.ObtenerPorIdAsync(
                    recetaId);

            if (receta == null)
            {
                return NotFound(new
                {
                    mensaje = "Receta no encontrada"
                });
            }

            var ingredientesReceta =
                await _recetaRepo
                    .ObtenerIngredientesPorRecetaAsync(
                        recetaId);

            var despensaUsuario =
                await _usuarioRepo
                    .ObtenerIngredientesPorUsuarioAsync(
                        usuarioId);

            int comensales = usuario.CantidadPersonas > 0
                ? usuario.CantidadPersonas
                : 1;

            var listaCompras = new ListaComprasDto
            {
                UsuarioId = usuario.Id,
                RecetaId = receta.Id,
                RecetaNombre = receta.Nombre,
                PresupuestoUsuario = usuario.Presupuesto,
                CostoEstimadoCompras = 0
            };

            foreach (var ing in ingredientesReceta)
            {
                bool yaEnCasa = despensaUsuario.Any(d =>
                    d.Contains(
                        ing.NombreIngrediente,
                        StringComparison.OrdinalIgnoreCase) ||
                    ing.NombreIngrediente.Contains(
                        d,
                        StringComparison.OrdinalIgnoreCase));

                if (!yaEnCasa)
                {
                    decimal cantEscalada = Math.Round(
                        ing.CantidadBase * comensales,
                        2);

                    var precios =
                        await _recetaRepo
                            .BuscarPreciosPorProductoAsync(
                                ing.NombreIngrediente);

                    var mejorPrecio = precios
                        .OrderBy(p => p.Precio)
                        .FirstOrDefault();

                    decimal precioUnitario =
                        mejorPrecio?.Precio ?? 3.00m;

                    decimal costoItem = Math.Round(
                        precioUnitario *
                        (cantEscalada > 0
                            ? cantEscalada
                            : 1),
                        2);

                    listaCompras.ItemsAComprar.Add(
                        new ItemCompraDto
                        {
                            Ingrediente =
                                ing.NombreIngrediente,

                            Cantidad = cantEscalada,
                            Unidad = ing.UnidadMedida,
                            PrecioEstimado = costoItem,

                            MercadoSugerido =
                                mejorPrecio != null
                                    ? $"Mercado #{mejorPrecio.MercadoId}"
                                    : "Mercado Local"
                        });

                    listaCompras.CostoEstimadoCompras +=
                        costoItem;
                }
            }

            return Ok(listaCompras);
        }

        [HttpGet("mercados")]
        public async Task<IActionResult> ObtenerMercados()
        {
            var mercados =
                await _recetaRepo.ObtenerMercadosAsync();

            return Ok(mercados);
        }

        [HttpGet("{recetaId:int}/comparar-mercados")]
        public async Task<IActionResult> CompararPreciosPorMercado(
            int recetaId,
            [FromQuery] int personas = 1)
        {
            if (personas < 1 || personas > 30)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La cantidad de personas debe estar entre 1 y 30."
                });
            }

            var receta =
                await _recetaRepo.ObtenerPorIdAsync(
                    recetaId);

            if (receta == null)
            {
                return NotFound(new
                {
                    mensaje = "Receta no encontrada."
                });
            }

            var ingredientes =
                await _recetaRepo
                    .ObtenerIngredientesPorRecetaAsync(
                        recetaId);

            var mercados =
                await _recetaRepo.ObtenerMercadosAsync();

            var respuesta =
                new ComparativoMercadosRecetaDto
                {
                    RecetaId = receta.Id,
                    RecetaNombre = receta.Nombre
                };

            foreach (var mercado in mercados)
            {
                var preciosMercado =
                    await _recetaRepo
                        .ObtenerPreciosValidosPorMercadoAsync(
                            mercado.Id);

                var detalles =
                    new List<DetalleIngredienteMercadoDto>();

                foreach (var ingrediente in ingredientes)
                {
                    decimal cantidadNecesaria =
                        ingrediente.CantidadBase * personas;

                    var opciones = preciosMercado
                        .Where(p =>
                            CostosIngredientes.ProductoCompatible(
                                p.ProductoNombre,
                                ingrediente.NombreIngrediente))
                        .Select(p => new
                        {
                            Precio = p,

                            Costo = CostosIngredientes.Calcular(
                                cantidadNecesaria,
                                ingrediente.UnidadMedida,
                                p)
                        })
                        .Where(x =>
                            cantidadNecesaria > 0 &&
                            x.Costo.HasValue &&
                            x.Costo.Value >= 0)
                        .ToList();

                    var mejor = opciones
                        .OrderByDescending(x =>
                            CostosIngredientes.Normalizar(
                                x.Precio.ProductoNombre) ==
                            CostosIngredientes.Normalizar(
                                ingrediente.NombreIngrediente))
                        .ThenBy(x => x.Costo)
                        .FirstOrDefault();

                    decimal? costoIngrediente =
                        mejor?.Costo.HasValue == true
                            ? Math.Round(
                                mejor.Costo.Value,
                                2,
                                MidpointRounding.AwayFromZero)
                            : null;

                    detalles.Add(
                        new DetalleIngredienteMercadoDto
                        {
                            Ingrediente =
                                ingrediente.NombreIngrediente,

                            CantidadNecesaria =
                                cantidadNecesaria,

                            UnidadMedida =
                                ingrediente.UnidadMedida,

                            PrecioUnitarioReferencial =
                                mejor?.Precio.Precio ?? 0m,

                            CostoIngrediente =
                                costoIngrediente,

                            PrecioDisponible =
                                costoIngrediente.HasValue
                        });
                }

                decimal total = detalles.Sum(
                    d => d.CostoIngrediente ?? 0m);

                bool completo =
                    detalles.Count > 0 &&
                    detalles.All(
                        d => d.PrecioDisponible);

                respuesta.ComparativaPorMercado.Add(
                    new OpcionMercadoDto
                    {
                        MercadoId = mercado.Id,
                        MercadoNombre = mercado.Nombre,
                        CostoTotalProyectado = total,
                        TotalCompleto = completo,
                        DetalleIngredientes = detalles
                    });
            }

            return Ok(respuesta);
        }

        [HttpPost("feedback")]
        public async Task<IActionResult> RegistrarFeedback(
            [FromBody] RegistrarFeedbackDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var receta =
                await _recetaRepo.ObtenerPorIdAsync(
                    dto.RecetaId);

            if (receta == null)
            {
                return NotFound(new
                {
                    mensaje = "Receta no encontrada"
                });
            }

            var usuario =
                await _usuarioRepo.ObtenerPorIdAsync(
                    dto.UsuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado"
                });
            }

            var nuevoFeedback = new Feedback
            {
                UsuarioId = dto.UsuarioId,
                RecetaId = dto.RecetaId,
                Puntuacion = dto.Puntuacion,
                Comentario = dto.Comentario,
                FechaRegistro = DateTime.UtcNow
            };

            await _recetaRepo.RegistrarFeedbackAsync(
                nuevoFeedback);

            return Ok(new
            {
                mensaje =
                    "Calificación registrada exitosamente",

                puntuacion = dto.Puntuacion
            });
        }

        [HttpGet("{recetaId:int}/feedback/analitica")]
        public async Task<IActionResult> ObtenerAnaliticaFeedback(
            int recetaId)
        {
            var receta =
                await _recetaRepo.ObtenerPorIdAsync(
                    recetaId);

            if (receta == null)
            {
                return NotFound(new
                {
                    mensaje = "Receta no encontrada"
                });
            }

            var feedbacksValidos =
                await _recetaRepo
                    .ObtenerFeedbacksValidosPorRecetaAsync(
                        recetaId);

            double promedio = feedbacksValidos.Any()
                ? Math.Round(
                    feedbacksValidos.Average(
                        f => f.Puntuacion),
                    1)
                : 0.0;

            var resultado = new ResumenFeedbackDto
            {
                RecetaId = receta.Id,
                RecetaNombre = receta.Nombre,
                CalificacionPromedio = promedio,

                TotalEvaluacionesValidas =
                    feedbacksValidos.Count,

                Comentarios = feedbacksValidos.Select(
                    f => new ComentarioLimpioDto
                    {
                        Puntuacion = f.Puntuacion,
                        Comentario = f.Comentario,
                        Fecha = f.FechaRegistro
                    }).ToList()
            };

            return Ok(resultado);
        }
    }
}
