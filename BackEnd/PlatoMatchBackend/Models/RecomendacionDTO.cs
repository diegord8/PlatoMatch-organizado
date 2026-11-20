namespace PlatoMatchBackend.Models
{
    //DTO para retornar la receta junto al indicador de ahorro
    public class RecetaRecomendadaDto
    {
        public int Id{get;set;}
        public string Nombre {get; set;} = string.Empty;
        public string? Descripcion {get; set;}
        public decimal CostoEstimado {get;set;}
        public int? TiempoPrep{get;set;}
        public bool AptoAnemia{get; set;}
        public bool AptoSinGluten{get;set;}
        public string? ImagenUrl{get;set;}
        public int IngredientesEnCasaCoincidentes{get;set;}
        public string MensajeCompatibilidad {get;set;} = string.Empty; 
    }
}