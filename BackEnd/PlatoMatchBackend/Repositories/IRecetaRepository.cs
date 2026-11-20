using PlatoMatchBackend.Models;
namespace PlatoMatchBackend.Repositories
{
    public interface IRecetaRepository
    {
        Task<List<Receta>> ObtenerTodasAsync();
        Task<Receta?> ObtenerPorIdAsync(int id);
        Task<List<PrecioMercado>> ObtenerPreciosPorMercadoAsync(int mercadoId);
        Task<List<PrecioMercado>> BuscarPreciosPorProductoAsync(string producto);

Task<List<PrecioMercado>> ObtenerTodosLosPreciosAsync();

        Task<bool> GuardarPlatoFavoritoAsync(int usuarioId, int recetaId);
        Task<List<Receta>> ObtenerPlatosGuardadosAsync(int usuarioId);
        Task<bool> EliminarPlatoGuardadoAsync(int usuarioId, int recetaId);
        Task<List<RecetaIngrediente>> ObtenerIngredientesPorRecetaAsync(int recetaId);
        Task<List<Mercado>> ObtenerMercadosAsync();
        Task<List<PrecioMercado>> ObtenerPreciosValidosPorMercadoAsync(int mercadoId);
        Task<bool> RegistrarFeedbackAsync(Feedback feedback);
        Task<List<Feedback>> ObtenerFeedbacksValidosPorRecetaAsync(int recetaId);
        
    }
}