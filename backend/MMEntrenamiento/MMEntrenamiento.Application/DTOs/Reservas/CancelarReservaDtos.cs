namespace MMEntrenamiento.Application.DTOs.Reservas
{
    public class CancelarClaseDto
{
    public Guid UsuarioId { get; set; }
    public int TurnoId { get; set; }
    public string? Motivo { get; set; }
}

public class BajaTurnoFijoDto
{
    public Guid UsuarioId { get; set; }
    public int TurnoFijoId { get; set; }
}
}