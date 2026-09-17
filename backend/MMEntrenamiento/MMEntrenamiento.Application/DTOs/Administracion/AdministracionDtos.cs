namespace MMEntrenamiento.Application.DTOs.Administracion
{
    public class CrearMembresiaDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int CreditosOtorgados { get; set; }
        public int LimiteTurnosFijos { get; set; }
        public decimal Precio { get; set; }
    }

    public class MembresiaDto : CrearMembresiaDto
    {
        public int Id { get; set; }
        public bool Activa { get; set; }
    }

    public class RegistrarPagoDto
    {
        public Guid UsuarioId { get; set; }
        public int Mes { get; set; }
        public int Anio { get; set; }
        public decimal MontoAbonado { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
    }

    public class AnuncioDto
    {
        public string? Mensaje { get; set; }
        public DateTime UltimaModificacion { get; set; }
    }

    public class ActualizarAnuncioDto
    {
        public string Mensaje { get; set; } = string.Empty;
    }
}