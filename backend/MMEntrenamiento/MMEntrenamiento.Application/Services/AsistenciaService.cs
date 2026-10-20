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

        public async Task<DetalleClaseDto?> ObtenerDetalleClaseAsync(int turnoId)
        {
            var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(
                t => t.Id == turnoId,
                t => t.Horario!,
                t => t.Reservas
            );

            if (turno == null) return null;

            // Se incluyen las reservas ya resueltas para poder revisar/corregir la asistencia guardada.
            var reservas = (await _unitOfWork.Reservas.FindAsync(
                r => r.TurnoId == turnoId
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
                // Primera clase: el alumno todavía no asistió a ninguna otra clase.
                var asistioAntes = await _unitOfWork.Reservas.AnyAsync(
                    x => x.UsuarioId == r.UsuarioId && x.TurnoId != turnoId && x.Estado == EstadoReserva.Asistio);

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