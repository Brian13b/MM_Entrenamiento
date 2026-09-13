using MMEntrenamiento.Application.DTOs.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginRequestDto request);
        Task<(bool Exito, string Mensaje)> RegisterAsync(RegisterRequestDto request, string rolBase);
    }
}
