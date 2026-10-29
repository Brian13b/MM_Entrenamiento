using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using MMEntrenamiento.Application.Services;

namespace MMEntrenamiento.Tests.Services
{
    public class CloudinaryImageServiceTests
    {
        [Theory]
        [InlineData("https://res.cloudinary.com/zttrquqb/image/upload/v1712345678/mmentrenamiento_perfiles/abc123.jpg", "mmentrenamiento_perfiles/abc123")]
        [InlineData("https://res.cloudinary.com/zttrquqb/image/upload/mmentrenamiento_perfiles/abc123.webp", "mmentrenamiento_perfiles/abc123")]
        public void ExtraerPublicId_DebeIncluirLaCarpetaYQuitarVersionYExtension(string url, string esperado)
        {
            CloudinaryImageService.ExtraerPublicId(url).Should().Be(esperado);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("no-es-una-url")]
        [InlineData("https://ui-avatars.com/api/?name=Ana")]
        public void ExtraerPublicId_DebeRetornarNull_CuandoNoEsUnaUrlDeCloudinary(string? url)
        {
            CloudinaryImageService.ExtraerPublicId(url).Should().BeNull();
        }

        private static CloudinaryImageService CrearServicio() =>
            new(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cloudinary:CloudName"] = "test",
                ["Cloudinary:ApiKey"] = "test",
                ["Cloudinary:ApiSecret"] = "test"
            }).Build(), NullLogger<CloudinaryImageService>.Instance);

        private static IFormFile Archivo(string nombre, long tamano)
        {
            var archivo = new Mock<IFormFile>();
            archivo.SetupGet(f => f.FileName).Returns(nombre);
            archivo.SetupGet(f => f.Length).Returns(tamano);
            return archivo.Object;
        }

        [Fact]
        public async Task SubirAsync_DebeRechazar_UnArchivoMayorA5MB()
        {
            var (exito, mensaje, _) = await CrearServicio().SubirAsync(Archivo("foto.jpg", 5 * 1024 * 1024 + 1));

            exito.Should().BeFalse();
            mensaje.Should().Contain("5 MB");
        }

        [Theory]
        [InlineData("virus.exe")]
        [InlineData("documento.pdf")]
        [InlineData("sin-extension")]
        public async Task SubirAsync_DebeRechazar_ExtensionesNoPermitidas(string nombre)
        {
            var (exito, mensaje, _) = await CrearServicio().SubirAsync(Archivo(nombre, 1024));

            exito.Should().BeFalse();
            mensaje.Should().Contain("Formato no permitido");
        }
    }
}
