using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class Usuario
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public string EstadoCuenta { get; set; } = "AlDia";
        public DateTime? FechaUltimoPago { get; set; }
        public DateTime FechaAlta { get; set; }

        public ICollection<RolAsignado> Roles { get; set; } = new List<RolAsignado>();

        // Como alumno
        public Guid? MembresiaId { get; set; }
        public Membresia? Membresia { get; set; }
        public ICollection<CreditoMes> CreditosPorMes { get; set; } = new List<CreditoMes>();
        public ICollection<TurnoFijo> TurnosFijos { get; set; } = new List<TurnoFijo>();
        public ICollection<Reserva> ReservasComoAlumno { get; set; } = new List<Reserva>();
        public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
        public ICollection<Bloqueo> BloqueosRecibidos { get; set; } = new List<Bloqueo>();
        public FichaTecnica? FichaTecnica { get; set; }
        public OneDrivePlan? OneDrivePlan { get; set; }
        public ICollection<AlertaInactividad> AlertasInactividad { get; set; } = new List<AlertaInactividad>();

        // Como profesor
        public ICollection<Turno> TurnosQueDicta { get; set; } = new List<Turno>();
        public ICollection<Reserva> ReservasGestionadas { get; set; } = new List<Reserva>();

        // Como admin
        public ICollection<Bloqueo> BloqueosAplicados { get; set; } = new List<Bloqueo>();

        // Como quien carga un pago (alumno via transferencia, o profesor via efectivo)
        public ICollection<Pago> PagosCargados { get; set; } = new List<Pago>();
    }
}
