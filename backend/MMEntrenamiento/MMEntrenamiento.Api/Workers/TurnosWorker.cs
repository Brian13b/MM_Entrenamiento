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
                    // Como el worker vive para siempre, necesitamos crear un 'Scope' nuevo
                    // para llamar a nuestros servicios que viven por request (Scoped)
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

                // Duerme hasta mañana (Para un MVP, revisar cada 24hs alcanza. 
                // Podrías usar TimeSpan.FromHours(24) o calcular los ms exactos hasta las 3 AM).
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}