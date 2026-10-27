using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MMEntrenamiento.Application.DTOs.Auth;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Application.Interfaces.Repositories;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;
namespace MMEntrenamiento.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<Usuario> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;

        // Dos pestañas pueden refrescar a la vez con la misma cookie: la segunda llega con un
        // token recién rotado. Dentro de esta ventana no se lo trata como robo.
        private static readonly TimeSpan VentanaGraciaRotacion = TimeSpan.FromSeconds(30);

        public AuthService(UserManager<Usuario> userManager, RoleManager<IdentityRole<Guid>> roleManager, IConfiguration configuration, IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
        }

        private int MinutosAccessToken =>
            int.TryParse(_configuration["JwtSettings:AccessTokenMinutes"], out var m) && m > 0 ? m : 15;

        private int DiasRefreshToken =>
            int.TryParse(_configuration["JwtSettings:RefreshTokenDays"], out var d) && d > 0 ? d : 60;

        public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || user.EstadoCuenta != EstadoCuenta.Activo) return null;

            var result = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!result) return null;

            var roles = await _userManager.GetRolesAsync(user);
            var respuesta = ConstruirRespuesta(user, roles);

            await PurgarTokensViejosAsync(user.Id);
            await EmitirRefreshTokenAsync(respuesta, user.Id, Guid.NewGuid());
            await _unitOfWork.CompleteAsync();

            return respuesta;
        }

        public async Task<AuthResponseDto?> RefreshAsync(string? refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return null;

            var hash = HashToken(refreshToken);
            var actual = await _unitOfWork.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
            if (actual == null) return null;

            var ahora = DateTime.UtcNow;
            var enGracia = false;

            if (actual.RevocadoEn != null)
            {
                // Token ya rotado o revocado.
                enGracia = actual.ReemplazadoPorHash != null
                           && ahora - actual.RevocadoEn.Value <= VentanaGraciaRotacion;

                if (!enGracia)
                {
                    // Reutilización fuera de la ventana: posible robo. Se cierra toda la familia.
                    await RevocarFamiliaAsync(actual.FamiliaId, ahora);
                    await _unitOfWork.CompleteAsync();
                    return null;
                }
            }

            if (actual.ExpiraEn <= ahora) return null;

            var user = await _userManager.FindByIdAsync(actual.UsuarioId.ToString());
            if (user == null || user.EstadoCuenta != EstadoCuenta.Activo)
            {
                await RevocarFamiliaAsync(actual.FamiliaId, ahora);
                await _unitOfWork.CompleteAsync();
                return null;
            }

            var roles = await _userManager.GetRolesAsync(user);
            var respuesta = ConstruirRespuesta(user, roles);

            if (enGracia)
            {
                // El navegador ya recibió la cookie nueva de la otra pestaña: solo se emite un
                // JWT nuevo y no se toca la cookie (RefreshToken queda null).
                return respuesta;
            }

            var nuevoHash = await EmitirRefreshTokenAsync(respuesta, user.Id, actual.FamiliaId);

            actual.RevocadoEn = ahora;
            actual.ReemplazadoPorHash = nuevoHash;
            _unitOfWork.RefreshTokens.Update(actual);

            await _unitOfWork.CompleteAsync();
            return respuesta;
        }

        public async Task LogoutAsync(string? refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return;

            var hash = HashToken(refreshToken);
            var actual = await _unitOfWork.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
            if (actual == null) return;

            await RevocarFamiliaAsync(actual.FamiliaId, DateTime.UtcNow);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<(bool Exito, string Mensaje, Guid? UsuarioId)> RegisterAsync(RegisterRequestDto request, string rolBase)
        {
            var user = new Usuario
            {
                UserName = request.Email,
                Email = request.Email,
                NombreCompleto = request.NombreCompleto,
                PhoneNumber = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim()
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                if (!await _roleManager.RoleExistsAsync(rolBase))
                    await _roleManager.CreateAsync(new IdentityRole<Guid>(rolBase));

                await _userManager.AddToRoleAsync(user, rolBase);

                return (true, "Usuario registrado con éxito.", user.Id);
            }

            return (false, "Error al registrar el usuario.", null);
        }

        public async Task<(bool Exito, string Mensaje)> CambiarPasswordAsync(Guid usuarioId, CambiarPasswordDto request)
        {
            var usuario = await _userManager.FindByIdAsync(usuarioId.ToString());
            if (usuario == null) return (false, "Usuario no encontrado.");

            var resultado = await _userManager.ChangePasswordAsync(usuario, request.PasswordActual, request.NuevaPassword);
            if (!resultado.Succeeded) return (false, "La contraseña actual es incorrecta o la nueva no cumple los requisitos.");

            return (true, "Contraseña actualizada correctamente.");
        }

        public async Task<(bool Exito, string Mensaje)> SolicitarRecuperacionAsync(SolicitarRecuperacionDto request)
        {
            var usuario = await _userManager.FindByEmailAsync(request.Email);
            if (usuario == null) return (true, "Si el email existe, se enviarán las instrucciones.");

            var token = await _userManager.GeneratePasswordResetTokenAsync(usuario);

            // Decidiendo si va a ser enviado por email o por mensaje de texto, por ahora lo vamos a mostrar en consola para fines de desarrollo.
            Console.WriteLine($"\n=== TOKEN DE RECUPERACIÓN PARA {usuario.Email} ===\n{token}\n==============================================\n");

            return (true, "Si el email existe, se enviarán las instrucciones.");
        }

        public async Task<(bool Exito, string Mensaje)> ResetearPasswordAsync(ResetearPasswordDto request)
        {
            var usuario = await _userManager.FindByEmailAsync(request.Email);
            if (usuario == null) return (false, "Solicitud inválida.");

            var resultado = await _userManager.ResetPasswordAsync(usuario, request.Token, request.NuevaPassword);
            if (!resultado.Succeeded) return (false, "El token expiró o es inválido.");

            return (true, "Contraseña reseteada exitosamente. Ya podés iniciar sesión.");
        }

        private AuthResponseDto ConstruirRespuesta(Usuario user, IList<string> roles)
        {
            return new AuthResponseDto
            {
                UsuarioId = user.Id,
                NombreCompleto = user.NombreCompleto,
                Email = user.Email!,
                Token = GenerateJwtToken(user, roles),
                Roles = roles
            };
        }

        // Crea un refresh token nuevo, lo persiste (hasheado) y deja el valor en claro en la
        // respuesta para que el controller lo escriba en la cookie. Devuelve el hash.
        private async Task<string> EmitirRefreshTokenAsync(AuthResponseDto respuesta, Guid usuarioId, Guid familiaId)
        {
            var valor = Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));
            var hash = HashToken(valor);
            var expira = DateTime.UtcNow.AddDays(DiasRefreshToken);

            await _unitOfWork.RefreshTokens.AddAsync(new RefreshToken
            {
                UsuarioId = usuarioId,
                TokenHash = hash,
                FamiliaId = familiaId,
                ExpiraEn = expira
            });

            respuesta.RefreshToken = valor;
            respuesta.RefreshTokenExpiraEn = expira;
            return hash;
        }

        private async Task RevocarFamiliaAsync(Guid familiaId, DateTime ahora)
        {
            var activos = await _unitOfWork.RefreshTokens.FindAsync(t => t.FamiliaId == familiaId && t.RevocadoEn == null);
            foreach (var t in activos)
            {
                t.RevocadoEn = ahora;
                _unitOfWork.RefreshTokens.Update(t);
            }
        }

        // Limpieza oportunista: borra tokens del usuario vencidos o revocados hace más de 7 días.
        private async Task PurgarTokensViejosAsync(Guid usuarioId)
        {
            var limite = DateTime.UtcNow.AddDays(-7);
            var viejos = await _unitOfWork.RefreshTokens.FindAsync(
                t => t.UsuarioId == usuarioId && (t.ExpiraEn < limite || (t.RevocadoEn != null && t.RevocadoEn < limite)));
            foreach (var t in viejos) _unitOfWork.RefreshTokens.Delete(t);
        }

        private static string HashToken(string valor) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(valor)));

        private string GenerateJwtToken(Usuario user, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim("NombreCompleto", user.NombreCompleto)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(MinutosAccessToken),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(secretKey), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}