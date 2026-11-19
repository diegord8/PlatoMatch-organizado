
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PlatoMatchBackend.Models
{
    // HU-16: Marcar o desmarcar ingredientes
    public class MarcarItemDto
    {
        public int ItemId { get; set; }

        public bool Comprado { get; set; }
    }

    // HU-15 y HU-16: Seguimiento de lista
    public class EstadoListaComprasDto
    {
        public int ListaId { get; set; }

        public int RecetaId { get; set; }

        public string RecetaNombre { get; set; }
            = string.Empty;

        public int CantidadPersonas { get; set; }

        public DateTime FechaCreacion { get; set; }

        public decimal TotalEstimado { get; set; }

        public decimal PendientePorPagar { get; set; }

        public bool Registrada { get; set; }

        public List<ItemListaCompra> Pendientes
            { get; set; } = new();

        public List<ItemListaCompra> Comprados
            { get; set; } = new();
    }

    // HU-17: Exportación de la lista
    public class ExportacionTextoDto
    {
        public string FormatoPlano { get; set; }
            = string.Empty;
    }

    // HU-18: Registrar preparación y gasto real
    public class RegistrarPreparacionDto
    {
        [Range(1, int.MaxValue)]
        public int ListaId { get; set; }

        public int? MercadoId { get; set; }

        [Range(0, 1000000)]
        public decimal CostoEjecutado { get; set; }

        // Opcional: costo de otra alternativa
        [Range(typeof(decimal), "0.01", "1000000")]
        public decimal? CostoReferenciaAlternativa
            { get; set; }
    }

    // HU-18: Resumen general de ahorro
    public class ResumenAhorroDto
    {
        public int UsuarioId { get; set; }

        public decimal PresupuestoAsignado { get; set; }

        public decimal TotalGastoEjecutado { get; set; }

        public decimal AhorroAcumulado { get; set; }

        public string MensajeImpacto { get; set; }
            = string.Empty;

        public int TotalRecetasPreparadas { get; set; }

        public int RegistrosAntiguosNoVerificados
            { get; set; }

        public int PreparacionesConReferencia
            { get; set; }

        public List<DetallePreparacionDto> Detalle
            { get; set; } = new();

        public List<AhorroMensualDto> AhorrosMensuales
            { get; set; } = new();
    }

    // HU-18: Ahorro acumulado por mes
    public class AhorroMensualDto
    {
        public string Mes { get; set; }
            = string.Empty;

        public decimal Ahorro { get; set; }

        public decimal GastoReal { get; set; }

        public int Preparaciones { get; set; }
    }

    // HU-18: Ahorro por preparación
    public class DetallePreparacionDto
    {
        public int Id { get; set; }

        public int? ListaId { get; set; }

        public string Receta { get; set; }
            = string.Empty;

        public DateTime Fecha { get; set; }

        public decimal GastoReal { get; set; }

        public decimal PresupuestoReferencia
            { get; set; }

        public decimal SaldoFrentePresupuesto
            { get; set; }

        public decimal? CostoReferenciaAlternativa
            { get; set; }

        public decimal? AhorroComparado { get; set; }
    }

    // HU-19: Editar perfil del usuario
    public class EditarPerfilDto
    {
        [Range(typeof(decimal), "0.01", "1000")]
        public decimal Presupuesto { get; set; }

        [Range(1, 30)]
        public int CantidadPersonas { get; set; }

        public string? RestriccionesSalud { get; set; }
    }

    // HU-20: Configurar recordatorio
    public class ConfigurarRecordatorioDto
    {
        [Required]
        [RegularExpression(
            @"^([01]\d|2[0-3]):[0-5]\d$",
            ErrorMessage = "La hora debe tener formato HH:mm."
        )]
        public string HoraAlerta { get; set; } = "12:00";

        // Se conserva para compatibilidad con SQL Server.
        // El usuario no necesita seleccionar frecuencia.
        public string Frecuencia { get; set; } = "Diario";

        public bool Activo { get; set; } = true;
    }
}
