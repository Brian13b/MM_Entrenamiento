import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export const PoliticaPrivacidad = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-white rounded-4xl shadow-sm border border-gray-100 p-8 md:p-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-mm-purple transition-colors mb-8 font-bold text-sm">
          <ArrowLeftIcon className="w-4 h-4" /> Volver
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheckIcon className="w-10 h-10 text-mm-purple" />
          <h1 className="text-3xl font-black text-mm-dark">Política de Privacidad</h1>
        </div>
        
        <div className="space-y-8 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">1. Marco Legal</h2>
            <p>MM Entrenamiento protege la privacidad de sus usuarios en estricto cumplimiento con la <strong className="text-mm-dark">Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">2. Datos Recopilados</h2>
            <p className="mb-2">Para el correcto funcionamiento del sistema, recopilamos:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-mm-dark">Datos identificatorios y de contacto:</strong> Nombre completo, número de teléfono y dirección de correo electrónico.</li>
              <li><strong className="text-mm-dark">Datos sensibles (Ficha Técnica):</strong> Información provista voluntariamente sobre el historial de lesiones, patologías previas y objetivos físicos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">3. Finalidad del Tratamiento</h2>
            <p className="mb-2">Toda la información es utilizada con fines estrictamente operativos y profesionales:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Gestión de cupos, asistencia y pagos.</li>
              <li>Adaptación, diseño y personalización de los planes de entrenamiento a través del seguimiento del perfil físico.</li>
              <li>Comunicación de avisos importantes relativos al gimnasio.</li>
            </ul>
            <p className="bg-purple-50 text-mm-purple p-4 rounded-xl text-sm font-medium">MM Entrenamiento garantiza que los datos no serán comercializados, cedidos, ni transferidos a empresas de terceros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-mm-purple mb-3">4. Derechos del Titular</h2>
            <p>El usuario es el dueño de su información. En cualquier momento puede ejercer sus derechos de acceso, rectificación, actualización o supresión de sus datos personales comunicándose directamente con la administración del gimnasio.</p>
          </section>
        </div>
      </div>
    </div>
  );
};