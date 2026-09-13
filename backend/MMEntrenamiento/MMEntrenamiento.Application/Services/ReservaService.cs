using MMEntrenamiento.Application.DTOs.Reservas;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Application.Services
{
    public class ReservaService : IReservaService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMembresiaService _membresiaService;

        public ReservaService(IUnitOfWork unitOfWork, IMembresiaService membresiaService)
        {
            _unitOfWork = unitOfWork;
            _membresiaService = membresiaService;
        }

        public async Task<bool> ReservarTurnoAsync(CrearReservaDto request)
        {
            // 1. Verificar Créditos del mes correspondiente a la FECHA del turno, no la de hoy
            var mesTurno = request.Fecha.Month;
            var anioTurno = request.Fecha.Year;

            var credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno
            );

            if (credito == null)
            {
                var creado = await _membresiaService.RenovarCreditosMesAsync(request.UsuarioId, mesTurno, anioTurno);
                if (!creado) return false;

                // Volvemos a buscar la billetera recién creada
                credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno
                );
            }

            // Si no tiene registro de créditos o ya gastó todos, bloqueamos
            if (credito == null || credito.CreditosUsados >= credito.CreditosBase)
                return false;

            // 2. Obtener el Horario base para saber el Cupo Máximo
            var horario = await _unitOfWork.Horarios.GetByIdAsync(request.HorarioId);
            if (horario == null) return false;

            // 3. Obtener o Crear la instancia del Turno para ese día específico
            var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(
                t => t.HorarioId == request.HorarioId && t.Fecha == request.Fecha
            );

            if (turno == null)
            {
                turno = new Turno
                {
                    HorarioId = request.HorarioId,
                    Fecha = request.Fecha,
                    OcupacionActual = 0,
                    EsFeriado = false
                };
                await _unitOfWork.Turnos.AddAsync(turno);
            }

            // 4. Validar Cupo
            if (turno.OcupacionActual >= horario.CupoMaximo)
                return false;

            // 5. Crear la Reserva
            var reserva = new Reserva
            {
                Turno = turno,
                UsuarioId = request.UsuarioId,
                Tipo = TipoReserva.Normal,
                Estado = EstadoReserva.Activa,
                FechaOperacion = DateTime.UtcNow
            };

            await _unitOfWork.Reservas.AddAsync(reserva);

            // 6. Actualizar contadores
            turno.OcupacionActual++;
            credito.CreditosUsados++;

            _unitOfWork.CreditosMes.Update(credito);

            // 7. Guardar todo
            await _unitOfWork.CompleteAsync();

            return true;
        }
    }
}