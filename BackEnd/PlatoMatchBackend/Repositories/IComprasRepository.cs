using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Repositories
{
    public interface IComprasRepository
    {
        Task<ListaCompra> GenerarOPersistirListaAsync(int usuarioId, int recetaId,List<ItemListaCompra> items);
        Task<ListaCompra?> ObtenerListaPorIdAsync(int listaId);
        Task<ListaCompra?> ObtenerUltimaListaPorUsuarioAsync(int usuarioId);
        Task<bool> ActualizarEstadoItemAsync(int itemId, bool comprado);
        Task<bool> RegistrarPreparacionAsync(int usuarioId, int recetaId, decimal costo);
        Task<List<HistorialPreparacion>> ObtenerHistorialUsuarioAsync(int usuarioId);
        Task<RecordatorioUsuario> GuardarRecordatorioAsync(int usuarioId, ConfigurarRecordatorioDto dto);
        Task<RecordatorioUsuario?> ObtenerRecordatorioAsync(int usuarioId);
    }
}