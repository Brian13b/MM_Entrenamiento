using Microsoft.AspNetCore.Identity;
using MMEntrenamiento.Application.DTOs.Seguimiento;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Application.Services
{
    public class SeguimientoService : ISeguimientoService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<Usuario> _userManager;

        public SeguimientoService(IUnitOfWork unitOfWork, UserManager<Usuario> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        public async Task<IEnumerable<AlumnoDirectorioProfeDto>> ObtenerDirectorioAlumnosAsync()
        {
            // Solo alumnos "puros": se excluyen las cuentas que además son Admin o Profe.
            var alumnoIds = (await _userManager.GetUsersInRoleAsync("Alumno")).Select(u => u.Id).ToHashSet();
            alumnoIds.ExceptWith((await _userManager.GetUsersInRoleAsync("Admin")).Select(u => u.Id));
            alumnoIds.ExceptWith((await _userManager.GetUsersInRoleAsync("Profe")).Select(u => u.Id));

            var usuarios = await _unitOfWork.Usuarios.FindAsync(
                u => alumnoIds.Contains(u.Id),
                u => u.FichaTecnica!,
                u => u.OneDrivePlan!);

            return usuarios
                .OrderBy(u => u.NombreCompleto)
                .Select(u => new AlumnoDirectorioProfeDto
                {
                    Id = u.Id,
                    NombreCompleto = u.NombreCompleto,
                    Email = u.Email ?? string.Empty,
                    Telefono = u.PhoneNumber,
                    FotoPerfilUrl = u.FotoPerfilUrl,
                    Activo = u.EstadoCuenta == EstadoCuenta.Activo,
                    TienePlan = u.OneDrivePlan != null && !string.IsNullOrWhiteSpace(u.OneDrivePlan.DriveItemId),
                    Lesiones = u.FichaTecnica?.Lesiones
                })
                .ToList();
        }

        public async Task<FichaTecnicaDto?> ObtenerFichaAsync(Guid usuarioId)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, u => u.FichaTecnica!);

            if (usuario?.FichaTecnica == null) return null;

            return new FichaTecnicaDto
            {
                Objetivos = usuario.FichaTecnica.Objetivos,
                Lesiones = usuario.FichaTecnica.Lesiones,
                UltimaModificacion = usuario.FichaTecnica.UltimaModificacion
            };
        }

        public async Task<(bool Exito, string Mensaje)> ActualizarFichaAsync(Guid usuarioId, ActualizarFichaDto request)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, u => u.FichaTecnica!);

            if (usuario == null) return (false, "Usuario no encontrado.");

            if (usuario.FichaTecnica == null)
            {
                usuario.FichaTecnica = new FichaTecnica
                {
                    UsuarioId = usuarioId,
                    Objetivos = request.Objetivos,
                    Lesiones = request.Lesiones,
                    UltimaModificacion = DateTime.UtcNow
                };
            }
            else
            {
                usuario.FichaTecnica.Objetivos = request.Objetivos;
                usuario.FichaTecnica.Lesiones = request.Lesiones;
                usuario.FichaTecnica.UltimaModificacion = DateTime.UtcNow;
            }

            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.CompleteAsync();

            return (true, "Ficha técnica actualizada correctamente.");
        }

        public async Task<OneDrivePlanDto?> ObtenerPlanOneDriveAsync(Guid usuarioId)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, u => u.OneDrivePlan!);

            if (usuario?.OneDrivePlan == null) return null;

            return new OneDrivePlanDto
            {
                DriveItemId = usuario.OneDrivePlan.DriveItemId,
                UltimaSincronizacion = usuario.OneDrivePlan.UltimaSincronizacion
            };
        }

        public async Task<(bool Exito, string Mensaje)> VincularPlanOneDriveAsync(Guid usuarioId, VincularOneDriveDto request)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, u => u.OneDrivePlan!);

            if (usuario == null) return (false, "Usuario no encontrado.");

            if (usuario.OneDrivePlan == null)
            {
                usuario.OneDrivePlan = new OneDrivePlan
                {
                    UsuarioId = usuarioId,
                    DriveItemId = request.DriveItemId,
                    UltimaSincronizacion = DateTime.UtcNow
                };
            }
            else
            {
                usuario.OneDrivePlan.DriveItemId = request.DriveItemId;
                usuario.OneDrivePlan.UltimaSincronizacion = DateTime.UtcNow;
            }

            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.CompleteAsync();

            return (true, "Plan de OneDrive vinculado exitosamente.");
        }

        public async Task<ReporteAsistenciaDto> ObtenerReporteAsistenciaAsync(Guid usuarioId, int mes, int anio)
        {
            var reservasDelMes = await _unitOfWork.Reservas.FindAsync(
                r => r.UsuarioId == usuarioId &&
                     r.Turno.Fecha.Month == mes &&
                     r.Turno.Fecha.Year == anio,
                r => r.Turno!);

            var asistencias = reservasDelMes.Count(r => r.Estado == EstadoReserva.Asistio);
            var ausencias = reservasDelMes.Count(r => r.Estado == EstadoReserva.Ausente);
            var canceladas = reservasDelMes.Count(r => r.Estado == EstadoReserva.Cancelada);

            var clasesComputables = asistencias + ausencias;
            var porcentaje = clasesComputables > 0
                ? Math.Round((decimal)asistencias / clasesComputables * 100, 1)
                : 0;

            return new ReporteAsistenciaDto
            {
                AsistenciasTotales = asistencias,
                AusenciasTotales = ausencias,
                ClasesCanceladas = canceladas,
                PorcentajeAsistencia = porcentaje
            };
        }
    }
}