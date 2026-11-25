using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Services;

namespace MMEntrenamiento.Api.Workers
{
    public class TurnosWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TurnosWorker> _logger;

        public TurnosWorker(IServiceProvider serviceProvider, ILogger<TurnosWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TurnosWorker iniciado.");

            // La primera vuelta corre al arrancar (auto-catch-up tras un reinicio); después, solo de madrugada
            // (hora de Argentina). Cada corrida revisa de forma idempotente toda la ventana de 28 días.
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var reservaService = scope.ServiceProvider.GetRequiredService<IReservaService>();
                        await reservaService.ExtenderTurnosFijosDiarioAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al extender los turnos fijos.");
                }

                var ahora = FechaArgentina.Ahora();
                var proximaEjecucion = ProgramacionBarridoFijos.ProximaEjecucion(ahora);
                var tiempoEspera = proximaEjecucion - ahora;

                _logger.LogInformation("TurnosWorker durmiendo. Próxima ejecución (hora Argentina): {Proxima:dd/MM HH:mm}.", proximaEjecucion);

                await Task.Delay(tiempoEspera, stoppingToken);
            }
        }
    }
}
