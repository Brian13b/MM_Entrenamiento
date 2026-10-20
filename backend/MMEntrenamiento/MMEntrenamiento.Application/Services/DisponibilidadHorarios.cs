using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Application.Services
{
    // Un día con horario reducido/feriado reemplaza la grilla normal: solo siguen disponibles
    // las franjas de la plantilla que quedan completamente dentro de la nueva ventana horaria.
    public static class DisponibilidadHorarios
    {
        public static Task<HorarioReducido?> ObtenerReducidoAsync(IUnitOfWork unitOfWork, DateOnly fecha)
            => unitOfWork.HorariosReducidos.FirstOrDefaultAsync(r => r.FechaFeriado == fecha && r.Aplica);

        public static bool EstaDisponible(Horario horario, HorarioReducido? reducido)
            => reducido == null
               || (horario.HoraInicio >= reducido.NuevaHoraInicio && horario.HoraFin <= reducido.NuevaHoraFin);
    }
}
