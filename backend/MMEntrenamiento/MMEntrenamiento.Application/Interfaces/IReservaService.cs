using MMEntrenamiento.Application.DTOs.Reservas;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IReservaService
    {
        Task<(bool Exito, string Mensaje)> ReservarTurnoAsync(CrearReservaDto request);
    }
}
