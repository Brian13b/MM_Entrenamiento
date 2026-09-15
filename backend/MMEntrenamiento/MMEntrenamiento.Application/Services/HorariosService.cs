using MMEntrenamiento.Application.DTOs.Horarios;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;
using System.Globalization;

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

        public async Task<(bool Exito, string Mensaje)> CrearHorariosMasivosAsync(CrearHorarioMasivoDto request)
        {
            int creados = 0;

            foreach (var dia in request.DiasSemana)
            {
                var existe = await _unitOfWork.Horarios.FirstOrDefaultAsync(
                    h => h.DiaSemana == dia && h.HoraInicio == request.HoraInicio);

                if (existe == null)
                {
                    var nuevoHorario = new Horario
                    {
                        DiaSemana = dia,
                        HoraInicio = request.HoraInicio,
                        HoraFin = request.HoraFin,
                        CupoMaximo = request.CupoMaximo
                    };
                    await _unitOfWork.Horarios.AddAsync(nuevoHorario);
                    creados++;
                }
            }

            await _unitOfWork.CompleteAsync();
            return (true, $"Se crearon {creados} horarios base exitosamente.");
        }

        public async Task<(bool Exito, string Mensaje)> ConfigurarHorarioReducidoAsync(ConfigurarHorarioReducidoDto request)
        {
            var horarioReducido = new HorarioReducido
            {
                FechaFeriado = request.FechaFeriado,
                NuevaHoraInicio = request.NuevaHoraInicio,
                NuevaHoraFin = request.NuevaHoraFin,
                Aplica = true
            };
            await _unitOfWork.HorariosReducidos.AddAsync(horarioReducido);

            var turnosExistentes = await _unitOfWork.Turnos.FindAsync(
                t => t.Fecha == request.FechaFeriado,
                t => t.Reservas
            );

            foreach (var turno in turnosExistentes)
            {
                turno.EsFeriado = true;

                foreach (var reserva in turno.Reservas.Where(r => r.Estado == EstadoReserva.Activa))
                {
                    reserva.Estado = EstadoReserva.Cancelada;

                    var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                        c => c.UsuarioId == reserva.UsuarioId && c.Anio == turno.Fecha.Year && c.Mes == turno.Fecha.Month);

                    if (creditoMes != null && creditoMes.CreditosUsados > 0)
                    {
                        creditoMes.CreditosUsados--;
                        _unitOfWork.CreditosMes.Update(creditoMes);
                    }
                }
            }

            await _unitOfWork.CompleteAsync();
            return (true, $"Día de horario reducido configurado para el {request.FechaFeriado:dd/MM/yyyy}. Las reservas previas fueron canceladas y los créditos devueltos.");
        }
    }
}