using MMEntrenamiento.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class Pago
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
        public decimal Monto { get; set; }
        public MetodoPago Metodo { get; set; }
        public EstadoPago Estado { get; set; }
        public DateTime FechaPago { get; set; }

        public Guid? ValidadoPorUserId { get; set; }
    }
}
