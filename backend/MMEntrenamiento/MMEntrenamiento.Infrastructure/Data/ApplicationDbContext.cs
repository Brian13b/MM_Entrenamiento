using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<Usuario, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Horario> Horarios => Set<Horario>();
        public DbSet<Turno> Turnos => Set<Turno>();
        public DbSet<TurnoFijo> TurnosFijos => Set<TurnoFijo>();
        public DbSet<Reserva> Reservas => Set<Reserva>();
        public DbSet<CreditoMes> CreditosMensuales => Set<CreditoMes>();
        public DbSet<Pago> Pagos => Set<Pago>();
        public DbSet<Membresia> Membresias => Set<Membresia>();
        public DbSet<FichaTecnica> FichasTecnicas => Set<FichaTecnica>();
        public DbSet<ExcepcionTurnoFijo> ExcepcionesTurnoFijo => Set<ExcepcionTurnoFijo>();
        public DbSet<OneDrivePlan> OneDrivePlanes => Set<OneDrivePlan>();
        public DbSet<HorarioReducido> HorariosReducidos => Set<HorarioReducido>();
        public DbSet<AlertaActividad> AlertasActividad => Set<AlertaActividad>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Usuario>()
                .HasOne(u => u.FichaTecnica)
                .WithOne(f => f.Usuario)
                .HasForeignKey<FichaTecnica>(f => f.UsuarioId);

            builder.Entity<Usuario>()
                .HasOne(u => u.OneDrivePlan)
                .WithOne(o => o.Usuario)
                .HasForeignKey<OneDrivePlan>(o => o.UsuarioId);

            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType.IsEnum)
                    {
                        property.SetColumnType("varchar");
                    }
                }
            }
        }
    }
}