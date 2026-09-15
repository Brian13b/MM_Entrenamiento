using MMEntrenamiento.Application.DTOs.Administracion;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface IAdministracionService
    {
        Task<(bool Exito, string Mensaje)> CrearMembresiaAsync(CrearMembresiaDto request);
        Task<IEnumerable<MembresiaDto>> ObtenerMembresiasActivasAsync();

        Task<(bool Exito, string Mensaje)> RegistrarPagoManualAsync(RegistrarPagoDto request);
    }
}