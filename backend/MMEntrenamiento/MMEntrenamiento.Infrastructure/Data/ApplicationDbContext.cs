using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<Usuario, IdentityRole<Guid>, Guid>
    {
        public const string IndiceReservaUnicaPorDia = "IX_Reservas_UsuarioId_Fecha";

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
        public DbSet<AnuncioGlobal> AnunciosGlobales => Set<AnuncioGlobal>();
        public DbSet<ConfiguracionGimnasio> ConfiguracionesGimnasio => Set<ConfiguracionGimnasio>();
        public DbSet<SuscripcionPush> SuscripcionesPush => Set<SuscripcionPush>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<RefreshToken>(e =>
            {
                e.HasIndex(r => r.TokenHash).IsUnique();
                e.HasIndex(r => r.FamiliaId);
                e.HasOne(r => r.Usuario)
                    .WithMany()
                    .HasForeignKey(r => r.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Una sola instancia de Turno por horario y fecha (evita turnos duplicados por requests concurrentes).
            builder.Entity<Turno>()
                .HasIndex(t => new { t.HorarioId, t.Fecha })
                .IsUnique();

            // Un alumno no puede tener mas de una reserva vigente (Activa/Asistio) por dia.
            // Cancelada y Ausente quedan fuera del indice y permiten volver a anotarse.
            builder.Entity<Reserva>()
                .HasIndex(r => new { r.UsuarioId, r.Fecha })
                .IsUnique()
                .HasDatabaseName(IndiceReservaUnicaPorDia)
                .HasFilter("\"Estado\" IN ('Activa', 'Asistio')");

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