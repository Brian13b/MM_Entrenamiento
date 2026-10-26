namespace MMEntrenamiento.Application.DTOs.Administracion
{
    public class UsuarioDirectorioDto
    {
        public Guid Id { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Telefono { get; set; }
        public bool Activo { get; set; }
        public int CreditosDisponibles { get; set; }
        public string? DriveItemId { get; set; }
        public string Rol { get; set; } = "Alumno";
        public int? MembresiaId { get; set; }
        public bool Deudor { get; set; }
    }

    public class CambiarRolDto
    {
        public string NuevoRol { get; set; } = string.Empty;
    }

    public class CrearMembresiaDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int CreditosOtorgados { get; set; }
        public int LimiteTurnosFijos { get; set; }
        public decimal Precio { get; set; }
    }

    public class MembresiaDto : CrearMembresiaDto
    {
        public int Id { get; set; }
        public bool Activa { get; set; }
    }

    public class RegistrarPagoDto
    {
        public Guid UsuarioId { get; set; }
        public int Mes { get; set; }
        public int Anio { get; set; }
        public decimal MontoAbonado { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
    }

    public class AnuncioDto
    {
        public string? Mensaje { get; set; }
        public DateTime UltimaModificacion { get; set; }
    }

    public class ActualizarAnuncioDto
    {
        public string Mensaje { get; set; } = string.Empty;
    }

    public class PagoDto
    {
        public int Id { get; set; }
        public decimal Monto { get; set; }
        public int MesAbonado { get; set; }
        public int AnioAbonado { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public DateTime FechaPago { get; set; }
    }

    public class OcupacionDiaDto
    {
        public DayOfWeek DiaSemana { get; set; }
        public DateOnly Fecha { get; set; }
        public int Porcentaje { get; set; }
    }

    public class MetricasDto
    {
        public int OcupacionSemanal { get; set; }
        public int AlumnosActivos { get; set; }
        public int PagosPendientes { get; set; }
        public List<OcupacionDiaDto> OcupacionPorDia { get; set; } = new();
    }

    public class ConfiguracionGimnasioDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Instagram { get; set; }
    }
}