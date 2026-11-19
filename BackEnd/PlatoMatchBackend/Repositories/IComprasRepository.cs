
using PlatoMatchBackend.Models;

namespace PlatoMatchBackend.Repositories
{
    public interface IComprasRepository
    {
        Task<ListaCompra> GenerarOPersistirListaAsync(
            int usuarioId,
            int recetaId,
            int personas,
            List<ItemListaCompra> items);

        Task<ListaCompra?> ObtenerListaPorIdAsync(
            int listaId);

        Task<ListaCompra?> ObtenerUltimaListaPorUsuarioAsync(
            int usuarioId);

        Task<bool> ActualizarEstadoItemAsync(
            int itemId,
            bool comprado);

        Task<HistorialPreparacion?>
            ObtenerPreparacionPorListaAsync(int listaId);

        Task<bool> RegistrarPreparacionAsync(
            int usuarioId,
            int recetaId,
            int listaId,
            int? mercadoId,
            decimal costo,
            decimal presupuesto,
            decimal? costoReferenciaAlternativa);

        Task<List<HistorialPreparacion>>
            ObtenerHistorialUsuarioAsync(int usuarioId);

        Task<RecordatorioUsuario> GuardarRecordatorioAsync(
            int usuarioId,
            ConfigurarRecordatorioDto dto);

        Task<RecordatorioUsuario?> ObtenerRecordatorioAsync(
            int usuarioId);
    }
}
