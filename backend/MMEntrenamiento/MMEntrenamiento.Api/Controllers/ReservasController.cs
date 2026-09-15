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

        [HttpPost("cancelar-clase")]
        public async Task<IActionResult> CancelarClase([FromBody] CancelarClaseDto request)
        {
            request.UsuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var (exito, mensaje) = await _reservaService.CancelarClaseAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpPost("baja-turno-fijo")]
        public async Task<IActionResult> DarDeBajaTurnoFijo([FromBody] BajaTurnoFijoDto request)
        {
            request.UsuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var (exito, mensaje) = await _reservaService.DarDeBajaTurnoFijoAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpGet("grilla/{fecha}")]
        public async Task<IActionResult> ObtenerGrilla(DateOnly fecha)
        {
            var grilla = await _reservaService.ObtenerGrillaPorFechaAsync(fecha);
            return Ok(grilla);
        }

        [HttpGet("mis-turnos")]
        public async Task<IActionResult> ObtenerMisTurnos()
        {
            var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var dashboard = await _reservaService.ObtenerMisTurnosAsync(usuarioId);
            return Ok(dashboard);
        }
    }
}