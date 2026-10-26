using MMEntrenamiento.Application.DTOs.Administracion;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IAdministracionService
    {
        Task<IEnumerable<UsuarioDirectorioDto>> ObtenerUsuariosDirectorioAsync();
        Task<UsuarioDirectorioDto?> ObtenerUsuarioDirectorioPorIdAsync(Guid id);
        Task<(bool Exito, string Mensaje)> CambiarRolUsuarioAsync(Guid usuarioId, string nuevoRol);
        Task<(bool Exito, string Mensaje)> EliminarUsuarioAsync(Guid usuarioId);
        Task<(bool Exito, string Mensaje)> CrearMembresiaAsync(CrearMembresiaDto request);
        Task<(bool Exito, string Mensaje)> ActualizarMembresiaAsync(int id, CrearMembresiaDto request);
        Task<(bool Exito, string Mensaje)> EliminarMembresiaAsync(int id);
        Task<IEnumerable<MembresiaDto>> ObtenerMembresiasActivasAsync();
        Task<(bool Exito, string Mensaje)> RegistrarPagoManualAsync(RegistrarPagoDto request);
        Task<IEnumerable<PagoDto>> ObtenerPagosUsuarioAsync(Guid usuarioId);
        Task<MetricasDto> ObtenerMetricasAsync();
        Task<ConfiguracionGimnasioDto> ObtenerConfiguracionGimnasioAsync();
        Task<(bool Exito, string Mensaje)> ActualizarConfiguracionGimnasioAsync(ConfiguracionGimnasioDto request);
        Task<(bool Exito, string Mensaje)> CambiarEstadoBloqueoAsync(Guid usuarioId, bool suspender);
        Task<AnuncioDto?> ObtenerAnuncioGlobalAsync();
        Task<(bool Exito, string Mensaje)> ActualizarAnuncioGlobalAsync(ActualizarAnuncioDto request);
    }
}