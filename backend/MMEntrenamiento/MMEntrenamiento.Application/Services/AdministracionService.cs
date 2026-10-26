using Microsoft.AspNetCore.Identity;
using MMEntrenamiento.Application.DTOs.Administracion;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;

namespace MMEntrenamiento.Application.Services
{
    public class AdministracionService : IAdministracionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMembresiaService _membresiaService;
        private readonly UserManager<Usuario> _userManager;

        public AdministracionService(IUnitOfWork unitOfWork, IMembresiaService membresiaService, UserManager<Usuario> userManager)
        {
            _unitOfWork = unitOfWork;
            _membresiaService = membresiaService;
            _userManager = userManager;
        }

        public async Task<IEnumerable<UsuarioDirectorioDto>> ObtenerUsuariosDirectorioAsync()
        {
            var directorio = await ConstruirDirectorioAsync(null);
            return directorio.OrderBy(u => u.NombreCompleto);
        }

        public async Task<UsuarioDirectorioDto?> ObtenerUsuarioDirectorioPorIdAsync(Guid id)
        {
            var directorio = await ConstruirDirectorioAsync(id);
            return directorio.FirstOrDefault();
        }

        public async Task<(bool Exito, string Mensaje)> CambiarRolUsuarioAsync(Guid usuarioId, string nuevoRol)
        {
            var rolesValidos = new[] { "Alumno", "Profe", "Admin" };
            if (!rolesValidos.Contains(nuevoRol))
                return (false, "El rol especificado no es válido.");

            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null)
                return (false, "Usuario no encontrado.");

            var rolesActuales = await _userManager.GetRolesAsync(usuario);
            if (rolesActuales.Contains(nuevoRol))
                return (true, "El usuario ya tiene este rol.");

            await _userManager.RemoveFromRolesAsync(usuario, rolesActuales);
            var result = await _userManager.AddToRoleAsync(usuario, nuevoRol);

            if (!result.Succeeded)
                return (false, "Ocurrió un error al intentar cambiar el rol del usuario.");

