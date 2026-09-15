namespace MMEntrenamiento.Application.DTOs.Reservas
{
    // 1. DTO para dibujar la Grilla diaria
    public class TurnoDisponibleDto
    {
        public int HorarioId { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public TimeOnly HoraFin { get; set; }
        public int CupoMaximo { get; set; }
        public int OcupacionActual { get; set; }
        public bool EstaLleno => OcupacionActual >= CupoMaximo;
    }

    // 2. DTOs para la pantalla "Mis Turnos" del usuario
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