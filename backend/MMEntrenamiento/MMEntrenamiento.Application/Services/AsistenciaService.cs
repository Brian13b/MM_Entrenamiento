using MMEntrenamiento.Application.DTOs.Asistencia;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Application.Services
{
    public class AsistenciaService : IAsistenciaService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AsistenciaService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DetalleClaseDto?> ObtenerDetalleClaseAsync(int horarioId, DateTime fecha)
        {
            var fechaConvertida = DateOnly.FromDateTime(fecha);

            var turnos = await _unitOfWork.Turnos.FindAsync(
                t => t.HorarioId == horarioId && t.Fecha == fechaConvertida,
                t => t.Horario!,
                t => t.Reservas
            );

            var turno = turnos.OrderByDescending(t => t.Reservas.Count).FirstOrDefault();

            if (turno == null)
            {
                var horario = await _unitOfWork.Horarios.FirstOrDefaultAsync(h => h.Id == horarioId);

                return new DetalleClaseDto
                {
                    TurnoId = 0,
                    Fecha = fechaConvertida,
                    HoraInicio = horario != null ? horario.HoraInicio : new TimeOnly(0, 0),
                    OcupacionActual = 0,
                    AlumnosPresentes = new List<AlumnoEnClaseDto>(),
                    AlumnosQueAvisaron = new List<ExcepcionDiaDto>()
                };
            }

            var reservas = (await _unitOfWork.Reservas.FindAsync(
                r => r.TurnoId == turno.Id
                  && (r.Estado == EstadoReserva.Activa || r.Estado == EstadoReserva.Asistio || r.Estado == EstadoReserva.Ausente),
                r => r.Usuario!
            )).ToList();

            var excepciones = await _unitOfWork.ExcepcionesTurnosFijos.FindAsync(
                e => e.HorarioId == turno.HorarioId && e.FechaAusencia == turno.Fecha,
                e => e.Usuario!
            );

            var alumnos = new List<AlumnoEnClaseDto>();
            foreach (var r in reservas)
            {
                var asistioAntes = await _unitOfWork.Reservas.AnyAsync(
                    x => x.UsuarioId == r.UsuarioId && x.TurnoId != turno.Id && x.Estado == EstadoReserva.Asistio);

                alumnos.Add(new AlumnoEnClaseDto
                {
                    UsuarioId = r.UsuarioId,
                    ReservaId = r.Id,
                    NombreCompleto = r.Usuario?.NombreCompleto ?? "Alumno",
                    Email = r.Usuario?.Email ?? "",
                    TipoReserva = r.Tipo.ToString(),
                    Estado = r.Estado.ToString(),
                    PrimeraClase = !asistioAntes
                });
            }

            var detalle = new DetalleClaseDto
            {
                TurnoId = turno.Id,
                Fecha = turno.Fecha,
                HoraInicio = turno.Horario.HoraInicio,
                OcupacionActual = turno.OcupacionActual,
                AlumnosPresentes = alumnos.OrderBy(a => a.NombreCompleto).ToList(),
                AlumnosQueAvisaron = excepciones.Select(e => new ExcepcionDiaDto
                {
                    UsuarioId = e.UsuarioId,
                    NombreCompleto = e.Usuario?.NombreCompleto ?? "Alumno",
                    Motivo = e.Motivo ?? string.Empty
                }).ToList()
            };

            return detalle;
        }

        public async Task<(bool Exito, string Mensaje)> GuardarAsistenciaAsync(GuardarAsistenciaDto request)
        {
            foreach (var asistencia in request.Asistencias)
            {
                var reserva = await _unitOfWork.Reservas.GetByIdAsync(asistencia.ReservaId);

                if (reserva != null && reserva.TurnoId == request.TurnoId)
                {
                    reserva.Estado = asistencia.Asistio ? EstadoReserva.Asistio : EstadoReserva.Ausente;
                    _unitOfWork.Reservas.Update(reserva);
                }
            }

            await _unitOfWork.CompleteAsync();
            return (true, "Asistencia guardada correctamente.");
        }
    }
}