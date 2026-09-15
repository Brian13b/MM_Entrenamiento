using System.Globalization;
using MMEntrenamiento.Application.DTOs.Horarios;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Application.Services
{
    public class HorarioService : IHorarioService
    {
        private readonly IUnitOfWork _unitOfWork;

        public HorarioService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<(bool Exito, string Mensaje)> CrearHorarioAsync(CrearHorarioDto request)
        {
            if (request.HoraFin <= request.HoraInicio)
                return (false, "La hora de finalización debe ser posterior a la de inicio.");

            bool existe = await _unitOfWork.Horarios.AnyAsync(h =>
                h.DiaSemana == request.DiaSemana &&
                h.HoraInicio == request.HoraInicio);

            if (existe) return (false, "Ya existe un horario configurado para ese día y hora.");

            var nuevoHorario = new Horario
            {
                DiaSemana = request.DiaSemana,
                HoraInicio = request.HoraInicio,
                HoraFin = request.HoraFin,
                CupoMaximo = request.CupoMaximo
            };

            await _unitOfWork.Horarios.AddAsync(nuevoHorario);
            await _unitOfWork.CompleteAsync();

            return (true, "Horario creado exitosamente.");
        }

        public async Task<IEnumerable<HorarioDto>> ObtenerTodosAsync()
        {
            var horarios = await _unitOfWork.Horarios.GetAllAsync();
            var cultura = new CultureInfo("es-ES");

            return horarios.OrderBy(h => h.DiaSemana).ThenBy(h => h.HoraInicio).Select(h => new HorarioDto
            {
                Id = h.Id,
                DiaSemana = h.DiaSemana,
                NombreDia = cultura.DateTimeFormat.GetDayName(h.DiaSemana),
                HoraInicio = h.HoraInicio,
                HoraFin = h.HoraFin,
                CupoMaximo = h.CupoMaximo
            });
        }
    }
}