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

export const pushService = {
  suscribirDispositivo: async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
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
        const request = {
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys.p256dh,
          auth: subJSON.keys.auth
        };

        await api.post('/notificaciones/suscribir', request);
        return true;

      } catch (error) {
        console.error('Error en suscripción Push:', error);
        return false;
      }
    }
    return false;
  }
};