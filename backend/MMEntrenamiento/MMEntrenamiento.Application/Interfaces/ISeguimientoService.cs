using MMEntrenamiento.Application.DTOs.Seguimiento;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface ISeguimientoService
    {
        Task<FichaTecnicaDto?> ObtenerFichaAsync(Guid usuarioId);
        Task<(bool Exito, string Mensaje)> ActualizarFichaAsync(Guid usuarioId, ActualizarFichaDto request);

        Task<OneDrivePlanDto?> ObtenerPlanOneDriveAsync(Guid usuarioId);
        Task<(bool Exito, string Mensaje)> VincularPlanOneDriveAsync(Guid usuarioId, VincularOneDriveDto request);
    }
}