
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    [Table("Mercados")]
    public class Mercado
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Nombre { get; set; } = string.Empty;

        public string? Distrito { get; set; }
    }

    [Table("PreciosMercado")]
    public class PrecioMercado
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ProductoNombre { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Precio { get; set; }

        public int MercadoId { get; set; }

        [Column(TypeName = "decimal(10,3)")]
        public decimal CantidadPrecio { get; set; } = 1m;

        [MaxLength(20)]
        public string UnidadPrecio { get; set; } = "unidad";

        public DateTime FechaRegistro { get; set; }
            = DateTime.UtcNow;
    }
}
