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
    }
}