using System;
using System.Linq.Expressions;
using System.Threading;
using FluentAssertions;
using Moq;
using Xunit;
using MMEntrenamiento.Application.DTOs.Reservas;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Tests.Services
{
    public class ReservaServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMembresiaService> _membresiaServiceMock;
        private readonly ReservaService _reservaService;

        public ReservaServiceTests()
        {
            // Instanciamos los Mocks (simuladores)
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _membresiaServiceMock = new Mock<IMembresiaService>();

            // Inyectamos los simuladores en tu servicio real
            _reservaService = new ReservaService(_unitOfWorkMock.Object, _membresiaServiceMock.Object);
        }

        [Fact]
        public async Task ReservarTurnoEventual_DebeFallar_CuandoFechaEsEnElPasado()
        {
            // Arrange (Preparar)
            var request = new CrearReservaDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                Fecha = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)) // Fecha de ayer
            };

            // Act (Ejecutar)
            var resultado = await _reservaService.ReservarTurnoEventualAsync(request);

            // Assert (Validar)
            resultado.Exito.Should().BeFalse();
            resultado.Mensaje.Should().Be("No podés reservar turnos en fechas pasadas.");
        }

        [Fact]
        public async Task ReservarTurnoEventual_DebeFallar_CuandoNoTieneCreditosSuficientes()
        {
            // Arrange
            var request = new CrearReservaDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                Fecha = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2))
            };

            var usuarioMock = new Usuario { Id = request.UsuarioId, EstadoCuenta = EstadoCuenta.Activo };
            var horarioMock = new Horario { Id = 1, CupoMaximo = 10 };

            // Billetera con 0 créditos disponibles (Base 4, Usados 4)
            var creditoMesMock = new CreditoMes { CreditosBase = 4, CreditosUsados = 4 };

            _unitOfWorkMock.Setup(u => u.Usuarios.GetByIdAsync(request.UsuarioId)).ReturnsAsync(usuarioMock);
            _unitOfWorkMock.Setup(u => u.Horarios.GetByIdAsync(request.HorarioId)).ReturnsAsync(horarioMock);
            _unitOfWorkMock.Setup(u => u.Reservas.FirstOrDefaultAsync(It.IsAny<Expression<Func<Reserva, bool>>>(), It.IsAny<Expression<Func<Reserva, object>>>())).ReturnsAsync((Reserva)null!);
            _membresiaServiceMock.Setup(m => m.RenovarCreditosMesAsync(request.UsuarioId, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync((true, "Ok"));
            _unitOfWorkMock.Setup(u => u.CreditosMes.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>())).ReturnsAsync(creditoMesMock);

            // Act
            var resultado = await _reservaService.ReservarTurnoEventualAsync(request);

            // Assert
            resultado.Exito.Should().BeFalse();
            resultado.Mensaje.Should().Be("No tenés créditos suficientes para este mes.");
        }

        [Fact]
        public async Task ReservarTurnoEventual_DebeTenerExito_CuandoDatosSonValidos()
        {
            // Arrange
            var request = new CrearReservaDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                Fecha = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2))
            };

            var usuarioMock = new Usuario { Id = request.UsuarioId, EstadoCuenta = EstadoCuenta.Activo };
            var horarioMock = new Horario { Id = 1, CupoMaximo = 10 };
            var creditoMesMock = new CreditoMes { CreditosBase = 4, CreditosUsados = 0 };
            var turnoMock = new Turno { HorarioId = 1, Fecha = request.Fecha, OcupacionActual = 5 };

            _unitOfWorkMock.Setup(u => u.Usuarios.GetByIdAsync(request.UsuarioId)).ReturnsAsync(usuarioMock);
            _unitOfWorkMock.Setup(u => u.Horarios.GetByIdAsync(request.HorarioId)).ReturnsAsync(horarioMock);
            _unitOfWorkMock.Setup(u => u.Reservas.FirstOrDefaultAsync(It.IsAny<Expression<Func<Reserva, bool>>>(), It.IsAny<Expression<Func<Reserva, object>>>())).ReturnsAsync((Reserva)null!);
            _membresiaServiceMock.Setup(m => m.RenovarCreditosMesAsync(request.UsuarioId, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync((true, "Ok"));
            _unitOfWorkMock.Setup(u => u.CreditosMes.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>())).ReturnsAsync(creditoMesMock);
            _unitOfWorkMock.Setup(u => u.Turnos.FirstOrDefaultAsync(It.IsAny<Expression<Func<Turno, bool>>>())).ReturnsAsync(turnoMock);
            _unitOfWorkMock.Setup(u => u.Reservas.AddAsync(It.IsAny<Reserva>())).Returns(Task.CompletedTask);

            // Act
            var resultado = await _reservaService.ReservarTurnoEventualAsync(request);

            // Assert
            resultado.Exito.Should().BeTrue();
            resultado.Mensaje.Should().Be("Reserva confirmada con éxito.");

            // Verificamos que se haya sumado un crédito usado y una ocupación
            turnoMock.OcupacionActual.Should().Be(6);
            creditoMesMock.CreditosUsados.Should().Be(1);

            // Verificamos que se haya llamado a _unitOfWork.CompleteAsync()
            _unitOfWorkMock.Verify(u => u.CompleteAsync(), Times.Once);
        }
    }
}