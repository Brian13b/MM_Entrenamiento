namespace MMEntrenamiento.Application.DTOs.Reservas
{
    public class CrearReservaDto
    {
        public Guid UsuarioId { get; set; }
        public int HorarioId { get; set; }
        public DateOnly Fecha { get; set; }
    }
}