const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test('Integration: Healthcheck endpoint', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('Integration: Seed integrity and initial participant counts', async () => {
  const res = await fetch(`${BASE_URL}/api/tickets`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.success);
  assert.equal(data.data.length, 100, 'Should return all 100 tickets');

  const sold = data.data.filter(t => t.buyerName);
  assert.equal(sold.length, 62, 'Initial active participants must be exactly 62');

  // Verify number 00 Candelaria
  const ticket00 = data.data.find(t => t.ticketNumber === '00');
  assert.equal(ticket00.buyerName, 'Candelaria');
  assert.equal(ticket00.status, 'pendiente');

  // Verify number 05 Vivi marked as paid
  const ticket05 = data.data.find(t => t.ticketNumber === '05');
  assert.equal(ticket05.buyerName, 'Vivi');
  assert.equal(ticket05.status, 'pagado');
  assert.equal(ticket05.amountPaid, 10000);
});

test('Integration: Statistics aggregation', async () => {
  const res = await fetch(`${BASE_URL}/api/tickets/stats`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.success);
  const stats = json.data;

  assert.equal(stats.sold, 62);
  assert.equal(stats.available, 38);
  assert.equal(stats.paidCount, 5); // 05, 12, 14, 29, 55
  assert.equal(stats.totalCollected >= 50000, true);
});

test('Integration: Update payment status to abono and pagado', async () => {
  // Update ticket 01 to abono $5.000
  const abonoRes = await fetch(`${BASE_URL}/api/tickets/01`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerName: 'Claudia',
      status: 'abono',
      amountPaid: 5000
    })
  });
  assert.equal(abonoRes.status, 200);
  const abonoData = await abonoRes.json();
  assert.equal(abonoData.data.status, 'abono');
  assert.equal(abonoData.data.amountPaid, 5000);

  // Restore ticket 01 to original state (pendiente, 0)
  const restoreRes = await fetch(`${BASE_URL}/api/tickets/01`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerName: 'Claudia',
      status: 'pendiente',
      amountPaid: 0
    })
  });
  assert.equal(restoreRes.status, 200);
});

test('Integration: Reset protection rejects invalid confirmation', async () => {
  const failRes = await fetch(`${BASE_URL}/api/tickets/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation: 'wrong_word' })
  });
  assert.equal(failRes.status, 400);
  const failData = await failRes.json();
  assert.equal(failData.success, false);
});
