using MMEntrenamiento.Application.DTOs.Horarios;
using MMEntrenamiento.Application.DTOs.Reservas;
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
                var horaActual = request.HoraInicio;

                while (horaActual < request.HoraFin)
                {
                    var horaFinTurno = horaActual.AddHours(1);

                    if (horaFinTurno > request.HoraFin) break;

                    bool existe = await _unitOfWork.Horarios.AnyAsync(
                        h => h.DiaSemana == dia && h.HoraInicio == horaActual);

                    if (!existe)
                    {
                        var nuevoHorario = new Horario
                        {
                            DiaSemana = dia,
                            HoraInicio = horaActual,
                            HoraFin = horaFinTurno,
                            CupoMaximo = request.CupoMaximo
                        };

                        await _unitOfWork.Horarios.AddAsync(nuevoHorario);
                        creados++;
                    }

                    horaActual = horaFinTurno;
                }
            }

            await _unitOfWork.CompleteAsync();
            return (true, $"Se crearon {creados} turnos de 1 hora exitosamente.");
        }

        public async Task<IEnumerable<TurnoDisponibleDto>> ObtenerOperativaDiariaAsync(DateOnly fecha)
        {
            var diaSemana = fecha.DayOfWeek;

            var horariosBase = await _unitOfWork.Horarios.GetAllAsync();
            var horariosDelDia = horariosBase.Where(h => h.DiaSemana == diaSemana).OrderBy(h => h.HoraInicio);

            var resultado = new List<TurnoDisponibleDto>();

            foreach (var horario in horariosDelDia)
            {
                int ocupacionActual = 0;

                var turnos = await _unitOfWork.Turnos.FindAsync(
                    t => t.Fecha == fecha && t.HorarioId == horario.Id,
                    t => t.Reservas);

                var turno = turnos.FirstOrDefault();

                if (turno != null && turno.Reservas != null)
                {
                    ocupacionActual = turno.Reservas.Count(r => r.Estado == EstadoReserva.Activa);
                }

                resultado.Add(new TurnoDisponibleDto
                {
                    HorarioId = horario.Id,
                    HoraInicio = horario.HoraInicio,
                    HoraFin = horario.HoraFin,
                    CupoMaximo = horario.CupoMaximo,
                    OcupacionActual = ocupacionActual
                });
            }

            return resultado;
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

        public async Task<(bool Exito, string Mensaje)> EliminarHorarioAsync(int id)
        {
            var horario = await _unitOfWork.Horarios.GetByIdAsync(id);

            if (horario == null)
                return (false, "El horario no existe.");

            _unitOfWork.Horarios.Delete(horario);
            await _unitOfWork.CompleteAsync();

            return (true, "Horario eliminado correctamente.");
        }
    }
}