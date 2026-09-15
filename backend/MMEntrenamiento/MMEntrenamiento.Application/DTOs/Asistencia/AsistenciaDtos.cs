namespace MMEntrenamiento.Application.DTOs.Asistencia
{
    public class AlumnoEnClaseDto
    {
        public Guid UsuarioId { get; set; }
        public int ReservaId { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TipoReserva { get; set; } = string.Empty;
        public bool PrimeraClase { get; set; }
    }

    public class ExcepcionDiaDto
    {
        public Guid UsuarioId { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Motivo { get; set; } = string.Empty;
    }

    public class DetalleClaseDto
    {
        public int TurnoId { get; set; }
        public DateOnly Fecha { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public int OcupacionActual { get; set; }
        public List<AlumnoEnClaseDto> AlumnosPresentes { get; set; } = new();
        public List<ExcepcionDiaDto> AlumnosQueAvisaron { get; set; } = new();
    }

    public class RegistroAsistenciaDto
    {
        public int ReservaId { get; set; }
        public bool Asistio { get; set; }
    }

    public class GuardarAsistenciaDto
    {
        public int TurnoId { get; set; }
        public List<RegistroAsistenciaDto> Asistencias { get; set; } = new();
    }
}