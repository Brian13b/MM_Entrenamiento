using MMEntrenamiento.Application.DTOs.Administracion;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IAdministracionService
    {
        Task<IEnumerable<UsuarioDirectorioDto>> ObtenerUsuariosDirectorioAsync();
        Task<UsuarioDirectorioDto> ObtenerUsuarioDirectorioPorIdAsync(Guid id);
        Task<(bool Exito, string Mensaje)> CrearMembresiaAsync(CrearMembresiaDto request);
        Task<IEnumerable<MembresiaDto>> ObtenerMembresiasActivasAsync();
        Task<(bool Exito, string Mensaje)> RegistrarPagoManualAsync(RegistrarPagoDto request);
        Task<(bool Exito, string Mensaje)> CambiarEstadoBloqueoAsync(Guid usuarioId, bool suspender);
        Task<AnuncioDto?> ObtenerAnuncioGlobalAsync();
        Task<(bool Exito, string Mensaje)> ActualizarAnuncioGlobalAsync(ActualizarAnuncioDto request);
    }
}