
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatoMatchBackend.Models
{
    [Table("Feedbacks")]
    public class Feedback
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int RecetaId { get; set; }

        [Range(1, 5)]
        public int Puntuacion { get; set; }

        [MaxLength(500)]
        public string? Comentario { get; set; }

        public DateTime FechaRegistro { get; set; }
            = DateTime.UtcNow;

        [ForeignKey("RecetaId")]
        public virtual Receta? Receta { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }

    public class RegistrarFeedbackDto
    {
        [Required]
        public int UsuarioId { get; set; }

        [Required]
        public int RecetaId { get; set; }

        [Range(1, 5)]
        public int Puntuacion { get; set; }

        public string? Comentario { get; set; }
    }

    public class ResumenFeedbackDto
    {
        public int RecetaId { get; set; }

        public string RecetaNombre { get; set; }
            = string.Empty;

        public double CalificacionPromedio { get; set; }

        public int TotalEvaluacionesValidas { get; set; }

        public List<ComentarioLimpioDto> Comentarios
            { get; set; } = new();
    }

    public class ComentarioLimpioDto
    {
        public int Puntuacion { get; set; }

        public string? Comentario { get; set; }

        public DateTime Fecha { get; set; }
    }

    public class ComparativoMercadosRecetaDto
    {
        public int RecetaId { get; set; }

        public string RecetaNombre { get; set; }
            = string.Empty;

        public List<OpcionMercadoDto> ComparativaPorMercado
            { get; set; } = new();
    }

    public class OpcionMercadoDto
    {
        public int MercadoId { get; set; }

        public string MercadoNombre { get; set; }
            = string.Empty;

        public decimal CostoTotalProyectado { get; set; }

        public bool TotalCompleto { get; set; }

        public List<DetalleIngredienteMercadoDto>
            DetalleIngredientes { get; set; } = new();
    }

    public class DetalleIngredienteMercadoDto
    {
        public string Ingrediente { get; set; }
            = string.Empty;

        public decimal CantidadNecesaria { get; set; }

        public string UnidadMedida { get; set; }
            = string.Empty;

        public decimal PrecioUnitarioReferencial { get; set; }

        public decimal? CostoIngrediente { get; set; }

        public bool PrecioDisponible { get; set; }
    }
}
