namespace MMEntrenamiento.Application.Services
{
    /// <summary>
    /// Horarios (hora de Argentina) en los que corre el barrido de turnos fijos.
    /// Son de madrugada para no competir con el uso de la app, que arranca a la mañana.
    /// </summary>
    public static class ProgramacionBarridoFijos
    {
        public static readonly TimeSpan[] HorasDeEjecucion = { TimeSpan.FromHours(1), TimeSpan.FromHours(4) };

        /// <summary>Próxima ejecución estrictamente posterior a <paramref name="ahoraArgentina"/>.</summary>
        public static DateTime ProximaEjecucion(DateTime ahoraArgentina)
        {
            foreach (var hora in HorasDeEjecucion)
            {
                var candidata = ahoraArgentina.Date + hora;
                if (candidata > ahoraArgentina) return candidata;
            }

            return ahoraArgentina.Date.AddDays(1) + HorasDeEjecucion[0];
        }
    }
}
