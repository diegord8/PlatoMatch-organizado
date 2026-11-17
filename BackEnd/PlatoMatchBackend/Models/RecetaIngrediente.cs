using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    [Table("RecetaIngredientes")]
    public class RecetaIngrediente
    {
        [Key]
        public int Id { get; set; }

        public int RecetaId { get; set; }

        [Required]
        public string NombreIngrediente { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal CantidadBase { get; set; }

        [Required]
        public string UnidadMedida { get; set; } = string.Empty;
    }
}