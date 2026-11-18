using Microsoft.AspNetCore.Mvc;

using PlatoMatchBackend.Builders;

using PlatoMatchBackend.Models;

using PlatoMatchBackend.Repositories;

using System.Security.Cryptography;

using System.Text;

using System.Globalization;



namespace PlatoMatchBackend.Controllers

{

  [ApiController]

  [Route("api/[controller]")]

  public class UsuariosController : ControllerBase

  {
    private readonly IUsuarioRepository _repository;
    public UsuariosController(

      IUsuarioRepository repository)

    {

      _repository = repository;

    }



    // Mantiene el hash utilizado por las cuentas existentes.

    private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();

            var bytes = sha256.ComputeHash(
                Encoding.UTF8.GetBytes(password));

            return Convert.ToHexString(bytes).ToLower();
        }

        // HU-01: Registro de usuario.
        [HttpPost("registro")]
        public async Task<IActionResult> Registrar(
            [FromBody] RegistroUsuarioDto dto)
        {
            try
            {
                var existente =
                    await _repository.ObtenerPorCorreoAsync(
                        dto.Correo);

                if (existente != null)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "Ya existe una cuenta asociada a este correo."
                    });
                }

                dto.Contrasena =
                    HashPassword(dto.Contrasena);

                var nuevoUsuario = new UsuarioBuilder()
                    .ConCredenciales(
                        dto.Nombre,
                        dto.Correo,
                        dto.Contrasena)
                    .ConPresupuesto(dto.Presupuesto)
                    .ConCantidadPersonas(dto.CantidadPersonas)
                    .ConRestricciones(dto.RestriccionesSalud)
                    .Build();

                await _repository.RegistrarUsuarioAsync(
                    nuevoUsuario);

                return Ok(new
                {
                    mensaje = "Usuario registrado correctamente.",
                    usuarioId = nuevoUsuario.Id
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    mensaje = ex.Message
                });
            }
        }
  }
  
}