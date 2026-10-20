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

        // Admin y Profe pueden operar en nombre de un alumno enviando su usuarioId;
        // para el resto (o sin usuarioId) siempre se usa el usuario del token.
        private Guid ResolverUsuarioObjetivo(Guid usuarioIdSolicitado)
        {
            var userIdToken = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var puedeOperarPorTerceros = User.IsInRole("Admin") || User.IsInRole("Profe");

            return puedeOperarPorTerceros && usuarioIdSolicitado != Guid.Empty
                ? usuarioIdSolicitado
                : userIdToken;
        }

        [HttpPost("reservar")]
        [Authorize(Roles = "Alumno, Admin, Profe")]
        public async Task<IActionResult> ReservarEventual([FromBody] CrearReservaDto request)
        {
            var userIdToken = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (!User.IsInRole("Admin") && !User.IsInRole("Profe"))
            {
                request.UsuarioId = userIdToken;
            }

            var (exito, mensaje) = await _reservaService.ReservarTurnoEventualAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpPost("fijo/asignar")]
        [Authorize(Roles = "Admin, Profe")]
        public async Task<IActionResult> AsignarFijo([FromBody] AsignarTurnoFijoDto request)
        {
            var (exito, mensaje) = await _reservaService.AsignarTurnoFijoAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpPost("cancelar-clase")]
        public async Task<IActionResult> CancelarClase([FromBody] CancelarClaseDto request)
        {
            request.UsuarioId = ResolverUsuarioObjetivo(request.UsuarioId);

            var (exito, mensaje) = await _reservaService.CancelarClaseAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpPost("baja-turno-fijo")]
        public async Task<IActionResult> DarDeBajaTurnoFijo([FromBody] BajaTurnoFijoDto request)
        {
            request.UsuarioId = ResolverUsuarioObjetivo(request.UsuarioId);

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

        [HttpGet("usuario/{usuarioId}")]
        [Authorize(Roles = "Admin, Profe")]
        public async Task<IActionResult> ObtenerTurnosDeUsuario(Guid usuarioId)
        {
            var dashboard = await _reservaService.ObtenerMisTurnosAsync(usuarioId);
            return Ok(dashboard);
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