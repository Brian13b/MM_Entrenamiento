using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Application.Services
{
    public class MailKitEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MailKitEmailService> _logger;

        public MailKitEmailService(IConfiguration configuration, ILogger<MailKitEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task EnviarAsync(string destinatario, string asunto, string cuerpoHtml)
        {
            var host = _configuration["Smtp:Host"];
            var usuario = _configuration["Smtp:User"];
            var password = _configuration["Smtp:Password"];

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException("Falta configurar Smtp:Host, Smtp:User y Smtp:Password.");

            var puerto = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 587;
            var remitente = _configuration["Smtp:From"];
            if (string.IsNullOrWhiteSpace(remitente)) remitente = usuario;

            var mensaje = new MimeMessage();
            mensaje.From.Add(new MailboxAddress("MM Entrenamiento", remitente));
            mensaje.To.Add(MailboxAddress.Parse(destinatario));
            mensaje.Subject = asunto;
            mensaje.Body = new BodyBuilder { HtmlBody = cuerpoHtml }.ToMessageBody();

            var seguridad = puerto switch
            {
                465 => SecureSocketOptions.SslOnConnect,
                587 => SecureSocketOptions.StartTls,
                _ => SecureSocketOptions.Auto
            };

            try
            {
                using var cliente = new SmtpClient { Timeout = 10000 };

                _logger.LogInformation("Conectando a SMTP {Host}:{Puerto} ({Seguridad})", host, puerto, seguridad);
                await cliente.ConnectAsync(host, puerto, seguridad);

                _logger.LogInformation("Autenticando en SMTP con el usuario {Usuario}", usuario);
                await cliente.AuthenticateAsync(usuario, password);

                _logger.LogInformation("Enviando correo a {Destinatario}", destinatario);
                await cliente.SendAsync(mensaje);
                await cliente.DisconnectAsync(true);

                _logger.LogInformation("Correo enviado a {Destinatario}", destinatario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo el envio de correo a {Destinatario} via {Host}:{Puerto}", destinatario, host, puerto);
                throw new InvalidOperationException("No se pudo enviar el correo electrónico. Intentá nuevamente más tarde.", ex);
            }
        }
    }
}
