
using Microsoft.EntityFrameworkCore;
using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // USUARIOS Y DESPENSA
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<InventarioUsuario> InventarioUsuarios { get; set; }

        // RECETAS E INGREDIENTES
        public DbSet<Receta> Recetas { get; set; }
        public DbSet<RecetaIngrediente> RecetaIngredientes { get; set; }
        public DbSet<PlatoGuardado> PlatosGuardados { get; set; }

        // MERCADOS Y PRECIOS
        public DbSet<Mercado> Mercados { get; set; }
        public DbSet<PrecioMercado> PreciosMercado { get; set; }

        // OPINIONES Y CALIFICACIONES
        public DbSet<Feedback> Feedbacks { get; set; }

        // LISTAS DE COMPRAS
        public DbSet<ListaCompra> ListasCompras { get; set; }
        public DbSet<ItemListaCompra> ItemsListaCompras { get; set; }

        // HISTORIAL DE COMPRAS Y AHORRO
        public DbSet<HistorialPreparacion> HistorialPreparaciones { get; set; }

        // RECORDATORIOS
        public DbSet<RecordatorioUsuario> RecordatoriosUsuario { get; set; }
    }
}
