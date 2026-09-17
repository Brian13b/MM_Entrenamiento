using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Usuarios;
using MMEntrenamiento.Application.Interfaces;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace MMEntrenamiento.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuariosController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet("mi-perfil")]
        public async Task<IActionResult> ObtenerMiPerfil()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
            var perfil = await _usuarioService.ObtenerPerfilAsync(userId);

            if (perfil == null) return NotFound(new { message = "Usuario no encontrado." });
            return Ok(perfil);
        }

        [HttpPut("mi-perfil")]
        public async Task<IActionResult> ActualizarMiPerfil([FromBody] ActualizarPerfilDto request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
            var (exito, mensaje) = await _usuarioService.ActualizarPerfilAsync(userId, request);

            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [HttpPost("mi-perfil/foto")]
        public async Task<IActionResult> SubirFotoPerfil(IFormFile foto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
            var (exito, mensaje, url) = await _usuarioService.SubirFotoPerfilAsync(userId, foto);

            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje, url });
        }
    }
}