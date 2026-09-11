using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Infrastructure.Data;

namespace MMEntrenamiento.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;

        public IGenericRepository<Usuario> Usuarios { get; private set; }
        public IGenericRepository<CreditoMes> CreditosMes { get; private set; }
        public IGenericRepository<Membresia> Membresias { get; private set; }

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
            Usuarios = new GenericRepository<Usuario>(_context);
            CreditosMes = new GenericRepository<CreditoMes>(_context);
            Membresias = new GenericRepository<Membresia>(_context);
        }

        public async Task<int> CompleteAsync() => await _context.SaveChangesAsync();

        public void Dispose() => _context.Dispose();
    }
}