
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

        

       
    }
}
