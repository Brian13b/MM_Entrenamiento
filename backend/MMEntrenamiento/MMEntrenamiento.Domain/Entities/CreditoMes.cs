using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class CreditoMes
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
        public int Mes { get; set; }
        public int Anio { get; set; }

        public int CreditosBase { get; set; }
        public int CreditosArrastrados { get; set; }
        public int CreditosUsados { get; set; }
        public bool ArrastreYaUtilizado { get; set; }
    }
}
