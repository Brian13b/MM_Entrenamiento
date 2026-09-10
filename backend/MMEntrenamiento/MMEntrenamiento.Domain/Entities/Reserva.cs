using MMEntrenamiento.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class Reserva
    {
        public int Id { get; set; }
        public int TurnoId { get; set; }
        public Turno Turno { get; set; } = null!;
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public TipoReserva Tipo { get; set; }
        public EstadoReserva Estado { get; set; }
        public DateTime FechaOperacion { get; set; } = DateTime.UtcNow;
    }
}
