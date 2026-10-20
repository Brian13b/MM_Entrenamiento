using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using MMEntrenamiento.Application.DTOs.Auth;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<UserManager<Usuario>> _userManagerMock;
        private readonly Mock<RoleManager<IdentityRole<Guid>>> _roleManagerMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            var store = new Mock<IUserStore<Usuario>>();
            _userManagerMock = new Mock<UserManager<Usuario>>(store.Object, null, null, null, null, null, null, null, null);

            var roleStore = new Mock<IRoleStore<IdentityRole<Guid>>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole<Guid>>>(roleStore.Object, null, null, null, null);

            _configMock = new Mock<IConfiguration>();

            _authService = new AuthService(_userManagerMock.Object, _roleManagerMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task LoginAsync_DebeRetornarNull_CuandoUsuarioEstaBloqueado()
        {
            // Arrange
            var request = new LoginRequestDto { Email = "test@test.com", Password = "Password123!" };
            var usuarioBloqueado = new Usuario { Email = "test@test.com", EstadoCuenta = EstadoCuenta.Bloqueado };

            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(usuarioBloqueado);

            // Act
            var resultado = await _authService.LoginAsync(request);

            // Assert
            resultado.Should().BeNull();
        }

        [Fact]
        public async Task LoginAsync_DebeRetornarNull_CuandoPasswordEsIncorrecta()
        {
            // Arrange
            var request = new LoginRequestDto { Email = "test@test.com", Password = "WrongPassword!" };
            var usuarioValido = new Usuario { Email = "test@test.com", EstadoCuenta = EstadoCuenta.Activo };

            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(usuarioValido);
            _userManagerMock.Setup(x => x.CheckPasswordAsync(usuarioValido, request.Password)).ReturnsAsync(false);

            // Act
            var resultado = await _authService.LoginAsync(request);

            // Assert
            resultado.Should().BeNull();
        }
    }
}