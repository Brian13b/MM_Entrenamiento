using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Administracion;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdministracionController : ControllerBase
    {
        private readonly IAdministracionService _adminService;

        public AdministracionController(IAdministracionService adminService)
        {
            _adminService = adminService;
        }

        [HttpPost("membresias")]
        public async Task<IActionResult> CrearMembresia([FromBody] CrearMembresiaDto request)
        {
            var (exito, mensaje) = await _adminService.CrearMembresiaAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [HttpGet("membresias")]
        public async Task<IActionResult> ObtenerMembresias()
        {
            var membresias = await _adminService.ObtenerMembresiasActivasAsync();
            return Ok(membresias);
        }

        [HttpPost("pagos")]
        public async Task<IActionResult> RegistrarPago([FromBody] RegistrarPagoDto request)
        {
            var (exito, mensaje) = await _adminService.RegistrarPagoManualAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [HttpPut("usuarios/{usuarioId}/bloqueo")]
        public async Task<IActionResult> CambiarEstadoBloqueo(Guid usuarioId, [FromQuery] bool suspender)
        {
            var (exito, mensaje) = await _adminService.CambiarEstadoBloqueoAsync(usuarioId, suspender);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [AllowAnonymous] 
        [HttpGet("anuncio")]
        public async Task<IActionResult> ObtenerAnuncio()
        {
            var anuncio = await _adminService.ObtenerAnuncioGlobalAsync();
            if (anuncio == null) return NoContent();
            return Ok(anuncio);
        }

        [HttpPut("anuncio")]
        public async Task<IActionResult> ActualizarAnuncio([FromBody] ActualizarAnuncioDto request)
        {
            var (exito, mensaje) = await _adminService.ActualizarAnuncioGlobalAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }
    }
}