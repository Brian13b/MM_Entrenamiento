// Arma un link de WhatsApp (wa.me) con un mensaje prearmado.
// El teléfono debe estar cargado en formato internacional (ej. +54 9 11 1234-5678).
export const construirLinkWhatsApp = (telefono, mensaje) => {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (!digitos) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
};
