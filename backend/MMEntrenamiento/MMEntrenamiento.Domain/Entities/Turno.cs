using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class Turno
    {
        public int Id { get; set; }
        public int HorarioId { get; set; }
        public Horario Horario { get; set; } = null!;
        public DateOnly Fecha { get; set; }
        public int OcupacionActual { get; set; }
        public bool EsFeriado { get; set; }

        public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
    }
}
