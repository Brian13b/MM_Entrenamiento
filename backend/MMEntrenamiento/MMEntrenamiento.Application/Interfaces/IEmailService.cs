namespace MMEntrenamiento.Application.Interfaces
{
    public interface IEmailService
    {
        Task EnviarAsync(string destinatario, string asunto, string cuerpoHtml);
    }
}
