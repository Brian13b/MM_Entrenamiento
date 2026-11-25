using MMEntrenamiento.Application.DTOs.Reservas;
using MMEntrenamiento.Application.Exceptions;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MMEntrenamiento.Application.Services
{
    public class ReservaService : IReservaService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMembresiaService _membresiaService;
        private readonly ILogger<ReservaService> _logger;

        public ReservaService(IUnitOfWork unitOfWork, IMembresiaService membresiaService, ILogger<ReservaService>? logger = null)
        {
            _unitOfWork = unitOfWork;
            _membresiaService = membresiaService;
            _logger = logger ?? NullLogger<ReservaService>.Instance;
        }

        private const string MensajeYaTieneTurnoEnElDia = "Ya tenés un turno activo para este día. Solo podés tener una reserva activa por día.";

        // Regla de negocio: una sola reserva vigente (Activa o Asistio) por alumno y fecha.
        // Cancelada y Ausente liberan el día para volver a anotarse.
        private Task<bool> TieneReservaVigenteEnFechaAsync(Guid usuarioId, DateOnly fecha) =>
            _unitOfWork.Reservas.AnyAsync(r =>
                r.UsuarioId == usuarioId
                && r.Turno.Fecha == fecha
                && (r.Estado == EstadoReserva.Activa || r.Estado == EstadoReserva.Asistio));

        public async Task<(bool Exito, string Mensaje)> ReservarTurnoEventualAsync(CrearReservaDto request)
        {
            var fechaHoy = DateOnly.FromDateTime(DateTime.UtcNow);
            if (request.Fecha < fechaHoy) return (false, "No podés reservar turnos en fechas pasadas.");

            var limiteEventual = fechaHoy.AddDays(21);
            if (request.Fecha > limiteEventual) return (false, "Solo podés reservar con hasta 21 días de anticipación.");

            var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId);
            if (usuario != null && usuario.EstadoCuenta != EstadoCuenta.Activo)
                return (false, "Tu cuenta se encuentra suspendida. Por favor, comunicate con administración.");

            var horario = await _unitOfWork.Horarios.GetByIdAsync(request.HorarioId);
            if (horario == null) return (false, "El horario seleccionado no existe.");

            var reducidoDelDia = await DisponibilidadHorarios.ObtenerReducidoAsync(_unitOfWork, request.Fecha);
            if (!DisponibilidadHorarios.EstaDisponible(horario, reducidoDelDia))
                return (false, $"Ese horario no está disponible el {request.Fecha:dd/MM/yyyy} por horario reducido o feriado.");

            if (await TieneReservaVigenteEnFechaAsync(request.UsuarioId, request.Fecha))
                return (false, MensajeYaTieneTurnoEnElDia);

            var mesTurno = request.Fecha.Month;
            var anioTurno = request.Fecha.Year;

            var (creado, _) = await _membresiaService.RenovarCreditosMesAsync(request.UsuarioId, mesTurno, anioTurno);
            if (!creado) return (false, "No tenés una membresía activa.");

            var credito = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == request.UsuarioId && c.Anio == anioTurno && c.Mes == mesTurno);

            if (credito == null || credito.CreditosUsados >= credito.CreditosBase)
                return (false, "No tenés créditos suficientes para este mes.");

            var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(t => t.HorarioId == request.HorarioId && t.Fecha == request.Fecha);

            if (turno == null)
            {
                turno = new Turno { HorarioId = request.HorarioId, Fecha = request.Fecha, OcupacionActual = 0, EsFeriado = false };
                await _unitOfWork.Turnos.AddAsync(turno);
            }

            int cupoReal = horario.CupoMaximo > 0 ? horario.CupoMaximo : 8;

            if (turno.OcupacionActual >= cupoReal) return (false, "El turno ya está lleno.");

            var reserva = new Reserva
            {
                Turno = turno,
                Fecha = request.Fecha,
                UsuarioId = request.UsuarioId,
                Tipo = TipoReserva.Normal,
                Estado = EstadoReserva.Activa,
                FechaOperacion = DateTime.UtcNow
            };

            await _unitOfWork.Reservas.AddAsync(reserva);
            turno.OcupacionActual++;
            credito.CreditosUsados++;

            _unitOfWork.CreditosMes.Update(credito);

            try
            {
                await _unitOfWork.CompleteAsync();
            }
            catch (ConflictoReservaException)
            {
                return (false, MensajeYaTieneTurnoEnElDia);
            }

            return (true, "Reserva confirmada con éxito.");
        }

        public async Task<(bool Exito, string Mensaje)> AsignarTurnoFijoAsync(AsignarTurnoFijoDto request)
        {
            var ahoraArgentina = FechaArgentina.Ahora();
            var fechaHoy = DateOnly.FromDateTime(ahoraArgentina);
            if (request.FechaInicio < fechaHoy) return (false, "La fecha de inicio no puede ser en el pasado.");

            var horario = await _unitOfWork.Horarios.GetByIdAsync(request.HorarioId);
            if (horario == null) return (false, "El horario seleccionado no existe.");

            // El turno fijo es semanal: la primera fecha tiene que caer en el día de la semana del horario.
            // Si no coincide, se corre hacia adelante al próximo día correcto. Si es hoy y la clase ya
            // comenzó, arranca la semana que viene.
            var fechaInicio = AlinearAlDiaDelHorario(request.FechaInicio, horario.DiaSemana);
            if (fechaInicio == fechaHoy && horario.HoraInicio <= TimeOnly.FromDateTime(ahoraArgentina))
                fechaInicio = fechaInicio.AddDays(7);
            bool fechaAjustada = fechaInicio != request.FechaInicio;

            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(u => u.Id == request.UsuarioId, u => u.MembresiaActual!);
            if (usuario != null && usuario.EstadoCuenta != EstadoCuenta.Activo)
                return (false, "La cuenta del alumno se encuentra suspendida.");

            var limiteFijos = usuario?.MembresiaActual?.LimiteTurnosFijos ?? 0;
            var cantidadFijosActuales = await _unitOfWork.TurnosFijos.CountAsync(tf => tf.UsuarioId == request.UsuarioId && tf.Activo);

            if (cantidadFijosActuales >= limiteFijos)
                return (false, $"La membresía actual solo permite tener {limiteFijos} horarios fijos semanales.");

            var fechasAProyectar = new List<DateOnly>();
            for (int i = 0; i < 4; i++)
            {
                var fechaCandidata = fechaInicio.AddDays(i * 7);
                var reducido = await DisponibilidadHorarios.ObtenerReducidoAsync(_unitOfWork, fechaCandidata);

                // En fechas con horario reducido/feriado los turnos fijos no se reservan solos:
                // cada alumno debe anotarse de nuevo en la grilla de ese día.
                if (reducido == null)
                    fechasAProyectar.Add(fechaCandidata);
            }

            var turnosPorMes = fechasAProyectar.GroupBy(f => new { f.Year, f.Month });
            foreach (var grupoMes in turnosPorMes)
            {
                var mes = grupoMes.Key.Month;
                var anio = grupoMes.Key.Year;

                var (creado, _) = await _membresiaService.RenovarCreditosMesAsync(request.UsuarioId, mes, anio);
                if (!creado) return (false, $"El usuario no tiene una membresía para cubrir {mes}/{anio}.");

                var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == request.UsuarioId && c.Anio == anio && c.Mes == mes);

                if (creditoMes == null || (creditoMes.CreditosBase - creditoMes.CreditosUsados) < grupoMes.Count())
                    return (false, $"Al usuario no le alcanzan los créditos de {mes}/{anio} para fijar este turno.");
            }

            var turnosInstanciados = new List<Turno>();
            foreach (var fecha in fechasAProyectar)
            {
                if (await TieneReservaVigenteEnFechaAsync(request.UsuarioId, fecha))
                    return (false, $"El alumno ya tiene un turno activo el {fecha:dd/MM/yyyy}. Solo puede tener una reserva activa por día.");

                var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(t => t.HorarioId == request.HorarioId && t.Fecha == fecha);
                if (turno == null)
                {
                    turno = new Turno { HorarioId = request.HorarioId, Fecha = fecha, OcupacionActual = 0, EsFeriado = false };
                    await _unitOfWork.Turnos.AddAsync(turno);
                }

                if (turno.OcupacionActual >= horario.CupoMaximo)
                    return (false, $"El día {fecha:dd/MM/yyyy} ya está lleno. Liberar cupo o usar turnos eventuales.");

                turnosInstanciados.Add(turno);
            }

            var turnoFijo = new TurnoFijo { UsuarioId = request.UsuarioId, HorarioId = request.HorarioId, Activo = true };
            await _unitOfWork.TurnosFijos.AddAsync(turnoFijo);

            foreach (var turno in turnosInstanciados)
            {
                var reserva = new Reserva
                {
                    Turno = turno,
                    Fecha = turno.Fecha,
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

            try
            {
                await _unitOfWork.CompleteAsync();
            }
            catch (ConflictoReservaException)
            {
                return (false, "El alumno ya tiene un turno activo en alguna de las fechas a reservar. Solo puede tener una reserva activa por día.");
            }

            var mensajeExito = "Turno fijo establecido y 4 semanas reservadas con éxito.";
            if (fechaAjustada)
                mensajeExito += $" La fecha de inicio se ajustó al {fechaInicio:dd/MM/yyyy} para coincidir con el día del horario.";

            return (true, mensajeExito);
        }

        private static DateOnly AlinearAlDiaDelHorario(DateOnly fecha, DayOfWeek diaHorario)
        {
            int diasHastaElDia = ((int)diaHorario - (int)fecha.DayOfWeek + 7) % 7;
            return fecha.AddDays(diasHastaElDia);
        }

        // Procesa una fecha específica respetando feriados, cancelaciones y excepciones.
        // Cada alumno se guarda por separado: un conflicto o error de uno no arrastra a los demás.
        public Task ExtenderTurnosFijosParaFechaAsync(DateOnly fechaObjetivo) =>
            ProcesarFechaAsync(fechaObjetivo, new ResumenBarridoFijos());

        private async Task ProcesarFechaAsync(DateOnly fechaObjetivo, ResumenBarridoFijos resumen)
        {
            // 1. Si es feriado u horario reducido, no se generan turnos fijos automáticos
            var reducido = await DisponibilidadHorarios.ObtenerReducidoAsync(_unitOfWork, fechaObjetivo);
            if (reducido != null) return;

            var diaSemanaObjetivo = fechaObjetivo.DayOfWeek;

            // 2. Traer SOLO los turnos fijos activos que caen en ese día de la semana
            //    (orden determinista para que, si falta cupo, el criterio no cambie entre corridas)
            var turnosFijos = (await _unitOfWork.TurnosFijos.FindAsync(
                tf => tf.Activo && tf.Horario!.DiaSemana == diaSemanaObjetivo,
                tf => tf.Horario!,
                tf => tf.Usuario!
            )).OrderBy(tf => tf.Id).ToList();

            if (turnosFijos.Count == 0) return;

            var alumnosAsignados = new HashSet<Guid>();

            foreach (var turnoFijo in turnosFijos)
            {
                await GenerarReservaFijaAsync(turnoFijo, fechaObjetivo, alumnosAsignados, resumen);
            }
        }

        private async Task GenerarReservaFijaAsync(
            TurnoFijo turnoFijo, DateOnly fecha, HashSet<Guid> alumnosAsignados, ResumenBarridoFijos resumen)
        {
            var usuarioId = turnoFijo.UsuarioId;
            var horarioId = turnoFijo.HorarioId;

            try
            {
                // 3. Cuenta bloqueada/inactiva: no se generan reservas nuevas (se omite antes de tocar créditos).
                //    Los turnos fijos siguen activos: si se reactiva la cuenta, el próximo barrido los completa.
                if (turnoFijo.Usuario == null)
                {
                    resumen.Omitir(MotivoOmisionFijo.Error, usuarioId);
                    _logger.LogError(
                        "Turno fijo NO generado: no se pudo cargar el usuario. Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                        fecha, horarioId, usuarioId);
                    return;
                }

                if (turnoFijo.Usuario.EstadoCuenta != EstadoCuenta.Activo)
                {
                    resumen.Omitir(MotivoOmisionFijo.CuentaNoActiva, usuarioId);
                    _logger.LogDebug(
                        "Turno fijo no generado: cuenta {Estado}. Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                        turnoFijo.Usuario.EstadoCuenta, fecha, horarioId, usuarioId);
                    return;
                }

                // 4. Hoy: si la clase ya comenzó, no se reserva (evita crear/consumir crédito de una clase pasada).
                var ahoraArgentina = FechaArgentina.Ahora();
                if (fecha == DateOnly.FromDateTime(ahoraArgentina)
                    && turnoFijo.Horario.HoraInicio <= TimeOnly.FromDateTime(ahoraArgentina))
                {
                    _logger.LogDebug(
                        "Turno fijo no generado: la clase de hoy ya comenzó. Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                        fecha, horarioId, usuarioId);
                    return;
                }

                // 5. Reserva vigente, falta registrada o excepción previa.
                //    Ojo: una reserva "Cancelada" NO frena la generación por sí sola. Cuando el alumno cancela una
                //    clase fija se crea una excepción (eso es lo que respeta el barrido); la baja del turno fijo,
                //    en cambio, cancela reservas sin excepción y no debe bloquear una reasignación posterior.
                if (alumnosAsignados.Contains(usuarioId)
                    || await TieneReservaVigenteEnFechaAsync(usuarioId, fecha))
                    return;

                var yaFalto = await _unitOfWork.Reservas.AnyAsync(r =>
                    r.UsuarioId == usuarioId
                    && r.Turno.Fecha == fecha
                    && r.Turno.HorarioId == horarioId
                    && r.Estado == EstadoReserva.Ausente);

                var tieneExcepcion = await _unitOfWork.ExcepcionesTurnosFijos.AnyAsync(e =>
                    e.UsuarioId == usuarioId
                    && e.HorarioId == horarioId
                    && e.FechaAusencia == fecha);

                if (yaFalto || tieneExcepcion)
                {
                    _logger.LogDebug(
                        "Turno fijo no generado (falta registrada o aviso del alumno). Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                        fecha, horarioId, usuarioId);
                    return;
                }

                var mes = fecha.Month;
                var anio = fecha.Year;

                // 6. Asegurar billetera y saldo (esta llamada guarda por su cuenta; acá no hay nada pendiente)
                var (hayMembresia, mensajeMembresia) = await _membresiaService.RenovarCreditosMesAsync(usuarioId, mes, anio);

                var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                    c => c.UsuarioId == usuarioId && c.Anio == anio && c.Mes == mes);

                if (creditoMes == null)
                {
                    resumen.Omitir(MotivoOmisionFijo.SinMembresia, usuarioId);
                    _logger.LogWarning(
                        "Turno fijo NO generado: sin membresía/billetera. Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId} Detalle={Detalle}",
                        fecha, horarioId, usuarioId, hayMembresia ? "billetera inexistente" : mensajeMembresia);
                    return;
                }

                if (creditoMes.CreditosUsados >= creditoMes.CreditosBase)
                {
                    // Regla de negocio: sin créditos no se reserva; el admin decide si otorga más.
                    resumen.Omitir(MotivoOmisionFijo.SinCreditos, usuarioId);
                    _logger.LogWarning(
                        "Turno fijo NO generado: sin créditos en {Mes}/{Anio} ({Usados}/{Base}). Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                        mes, anio, creditoMes.CreditosUsados, creditoMes.CreditosBase, fecha, horarioId, usuarioId);
                    return;
                }

                // 7. Buscar o crear la instancia del Turno
                var turno = await _unitOfWork.Turnos.FirstOrDefaultAsync(
                    t => t.HorarioId == horarioId && t.Fecha == fecha,
                    t => t.Reservas
                );

                if (turno == null)
                {
                    turno = new Turno { HorarioId = horarioId, Fecha = fecha, OcupacionActual = 0, EsFeriado = false, Reservas = new List<Reserva>() };
                    await _unitOfWork.Turnos.AddAsync(turno);
                }

                // 8. Verificar idempotencia y cupo
                if (turno.Reservas.Any(r => r.UsuarioId == usuarioId && r.Estado == EstadoReserva.Activa))
                    return;

                if (turno.OcupacionActual >= turnoFijo.Horario.CupoMaximo)
                {
                    _unitOfWork.LimpiarCambiosPendientes();
                    resumen.Omitir(MotivoOmisionFijo.TurnoLleno, usuarioId);
                    _logger.LogWarning(
                        "Turno fijo NO generado: turno lleno ({Ocupacion}/{Cupo}). Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                        turno.OcupacionActual, turnoFijo.Horario.CupoMaximo, fecha, horarioId, usuarioId);
                    return;
                }

                await _unitOfWork.Reservas.AddAsync(new Reserva
                {
                    Turno = turno,
                    Fecha = fecha,
                    UsuarioId = usuarioId,
                    Tipo = TipoReserva.Fija,
                    Estado = EstadoReserva.Activa,
                    FechaOperacion = DateTime.UtcNow
                });
                turno.OcupacionActual++;
                creditoMes.CreditosUsados++;
                _unitOfWork.CreditosMes.Update(creditoMes);

                // 9. Guardado atómico por alumno
                await _unitOfWork.CompleteAsync();
                alumnosAsignados.Add(usuarioId);
                resumen.Creadas++;
            }
            catch (ConflictoReservaException ex)
            {
                _unitOfWork.LimpiarCambiosPendientes();
                resumen.Omitir(MotivoOmisionFijo.Conflicto, usuarioId);
                _logger.LogWarning(ex,
                    "Turno fijo NO generado: conflicto de reserva (ya tiene un turno ese día). Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                    fecha, horarioId, usuarioId);
            }
            catch (Exception ex)
            {
                _unitOfWork.LimpiarCambiosPendientes();
                resumen.Omitir(MotivoOmisionFijo.Error, usuarioId);
                _logger.LogError(ex,
                    "Turno fijo NO generado: error al guardar. Fecha={Fecha} HorarioId={HorarioId} UsuarioId={UsuarioId}",
                    fecha, horarioId, usuarioId);
            }
        }

        // Barrido idempotente de la ventana completa (hoy..+28): completa huecos de corridas fallidas,
        // reinicios o cupos liberados. Es el único camino que usa el worker.
        public Task ExtenderTurnosFijosDiarioAsync() => ExtenderTurnosFijosVentanaCompletaAsync();

        public async Task ExtenderTurnosFijosVentanaCompletaAsync()
        {
            var hoy = FechaArgentina.Hoy();
            var resumen = new ResumenBarridoFijos();

            for (int i = 0; i <= 28; i++)
            {
                var fecha = hoy.AddDays(i);
                try
                {
                    await ProcesarFechaAsync(fecha, resumen);
                }
                catch (Exception ex)
                {
                    _unitOfWork.LimpiarCambiosPendientes();
                    resumen.FechasConError++;
                    _logger.LogError(ex, "Error al extender turnos fijos para la fecha {Fecha}; se continúa con las siguientes.", fecha);
                }
            }

            _logger.LogInformation(
                "Barrido de turnos fijos finalizado ({Desde:dd/MM}–{Hasta:dd/MM}): {Resumen}",
                hoy, hoy.AddDays(28), resumen.Describir());

            if (resumen.AlumnosSinCreditos.Count > 0)
            {
                _logger.LogWarning(
                    "Alumnos con turnos fijos omitidos por falta de créditos ({Cantidad}): {Alumnos}",
                    resumen.AlumnosSinCreditos.Count, string.Join(", ", resumen.AlumnosSinCreditos));
            }
        }

        public async Task<(bool Exito, string Mensaje)> CancelarClaseAsync(CancelarClaseDto request)
        {
            // 1. Buscar la reserva activa para este usuario y turno
            var reserva = await _unitOfWork.Reservas.FirstOrDefaultAsync(
                r => r.UsuarioId == request.UsuarioId && r.TurnoId == request.TurnoId && r.Estado == EstadoReserva.Activa,
                r => r.Turno!,
                r => r.Turno.Horario!
            );

            if (reserva == null) return (false, "No se encontró una reserva activa para este turno.");

            // Argentina no tiene horario de verano: el huso del sistema es UTC-3 fijo.
            var ahoraArgentina = DateTime.UtcNow.AddHours(-3);
            var inicioClase = reserva.Turno.Fecha.ToDateTime(reserva.Turno.Horario.HoraInicio);
            if (inicioClase <= ahoraArgentina)
                return (false, "No podés cancelar una clase que ya empezó o ya pasó.");

            // 2. Liberar el cupo y marcar como cancelada
            reserva.Estado = EstadoReserva.Cancelada;
            reserva.Turno.OcupacionActual = Math.Max(0, reserva.Turno.OcupacionActual - 1);

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
                reserva.Turno.OcupacionActual = Math.Max(0, reserva.Turno.OcupacionActual - 1);

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

            var reducido = await DisponibilidadHorarios.ObtenerReducidoAsync(_unitOfWork, fecha);
            var horariosBase = (await _unitOfWork.Horarios.FindAsync(h => h.DiaSemana == diaSemana)).ToList();

            IEnumerable<Horario> horariosDelDia;
            int cupoEstandar = horariosBase.Any(h => h.CupoMaximo > 0) ? horariosBase.Max(h => h.CupoMaximo) : 15;

            if (reducido != null)
            {
                horariosDelDia = horariosBase
                    .Where(h => h.HoraInicio >= reducido.NuevaHoraInicio && h.HoraInicio < reducido.NuevaHoraFin)
                    .OrderBy(h => h.HoraInicio);
            }
            else
            {
                horariosDelDia = horariosBase
                    .Where(h => h.CupoMaximo > 0)
                    .OrderBy(h => h.HoraInicio);
            }

            var turnosInstanciados = await _unitOfWork.Turnos.FindWithIncludesAsync(t => t.Fecha == fecha, "Reservas.Usuario");

            var grilla = new List<TurnoDisponibleDto>();

            foreach (var horario in horariosDelDia)
            {
                var turno = turnosInstanciados.FirstOrDefault(t => t.HorarioId == horario.Id);

                var inscriptos = turno?.Reservas
                    ?.Where(r => r.Estado == EstadoReserva.Activa)
                    ?.Select(r => new AlumnoInscriptoDto
                    {
                        UsuarioId = r.UsuarioId,
                        NombreCompleto = r.Usuario?.NombreCompleto ?? "Alumno",
                        TipoReserva = r.Tipo.ToString()
                    }).ToList() ?? new List<AlumnoInscriptoDto>();

                bool asistenciaTomada = turno?.Reservas?.Any(
                    r => r.Estado == EstadoReserva.Asistio || r.Estado == EstadoReserva.Ausente
                ) ?? false;

                grilla.Add(new TurnoDisponibleDto
                {
                    TurnoId = turno?.Id,
                    HorarioId = horario.Id,
                    DiaSemana = (int)horario.DiaSemana,
                    HoraInicio = horario.HoraInicio,
                    HoraFin = horario.HoraFin,
                    CupoMaximo = (reducido != null && horario.CupoMaximo == 0) ? cupoEstandar : horario.CupoMaximo,
                    OcupacionActual = turno?.OcupacionActual ?? 0,
                    AsistenciaTomada = asistenciaTomada,
                    Inscriptos = inscriptos
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