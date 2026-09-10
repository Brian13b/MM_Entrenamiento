using System;
using System.Collections.Generic;
using System.Text;

namespace MMEntrenamiento.Application.DTOs.Auth
{
    public class RegisterRequestDto
    {
        public string NombreCompleto { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
