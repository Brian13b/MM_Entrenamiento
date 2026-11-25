using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using MMEntrenamiento.Application.Exceptions;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Tests.Services
{
    public class ReservaServiceTurnosFijosTests
    {
        private readonly Mock<IUnitOfWork> _uow = new();
        private readonly Mock<IMembresiaService> _membresia = new();
        private readonly Mock<ILogger<ReservaService>> _logger = new();

        private readonly Mock<IGenericRepository<HorarioReducido>> _reducidos = new();
        private readonly Mock<IGenericRepository<TurnoFijo>> _turnosFijos = new();
        private readonly Mock<IGenericRepository<Reserva>> _reservas = new();
        private readonly Mock<IGenericRepository<ExcepcionTurnoFijo>> _excepciones = new();
        private readonly Mock<IGenericRepository<CreditoMes>> _creditos = new();
        private readonly Mock<IGenericRepository<Turno>> _turnos = new();

        private readonly DateOnly _fecha = new(2030, 1, 7); // lunes, sin feriado
        private readonly Horario _horario = new() { Id = 1, DiaSemana = DayOfWeek.Monday, CupoMaximo = 8, HoraInicio = new TimeOnly(18, 0) };

        public ReservaServiceTurnosFijosTests()
        {
            _reducidos.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<HorarioReducido, bool>>>(), It.IsAny<Expression<Func<HorarioReducido, object>>[]>()))
                .ReturnsAsync((HorarioReducido?)null);
            _reservas.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Reserva, bool>>>())).ReturnsAsync(false);
            _excepciones.Setup(e => e.AnyAsync(It.IsAny<Expression<Func<ExcepcionTurnoFijo, bool>>>())).ReturnsAsync(false);
            _reservas.Setup(r => r.AddAsync(It.IsAny<Reserva>())).Returns(Task.CompletedTask);
            _turnos.Setup(t => t.AddAsync(It.IsAny<Turno>())).Returns(Task.CompletedTask);
            _membresia.Setup(m => m.RenovarCreditosMesAsync(It.IsAny<Guid>(), It.IsAny<int?>(), It.IsAny<int?>()))
                .ReturnsAsync((true, "Ok"));

            // Cada consulta devuelve una instancia "fresca", como haría la base tras limpiar el ChangeTracker.
            _creditos.Setup(c => c.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>(), It.IsAny<Expression<Func<CreditoMes, object>>[]>()))
                .ReturnsAsync(() => new CreditoMes { CreditosBase = 8, CreditosUsados = 0 });
            _turnos.Setup(t => t.FirstOrDefaultAsync(It.IsAny<Expression<Func<Turno, bool>>>(), It.IsAny<Expression<Func<Turno, object>>[]>()))
                .ReturnsAsync(() => new Turno { HorarioId = 1, Fecha = _fecha, OcupacionActual = 0, Reservas = new List<Reserva>() });

            _uow.Setup(u => u.HorariosReducidos).Returns(_reducidos.Object);
            _uow.Setup(u => u.TurnosFijos).Returns(_turnosFijos.Object);
            _uow.Setup(u => u.Reservas).Returns(_reservas.Object);
            _uow.Setup(u => u.ExcepcionesTurnosFijos).Returns(_excepciones.Object);
            _uow.Setup(u => u.CreditosMes).Returns(_creditos.Object);
            _uow.Setup(u => u.Turnos).Returns(_turnos.Object);
            _uow.Setup(u => u.CompleteAsync()).ReturnsAsync(1);
        }

        private ReservaService CrearServicio() => new(_uow.Object, _membresia.Object, _logger.Object);

        private void ConTurnosFijos(params TurnoFijo[] fijos) =>
            _turnosFijos.Setup(t => t.FindAsync(It.IsAny<Expression<Func<TurnoFijo, bool>>>(), It.IsAny<Expression<Func<TurnoFijo, object>>[]>()))
                .ReturnsAsync(fijos);

        private TurnoFijo Fijo(int id, EstadoCuenta estado = EstadoCuenta.Activo)
        {
            var usuarioId = Guid.NewGuid();
            return new TurnoFijo
            {
                Id = id,
                UsuarioId = usuarioId,
                HorarioId = 1,
                Horario = _horario,
                Activo = true,
                Usuario = new Usuario { Id = usuarioId, EstadoCuenta = estado }
            };
        }

        private void VerificarAdvertencia(string fragmento, Times veces) =>
            _logger.Verify(l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains(fragmento)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), veces);

        [Fact]
        public async Task ExtenderParaFecha_UnConflictoDeUnAlumno_NoImpideGuardarALosDemas()
        {
            ConTurnosFijos(Fijo(1), Fijo(2), Fijo(3));

            // El guardado del primer alumno choca con el índice único; los otros dos funcionan.
            _uow.SetupSequence(u => u.CompleteAsync())
                .ThrowsAsync(new ConflictoReservaException(new Exception("unique")))
                .ReturnsAsync(1)
                .ReturnsAsync(1);

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _uow.Verify(u => u.LimpiarCambiosPendientes(), Times.Once);
            _uow.Verify(u => u.CompleteAsync(), Times.Exactly(3));
            _reservas.Verify(r => r.AddAsync(It.Is<Reserva>(x => x.Tipo == TipoReserva.Fija && x.Estado == EstadoReserva.Activa)), Times.Exactly(3));
            VerificarAdvertencia("conflicto de reserva", Times.Once());
        }

        [Fact]
        public async Task ExtenderParaFecha_ErrorGenericoDeBd_SeAisla_YSeLimpiaElTracker()
        {
            ConTurnosFijos(Fijo(1), Fijo(2));

            _uow.SetupSequence(u => u.CompleteAsync())
                .ThrowsAsync(new InvalidOperationException("boom"))
                .ReturnsAsync(1);

            var accion = async () => await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            await accion.Should().NotThrowAsync();
            _uow.Verify(u => u.LimpiarCambiosPendientes(), Times.Once);
            _uow.Verify(u => u.CompleteAsync(), Times.Exactly(2));
            _logger.Verify(l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("error al guardar")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
        }

        [Fact]
        public async Task ExtenderParaFecha_SinCreditos_OmiteYLoguea()
        {
            ConTurnosFijos(Fijo(1));
            _creditos.Setup(c => c.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>(), It.IsAny<Expression<Func<CreditoMes, object>>[]>()))
                .ReturnsAsync(new CreditoMes { CreditosBase = 4, CreditosUsados = 4 });

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
            _uow.Verify(u => u.CompleteAsync(), Times.Never);
            VerificarAdvertencia("sin créditos", Times.Once());
        }

        [Fact]
        public async Task ExtenderParaFecha_SinMembresia_OmiteYLoguea()
        {
            ConTurnosFijos(Fijo(1));
            _membresia.Setup(m => m.RenovarCreditosMesAsync(It.IsAny<Guid>(), It.IsAny<int?>(), It.IsAny<int?>()))
                .ReturnsAsync((false, "El usuario no tiene una membresía activa"));
            _creditos.Setup(c => c.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>(), It.IsAny<Expression<Func<CreditoMes, object>>[]>()))
                .ReturnsAsync((CreditoMes?)null);

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
            VerificarAdvertencia("sin membresía", Times.Once());
        }

        [Fact]
        public async Task ExtenderParaFecha_TurnoLleno_OmiteYLoguea()
        {
            ConTurnosFijos(Fijo(1));
            _turnos.Setup(t => t.FirstOrDefaultAsync(It.IsAny<Expression<Func<Turno, bool>>>(), It.IsAny<Expression<Func<Turno, object>>[]>()))
                .ReturnsAsync(() => new Turno { HorarioId = 1, Fecha = _fecha, OcupacionActual = 8, Reservas = new List<Reserva>() });

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
            _uow.Verify(u => u.CompleteAsync(), Times.Never);
            VerificarAdvertencia("turno lleno", Times.Once());
        }

        [Fact]
        public async Task ExtenderParaFecha_ClaseYaMarcadaAusente_NoSeRegenera()
        {
            ConTurnosFijos(Fijo(1));

            // 1ª consulta (reserva vigente) = false; 2ª consulta (ausente) = true
            _reservas.SetupSequence(r => r.AnyAsync(It.IsAny<Expression<Func<Reserva, bool>>>()))
                .ReturnsAsync(false)
                .ReturnsAsync(true);

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
            _uow.Verify(u => u.CompleteAsync(), Times.Never);
        }

        [Fact]
        public async Task ExtenderParaFecha_ReservaCanceladaPorBajaSinExcepcion_SiSeGenera()
        {
            // Caso "se cambió el fijo y se volvió atrás": la baja dejó reservas Canceladas SIN excepción.
            // No hay reserva vigente, ni Ausente, ni excepción => el barrido debe volver a generarla.
            ConTurnosFijos(Fijo(1));

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.Is<Reserva>(x => x.Tipo == TipoReserva.Fija)), Times.Once);
            _uow.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Theory]
        [InlineData(EstadoCuenta.Bloqueado)]
        [InlineData(EstadoCuenta.Inactivo)]
        public async Task ExtenderParaFecha_CuentaNoActiva_NoGeneraNiTocaCreditos(EstadoCuenta estado)
        {
            ConTurnosFijos(Fijo(1, estado));

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
            _uow.Verify(u => u.CompleteAsync(), Times.Never);
            _membresia.Verify(m => m.RenovarCreditosMesAsync(It.IsAny<Guid>(), It.IsAny<int?>(), It.IsAny<int?>()), Times.Never);
        }

        [Fact]
        public async Task ExtenderParaFecha_CuentaBloqueada_NoImpideGenerarALosActivos()
        {
            ConTurnosFijos(Fijo(1, EstadoCuenta.Bloqueado), Fijo(2), Fijo(3));

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Exactly(2));
        }

        [Fact]
        public async Task ExtenderParaFecha_CuentaReactivada_VuelveAGenerar()
        {
            var fijo = Fijo(1, EstadoCuenta.Bloqueado);
            ConTurnosFijos(fijo);
            var servicio = CrearServicio();

            await servicio.ExtenderTurnosFijosParaFechaAsync(_fecha);
            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);

            fijo.Usuario.EstadoCuenta = EstadoCuenta.Activo; // el admin reactiva
            await servicio.ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Once);
        }

        [Fact]
        public async Task ExtenderParaFecha_ClaseDeHoyQueYaComenzo_NoSeGenera()
        {
            var hoy = FechaArgentina.Hoy();
            var horarioHoy = new Horario { Id = 1, DiaSemana = hoy.DayOfWeek, CupoMaximo = 8, HoraInicio = TimeOnly.MinValue };
            var fijo = Fijo(1);
            fijo.Horario = horarioHoy;
            ConTurnosFijos(fijo);

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(hoy);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
            _membresia.Verify(m => m.RenovarCreditosMesAsync(It.IsAny<Guid>(), It.IsAny<int?>(), It.IsAny<int?>()), Times.Never);
        }

        [Fact]
        public async Task VentanaCompleta_LoguaResumenConCreadasYOmitidasPorMotivo()
        {
            ConTurnosFijos(Fijo(1), Fijo(2, EstadoCuenta.Bloqueado));

            await CrearServicio().ExtenderTurnosFijosVentanaCompletaAsync();

            _logger.Verify(l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("Barrido de turnos fijos finalizado") && v.ToString()!.Contains("cuenta no activa=")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
        }

        [Fact]
        public async Task ExtenderParaFecha_AlumnoConExcepcion_NoSeRegenera()
        {
            ConTurnosFijos(Fijo(1));
            _excepciones.Setup(e => e.AnyAsync(It.IsAny<Expression<Func<ExcepcionTurnoFijo, bool>>>())).ReturnsAsync(true);

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
        }

        [Fact]
        public async Task VentanaCompleta_RevisaLos29Dias_YUnDiaQueFallaNoCortaElBarrido()
        {
            // El primer día lanza al consultar feriados; los otros 28 deben procesarse igual.
            var llamadas = 0;
            _reducidos.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<HorarioReducido, bool>>>(), It.IsAny<Expression<Func<HorarioReducido, object>>[]>()))
                .Returns(() => ++llamadas == 1
                    ? Task.FromException<HorarioReducido?>(new InvalidOperationException("fallo de BD"))
                    : Task.FromResult<HorarioReducido?>(null));

            await CrearServicio().ExtenderTurnosFijosVentanaCompletaAsync();

            _reducidos.Verify(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<HorarioReducido, bool>>>(), It.IsAny<Expression<Func<HorarioReducido, object>>[]>()), Times.Exactly(29));
            _uow.Verify(u => u.LimpiarCambiosPendientes(), Times.Once);
        }

        [Fact]
        public async Task BarridoDiario_RevisaToda_LaVentana_NoSoloElDia28()
        {
            await CrearServicio().ExtenderTurnosFijosDiarioAsync();

            _reducidos.Verify(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<HorarioReducido, bool>>>(), It.IsAny<Expression<Func<HorarioReducido, object>>[]>()), Times.Exactly(29));
        }

        [Fact]
        public async Task FeriadoEnLaFecha_NoGeneraTurnosFijos()
        {
            ConTurnosFijos(Fijo(1));
            _reducidos.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<HorarioReducido, bool>>>(), It.IsAny<Expression<Func<HorarioReducido, object>>[]>()))
                .ReturnsAsync(new HorarioReducido { FechaFeriado = _fecha, Aplica = true });

            await CrearServicio().ExtenderTurnosFijosParaFechaAsync(_fecha);

            _reservas.Verify(r => r.AddAsync(It.IsAny<Reserva>()), Times.Never);
        }

        // ---------- AsignarTurnoFijoAsync: alineación de FechaInicio ----------

        private (List<Reserva> Reservas, ReservaService Servicio) PrepararAsignacion(Horario horario)
        {
            var reservasCreadas = new List<Reserva>();
            var credito = new CreditoMes { CreditosBase = 40, CreditosUsados = 0 };
            var usuario = new Usuario
            {
                EstadoCuenta = EstadoCuenta.Activo,
                MembresiaActual = new Membresia { LimiteTurnosFijos = 3 }
            };

            var horarios = new Mock<IGenericRepository<Horario>>();
            horarios.Setup(h => h.GetByIdAsync(It.IsAny<object>())).ReturnsAsync(horario);
            var usuarios = new Mock<IGenericRepository<Usuario>>();
            usuarios.Setup(u => u.FirstOrDefaultAsync(It.IsAny<Expression<Func<Usuario, bool>>>(), It.IsAny<Expression<Func<Usuario, object>>[]>()))
                .ReturnsAsync(usuario);

            _uow.Setup(u => u.Horarios).Returns(horarios.Object);
            _uow.Setup(u => u.Usuarios).Returns(usuarios.Object);
            _turnosFijos.Setup(t => t.CountAsync(It.IsAny<Expression<Func<TurnoFijo, bool>>>())).ReturnsAsync(0);
            _turnosFijos.Setup(t => t.AddAsync(It.IsAny<TurnoFijo>())).Returns(Task.CompletedTask);
            _creditos.Setup(c => c.FirstOrDefaultAsync(It.IsAny<Expression<Func<CreditoMes, bool>>>(), It.IsAny<Expression<Func<CreditoMes, object>>[]>()))
                .ReturnsAsync(credito);
            _turnos.Setup(t => t.FirstOrDefaultAsync(It.IsAny<Expression<Func<Turno, bool>>>(), It.IsAny<Expression<Func<Turno, object>>[]>()))
                .ReturnsAsync((Turno?)null);
            _reservas.Setup(r => r.AddAsync(It.IsAny<Reserva>()))
                .Callback<Reserva>(reservasCreadas.Add)
                .Returns(Task.CompletedTask);

            return (reservasCreadas, CrearServicio());
        }

        private static DateOnly ProximoDia(DateOnly desde, DayOfWeek dia)
        {
            var f = desde;
            while (f.DayOfWeek != dia) f = f.AddDays(1);
            return f;
        }

        [Fact]
        public async Task AsignarFijo_FechaDeOtroDia_SeAlineaHaciaAdelanteAlDiaDelHorario()
        {
            var horarioLunes = new Horario { Id = 1, DiaSemana = DayOfWeek.Monday, CupoMaximo = 8, HoraInicio = new TimeOnly(18, 0) };
            var (reservas, servicio) = PrepararAsignacion(horarioLunes);

            var martes = ProximoDia(FechaArgentina.Hoy().AddDays(2), DayOfWeek.Tuesday);
            var lunesEsperado = ProximoDia(martes, DayOfWeek.Monday);

            var resultado = await servicio.AsignarTurnoFijoAsync(new MMEntrenamiento.Application.DTOs.Reservas.AsignarTurnoFijoDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                FechaInicio = martes
            });

            resultado.Exito.Should().BeTrue(resultado.Mensaje);
            resultado.Mensaje.Should().Contain("se ajustó");
            reservas.Should().HaveCount(4);
            reservas.Select(r => r.Fecha).Should().OnlyContain(f => f.DayOfWeek == DayOfWeek.Monday);
            reservas[0].Fecha.Should().Be(lunesEsperado);
            reservas[3].Fecha.Should().Be(lunesEsperado.AddDays(21));
        }

        [Fact]
        public async Task AsignarFijo_FechaYaCoincide_NoSeAjustaNiSeAvisa()
        {
            var horarioLunes = new Horario { Id = 1, DiaSemana = DayOfWeek.Monday, CupoMaximo = 8, HoraInicio = new TimeOnly(18, 0) };
            var (reservas, servicio) = PrepararAsignacion(horarioLunes);

            var lunes = ProximoDia(FechaArgentina.Hoy().AddDays(2), DayOfWeek.Monday);

            var resultado = await servicio.AsignarTurnoFijoAsync(new MMEntrenamiento.Application.DTOs.Reservas.AsignarTurnoFijoDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                FechaInicio = lunes
            });

            resultado.Exito.Should().BeTrue(resultado.Mensaje);
            resultado.Mensaje.Should().NotContain("se ajustó");
            reservas[0].Fecha.Should().Be(lunes);
        }

        [Fact]
        public async Task AsignarFijo_HoyConClaseYaComenzada_ArrancaLaSemanaQueViene()
        {
            var hoy = FechaArgentina.Hoy();
            var horarioDeHoy = new Horario { Id = 1, DiaSemana = hoy.DayOfWeek, CupoMaximo = 8, HoraInicio = TimeOnly.MinValue };
            var (reservas, servicio) = PrepararAsignacion(horarioDeHoy);

            var resultado = await servicio.AsignarTurnoFijoAsync(new MMEntrenamiento.Application.DTOs.Reservas.AsignarTurnoFijoDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                FechaInicio = hoy
            });

            resultado.Exito.Should().BeTrue(resultado.Mensaje);
            reservas[0].Fecha.Should().Be(hoy.AddDays(7));
        }

        [Fact]
        public async Task AsignarFijo_FechaPasada_SeRechaza()
        {
            var horarioLunes = new Horario { Id = 1, DiaSemana = DayOfWeek.Monday, CupoMaximo = 8, HoraInicio = new TimeOnly(18, 0) };
            var (reservas, servicio) = PrepararAsignacion(horarioLunes);

            var resultado = await servicio.AsignarTurnoFijoAsync(new MMEntrenamiento.Application.DTOs.Reservas.AsignarTurnoFijoDto
            {
                UsuarioId = Guid.NewGuid(),
                HorarioId = 1,
                FechaInicio = FechaArgentina.Hoy().AddDays(-1)
            });

            resultado.Exito.Should().BeFalse();
            reservas.Should().BeEmpty();
        }

        // ---------- Programación nocturna del barrido ----------

        [Theory]
        [InlineData("2030-01-07 00:30", "2030-01-07 01:00")]
        [InlineData("2030-01-07 01:00", "2030-01-07 04:00")]
        [InlineData("2030-01-07 02:15", "2030-01-07 04:00")]
        [InlineData("2030-01-07 04:00", "2030-01-08 01:00")]
        [InlineData("2030-01-07 15:00", "2030-01-08 01:00")]
        [InlineData("2030-01-07 23:59", "2030-01-08 01:00")]
        public void ProximaEjecucion_SoloDeMadrugada(string ahora, string esperada)
        {
            var proxima = ProgramacionBarridoFijos.ProximaEjecucion(DateTime.Parse(ahora, System.Globalization.CultureInfo.InvariantCulture));

            proxima.Should().Be(DateTime.Parse(esperada, System.Globalization.CultureInfo.InvariantCulture));
            proxima.TimeOfDay.Should().BeLessThan(TimeSpan.FromHours(7));
        }

        [Fact]
        public void FechaArgentina_EsUtcMenosTresHoras()
        {
            var esperado = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-3));
            var hoy = FechaArgentina.Hoy();

            // Tolerancia por si el reloj cruza la medianoche entre las dos lecturas.
            hoy.Should().BeOneOf(esperado, esperado.AddDays(1));
            (FechaArgentina.Ahora() - DateTime.UtcNow).TotalHours.Should().BeApproximately(-3, 0.01);
        }
    }
}
