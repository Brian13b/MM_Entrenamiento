import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const mock = new MockAdapter(api);

describe('API Interceptors', () => {
  it('Debe ejecutar logout cuando el backend devuelve 401 y el refresh también es rechazado', async () => {
    const logoutSpy = vi.fn();
    useAuthStore.setState({ logout: logoutSpy, token: 'token-vencido', isAuthenticated: true });
    vi.stubGlobal('location', { pathname: '/alumno', href: '' });

    const mockRefresh = new MockAdapter(axios);
    mockRefresh.onPost(/\/auth\/refresh$/).reply(401);
    mock.onGet('/usuarios/mi-perfil').reply(401);

    await expect(api.get('/usuarios/mi-perfil')).rejects.toMatchObject({ response: { status: 401 } });
    expect(logoutSpy).toHaveBeenCalled();

    mockRefresh.restore();
    vi.unstubAllGlobals();
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