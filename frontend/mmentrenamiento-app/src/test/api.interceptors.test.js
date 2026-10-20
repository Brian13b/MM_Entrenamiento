import { describe, it, expect, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const mock = new MockAdapter(api);

describe('API Interceptors', () => {
  it('Debe ejecutar logout cuando el backend devuelve 401', async () => {
    const logoutSpy = vi.fn();
    useAuthStore.setState({ logout: logoutSpy, token: 'token-vencido' });

    mock.onGet('/usuarios/mi-perfil').reply(401);

    try {
      await api.get('/usuarios/mi-perfil');
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(logoutSpy).toHaveBeenCalled();
    }
  });
});