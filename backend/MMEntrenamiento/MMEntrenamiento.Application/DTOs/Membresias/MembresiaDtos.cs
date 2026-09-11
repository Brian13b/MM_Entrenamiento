using System;
namespace MMEntrenamiento.Application.DTOs.Membresias
{
    public class AsignarMembresiaDto
    {
        public Guid UsuarioId { get; set; }
        public int MembresiaId { get; set; }
    }

    public class CreditosResponseDto
    {
        public int Anio { get; set; }
        public int Mes { get; set; }
        public int CreditosBase { get; set; }
        public int CreditosArrastrados { get; set; }
        public int CreditosUsados { get; set; }

        public int TotalDisponibles => (CreditosBase + CreditosArrastrados) - CreditosUsados;
    }

    public class OtorgarCreditoDto
    {
        public Guid UsuarioId { get; set; }
        public int CantidadCreditos { get; set; }
    }
}