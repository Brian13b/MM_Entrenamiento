using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Asistencia;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Api.Controllers
{
    [Authorize(Roles = "Profe, Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AsistenciaController : ControllerBase
    {
        private readonly IAsistenciaService _asistenciaService;

        public AsistenciaController(IAsistenciaService asistenciaService)
        {
            _asistenciaService = asistenciaService;
        }

        [HttpGet("clase/{horarioId}")]
        public async Task<IActionResult> ObtenerDetalleClase(int horarioId, [FromQuery] DateTime fecha)
        {
            if (fecha == default)
                return BadRequest(new { message = "La fecha es obligatoria." });

            var detalle = await _asistenciaService.ObtenerDetalleClaseAsync(horarioId, fecha);
            if (detalle == null) return NotFound(new { message = "Turno no encontrado." });

            return Ok(detalle);
        }

        [HttpPost("clase/guardar")]
        public async Task<IActionResult> GuardarAsistencia([FromBody] GuardarAsistenciaDto request)
        {
            var (exito, mensaje) = await _asistenciaService.GuardarAsistenciaAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }
    }
}