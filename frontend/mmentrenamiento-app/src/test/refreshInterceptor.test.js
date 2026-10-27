import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const REFRESH = /\/auth\/refresh$/;

describe('Interceptor de refresh token', () => {
  let mockApi;
  let mockAxios;

  beforeEach(() => {
    mockApi = new MockAdapter(api);
    mockAxios = new MockAdapter(axios);
    useAuthStore.setState({ usuario: { id: '1' }, token: 'viejo', isAuthenticated: true });
  });

  afterEach(() => {
    mockApi.restore();
    mockAxios.restore();
    vi.unstubAllGlobals();
  });

  it('renueva el token una sola vez y reintenta todas las peticiones que dieron 401', async () => {
    mockAxios.onPost(REFRESH).reply(200, { token: 'nuevo' });
    mockApi.onGet('/datos').reply((config) =>
      config.headers.Authorization === 'Bearer nuevo' ? [200, { ok: true }] : [401]
    );

    const [a, b] = await Promise.all([api.get('/datos'), api.get('/datos')]);

    expect(a.data.ok).toBe(true);
    expect(b.data.ok).toBe(true);
    expect(mockAxios.history.post.filter((r) => REFRESH.test(r.url))).toHaveLength(1);
    expect(useAuthStore.getState().token).toBe('nuevo');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('desloguea al usuario solo si el refresh es rechazado con 401', async () => {
    vi.stubGlobal('location', { pathname: '/alumno', href: '' });
    mockAxios.onPost(REFRESH).reply(401);
    mockApi.onGet('/datos').reply(401);

    await expect(api.get('/datos')).rejects.toBeTruthy();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(window.location.href).toBe('/login');
  });

  it('no cierra la sesión si el refresh falla por red (usuario offline)', async () => {
    mockAxios.onPost(REFRESH).networkError();
    mockApi.onGet('/datos').reply(401);

    await expect(api.get('/datos')).rejects.toBeTruthy();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('no intenta renovar cuando el 401 viene del login', async () => {
    mockApi.onPost('/auth/login').reply(401);

    await expect(api.post('/auth/login', {})).rejects.toBeTruthy();

    expect(mockAxios.history.post).toHaveLength(0);
  });
});
