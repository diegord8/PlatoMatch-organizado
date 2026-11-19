
using Microsoft.AspNetCore.Mvc;
using PlatoMatchBackend.Models;
using PlatoMatchBackend.Repositories;
using System.Text;

namespace PlatoMatchBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComprasController : ControllerBase
    {
        private readonly IComprasRepository _comprasRepo;
        private readonly IRecetaRepository _recetas;
        private readonly IUsuarioRepository _usuarios;

        public ComprasController(
            IComprasRepository comprasRepo,
            IRecetaRepository recetaRepo,
            IUsuarioRepository usuarioRepo)
        {
            _comprasRepo = comprasRepo;
            _recetas = recetaRepo;
            _usuarios = usuarioRepo;
        }

        // HU-15: Generar lista según receta y despensa.
        [HttpPost("generar/{usuarioId:int}/{recetaId:int}")]
        public async Task<IActionResult> GenerarLista(
            int usuarioId,
            int recetaId,
            [FromQuery] int personas = 1)
        {
            if (personas < 1 || personas > 30)
            {
                return BadRequest(new
                {
                    mensaje = "Cantidad de personas no válida."
                });
            }

            var usuario =
                await _usuarios.ObtenerPorIdAsync(usuarioId);

            var receta =
                await _recetas.ObtenerPorIdAsync(recetaId);

            if (usuario == null || receta == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario o receta no encontrado."
                });
            }

            var ingredientes =
                await _recetas.ObtenerIngredientesPorRecetaAsync(
                    recetaId);

            var despensa =
                await _usuarios.ObtenerInventarioConCantidadesAsync(
                    usuarioId);

            var precios =
                await _recetas.ObtenerTodosLosPreciosAsync();

            var items = new List<ItemListaCompra>();
            var avisos = new List<string>();

            foreach (var ingrediente in ingredientes)
            {
                decimal cantidadRequerida =
                    ingrediente.CantidadBase * personas;

                decimal cantidadDisponible = 0m;

                var coincidencias = despensa
                    .Where(d =>
                        CostosIngredientes.Normalizar(
                            d.NombreIngrediente) ==
                        CostosIngredientes.Normalizar(
                            ingrediente.NombreIngrediente))
                    .ToList();

                foreach (var disponible in coincidencias)
                {
                    if (!disponible.Cantidad.HasValue)
                    {
                        avisos.Add(
                            $"Falta indicar la cantidad disponible " +
                            $"de {ingrediente.NombreIngrediente}.");

                        continue;
                    }

                    decimal? convertido =
                        CostosIngredientes.ConvertirCantidad(
                            disponible.Cantidad.Value,
                            disponible.UnidadMedida ?? "",
                            ingrediente.UnidadMedida);

                    if (!convertido.HasValue)
                    {
                        avisos.Add(
                            $"No se puede convertir " +
                            $"{disponible.UnidadMedida} a " +
                            $"{ingrediente.UnidadMedida} para " +
                            $"{ingrediente.NombreIngrediente}.");

                        continue;
                    }

                    cantidadDisponible += convertido.Value;
                }

                decimal cantidadFaltante = Math.Max(
                    0m,
                    cantidadRequerida - cantidadDisponible);

                cantidadFaltante = Math.Round(
                    cantidadFaltante,
                    3,
                    MidpointRounding.AwayFromZero);

                if (cantidadFaltante <= 0)
                    continue;

                // Consultar precios compatibles en SQL Server.
                var costos = precios
                    .Where(p =>
                        CostosIngredientes.ProductoCompatible(
                            p.ProductoNombre,
                            ingrediente.NombreIngrediente))
                    .Select(p => CostosIngredientes.Calcular(
                        cantidadFaltante,
                        ingrediente.UnidadMedida,
                        p))
                    .Where(c => c.HasValue)
                    .Select(c => c!.Value)
                    .ToList();

                bool precioDisponible = costos.Count > 0;

                // No inventar costos cuando falta un precio.
                decimal precioEstimado = precioDisponible
                    ? costos.Min()
                    : 0m;

                if (!precioDisponible)
                {
                    avisos.Add(
                        $"No hay precio compatible para " +
                        $"{ingrediente.NombreIngrediente}.");
                }

                items.Add(new ItemListaCompra
                {
                    Ingrediente = ingrediente.NombreIngrediente,
                    Cantidad = cantidadFaltante,
                    UnidadMedida = ingrediente.UnidadMedida,
                    PrecioEstimado = precioEstimado,
                    PrecioDisponible = precioDisponible,
                    Comprado = false
                });
            }

            var lista =
                await _comprasRepo.GenerarOPersistirListaAsync(
                    usuarioId,
                    recetaId,
                    personas,
                    items);

            return Ok(new
            {
                listaId = lista.Id,
                receta = receta.Nombre,
                personas,
                totalItems = items.Count,
                subtotalConocido =
                    items.Sum(i => i.PrecioEstimado),
                preciosFaltantes =
                    items.Count(i => !i.PrecioDisponible),
                avisos = avisos.Distinct().ToList(),
                mensaje = "Lista generada correctamente."
            });
        }

        // Recuperar última lista del usuario.
        [HttpGet("ultima/{usuarioId:int}")]
        public async Task<IActionResult> UltimaLista(
            int usuarioId)
        {
            var usuario =
                await _usuarios.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            var lista =
                await _comprasRepo.ObtenerUltimaListaPorUsuarioAsync(
                    usuarioId);

            if (lista == null)
                return NoContent();

            return await CrearSeguimiento(lista);
        }

        // Consultar una lista y su progreso.
        [HttpGet("{listaId:int}/seguimiento")]
        public async Task<IActionResult> ObtenerSeguimiento(
            int listaId)
        {
            var lista =
                await _comprasRepo.ObtenerListaPorIdAsync(listaId);

            if (lista == null)
            {
                return NotFound(new
                {
                    mensaje = "Lista no encontrada."
                });
            }

            return await CrearSeguimiento(lista);
        }

        private async Task<IActionResult> CrearSeguimiento(
            ListaCompra lista)
        {
            var items = lista.Items
                .OrderBy(i => i.Id)
                .ToList();

            bool registrada =
                await _comprasRepo.ObtenerPreparacionPorListaAsync(
                    lista.Id) != null;

            var resultado = new EstadoListaComprasDto
            {
                ListaId = lista.Id,
                RecetaId = lista.RecetaId,

                RecetaNombre =
                    lista.Receta?.Nombre ?? "Receta",

                CantidadPersonas = lista.CantidadPersonas,
                FechaCreacion = lista.FechaCreacion,

                TotalEstimado =
                    items.Sum(i => i.PrecioEstimado),

                PendientePorPagar = items
                    .Where(i => !i.Comprado)
                    .Sum(i => i.PrecioEstimado),

                Pendientes = items
                    .Where(i => !i.Comprado)
                    .ToList(),

                Comprados = items
                    .Where(i => i.Comprado)
                    .ToList(),

                Registrada = registrada
            };

            return Ok(resultado);
        }

        // HU-16: Marcar ingredientes como comprados.
        [HttpPatch("items/marcar")]
        public async Task<IActionResult> MarcarItem(
            [FromBody] MarcarItemDto dto)
        {
            if (dto.ItemId < 1)
            {
                return BadRequest(new
                {
                    mensaje = "Ingrediente no válido."
                });
            }

            bool actualizado =
                await _comprasRepo.ActualizarEstadoItemAsync(
                    dto.ItemId,
                    dto.Comprado);

            if (!actualizado)
            {
                return NotFound(new
                {
                    mensaje = "Ingrediente no encontrado."
                });
            }

            return Ok(new
            {
                mensaje = "Ingrediente actualizado."
            });
        }

        // Exportar la lista completa a texto.
        [HttpGet("{listaId:int}/exportar-texto")]
        public async Task<IActionResult> ExportarTextoPlano(
            int listaId)
        {
            var lista =
                await _comprasRepo.ObtenerListaPorIdAsync(listaId);

            if (lista == null)
            {
                return NotFound(new
                {
                    mensaje = "Lista no encontrada."
                });
            }

            var texto = new StringBuilder();

            texto.AppendLine("LISTA DE COMPRAS - PLATOMATCH");
            texto.AppendLine($"Receta: {lista.Receta?.Nombre}");
            texto.AppendLine(
                $"Personas: {lista.CantidadPersonas}");
            texto.AppendLine(
                $"Fecha: {lista.FechaCreacion:dd/MM/yyyy}");
            texto.AppendLine("----------------------------");

            foreach (var item in lista.Items.OrderBy(i => i.Id))
            {
                string marca = item.Comprado ? "[X]" : "[ ]";

                string costo = item.PrecioDisponible
                    ? $"S/ {item.PrecioEstimado:F2}"
                    : "Sin precio disponible";

                texto.AppendLine(
                    $"{marca} {item.Ingrediente} - " +
                    $"{item.Cantidad} {item.UnidadMedida} - " +
                    costo);
            }

            texto.AppendLine("----------------------------");

            texto.AppendLine(
                $"Subtotal conocido: S/ " +
                $"{lista.Items.Sum(i => i.PrecioEstimado):F2}");

            if (lista.Items.Any(i => !i.PrecioDisponible))
            {
                texto.AppendLine(
                    "El total es parcial porque faltan precios.");
            }

            return Ok(new ExportacionTextoDto
            {
                FormatoPlano = texto.ToString()
            });
        }

        // HU-18: Registrar una preparación y su gasto.
        [HttpPost("registrar-preparacion/{usuarioId:int}")]
        public async Task<IActionResult> RegistrarPreparacion(
            int usuarioId,
            [FromBody] RegistrarPreparacionDto dto)
        {
            var usuario =
                await _usuarios.ObtenerPorIdAsync(usuarioId);

            var lista =
                await _comprasRepo.ObtenerListaPorIdAsync(
                    dto.ListaId);

            if (usuario == null ||
                lista == null ||
                lista.UsuarioId != usuarioId)
            {
                return NotFound(new
                {
                    mensaje = "Usuario o lista no encontrado."
                });
            }

            if (lista.Items.Any(i => !i.Comprado))
            {
                return BadRequest(new
                {
                    mensaje = "Marca todos los ingredientes primero."
                });
            }

            if (dto.CostoEjecutado < 0 ||
                dto.CostoEjecutado > 1000000 ||
                (lista.Items.Any() && dto.CostoEjecutado == 0))
            {
                return BadRequest(new
                {
                    mensaje = "Confirma un gasto válido."
                });
            }

            if (dto.CostoReferenciaAlternativa.HasValue)
            {
                decimal referencia =
                    dto.CostoReferenciaAlternativa.Value;

                if (referencia <= 0 || referencia > 1000000)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "El costo alternativo no es válido."
                    });
                }
            }

            var existente =
                await _comprasRepo.ObtenerPreparacionPorListaAsync(
                    lista.Id);

            if (existente != null)
            {
                return Conflict(new
                {
                    mensaje = "Esta lista ya fue registrada."
                });
            }

            await _comprasRepo.RegistrarPreparacionAsync(
                usuarioId,
                lista.RecetaId,
                lista.Id,
                dto.MercadoId,
                dto.CostoEjecutado,
                usuario.Presupuesto,
                dto.CostoReferenciaAlternativa);

            return Ok(new
            {
                mensaje = "Preparación registrada correctamente.",
                listaId = lista.Id,
                gastoReal = dto.CostoEjecutado,
                costoAlternativo =
                    dto.CostoReferenciaAlternativa
            });
        }

        // HU-18: Ahorro comparativo y acumulado mensual.
        [HttpGet("ahorro/{usuarioId:int}")]
        public async Task<IActionResult> ResumenAhorro(
            int usuarioId)
        {
            var usuario =
                await _usuarios.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            var historial =
                await _comprasRepo.ObtenerHistorialUsuarioAsync(
                    usuarioId);

            // Historial nuevo, asociado a una lista real.
            var preparaciones = historial
                .Where(h => h.ListaCompraId.HasValue)
                .ToList();

            var comparables = preparaciones
                .Where(h =>
                    h.CostoReferenciaAlternativa.HasValue)
                .ToList();

            decimal gastoTotal = preparaciones
                .Sum(h => h.CostoEjecutado);

            decimal presupuestoTotal = preparaciones
                .Sum(h => h.PresupuestoReferencia);

            decimal ahorroTotal = comparables.Sum(h =>
                h.CostoReferenciaAlternativa!.Value -
                h.CostoEjecutado);

            var ahorrosMensuales = comparables
                .GroupBy(h => new
                {
                    h.FechaPreparacion.Year,
                    h.FechaPreparacion.Month
                })
                .OrderByDescending(g => g.Key.Year)
                .ThenByDescending(g => g.Key.Month)
                .Select(g => new AhorroMensualDto
                {
                    Mes =
                        $"{g.Key.Year}-{g.Key.Month:D2}",

                    Ahorro = Math.Round(
                        g.Sum(h =>
                            h.CostoReferenciaAlternativa!.Value -
                            h.CostoEjecutado),
                        2),

                    GastoReal = g.Sum(h =>
                        h.CostoEjecutado),

                    Preparaciones = g.Count()
                })
                .ToList();

            var detalle = preparaciones
                .Select(h => new DetallePreparacionDto
                {
                    Id = h.Id,
                    ListaId = h.ListaCompraId,

                    Receta = h.Receta?.Nombre ??
                        $"Receta #{h.RecetaId}",

                    Fecha = h.FechaPreparacion,

                    GastoReal = h.CostoEjecutado,

                    PresupuestoReferencia =
                        h.PresupuestoReferencia,

                    SaldoFrentePresupuesto =
                        h.PresupuestoReferencia -
                        h.CostoEjecutado,

                    CostoReferenciaAlternativa =
                        h.CostoReferenciaAlternativa,

                    AhorroComparado =
                        h.CostoReferenciaAlternativa.HasValue
                            ? h.CostoReferenciaAlternativa.Value -
                              h.CostoEjecutado
                            : null
                })
                .ToList();

            var resultado = new ResumenAhorroDto
            {
                UsuarioId = usuarioId,

                PresupuestoAsignado = presupuestoTotal,

                TotalGastoEjecutado = gastoTotal,

                AhorroAcumulado = Math.Round(
                    ahorroTotal, 2),

                TotalRecetasPreparadas =
                    preparaciones.Count,

                PreparacionesConReferencia =
                    comparables.Count,

                RegistrosAntiguosNoVerificados =
                    historial.Count - preparaciones.Count,

                MensajeImpacto =
                    "Ahorro comparativo según costos " +
                    "alternativos registrados por el usuario.",

                AhorrosMensuales = ahorrosMensuales,

                Detalle = detalle
            };

            return Ok(resultado);
        }
    }
}
