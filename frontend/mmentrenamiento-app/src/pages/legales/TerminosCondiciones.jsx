import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const TerminosCondiciones = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-white rounded-4xl shadow-sm border border-gray-100 p-8 md:p-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-mm-purple transition-colors mb-8 font-bold text-sm">
          <ArrowLeftIcon className="w-4 h-4" /> Volver
        </button>
        
        <h1 className="text-3xl font-black text-mm-dark mb-8">Términos y Condiciones</h1>
        
        <div className="space-y-8 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">1. Aceptación del Servicio</h2>
            <p>Al registrarse y utilizar la plataforma de reservas de MM Entrenamiento, el usuario acepta plenamente y sin reservas las presentes condiciones de uso.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">2. Sistema de Reservas y Créditos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Los turnos (eventuales o fijos) están sujetos a la disponibilidad de cupo en la grilla y deben gestionarse exclusivamente a través de la aplicación.</li>
              <li>Para que la cancelación de una clase reintegre el crédito a la cuenta del alumno, deberá realizarse con un mínimo de <strong className="text-mm-dark">2 horas</strong> de anticipación al inicio del turno. Pasado ese límite, el sistema tomará la clase como consumida.</li>
              <li>Los créditos otorgados por la membresía tienen validez mensual. No son transferibles a terceros ni acumulables para meses posteriores, salvo autorización expresa de la administración.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">3. Descargo de Responsabilidad Física (Condición Médica)</h2>
            <p>El usuario declara bajo declaración jurada encontrarse en óptimas condiciones de salud física y mental para realizar actividades deportivas y de alto impacto. MM Entrenamiento recomienda realizarse un chequeo médico previo. El establecimiento y sus profesionales no se responsabilizan por lesiones, problemas cardiovasculares, accidentes o cualquier afección derivada de la práctica de los ejercicios, asumiendo el usuario el riesgo inherente a la actividad.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">4. Suspensión del Servicio</h2>
            <p>La administración se reserva el derecho de bloquear o dar de baja la cuenta de cualquier usuario que incumpla las normativas de convivencia del gimnasio o mantenga deudas en sus membresías.</p>
          </section>
        </div>
      </div>
    </div>
  );
};