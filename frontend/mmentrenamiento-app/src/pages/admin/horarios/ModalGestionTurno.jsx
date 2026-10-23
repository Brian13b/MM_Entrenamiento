import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { administracionService } from '../../../services/administracionService';
import { reservasService } from '../../../services/reservasService';
import { Modal } from '../../../components/ui/Modal';
import { useConfirm } from '../../../hooks/useConfirm';

export const ModalGestionTurno = ({ isOpen, onClose, turno, fechaOperativa, onReservaExitosa }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmar, confirmDialog] = useConfirm();

  useEffect(() => {
    if (isOpen && usuarios.length === 0) {
      administracionService.getUsuarios()
        .then(data => setUsuarios(data))
        .catch(() => toast.error("Error al cargar la lista de alumnos"));
    }
  }, [isOpen, usuarios.length]);

  const cerrarModal = () => {
    if (isProcessing) return;
    setBusqueda('');
    setUsuarioSeleccionado(null);
    onClose();
  };

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return [];
    return usuarios
      .filter(u => u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()))
      .slice(0, 5);
  }, [usuarios, busqueda]);

  const handleAnotar = async (tipo) => {
    if (!usuarioSeleccionado) return toast.error("Seleccioná un alumno de la lista.");

    try {
      setIsProcessing(true);
      if (tipo === 'Fija') {
        await reservasService.asignarTurnoFijo({
          usuarioId: usuarioSeleccionado.id,
          horarioId: turno.horarioId,
          fechaInicio: fechaOperativa
        });
        toast.success("Turno fijo establecido.");
      } else {
        await reservasService.reservarTurno({
          usuarioId: usuarioSeleccionado.id,
          horarioId: turno.horarioId,
          fecha: fechaOperativa
        });
        toast.success("Alumno anotado a la clase.");
      }

      setBusqueda('');
      setUsuarioSeleccionado(null);
      onReservaExitosa();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo realizar la inscripción.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDarDeBaja = async (usuarioId) => {
    if (!turno.turnoId) return toast.error("Este turno todavía no tiene reservas.");
    const ok = await confirmar({
      title: '¿Quitar alumno de la clase?',
      message: 'Se cancelará su reserva y se le devolverá el crédito.',
      confirmText: 'Sí, quitar'
    });
    if (!ok) return;
    try {
      setIsProcessing(true);
      const respuesta = await reservasService.cancelarClase({
        usuarioId: usuarioId,
        turnoId: turno.turnoId,
        motivo: "Quitado de la clase por administración"
      });
      toast.success(respuesta?.message || "Alumno removido.");
      onReservaExitosa();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al dar de baja.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!turno) return null;

  return (
    <Modal isOpen={isOpen} onClose={cerrarModal} title={`Clase ${turno.horaInicio.slice(0,5)} hs`}>
      <div className="flex flex-col gap-6 mt-2">
        {confirmDialog}

        {/* Lista de Inscriptos Actuales */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex justify-between items-center">
            <span>Inscriptos ({turno.ocupacionActual}/{turno.cupoMaximo})</span>
            <span className="text-[10px] font-medium tracking-normal normal-case text-gray-400">{fechaOperativa}</span>
          </h3>

          {turno.inscriptos?.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center text-sm text-gray-500 font-medium">
              No hay alumnos anotados todavía.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {turno.inscriptos?.map((alumno, index) => (
                <div key={index} className="flex justify-between items-center bg-mm-light pl-4 pr-2 py-2 rounded-xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-mm-dark">{alumno.nombreCompleto}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      alumno.tipoReserva === 'Fija' ? 'text-mm-purple' : 'text-blue-600'
                    }`}>
                      {alumno.tipoReserva}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDarDeBaja(alumno.usuarioId)}
                    disabled={isProcessing}
                    title="Remover alumno"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inscripción Manual */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Anotar Alumno</h3>

          <div className="relative z-10 flex-1 mb-4">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={usuarioSeleccionado ? usuarioSeleccionado.nombreCompleto : busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setUsuarioSeleccionado(null);
                }}
                className={`w-full bg-mm-light focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all border ${
                  usuarioSeleccionado ? 'border-mm-purple text-mm-purple font-bold' : 'border-gray-200 text-mm-dark'
                }`}
              />
              {usuarioSeleccionado && (
                <button onClick={() => {setUsuarioSeleccionado(null); setBusqueda('');}} className="absolute right-4 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Resultados Buscador */}
            {busqueda && !usuarioSeleccionado && (
              <div className="mt-1 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 absolute w-full">
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setUsuarioSeleccionado(u); setBusqueda(''); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-mm-dark hover:bg-purple-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      {u.nombreCompleto}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-xs text-gray-500 font-medium">Sin resultados...</div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAnotar('Eventual')}
              disabled={isProcessing || turno.estaLleno || !usuarioSeleccionado}
              className="flex-1 bg-mm-dark text-white font-bold rounded-xl py-3 text-xs flex justify-center items-center gap-2 disabled:opacity-50 transition-all hover:bg-gray-800"
            >
              Clase Única
            </button>
            <button
              onClick={() => handleAnotar('Fija')}
              disabled={isProcessing || turno.estaLleno || !usuarioSeleccionado}
              className="flex-1 bg-mm-purple text-white font-bold rounded-xl py-3 text-xs flex justify-center items-center gap-2 disabled:opacity-50 transition-all hover:bg-mm-purple/60"
            >
              Hacer Fijo
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};