import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            usuario: null,
            token: null,
            isAuthenticated: false,

            login: (usuario, token) => {
                set({ usuario, token, isAuthenticated: true });
            },

            logout: () => {
                set({ usuario: null, token: null, isAuthenticated: false });
            },

            setToken: (token) => set({ token }),

            setUsuario: (usuario) => set({ usuario }),
        }),
        {
            name: 'mm-auth',
            partialize: (state) => ({
                usuario: state.usuario,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
