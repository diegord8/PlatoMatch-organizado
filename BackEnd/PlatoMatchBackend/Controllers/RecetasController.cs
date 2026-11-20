
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

        [HttpGet("mercados")]
        public async Task<IActionResult> ObtenerMercados()
        {
            var mercados =
                await _recetaRepo.ObtenerMercadosAsync();

            return Ok(mercados);
        }

}
