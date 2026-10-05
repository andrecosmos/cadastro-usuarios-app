import assert from 'node:assert/strict';
import test from 'node:test';

import { gerarLinkWhatsApp } from './whatsappHelper.js';

test('builds an admin WhatsApp confirmation for a Brazilian customer number', () => {
  const link = gerarLinkWhatsApp({
    servico: 'Corte',
    profissional: 'Ana',
    data: '2026-10-06',
    horario: '14:30',
    telefoneCliente: '(11) 99999-9999',
    nomeCliente: 'Maria'
  }, { name: 'Studio Exemplo' }, 'admin');
  const url = new URL(link);
  const message = url.searchParams.get('text');

  assert.equal(url.pathname, '/5511999999999');
  assert.match(message, /Olá, Maria!/);
  assert.match(message, /Seu agendamento na \*Studio Exemplo\* foi realizado com sucesso!/);
  assert.match(message, /\*Serviço:\* Corte/);
  assert.match(message, /\*Profissional:\* Ana/);
  assert.match(message, /\*Data:\* 06\/10\/2026/);
  assert.match(message, /\*Horário:\* 14:30/);
});

test('does not create a WhatsApp link when the customer phone is invalid', () => {
  const link = gerarLinkWhatsApp({
    telefoneCliente: '12345'
  }, { name: 'Studio Exemplo' }, 'admin');

  assert.equal(link, '');
});

test('allows the customer flow to open WhatsApp without a recipient phone', () => {
  const link = gerarLinkWhatsApp({
    servico: 'Corte',
    profissional: 'Ana',
    data: '2026-10-06',
    horario: '14:30'
  }, { name: 'Studio Exemplo' }, 'cliente');
  const url = new URL(link);

  assert.equal(url.origin + url.pathname, 'https://wa.me/');
  assert.match(url.searchParams.get('text'), /Meu Agendamento Confirmado/);
});
