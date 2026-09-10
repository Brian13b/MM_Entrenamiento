using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class Horario
    {
        public int Id { get; set; }
        public DayOfWeek DiaSemana { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public TimeOnly HoraFin { get; set; }
        public int CupoMaximo { get; set; }

        public ICollection<TurnoFijo> TurnosFijos { get; set; } = new List<TurnoFijo>();
        public ICollection<Turno> TurnosInstanciados { get; set; } = new List<Turno>();
    }
}
