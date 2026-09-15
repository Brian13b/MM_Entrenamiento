namespace MMEntrenamiento.Domain.Entities
{
    public class Pago
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public virtual Usuario? Usuario { get; set; }

        public decimal Monto { get; set; }
        public int MesAbonado { get; set; }
        public int AnioAbonado { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        public DateTime FechaPago { get; set; } = DateTime.UtcNow;
    }
}