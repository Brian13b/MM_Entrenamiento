namespace MMEntrenamiento.Application.DTOs.Reservas
{
    public class AlumnoInscriptoDto
    {
        public Guid UsuarioId { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string TipoReserva { get; set; } = string.Empty;
    }

    public class TurnoDisponibleDto
    {
        public int HorarioId { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public TimeOnly HoraFin { get; set; }
        public int CupoMaximo { get; set; }
        public int OcupacionActual { get; set; }
        public bool EstaLleno => OcupacionActual >= CupoMaximo;

        public List<AlumnoInscriptoDto> Inscriptos { get; set; } = new();
    }

    public class MiReservaDto
    {
        public int TurnoId { get; set; }
        public DateOnly Fecha { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public string TipoReserva { get; set; } = string.Empty;
    }

    public class MiTurnoFijoDto
    {
        public int TurnoFijoId { get; set; }
        public string DiaSemana { get; set; } = string.Empty;
        public TimeOnly HoraInicio { get; set; }
    }

    public class MisTurnosDashboardDto
    {
        public int LimiteTurnosFijos { get; set; }
        public int TurnosFijosActivos { get; set; }
        public bool PuedeAgregarTurnoFijo => TurnosFijosActivos < LimiteTurnosFijos;

        public List<MiReservaDto> ProximasClases { get; set; } = new();
        public List<MiTurnoFijoDto> MisSuscripcionesFijas { get; set; } = new();
    }
}