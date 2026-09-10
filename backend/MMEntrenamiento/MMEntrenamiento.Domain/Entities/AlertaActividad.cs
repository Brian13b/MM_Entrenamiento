using MMEntrenamiento.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class AlertaActividad
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public DateTime FechaGenerada { get; set; }
        public string Motivo { get; set; } = null!;
        public EstadoAlerta Estado { get; set; }
    }
}
