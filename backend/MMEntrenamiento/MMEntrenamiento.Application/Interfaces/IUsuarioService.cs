using Microsoft.AspNetCore.Http;
using MMEntrenamiento.Application.DTOs.Usuarios;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IUsuarioService
    {
        Task<PerfilUsuarioDto?> ObtenerPerfilAsync(Guid usuarioId);
        Task<ResumenAlumnoDto?> ObtenerResumenAsync(Guid usuarioId);
        Task<(bool Exito, string Mensaje)> ActualizarPerfilAsync(Guid usuarioId, ActualizarPerfilDto request, IFormFile? foto = null);
        Task<(bool Exito, string Mensaje, string? Url)> SubirFotoPerfilAsync(Guid usuarioId, IFormFile foto);
    }
}