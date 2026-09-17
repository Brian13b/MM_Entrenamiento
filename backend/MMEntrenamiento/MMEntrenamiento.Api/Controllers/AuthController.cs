using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Auth;
using MMEntrenamiento.Application.Interfaces;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace MMEntrenamiento.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null) return Unauthorized(new { message = "Credenciales inválidas o cuenta inactiva." });

            return Ok(response);
        }

        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RegistrarAlumno([FromBody] RegisterRequestDto request)
        {
            var (exito, mensaje) = await _authService.RegisterAsync(request, "Alumno");
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpPost("cambiar-password")]
        [Authorize]
        public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto request)
        {
            var claimId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!Guid.TryParse(claimId, out var userId))
                return Unauthorized(new { message = "Token inválido." });

            var (exito, mensaje) = await _authService.CambiarPasswordAsync(userId, request);

            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [AllowAnonymous]
        [HttpPost("recuperar/solicitar")]
        public async Task<IActionResult> SolicitarRecuperacion([FromBody] SolicitarRecuperacionDto request)
        {
            var (exito, mensaje) = await _authService.SolicitarRecuperacionAsync(request);

            return Ok(new { message = mensaje });
        }

        [AllowAnonymous]
        [HttpPost("recuperar/resetear")]
        public async Task<IActionResult> ResetearPassword([FromBody] ResetearPasswordDto request)
        {
            var (exito, mensaje) = await _authService.ResetearPasswordAsync(request);

            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }
    }
}