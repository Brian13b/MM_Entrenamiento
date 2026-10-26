using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Notificaciones;
using MMEntrenamiento.Application.Interfaces;
using System.Security.Claims;

namespace MMEntrenamiento.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificacionesController : ControllerBase
    {
        private readonly INotificacionPushService _pushService;

        public NotificacionesController(INotificacionPushService pushService)
        {
            _pushService = pushService;
        }

        [HttpPost("suscribir")]
        public async Task<IActionResult> Suscribir([FromBody] SuscripcionPushDto request)
        {
            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(usuarioIdStr, out var usuarioId)) return Unauthorized();

            var resultado = await _pushService.GuardarSuscripcionAsync(usuarioId, request);
            if (!resultado.Exito) return BadRequest(resultado.Mensaje);

            return Ok(new { mensaje = resultado.Mensaje });
        }
    }
}