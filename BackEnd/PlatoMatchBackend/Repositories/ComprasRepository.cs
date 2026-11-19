using Microsoft.EntityFrameworkCore;
using PlatoMatchBackend.Data;
using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Repositories
{
    public class ComprasRepository : IComprasRepository
    {
        private readonly AppDbContext _context;

        public ComprasRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ListaCompra> GenerarOPersistirListaAsync(int usuarioId, int recetaId, List<ItemListaCompra> items)
        {
            var lista = new ListaCompra
            {
                UsuarioId = usuarioId,
                RecetaId = recetaId,
                FechaCreacion = DateTime.UtcNow,
                Items = items
            };

            await _context.ListasCompras.AddAsync(lista);
            await _context.SaveChangesAsync();
            return lista;
        }

        public async Task<ListaCompra?> ObtenerListaPorIdAsync(int listaId)
        {
            return await _context.ListasCompras
                .Include(l => l.Receta)
                .Include(l => l.Items)
                .FirstOrDefaultAsync(l => l.Id == listaId);
        }

        public async Task<ListaCompra?> ObtenerUltimaListaPorUsuarioAsync(int usuarioId)
        {
            return await _context.ListasCompras
                .Include(l => l.Receta)
                .Include(l => l.Items)
                .Where(l => l.UsuarioId == usuarioId)
                .OrderByDescending(l => l.FechaCreacion)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> ActualizarEstadoItemAsync(int itemId, bool comprado)
        {
            var item = await _context.ItemsListaCompras.FindAsync(itemId);
            if (item == null) return false;

            item.Comprado = comprado;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RegistrarPreparacionAsync(int usuarioId, int recetaId, decimal costo)
        {
            var registro = new HistorialPreparacion
            {
                UsuarioId = usuarioId,
                RecetaId = recetaId,
                CostoEjecutado = costo,
                FechaPreparacion = DateTime.UtcNow
            };

            await _context.HistorialPreparaciones.AddAsync(registro);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<HistorialPreparacion>> ObtenerHistorialUsuarioAsync(int usuarioId)
        {
            return await _context.HistorialPreparaciones
                .Where(h => h.UsuarioId == usuarioId)
                .ToListAsync();
        }

        public async Task<RecordatorioUsuario> GuardarRecordatorioAsync(int usuarioId, ConfigurarRecordatorioDto dto)
        {
            var existente = await _context.RecordatoriosUsuario
                .FirstOrDefaultAsync(r => r.UsuarioId == usuarioId);

            if (existente != null)
            {
                existente.HoraAlerta = dto.HoraAlerta;
                existente.Frecuencia = dto.Frecuencia;
                existente.Activo = dto.Activo;
                await _context.SaveChangesAsync();
                return existente;
            }

            var nuevo = new RecordatorioUsuario
            {
                UsuarioId = usuarioId,
                HoraAlerta = dto.HoraAlerta,
                Frecuencia = dto.Frecuencia,
                Activo = dto.Activo
            };

            await _context.RecordatoriosUsuario.AddAsync(nuevo);
            await _context.SaveChangesAsync();
            return nuevo;
        }

        public async Task<RecordatorioUsuario?> ObtenerRecordatorioAsync(int usuarioId)
        {
            return await _context.RecordatoriosUsuario
                .FirstOrDefaultAsync(r => r.UsuarioId == usuarioId);
        }
    }
}