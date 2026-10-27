using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MMEntrenamiento.Application.DTOs.Notificaciones;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;
using WebPush;

namespace MMEntrenamiento.Application.Services
{
    public class NotificacionPushService : INotificacionPushService
    {
        private static readonly TimeSpan TimeoutEnvio = TimeSpan.FromSeconds(15);

        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly ILogger<NotificacionPushService> _logger;

        public NotificacionPushService(IUnitOfWork unitOfWork, IConfiguration config, ILogger<NotificacionPushService> logger)
        {
            _unitOfWork = unitOfWork;
            _config = config;
            _logger = logger;
        }

        public async Task<(bool Exito, string Mensaje)> GuardarSuscripcionAsync(Guid usuarioId, SuscripcionPushDto request)
        {
            var suscripcionExistente = await _unitOfWork.SuscripcionesPush.FirstOrDefaultAsync(
                s => s.Endpoint == request.Endpoint);

            if (suscripcionExistente == null)
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
            else
            {
                // Mismo endpoint: se actualiza dueño y claves (si el navegador rotó las claves, las viejas no sirven).
                suscripcionExistente.UsuarioId = usuarioId;
                suscripcionExistente.P256dh = request.P256dh;
                suscripcionExistente.Auth = request.Auth;
                _unitOfWork.SuscripcionesPush.Update(suscripcionExistente);
                await _unitOfWork.CompleteAsync();
            }

            return (true, "Suscripción guardada correctamente.");
        }

        public async Task<(bool Exito, string Mensaje)> EliminarSuscripcionAsync(Guid usuarioId, string endpoint)
        {
            if (string.IsNullOrWhiteSpace(endpoint)) return (false, "El endpoint es obligatorio.");

            // Solo el dueño puede dar de baja su suscripción. Si no existe, la baja es idempotente.
            var suscripcion = await _unitOfWork.SuscripcionesPush.FirstOrDefaultAsync(
                s => s.Endpoint == endpoint && s.UsuarioId == usuarioId);

            if (suscripcion != null)
            {
                _unitOfWork.SuscripcionesPush.Delete(suscripcion);
                await _unitOfWork.CompleteAsync();
            }

            return (true, "Suscripción eliminada correctamente.");
        }

        public async Task EnviarNotificacionGlobalAsync(string titulo, string mensaje)
        {
            // Solo cuentas activas: los bloqueados (y los inactivos, que tampoco pueden entrar) no reciben avisos.
            var suscripciones = (await _unitOfWork.SuscripcionesPush.FindAsync(
                s => s.Usuario!.EstadoCuenta == EstadoCuenta.Activo,
                s => s.Usuario!)).ToList();

            if (suscripciones.Count == 0) return;

            var vapidDetails = new VapidDetails(
                _config["VapidDetails:Subject"],
                _config["VapidDetails:PublicKey"],
                _config["VapidDetails:PrivateKey"]);

            var payload = JsonSerializer.Serialize(new
            {
                title = titulo,
                body = mensaje,
                icon = "/pwa-192x192.png",
                url = "/"
            });

            // Timeout corto: un endpoint colgado no debe frenar al resto.
            using var httpClient = new HttpClient { Timeout = TimeoutEnvio };
            var webPushClient = new WebPushClient(httpClient);

            foreach (var sub in suscripciones)
            {
                // El try/catch va dentro del bucle: una falla en una suscripción no aborta las demás.
                try
                {
                    var pushSubscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                    await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                }
                catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.Gone or HttpStatusCode.NotFound)
                {
                    // 410/404: la suscripción ya no existe en el servicio push. Se limpia.
                    _unitOfWork.SuscripcionesPush.Delete(sub);
                }
                catch (WebPushException ex)
                {
                    _logger.LogWarning(ex, "Push rechazado ({Status}) para la suscripción {SuscripcionId}.", ex.StatusCode, sub.Id);
                }
                catch (Exception ex)
                {
                    // Timeouts, errores de red o claves malformadas.
                    _logger.LogWarning(ex, "No se pudo enviar el push a la suscripción {SuscripcionId}.", sub.Id);
                }
            }

            try
            {
                await _unitOfWork.CompleteAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudieron guardar las bajas de suscripciones push.");
            }
        }
    }
}
