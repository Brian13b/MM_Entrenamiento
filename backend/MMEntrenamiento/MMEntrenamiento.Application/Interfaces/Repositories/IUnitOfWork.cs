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

        Task<int> CompleteAsync();
    }
}
