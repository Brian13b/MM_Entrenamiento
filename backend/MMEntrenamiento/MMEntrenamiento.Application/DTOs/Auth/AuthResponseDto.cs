using System.Text.Json.Serialization;

namespace MMEntrenamiento.Application.DTOs.Auth
{
    public class AuthResponseDto
    {
        public Guid UsuarioId { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Token { get; set; } = null!;
        public IList<string> Roles { get; set; } = new List<string>();

        // El refresh token viaja solo en la cookie HttpOnly: [JsonIgnore] garantiza
        // que nunca se serialice en el cuerpo de la respuesta.
        // Null en RefreshAsync cuando no hay que reescribir la cookie (ver ventana de gracia).
        [JsonIgnore] public string? RefreshToken { get; set; }
        [JsonIgnore] public DateTime? RefreshTokenExpiraEn { get; set; }
    }
}
