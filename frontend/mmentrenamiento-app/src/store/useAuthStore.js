import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    usuario: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),

    login: (usuario, token) => {
        localStorage.setItem('token', token);
        set({ usuario, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ usuario: null, token: null, isAuthenticated: false });
    },

    setUsuario: (usuario) => set({ usuario }),
}));