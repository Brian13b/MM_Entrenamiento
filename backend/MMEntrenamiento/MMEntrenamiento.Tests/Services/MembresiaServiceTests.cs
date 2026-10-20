using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Xunit;
using MMEntrenamiento.Application.DTOs.Membresias;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Tests.Services
{
    public class MembresiaServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly MembresiaService _membresiaService;

        public MembresiaServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _membresiaService = new MembresiaService(_unitOfWorkMock.Object);
        }

        [Fact]
        public async Task RenovarCreditosMes_DebeCrearNuevoMes_CuandoNoExiste()
        {
            // Arrange
            var usuarioId = Guid.NewGuid();
            var usuarioMock = new Usuario { Id = usuarioId, MembresiaActual = new Membresia { CreditosOtorgados = 12 } };

            _unitOfWorkMock.Setup(u => u.Usuarios.FirstOrDefaultAsync(It.IsAny<Expression<Func<Usuario, bool>>>(), It.IsAny<Expression<Func<Usuario, object>>>()))
                           .ReturnsAsync(usuarioMock);
            _unitOfWorkMock.Setup(u => u.CreditosMes.AnyAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>()))
                           .ReturnsAsync(false); // Simulamos que el mes no existe aún
            _unitOfWorkMock.Setup(u => u.CreditosMes.AddAsync(It.IsAny<CreditoMes>()))
                           .Returns(Task.CompletedTask);

            // Act
            var resultado = await _membresiaService.RenovarCreditosMesAsync(usuarioId, 10, 2026);

            // Assert
            resultado.Exito.Should().BeTrue();
            resultado.Mensaje.Should().Be("Créditos renovados correctamente");

            // Verifica que el repositorio haya sido llamado para insertar un nuevo registro
            _unitOfWorkMock.Verify(u => u.CreditosMes.AddAsync(It.IsAny<CreditoMes>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task OtorgarCreditosExtra_DebeSumarAlBase_CuandoMesExiste()
        {
            // Arrange
            var request = new OtorgarCreditoDto { UsuarioId = Guid.NewGuid(), CantidadCreditos = 4 };
            var creditoMesMock = new CreditoMes { CreditosBase = 12, CreditosUsados = 0 };
            var usuarioMock = new Usuario { Id = request.UsuarioId, MembresiaActual = new Membresia { CreditosOtorgados = 12 } };

            _unitOfWorkMock.Setup(u => u.Usuarios.FirstOrDefaultAsync(It.IsAny<Expression<Func<Usuario, bool>>>(), It.IsAny<Expression<Func<Usuario, object>>>()))
                           .ReturnsAsync(usuarioMock);
            _unitOfWorkMock.Setup(u => u.CreditosMes.AnyAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>()))
                           .ReturnsAsync(true); // Simulamos que ya tiene un mes creado
            _unitOfWorkMock.Setup(u => u.CreditosMes.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>()))
                           .ReturnsAsync(creditoMesMock);

            // Act
            var resultado = await _membresiaService.OtorgarCreditosExtraAsync(request);

            // Assert
            resultado.Exito.Should().BeTrue();
            creditoMesMock.CreditosBase.Should().Be(16); // 12 base + 4 extra = 16

            // Verifica que se haya actualizado exactamente el registro en la base
            _unitOfWorkMock.Verify(u => u.CreditosMes.Update(creditoMesMock), Times.Once);
            _unitOfWorkMock.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task RenovarCreditosMes_DebeFallar_CuandoUsuarioNoTieneMembresia()
        {
            // Arrange
            var usuarioId = Guid.NewGuid();
            var usuarioSinMembresiaMock = new Usuario { Id = usuarioId, MembresiaActual = null };

            _unitOfWorkMock.Setup(u => u.Usuarios.FirstOrDefaultAsync(It.IsAny<Expression<Func<Usuario, bool>>>(), It.IsAny<Expression<Func<Usuario, object>>>()))
                           .ReturnsAsync(usuarioSinMembresiaMock);

            // Act
            var resultado = await _membresiaService.RenovarCreditosMesAsync(usuarioId, 10, 2026);

            // Assert
            resultado.Exito.Should().BeFalse();
            resultado.Mensaje.Should().Be("El usuario no tiene una membresía activa");
            _unitOfWorkMock.Verify(u => u.CompleteAsync(), Times.Never); // Nunca debe guardar en BD
        }
    }
}