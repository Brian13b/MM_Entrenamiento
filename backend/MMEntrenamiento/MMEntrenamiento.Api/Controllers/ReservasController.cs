using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Reservas;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Services;
using System.Security.Claims;

namespace MMEntrenamiento.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ReservasController : ControllerBase
    {
        private readonly IReservaService _reservaService;

        public ReservasController(IReservaService reservaService)
        {
            _reservaService = reservaService;
        }

        [HttpPost("reservar")]
        public async Task<IActionResult> ReservarTurno([FromBody] CrearReservaDto request)
        {
            request.UsuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var resultado = await _reservaService.ReservarTurnoAsync(request);

            if (!resultado.Exito)
            {
                return BadRequest(new { message = resultado.Mensaje });
            }

            return Ok(new { message = resultado.Mensaje });
        }
    }
}