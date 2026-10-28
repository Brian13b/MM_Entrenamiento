using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MMEntrenamiento.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixConcurrenciaYFantasmas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reservas_UsuarioId",
                table: "Reservas");

            migrationBuilder.AddColumn<DateOnly>(
                name: "Fecha",
                table: "Reservas",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            // Rellena la fecha de las reservas existentes desde su turno, ANTES de crear el indice unico.
            migrationBuilder.Sql(@"
                UPDATE ""Reservas"" r
                SET ""Fecha"" = t.""Fecha""
                FROM ""Turnos"" t
                WHERE r.""TurnoId"" = t.""Id"";");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_UsuarioId_Fecha",
                table: "Reservas",
                columns: new[] { "UsuarioId", "Fecha" },
                unique: true,
                filter: "\"Estado\" IN ('Activa', 'Asistio')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reservas_UsuarioId_Fecha",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "Fecha",
                table: "Reservas");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_UsuarioId",
                table: "Reservas",
                column: "UsuarioId");
        }
    }
}
