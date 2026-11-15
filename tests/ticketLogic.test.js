const test = require('node:test');
const assert = require('node:assert/strict');
const { INITIAL_PARTICIPANTS, TOTAL_TICKETS, TICKET_PRICE } = require('../src/constants/initialData');
const ticketService = require('../src/services/ticketService');

test('Initial participants validation', () => {
  assert.equal(TOTAL_TICKETS, 100, 'Raffle must have 100 total numbers');
  assert.equal(TICKET_PRICE, 10000, 'Ticket price must be 10000 COP');
  assert.equal(INITIAL_PARTICIPANTS.length, 62, 'Initial participant list must contain exactly 62 active buyers');

  // Verify specific buyers requested by user
  const candelaria00 = INITIAL_PARTICIPANTS.find(p => p.number === '00');
  assert.ok(candelaria00);
  assert.equal(candelaria00.name, 'Candelaria');
  assert.equal(candelaria00.status, 'pendiente');

  // Verify buyers previously marked with checkmarks are initialized as paid
  const paidNumbers = ['05', '12', '14', '29', '55'];
  for (const num of paidNumbers) {
    const item = INITIAL_PARTICIPANTS.find(p => p.number === num);
    assert.ok(item, `Number ${num} must exist in initial participants`);
    assert.equal(item.status, 'pagado', `Number ${num} must have status 'pagado'`);
    assert.equal(item.amountPaid, 10000, `Number ${num} must have amountPaid equal to 10000`);
  }

  // Verify buyers with emojis are intact
  const julio10 = INITIAL_PARTICIPANTS.find(p => p.number === '10');
  assert.equal(julio10.name, 'Julio❤️');

  const heidy52 = INITIAL_PARTICIPANTS.find(p => p.number === '52');
  assert.equal(heidy52.name, 'Heidy 💕');
});

test('Ticket number validation', () => {
  assert.equal(ticketService.validateTicketNumber('0'), '00');
  assert.equal(ticketService.validateTicketNumber('05'), '05');
  assert.equal(ticketService.validateTicketNumber(99), '99');

  assert.throws(() => ticketService.validateTicketNumber(100), /between 00 and 99/);
  assert.throws(() => ticketService.validateTicketNumber(-1), /between 00 and 99/);
  assert.throws(() => ticketService.validateTicketNumber('abc'), /between 00 and 99/);
  assert.throws(() => ticketService.validateTicketNumber(null), /required/);
});

test('Reset protection requires explicit confirmation keyword', async () => {
  await assert.rejects(
    async () => ticketService.resetAllTickets(''),
    /Confirmation string "REINICIAR" is required/
  );

  await assert.rejects(
    async () => ticketService.resetAllTickets('borrar'),
    /Confirmation string "REINICIAR" is required/
  );

  await assert.rejects(
    async () => ticketService.resetAllTickets(null),
    /Confirmation string "REINICIAR" is required/
  );
});
