
using Microsoft.EntityFrameworkCore;
using PlatoMatchBackend.Data;
using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Repositories
{
    public class RecetaRepository : IRecetaRepository
    {
        private readonly AppDbContext _context;

        public RecetaRepository(AppDbContext context)
        {
            _context = context;
        }

        // ========================================
        // RECETAS
        // ========================================

        public async Task<List<Receta>> ObtenerTodasAsync()
        {
            return await _context.Recetas
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Receta?> ObtenerPorIdAsync(int id)
        {
            return await _context.Recetas
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        // ========================================
        // HU-09: RECUPERAR PRECIOS DE SQL SERVER
        // ========================================

        // Consultar precios válidos de un mercado.
        public async Task<List<PrecioMercado>>
            ObtenerPreciosPorMercadoAsync(int mercadoId)
        {
            if (mercadoId <= 0)
            {
                return new List<PrecioMercado>();
            }

            return await _context.PreciosMercado
                .AsNoTracking()
                .Where(p =>
                    p.MercadoId == mercadoId &&
                    p.Precio > 0 &&
                    p.CantidadPrecio > 0)
                .OrderBy(p => p.ProductoNombre)
                .ThenByDescending(p => p.FechaRegistro)
                .ToListAsync();
        }

        // Buscar precios de un producto en los mercados.
        public async Task<List<PrecioMercado>>
            BuscarPreciosPorProductoAsync(string producto)
        {
            if (string.IsNullOrWhiteSpace(producto))
            {
                return new List<PrecioMercado>();
            }

            string nombre = producto.Trim();

            return await _context.PreciosMercado
                .AsNoTracking()
                .Where(p =>
                    p.ProductoNombre.Contains(nombre) &&
                    p.Precio > 0 &&
                    p.CantidadPrecio > 0)
                .OrderBy(p => p.Precio)
                .ToListAsync();
        }

        // Obtener todos los precios válidos.
        // Utilizado también por las listas de compras.
        public async Task<List<PrecioMercado>>
            ObtenerTodosLosPreciosAsync()
        {
            return await _context.PreciosMercado
                .AsNoTracking()
                .Where(p =>
                    p.Precio > 0 &&
                    p.CantidadPrecio > 0)
                .OrderBy(p => p.ProductoNombre)
                .ToListAsync();
        }

        // ========================================
        // PLATOS FAVORITOS
        // ========================================

        public async Task<bool> GuardarPlatoFavoritoAsync(
            int usuarioId,
            int recetaId)
        {
            var yaExiste = await _context.PlatosGuardados
                .AnyAsync(p =>
                    p.UsuarioId == usuarioId &&
                    p.RecetaId == recetaId);

            if (yaExiste)
            {
                return false;
            }

            var favorito = new PlatoGuardado
            {
                UsuarioId = usuarioId,
                RecetaId = recetaId,
                FechaGuardado = DateTime.UtcNow
            };

            await _context.PlatosGuardados
                .AddAsync(favorito);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<Receta>>
            ObtenerPlatosGuardadosAsync(int usuarioId)
        {
            return await _context.PlatosGuardados
                .AsNoTracking()
                .Where(p => p.UsuarioId == usuarioId)
                .Include(p => p.Receta)
                .Select(p => p.Receta!)
                .ToListAsync();
        }

        public async Task<bool> EliminarPlatoGuardadoAsync(
            int usuarioId,
            int recetaId)
        {
            var favorito = await _context.PlatosGuardados
                .FirstOrDefaultAsync(p =>
                    p.UsuarioId == usuarioId &&
                    p.RecetaId == recetaId);

            if (favorito == null)
            {
                return false;
            }

            _context.PlatosGuardados.Remove(favorito);

            await _context.SaveChangesAsync();

            return true;
        }

        // ========================================
        // INGREDIENTES DE RECETAS
        // ========================================

        public async Task<List<RecetaIngrediente>>
            ObtenerIngredientesPorRecetaAsync(int recetaId)
        {
            return await _context.RecetaIngredientes
                .AsNoTracking()
                .Where(i => i.RecetaId == recetaId)
                .ToListAsync();
        }

        // ========================================
        // HU-11: MERCADOS DISPONIBLES
        // ========================================

        public async Task<List<Mercado>>
            ObtenerMercadosAsync()
        {
            return await _context.Mercados
                .AsNoTracking()
                .OrderBy(m => m.Nombre)
                .ToListAsync();
        }

        // ========================================
        // HU-12: PRECIOS PARA COMPARACIÓN
        // ========================================

        public async Task<List<PrecioMercado>>
            ObtenerPreciosValidosPorMercadoAsync(
                int mercadoId)
        {
            return await ObtenerPreciosPorMercadoAsync(
                mercadoId);
        }

        // ========================================
        // HU-13: REGISTRO DE FEEDBACK
        // ========================================

        public async Task<bool> RegistrarFeedbackAsync(
            Feedback feedback)
        {
            await _context.Feedbacks
                .AddAsync(feedback);

            await _context.SaveChangesAsync();

            return true;
        }

        // ========================================
        // HU-14: CONSULTA DE FEEDBACKS
        // ========================================

        public async Task<List<Feedback>>
            ObtenerFeedbacksValidosPorRecetaAsync(
                int recetaId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f =>
                    f.RecetaId == recetaId &&
                    f.Puntuacion >= 1 &&
                    f.Puntuacion <= 5)
                .OrderByDescending(f => f.FechaRegistro)
                .ToListAsync();
        }
    }
}
