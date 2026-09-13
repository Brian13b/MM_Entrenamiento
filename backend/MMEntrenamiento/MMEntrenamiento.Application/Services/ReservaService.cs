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

        public async Task<(bool Exito, string Mensaje)> ReservarTurnoAsync(CrearReservaDto request)
        {
            var fechaHoy = DateOnly.FromDateTime(DateTime.UtcNow);
            var fechaLimite = fechaHoy.AddMonths(1);

            if (request.Fecha < fechaHoy)
                return (false, "No podés reservar turnos en fechas pasadas.");

            if (request.Fecha > fechaLimite)
                return (false, "Solo podés reservar con hasta un mes de anticipación.");

            var mesTurno = request.Fecha.Month;
            var anioTurno = request.Fecha.Year;

            var credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno
            );

            if (credito == null)
            {
                var (creado, mensaje) = await _membresiaService.RenovarCreditosMesAsync(request.UsuarioId, mesTurno, anioTurno);
                if (!creado) return (false, "El usuario no tiene una membresía activa para generar créditos.");

                credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno
                );
            }

            if (credito == null || credito.CreditosUsados >= credito.CreditosBase)
                return (false, "No tenés créditos suficientes para este mes.");

            var horario = await _unitOfWork.Horarios.GetByIdAsync(request.HorarioId);
            if (horario == null) return (false, "El horario no existe.");


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

            if (turno.OcupacionActual >= horario.CupoMaximo)
                return (false, "El turno ya está lleno.");

            var reserva = new Reserva
            {
                Turno = turno,
                UsuarioId = request.UsuarioId,
                Tipo = TipoReserva.Normal,
                Estado = EstadoReserva.Activa,
                FechaOperacion = DateTime.UtcNow
            };

            await _unitOfWork.Reservas.AddAsync(reserva);

            turno.OcupacionActual++;
            credito.CreditosUsados++;

            _unitOfWork.CreditosMes.Update(credito);

            await _unitOfWork.CompleteAsync();

            return (true, "Reserva confirmada con éxito.");
        }
    }
}