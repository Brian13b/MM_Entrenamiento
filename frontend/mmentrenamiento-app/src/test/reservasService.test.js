import { describe, it, expect } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { reservasService } from '../services/reservasService';

const mock = new MockAdapter(api);

describe('Reservas Service', () => {
  it('Debe enviar correctamente los datos al reservar un turno', async () => {
    const datosReserva = { usuarioId: '123', horarioId: 1, fecha: '2026-10-15' };
    mock.onPost('/reservas/reservar').reply(200, { exito: true, mensaje: 'Reserva confirmada' });

    const response = await reservasService.reservarTurno(datosReserva);
    expect(response.exito).toBe(true);
  });
});