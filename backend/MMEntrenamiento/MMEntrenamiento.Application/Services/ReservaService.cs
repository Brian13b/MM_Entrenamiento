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
            if (request.Fecha < fechaHoy)
                return (false, "No podés reservar turnos en fechas pasadas.");

            var horario = await _unitOfWork.Horarios.GetByIdAsync(request.HorarioId);
            if (horario == null) return (false, "El horario seleccionado no existe.");

            // ----------------------------------------------------------------
            // FLUJO A: RESERVA FIJA (Proyección de 4 semanas)
            // ----------------------------------------------------------------
            if (request.DejarFijo)
            {
                var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == request.UsuarioId, u => u.MembresiaActual!);
                var limiteFijos = usuario?.MembresiaActual?.LimiteTurnosFijos ?? 0;

                var cantidadFijosActuales = await _unitOfWork.TurnosFijos.CountAsync(tf => tf.UsuarioId == request.UsuarioId && tf.Activo);

                if (cantidadFijosActuales >= limiteFijos)
                    return (false, $"Tu membresía actual solo te permite tener {limiteFijos} horarios fijos por semana. Si querés este horario, dalo de baja de otro día primero.");

                // 1. Proyectar las 4 fechas
                var fechasAProyectar = new List<DateOnly>();
                for (int i = 0; i < 4; i++)
                {
                    fechasAProyectar.Add(request.Fecha.AddDays(i * 7));
                }

                // 2. Verificar que existan las billeteras de crédito para los meses involucrados y que alcance el saldo
                var turnosPorMes = fechasAProyectar.GroupBy(f => new { f.Year, f.Month });

                foreach (var grupoMes in turnosPorMes)
                {
                    var mes = grupoMes.Key.Month;
                    var anio = grupoMes.Key.Year;
                    var cantTurnosEnEsteMes = grupoMes.Count();

                    // Asegurar que la billetera del mes exista
                    var (creado, _) = await _membresiaService.RenovarCreditosMesAsync(request.UsuarioId, mes, anio);
                    if (!creado) return (false, $"No tenés una membresía activa para cubrir los turnos de {mes}/{anio}.");

                    var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                        c => c.UsuarioId == request.UsuarioId && c.Anio == anio && c.Mes == mes);

                    if (creditoMes == null || (creditoMes.CreditosBase - creditoMes.CreditosUsados) < cantTurnosEnEsteMes)
                        return (false, $"No te alcanzan los créditos de {mes}/{anio} para dejar este turno fijo.");
                }

                // 3. Verificar el cupo para las 4 fechas antes de guardar nada
                var turnosInstanciados = new List<Turno>();
                foreach (var fecha in fechasAProyectar)
                {
                    var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(t => t.HorarioId == request.HorarioId && t.Fecha == fecha);

                    if (turno == null)
                    {
                        turno = new Turno { HorarioId = request.HorarioId, Fecha = fecha, OcupacionActual = 0, EsFeriado = false };
                        await _unitOfWork.Turnos.AddAsync(turno);
                    }

                    if (turno.OcupacionActual >= horario.CupoMaximo)
                        return (false, $"No podés dejarlo fijo porque el día {fecha:dd/MM/yyyy} ya está lleno. Podés reservarlo de manera eventual para los días que haya lugar.");

                    turnosInstanciados.Add(turno);
                }

                // 4. Crear la plantilla TurnoFijo
                var turnoFijo = new TurnoFijo
                {
                    UsuarioId = request.UsuarioId,
                    HorarioId = request.HorarioId,
                    Activo = true
                };
                await _unitOfWork.TurnosFijos.AddAsync(turnoFijo);

                // 5. Crear las Reservas, actualizar ocupación y descontar créditos
                foreach (var turno in turnosInstanciados)
                {
                    var reserva = new Reserva
                    {
                        Turno = turno,
                        UsuarioId = request.UsuarioId,
                        Tipo = TipoReserva.Fija,
                        Estado = EstadoReserva.Activa,
                        FechaOperacion = DateTime.UtcNow
                    };
                    await _unitOfWork.Reservas.AddAsync(reserva);
                    turno.OcupacionActual++;

                    var credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                        c => c.UsuarioId == request.UsuarioId && c.Anio == turno.Fecha.Year && c.Mes == turno.Fecha.Month);

                    credito!.CreditosUsados++;
                    _unitOfWork.CreditosMes.Update(credito);
                }

                await _unitOfWork.CompleteAsync();
                return (true, "Turno fijo establecido y clases reservadas para las próximas 4 semanas con éxito.");
            }

            // ----------------------------------------------------------------
            // FLUJO B: RESERVA EVENTUAL (Solo un día)
            // ----------------------------------------------------------------
            else
            {
                var limiteEventual = fechaHoy.AddDays(21);
                if (request.Fecha > limiteEventual)
                    return (false, "Solo podés reservar turnos eventuales con hasta 21 días de anticipación.");

                var mesTurno = request.Fecha.Month;
                var anioTurno = request.Fecha.Year;

                var credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno);

                if (credito == null)
                {
                    var (creado, _) = await _membresiaService.RenovarCreditosMesAsync(request.UsuarioId, mesTurno, anioTurno);
                    if (!creado) return (false, "El usuario no tiene una membresía activa.");

                    credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                        c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno);
                }

                if (credito == null || credito.CreditosUsados >= credito.CreditosBase)
                    return (false, "No tenés créditos suficientes para este mes.");

                var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(t => t.HorarioId == request.HorarioId && t.Fecha == request.Fecha);

                if (turno == null)
                {
                    turno = new Turno { HorarioId = request.HorarioId, Fecha = request.Fecha, OcupacionActual = 0, EsFeriado = false };
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

        public async Task ExtenderTurnosFijosDiarioAsync()
        {
            // 1. Apuntamos exactamente a 4 semanas en el futuro
            var fechaObjetivo = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(28);
            var diaSemanaObjetivo = fechaObjetivo.DayOfWeek;

            // 2. Traemos SOLO los turnos fijos activos que caen en ese día de la semana
            var turnosFijos = await _unitOfWork.TurnosFijos.FindAsync(
                tf => tf.Activo && tf.Horario!.DiaSemana == diaSemanaObjetivo,
                tf => tf.Horario!
            );

            if (!turnosFijos.Any()) return;

            foreach (var turnoFijo in turnosFijos)
            {
                var mes = fechaObjetivo.Month;
                var anio = fechaObjetivo.Year;

                // 3. Asegurar billetera y saldo
                await _membresiaService.RenovarCreditosMesAsync(turnoFijo.UsuarioId, mes, anio);

                var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == turnoFijo.UsuarioId && c.Anio == anio && c.Mes == mes);

                if (creditoMes == null || creditoMes.CreditosUsados >= creditoMes.CreditosBase)
                    continue; // Si se quedó sin créditos, este mes no se le genera el lugar (podés notificarlo después)

                // 4. Buscar o crear la instancia del Turno
                var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(
                    t => t.HorarioId == turnoFijo.HorarioId && t.Fecha == fechaObjetivo,
                    t => t.Reservas
                );

                if (turno == null)
                {
                    turno = new Turno { HorarioId = turnoFijo.HorarioId, Fecha = fechaObjetivo, OcupacionActual = 0, EsFeriado = false, Reservas = new List<Reserva>() };
                    await _unitOfWork.Turnos.AddAsync(turno);
                }

                // 5. Verificar idempotencia y cupo
                bool yaTieneReserva = turno.Reservas.Any(r => r.UsuarioId == turnoFijo.UsuarioId);

                if (!yaTieneReserva && turno.OcupacionActual < turnoFijo.Horario.CupoMaximo)
                {
                    var nuevaReserva = new Reserva
                    {
                        Turno = turno,
                        UsuarioId = turnoFijo.UsuarioId,
                        Tipo = TipoReserva.Fija,
                        Estado = EstadoReserva.Activa,
                        FechaOperacion = DateTime.UtcNow
                    };

                    await _unitOfWork.Reservas.AddAsync(nuevaReserva);
                    turno.OcupacionActual++;
                    creditoMes.CreditosUsados++;
                    _unitOfWork.CreditosMes.Update(creditoMes);
                }
            }

            await _unitOfWork.CompleteAsync();
        }

        public async Task<(bool Exito, string Mensaje)> CancelarClaseAsync(CancelarClaseDto request)
        {
            // 1. Buscar la reserva activa para este usuario y turno
            var reserva = await _unitOfWork.Reservas.FirstOrDefaultAsync(
                r => r.UsuarioId == request.UsuarioId && r.TurnoId == request.TurnoId && r.Estado == EstadoReserva.Activa,
                r => r.Turno!
            );

            if (reserva == null) return (false, "No se encontró una reserva activa para este turno.");

            if (reserva.Turno.Fecha < DateOnly.FromDateTime(DateTime.UtcNow))
                return (false, "No podés cancelar turnos que ya pasaron.");

            // 2. Liberar el cupo y marcar como cancelada
            reserva.Estado = EstadoReserva.Cancelada;
            reserva.Turno.OcupacionActual--;

            // 3. Devolver el crédito a su billetera de ese mes
            var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == request.UsuarioId && c.Anio == reserva.Turno.Fecha.Year && c.Mes == reserva.Turno.Fecha.Month
            );

            if (creditoMes != null && creditoMes.CreditosUsados > 0)
            {
                creditoMes.CreditosUsados--;
                _unitOfWork.CreditosMes.Update(creditoMes);
            }

            // 4. Si la reserva era Fija, dejamos asentada la Excepción para el profe
            if (reserva.Tipo == TipoReserva.Fija)
            {
                var excepcion = new ExcepcionTurnoFijo
                {
                    UsuarioId = request.UsuarioId,
                    HorarioId = reserva.Turno.HorarioId,
                    FechaAusencia = reserva.Turno.Fecha,
                    Motivo = request.Motivo ?? "Cancelado por el alumno desde la app"
                };
                await _unitOfWork.ExcepcionesTurnosFijos.AddAsync(excepcion);
            }

            _unitOfWork.Reservas.Update(reserva);
            await _unitOfWork.CompleteAsync();

            return (true, "Reserva cancelada con éxito. Se te devolvió el crédito.");
        }

        public async Task<(bool Exito, string Mensaje)> DarDeBajaTurnoFijoAsync(BajaTurnoFijoDto request)
        {
            var turnoFijo = await _unitOfWork.TurnosFijos.GetByIdAsync(request.TurnoFijoId);

            if (turnoFijo == null || turnoFijo.UsuarioId != request.UsuarioId || !turnoFijo.Activo)
                return (false, "Turno fijo no encontrado o ya inactivo.");

            // 1. Desactivar la plantilla base
            turnoFijo.Activo = false;
            _unitOfWork.TurnosFijos.Update(turnoFijo);

            // 2. Buscar TODAS las reservas futuras generadas por este turno fijo
            var fechaHoy = DateOnly.FromDateTime(DateTime.UtcNow);

            var reservasFuturas = await _unitOfWork.Reservas.FindAsync(
                r => r.UsuarioId == request.UsuarioId
                  && r.Tipo == TipoReserva.Fija
                  && r.Estado == EstadoReserva.Activa
                  && r.Turno.HorarioId == turnoFijo.HorarioId
                  && r.Turno.Fecha >= fechaHoy,
                r => r.Turno!
            );

            int reservasCanceladas = 0;

            // 3. Limpiar todo lo futuro
            foreach (var reserva in reservasFuturas)
            {
                reserva.Estado = EstadoReserva.Cancelada;
                reserva.Turno.OcupacionActual--;

                var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == request.UsuarioId && c.Anio == reserva.Turno.Fecha.Year && c.Mes == reserva.Turno.Fecha.Month
                );

                if (creditoMes != null && creditoMes.CreditosUsados > 0)
                {
                    creditoMes.CreditosUsados--;
                    _unitOfWork.CreditosMes.Update(creditoMes);
                }

                _unitOfWork.Reservas.Update(reserva);
                reservasCanceladas++;
            }

            await _unitOfWork.CompleteAsync();

            return (true, $"Turno fijo dado de baja exitosamente. Se cancelaron {reservasCanceladas} clases futuras y se devolvieron los créditos.");
        }

        public async Task<IEnumerable<TurnoDisponibleDto>> ObtenerGrillaPorFechaAsync(DateOnly fecha)
        {
            var diaSemana = fecha.DayOfWeek;

            // 1. Buscamos la plantilla de horarios para ese día de la semana
            var horariosDelDia = await _unitOfWork.Horarios.FindAsync(h => h.DiaSemana == diaSemana);

            // 2. Buscamos las instancias reales de turnos para esa fecha exacta
            var turnosInstanciados = await _unitOfWork.Turnos.FindAsync(t => t.Fecha == fecha);

            var grilla = new List<TurnoDisponibleDto>();

            // 3. Hacemos el "Merge"
            foreach (var horario in horariosDelDia.OrderBy(h => h.HoraInicio))
            {
                var turno = turnosInstanciados.FirstOrDefault(t => t.HorarioId == horario.Id);

                grilla.Add(new TurnoDisponibleDto
                {
                    HorarioId = horario.Id,
                    HoraInicio = horario.HoraInicio,
                    HoraFin = horario.HoraFin,
                    CupoMaximo = horario.CupoMaximo,
                    OcupacionActual = turno?.OcupacionActual ?? 0
                });
            }

            return grilla;
        }

        public async Task<MisTurnosDashboardDto> ObtenerMisTurnosAsync(Guid usuarioId)
        {
            var fechaHoy = DateOnly.FromDateTime(DateTime.UtcNow);

            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, u => u.MembresiaActual!);
            var limite = usuario?.MembresiaActual?.LimiteTurnosFijos ?? 0;

            // 1. Buscar próximos turnos reservados activos del usuario
            var reservas = await _unitOfWork.Reservas.FindAsync(
                r => r.UsuarioId == usuarioId && r.Estado == EstadoReserva.Activa && r.Turno.Fecha >= fechaHoy,
                r => r.Turno!,
                r => r.Turno.Horario! 
            );

            // 2. Buscar sus turnos fijos activos
            var turnosFijos = await _unitOfWork.TurnosFijos.FindAsync(
                tf => tf.UsuarioId == usuarioId && tf.Activo,
                tf => tf.Horario!
            );

            // 3. Mapear al DTO
            var dashboard = new MisTurnosDashboardDto
            {
                LimiteTurnosFijos = limite,
                TurnosFijosActivos = turnosFijos.Count(),

                ProximasClases = reservas.OrderBy(r => r.Turno.Fecha).ThenBy(r => r.Turno.Horario.HoraInicio).Select(r => new MiReservaDto
                {
                    TurnoId = r.TurnoId,
                    Fecha = r.Turno.Fecha,
                    HoraInicio = r.Turno.Horario.HoraInicio,
                    TipoReserva = r.Tipo.ToString()
                }).ToList(),

                MisSuscripcionesFijas = turnosFijos.OrderBy(tf => tf.Horario.DiaSemana).ThenBy(tf => tf.Horario.HoraInicio).Select(tf => new MiTurnoFijoDto
                {
                    TurnoFijoId = tf.Id,
                    DiaSemana = tf.Horario.DiaSemana.ToString(),
                    HoraInicio = tf.Horario.HoraInicio
                }).ToList()
            };

            return dashboard;
        }
    }
}