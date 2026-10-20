using System;
using FluentAssertions;
using Xunit;
using MMEntrenamiento.Application.Services;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Tests.Services
{
    public class DisponibilidadHorariosTests
    {
        private static Horario Franja(int inicio, int fin) => new()
        {
            HoraInicio = new TimeOnly(inicio, 0),
            HoraFin = new TimeOnly(fin, 0),
            CupoMaximo = 10
        };

        private static HorarioReducido Reducido(int inicio, int fin) => new()
        {
            NuevaHoraInicio = new TimeOnly(inicio, 0),
            NuevaHoraFin = new TimeOnly(fin, 0),
            Aplica = true
        };

        [Fact]
        public void SinHorarioReducido_TodasLasFranjasEstanDisponibles()
        {
            DisponibilidadHorarios.EstaDisponible(Franja(8, 9), null).Should().BeTrue();
        }

        [Fact]
        public void ConHorarioReducido_SoloQuedanLasFranjasDentroDeLaVentana()
        {
            var reducido = Reducido(9, 13);

            DisponibilidadHorarios.EstaDisponible(Franja(9, 10), reducido).Should().BeTrue();
            DisponibilidadHorarios.EstaDisponible(Franja(12, 13), reducido).Should().BeTrue();
            DisponibilidadHorarios.EstaDisponible(Franja(8, 9), reducido).Should().BeFalse();
            DisponibilidadHorarios.EstaDisponible(Franja(18, 19), reducido).Should().BeFalse();
        }
    }
}
