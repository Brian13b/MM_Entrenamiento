using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Application.Services
{
    public static class DisponibilidadHorarios
    {
        public static Task<HorarioReducido?> ObtenerReducidoAsync(IUnitOfWork unitOfWork, DateOnly fecha)
            => unitOfWork.HorariosReducidos.FirstOrDefaultAsync(r => r.FechaFeriado == fecha && r.Aplica);

        public static bool EstaDisponible(Horario horario, HorarioReducido? reducido)
            => reducido == null
               || (horario.HoraInicio >= reducido.NuevaHoraInicio && horario.HoraFin <= reducido.NuevaHoraFin);
    }
}
