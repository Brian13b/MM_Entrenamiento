using MMEntrenamiento.Application.DTOs.Horarios;
using MMEntrenamiento.Application.DTOs.Reservas;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IHorarioService
    {
        Task<(bool Exito, string Mensaje)> CrearHorarioAsync(CrearHorarioDto request);
        Task<IEnumerable<HorarioDto>> ObtenerTodosAsync();
        Task<(bool Exito, string Mensaje)> CrearHorariosMasivosAsync(CrearHorarioMasivoDto request);
        Task<IEnumerable<TurnoDisponibleDto>> ObtenerOperativaDiariaAsync(DateOnly fecha);
        Task<(bool Exito, string Mensaje)> ConfigurarHorarioReducidoAsync(ConfigurarHorarioReducidoDto request);
        Task<(bool Exito, string Mensaje)> EliminarHorarioAsync(int id);
    }
}
