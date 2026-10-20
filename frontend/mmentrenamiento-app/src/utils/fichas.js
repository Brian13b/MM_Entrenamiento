// Una lesión "vacía" (ninguna, no, -, n/a) no debe disparar alertas.
export const tieneLesiones = (ficha) => {
  const texto = ficha?.lesiones?.trim();
  return !!texto && !/^(ninguna?|no|-|n\/a|s\/d)$/i.test(texto);
};
