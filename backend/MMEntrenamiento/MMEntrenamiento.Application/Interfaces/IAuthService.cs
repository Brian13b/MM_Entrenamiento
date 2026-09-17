using MMEntrenamiento.Application.DTOs.Auth;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginRequestDto request);
        Task<(bool Exito, string Mensaje)> RegisterAsync(RegisterRequestDto request, string rolBase);
        Task<(bool Exito, string Mensaje)> CambiarPasswordAsync(Guid usuarioId, CambiarPasswordDto request);
        Task<(bool Exito, string Mensaje)> SolicitarRecuperacionAsync(SolicitarRecuperacionDto request);
        Task<(bool Exito, string Mensaje)> ResetearPasswordAsync(ResetearPasswordDto request);
    }
}