import { describe, it, expect } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { authService } from '../services/auth';

const mock = new MockAdapter(api);

describe('Auth Service', () => {
  it('Debe hacer login y retornar los datos del usuario', async () => {
    const mockResponse = { token: 'jwt-token-123', usuarioId: 'uuid', rol: 'Admin' };
    mock.onPost('/auth/login').reply(200, mockResponse);

    const data = await authService.login('admin@mm.com', '123456');
    expect(data.token).toBe('jwt-token-123');
  });
});