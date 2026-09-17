namespace MMEntrenamiento.Application.DTOs.Usuarios
{
    public class PerfilUsuarioDto
    {
        public Guid Id { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? FotoPerfilUrl { get; set; }
    }

    public class ActualizarPerfilDto
    {
        public string NombreCompleto { get; set; } = null!;
        public string? Telefono { get; set; }

    }
}