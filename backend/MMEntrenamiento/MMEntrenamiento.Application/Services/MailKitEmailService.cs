using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MMEntrenamiento.Application.Interfaces;

namespace MMEntrenamiento.Application.Services
{
    public class MailKitEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public MailKitEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
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

            using var cliente = new SmtpClient();
            await cliente.ConnectAsync(host, puerto, SecureSocketOptions.StartTls);
            await cliente.AuthenticateAsync(usuario, password);
            await cliente.SendAsync(mensaje);
            await cliente.DisconnectAsync(true);
        }
    }
}
