using Microsoft.EntityFrameworkCore;
using PlatoMatchBackend.Data;
using PlatoMatchBackend.Models;


namespace PlatoMatchBackend.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly AppDbContext _context;
        public UsuarioRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Usuario?> ObtenerPorCorreoAsync(string correo)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo);
        }

        //Obtener usuario por ID
        public async Task<Usuario?> ObtenerPorIdAsync(int id)
        {
            return await _context.Usuarios.FindAsync(id);
        }

        public async Task RegistrarUsuarioAsync(Usuario usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }


// Consultar despensa con cantidades reales.
public async Task<List<InventarioUsuario>>
    ObtenerInventarioConCantidadesAsync(int usuarioId)
{
    return await _context.InventarioUsuarios
        .AsNoTracking()
        .Where(i => i.UsuarioId == usuarioId)
        .OrderBy(i => i.NombreIngrediente)
        .ToListAsync();
}

// Guardar despensa sin ingredientes duplicados.
public async Task GuardarInventarioConCantidadesAsync(
    int usuarioId,
    List<IngredienteDespensaDto> ingredientes)
{
    var anteriores = await _context.InventarioUsuarios
        .Where(i => i.UsuarioId == usuarioId)
        .ToListAsync();

    var unicos = ingredientes
        .Where(i => !string.IsNullOrWhiteSpace(
            i.NombreIngrediente))
        .GroupBy(i => CostosIngredientes.Normalizar(
            i.NombreIngrediente))
        .Select(g => g.Last())
        .ToList();

    _context.InventarioUsuarios.RemoveRange(anteriores);

    var nuevos = unicos.Select(i => new InventarioUsuario
    {
        UsuarioId = usuarioId,
        NombreIngrediente = i.NombreIngrediente.Trim(),
        Cantidad = i.Cantidad,
        UnidadMedida = i.Cantidad.HasValue
            ? i.UnidadMedida?.Trim()
            : null
    }).ToList();

    await _context.InventarioUsuarios.AddRangeAsync(nuevos);

    await _context.SaveChangesAsync();
}


        public async Task GuardarIngredientesAsync(int usuarioId, List<string> ingredientes)
        {
            //Borrar los ingredientes anteriores del usuario para que no se dupliquen
            var ingredientesViejos = await _context.InventarioUsuarios
                                                .Where(i => i.UsuarioId == usuarioId)
                                                .ToListAsync();
            if (ingredientesViejos.Any())
            {
                _context.InventarioUsuarios.RemoveRange(ingredientesViejos);
            }

            // Insertar los nuevos (si hay alguno)
            if (ingredientes != null && ingredientes.Any())
            {
                var registros = ingredientes.Select(ing => new InventarioUsuario
                {
                    UsuarioId = usuarioId,
                    NombreIngrediente = ing.Trim()
                }).ToList();

                await _context.InventarioUsuarios.AddRangeAsync(registros);
            }

            await _context.SaveChangesAsync();
        }

        //Obtener lista de ingredientes que el usuario tiene

        public async Task<List<string>> ObtenerIngredientesPorUsuarioAsync(int usuarioId)
        {
            return await _context.InventarioUsuarios
            .Where(i => i.UsuarioId == usuarioId)
            .Select(i => i.NombreIngrediente)
            .ToListAsync();
        }

        public async Task ActualizarUsuarioAsync(Usuario usuario)
        {
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();
        }
    }
}