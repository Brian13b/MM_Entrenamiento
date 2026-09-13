using MMEntrenamiento.Application.DTOs.Membresias;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IMembresiaService
    {
        Task<(bool Exito, string Mensaje)> AsignarMembresiaAsync(AsignarMembresiaDto request);
        Task<CreditosResponseDto?> ObtenerCreditosActualesAsync(Guid usuarioId);
        Task<(bool Exito, string Mensaje)> RenovarCreditosMesAsync(Guid usuarioId, int? mesDestino = null, int? anioDestino = null);
        Task<(bool Exito, string Mensaje)> OtorgarCreditosExtraAsync(OtorgarCreditoDto request);
    }
}