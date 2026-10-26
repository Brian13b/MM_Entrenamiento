using Microsoft.Extensions.Configuration;
using MMEntrenamiento.Application.DTOs.Notificaciones;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using WebPush;

namespace MMEntrenamiento.Application.Services
{
    public class NotificacionPushService : INotificacionPushService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;

        public NotificacionPushService(IUnitOfWork unitOfWork, IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _config = config;
        }

        public async Task<(bool Exito, string Mensaje)> GuardarSuscripcionAsync(Guid usuarioId, SuscripcionPushDto request)
        {
            var existe = await _unitOfWork.SuscripcionesPush.AnyAsync(
                s => s.UsuarioId == usuarioId && s.Endpoint == request.Endpoint);

            if (!existe)
            {
                var suscripcion = new SuscripcionPush
                {
                    UsuarioId = usuarioId,
                    Endpoint = request.Endpoint,
                    P256dh = request.P256dh,
                    Auth = request.Auth
                };

                await _unitOfWork.SuscripcionesPush.AddAsync(suscripcion);
                await _unitOfWork.CompleteAsync();
            }

            return (true, "Suscripción guardada correctamente.");
        }

        public async Task EnviarNotificacionGlobalAsync(string titulo, string mensaje)
        {
            var suscripciones = await _unitOfWork.SuscripcionesPush.GetAllAsync();

            if (!suscripciones.Any()) return;

            var subject = _config["VapidDetails:Subject"];
            var publicKey = _config["VapidDetails:PublicKey"];
            var privateKey = _config["VapidDetails:PrivateKey"];

            var vapidDetails = new VapidDetails(subject, publicKey, privateKey);
            var webPushClient = new WebPushClient();

            var payload = $"{{\"title\": \"{titulo}\", \"body\": \"{mensaje}\", \"icon\": \"/icon-192x192.png\"}}";

            foreach (var sub in suscripciones)
            {
                var pushSubscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);

                try
                {
                    await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                }
                catch (WebPushException exception)
                {
                    if (exception.StatusCode == System.Net.HttpStatusCode.Gone)
                    {
                        _unitOfWork.SuscripcionesPush.Delete(sub);
                    }
                }
            }
            await _unitOfWork.CompleteAsync();
        }
    }
}