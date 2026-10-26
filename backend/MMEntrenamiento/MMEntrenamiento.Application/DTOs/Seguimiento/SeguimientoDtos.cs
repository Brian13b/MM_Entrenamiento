namespace MMEntrenamiento.Application.DTOs.Seguimiento
{
    public class FichaTecnicaDto
    {
        public string? Objetivos { get; set; }
        public string? Lesiones { get; set; }
        public DateTime? UltimaModificacion { get; set; }
    }

    public class ActualizarFichaDto
    {
        [System.ComponentModel.DataAnnotations.StringLength(2000)]
        public string? Objetivos { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(2000)]
        public string? Lesiones { get; set; }
    }

    public class OneDrivePlanDto
    {
        public string DriveItemId { get; set; } = string.Empty;
        public DateTime? UltimaSincronizacion { get; set; }
    }

    public class VincularOneDriveDto
    {
        public string DriveItemId { get; set; } = string.Empty;
    }

    public class ReporteAsistenciaDto
    {
        public int AsistenciasTotales { get; set; }
        public int AusenciasTotales { get; set; }
        public int ClasesCanceladas { get; set; }
        public decimal PorcentajeAsistencia { get; set; }
    }

    public class AlertaRetencionDto
    {
        public Guid UsuarioId { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public int AusenciasConsecutivas { get; set; }
        public DateOnly? UltimaFechaFalta { get; set; }
    }

    // Directorio de alumnos para el Profe (no incluye datos administrativos como pagos o créditos).
    public class AlumnoDirectorioProfeDto
    {
        public Guid Id { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? FotoPerfilUrl { get; set; }
        public bool Activo { get; set; }
        public bool TienePlan { get; set; }
        public string? Lesiones { get; set; }
    }
}