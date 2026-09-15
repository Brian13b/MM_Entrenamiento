using MMEntrenamiento.Application.DTOs.Membresias;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;

namespace MMEntrenamiento.Application.Services
{
    public class MembresiaService : IMembresiaService
    {
        private readonly IUnitOfWork _unitOfWork;

        public MembresiaService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<(bool Exito, string Mensaje)> AsignarMembresiaAsync(AsignarMembresiaDto request)
        {
            var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId);
            var membresia = await _unitOfWork.Membresias.GetByIdAsync(request.MembresiaId);

            if (usuario == null || membresia == null) return (false, "Usuario o membresía no encontrados");

            usuario.MembresiaActual = membresia;
            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.CompleteAsync();

            return (true, "Membresía asignada correctamente");
        }

        public async Task<CreditosResponseDto?> ObtenerCreditosActualesAsync(Guid usuarioId)
        {
            var fechaActual = DateTime.UtcNow;
            var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == usuarioId && c.Anio == fechaActual.Year && c.Mes == fechaActual.Month
            );

            if (creditoMes == null) return null;

            return new CreditosResponseDto
            {
                Anio = creditoMes.Anio,
                Mes = creditoMes.Mes,
                CreditosBase = creditoMes.CreditosBase,
                CreditosArrastrados = creditoMes.CreditosArrastrados,
                CreditosUsados = creditoMes.CreditosUsados
            };
        }

        public async Task<(bool Exito, string Mensaje)> RenovarCreditosMesAsync(Guid usuarioId, int? mesDestino = null, int? anioDestino = null)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(
                u => u.Id == usuarioId,
                u => u.MembresiaActual!
            );

            if (usuario?.MembresiaActual == null) return (false, "El usuario no tiene una membresía activa");

            var fechaActual = DateTime.UtcNow;
            var anio = anioDestino ?? fechaActual.Year;
            var mes = mesDestino ?? fechaActual.Month;

            bool existeMes = await _unitOfWork.CreditosMes.AnyAsync(
                c => c.UsuarioId == usuarioId && c.Anio == anio && c.Mes == mes);

            if (existeMes) return (true, "Los créditos ya han sido renovados para este mes");

            var nuevoMes = new CreditoMes
            {
                UsuarioId = usuarioId,
                Anio = anio,
                Mes = mes,
                CreditosBase = usuario.MembresiaActual.CreditosOtorgados,
                CreditosArrastrados = 0,
                CreditosUsados = 0
            };

            await _unitOfWork.CreditosMes.AddAsync(nuevoMes);
            await _unitOfWork.CompleteAsync();

            return (true, "Créditos renovados correctamente");
        }

        public async Task<(bool Exito, string Mensaje)> OtorgarCreditosExtraAsync(OtorgarCreditoDto request)
        {
            await RenovarCreditosMesAsync(request.UsuarioId);

            var fechaActual = DateTime.UtcNow;

            var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == request.UsuarioId && c.Anio == fechaActual.Year && c.Mes == fechaActual.Month
            );

            if (creditoMes == null) return (false, "No se encontró información de créditos para el usuario");

            creditoMes.CreditosBase += request.CantidadCreditos;

            _unitOfWork.CreditosMes.Update(creditoMes);
            await _unitOfWork.CompleteAsync();

            return (true, "Créditos otorgados correctamente");
        }

        public async Task<IEnumerable<CreditosResponseDto>> ObtenerBilleterasActivasAsync(Guid usuarioId)
        {
            var fechaHoy = DateTime.UtcNow;

            var billeteras = await _unitOfWork.CreditosMes.FindAsync(
                c => c.UsuarioId == usuarioId &&
                     (c.Anio > fechaHoy.Year || (c.Anio == fechaHoy.Year && c.Mes >= fechaHoy.Month))
            );

            return billeteras.OrderBy(c => c.Anio).ThenBy(c => c.Mes).Select(c => new CreditosResponseDto
            {
                Anio = c.Anio,
                Mes = c.Mes,
                CreditosBase = c.CreditosBase,
                CreditosArrastrados = c.CreditosArrastrados,
                CreditosUsados = c.CreditosUsados
            });
        }
    }
}