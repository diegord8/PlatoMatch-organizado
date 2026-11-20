
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

        // HU-15: Generar y guardar lista de compras.
        public async Task<ListaCompra> GenerarOPersistirListaAsync(
            int usuarioId,
            int recetaId,
            int personas,
            List<ItemListaCompra> items)
        {
            var lista = new ListaCompra
            {
                UsuarioId = usuarioId,
                RecetaId = recetaId,
                CantidadPersonas = personas,
                FechaCreacion = DateTime.UtcNow,
                Items = items
            };

            await _context.ListasCompras.AddAsync(lista);
            await _context.SaveChangesAsync();

            return lista;
        }

        // Obtener una lista con receta e ingredientes.
        public async Task<ListaCompra?> ObtenerListaPorIdAsync(
            int listaId)
        {
            return await _context.ListasCompras
                .Include(l => l.Receta)
                .Include(l => l.Items)
                .FirstOrDefaultAsync(l => l.Id == listaId);
        }

        // Recuperar la última lista del usuario.
        public async Task<ListaCompra?>
            ObtenerUltimaListaPorUsuarioAsync(int usuarioId)
        {
            return await _context.ListasCompras
                .Include(l => l.Receta)
                .Include(l => l.Items)
                .Where(l => l.UsuarioId == usuarioId)
                .OrderByDescending(l => l.FechaCreacion)
                .ThenByDescending(l => l.Id)
                .FirstOrDefaultAsync();
        }

        // HU-16: Marcar o desmarcar ingredientes.
        public async Task<bool> ActualizarEstadoItemAsync(
            int itemId,
            bool comprado)
        {
            var item = await _context.ItemsListaCompras
                .FindAsync(itemId);

            if (item == null)
                return false;

            item.Comprado = comprado;

            await _context.SaveChangesAsync();

            return true;
        }

        // Evitar duplicar una preparación.
        public async Task<HistorialPreparacion?>
            ObtenerPreparacionPorListaAsync(int listaId)
        {
            return await _context.HistorialPreparaciones
                .FirstOrDefaultAsync(
                    p => p.ListaCompraId == listaId);
        }

        // HU-18: Registrar gasto y costo alternativo.
        public async Task<bool> RegistrarPreparacionAsync(
            int usuarioId,
            int recetaId,
            int listaId,
            int? mercadoId,
            decimal costo,
            decimal presupuesto,
            decimal? costoReferenciaAlternativa)
        {
            var registro = new HistorialPreparacion
            {
                UsuarioId = usuarioId,
                RecetaId = recetaId,
                ListaCompraId = listaId,
                MercadoId = mercadoId,

                CostoEjecutado = Math.Round(
                    costo,
                    2,
                    MidpointRounding.AwayFromZero),

                PresupuestoReferencia = Math.Round(
                    presupuesto,
                    2,
                    MidpointRounding.AwayFromZero),

                CostoReferenciaAlternativa =
                    costoReferenciaAlternativa.HasValue
                        ? Math.Round(
                            costoReferenciaAlternativa.Value,
                            2,
                            MidpointRounding.AwayFromZero)
                        : null,

                FechaPreparacion = DateTime.UtcNow
            };

            await _context.HistorialPreparaciones
                .AddAsync(registro);

            await _context.SaveChangesAsync();

            return true;
        }

        // Consultar preparaciones guardadas.
        public async Task<List<HistorialPreparacion>>
            ObtenerHistorialUsuarioAsync(int usuarioId)
        {
            return await _context.HistorialPreparaciones
                .AsNoTracking()
                .Where(h => h.UsuarioId == usuarioId)
                .Include(h => h.Receta)
                .OrderByDescending(h => h.FechaPreparacion)
                .ThenByDescending(h => h.Id)
                .ToListAsync();
        }

        // HU-20: Guardar recordatorio.
        public async Task<RecordatorioUsuario>
            GuardarRecordatorioAsync(
                int usuarioId,
                ConfigurarRecordatorioDto dto)
        {
            var existente = await _context.RecordatoriosUsuario
                .FirstOrDefaultAsync(
                    r => r.UsuarioId == usuarioId);

            // Recordatorio diario, sin selector de frecuencia.
            if (existente != null)
            {
                existente.HoraAlerta = dto.HoraAlerta;
                existente.Frecuencia = "Diario";
                existente.Activo = dto.Activo;

                await _context.SaveChangesAsync();

                return existente;
            }

            var nuevo = new RecordatorioUsuario
            {
                UsuarioId = usuarioId,
                HoraAlerta = dto.HoraAlerta,
                Frecuencia = "Diario",
                Activo = dto.Activo
            };

            await _context.RecordatoriosUsuario
                .AddAsync(nuevo);

            await _context.SaveChangesAsync();

            return nuevo;
        }

        // Recuperar recordatorio desde SQL Server.
        public async Task<RecordatorioUsuario?>
            ObtenerRecordatorioAsync(int usuarioId)
        {
            return await _context.RecordatoriosUsuario
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    r => r.UsuarioId == usuarioId);
        }
    }
}
