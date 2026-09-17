
namespace MMEntrenamiento.Application.DTOs.Auth
{
    public class AuthResponseDto
    {
        public Guid UsuarioId { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Token { get; set; } = null!;
        public IList<string> Roles { get; set; } = new List<string>();
    }
}
