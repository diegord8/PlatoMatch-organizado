namespace PlatoMatchBackend.Models
{
    // HU-09: Receta escalada por comensales
    public class RecetaEscaladaDto
    {
        public int RecetaId { get; set; }
        public string NombreReceta { get; set; } = string.Empty;
        public int CantidadPersonas { get; set; }
        public decimal CostoTotalEstimado { get; set; }
        public List<IngredienteEscaladoDto> Ingredientes { get; set; } = new();
    }

    public class IngredienteEscaladoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public decimal CantidadRequerida { get; set; }
        public string UnidadMedida { get; set; } = string.Empty;
    }

    // HU-10: Lista de compras optimizada con faltantes y precios
    public class ListaComprasDto
    {
        public int UsuarioId { get; set; }
        public int RecetaId { get; set; }
        public string RecetaNombre { get; set; } = string.Empty;
        public decimal PresupuestoUsuario { get; set; }
        public decimal CostoEstimadoCompras { get; set; }
        public bool DentroDelPresupuesto => CostoEstimadoCompras <= PresupuestoUsuario;
        public List<ItemCompraDto> ItemsAComprar { get; set; } = new();
    }

    public class ItemCompraDto
    {
        public string Ingrediente { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public string Unidad { get; set; } = string.Empty;
        public decimal PrecioEstimado { get; set; }
        public string MercadoSugerido { get; set; } = string.Empty;
    }
}