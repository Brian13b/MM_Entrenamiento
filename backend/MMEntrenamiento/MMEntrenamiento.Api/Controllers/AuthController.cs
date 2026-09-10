using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Auth;
using MMEntrenamiento.Application.Interfaces;

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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null) return Unauthorized(new { message = "Credenciales inválidas o cuenta inactiva." });

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            var success = await _authService.RegisterAsync(request, "Alumno");
            if (!success) return BadRequest(new { message = "Error al registrar el usuario. El email podría estar en uso." });

            return Ok(new { message = "Usuario registrado exitosamente." });
        }
    }
}