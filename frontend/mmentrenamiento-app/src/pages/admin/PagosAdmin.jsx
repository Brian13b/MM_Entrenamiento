import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  BanknotesIcon, 
  CalendarDaysIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { administracionService } from '../../services/administracionService';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatearMoneda = (monto) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto || 0);

const aFechaLocalIso = (fechaUtc) => {
  if (!fechaUtc) return '';
  const d = new Date(fechaUtc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatearFechaHora = (fechaUtc) => {
  if (!fechaUtc) return '-';
  const d = new Date(fechaUtc);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const PagosAdmin = () => {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState('Todos');
  const [fechaExacta, setFechaExacta] = useState('');
  const [mesIngreso, setMesIngreso] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const cargarPagos = async () => {
      try {
        setIsLoading(true);
        const data = await administracionService.getHistorialPagos();
        setPagos(data || []);
      } catch (error) {
        toast.error('No se pudo cargar el historial de pagos.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarPagos();
  }, []);

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((p) => {
      const coincideNombre = !busqueda.trim() || 
        (p.nombreUsuario || '').toLowerCase().includes(busqueda.toLowerCase());

      const coincideMetodo = metodoFiltro === 'Todos' || 
        (p.metodoPago || '').toLowerCase() === metodoFiltro.toLowerCase();

      const fechaIsoPago = aFechaLocalIso(p.fechaPago);

      const coincideFechaExacta = !fechaExacta || fechaIsoPago === fechaExacta;
      const coincideMes = fechaExacta ? true : (!mesIngreso || fechaIsoPago.startsWith(mesIngreso));

      return coincideNombre && coincideMetodo && coincideFechaExacta && coincideMes;
    });
  }, [pagos, busqueda, metodoFiltro, fechaExacta, mesIngreso]);

  const resumen = useMemo(() => {
    return pagosFiltrados.reduce(
      (acc, p) => {
        const monto = Number(p.monto) || 0;
        acc.total += monto;
        if ((p.metodoPago || '').toLowerCase() === 'efectivo') {
          acc.efectivo += monto;
        } else {
          acc.transferencia += monto;
        }
        return acc;
      },
      { total: 0, efectivo: 0, transferencia: 0 }
    );
  }, [pagosFiltrados]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setMetodoFiltro('Todos');
    setFechaExacta('');
    setMesIngreso('');
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Historial de Pagos</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">
            Control de ingresos por fecha, alumno y método de pago.
          </p>
        </div>
      </header>

      {/* TARJETAS DE TOTALES SEGÚN FILTRO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-mm-dark text-white rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Recaudado ({pagosFiltrados.length} cobros)
          </span>
          <span className="text-2xl md:text-3xl font-display font-black text-mm-purple mt-2">
            {formatearMoneda(resumen.total)}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">En Efectivo</span>
          <span className="text-2xl font-display font-black text-green-600 mt-2">
            {formatearMoneda(resumen.efectivo)}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Por Transferencia</span>
          <span className="text-2xl font-display font-black text-blue-600 mt-2">
            {formatearMoneda(resumen.transferencia)}
          </span>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Buscador por Alumno */}
          <div className="md:col-span-4 relative flex items-center">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Buscar por alumno..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-sm font-medium text-mm-dark outline-none focus:border-mm-purple transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Mes de Ingreso */}
          <div className="md:col-span-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Mes de ingreso</span>
              <input
                type="month"
                value={mesIngreso}
                disabled={!!fechaExacta}
                onChange={(e) => setMesIngreso(e.target.value)}
                className="bg-transparent text-xs font-bold text-mm-dark outline-none disabled:opacity-40 mt-0.5"
              />
            </div>
          </div>

          {/* Filtro por Día Exacto */}
          <div className="md:col-span-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <FunnelIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Día exacto</span>
              <input
                type="date"
                value={fechaExacta}
                onChange={(e) => setFechaExacta(e.target.value)}
                className="bg-transparent text-xs font-bold text-mm-dark outline-none mt-0.5"
              />
            </div>
          </div>

          {/* Botón Limpiar */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={limpiarFiltros}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Ver todos
            </button>
          </div>
        </div>

        {/* Selector de Método de Pago */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            {['Todos', 'Efectivo', 'Transferencia'].map((metodo) => (
              <button
                key={metodo}
                onClick={() => setMetodoFiltro(metodo)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  metodoFiltro === metodo
                    ? 'bg-mm-purple text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400">
            Mostrando {pagosFiltrados.length} de {pagos.length} registros
          </span>
        </div>
      </div>

      {/* LISTA DE PAGOS */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 animate-pulse">
          <span className="font-bold text-mm-purple">Cargando historial de pagos...</span>
        </div>
      ) : pagosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <BanknotesIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-400">No se encontraron pagos con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 bg-gray-50 px-6 py-3.5 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Alumno</div>
            <div className="col-span-3">Fecha de Ingreso</div>
            <div className="col-span-2">Período Abonado</div>
            <div className="col-span-1 text-center">Método</div>
            <div className="col-span-2 text-right">Monto</div>
          </div>

          <div className="divide-y divide-gray-100">
            {pagosFiltrados.map((pago) => {
              const esEfectivo = (pago.metodoPago || '').toLowerCase() === 'efectivo';
              const nombreMes = MESES[(pago.mesAbonado || 1) - 1] || pago.mesAbonado;

              return (
                <div
                  key={pago.id}
                  onClick={() => pago.usuarioId && navigate(`/admin/usuarios/${pago.usuarioId}`)}
                  className="p-4 md:px-6 md:py-4 hover:bg-purple-50/40 transition-colors cursor-pointer flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center group"
                >
                  {/* Alumno */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-2">
                    <span className="font-bold text-sm text-mm-dark group-hover:text-mm-purple transition-colors flex items-center gap-1.5">
                      {pago.nombreUsuario}
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-mm-purple transition-opacity" />
                    </span>
                    <span className="md:hidden font-display font-black text-base text-mm-dark">
                      {formatearMoneda(pago.monto)}
                    </span>
                  </div>

                  {/* Fecha y Hora de ingreso */}
                  <div className="md:col-span-3 text-xs font-semibold text-gray-500">
                    <span className="md:hidden font-bold text-gray-400 mr-1">Ingresó:</span>
                    {formatearFechaHora(pago.fechaPago)} hs
                  </div>

                  {/* Período */}
                  <div className="md:col-span-2 text-xs font-bold text-mm-dark">
                    <span className="md:hidden font-bold text-gray-400 mr-1">Período:</span>
                    {nombreMes} {pago.anioAbonado}
                  </div>

                  {/* Método */}
                  <div className="md:col-span-1 flex md:justify-center">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        esEfectivo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {pago.metodoPago}
                    </span>
                  </div>

                  {/* Monto (Desktop) */}
                  <div className="hidden md:block md:col-span-2 text-right font-display font-black text-base text-mm-dark">
                    {formatearMoneda(pago.monto)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};