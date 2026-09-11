using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Membresias;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MembresiasController : ControllerBase
    {
        private readonly IMembresiaService _membresiaService;

        public MembresiasController(IMembresiaService membresiaService)
        {
            _membresiaService = membresiaService;
        }

        [HttpPost("asignar")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> AsignarMembresia([FromBody] AsignarMembresiaDto request)
        {
            var success = await _membresiaService.AsignarMembresiaAsync(request);
            if (!success) return BadRequest(new { message = "Usuario o Membresía no encontrados." });

            return Ok(new { message = "Membresía asignada exitosamente." });
        }

        [HttpGet("mis-creditos")]
        public async Task<IActionResult> ObtenerMisCreditos()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var creditos = await _membresiaService.ObtenerCreditosActualesAsync(userId);
            if (creditos == null) return NotFound(new { message = "No tenés créditos activos este mes." });

            return Ok(creditos);
        }

        [HttpPost("renovar-mes")]
        public async Task<IActionResult> RenovarMesActual()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var success = await _membresiaService.RenovarCreditosMesAsync(userId);
            if (!success) return BadRequest(new { message = "Error al renovar. Asegurate de tener una membresía activa." });

            return Ok(new { message = "Mes renovado con éxito (arrastre calculado)." });
        }

        [HttpPost("otorgar-creditos")]
        // [Authorize(Roles = "Admin, Profe")]
        public async Task<IActionResult> OtorgarCreditos([FromBody] OtorgarCreditoDto request)
        {
            var success = await _membresiaService.OtorgarCreditosExtraAsync(request);
            if (!success) return BadRequest(new { message = "Error al intentar otorgar créditos. Verificá el usuario." });

            return Ok(new { message = $"Se otorgaron {request.CantidadCreditos} créditos extra exitosamente." });
        }
    }
}