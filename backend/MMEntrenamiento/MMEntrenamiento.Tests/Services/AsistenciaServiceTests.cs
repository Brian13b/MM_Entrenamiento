using FluentAssertions;
using Moq;
using MMEntrenamiento.Application.DTOs.Asistencia;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Tests.Services
{
    public class AsistenciaServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly AsistenciaService _asistenciaService;

        public AsistenciaServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _asistenciaService = new AsistenciaService(_unitOfWorkMock.Object);
        }

        [Fact]
        public async Task GuardarAsistencia_DebeActualizarEstadoDeLasReservas()
        {
            // Arrange
            var reservaMock = new Reserva { Id = 1, TurnoId = 10, Estado = EstadoReserva.Activa };

            var request = new GuardarAsistenciaDto
            {
                TurnoId = 10,
                Asistencias = new List<RegistroAsistenciaDto>
                {
                    new RegistroAsistenciaDto { ReservaId = 1, Asistio = true }
                }
            };

            _unitOfWorkMock.Setup(u => u.Reservas.GetByIdAsync(1)).ReturnsAsync(reservaMock);

            // Act
            var resultado = await _asistenciaService.GuardarAsistenciaAsync(request);

            // Assert
            resultado.Exito.Should().BeTrue();
            reservaMock.Estado.Should().Be(EstadoReserva.Asistio);

            _unitOfWorkMock.Verify(u => u.Reservas.Update(reservaMock), Times.Once);
            _unitOfWorkMock.Verify(u => u.CompleteAsync(), Times.Once);
        }
    }
}