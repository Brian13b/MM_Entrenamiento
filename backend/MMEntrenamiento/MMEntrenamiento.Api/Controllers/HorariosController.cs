using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MMEntrenamiento.Application.DTOs.Horarios;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class HorariosController : ControllerBase
    {
        private readonly IHorarioService _horarioService;

        public HorariosController(IHorarioService horarioService)
        {
            _horarioService = horarioService;
        }

        [HttpPost("crear")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CrearHorario([FromBody] CrearHorarioDto request)
        {
            var (exito, mensaje) = await _horarioService.CrearHorarioAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerHorarios()
        {
            var horarios = await _horarioService.ObtenerTodosAsync();
            return Ok(horarios);
        }

        [HttpPost("masivo")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CrearHorariosMasivos([FromBody] CrearHorarioMasivoDto request)
        {
            var (exito, mensaje) = await _horarioService.CrearHorariosMasivosAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpGet("fecha/{fecha}")]
        public async Task<IActionResult> ObtenerOperativaDiaria(DateOnly fecha)
        {
            var turnos = await _horarioService.ObtenerOperativaDiariaAsync(fecha);
            return Ok(turnos);
        }

        [HttpPost("reducido")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ConfigurarHorarioReducido([FromBody] ConfigurarHorarioReducidoDto request)
        {
            var (exito, mensaje) = await _horarioService.ConfigurarHorarioReducidoAsync(request);
            if (!exito) return BadRequest(new { message = mensaje });

            return Ok(new { message = mensaje });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarHorario(int id)
        {
            var resultado = await _horarioService.EliminarHorarioAsync(id);
            if (!resultado.Exito) return BadRequest(new { message = resultado.Mensaje });

            return Ok(new { message = resultado.Mensaje });
        }
    }
}