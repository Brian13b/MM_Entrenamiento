using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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

        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;

        // Dos pestañas pueden refrescar a la vez con la misma cookie, y en iOS Safari puede congelar la PWA
        // justo después de que el servidor rotó el token (la respuesta se pierde y el navegador conserva la
        // cookie vieja). Dentro de esta ventana un token rotado no se trata como robo.
        private static readonly TimeSpan VentanaGraciaRotacion = TimeSpan.FromMinutes(5);

        public AuthService(UserManager<Usuario> userManager, RoleManager<IdentityRole<Guid>> roleManager, IConfiguration configuration,
            IUnitOfWork unitOfWork, IEmailService emailService, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _logger = logger;
        }

        private int MinutosAccessToken =>
            int.TryParse(_configuration["JwtSettings:AccessTokenMinutes"], out var m) && m > 0 ? m : 60;

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

            var errores = string.Join(" ", result.Errors.Select(e => e.Description));
            return (false, errores, null);
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
            const string respuestaGenerica = "Si el email existe, se enviarán las instrucciones.";

            var usuario = await _userManager.FindByEmailAsync(request.Email);
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Email)) return (true, respuestaGenerica);

            var token = await _userManager.GeneratePasswordResetTokenAsync(usuario);

            // El token de Identity trae caracteres que rompen una URL (+, /, =): se codifica en base64url.
            var tokenUrl = Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes(token));
            var enlace = $"{UrlFrontend}/restablecer-password?email={Uri.EscapeDataString(usuario.Email)}&token={tokenUrl}";

            try
            {
                await _emailService.EnviarAsync(usuario.Email, "Recuperá tu contraseña - MM Entrenamiento", ConstruirCuerpoRecuperacion(usuario.NombreCompleto, enlace));
            }
            catch (Exception ex)
            {
                // No se revela al cliente: la respuesta no debe permitir saber si el email existe.
                _logger.LogError(ex, "No se pudo enviar el email de recuperación a {UsuarioId}.", usuario.Id);
            }

            return (true, respuestaGenerica);
        }

        public async Task<(bool Exito, string Mensaje)> ResetearPasswordAsync(ResetearPasswordDto request)
        {
            var usuario = await _userManager.FindByEmailAsync(request.Email);
            if (usuario == null) return (false, "Solicitud inválida.");

            string token;
            try
            {
                token = Encoding.UTF8.GetString(Base64UrlEncoder.DecodeBytes(request.Token));
            }
            catch (FormatException)
            {
                return (false, "El enlace es inválido o expiró.");
            }

            var resultado = await _userManager.ResetPasswordAsync(usuario, token, request.NuevaPassword);
            if (!resultado.Succeeded) return (false, "El enlace es inválido o expiró.");

            // Cualquier sesión abierta antes del reseteo deja de ser válida.
            await RevocarTodasLasSesionesAsync(usuario.Id, DateTime.UtcNow);
            await _unitOfWork.CompleteAsync();

            return (true, "Contraseña reseteada exitosamente. Ya podés iniciar sesión.");
        }

        private string UrlFrontend =>
            (_configuration["App:FrontendUrl"] ?? "https://mm-entrenamiento.vercel.app").TrimEnd('/');

        private static string ConstruirCuerpoRecuperacion(string nombre, string enlace)
        {
            var nombreSeguro = System.Net.WebUtility.HtmlEncode(nombre);
            var enlaceSeguro = System.Net.WebUtility.HtmlEncode(enlace);
            return $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f1e2e">
                  <h2>Hola {nombreSeguro}</h2>
                  <p>Recibimos un pedido para restablecer tu contraseña. Tocá el botón para elegir una nueva:</p>
                  <p style="text-align:center;margin:28px 0">
                    <a href="{enlaceSeguro}" style="background:#8e57a4;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold">Restablecer contraseña</a>
                  </p>
                  <p style="font-size:13px;color:#666">Si el botón no funciona, copiá este enlace en tu navegador:<br>{enlaceSeguro}</p>
                  <p style="font-size:13px;color:#666">Si no fuiste vos, ignorá este correo: tu contraseña no cambia.</p>
                </div>
                """;
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

        private async Task RevocarTodasLasSesionesAsync(Guid usuarioId, DateTime ahora)
        {
            var activos = await _unitOfWork.RefreshTokens.FindAsync(t => t.UsuarioId == usuarioId && t.RevocadoEn == null);
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