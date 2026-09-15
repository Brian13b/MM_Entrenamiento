using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class ExcepcionTurnoFijo
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public int HorarioId { get; set; }
        public DateOnly FechaAusencia { get; set; }
        public string? Motivo { get; set; }
        public virtual Usuario? Usuario { get; set; }
    }
}
