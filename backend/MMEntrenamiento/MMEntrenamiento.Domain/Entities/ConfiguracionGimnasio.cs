namespace MMEntrenamiento.Domain.Entities
{
    // Configuración global: existe una única fila (Id = 1).
    public class ConfiguracionGimnasio
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Instagram { get; set; }
        public DateTime UltimaModificacion { get; set; }
    }
}
