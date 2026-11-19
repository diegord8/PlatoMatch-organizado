
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

        // HU-02: Iniciar sesión.
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto dto)
        {
            var usuario =
                await _repository.ObtenerPorCorreoAsync(
                    dto.Correo);

            if (usuario == null ||
                usuario.Contrasena !=
                    HashPassword(dto.Contrasena))
            {
                return Unauthorized(new
                {
                    mensaje = "Credenciales incorrectas."
                });
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

        // Comprobar si existe un correo.
        [HttpGet("existe-correo")]
        public async Task<IActionResult> ExisteCorreo(
            [FromQuery] string correo)
        {
            var existente =
                await _repository.ObtenerPorCorreoAsync(
                    correo);

            return Ok(new
            {
                existe = existente != null
            });
        }

        // HU-05: Guardar ingredientes por nombre.
        // Se conserva para compatibilidad con el frontend.
        [HttpPost("{usuarioId:int}/ingredientes")]
        public async Task<IActionResult> RegistrarIngredientes(
            int usuarioId,
            [FromBody] List<string> ingredientes)
        {
            if (ingredientes == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La lista de ingredientes no puede ser nula."
                });
            }

            var usuario =
                await _repository.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            await _repository.GuardarIngredientesAsync(
                usuarioId,
                ingredientes);

            return Ok(new
            {
                mensaje = "Ingredientes guardados correctamente."
            });
        }

        // HU-05: Obtener nombres de ingredientes.
        [HttpGet("{usuarioId:int}/ingredientes")]
        public async Task<IActionResult> ObtenerIngredientes(
            int usuarioId)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            var lista =
                await _repository.ObtenerIngredientesPorUsuarioAsync(
                    usuarioId);

            return Ok(lista);
        }

        // HU-05 y HU-15: Consultar despensa con cantidades.
        [HttpGet("{usuarioId:int}/despensa-cantidades")]
        public async Task<IActionResult> ObtenerDespensaCantidades(
            int usuarioId)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            var ingredientes =
                await _repository.ObtenerInventarioConCantidadesAsync(
                    usuarioId);

            return Ok(ingredientes.Select(i => new
            {
                i.NombreIngrediente,
                i.Cantidad,
                i.UnidadMedida
            }));
        }

        // HU-05: Guardar despensa con cantidades.
        [HttpPut("{usuarioId:int}/despensa-cantidades")]
        public async Task<IActionResult> GuardarDespensaCantidades(
            int usuarioId,
            [FromBody] List<IngredienteDespensaDto> ingredientes)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            if (ingredientes == null)
            {
                return BadRequest(new
                {
                    mensaje = "La despensa no puede ser nula."
                });
            }

            foreach (var ingrediente in ingredientes)
            {
                if (string.IsNullOrWhiteSpace(
                    ingrediente.NombreIngrediente))
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "Indica el nombre del ingrediente."
                    });
                }

                if (ingrediente.Cantidad.HasValue)
                {
                    if (ingrediente.Cantidad.Value <= 0 ||
                        ingrediente.Cantidad.Value > 100000)
                    {
                        return BadRequest(new
                        {
                            mensaje = "La cantidad debe ser positiva."
                        });
                    }

                    if (string.IsNullOrWhiteSpace(
                        ingrediente.UnidadMedida))
                    {
                        return BadRequest(new
                        {
                            mensaje = "Indica la unidad de medida."
                        });
                    }
                }
            }

            await _repository.GuardarInventarioConCantidadesAsync(
                usuarioId,
                ingredientes);

            return Ok(new
            {
                mensaje = "Despensa actualizada correctamente."
            });
        }

        // HU-19: Recuperar perfil desde SQL Server.
        [HttpGet("{id:int}/perfil")]
        public async Task<IActionResult> ObtenerPerfil(int id)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
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

        // HU-19: Actualizar restricciones y presupuesto.
        [HttpPut("{id:int}/perfil")]
        public async Task<IActionResult> EditarPerfil(
            int id,
            [FromBody] EditarPerfilDto dto)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            if (dto.Presupuesto <= 0 ||
                dto.Presupuesto > 1000)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El presupuesto debe estar entre " +
                        "S/ 0.01 y S/ 1000."
                });
            }

            if (dto.CantidadPersonas < 1 ||
                dto.CantidadPersonas > 30)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La cantidad de personas debe estar entre 1 y 30."
                });
            }

            usuario.Presupuesto = dto.Presupuesto;

            usuario.CantidadPersonas =
                dto.CantidadPersonas;

            usuario.RestriccionesSalud =
                dto.RestriccionesSalud?.Trim() ?? "";

            await _repository.ActualizarUsuarioAsync(usuario);

            return Ok(new
            {
                mensaje = "Perfil actualizado correctamente.",
                presupuesto = usuario.Presupuesto,
                cantidadPersonas = usuario.CantidadPersonas,
                restriccionesSalud = usuario.RestriccionesSalud
            });
        }

        // HU-20: Recuperar recordatorio del usuario.
        [HttpGet("{id:int}/recordatorios")]
        public async Task<IActionResult> ObtenerRecordatorio(
            int id,
            [FromServices] IComprasRepository comprasRepo)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            var recordatorio =
                await comprasRepo.ObtenerRecordatorioAsync(id);

            if (recordatorio == null)
            {
                return Ok(new
                {
                    activo = false,
                    horaAlerta = "12:00",
                    frecuencia = "Diario"
                });
            }

            return Ok(new
            {
                activo = recordatorio.Activo,
                horaAlerta = recordatorio.HoraAlerta,
                frecuencia = "Diario"
            });
        }

        // HU-20: Guardar recordatorio diario.
        [HttpPost("{id:int}/recordatorios")]
        public async Task<IActionResult> ConfigurarRecordatorios(
            int id,
            [FromBody] ConfigurarRecordatorioDto dto,
            [FromServices] IComprasRepository comprasRepo)
        {
            var usuario =
                await _repository.ObtenerPorIdAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            bool horaValida = TimeOnly.TryParseExact(
                dto.HoraAlerta,
                "HH:mm",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _);

            if (!horaValida)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La hora debe tener formato HH:mm."
                });
            }

            // No hay selector de frecuencia en PlatoMatch.
            dto.Frecuencia = "Diario";

            var guardado =
                await comprasRepo.GuardarRecordatorioAsync(
                    id,
                    dto);

            return Ok(new
            {
                mensaje = "Recordatorio guardado correctamente.",
                activo = guardado.Activo,
                horaAlerta = guardado.HoraAlerta,
                frecuencia = "Diario"
            });
        }
    }

    // DTO de registro.
    public class RegistroUsuarioDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
        public decimal Presupuesto { get; set; }
        public int CantidadPersonas { get; set; }
        public string? RestriccionesSalud { get; set; }
    }

    // DTO de login.
    public class LoginDto
    {
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }
}
