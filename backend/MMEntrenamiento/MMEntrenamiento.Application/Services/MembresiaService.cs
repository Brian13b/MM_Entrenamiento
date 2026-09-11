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

        public async Task<bool> AsignarMembresiaAsync(AsignarMembresiaDto request)
        {
            var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId);
            var membresia = await _unitOfWork.Membresias.GetByIdAsync(request.MembresiaId);

            if (usuario == null || membresia == null) return false;

            usuario.MembresiaActual = membresia;
            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.CompleteAsync();

            return true;
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

        public async Task<bool> RenovarCreditosMesAsync(Guid usuarioId)
        {
            var usuario = await _unitOfWork.Usuarios.FirstOrDefaultAsync(
                u => u.Id == usuarioId,
                u => u.MembresiaActual!
            );

            if (usuario?.MembresiaActual == null) return false;

            var fechaActual = DateTime.UtcNow;

            bool existeMesActual = await _unitOfWork.CreditosMes.AnyAsync(
                c => c.UsuarioId == usuarioId && c.Anio == fechaActual.Year && c.Mes == fechaActual.Month
            );

            if (existeMesActual) return true;

            var mesAnterior = fechaActual.AddMonths(-1);
            var creditoAnterior = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == usuarioId && c.Anio == mesAnterior.Year && c.Mes == mesAnterior.Month
            );

            int creditosParaArrastrar = 0;
            if (creditoAnterior != null)
            {
                creditosParaArrastrar = Math.Max(0, creditoAnterior.CreditosBase - creditoAnterior.CreditosUsados);
            }

            var nuevoMes = new CreditoMes
            {
                UsuarioId = usuarioId,
                Anio = fechaActual.Year,
                Mes = fechaActual.Month,
                CreditosBase = usuario.MembresiaActual.CreditosOtorgados,
                CreditosArrastrados = creditosParaArrastrar,
                CreditosUsados = 0
            };

            await _unitOfWork.CreditosMes.AddAsync(nuevoMes);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> OtorgarCreditosExtraAsync(OtorgarCreditoDto request)
        {
            await RenovarCreditosMesAsync(request.UsuarioId);

            var fechaActual = DateTime.UtcNow;

            var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == request.UsuarioId && c.Anio == fechaActual.Year && c.Mes == fechaActual.Month
            );

            if (creditoMes == null) return false;

            creditoMes.CreditosBase += request.CantidadCreditos;

            _unitOfWork.CreditosMes.Update(creditoMes);
            await _unitOfWork.CompleteAsync();

            return true;
        }
    }
}