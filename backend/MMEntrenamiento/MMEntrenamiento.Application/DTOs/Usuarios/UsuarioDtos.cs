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

    public class EstadisticasAlumnoDto
    {
        public int ClasesAsistidasSemana { get; set; }
        public int RachaActual { get; set; }
    }

    public class PlanAlumnoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int VecesPorSemana { get; set; }
        public string Estado { get; set; } = string.Empty;
        public DateOnly Vencimiento { get; set; }
    }

    public class FichaResumenDto
    {
        public string? Objetivos { get; set; }
        public string? Lesiones { get; set; }
    }

    public class ResumenAlumnoDto
    {
        public Guid Id { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? FotoPerfilUrl { get; set; }
        public EstadisticasAlumnoDto Estadisticas { get; set; } = new();
        public PlanAlumnoDto? Plan { get; set; }
        public FichaResumenDto FichaTecnica { get; set; } = new();
    }
}