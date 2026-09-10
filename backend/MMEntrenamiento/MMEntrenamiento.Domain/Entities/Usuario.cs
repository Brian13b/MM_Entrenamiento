using MMEntrenamiento.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace MMEntrenamiento.Domain.Entities
{
    public class Usuario : IdentityUser<Guid>
    {
        public string NombreCompleto { get; set; } = null!;
        public EstadoCuenta EstadoCuenta { get; set; } = EstadoCuenta.Activo;
        public DateTime FechaAlta { get; set; } = DateTime.UtcNow;

        // Relaciones
        public FichaTecnica? FichaTecnica { get; set; }
        public OneDrivePlan? OneDrivePlan { get; set; }
        public Membresia? MembresiaActual { get; set; }
        public ICollection<CreditoMes> CreditosMensuales { get; set; } = new List<CreditoMes>();
        public ICollection<TurnoFijo> TurnosFijos { get; set; } = new List<TurnoFijo>();
        public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
    }
}