            return (true, $"El rol del usuario se actualizó a {nuevoRol}.");
        }

        public async Task<(bool Exito, string Mensaje)> EliminarUsuarioAsync(Guid usuarioId)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null)
                return (false, "Usuario no encontrado.");

            try
            {
                // UserManager.DeleteAsync borra al usuario y EF Core (por Cascade Delete) 
                // se encarga de borrar sus reservas, ficha, etc.
                var result = await _userManager.DeleteAsync(usuario);

                if (!result.Succeeded)
                    return (false, "No se pudo eliminar el usuario desde el gestor de identidades.");

                return (true, "Usuario eliminado permanentemente del sistema.");
            }
            catch (Exception ex)
            {
                // Por si hay algún problema de llaves foráneas sin Cascade Delete configurado
                return (false, $"Error al eliminar: {ex.InnerException?.Message ?? ex.Message}");
            }
        }

        // Arma el directorio con un número fijo de consultas (no una por usuario).
        // Deudor = alumno con membresía asignada y sin ningún pago registrado para el mes calendario actual.
        private async Task<List<UsuarioDirectorioDto>> ConstruirDirectorioAsync(Guid? soloUsuarioId)
        {
            var mesActual = DateTime.UtcNow.Month;
            var anioActual = DateTime.UtcNow.Year;

            var usuarios = (await _unitOfWork.Usuarios.FindAsync(
                u => soloUsuarioId == null || u.Id == soloUsuarioId,
                u => u.MembresiaActual!,
                u => u.OneDrivePlan!)).ToList();

            var creditosPorUsuario = (await _unitOfWork.CreditosMes.FindAsync(
                    c => c.Anio == anioActual && c.Mes == mesActual && (soloUsuarioId == null || c.UsuarioId == soloUsuarioId)))
                .ToDictionary(c => c.UsuarioId);

            var usuariosConPagoDelMes = (await _unitOfWork.Pagos.FindAsync(
                    p => p.AnioAbonado == anioActual && p.MesAbonado == mesActual && (soloUsuarioId == null || p.UsuarioId == soloUsuarioId)))
                .Select(p => p.UsuarioId)
                .ToHashSet();

            var adminIds = (await _userManager.GetUsersInRoleAsync("Admin")).Select(u => u.Id).ToHashSet();
            var profeIds = (await _userManager.GetUsersInRoleAsync("Profe")).Select(u => u.Id).ToHashSet();

            return usuarios.Select(u =>
            {
                var rol = adminIds.Contains(u.Id) ? "Admin" : profeIds.Contains(u.Id) ? "Profe" : "Alumno";

                int creditosDisponibles = 0;
                if (creditosPorUsuario.TryGetValue(u.Id, out var creditosMes))
                    creditosDisponibles = (creditosMes.CreditosBase + creditosMes.CreditosArrastrados) - creditosMes.CreditosUsados;

                return new UsuarioDirectorioDto
                {
                    Id = u.Id,
                    NombreCompleto = u.NombreCompleto ?? "Sin Nombre",
                    Email = u.Email ?? "",
                    Telefono = u.PhoneNumber,
                    Activo = u.EstadoCuenta == EstadoCuenta.Activo,
                    CreditosDisponibles = creditosDisponibles,
                    DriveItemId = u.OneDrivePlan?.DriveItemId,
                    Rol = rol,
                    MembresiaId = u.MembresiaActual?.Id,
                    Deudor = rol == "Alumno" && u.MembresiaActual != null && !usuariosConPagoDelMes.Contains(u.Id)
                };
            }).ToList();
        }

        public async Task<(bool Exito, string Mensaje)> CrearMembresiaAsync(CrearMembresiaDto request)
        {
            var membresia = new Membresia
            {
                Nombre = request.Nombre,
                CreditosOtorgados = request.CreditosOtorgados,
                LimiteTurnosFijos = request.LimiteTurnosFijos,
                Precio = request.Precio,
                Activa = true
            };

            await _unitOfWork.Membresias.AddAsync(membresia);
            await _unitOfWork.CompleteAsync();

            return (true, "Membresía creada exitosamente.");
        }

        public async Task<IEnumerable<MembresiaDto>> ObtenerMembresiasActivasAsync()
        {
            var membresias = await _unitOfWork.Membresias.FindAsync(m => m.Activa);

            return membresias.Select(m => new MembresiaDto
            {
                Id = m.Id,
                Nombre = m.Nombre,
                CreditosOtorgados = m.CreditosOtorgados,
                LimiteTurnosFijos = m.LimiteTurnosFijos,
                Precio = m.Precio,
                Activa = m.Activa
            });
        }

        public async Task<(bool Exito, string Mensaje)> ActualizarMembresiaAsync(int id, CrearMembresiaDto request)
        {
            var membresia = await _unitOfWork.Membresias.GetByIdAsync(id);
            if (membresia == null) return (false, "La membresía no existe.");

            membresia.Nombre = request.Nombre;
            membresia.CreditosOtorgados = request.CreditosOtorgados;
            membresia.LimiteTurnosFijos = request.LimiteTurnosFijos;
            membresia.Precio = request.Precio;

            _unitOfWork.Membresias.Update(membresia);
            await _unitOfWork.CompleteAsync();

            return (true, "Membresía actualizada exitosamente.");
        }

        public async Task<(bool Exito, string Mensaje)> EliminarMembresiaAsync(int id)
        {
            var membresia = await _unitOfWork.Membresias.GetByIdAsync(id);
            if (membresia == null) return (false, "La membresía no existe.");

            membresia.Activa = false;

            _unitOfWork.Membresias.Update(membresia);
            await _unitOfWork.CompleteAsync();

            return (true, "Membresía eliminada correctamente.");
        }

        public async Task<(bool Exito, string Mensaje)> RegistrarPagoManualAsync(RegistrarPagoDto request)
        {
            var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId);
            if (usuario == null) return (false, "Usuario no encontrado.");

            var pago = new Pago
            {
                UsuarioId = request.UsuarioId,
                Monto = request.MontoAbonado,
                MesAbonado = request.Mes,
                AnioAbonado = request.Anio,
                MetodoPago = request.MetodoPago,
                FechaPago = DateTime.UtcNow
            };

            await _unitOfWork.Pagos.AddAsync(pago);
            await _unitOfWork.CompleteAsync();

            return (true, $"Pago de ${request.MontoAbonado} registrado contablemente.");
        }

        public async Task<MetricasDto> ObtenerMetricasAsync()
        {
            var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

            // Alumnos activos y pagos pendientes salen del mismo directorio (misma regla de "Deudor").
            var directorio = await ConstruirDirectorioAsync(null);
            var alumnosActivos = directorio.Count(u => u.Rol == "Alumno" && u.Activo);
            var pagosPendientes = directorio.Count(u => u.Deudor);

            // Semana en curso (lunes a domingo): cada franja de la plantilla cuenta una vez por día,
            // con ocupación 0 si todavía no existe el turno de esa fecha. Los días con horario reducido
            // solo cuentan las franjas que siguen disponibles.
            var lunes = hoy.AddDays(-(((int)hoy.DayOfWeek + 6) % 7));
            var domingo = lunes.AddDays(6);

            var horarios = (await _unitOfWork.Horarios.GetAllAsync()).Where(h => h.CupoMaximo > 0).ToList();
            var turnosSemana = (await _unitOfWork.Turnos.FindAsync(t => t.Fecha >= lunes && t.Fecha <= domingo)).ToList();
            var reducidosSemana = (await _unitOfWork.HorariosReducidos.FindAsync(
                r => r.Aplica && r.FechaFeriado >= lunes && r.FechaFeriado <= domingo)).ToList();

            var franjas = new List<(DateOnly Fecha, int Ocupacion, int Cupo)>();
            for (var fecha = lunes; fecha <= domingo; fecha = fecha.AddDays(1))
            {
                var reducido = reducidosSemana.FirstOrDefault(r => r.FechaFeriado == fecha);

                foreach (var horario in horarios.Where(h => h.DiaSemana == fecha.DayOfWeek && DisponibilidadHorarios.EstaDisponible(h, reducido)))
                {
                    var turno = turnosSemana.FirstOrDefault(t => t.HorarioId == horario.Id && t.Fecha == fecha);
                    franjas.Add((fecha, Math.Min(turno?.OcupacionActual ?? 0, horario.CupoMaximo), horario.CupoMaximo));
                }
            }

            var ocupacionSemanal = franjas.Count == 0
                ? 0
                : (int)Math.Round(franjas.Average(f => (double)f.Ocupacion / f.Cupo) * 100);

            // Por día: porcentaje de los cupos totales de ese día que se ocuparon.
            var porDia = franjas
                .GroupBy(f => f.Fecha)
                .OrderBy(g => g.Key)
                .Select(g => new OcupacionDiaDto
                {
                    Fecha = g.Key,
                    DiaSemana = g.Key.DayOfWeek,
                    Porcentaje = (int)Math.Round(g.Sum(f => f.Ocupacion) * 100.0 / g.Sum(f => f.Cupo))
                })
                .ToList();

            return new MetricasDto
            {
                OcupacionSemanal = ocupacionSemanal,
                AlumnosActivos = alumnosActivos,
                PagosPendientes = pagosPendientes,
                OcupacionPorDia = porDia
            };
        }

        public async Task<ConfiguracionGimnasioDto> ObtenerConfiguracionGimnasioAsync()
        {
            var config = await _unitOfWork.ConfiguracionesGimnasio.FirstOrDefaultAsync(c => c.Id == 1);

            // Mientras no se haya guardado nada, se devuelve la configuración por defecto.
            if (config == null)
                return new ConfiguracionGimnasioDto { Nombre = "MM Entrenamiento" };

            return new ConfiguracionGimnasioDto
            {
                Nombre = config.Nombre,
                Telefono = config.Telefono,
                Direccion = config.Direccion,
                Instagram = config.Instagram
            };
        }

        public async Task<(bool Exito, string Mensaje)> ActualizarConfiguracionGimnasioAsync(ConfiguracionGimnasioDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return (false, "El nombre del gimnasio es obligatorio.");

            var config = await _unitOfWork.ConfiguracionesGimnasio.FirstOrDefaultAsync(c => c.Id == 1);
            var nuevo = config == null;
            config ??= new ConfiguracionGimnasio { Id = 1 };

            config.Nombre = request.Nombre.Trim();
            config.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();
            config.Direccion = string.IsNullOrWhiteSpace(request.Direccion) ? null : request.Direccion.Trim();
            config.Instagram = string.IsNullOrWhiteSpace(request.Instagram) ? null : request.Instagram.Trim();
            config.UltimaModificacion = DateTime.UtcNow;

            if (nuevo) await _unitOfWork.ConfiguracionesGimnasio.AddAsync(config);
            else _unitOfWork.ConfiguracionesGimnasio.Update(config);

            await _unitOfWork.CompleteAsync();
            return (true, "Datos del gimnasio actualizados correctamente.");
        }

        public async Task<IEnumerable<PagoDto>> ObtenerPagosUsuarioAsync(Guid usuarioId)
        {
            var pagos = await _unitOfWork.Pagos.FindAsync(p => p.UsuarioId == usuarioId);

            return pagos
                .OrderByDescending(p => p.FechaPago)
                .Select(p => new PagoDto
                {
                    Id = p.Id,
                    Monto = p.Monto,
                    MesAbonado = p.MesAbonado,
                    AnioAbonado = p.AnioAbonado,
                    MetodoPago = p.MetodoPago,
                    FechaPago = p.FechaPago
                });
        }

        public async Task<(bool Exito, string Mensaje)> CambiarEstadoBloqueoAsync(Guid usuarioId, bool suspender)
        {
            var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId);
            if (usuario == null) return (false, "Usuario no encontrado.");

            usuario.EstadoCuenta = suspender ? EstadoCuenta.Bloqueado : EstadoCuenta.Activo;

            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.CompleteAsync();

            var estado = suspender ? "suspendido" : "reactivado";
            return (true, $"La cuenta del alumno ha sido {estado} correctamente.");
        }

        public async Task<AnuncioDto?> ObtenerAnuncioGlobalAsync()
        {
            var anuncio = await _unitOfWork.AnunciosGlobales.FirstOrDefaultAsync(a => a.Id == 1);

            if (anuncio == null || string.IsNullOrWhiteSpace(anuncio.Mensaje))
                return null;

            return new AnuncioDto
            {
                Mensaje = anuncio.Mensaje,
                UltimaModificacion = anuncio.UltimaModificacion
            };
        }

        public async Task<(bool Exito, string Mensaje)> ActualizarAnuncioGlobalAsync(ActualizarAnuncioDto request)
        {
            var anuncio = await _unitOfWork.AnunciosGlobales.FirstOrDefaultAsync(a => a.Id == 1);

            if (anuncio == null)
            {
                anuncio = new AnuncioGlobal
                {
                    Mensaje = request.Mensaje,
                    UltimaModificacion = DateTime.UtcNow
                };
                await _unitOfWork.AnunciosGlobales.AddAsync(anuncio);
            }
            else
            {
                anuncio.Mensaje = request.Mensaje;
                anuncio.UltimaModificacion = DateTime.UtcNow;
                _unitOfWork.AnunciosGlobales.Update(anuncio);
            }

            await _unitOfWork.CompleteAsync();
            return (true, "Anuncio global actualizado correctamente.");
        }
    }
}