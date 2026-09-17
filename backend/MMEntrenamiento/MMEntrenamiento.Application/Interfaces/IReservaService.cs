using MMEntrenamiento.Application.DTOs.Reservas;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IReservaService
    {
        Task<(bool Exito, string Mensaje)> ReservarTurnoEventualAsync(CrearReservaDto request);
        Task<(bool Exito, string Mensaje)> AsignarTurnoFijoAsync(AsignarTurnoFijoDto request);
        Task ExtenderTurnosFijosDiarioAsync();
        Task<(bool Exito, string Mensaje)> CancelarClaseAsync(CancelarClaseDto request);
        Task<(bool Exito, string Mensaje)> DarDeBajaTurnoFijoAsync(BajaTurnoFijoDto request);
        Task<IEnumerable<TurnoDisponibleDto>> ObtenerGrillaPorFechaAsync(DateOnly fecha);
        Task<MisTurnosDashboardDto> ObtenerMisTurnosAsync(Guid usuarioId);
    }
}
