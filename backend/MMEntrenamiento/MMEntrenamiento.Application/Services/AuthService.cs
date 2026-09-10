using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MMEntrenamiento.Application.DTOs.Auth;
using MMEntrenamiento.Application.Interfaces;
using MMEntrenamiento.Domain.Entities;
using MMEntrenamiento.Domain.Enums;
namespace MMEntrenamiento.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<Usuario> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<Usuario> userManager, RoleManager<IdentityRole<Guid>> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || user.EstadoCuenta != EstadoCuenta.Activo) return null;

            var result = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!result) return null;

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return new AuthResponseDto
            {
                UsuarioId = user.Id,
                NombreCompleto = user.NombreCompleto,
                Email = user.Email!,
                Token = token,
                Roles = roles
            };
        }

        public async Task<bool> RegisterAsync(RegisterRequestDto request, string rolBase)
        {
            var user = new Usuario
            {
                UserName = request.Email,
                Email = request.Email,
                NombreCompleto = request.NombreCompleto
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                if (!await _roleManager.RoleExistsAsync(rolBase))
                    await _roleManager.CreateAsync(new IdentityRole<Guid>(rolBase));

                await _userManager.AddToRoleAsync(user, rolBase);
                return true;
            }

            return false;
        }

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
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationInMinutes"]!)),
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
