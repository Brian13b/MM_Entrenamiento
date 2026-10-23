import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { reservasService } from '../../../services/reservasService';
import { formatearHora, esNotFound } from '../../../utils/fechas';

const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const AgregarTurnoUsuario = ({ usuarioId, onAgregado }) => {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoyIso());
  const [franjas, setFranjas] = useState([]);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);
  const [horarioId, setHorarioId] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!abierto || !fecha) return;

    let cancelado = false;
    const cargarFranjas = async () => {
      try {
        setCargandoFranjas(true);
        setHorarioId('');
        const data = await reservasService.getGrillaPorFecha(fecha);
        if (!cancelado) setFranjas(data || []);
      } catch (error) {
        if (cancelado) return;
        setFranjas([]);
        if (!esNotFound(error)) {
          toast.error('No se pudieron cargar los horarios de ese día.');
          console.error(error);
        }
      } finally {
        if (!cancelado) setCargandoFranjas(false);
      }
    };

    cargarFranjas();
    return () => { cancelado = true; };
  }, [abierto, fecha]);

  const handleAnotar = async (tipo) => {
    if (!horarioId) return toast.error('Elegí un horario.');

    try {
      setProcesando(true);
      const respuesta = tipo === 'Fija'
        ? await reservasService.asignarTurnoFijo({ usuarioId, horarioId: Number(horarioId), fechaInicio: fecha })
        : await reservasService.reservarTurno({ usuarioId, horarioId: Number(horarioId), fecha });

      toast.success(respuesta?.message || 'Turno agregado.');
      setHorarioId('');
      await onAgregado();
      setFranjas(await reservasService.getGrillaPorFecha(fecha));
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo agregar el turno.');
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full flex justify-center items-center gap-2 bg-mm-purple/10 text-mm-purple py-3 rounded-xl font-bold text-sm hover:bg-mm-purple/20 transition-colors mb-5"
      >
        <PlusCircleIcon className="w-5 h-5" /> Agregar turno
      </button>
    );
  }

  return (
    <div className="bg-mm-light border border-gray-100 rounded-2xl p-4 mb-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Agregar turno</h3>
        <button onClick={() => setAbierto(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cerrar</button>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha</label>
        <input
          type="date" min={hoyIso()} value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full mt-1 bg-white border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Horario</label>
        {cargandoFranjas ? (
          <p className="text-xs text-gray-400 mt-2">Cargando horarios...</p>
        ) : franjas.length === 0 ? (
          <p className="text-xs text-gray-400 italic mt-2">No hay clases ese día.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {franjas.map((f) => {
              const lleno = f.estaLleno;
              const seleccionado = String(f.horarioId) === String(horarioId);
              return (
                <button
                  key={f.horarioId} type="button" disabled={lleno}
                  onClick={() => setHorarioId(f.horarioId)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    seleccionado
                      ? 'bg-mm-dark text-white border-mm-dark'
                      : lleno
                        ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-mm-dark border-gray-200 hover:border-mm-purple'
                  }`}
                >
                  {formatearHora(f.horaInicio)}
                  <span className="block text-[10px] font-medium opacity-60">{f.ocupacionActual}/{f.cupoMaximo}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAnotar('Eventual')} disabled={procesando || !horarioId}
          className="flex-1 bg-mm-dark text-white font-bold rounded-xl py-3 text-xs disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          Clase única
        </button>
        <button
          onClick={() => handleAnotar('Fija')} disabled={procesando || !horarioId}
          className="flex-1 bg-mm-purple text-white font-bold rounded-xl py-3 text-xs disabled:opacity-50 hover:bg-mm-purple/60 transition-colors"
        >
          Turno fijo
        </button>
      </div>
      <p className="text-[10px] text-gray-400 font-medium">
        El turno fijo reserva este día y horario cada semana, a partir de la fecha elegida.
      </p>
    </div>
  );
};
