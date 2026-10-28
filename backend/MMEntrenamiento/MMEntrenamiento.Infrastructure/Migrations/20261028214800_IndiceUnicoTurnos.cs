using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MMEntrenamiento.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IndiceUnicoTurnos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Consolida los Turnos duplicados (mismo HorarioId + Fecha) ANTES de crear el indice unico:
            // gana el turno con mas reservas (desempate: menor Id), se le mueven las reservas de los
            // perdedores, se recalcula su OcupacionActual y se borran los perdedores.
            migrationBuilder.Sql(@"
                CREATE TEMP TABLE ""_TurnosDuplicados"" ON COMMIT DROP AS
                WITH conteo AS (
                    SELECT t.""Id"", t.""HorarioId"", t.""Fecha"",
                           (SELECT COUNT(*) FROM ""Reservas"" r WHERE r.""TurnoId"" = t.""Id"") AS ""Cantidad""
                    FROM ""Turnos"" t
                ),
                ranking AS (
                    SELECT c.""Id"",
                           FIRST_VALUE(c.""Id"") OVER (
                               PARTITION BY c.""HorarioId"", c.""Fecha""
                               ORDER BY c.""Cantidad"" DESC, c.""Id"") AS ""GanadorId""
                    FROM conteo c
                )
                SELECT ""Id"" AS ""PerdedorId"", ""GanadorId"" FROM ranking WHERE ""Id"" <> ""GanadorId"";

                UPDATE ""Reservas"" r
                SET ""TurnoId"" = d.""GanadorId""
                FROM ""_TurnosDuplicados"" d
                WHERE r.""TurnoId"" = d.""PerdedorId"";

                DELETE FROM ""Turnos"" t
                USING ""_TurnosDuplicados"" d
                WHERE t.""Id"" = d.""PerdedorId"";

                UPDATE ""Turnos"" t
                SET ""OcupacionActual"" = (
                    SELECT COUNT(*) FROM ""Reservas"" r
                    WHERE r.""TurnoId"" = t.""Id"" AND r.""Estado"" <> 'Cancelada')
                WHERE t.""Id"" IN (SELECT DISTINCT ""GanadorId"" FROM ""_TurnosDuplicados"");
            ");

            migrationBuilder.DropIndex(
                name: "IX_Turnos_HorarioId",
                table: "Turnos");

            migrationBuilder.CreateIndex(
                name: "IX_Turnos_HorarioId_Fecha",
                table: "Turnos",
                columns: new[] { "HorarioId", "Fecha" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Turnos_HorarioId_Fecha",
                table: "Turnos");

            migrationBuilder.CreateIndex(
                name: "IX_Turnos_HorarioId",
                table: "Turnos",
                column: "HorarioId");
        }
    }
}
