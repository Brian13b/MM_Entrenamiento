using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace MMEntrenamiento.Domain.Entities
{
    public class FichaTecnica
    {
        [Key]
        public Guid Id { get; set; }
        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
        public string? Objetivos { get; set; }
        public string? Lesiones { get; set; }
        public DateTime UltimaModificacion { get; set; }
    }
}
