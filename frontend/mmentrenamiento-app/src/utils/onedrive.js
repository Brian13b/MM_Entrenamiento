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

export const obtenerUrlEditable = (url) => {
  if (!url) return '';
  let nueva = url;
  const matchIframe = nueva.match(/src=["']([^"']+)["']/);
  if (matchIframe) nueva = matchIframe[1];

  nueva = nueva.replace(/[?&]action=embedview/i, '');
  nueva = nueva.replace(/\/embed\?/i, '/edit?');
  return nueva;
};