namespace MMEntrenamiento.Application.Exceptions
{
    /// <summary>
    /// La base rechazo la operacion porque otra reserva concurrente ya ocupo el lugar del alumno ese dia.
    /// </summary>
    public class ConflictoReservaException : Exception
    {
        public ConflictoReservaException(Exception inner)
            : base("Ya existe una reserva vigente para este alumno en la fecha indicada.", inner) { }
    }
}
