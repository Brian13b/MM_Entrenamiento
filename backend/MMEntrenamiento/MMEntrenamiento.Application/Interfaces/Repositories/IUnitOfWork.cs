using MMEntrenamiento.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Application.Interfaces.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Usuario> Usuarios { get; }
        IGenericRepository<CreditoMes> CreditosMes { get; }
        IGenericRepository<Membresia> Membresias { get; }
        IGenericRepository<Horario> Horarios { get; }
        IGenericRepository<Turno> Turnos { get; }
        IGenericRepository<Reserva> Reservas { get; }
        IGenericRepository<TurnoFijo> TurnosFijos { get; }
        IGenericRepository<ExcepcionTurnoFijo> ExcepcionesTurnosFijos { get; }
        IGenericRepository<Pago> Pagos { get; }
        IGenericRepository<HorarioReducido> HorariosReducidos { get; }

        Task<int> CompleteAsync();
    }
}
