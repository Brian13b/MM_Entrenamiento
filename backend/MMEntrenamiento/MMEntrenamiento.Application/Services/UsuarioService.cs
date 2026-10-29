using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using MMEntrenamiento.Application.DTOs.Usuarios;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;
using System.Security.Principal;

namespace MMEntrenamiento.Application.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly UserManager<Usuario> _userManager;
        private readonly IImageService _imageService;
        private readonly IUnitOfWork _unitOfWork;

        public UsuarioService(UserManager<Usuario> userManager, IImageService imageService, IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _imageService = imageService;
            _unitOfWork = unitOfWork;
        }

        public async Task<PerfilUsuarioDto?> ObtenerPerfilAsync(Guid usuarioId)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return null;

            return new PerfilUsuarioDto
            {
                Id = usuario.Id,
                NombreCompleto = usuario.NombreCompleto,
                Email = usuario.Email!,
                Telefono = usuario.PhoneNumber,
                FotoPerfilUrl = usuario.FotoPerfilUrl
            };
        }

        public async Task<ResumenAlumnoDto?> ObtenerResumenAsync(Guid usuarioId)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(
                u => u.Id == usuarioId,
                u => u.MembresiaActual!,
                u => u.FichaTecnica!);

            if (usuario == null) return null;

            var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

            // Clases ya resueltas (Asistio/Ausente). Las canceladas y las activas sin cerrar no afectan la racha.
            var reservasResueltas = (await _unitOfWork.Reservas.FindAsync(
                r => r.UsuarioId == usuarioId
                  && (r.Estado == EstadoReserva.Asistio || r.Estado == EstadoReserva.Ausente)
                  && r.Turno.Fecha <= hoy,
                r => r.Turno!,
                r => r.Turno.Horario!))
                .OrderByDescending(r => r.Turno.Fecha)
                .ThenByDescending(r => r.Turno.Horario.HoraInicio)
                .ToList();

            // Racha: asistencias consecutivas, se corta en la primera ausencia.
            var racha = reservasResueltas
                .TakeWhile(r => r.Estado == EstadoReserva.Asistio)
                .Count();

            // Semana calendario actual (lunes a domingo).
            var diasDesdeLunes = ((int)hoy.DayOfWeek + 6) % 7;
            var lunes = hoy.AddDays(-diasDesdeLunes);
            var asistidasSemana = reservasResueltas.Count(r =>
                r.Estado == EstadoReserva.Asistio && r.Turno.Fecha >= lunes && r.Turno.Fecha <= lunes.AddDays(6));

            PlanAlumnoDto? plan = null;
            if (usuario.MembresiaActual != null)
            {
                plan = new PlanAlumnoDto
                {
                    Nombre = usuario.MembresiaActual.Nombre,
                    VecesPorSemana = usuario.MembresiaActual.LimiteTurnosFijos,
                    // El bloqueo por falta de pago es manual (Admin): el estado depende solo de la cuenta.
                    Estado = usuario.EstadoCuenta == EstadoCuenta.Activo ? "Activo" : "Inactivo",
                    Vencimiento = new DateOnly(hoy.Year, hoy.Month, DateTime.DaysInMonth(hoy.Year, hoy.Month))
                };
            }

            return new ResumenAlumnoDto
            {
                Id = usuario.Id,
                NombreCompleto = usuario.NombreCompleto,
                Email = usuario.Email ?? string.Empty,
                Telefono = usuario.PhoneNumber,
                FotoPerfilUrl = usuario.FotoPerfilUrl,
                Estadisticas = new EstadisticasAlumnoDto
                {
                    ClasesAsistidasSemana = asistidasSemana,
                    RachaActual = racha
                },
                Plan = plan,
                FichaTecnica = new FichaResumenDto
                {
                    Objetivos = usuario.FichaTecnica?.Objetivos,
                    Lesiones = usuario.FichaTecnica?.Lesiones
                }
            };
        }

        public async Task<(bool Exito, string Mensaje)> ActualizarPerfilAsync(Guid usuarioId, ActualizarPerfilDto request, IFormFile? foto = null)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return (false, "Usuario no encontrado.");

            if (string.IsNullOrWhiteSpace(request.NombreCompleto))
                return (false, "El nombre no puede estar vacío.");

            // El email es también el nombre de usuario (el login busca por email).
            var nuevoEmail = request.Email?.Trim();
            var cambiaEmail = !string.IsNullOrEmpty(nuevoEmail)
                              && !string.Equals(nuevoEmail, usuario.Email, StringComparison.OrdinalIgnoreCase);

            if (cambiaEmail)
            {
                // Se valida antes de tocar nada. FindByEmailAsync usa el email normalizado,
                // así que "Ana@x.com" y "ana@x.com" cuentan como el mismo.
                var existente = await _userManager.FindByEmailAsync(nuevoEmail!);
                if (existente != null && existente.Id != usuario.Id)
                    return (false, "Ese email ya está en uso por otra cuenta.");
            }

            var fotoVieja = usuario.FotoPerfilUrl;
            string? fotoNueva = null;

            if (foto != null)
            {
                var (subio, mensajeFoto, url) = await _imageService.SubirAsync(foto);
                if (!subio) return (false, mensajeFoto);
                fotoNueva = url;
                usuario.FotoPerfilUrl = url;
            }

            usuario.NombreCompleto = request.NombreCompleto.Trim();
            usuario.PhoneNumber = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();

            IdentityResult result;
            if (cambiaEmail)
            {
                // SetEmail/SetUserName validan, normalizan y persisten (junto con los cambios pendientes de arriba).
                result = await _userManager.SetEmailAsync(usuario, nuevoEmail!);
                if (result.Succeeded) result = await _userManager.SetUserNameAsync(usuario, nuevoEmail!);
            }
            else
            {
                result = await _userManager.UpdateAsync(usuario);
            }

            if (!result.Succeeded)
            {
                // La base no quedó con la foto nueva: se borra para no dejarla huérfana en Cloudinary.
                if (fotoNueva != null) await _imageService.EliminarPorUrlAsync(fotoNueva);
                return (false, MensajeDeError(result));
            }

            if (fotoNueva != null) await _imageService.EliminarPorUrlAsync(fotoVieja);

            return (true, "Perfil actualizado correctamente.");
        }

        private static string MensajeDeError(IdentityResult result)
        {
            if (result.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName"))
                return "Ese email ya está en uso por otra cuenta.";
            if (result.Errors.Any(e => e.Code is "InvalidEmail" or "InvalidUserName"))
                return "El email no tiene un formato válido.";
            return "Error al actualizar el perfil.";
        }

        public async Task<(bool Exito, string Mensaje, string? Url)> SubirFotoPerfilAsync(Guid usuarioId, IFormFile foto)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return (false, "Usuario no encontrado.", null);

            var (exito, mensaje, url) = await _imageService.SubirAsync(foto);
            if (!exito) return (false, mensaje, null);

            var fotoVieja = usuario.FotoPerfilUrl;
            usuario.FotoPerfilUrl = url;

            var result = await _userManager.UpdateAsync(usuario);
            if (!result.Succeeded)
            {
                await _imageService.EliminarPorUrlAsync(url);
                return (false, "Error al actualizar el perfil.", null);
            }

            await _imageService.EliminarPorUrlAsync(fotoVieja);

            return (true, "Foto de perfil actualizada con éxito.", url);
        }
    }
}
