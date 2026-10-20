using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
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
        private readonly Cloudinary _cloudinary;
        private readonly IUnitOfWork _unitOfWork;

        public UsuarioService(UserManager<Usuario> userManager, IConfiguration configuration, IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;

            var account = new Account(
                configuration["Cloudinary:CloudName"],
                configuration["Cloudinary:ApiKey"],
                configuration["Cloudinary:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
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

            usuario.NombreCompleto = request.NombreCompleto.Trim();
            usuario.PhoneNumber = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();

            // El email es también el nombre de usuario (el login busca por email).
            var nuevoEmail = request.Email?.Trim();
            if (!string.IsNullOrEmpty(nuevoEmail) && !string.Equals(nuevoEmail, usuario.Email, StringComparison.OrdinalIgnoreCase))
            {
                usuario.Email = nuevoEmail;
                usuario.UserName = nuevoEmail;
            }

            if (foto != null)
            {
                var (subio, mensajeFoto, url) = await SubirImagenAsync(foto);
                if (!subio) return (false, mensajeFoto);
                usuario.FotoPerfilUrl = url;
            }

            var result = await _userManager.UpdateAsync(usuario);
            if (!result.Succeeded)
            {
                var duplicado = result.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName");
                return (false, duplicado ? "Ese email ya está en uso por otra cuenta." : "Error al actualizar el perfil.");
            }

            return (true, "Perfil actualizado correctamente.");
        }

        public async Task<(bool Exito, string Mensaje, string? Url)> SubirFotoPerfilAsync(Guid usuarioId, IFormFile foto)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return (false, "Usuario no encontrado.", null);

            var (exito, mensaje, url) = await SubirImagenAsync(foto);
            if (!exito) return (false, mensaje, null);

            usuario.FotoPerfilUrl = url;
            await _userManager.UpdateAsync(usuario);

            return (true, "Foto de perfil actualizada con éxito.", url);
        }

        private async Task<(bool Exito, string Mensaje, string? Url)> SubirImagenAsync(IFormFile foto)
        {
            if (foto.Length == 0) return (false, "El archivo está vacío.", null);
            if (foto.ContentType == null || !foto.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return (false, "El archivo debe ser una imagen.", null);

            using var stream = foto.OpenReadStream();
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(foto.FileName, stream),
                Folder = "mmentrenamiento_perfiles",
                Transformation = new Transformation().Width(400).Height(400).Crop("fill").Gravity("face")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error != null)
                return (false, "Error al subir la imagen a la nube.", null);

            return (true, "Imagen subida.", uploadResult.SecureUrl.ToString());
        }
    }
}
