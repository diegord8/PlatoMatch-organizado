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
        private readonly IRecetaRepository _recetaRepo;
        private readonly IUsuarioRepository _usuarioRepo;

        public ComprasController(
            IComprasRepository comprasRepo,
            IRecetaRepository recetaRepo,
            IUsuarioRepository usuarioRepo)
        {
            _comprasRepo = comprasRepo;
            _recetaRepo = recetaRepo;
            _usuarioRepo = usuarioRepo;
        }

        // HU-15: generacion y persistencia de lista de compras restando la despensa
        [HttpPost("generar/{usuarioId}/{recetaId}")]
        public async Task<IActionResult> GenerarLista(int usuarioId, int recetaId)
        {
            var usuario = await _usuarioRepo.ObtenerPorIdAsync(usuarioId);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado" });

            var receta = await _recetaRepo.ObtenerPorIdAsync(recetaId);
            if (receta == null) return NotFound(new { mensaje = "Receta no encontrada" });

            var ingredientesReceta = await _recetaRepo.ObtenerIngredientesPorRecetaAsync(recetaId);
            var despensa = await _usuarioRepo.ObtenerIngredientesPorUsuarioAsync(usuarioId);

            int comensales = usuario.CantidadPersonas > 0 ? usuario.CantidadPersonas : 1;
            var itemsFaltantes = new List<ItemListaCompra>();

            foreach (var ing in ingredientesReceta)
            {
                bool enCasa = despensa.Any(d => d.Contains(ing.NombreIngrediente, StringComparison.OrdinalIgnoreCase) ||
                                                ing.NombreIngrediente.Contains(d, StringComparison.OrdinalIgnoreCase));

                if (!enCasa)
                {
                    decimal cantFinal = Math.Round(ing.CantidadBase * comensales, 2);
                    var precios = await _recetaRepo.BuscarPreciosPorProductoAsync(ing.NombreIngrediente);
                    decimal mejorPrecio = precios.OrderBy(p => p.Precio).FirstOrDefault()?.Precio ?? 3.50m;

                    itemsFaltantes.Add(new ItemListaCompra
                    {
                        Ingrediente = ing.NombreIngrediente,
                        Cantidad = cantFinal,
                        UnidadMedida = ing.UnidadMedida,
                        PrecioEstimado = Math.Round(mejorPrecio * cantFinal, 2),
                        Comprado = false
                    });
                }
            }

            var listaCreada = await _comprasRepo.GenerarOPersistirListaAsync(usuarioId, recetaId, itemsFaltantes);
            return Ok(new
            {
                mensaje = "Lista de compras construida con insumos faltantes",
                listaId = listaCreada.Id,
                receta = receta.Nombre,
                totalItems = itemsFaltantes.Count
            });
        }

        // HU-16: visualizacion del estado y seguimiento de lista 
        [HttpGet("{listaId}/seguimiento")]
        public async Task<IActionResult> ObtenerSeguimiento(int listaId)
        {
            var lista = await _comprasRepo.ObtenerListaPorIdAsync(listaId);
            if (lista == null) return NotFound(new { mensaje = "Lista no encontrada" });

            var pendientes = lista.Items.Where(i => !i.Comprado).ToList();
            var comprados = lista.Items.Where(i => i.Comprado).ToList();

            var respuesta = new EstadoListaComprasDto
            {
                ListaId = lista.Id,
                RecetaNombre = lista.Receta?.Nombre ?? "Receta",
                TotalEstimado = lista.Items.Sum(i => i.PrecioEstimado),
                PendientePorPagar = pendientes.Sum(i => i.PrecioEstimado),
                Pendientes = pendientes,
                Comprados = comprados
            };

            return Ok(respuesta);
        }

        // HU-16: marcar el insumo como comprado / desmarcar
        [HttpPatch("items/marcar")]
        public async Task<IActionResult> MarcarItem([FromBody] MarcarItemDto dto)
        {
            var actualizado = await _comprasRepo.ActualizarEstadoItemAsync(dto.ItemId, dto.Comprado);
            if (!actualizado) return NotFound(new { mensaje = "Item no encontrado" });

            return Ok(new { mensaje = dto.Comprado ? "Insumo movido a 'Comprados'" : "Insumo movido a 'Pendientes'" });
        }

        // HU-17: Exportar lista de compras a bloque de texto plano
        [HttpGet("{listaId}/exportar-texto")]
        public async Task<IActionResult> ExportarTextoPlano(int listaId)
        {
            var lista = await _comprasRepo.ObtenerListaPorIdAsync(listaId);
            if (lista == null) return NotFound(new { mensaje = "Lista no encontrada" });

            var sb = new StringBuilder();
            sb.AppendLine($" *LISTA DE COMPRAS - PLATOMATCH*");
            sb.AppendLine($"Plato: {lista.Receta?.Nombre}");
            sb.AppendLine($"Fecha: {lista.FechaCreacion:dd/MM/yyyy}");
            sb.AppendLine("----------------------------------------");
            sb.AppendLine("INSUMOS POR COMPRAR:");

            foreach (var item in lista.Items)
            {
                string estado = item.Comprado ? "[X]" : "[ ]";
                sb.AppendLine($"{estado} {item.Ingrediente} - {item.Cantidad} {item.UnidadMedida} (~S/ {item.PrecioEstimado:F2})");
            }

            sb.AppendLine("----------------------------------------");
            sb.AppendLine($"Total Estimado: S/ {lista.Items.Sum(i => i.PrecioEstimado):F2}");
            sb.AppendLine("PlatoMatch: Tu asistente de cocina y ahorro.");

            return Ok(new ExportacionTextoDto { FormatoPlano = sb.ToString() });
        }

        // HU-18: Resumen de Ahorro Económico
        [HttpGet("ahorro/{usuarioId}")]
        public async Task<IActionResult> ObtenerResumenAhorro(int usuarioId)
        {
            var usuario = await _usuarioRepo.ObtenerPorIdAsync(usuarioId);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado" });

            var preparaciones = await _comprasRepo.ObtenerHistorialUsuarioAsync(usuarioId);

            decimal gastoTotal = preparaciones.Sum(p => p.CostoEjecutado);
            decimal presupuestoBase = usuario.Presupuesto > 0 ? usuario.Presupuesto : 60.00m;
            decimal ahorro = Math.Max(0, presupuestoBase - gastoTotal);

            var resumen = new ResumenAhorroDto
            {
                UsuarioId = usuario.Id,
                PresupuestoAsignado = presupuestoBase,
                TotalGastoEjecutado = gastoTotal,
                AhorroAcumulado = Math.Round(ahorro, 2),
                TotalRecetasPreparadas = preparaciones.Count,
                MensajeImpacto = ahorro > 0
                    ? $"Has acumulado S/ {ahorro:F2} de ahorro este ciclo"
                    : "Continúa planificando para optimizar tu presupuesto."
            };

            return Ok(resumen);
        }

        [HttpPost("preparar/{usuarioId}/{recetaId}")]
        public async Task<IActionResult> RegistrarPlatoPreparado(int usuarioId, int recetaId, [FromQuery] decimal costo)
        {
            await _comprasRepo.RegistrarPreparacionAsync(usuarioId, recetaId, costo);
            return Ok(new { mensaje = "Preparación registrada en el historial de gastos" });
        }
    }
}