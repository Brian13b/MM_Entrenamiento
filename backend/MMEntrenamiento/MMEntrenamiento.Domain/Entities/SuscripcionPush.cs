namespace MMEntrenamiento.Domain.Entities
{
    public class SuscripcionPush
    {
        public int Id { get; set; }
        public Guid UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }
}