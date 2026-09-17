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
        public string? Objetivos { get; set; }
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
}