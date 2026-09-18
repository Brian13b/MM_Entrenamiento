import { useAuthStore } from '../../store/useAuthStore';
import { CalendarIcon } from '@heroicons/react/24/solid';

export const InicioAlumno = () => {
  // Obtenemos los datos del usuario logueado
  const { usuario } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          {/* Reemplazá con tu logo real */}
          <div className="w-8 h-8 bg-mm-dark rounded-md flex items-center justify-center text-mm-surface font-display text-xs">
            MM
          </div>
          <h1 className="font-bold text-mm-dark text-lg font-display">MM Entrenamiento</h1>
        </div>
        <img 
          src={usuario?.fotoPerfilUrl || "https://ui-avatars.com/api/?name=User&background=8e57a4&color=fff"} 
          alt="Perfil" 
          className="w-10 h-10 rounded-full border border-gray-200 object-cover"
        />
      </header>

      {/* Tarjeta: Tus Créditos */}
      <section className="bg-mm-surface rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-gray-500 font-bold text-sm tracking-wider uppercase">Tus Créditos</h2>
          <span className="bg-purple-100 text-mm-purple px-3 py-1 rounded-full text-xs font-bold">Activo</span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-6xl font-black text-mm-purple">2</span>
          <span className="text-gray-500 text-sm leading-tight">créditos<br/>disponibles</span>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-sm text-mm-purple font-medium">
          Tienes <span className="font-bold">2 turnos fijos</span> esta semana
        </div>
      </section>

      {/* Tarjeta: Información Importante (Anuncio Global) */}
      <section className="bg-mm-surface rounded-3xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-gray-500 font-bold text-sm tracking-wider uppercase mb-3">Información Importante</h2>
        <p className="text-mm-dark text-sm mb-4 font-medium leading-relaxed">
          Buenas tardes! Les recordamos que el lunes abrimos de 9 a 15hs (último turno 14hs). Nos escriben para reservar su turnito 💥
        </p>
        <div className="bg-mm-dark rounded-2xl p-4 flex justify-between items-center text-sm">
          <div className="text-gray-300">
            Tu membresía<br/>vence en <span className="text-white font-bold">8 días.</span>
          </div>
          <div className="h-8 w-px bg-gray-600 mx-2"></div>
          <button className="text-mm-purple font-bold hover:text-white transition-colors">
            Renovala <span className="text-white font-normal text-xs block">para no<br/>perder tus turnos.</span>
          </button>
        </div>
      </section>

      {/* Próximas Clases */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-mm-dark">Próximas Clases</h2>
          <button className="text-mm-purple text-sm font-bold">Ver todas</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {/* Tarjeta de Clase (Mock) */}
          <div className="bg-mm-surface rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-xl text-mm-purple">
                 <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Turno Fijo</p>
                <p className="text-sm font-bold text-mm-dark">Mar 22 Sept • 15:00 hs</p>
              </div>
            </div>
            <button className="text-mm-purple text-xs font-bold text-right leading-tight hover:underline">
              Cancelar<br/>Clase
            </button>
          </div>
          
          <div className="bg-mm-surface rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-xl text-mm-purple">
                 <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Turno Fijo</p>
                <p className="text-sm font-bold text-mm-dark">Mié 23 Sept • 09:00 hs</p>
              </div>
            </div>
            <button className="text-mm-purple text-xs font-bold text-right leading-tight hover:underline">
              Cancelar<br/>Clase
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};