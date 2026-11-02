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

            var fechaActual = DateTime.UtcNow.AddHours(-3);

            // 1. VALIDACIÓN ANTI-RUPTURA: Turnos Fijos
            var turnosFijosActivos = await _unitOfWork.TurnosFijos
                .CountAsync(t => t.UsuarioId == request.UsuarioId && t.Activo);

            if (membresia.LimiteTurnosFijos < turnosFijosActivos)
            {
                var sobran = turnosFijosActivos - membresia.LimiteTurnosFijos;
                return (false, $"El alumno tiene {turnosFijosActivos} turnos fijos activos. Da de baja {sobran} turno(s) fijo(s) antes de cambiar a esta membresía.");
            }

            // 2. Traer carteras del mes actual y futuras
            var carteras = await _unitOfWork.CreditosMes.FindAsync(
                c => c.UsuarioId == request.UsuarioId &&
                     (c.Anio > fechaActual.Year || (c.Anio == fechaActual.Year && c.Mes >= fechaActual.Month))
            );
            var listaCarteras = carteras.ToList();

            // 3. REGLA DEL DÍA 15
            bool afectaMesActual = fechaActual.Day <= 15;

            // 4. VALIDACIÓN ANTI-RUPTURA: Créditos Negativos
            foreach (var cartera in listaCarteras)
            {
                if (cartera.Anio == fechaActual.Year && cartera.Mes == fechaActual.Month && !afectaMesActual)
                    continue;

                if (cartera.CreditosUsados > membresia.CreditosOtorgados)
                {
                    return (false, $"El alumno ya consumió {cartera.CreditosUsados} créditos en {cartera.Mes}/{cartera.Anio}. Bajar la membresía a {membresia.CreditosOtorgados} lo dejaría en negativo.");
                }
            }

            // 5. PISAR DATOS EN LAS CARTERAS AFECTADAS
            bool mesActualActualizado = false;

            foreach (var cartera in listaCarteras)
            {
                if (cartera.Anio == fechaActual.Year && cartera.Mes == fechaActual.Month)
                {
                    if (afectaMesActual)
                    {
                        cartera.CreditosBase = membresia.CreditosOtorgados;
                        _unitOfWork.CreditosMes.Update(cartera);
                        mesActualActualizado = true;
                    }
                }
                else 
                {
                    cartera.CreditosBase = membresia.CreditosOtorgados;
                    _unitOfWork.CreditosMes.Update(cartera);
                }
            }

            // 6. Si afecta el mes actual y no tenía cartera creada, la creamos
            if (afectaMesActual && !mesActualActualizado)
            {
                var nuevoMes = new CreditoMes
                {
                    UsuarioId = request.UsuarioId,
                    Anio = fechaActual.Year,
                    Mes = fechaActual.Month,
                    CreditosBase = membresia.CreditosOtorgados,
                    CreditosArrastrados = 0,
                    CreditosUsados = 0
                };
                await _unitOfWork.CreditosMes.AddAsync(nuevoMes);
            }

            usuario.MembresiaActual = membresia;
            _unitOfWork.Usuarios.Update(usuario);

            await _unitOfWork.CompleteAsync();

            return (true, afectaMesActual
                ? "Membresía actualizada. Se ajustaron los créditos del mes en curso y meses futuros."
                : "Membresía actualizada. Por la regla del día 15, los nuevos créditos aplicarán recién el mes que viene.");
        }

        public async Task<CreditosResponseDto?> ObtenerCreditosActualesAsync(Guid usuarioId)
        {
            var fechaActual = DateTime.UtcNow;
            var creditoMes = await _unitOfWork.CreditosMes.FirstOrDefaultAsync(
                c => c.UsuarioId == usuarioId && c.Anio == fechaActual.Year && c.Mes == fechaActual.Month
            );

            if (creditoMes == null)
            {
                return new CreditosResponseDto
                {
                    Anio = fechaActual.Year,
                    Mes = fechaActual.Month,
                    CreditosBase = 0,
                    CreditosArrastrados = 0,
                    CreditosUsados = 0
                };
            }

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