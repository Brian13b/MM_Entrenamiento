import { api } from "./api";

const PUBLIC_VAPID_KEY = 'BPcGEZHhlkLUfo2Y92UId9EffwAUBm1VD_7MNxfRE16caFpwr66lwSpMKJzrXcwXjtJEqSBwk2nDimX8LYXRSpk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const soportaPush = () => 'serviceWorker' in navigator && 'PushManager' in window;

export const pushService = {
  soportaPush,

  // IMPORTANTE (iOS/Safari): debe llamarse SOLO desde el handler de un click del usuario y sin
  // ningún `await` previo en ese handler, o Safari descarta el gesto y no muestra el permiso.
  // Nunca llamar automáticamente (login, montaje de componentes, etc.).
  suscribirDispositivo: async () => {
    if (!soportaPush()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
      }

      const subJSON = subscription.toJSON();
      await api.post('/notificaciones/suscribir', {
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      });
      return true;

    } catch (error) {
      console.error('Error en suscripción Push:', error);
      return false;
    }
  },

  // Lo usa la app cuando el service worker avisa que el navegador rotó la suscripción: registra la
  // vigente y da de baja la anterior. No pide permisos ni crea suscripciones por su cuenta.
  resincronizarSuscripcion: async (anteriorEndpoint) => {
    if (!soportaPush()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;

      const subJSON = subscription.toJSON();
      await api.post('/notificaciones/suscribir', {
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      });

      if (anteriorEndpoint && anteriorEndpoint !== subJSON.endpoint) {
        await api.post('/notificaciones/desuscribir', { endpoint: anteriorEndpoint });
      }
      return true;
    } catch (error) {
      console.error('No se pudo resincronizar la suscripción push:', error);
      return false;
    }
  },

  // Da de baja la suscripción en el servidor y en el navegador. Si el servidor falla igual se
  // desuscribe localmente (la fila huérfana se limpia sola cuando el servicio push responda 404/410).
  desuscribirDispositivo: async () => {
    if (!soportaPush()) return true;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        try {
          await api.post('/notificaciones/desuscribir', { endpoint: subscription.endpoint });
        } catch (error) {
          console.error('No se pudo avisar la baja al servidor:', error);
        }
        await subscription.unsubscribe();
      }
      return true;
    } catch (error) {
      console.error('Error al desuscribir:', error);
      return false;
    }
  }
};
