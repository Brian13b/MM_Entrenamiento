using Microsoft.AspNetCore.Http;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IImageService
    {
        // Valida (tamaño y extensión) y sube la imagen. Devuelve la URL segura.
        Task<(bool Exito, string Mensaje, string? Url)> SubirAsync(IFormFile imagen);

        // Borra la imagen a partir de su URL. Es "best effort": nunca lanza, devuelve false si no pudo.
        Task<bool> EliminarPorUrlAsync(string? url);
    }
}
