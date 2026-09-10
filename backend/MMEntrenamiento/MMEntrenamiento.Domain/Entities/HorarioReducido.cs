using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class HorarioReducido
    {
        public int Id { get; set; }
        public DateOnly FechaFeriado { get; set; }
        public TimeOnly NuevaHoraInicio { get; set; }
        public TimeOnly NuevaHoraFin { get; set; }
        public bool Aplica { get; set; }
    }
}
