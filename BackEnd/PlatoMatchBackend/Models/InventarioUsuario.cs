
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    [Table("InventarioUsuarios")]
    public class InventarioUsuario
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        [Required]
        public string NombreIngrediente { get; set; }
            = string.Empty;

        [Column(TypeName = "decimal(10,3)")]
        public decimal? Cantidad { get; set; }

        [MaxLength(20)]
        public string? UnidadMedida { get; set; }
    }

    public class IngredienteDespensaDto
    {
        public string NombreIngrediente { get; set; }
            = string.Empty;

        public decimal? Cantidad { get; set; }

        public string? UnidadMedida { get; set; }
    }
}
