using MMEntrenamiento.Application.DTOs.Horarios;
using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IHorarioService
    {
        Task<(bool Exito, string Mensaje)> CrearHorarioAsync(CrearHorarioDto request);
        Task<IEnumerable<HorarioDto>> ObtenerTodosAsync();
    }
}
