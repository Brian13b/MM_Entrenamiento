/* eslint-disable no-undef */
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

// Front y API comparten origen (Vercel proxea /api a Railway).
const API_BASE = '/api';
const ICONO = '/pwa-192x192.png';

// Solo se navega a URLs del mismo origen: un payload nunca puede mandar al usuario a otro sitio.
const resolverUrlSegura = (url) => {
  try {
    const destino = new URL(url || '/', self.location.origin);
    return destino.origin === self.location.origin ? destino.href : new URL('/', self.location.origin).href;
  } catch {
    return new URL('/', self.location.origin).href;
  }
};

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      // Payload que no es JSON: se usa como texto plano en lugar de romper el worker.
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'MM Entrenamiento';
  const options = {
    body: data.body || 'Tienes un nuevo aviso.',
    icon: data.icon || ICONO,
    badge: ICONO,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  // Siempre se muestra una notificación: iOS revoca la suscripción si llegan pushes "silenciosos".
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const destino = resolverUrlSegura(event.notification.data?.url);

  event.waitUntil((async () => {
    const ventanas = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find((c) => new URL(c.url).origin === self.location.origin);

    if (abierta) {
      try {
        await abierta.focus();
        if ('navigate' in abierta) await abierta.navigate(destino);
        return;
      } catch {
        // Algunos navegadores no permiten navigate(): se cae a abrir una ventana nueva.
      }
    }

    await clients.openWindow(destino);
  })());
});

// Si el navegador rota la suscripción, se vuelve a registrar sin intervención del usuario.
// El service worker no tiene acceso al JWT (vive en localStorage), así que obtiene uno nuevo
// con la cookie HttpOnly del refresh token.
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil((async () => {
    try {
      const anterior = event.oldSubscription;
      let nueva = event.newSubscription;

      if (!nueva) {
        const key = anterior?.options?.applicationServerKey;
        if (!key) return;
        nueva = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key
        });
      }

      const refresh = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!refresh.ok) return; // Sin sesión vigente: se resincroniza cuando el usuario reactive el botón.
      const { token } = await refresh.json();

      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const sub = nueva.toJSON();

      await fetch(`${API_BASE}/notificaciones/suscribir`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
      });

      if (anterior && anterior.endpoint !== sub.endpoint) {
        await fetch(`${API_BASE}/notificaciones/desuscribir`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ endpoint: anterior.endpoint })
        });
      }
    } catch (error) {
      console.error('No se pudo resincronizar la suscripción push:', error);
    }
  })());
});
