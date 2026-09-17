namespace MMEntrenamiento.Application.DTOs.Auth
{
    public class CambiarPasswordDto
    {
        public string PasswordActual { get; set; } = null!;
        public string NuevaPassword { get; set; } = null!;
    }
}