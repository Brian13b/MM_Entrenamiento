export const urlAvatar = (nombre, foto) =>
  foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || 'Usuario')}&background=f5f6fb&color=8e57a4`;
