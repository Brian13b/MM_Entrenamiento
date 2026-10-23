using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Administracion;
using MMEntrenamiento.Application.DTOs.Usuarios;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Services;

namespace MMEntrenamiento.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdministracionController : ControllerBase
    {
        private readonly IAdministracionService _adminService;
        private readonly IUsuarioService _usuarioService;

        public AdministracionController(IAdministracionService adminService, IUsuarioService usuarioService)
        {
            _adminService = adminService;
            _usuarioService = usuarioService;
        }

        [Authorize(Roles = "Admin, Profe")]
        [HttpGet("usuarios")]
        public async Task<IActionResult> ObtenerUsuariosDirectorio()
        {
            try
            {
                var usuarios = await _adminService.ObtenerUsuariosDirectorioAsync();
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener el directorio", error = ex.Message });
            }
        }

        [Authorize(Roles = "Admin, Profe")]
        [HttpGet("usuarios/{id}")]
        public async Task<IActionResult> ObtenerUsuarioPorId(Guid id)
        {
            var usuario = await _adminService.ObtenerUsuarioDirectorioPorIdAsync(id);
            if (usuario == null) return NotFound();

            return Ok(usuario);
        }

        [Authorize(Roles = "Admin,Profe")]
        [HttpPost("membresias")]
        public async Task<IActionResult> CrearMembresia([FromBody] CrearMembresiaDto request)
        {
            var (exito, mensaje) = await _adminService.CrearMembresiaAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [Authorize(Roles = "Admin,Profe")]
        [HttpGet("membresias")]
        public async Task<IActionResult> ObtenerMembresias()
        {
            var membresias = await _adminService.ObtenerMembresiasActivasAsync();
            return Ok(membresias);
        }

        [Authorize(Roles = "Admin,Profe")]
        [HttpPost("pagos")]
        public async Task<IActionResult> RegistrarPago([FromBody] RegistrarPagoDto request)
        {
            var (exito, mensaje) = await _adminService.RegistrarPagoManualAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [AllowAnonymous]
        [HttpGet("configuracion")]
        public async Task<IActionResult> ObtenerConfiguracion()
        {
            var config = await _adminService.ObtenerConfiguracionGimnasioAsync();
            return Ok(config);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("configuracion")]
        public async Task<IActionResult> ActualizarConfiguracion([FromBody] ConfiguracionGimnasioDto request)
        {
            var (exito, mensaje) = await _adminService.ActualizarConfiguracionGimnasioAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("metricas")]
        public async Task<IActionResult> ObtenerMetricas()
        {
            var metricas = await _adminService.ObtenerMetricasAsync();
            return Ok(metricas);
        }

        [Authorize(Roles = "Admin,Profe")]
        [HttpGet("pagos/{usuarioId}")]
        public async Task<IActionResult> ObtenerPagosUsuario(Guid usuarioId)
        {
            var pagos = await _adminService.ObtenerPagosUsuarioAsync(usuarioId);
            return Ok(pagos);
        }

        [Authorize(Roles = "Admin,Profe")]
        [HttpPut("usuarios/{usuarioId}/perfil")]
        public async Task<IActionResult> ActualizarPerfilUsuario(Guid usuarioId, [FromBody] ActualizarPerfilDto request)
        {
            var (exito, mensaje) = await _usuarioService.ActualizarPerfilAsync(usuarioId, request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }

        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
        [HttpPut("anuncio")]
        public async Task<IActionResult> ActualizarAnuncio([FromBody] ActualizarAnuncioDto request)
        {
            var (exito, mensaje) = await _adminService.ActualizarAnuncioGlobalAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });
            return Ok(new { message = mensaje });
        }
    }
}