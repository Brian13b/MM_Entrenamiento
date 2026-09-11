using MMEntrenamiento.Application.DTOs.Membresias;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IMembresiaService
    {
        Task<bool> AsignarMembresiaAsync(AsignarMembresiaDto request);
        Task<CreditosResponseDto?> ObtenerCreditosActualesAsync(Guid usuarioId);
        Task<bool> RenovarCreditosMesAsync(Guid usuarioId);
        Task<bool> OtorgarCreditosExtraAsync(OtorgarCreditoDto request);
    }
}