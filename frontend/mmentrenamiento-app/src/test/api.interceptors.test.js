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

  it('No debe ejecutar logout cuando el 401 viene del login (credenciales inválidas)', async () => {
    const logoutSpy = vi.fn();
    useAuthStore.setState({ logout: logoutSpy, token: null });

    mock.onPost('/auth/login').reply(401, { message: 'Credenciales inválidas' });

    await expect(api.post('/auth/login', { email: 'a@a.com', password: 'x' })).rejects.toMatchObject({
      response: { status: 401 }
    });
    expect(logoutSpy).not.toHaveBeenCalled();
  });
});