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
        public IGenericRepository<Horario> Horarios { get; private set; }
        public IGenericRepository<Turno> Turnos { get; private set; }
        public IGenericRepository<Reserva> Reservas { get; private set; }
        public IGenericRepository<TurnoFijo> TurnosFijos { get; private set; }
        public IGenericRepository<ExcepcionTurnoFijo> ExcepcionesTurnosFijos { get; private set; }
        public IGenericRepository<Pago> Pagos { get; private set; }
        public IGenericRepository<HorarioReducido> HorariosReducidos { get; private set; }
        public IGenericRepository<AnuncioGlobal> AnunciosGlobales { get; private set; }

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
            Usuarios = new GenericRepository<Usuario>(_context);
            CreditosMes = new GenericRepository<CreditoMes>(_context);
            Membresias = new GenericRepository<Membresia>(_context);
            Horarios = new GenericRepository<Horario>(_context);
            Turnos = new GenericRepository<Turno>(_context);
            Reservas = new GenericRepository<Reserva>(_context);
            Pagos = new GenericRepository<Pago>(_context);
            TurnosFijos = new GenericRepository<TurnoFijo>(_context);
            ExcepcionesTurnosFijos = new GenericRepository<ExcepcionTurnoFijo>(_context);
            HorariosReducidos = new GenericRepository<HorarioReducido>(_context);
            AnunciosGlobales = new GenericRepository<AnuncioGlobal>(_context);
        }

        public async Task<int> CompleteAsync() => await _context.SaveChangesAsync();

        public void Dispose() => _context.Dispose();
    }
}