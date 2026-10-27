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
        private const string RefreshCookieName = "mm_refresh";

        // El navegador ve la API bajo /api/auth/* (proxy de Vercel), así que la cookie solo
        // viaja a esos endpoints y nunca al resto de la API.
        private const string RefreshCookiePath = "/api/auth";

        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        private CookieOptions OpcionesCookieRefresh(DateTime? expiraEn = null) => new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = RefreshCookiePath,
            IsEssential = true,
            Expires = expiraEn.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(expiraEn.Value, DateTimeKind.Utc)) : null
        };

        private void EscribirCookieRefresh(AuthResponseDto response)
        {
            // Null = ventana de gracia: el navegador ya tiene la cookie nueva, no se pisa.
            if (response.RefreshToken == null) return;
            Response.Cookies.Append(RefreshCookieName, response.RefreshToken, OpcionesCookieRefresh(response.RefreshTokenExpiraEn));
        }

        private void BorrarCookieRefresh() =>
            Response.Cookies.Delete(RefreshCookieName, OpcionesCookieRefresh());

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null) return Unauthorized(new { message = "Credenciales inválidas o cuenta inactiva." });

            EscribirCookieRefresh(response);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken);

            var response = await _authService.RefreshAsync(refreshToken);
            if (response == null)
            {
                BorrarCookieRefresh();
                return Unauthorized(new { message = "Sesión expirada. Iniciá sesión nuevamente." });
            }

            EscribirCookieRefresh(response);
            return Ok(response);
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken);

            await _authService.LogoutAsync(refreshToken);
            BorrarCookieRefresh();

            return NoContent();
        }

        [HttpPost("register")]
        [Authorize(Roles = "Admin, Profe")]
        public async Task<IActionResult> RegistrarAlumno([FromBody] RegisterRequestDto request)
        {
            if (User.IsInRole("Profe") && request.Rol == "Admin")
            {
                return Forbid("No tienes permisos para crear cuentas de Administrador.");
            }

            var (exito, mensaje, usuarioId) = await _authService.RegisterAsync(request, request.Rol ?? "Alumno");
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje, usuarioId = usuarioId });
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