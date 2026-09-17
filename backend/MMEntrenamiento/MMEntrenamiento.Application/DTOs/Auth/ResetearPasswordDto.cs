namespace MMEntrenamiento.Application.DTOs.Auth
{
    public class ResetearPasswordDto
    {
        public string Email { get; set; } = null!;
        public string Token { get; set; } = null!;
        public string NuevaPassword { get; set; } = null!;
    }
}