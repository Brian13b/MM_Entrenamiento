using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class OneDrivePlan
    {
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
        public string DriveItemId { get; set; } = null!;
        public DateTime UltimaSincronizacion { get; set; }
    }
}
