
namespace MMEntrenamiento.Domain.Entities
{
    public class TurnoFijo
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
        public int HorarioId { get; set; }
        public Horario Horario { get; set; } = null!;
        public bool Activo { get; set; } = true;
    }
}
