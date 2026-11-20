
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    // HU-15: Lista de compras generada
    [Table("ListasCompras")]
    public class ListaCompra
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int RecetaId { get; set; }

        public int CantidadPersonas { get; set; } = 1;

        public DateTime FechaCreacion { get; set; }
            = DateTime.UtcNow;

        [ForeignKey("RecetaId")]
        public virtual Receta? Receta { get; set; }

        public virtual ICollection<ItemListaCompra> Items
            { get; set; } = new List<ItemListaCompra>();
    }

    // HU-15 y HU-16: Ingredientes de la lista
    [Table("ItemsListaCompras")]
    public class ItemListaCompra
    {
        [Key]
        public int Id { get; set; }

        public int ListaCompraId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Ingrediente { get; set; }
            = string.Empty;

        // Cantidad que falta comprar
        [Column(TypeName = "decimal(10,3)")]
        public decimal Cantidad { get; set; }

        [MaxLength(20)]
        public string UnidadMedida { get; set; }
            = string.Empty;

        // Costo referencial de la cantidad faltante
        [Column(TypeName = "decimal(10,2)")]
        public decimal PrecioEstimado { get; set; }

        // Indica si existe un precio compatible
        // registrado en SQL Server
        public bool PrecioDisponible { get; set; } = false;

        // HU-16: Estado del ingrediente
        public bool Comprado { get; set; } = false;
    }

    // HU-18: Historial de preparaciones y ahorro
    [Table("HistorialPreparaciones")]
    public class HistorialPreparacion
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int RecetaId { get; set; }

        public int? ListaCompraId { get; set; }

        public int? MercadoId { get; set; }

        // Dinero realmente gastado
        [Column(TypeName = "decimal(10,2)")]
        public decimal CostoEjecutado { get; set; }

        // Presupuesto que tenía el usuario
        [Column(TypeName = "decimal(10,2)")]
        public decimal PresupuestoReferencia { get; set; }

        // Costo de una alternativa comparable
        [Column(TypeName = "decimal(10,2)")]
        public decimal? CostoReferenciaAlternativa
            { get; set; }

        public DateTime FechaPreparacion { get; set; }
            = DateTime.UtcNow;

        [ForeignKey("RecetaId")]
        public virtual Receta? Receta { get; set; }
    }

    // HU-20: Recordatorios del usuario
    [Table("RecordatoriosUsuario")]
    public class RecordatorioUsuario
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        [Required]
        [MaxLength(10)]
        public string HoraAlerta { get; set; } = "12:00";

        // Frecuencia fija, sin selector en React
        [MaxLength(20)]
        public string Frecuencia { get; set; } = "Diario";

        public bool Activo { get; set; } = true;
    }
}
