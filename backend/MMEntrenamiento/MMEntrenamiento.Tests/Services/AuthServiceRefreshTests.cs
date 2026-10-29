using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Tests.Services
{
    public class AuthServiceRefreshTests
    {
        private const string TokenEnClaro = "token-de-prueba";

        private readonly Mock<UserManager<Usuario>> _userManagerMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
        private readonly Mock<IGenericRepository<RefreshToken>> _tokensMock = new();
        private readonly AuthService _authService;
        private readonly Usuario _usuario = new()
        {
            Id = Guid.NewGuid(),
            Email = "alumno@test.com",
            NombreCompleto = "Alumno Test",
            EstadoCuenta = EstadoCuenta.Activo
        };

        public AuthServiceRefreshTests()
        {
            var store = new Mock<IUserStore<Usuario>>();
            _userManagerMock = new Mock<UserManager<Usuario>>(store.Object, null, null, null, null, null, null, null, null);
            var roleManagerMock = new Mock<RoleManager<IdentityRole<Guid>>>(
                new Mock<IRoleStore<IdentityRole<Guid>>>().Object, null, null, null, null);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "clave-de-prueba-de-al-menos-32-caracteres-xx",
                ["JwtSettings:Issuer"] = "test",
                ["JwtSettings:Audience"] = "test"
            }).Build();

            _unitOfWorkMock.SetupGet(u => u.RefreshTokens).Returns(_tokensMock.Object);
            _unitOfWorkMock.Setup(u => u.CompleteAsync()).ReturnsAsync(1);

            _userManagerMock.Setup(m => m.FindByIdAsync(_usuario.Id.ToString())).ReturnsAsync(_usuario);
            _userManagerMock.Setup(m => m.GetRolesAsync(_usuario)).ReturnsAsync(new List<string> { "Alumno" });

            _authService = new AuthService(_userManagerMock.Object, roleManagerMock.Object, config, _unitOfWorkMock.Object, new Mock<IEmailService>().Object, NullLogger<AuthService>.Instance);
        }

        private static string Hash(string valor) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(valor)));

        private RefreshToken CrearToken(DateTime? revocadoEn = null, string? reemplazadoPor = null, DateTime? expiraEn = null)
        {
            var token = new RefreshToken
            {
                UsuarioId = _usuario.Id,
                TokenHash = Hash(TokenEnClaro),
                FamiliaId = Guid.NewGuid(),
                ExpiraEn = expiraEn ?? DateTime.UtcNow.AddDays(30),
                RevocadoEn = revocadoEn,
                ReemplazadoPorHash = reemplazadoPor
            };

            _tokensMock
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<Expression<Func<RefreshToken, object>>[]>()))
                .ReturnsAsync(token);

            return token;
        }

        [Fact]
        public async Task RefreshAsync_DebeRetornarNull_CuandoNoHayCookie()
        {
            (await _authService.RefreshAsync(null)).Should().BeNull();
            (await _authService.RefreshAsync("  ")).Should().BeNull();
        }

        [Fact]
        public async Task RefreshAsync_DebeRetornarNull_CuandoElTokenNoExiste()
        {
            _tokensMock
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<Expression<Func<RefreshToken, object>>[]>()))
                .ReturnsAsync((RefreshToken?)null);

            (await _authService.RefreshAsync(TokenEnClaro)).Should().BeNull();
        }

        [Fact]
        public async Task RefreshAsync_DebeRotarElToken_CuandoEsValido()
        {
            var actual = CrearToken();
            RefreshToken? nuevo = null;
            _tokensMock.Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
                .Callback<RefreshToken>(t => nuevo = t)
                .Returns(Task.CompletedTask);

            var resultado = await _authService.RefreshAsync(TokenEnClaro);

            resultado.Should().NotBeNull();
            resultado!.Token.Should().NotBeNullOrEmpty();
            resultado.RefreshToken.Should().NotBeNullOrEmpty().And.NotBe(TokenEnClaro);

            actual.RevocadoEn.Should().NotBeNull();
            nuevo.Should().NotBeNull();
            nuevo!.FamiliaId.Should().Be(actual.FamiliaId);
            nuevo.TokenHash.Should().Be(Hash(resultado.RefreshToken!));
            actual.ReemplazadoPorHash.Should().Be(nuevo.TokenHash);
        }

        [Fact]
        public async Task RefreshAsync_DebeRetornarNull_CuandoElTokenExpiro()
        {
            CrearToken(expiraEn: DateTime.UtcNow.AddMinutes(-1));

            (await _authService.RefreshAsync(TokenEnClaro)).Should().BeNull();
        }

        [Fact]
        public async Task RefreshAsync_DebeRevocarLaFamilia_CuandoSeReutilizaUnTokenRotado()
        {
            var reutilizado = CrearToken(revocadoEn: DateTime.UtcNow.AddMinutes(-10), reemplazadoPor: "otro-hash");
            var hermano = new RefreshToken { FamiliaId = reutilizado.FamiliaId, TokenHash = "hermano" };
            _tokensMock
                .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<Expression<Func<RefreshToken, object>>[]>()))
                .ReturnsAsync(new List<RefreshToken> { hermano });

            var resultado = await _authService.RefreshAsync(TokenEnClaro);

            resultado.Should().BeNull();
            hermano.RevocadoEn.Should().NotBeNull();
        }

        [Fact]
        public async Task RefreshAsync_NoDebeReescribirLaCookie_DentroDeLaVentanaDeGracia()
        {
            CrearToken(revocadoEn: DateTime.UtcNow.AddSeconds(-5), reemplazadoPor: "otro-hash");

            var resultado = await _authService.RefreshAsync(TokenEnClaro);

            resultado.Should().NotBeNull();
            resultado!.Token.Should().NotBeNullOrEmpty();
            resultado.RefreshToken.Should().BeNull();
            _tokensMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        }

        [Fact]
        public async Task RefreshAsync_DebeRetornarNull_CuandoLaCuentaYaNoEstaActiva()
        {
            var actual = CrearToken();
            _usuario.EstadoCuenta = EstadoCuenta.Bloqueado;
            _tokensMock
                .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<Expression<Func<RefreshToken, object>>[]>()))
                .ReturnsAsync(new List<RefreshToken> { actual });

            var resultado = await _authService.RefreshAsync(TokenEnClaro);

            resultado.Should().BeNull();
            actual.RevocadoEn.Should().NotBeNull();
        }
    }
}
