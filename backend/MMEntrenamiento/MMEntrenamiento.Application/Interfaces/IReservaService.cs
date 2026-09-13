using MMEntrenamiento.Application.DTOs.Reservas;

namespace MMEntrenamiento.Application.Interfaces
{
    internal interface IReservaService
    {
        Task<bool> ReservarTurnoAsync(CrearReservaDto request);
    }
}
