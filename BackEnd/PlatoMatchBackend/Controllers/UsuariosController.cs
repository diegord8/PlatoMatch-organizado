using Microsoft.AspNetCore.Mvc;
using PlatoMatchBackend.Builders;
using PlatoMatchBackend.Models;
using PlatoMatchBackend.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace PlatoMatchBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioRepository _repository;

        public UsuariosController(IUsuarioRepository repository)
        {
            _repository = repository;
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }

        // HU01 a HU04: registro de usuario y perfil inicial
        [HttpPost("registro")]
        public async Task<IActionResult> Registrar([FromBody] RegistroUsuarioDto dto)
        {
            try
            {
                var existente = await _repository.ObtenerPorCorreoAsync(dto.Correo);
                if (existente != null)
                {
                    return BadRequest(new { mensaje = "Ya existe una cuenta asociada a este correo electrónico" });
                }
                dto.Contrasena = HashPassword(dto.Contrasena);
                var nuevoUsuario = new UsuarioBuilder()
                    .ConCredenciales(dto.Nombre, dto.Correo, dto.Contrasena)
                    .ConPresupuesto(dto.Presupuesto)
                    .ConCantidadPersonas(dto.CantidadPersonas)
                    .ConRestricciones(dto.RestriccionesSalud)
                    .Build();

                await _repository.RegistrarUsuarioAsync(nuevoUsuario);

                return Ok(new { mensaje = "Usuario registrado exitosamente", usuarioId = nuevoUsuario.Id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var usuario = await _repository.ObtenerPorCorreoAsync(dto.Correo);
            if (usuario == null || usuario.Contrasena != HashPassword(dto.Contrasena))
            {
                return Unauthorized(new { mensaje = "Credenciales incorrectas" });
            }

            return Ok(new 
            { 
                id = usuario.Id,
                nombre = usuario.Nombre,
                correo = usuario.Correo,
                presupuesto = usuario.Presupuesto,
                cantidadPersonas = usuario.CantidadPersonas,
                restriccionesSalud = usuario.RestriccionesSalud
            });
        }

        [HttpGet("existe-correo")]
        public async Task<IActionResult> ExisteCorreo([FromQuery] string correo)
        {
            var existente = await _repository.ObtenerPorCorreoAsync(correo);
            return Ok(new { existe = existente != null });
        }

        // HU05: guardar ingredientes disponibles
        [HttpPost("{usuarioId}/ingredientes")]
        public async Task<IActionResult> RegistrarIngredientes(int usuarioId, [FromBody] List<string> ingredientes)
        {
            if (ingredientes == null)
            {
                return BadRequest(new { mensaje = "La lista de ingredientes no puede ser nula" });
            }

            // El repositorio ahora se encarga de borrar los duplicados y guardar los nuevos
            await _repository.GuardarIngredientesAsync(usuarioId, ingredientes);
            return Ok(new { mensaje = "Ingredientes guardados correctamente sin duplicar" });
        }

        // HU05 consultar ingredientes disponibles
        [HttpGet("{usuarioId}/ingredientes")]
        public async Task<IActionResult> ObtenerIngredientes(int usuarioId)
        {
            var lista = await _repository.ObtenerIngredientesPorUsuarioAsync(usuarioId);
            return Ok(lista);
        }

        // HU-19: Edición de perfil alimentario y presupuesto
        [HttpPut("{id}/perfil")]
        public async Task<IActionResult> EditarPerfil(int id, [FromBody] EditarPerfilDto dto)
        {
            var usuario = await _repository.ObtenerPorIdAsync(id);
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado" });

            usuario.Presupuesto = dto.Presupuesto;
            usuario.CantidadPersonas = dto.CantidadPersonas > 0 ? dto.CantidadPersonas : 1;
            usuario.RestriccionesSalud = dto.RestriccionesSalud;

            await _repository.ActualizarUsuarioAsync(usuario);

            return Ok(new { mensaje = "Perfil de salud actualizado correctamente" });
        }

        // HU-20: Configurar recordatorios de planificación
        [HttpPost("{id}/recordatorios")]
        public async Task<IActionResult> ConfigurarRecordatorios(int id, [FromBody] ConfigurarRecordatorioDto dto, [FromServices] IComprasRepository comprasRepo)
        {
            var usuario = await _repository.ObtenerPorIdAsync(id); 
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado" });

            var recordatorio = await comprasRepo.GuardarRecordatorioAsync(id, dto);
            return Ok(new
            {
                mensaje = $"Recordatorio configurado para las {recordatorio.HoraAlerta} con frecuencia {recordatorio.Frecuencia}",
                datos = recordatorio
            });
        }
    }

    // DTOs con todas las propiedades requeridas
    public class RegistroUsuarioDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
        public decimal Presupuesto { get; set; }
        public int CantidadPersonas { get; set; }
        public string? RestriccionesSalud { get; set; }
    }

    public class LoginDto
    {
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }
    
    
}