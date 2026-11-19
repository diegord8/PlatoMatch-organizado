using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using Microsoft.EntityFrameworkCore.Metadata;

namespace PlatoMatchBackend.Models
{
    [Table("ListasCompras")]
    public class ListaCompra
    {
        [Key]
        public int Id {get;set;}
        public int UsuarioId{get;set;}
        public int RecetaId{get;set;}
        public DateTime FechaCreacion{get;set;} = DateTime.UtcNow;

        [ForeignKey("RecetaId")]
        public virtual Receta? Receta {get;set;}
        public virtual ICollection<ItemListaCompra> Items {get;set;} = new List<ItemListaCompra>();
    }

    [Table("ItemsListaCompras")]
    public class ItemListaCompra
    {
        [Key]
        public int Id{get;set;}
        public int ListaCompraId{get;set;}

        [Required]
        [MaxLength(100)]
        public string Ingrediente {get;set;} = string.Empty;
        [Column(TypeName = "decimal(10,2)")]
        public decimal Cantidad{get;set;}

        [MaxLength(20)]
        public string UnidadMedida {get;set;} = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal PrecioEstimado {get;set;}
        public bool Comprado {get;set;} = false; 
    }

    [Table("HistorialPreparaciones")]
    public class HistorialPreparacion
    {
        [Key]
        public int Id{get;set;}
        public int UsuarioId{get;set;}
        public int RecetaId{get;set;}

        [Column(TypeName = "decimal(10,2)")]
        public decimal CostoEjecutado {get;set;}
        public DateTime FechaPreparacion {get;set;} = DateTime.UtcNow;

        [ForeignKey("RecetaId")]
        public virtual Receta? Receta {get;set;}
    }

    [Table("RecordatoriosUsuario")]
    public class RecordatorioUsuario
    {
        [Key]
        public int Id{get;set;}
        public int UsuarioId{get;set;}

        [Required]
        [MaxLength(10)]
        public string HoraAlerta{get;set;} = "08:00 AM";
        [MaxLength(20)]
        public string Frecuencia {get;set;} = "Diario";
        public bool Activo {get;set;} = true;
    }
}