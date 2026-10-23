using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Infrastructure.Data
{
    public static class DataSeeder
    {
        public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<Usuario>>();

            string[] roles = { "Admin", "Profe", "Alumno" };
            foreach (var rol in roles)
            {
                if (!await roleManager.RoleExistsAsync(rol))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid> { Name = rol, NormalizedName = rol.ToUpper() });
                }
            }

            var adminEmail = "admin@mmentrenamiento.com";
            var adminExistente = await userManager.FindByEmailAsync(adminEmail);

            if (adminExistente == null)
            {
                var nuevoAdmin = new Usuario
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    NombreCompleto = "Administrador Principal",
                    EstadoCuenta = EstadoCuenta.Activo,
                    FechaAlta = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var resultado = await userManager.CreateAsync(nuevoAdmin, "Admin123!");

                if (resultado.Succeeded)
                {
                    await userManager.AddToRoleAsync(nuevoAdmin, "Admin");
                }
                else
                {
                    foreach (var error in resultado.Errors)
                    {
                        Console.WriteLine($"Error creando admin: {error.Description}");
                    }
                }
            }
        }
    }
}