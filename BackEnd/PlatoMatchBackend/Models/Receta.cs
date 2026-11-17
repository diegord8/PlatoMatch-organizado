using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    [Table("Recetas")]
    public class Receta
    {
    [Key]
    public int Id {get; set;}
    [Required]
    public string Nombre {get; set;} = string.Empty;
    public string? Descripcion {get; set;}

    [Column(TypeName = "decimal(10,2)")]
    public decimal CostoEstimado {get; set;}
    public int? Calorias {get; set;}
    public int? TiempoPrep {get; set;}
    public bool AptoAnemia {get; set;}
    public bool AptoSinGluten {get; set;}
    public string? ImagenUrl {get; set;}
    }
}