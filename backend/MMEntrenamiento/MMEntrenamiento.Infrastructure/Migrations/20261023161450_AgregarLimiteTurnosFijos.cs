using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MMEntrenamiento.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarLimiteTurnosFijos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LimiteTurnosFijos",
                table: "Membresias",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LimiteTurnosFijos",
                table: "Membresias");
        }
    }
}
