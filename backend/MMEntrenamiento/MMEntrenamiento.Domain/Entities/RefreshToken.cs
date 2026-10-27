namespace MMEntrenamiento.Domain.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        // Se guarda solo el hash SHA-256: si se filtra la base, los tokens no sirven.
        public string TokenHash { get; set; } = null!;

        // Todos los tokens nacidos de un mismo login comparten familia. Si se detecta
        // reutilización de uno ya rotado, se revoca la familia entera.
        public Guid FamiliaId { get; set; }

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
        public DateTime ExpiraEn { get; set; }
        public DateTime? RevocadoEn { get; set; }
        public string? ReemplazadoPorHash { get; set; }
    }
}
