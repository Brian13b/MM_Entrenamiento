using MMEntrenamiento.Application.DTOs.Horarios;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IHorarioService
    {
        Task<(bool Exito, string Mensaje)> CrearHorarioAsync(CrearHorarioDto request);
        Task<IEnumerable<HorarioDto>> ObtenerTodosAsync();
        Task<(bool Exito, string Mensaje)> CrearHorariosMasivosAsync(CrearHorarioMasivoDto request);
        Task<(bool Exito, string Mensaje)> ConfigurarHorarioReducidoAsync(ConfigurarHorarioReducidoDto request);
    }
}
