using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatoMatchBackend.Data;
using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdministracionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Administracion/resumen
        [HttpGet("resumen")]
        public async Task<IActionResult> ObtenerResumen()
        {
            var mercados = await _context.Mercados
                .AsNoTracking()
                .OrderBy(m => m.Nombre)
                .ToListAsync();

            var mapaMercados = mercados.ToDictionary(m => m.Id, m => m.Nombre);

            var preciosRaw = await _context.PreciosMercado
                .AsNoTracking()
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            var precios = preciosRaw.Select(p => new
            {
                id = p.Id,
                productoNombre = p.ProductoNombre,
                precio = p.Precio,
                cantidadPrecio = p.CantidadPrecio,
                unidadPrecio = p.UnidadPrecio,
                mercadoId = p.MercadoId,
                mercadoNombre = mapaMercados.TryGetValue(p.MercadoId, out var nombre) ? nombre : "Mercado",
                fechaRegistro = p.FechaRegistro
            }).ToList();

            var feedbacksRaw = await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.Usuario)
                .Include(f => f.Receta)
                .OrderByDescending(f => f.Id)
                .ToListAsync();

            var feedbacks = feedbacksRaw.Select(f => new
            {
                id = f.Id,
                usuarioId = f.UsuarioId,
                usuarioNombre = f.Usuario?.Nombre ?? "Usuario",
                recetaId = f.RecetaId,
                recetaNombre = f.Receta?.Nombre ?? "Receta",
                puntuacion = f.Puntuacion,
                comentario = f.Comentario,
                fechaRegistro = f.FechaRegistro
            }).ToList();

            return Ok(new
            {
                mercados,
                precios,
                feedbacks,
                totalUsuarios = await _context.Usuarios.CountAsync(),
                totalRecetas = await _context.Recetas.CountAsync(),
                totalPrecios = precios.Count,
                totalFeedbacks = feedbacks.Count
            });
        }

        // POST: api/Administracion/precios
        [HttpPost("precios")]
        public async Task<IActionResult> RegistrarPrecio([FromBody] PrecioAdminDto dto)
        {
            var nombreProducto = (dto.ProductoNombre ?? dto.Producto ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(nombreProducto))
                return BadRequest(new { mensaje = "El nombre del producto es obligatorio." });

            if (dto.Precio <= 0)
                return BadRequest(new { mensaje = "Ingresa un precio mayor que S/. 0." });

            var cantidad = dto.CantidadPrecio > 0 ? dto.CantidadPrecio : 1m;
            var unidad = string.IsNullOrWhiteSpace(dto.UnidadPrecio) ? "unidad" : dto.UnidadPrecio.Trim();

            // Resolver MercadoId (por ID o por nombre)
            int mercadoId = dto.MercadoId ?? 0;
            if (mercadoId <= 0 && !string.IsNullOrWhiteSpace(dto.Mercado))
            {
                var mercadoEncontrado = await _context.Mercados
                    .FirstOrDefaultAsync(m => m.Nombre.ToLower() == dto.Mercado.Trim().ToLower());

                if (mercadoEncontrado == null)
                {
                    mercadoEncontrado = new Mercado { Nombre = dto.Mercado.Trim() };
                    _context.Mercados.Add(mercadoEncontrado);
                    await _context.SaveChangesAsync();
                }
                mercadoId = mercadoEncontrado.Id;
            }

            if (mercadoId <= 0)
            {
                var primerMercado = await _context.Mercados.FirstOrDefaultAsync();
                if (primerMercado == null)
                    return BadRequest(new { mensaje = "Debes seleccionar un mercado válido." });
                mercadoId = primerMercado.Id;
            }

            var nuevoPrecio = new PrecioMercado
            {
                ProductoNombre = nombreProducto,
                Precio = dto.Precio,
                MercadoId = mercadoId,
                CantidadPrecio = cantidad,
                UnidadPrecio = unidad,
                FechaRegistro = DateTime.UtcNow
            };

            _context.PreciosMercado.Add(nuevoPrecio);
            await _context.SaveChangesAsync();

            var mercadoObj = await _context.Mercados.FindAsync(mercadoId);

            return Ok(new
            {
                id = nuevoPrecio.Id,
                productoNombre = nuevoPrecio.ProductoNombre,
                precio = nuevoPrecio.Precio,
                cantidadPrecio = nuevoPrecio.CantidadPrecio,
                unidadPrecio = nuevoPrecio.UnidadPrecio,
                mercadoId = nuevoPrecio.MercadoId,
                mercadoNombre = mercadoObj?.Nombre ?? "Mercado",
                fechaRegistro = nuevoPrecio.FechaRegistro,
                mensaje = "Precio registrado correctamente."
            });
        }

        // PUT: api/Administracion/precios/{precioId}
        [HttpPut("precios/{precioId:int}")]
        public async Task<IActionResult> EditarPrecio(int precioId, [FromBody] PrecioAdminDto dto)
        {
            var existente = await _context.PreciosMercado.FindAsync(precioId);
            if (existente == null)
                return NotFound(new { mensaje = "Precio no encontrado." });

            var nombreProducto = (dto.ProductoNombre ?? dto.Producto ?? existente.ProductoNombre).Trim();
            if (string.IsNullOrWhiteSpace(nombreProducto))
                return BadRequest(new { mensaje = "El nombre del producto es obligatorio." });

            if (dto.Precio <= 0)
                return BadRequest(new { mensaje = "Ingresa un precio mayor que S/. 0." });

            existente.ProductoNombre = nombreProducto;
            existente.Precio = dto.Precio;
            if (dto.CantidadPrecio > 0) existente.CantidadPrecio = dto.CantidadPrecio;
            if (!string.IsNullOrWhiteSpace(dto.UnidadPrecio)) existente.UnidadPrecio = dto.UnidadPrecio.Trim();
            if (dto.MercadoId.HasValue && dto.MercadoId.Value > 0) existente.MercadoId = dto.MercadoId.Value;
            existente.FechaRegistro = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = existente.Id,
                productoNombre = existente.ProductoNombre,
                precio = existente.Precio,
                cantidadPrecio = existente.CantidadPrecio,
                unidadPrecio = existente.UnidadPrecio,
                mercadoId = existente.MercadoId,
                fechaRegistro = existente.FechaRegistro,
                mensaje = "Precio actualizado correctamente."
            });
        }

        // POST: api/Administracion/precios/limpiar
        [HttpPost("precios/limpiar")]
        public async Task<IActionResult> LimpiarPrecios()
        {
            var todos = await _context.PreciosMercado.OrderByDescending(p => p.Id).ToListAsync();
            var vistos = new HashSet<string>();
            var aEliminar = new List<PrecioMercado>();

            foreach (var p in todos)
            {
                if (string.IsNullOrWhiteSpace(p.ProductoNombre) || p.Precio <= 0)
                {
                    aEliminar.Add(p);
                    continue;
                }

                var clave = $"{p.ProductoNombre.Trim().ToLower()}|{p.MercadoId}|{p.Precio:0.00}|{p.CantidadPrecio:0.###}|{(p.UnidadPrecio ?? "").Trim().ToLower()}";
                if (!vistos.Add(clave))
                {
                    aEliminar.Add(p);
                }
            }

            if (aEliminar.Count > 0)
            {
                _context.PreciosMercado.RemoveRange(aEliminar);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                eliminados = aEliminar.Count,
                totalRestante = todos.Count - aEliminar.Count,
                mensaje = $"Limpieza completada. Se eliminaron {aEliminar.Count} registros inválidos o duplicados."
            });
        }

        // DELETE: api/Administracion/feedbacks/{feedbackId}
        [HttpDelete("feedbacks/{feedbackId:int}")]
        public async Task<IActionResult> EliminarFeedback(int feedbackId)
        {
            var feedback = await _context.Feedbacks.FindAsync(feedbackId);
            if (feedback == null)
                return NotFound(new { mensaje = "Feedback no encontrado." });

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Feedback eliminado correctamente." });
        }
    }

    public class PrecioAdminDto
    {
        public string? ProductoNombre { get; set; }
        public string? Producto { get; set; }
        public decimal Precio { get; set; }
        public int? MercadoId { get; set; }
        public string? Mercado { get; set; }
        public decimal CantidadPrecio { get; set; } = 1m;
        public string? UnidadPrecio { get; set; } = "unidad";
    }
}