import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { administracionService } from '../../../services/administracionService';
import { reservasService } from '../../../services/reservasService';
import { Modal } from '../../../components/ui/Modal';

export const ModalGestionTurno = ({ isOpen, onClose, turno, fechaOperativa, onReservaExitosa }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && usuarios.length === 0) {
      administracionService.getUsuarios()
        .then(data => setUsuarios(data))
        .catch(() => toast.error("Error al cargar la lista de alumnos"));
    }
  }, [isOpen, usuarios.length]);

  const cerrarModal = () => {
    if (isProcessing) return;
    setUsuarioSeleccionado('');
    onClose();
  };

  const handleAnotar = async (tipo) => {
    if (!usuarioSeleccionado) return toast.error("Seleccioná un alumno de la lista.");
    
    try {
      setIsProcessing(true);
      
      if (tipo === 'Fija') {
        await reservasService.asignarTurnoFijo({
          usuarioId: usuarioSeleccionado,
          horarioId: turno.horarioId,
          fechaInicio: fechaOperativa
        });
        toast.success("Turno fijo establecido.");
      } else {
        await reservasService.reservarTurno({
          usuarioId: usuarioSeleccionado,
          horarioId: turno.horarioId,
          fecha: fechaOperativa
        });
        toast.success("Alumno anotado a la clase.");
      }
      
      setUsuarioSeleccionado('');
      onReservaExitosa();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo realizar la inscripción.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!turno) return null;

  return (
    <Modal isOpen={isOpen} onClose={cerrarModal} title={`Clase ${turno.horaInicio.slice(0,5)} hs`}>
      <div className="flex flex-col gap-6 mt-2">
        
        {/* Lista de Inscriptos Actuales */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Inscriptos ({turno.ocupacionActual}/{turno.cupoMaximo})
          </h3>
          
          {turno.inscriptos?.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center text-sm text-gray-500 font-medium">
              No hay alumnos anotados todavía.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {turno.inscriptos?.map((alumno, index) => (
                <div key={index} className="flex justify-between items-center bg-mm-light px-4 py-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-sm text-mm-dark">{alumno.nombreCompleto}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    alumno.tipoReserva === 'Fija' ? 'bg-purple-100 text-mm-purple' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {alumno.tipoReserva}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inscripción Manual */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Anotar Alumno</h3>
          
          <div className="relative flex items-center mb-3">
            <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Seleccionar alumno...</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombreCompleto}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleAnotar('Eventual')}
              disabled={isProcessing || turno.estaLleno || !usuarioSeleccionado}
              className="flex-1 bg-mm-dark text-white font-bold rounded-xl py-3 text-xs flex justify-center items-center gap-2 disabled:opacity-50 transition-all hover:bg-gray-800"
            >
              <PlusIcon className="w-4 h-4" /> Clase Única
            </button>
            <button 
              onClick={() => handleAnotar('Fija')}
              disabled={isProcessing || turno.estaLleno || !usuarioSeleccionado}
              className="flex-1 bg-mm-purple text-white font-bold rounded-xl py-3 text-xs flex justify-center items-center gap-2 disabled:opacity-50 transition-all hover:bg-purple-700"
            >
              <ArrowPathIcon className="w-4 h-4" /> Hacer Fijo
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};