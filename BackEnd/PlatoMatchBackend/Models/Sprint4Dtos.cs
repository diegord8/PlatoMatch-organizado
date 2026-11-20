
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

    
}
