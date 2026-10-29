using System.Text.RegularExpressions;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Application.Services
{
    public class CloudinaryImageService : IImageService
    {
        public const long TamanoMaximoBytes = 5 * 1024 * 1024;
        public const string Carpeta = "mmentrenamiento_perfiles";

        private static readonly HashSet<string> ExtensionesPermitidas =
            new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".heic" };

        // https://res.cloudinary.com/<cloud>/image/upload/[v123/]<carpeta>/<id>.<ext>
        private static readonly Regex PatronPublicId =
            new(@"/upload/(?:v\d+/)?(?<id>.+)\.[^./]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private readonly Cloudinary _cloudinary;
        private readonly ILogger<CloudinaryImageService> _logger;

        public CloudinaryImageService(IConfiguration configuration, ILogger<CloudinaryImageService> logger)
        {
            _logger = logger;
            _cloudinary = new Cloudinary(new Account(
                configuration["Cloudinary:CloudName"],
                configuration["Cloudinary:ApiKey"],
                configuration["Cloudinary:ApiSecret"]));
        }

        public async Task<(bool Exito, string Mensaje, string? Url)> SubirAsync(IFormFile imagen)
        {
            if (imagen.Length == 0) return (false, "El archivo está vacío.", null);
            if (imagen.Length > TamanoMaximoBytes) return (false, "La imagen no puede pesar más de 5 MB.", null);

            var extension = Path.GetExtension(imagen.FileName);
            if (string.IsNullOrEmpty(extension) || !ExtensionesPermitidas.Contains(extension))
                return (false, "Formato no permitido. Usá JPG, PNG, WEBP o HEIC.", null);

            using var stream = imagen.OpenReadStream();
            var parametros = new ImageUploadParams
            {
                File = new FileDescription(imagen.FileName, stream),
                Folder = Carpeta,
                Transformation = new Transformation().Width(400).Height(400).Crop("fill").Gravity("face")
            };

            var resultado = await _cloudinary.UploadAsync(parametros);
            if (resultado.Error != null)
            {
                _logger.LogError("Cloudinary rechazó la subida: {Error}", resultado.Error.Message);
                return (false, "Error al subir la imagen a la nube.", null);
            }

            return (true, "Imagen subida.", resultado.SecureUrl.ToString());
        }

        public async Task<bool> EliminarPorUrlAsync(string? url)
        {
            var publicId = ExtraerPublicId(url);
            if (publicId == null) return false;

            try
            {
                var resultado = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
                if (resultado.Error != null)
                {
                    _logger.LogWarning("No se pudo borrar {PublicId} de Cloudinary: {Error}", publicId, resultado.Error.Message);
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo borrar {PublicId} de Cloudinary.", publicId);
                return false;
            }
        }

        // El public_id incluye la carpeta (mmentrenamiento_perfiles/abc): sin ella Cloudinary no encuentra el recurso.
        // Devuelve null si la URL no es de Cloudinary (por ejemplo un avatar externo).
        public static string? ExtraerPublicId(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return null;
            if (!uri.Host.EndsWith("cloudinary.com", StringComparison.OrdinalIgnoreCase)) return null;

            var coincidencia = PatronPublicId.Match(uri.AbsolutePath);
            return coincidencia.Success ? Uri.UnescapeDataString(coincidencia.Groups["id"].Value) : null;
        }
    }
}
