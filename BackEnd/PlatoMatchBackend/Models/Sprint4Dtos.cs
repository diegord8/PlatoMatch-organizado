using System.ComponentModel.DataAnnotations;

namespace PlatoMatchBackend.Models
{
    // DTO HU-16: Marcar item como comprado
    public class MarcarItemDto
    {
        public int ItemId{get;set;}
        public bool Comprado {get;set;}
    }

    //DTO HU -16 : resumen de lista con pendientes y comprados
    public class EstadoListaComprasDto
    {
        public int ListaId {get;set;}
        public string RecetaNombre {get;set;} = string.Empty;
        public decimal TotalEstimado {get;set;}
        public decimal PendientePorPagar{get;set;}
        public List<ItemListaCompra> Pendientes {get;set;} = new();
        public List<ItemListaCompra> Comprados {get;set;} = new();
    }

    //DTO HU-17: expotacion de lista en texto
    public class ExportacionTextoDto
    {
        public string FormatoPlano {get;set;} = string.Empty;
    }

    //DTO - HU 18: resumen y calculo del ahorro
    public class ResumenAhorroDto
    {
        public int UsuarioId{get;set;}
        public decimal PresupuestoAsignado {get;set;}
        public decimal TotalGastoEjecutado{get;set;}
        public decimal AhorroAcumulado{get;set;}
        public string MensajeImpacto {get;set;} = string.Empty;
        public int TotalRecetasPreparadas {get;set;}
    }

    //DTO HU 19 : edicion de perfil de salud y presupuesto
    public class EditarPerfilDto
    {
        [Range(0.01, 1000.00, ErrorMessage = "El presupuesto debe ser mayor a 0")]
        public decimal Presupuesto {get;set;}
        public int CantidadPersonas {get;set;}
        public string? RestriccionesSalud{get;set;}
    }

    //Dto hu20: configuracion de recordatorio
    public class ConfigurarRecordatorioDto
    {
        [Required]
        public string HoraAlerta {get;set;} = "08:00 AM";
        [Required]
        public string Frecuencia {get;set;} = "Diario";
        public bool Activo {get;set;} = true;
    }
}