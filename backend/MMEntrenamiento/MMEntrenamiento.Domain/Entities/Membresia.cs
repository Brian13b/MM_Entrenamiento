using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Domain.Entities
{
    public class Membresia
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public int CreditosOtorgados { get; set; }
        public decimal Precio { get; set; }
        public bool Activa { get; set; }
        public int LimiteTurnosFijos { get; set; }
    }
}
