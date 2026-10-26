using MMEntrenamiento.Application.DTOs.Notificaciones;

namespace MMEntrenamiento.Application.Interfaces
{
    public interface INotificacionPushService
    {
        Task<(bool Exito, string Mensaje)> GuardarSuscripcionAsync(Guid usuarioId, SuscripcionPushDto request);
        Task EnviarNotificacionGlobalAsync(string titulo, string mensaje);
    }
}