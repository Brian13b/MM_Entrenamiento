namespace MMEntrenamiento.Application.Services
{
    public enum MotivoOmisionFijo
    {
        SinCreditos,
        SinMembresia,
        TurnoLleno,
        CuentaNoActiva,
        Conflicto,
        Error
    }

    /// <summary>Contadores de una corrida del barrido de turnos fijos (para log y, a futuro, para el admin).</summary>
    public sealed class ResumenBarridoFijos
    {
        private readonly Dictionary<MotivoOmisionFijo, int> _omitidas = new();

        public int Creadas { get; set; }
        public int FechasConError { get; set; }
        public HashSet<Guid> AlumnosSinCreditos { get; } = new();

        public int Omitidas(MotivoOmisionFijo motivo) => _omitidas.TryGetValue(motivo, out var n) ? n : 0;

        public void Omitir(MotivoOmisionFijo motivo, Guid usuarioId)
        {
            _omitidas[motivo] = Omitidas(motivo) + 1;
            if (motivo == MotivoOmisionFijo.SinCreditos)
                AlumnosSinCreditos.Add(usuarioId);
        }

        public string Describir() =>
            $"creadas={Creadas}; omitidas: sin créditos={Omitidas(MotivoOmisionFijo.SinCreditos)}, " +
            $"sin membresía={Omitidas(MotivoOmisionFijo.SinMembresia)}, turno lleno={Omitidas(MotivoOmisionFijo.TurnoLleno)}, " +
            $"cuenta no activa={Omitidas(MotivoOmisionFijo.CuentaNoActiva)}, conflicto={Omitidas(MotivoOmisionFijo.Conflicto)}, " +
            $"error={Omitidas(MotivoOmisionFijo.Error)}; fechas con error={FechasConError}";
    }
}
