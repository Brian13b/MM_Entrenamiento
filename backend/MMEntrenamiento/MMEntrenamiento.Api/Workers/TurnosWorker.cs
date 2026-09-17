using MMEntrenamiento.Application.Interfaces;

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

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var reservaService = scope.ServiceProvider.GetRequiredService<IReservaService>();

                        await reservaService.ExtenderTurnosFijosDiarioAsync();
                        _logger.LogInformation("Turnos fijos extendidos correctamente a 4 semanas.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al extender los turnos fijos.");
                }

                var ahora = DateTime.Now;
                var proximaEjecucion = ahora.Date.AddDays(1).AddHours(1);
                var tiempoEspera = proximaEjecucion - ahora;

                _logger.LogInformation($"TurnosWorker durmiendo. Próxima ejecución en {tiempoEspera.TotalHours:F2} horas.");

                await Task.Delay(tiempoEspera, stoppingToken);
            }
        }
    }
}