using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MMEntrenamiento.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregadosFinales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Metodo",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "ValidadoPorUserId",
                table: "Pagos");

            migrationBuilder.AddColumn<int>(
                name: "AnioAbonado",
                table: "Pagos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MesAbonado",
                table: "Pagos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "MetodoPago",
                table: "Pagos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "Pagos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoPerfilUrl",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AnunciosGlobales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Mensaje = table.Column<string>(type: "text", nullable: true),
                    UltimaModificacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnunciosGlobales", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExcepcionesTurnoFijo_UsuarioId",
                table: "ExcepcionesTurnoFijo",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExcepcionesTurnoFijo_AspNetUsers_UsuarioId",
                table: "ExcepcionesTurnoFijo",
                column: "UsuarioId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExcepcionesTurnoFijo_AspNetUsers_UsuarioId",
                table: "ExcepcionesTurnoFijo");

            migrationBuilder.DropTable(
                name: "AnunciosGlobales");

            migrationBuilder.DropIndex(
                name: "IX_ExcepcionesTurnoFijo_UsuarioId",
                table: "ExcepcionesTurnoFijo");

            migrationBuilder.DropColumn(
                name: "AnioAbonado",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "MesAbonado",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "MetodoPago",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Observaciones",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "LimiteTurnosFijos",
                table: "Membresias");

            migrationBuilder.DropColumn(
                name: "FotoPerfilUrl",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Pagos",
                type: "varchar",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Metodo",
                table: "Pagos",
                type: "varchar",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ValidadoPorUserId",
                table: "Pagos",
                type: "uuid",
                nullable: true);
        }
    }
}
