// src/utils/onedrive.js

export const esUrlHttp = (valor) => /^https?:\/\//i.test(valor || '') || /<iframe/i.test(valor || '');

export const construirUrlEmbed = (url) => {
  let nuevaUrl = url;
  const matchIframe = nuevaUrl.match(/src=["']([^"']+)["']/);
  if (matchIframe) nuevaUrl = matchIframe[1];

  if (nuevaUrl.includes('onedrive.live.com/view.aspx')) nuevaUrl = nuevaUrl.replace('view.aspx', 'embed');
  if (!/[?&]action=embedview/i.test(nuevaUrl) && nuevaUrl.includes('sharepoint.com')) {
    nuevaUrl += nuevaUrl.includes('?') ? '&action=embedview' : '?action=embedview';
  }
  if (!/wdAllowInteractivity/i.test(nuevaUrl)) {
    nuevaUrl += nuevaUrl.includes('?') ? '&wdAllowInteractivity=True&wdHideHeaders=True' : '?wdAllowInteractivity=True&wdHideHeaders=True';
  }
  return nuevaUrl;
};

// Limpia toda la basura de parámetros "embed" para que se abra como una web normal
export const obtenerUrlEditable = (url) => {
  if (!url) return '';
  let nueva = url;
  
  // 1. Extraer si es un iframe
  const matchIframe = nueva.match(/src=["']([^"']+)["']/);
  if (matchIframe) nueva = matchIframe[1];

  // 2. Cambiar embed por view
  nueva = nueva.replace(/\/embed\?/i, '/view?');
  
  // 3. Quitar todos los parámetros que fuerzan la vista de recuadro
  nueva = nueva.replace(/&?embed=1/ig, '');
  nueva = nueva.replace(/&?em=2/ig, '');
  nueva = nueva.replace(/&?wdAllowInteractivity=[^&]*/ig, '');
  nueva = nueva.replace(/&?wdHideGridlines=[^&]*/ig, '');
  nueva = nueva.replace(/&?wdHideHeaders=[^&]*/ig, '');
  nueva = nueva.replace(/&?wdInConfigurator=[^&]*/ig, '');
  nueva = nueva.replace(/&?wdo=[^&]*/ig, '');
  
  // 4. Limpiar posibles símbolos sueltos (ej: ?& o &&)
  nueva = nueva.replace(/\?&/g, '?').replace(/&&/g, '&');
  if (nueva.endsWith('&') || nueva.endsWith('?')) nueva = nueva.slice(0, -1);

  return nueva;
};