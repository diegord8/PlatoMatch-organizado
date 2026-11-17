using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    [Table("PlatosGuardados")]
    public class PlatoGuardado
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int RecetaId { get; set; }

        public DateTime FechaGuardado { get; set; } = DateTime.UtcNow;

        [ForeignKey("RecetaId")]
        public virtual Receta? Receta { get; set; }
    }

    public class GuardarPlatoDto
    {
        public int UsuarioId { get; set; }
        public int RecetaId { get; set; }
    }
}