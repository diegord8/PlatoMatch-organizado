using Microsoft.EntityFrameworkCore;
using PlatoMatchBackend.Data;
using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        public async Task RegistrarUsuarioAsync(Usuario usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }
    }
}
