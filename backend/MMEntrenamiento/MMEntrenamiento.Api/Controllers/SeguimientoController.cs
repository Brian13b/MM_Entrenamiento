using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Seguimiento;
using MMEntrenamiento.Application.Interfaces;
using System.Security.Claims;

namespace MMEntrenamiento.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SeguimientoController : ControllerBase
    {
        private readonly ISeguimientoService _seguimientoService;

        public SeguimientoController(ISeguimientoService seguimientoService)
        {
            _seguimientoService = seguimientoService;
        }

        [HttpGet("mi-ficha")]
        [Authorize(Roles = "Alumno, Admin")]
        public async Task<IActionResult> ObtenerMiFicha()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ficha = await _seguimientoService.ObtenerFichaAsync(userId);

            return ficha != null ? Ok(ficha) : NotFound(new { message = "Aún no tenés una ficha técnica cargada." });
        }

        [HttpPut("mi-ficha")]
        [Authorize(Roles = "Alumno, Admin")]
        public async Task<IActionResult> ActualizarMiFicha([FromBody] ActualizarFichaDto request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (exito, mensaje) = await _seguimientoService.ActualizarFichaAsync(userId, request);

            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [HttpGet("mi-plan")]
        public async Task<IActionResult> ObtenerMiPlan()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var plan = await _seguimientoService.ObtenerPlanOneDriveAsync(userId);

            return plan != null ? Ok(plan) : NotFound(new { message = "No hay plan de entrenamiento vinculado." });
        }

        [HttpGet("alumnos")]
        [Authorize(Roles = "Profe, Admin")]
        public async Task<IActionResult> ObtenerDirectorioAlumnos()
        {
            var alumnos = await _seguimientoService.ObtenerDirectorioAlumnosAsync();
            return Ok(alumnos);
        }

        [HttpGet("ficha/{usuarioId}")]
        [Authorize(Roles = "Profe, Admin")]
        public async Task<IActionResult> ObtenerFichaAlumno(Guid usuarioId)
        {
            var ficha = await _seguimientoService.ObtenerFichaAsync(usuarioId);
            var plan = await _seguimientoService.ObtenerPlanOneDriveAsync(usuarioId);

            return Ok(new
            {
                objetivos = ficha?.Objetivos ?? "",
                lesiones = ficha?.Lesiones ?? "",
                driveItemId = plan?.DriveItemId ?? ""
            });
        }

        [HttpPut("ficha/{usuarioId}")]
        [Authorize(Roles = "Profe, Admin")]
        public async Task<IActionResult> ActualizarFichaAlumno(Guid usuarioId, [FromBody] ActualizarFichaDto request)
        {
            var (exito, mensaje) = await _seguimientoService.ActualizarFichaAsync(usuarioId, request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpPut("vincular-plan/{usuarioId}")]
        [Authorize(Roles = "Profe, Admin")]
        public async Task<IActionResult> VincularPlan(Guid usuarioId, [FromBody] VincularOneDriveDto request)
        {
            var (exito, mensaje) = await _seguimientoService.VincularPlanOneDriveAsync(usuarioId, request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpGet("asistencia/{usuarioId}")]
        [Authorize(Roles = "Profe, Admin")]
        public async Task<IActionResult> ObtenerReporteAsistencia(Guid usuarioId, [FromQuery] int? mes, [FromQuery] int? anio)
        {
            var fechaHoy = DateTime.UtcNow;
            var mesFiltro = mes ?? fechaHoy.Month;
            var anioFiltro = anio ?? fechaHoy.Year;

            var reporte = await _seguimientoService.ObtenerReporteAsistenciaAsync(usuarioId, mesFiltro, anioFiltro);

            return Ok(reporte);
        }
    }
}