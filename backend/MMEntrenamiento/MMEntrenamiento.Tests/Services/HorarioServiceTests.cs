using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Xunit;
using MMEntrenamiento.Application.DTOs.Horarios;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Tests.Services
{
    public class HorarioServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly HorarioService _horarioService;

        public HorarioServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _horarioService = new HorarioService(_unitOfWorkMock.Object);
        }

        [Fact]
        public async Task CrearHorario_DebeFallar_CuandoHoraFinEsMenorOIgualAInicio()
        {
            // Arrange
            var request = new CrearHorarioDto
            {
                DiaSemana = DayOfWeek.Monday,
                HoraInicio = new TimeOnly(18, 0, 0), 
                HoraFin = new TimeOnly(17, 0, 0),
                CupoMaximo = 10
            };

            // Act
            var resultado = await _horarioService.CrearHorarioAsync(request);

            // Assert
            resultado.Exito.Should().BeFalse();
            resultado.Mensaje.Should().Be("La hora de finalización debe ser posterior a la de inicio.");
        }

        [Fact]
        public async Task CrearHorario_DebeFallar_CuandoYaExisteUnHorarioIgual()
        {
            // Arrange
            var request = new CrearHorarioDto
            {
                DiaSemana = DayOfWeek.Monday,
                HoraInicio = new TimeOnly(18, 0, 0),
                HoraFin = new TimeOnly(19, 0, 0),
                CupoMaximo = 10
            };

            // Simulamos que el repositorio encuentra una coincidencia
            _unitOfWorkMock.Setup(u => u.Horarios.AnyAsync(It.IsAny<Expression<Func<Horario, bool>>>()))
                           .ReturnsAsync(true);

            // Act
            var resultado = await _horarioService.CrearHorarioAsync(request);

            // Assert
            resultado.Exito.Should().BeFalse();
            resultado.Mensaje.Should().Be("Ya existe un horario configurado para ese día y hora.");
        }
    }
}