namespace MMEntrenamiento.Application.Services
{
    /// <summary>
    /// Argentina no tiene horario de verano: el huso es UTC-3 fijo, sin depender de la zona del servidor.
    /// </summary>
    public static class FechaArgentina
    {
        public static DateTime Ahora() => DateTime.UtcNow.AddHours(-3);

        public static DateOnly Hoy() => DateOnly.FromDateTime(Ahora());
    }
}
