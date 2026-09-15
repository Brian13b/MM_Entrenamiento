namespace MMEntrenamiento.Application.DTOs.Horarios
{
    public class CrearHorarioDto
    {
        public DayOfWeek DiaSemana { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public TimeOnly HoraFin { get; set; }
        public int CupoMaximo { get; set; }
    }

    public class HorarioDto
    {
        public int Id { get; set; }
        public DayOfWeek DiaSemana { get; set; }
        public string NombreDia { get; set; } = string.Empty;
        public TimeOnly HoraInicio { get; set; }
        public TimeOnly HoraFin { get; set; }
        public int CupoMaximo { get; set; }
    }
}