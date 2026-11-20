
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

        public async Task<List<Mercado>>
            ObtenerMercadosAsync()
        {
            return await _context.Mercados
                .AsNoTracking()
                .OrderBy(m => m.Nombre)
                .ToListAsync();
        }

        
    }
}
