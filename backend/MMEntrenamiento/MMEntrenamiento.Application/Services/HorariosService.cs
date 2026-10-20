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
            var reducido = await DisponibilidadHorarios.ObtenerReducidoAsync(_unitOfWork, fecha);
            var horariosDelDia = horariosBase
                .Where(h => h.DiaSemana == diaSemana && DisponibilidadHorarios.EstaDisponible(h, reducido))
                .OrderBy(h => h.HoraInicio);

            var turnosDelDia = (await _unitOfWork.Turnos.FindWithIncludesAsync(
                t => t.Fecha == fecha, "Reservas.Usuario")).ToList();

            var resultado = new List<TurnoDisponibleDto>();

            foreach (var horario in horariosDelDia)
            {
                var turno = turnosDelDia.FirstOrDefault(t => t.HorarioId == horario.Id);

                var reservasActivas = turno?.Reservas
                    .Where(r => r.Estado == EstadoReserva.Activa)
                    .ToList() ?? new List<Reserva>();

                resultado.Add(new TurnoDisponibleDto
                {
                    TurnoId = turno?.Id,
                    HorarioId = horario.Id,
                    HoraInicio = horario.HoraInicio,
                    HoraFin = horario.HoraFin,
                    CupoMaximo = horario.CupoMaximo,
                    OcupacionActual = reservasActivas.Count,
                    Inscriptos = reservasActivas.Select(r => new AlumnoInscriptoDto
                    {
                        UsuarioId = r.UsuarioId,
                        NombreCompleto = r.Usuario?.NombreCompleto ?? "Alumno",
                        TipoReserva = r.Tipo.ToString()
                    }).ToList()
                });
            }

            return resultado;
        }

        public async Task<(bool Exito, string Mensaje)> ConfigurarHorarioReducidoAsync(ConfigurarHorarioReducidoDto request)
        {
            if (request.NuevaHoraFin <= request.NuevaHoraInicio)
                return (false, "La hora de finalización debe ser posterior a la de inicio.");

            if (request.FechaFeriado < DateOnly.FromDateTime(DateTime.UtcNow))
                return (false, "No se puede configurar un horario reducido en una fecha pasada.");

            var turnosExistentes = (await _unitOfWork.Turnos.FindAsync(
                t => t.Fecha == request.FechaFeriado,
                t => t.Reservas
            )).ToList();

            if (turnosExistentes.Any(t => t.Reservas.Any(r => r.Estado == EstadoReserva.Asistio || r.Estado == EstadoReserva.Ausente)))
                return (false, "Ese día ya tiene asistencia registrada, no se puede reemplazar su grilla.");

            // Una sola configuración por fecha: si ya existía, se pisa.
            var horarioReducido = await _unitOfWork.HorariosReducidos.FirstOrDefaultAsync(r => r.FechaFeriado == request.FechaFeriado);
            if (horarioReducido == null)
            {
                horarioReducido = new HorarioReducido { FechaFeriado = request.FechaFeriado };
                await _unitOfWork.HorariosReducidos.AddAsync(horarioReducido);
            }
            horarioReducido.NuevaHoraInicio = request.NuevaHoraInicio;
            horarioReducido.NuevaHoraFin = request.NuevaHoraFin;
            horarioReducido.Aplica = true;

            // 1. Se cancelan las reservas vigentes devolviendo el crédito y se eliminan los turnos
            //    existentes de esa fecha: la gente deberá volver a anotarse en la nueva grilla.
            int reservasCanceladas = 0;
            foreach (var turno in turnosExistentes)
            {
                foreach (var reserva in turno.Reservas.Where(r => r.Estado == EstadoReserva.Activa))
                {
                    reservasCanceladas++;

                    var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                        c => c.UsuarioId == reserva.UsuarioId && c.Anio == turno.Fecha.Year && c.Mes == turno.Fecha.Month);

                    if (creditoMes != null && creditoMes.CreditosUsados > 0)
                    {
                        creditoMes.CreditosUsados--;
                        _unitOfWork.CreditosMes.Update(creditoMes);
                    }
                }

                _unitOfWork.Turnos.Delete(turno);
            }

            await _unitOfWork.CompleteAsync();

            // 2. Se crean los nuevos turnos del día con las franjas que entran en el horario reducido.
            var franjasNuevas = (await _unitOfWork.Horarios.FindAsync(h => h.DiaSemana == request.FechaFeriado.DayOfWeek))
                .Where(h => DisponibilidadHorarios.EstaDisponible(h, horarioReducido))
                .OrderBy(h => h.HoraInicio)
                .ToList();

            foreach (var horario in franjasNuevas)
            {
                await _unitOfWork.Turnos.AddAsync(new Turno
                {
                    HorarioId = horario.Id,
                    Fecha = request.FechaFeriado,
                    OcupacionActual = 0,
                    EsFeriado = true
                });
            }

            await _unitOfWork.CompleteAsync();

            return (true, $"Horario reducido configurado para el {request.FechaFeriado:dd/MM/yyyy} ({request.NuevaHoraInicio:HH\\:mm} a {request.NuevaHoraFin:HH\\:mm}). Se reemplazó la grilla de ese día por {franjasNuevas.Count} turnos nuevos y se cancelaron {reservasCanceladas} reservas (créditos devueltos): los alumnos deben anotarse de nuevo.");
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