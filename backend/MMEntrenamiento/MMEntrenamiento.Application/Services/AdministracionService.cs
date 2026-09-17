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

        public AdministracionService(IUnitOfWork unitOfWork, IMembresiaService membresiaService)
        {
            _unitOfWork = unitOfWork;
            _membresiaService = membresiaService;
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