using MMEntrenamiento.Application.DTOs.Asistencia;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IAsistenciaService
    {
        Task<DetalleClaseDto?> ObtenerDetalleClaseAsync(int turnoId);
        Task<(bool Exito, string Mensaje)> GuardarAsistenciaAsync(GuardarAsistenciaDto request);
    }
}