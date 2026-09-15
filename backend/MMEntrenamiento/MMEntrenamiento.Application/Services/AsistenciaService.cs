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

            var reservasActivas = await _unitOfWork.Reservas.FindAsync(
                r => r.TurnoId == turnoId && r.Estado == EstadoReserva.Activa,
                r => r.Usuario!
            );

            var excepciones = await _unitOfWork.ExcepcionesTurnosFijos.FindAsync(
                e => e.HorarioId == turno.HorarioId && e.FechaAusencia == turno.Fecha,
                e => e.Usuario!
            );

            var detalle = new DetalleClaseDto
            {
                TurnoId = turno.Id,
                Fecha = turno.Fecha,
                HoraInicio = turno.Horario.HoraInicio,
                OcupacionActual = turno.OcupacionActual,

                AlumnosPresentes = reservasActivas.Select(r => new AlumnoEnClaseDto
                {
                    UsuarioId = r.UsuarioId,
                    ReservaId = r.Id,
                    NombreCompleto = r.Usuario?.UserName ?? "Alumno",
                    Email = r.Usuario?.Email ?? "",
                    TipoReserva = r.Tipo.ToString()
                }).ToList(),

                AlumnosQueAvisaron = excepciones.Select(e => new ExcepcionDiaDto
                {
                    UsuarioId = e.UsuarioId,
                    NombreCompleto = e.Usuario?.UserName ?? "Alumno",
                    Motivo = e.Motivo
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