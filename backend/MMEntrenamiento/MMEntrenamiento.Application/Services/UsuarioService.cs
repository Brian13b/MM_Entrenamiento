using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using MMEntrenamiento.Application.DTOs.Usuarios;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Domain.Entities;
using System.Security.Principal;

namespace MMEntrenamiento.Application.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly UserManager<Usuario> _userManager;
        private readonly Cloudinary _cloudinary;

        public UsuarioService(UserManager<Usuario> userManager, IConfiguration configuration)
        {
            _userManager = userManager;

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

        public async Task<(bool Exito, string Mensaje)> ActualizarPerfilAsync(Guid usuarioId, ActualizarPerfilDto request)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return (false, "Usuario no encontrado.");

            usuario.NombreCompleto = request.NombreCompleto;
            usuario.PhoneNumber = request.Telefono;

            var result = await _userManager.UpdateAsync(usuario);
            if (!result.Succeeded) return (false, "Error al actualizar el perfil.");

            return (true, "Perfil actualizado correctamente.");
        }

        public async Task<(bool Exito, string Mensaje, string? Url)> SubirFotoPerfilAsync(Guid usuarioId, IFormFile foto)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return (false, "Usuario no encontrado.", null);

            if (foto.Length == 0) return (false, "El archivo está vacío.", null);

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

            usuario.FotoPerfilUrl = uploadResult.SecureUrl.ToString();
            await _userManager.UpdateAsync(usuario);

            return (true, "Foto de perfil actualizada con éxito.", usuario.FotoPerfilUrl);
        }
    }
}