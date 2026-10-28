// Utilidades de presentación para fechas/horas crudas del backend
// ("2026-10-20" para DateOnly, "18:00:00" para TimeOnly).

const LOCALE = 'es-AR';

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const fmtDia = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });
const fmtMesCorto = new Intl.DateTimeFormat(LOCALE, { month: 'short' });
const fmtMesLargo = new Intl.DateTimeFormat(LOCALE, { month: 'long' });

// "2026-10-20" -> Date local (evita el desfase UTC de new Date("2026-10-20")).
export const parsearFechaIso = (fechaIso) => {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

// "18:00:00" -> "18:00"
export const formatearHora = (hora) => (hora ? hora.substring(0, 5) : '');

// Para listados de reservas: { dia: 'Martes', diaMes: 20, mes: 'oct', mesLargo: 'octubre', hora: '18:00' }
export const formatearTurno = (fechaIso, horaInicio) => {
  const fecha = parsearFechaIso(fechaIso);
  const mes = fmtMesCorto.format(fecha).replace('.', '');
  return {
    dia: capitalizar(fmtDia.format(fecha)),
    diaMes: fecha.getDate(),
    mes,
    mesLargo: fmtMesLargo.format(fecha),
    hora: formatearHora(horaInicio),
  };
};

// "Martes 20 oct · 18:00"
export const etiquetaTurno = (fechaIso, horaInicio) => {
  const t = formatearTurno(fechaIso, horaInicio);
  return `${t.dia} ${t.diaMes} ${t.mes} · ${t.hora}`;
};

// El backend manda MiTurnoFijoDto.diaSemana como nombre inglés del enum DayOfWeek ("Monday").
const INDICE_DIA_INGLES = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

export const nombreDiaSemana = (diaIngles) => {
  const indice = INDICE_DIA_INGLES[diaIngles];
  if (indice === undefined) return diaIngles;
  // 7 de enero de 2024 fue domingo.
  return capitalizar(fmtDia.format(new Date(2024, 0, 7 + indice)));
};

// Índice de DayOfWeek de .NET (0 = Domingo) -> "Lunes".
export const nombreDiaPorIndice = (indice) => capitalizar(fmtDia.format(new Date(2024, 0, 7 + indice)));

// Date -> "2026-10-20" en hora local (evita el desfase de toISOString, que usa UTC).
export const fechaIsoLocal = (fecha = new Date()) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

// Días enteros desde hoy (local) hasta la fecha ISO. 0 = hoy, negativo = vencida.
export const diasHasta = (fechaIso) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const destino = parsearFechaIso(fechaIso);
  return Math.round((destino - hoy) / 86400000);
};

// Argentina no usa horario de verano: UTC-3 fijo, igual que la validación del backend.
const OFFSET_ARGENTINA_MS = -3 * 60 * 60 * 1000;

// true si la clase (fecha ISO + hora "HH:mm[:ss]") ya empezó según la hora de Argentina,
// sin depender del huso horario del dispositivo.
export const claseYaInicio = (fechaIso, horaInicio) => {
  if (!fechaIso || !horaInicio) return false;
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const inicioNominal = Date.UTC(anio, mes - 1, dia, horas, minutos);
  const ahoraArgentinaNominal = Date.now() + OFFSET_ARGENTINA_MS;
  return inicioNominal <= ahoraArgentinaNominal;
};

const ETIQUETAS_TIPO_RESERVA = {
  Fija: 'Turno fijo',
  Normal: 'Clase eventual',
  Recuperacion: 'Recuperación',
};

export const etiquetaTipoReserva = (tipo) => ETIQUETAS_TIPO_RESERVA[tipo] ?? tipo;

export const esNotFound = (error) => error?.response?.status === 404;
