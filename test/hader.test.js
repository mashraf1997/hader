import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';

let app, base, owner, kiosk, dataDir, ahmed, mona, phone;

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hader-'));
  app = createApp({ dataDir, env: {} });
  base = `http://127.0.0.1:${await app.start(0)}`;
});
after(async () => {
  await app.stop();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
async function call(p, { method = 'GET', body, jar } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(jar ? { cookie: jar } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
const jarOf = (r) => r.headers.get('set-cookie').split(';')[0];
const back = (p, minutes) => { p.in = new Date(Date.parse(p.in) - minutes * 60_000).toISOString(); };

test('owner sets up and adds employees with unique PINs', async () => {
  owner = jarOf(await call('/api/setup', { method: 'POST', body: { businessName: 'شركة النيل', password: 'owner-pass-1', timezone: 'UTC' } }));
  let r = await call('/api/employees', { method: 'POST', jar: owner, body: { name: 'أحمد', salary: 9000, phone: '01001234567' } });
  ahmed = r.body.employee;
  assert.match(ahmed.pin, /^\d{4}$/);
  r = await call('/api/employees', { method: 'POST', jar: owner, body: { name: 'منى', salary: 6000 } });
  mona = r.body.employee;
  r = await call('/api/employees/' + mona.id, { method: 'PUT', jar: owner, body: { pin: ahmed.pin } });
  assert.equal(r.status, 400, 'PINs are unique');
  assert.equal((await call('/api/employees', { method: 'POST', jar: owner, body: { name: '' } })).status, 400);
});

test('the kiosk must be paired by the owner, then shows a rotating code', async () => {
  assert.equal((await call('/api/kiosk/code', { method: 'POST', body: {} })).status, 401);
  assert.equal((await call('/api/kiosk/pair', { method: 'POST', body: {} })).status, 401);
  kiosk = jarOf(await call('/api/kiosk/pair', { method: 'POST', jar: owner, body: {} }));
  const r = await call('/api/kiosk/code', { method: 'POST', jar: kiosk, body: {} });
  assert.match(r.body.code, /^[A-Z0-9]{6}$/);
  assert.match(r.body.svg, /<svg/);
  assert.equal((await call('/api/overview', { jar: kiosk })).status, 401, 'the kiosk cannot open the dashboard');
});

test('employee links the phone once, then scans in and out', async () => {
  let r = await call('/api/me/punch', { method: 'POST', body: { code: 'XXXXXX' } });
  assert.equal(r.status, 401, 'no personal link yet');
  phone = jarOf(await call('/api/me/link', { method: 'POST', body: { token: ahmed.link.split('/').pop() } }));
  r = await call('/api/me/punch', { method: 'POST', jar: phone, body: { code: 'NOPE22' } });
  assert.equal(r.body.error, 'expired');
  const code = (await call('/api/kiosk/code', { method: 'POST', jar: kiosk, body: {} })).body.code;
  r = await call('/api/me/punch', { method: 'POST', jar: phone, body: { code } });
  assert.equal(r.body.action, 'in');
  r = await call('/api/me/punch', { method: 'POST', jar: phone, body: { code } });
  assert.equal(r.body.action, 'duplicate', 'a double scan counts once');
  back(app.data.punches[0], 30);
  r = await call('/api/me/punch', { method: 'POST', jar: phone, body: { code } });
  assert.equal(r.body.action, 'out');
  r = await call('/api/me', { jar: phone });
  assert.equal(r.body.me.name, 'أحمد');
  assert.equal(r.body.today.state, 'out');
  assert.equal(r.body.punches.length, 1);
});

test('PIN on the kiosk, with a switch to turn it off', async () => {
  let r = await call('/api/kiosk/pin', { method: 'POST', jar: kiosk, body: { pin: '0000' } });
  assert.equal(r.status, 401);
  r = await call('/api/kiosk/pin', { method: 'POST', jar: kiosk, body: { pin: mona.pin } });
  assert.equal(r.body.name, 'منى');
  assert.equal(r.body.action, 'in');
  const o = await call('/api/overview', { jar: owner });
  assert.equal(o.body.counts.in, 1);
  assert.equal(o.body.recent[0].name, 'منى');
  await call('/api/settings', { method: 'PUT', jar: owner, body: { settings: { allowPin: false } } });
  assert.equal((await call('/api/kiosk/pin', { method: 'POST', jar: kiosk, body: { pin: mona.pin } })).status, 403);
});

test('leave requests from the phone, approved by the owner', async () => {
  const day = new Date().toISOString().slice(0, 10);
  let r = await call('/api/me/leave', { method: 'POST', jar: phone, body: { from: day, to: '2000-01-01' } });
  assert.equal(r.status, 400, 'end before start');
  r = await call('/api/me/leave', { method: 'POST', jar: phone, body: { from: day, type: 'sick', reason: 'برد' } });
  assert.equal(r.body.leave.status, 'pending');
  assert.equal((await call('/api/overview', { jar: owner })).body.pendingLeaves, 1);
  await call('/api/leaves/' + r.body.leave.id, { method: 'PUT', jar: owner, body: { status: 'approved' } });
  const list = await call('/api/leaves', { jar: owner });
  assert.equal(list.body.leaves[0].status, 'approved');
  assert.equal(list.body.leaves[0].days, 1);
});

test('manual punches (night shift), payroll, adjustments and CSV', async () => {
  let r = await call('/api/punches', { method: 'POST', jar: owner, body: { employeeId: mona.id, day: '2026-01-05', in: '22:00', out: '06:00' } });
  assert.equal(r.status, 200);
  assert.equal(Date.parse(r.body.punch.out) - Date.parse(r.body.punch.in), 8 * 3600_000, 'out is the next morning');
  r = await call('/api/punches/' + r.body.punch.id, { method: 'PUT', jar: owner, body: { in: '21:00' } });
  assert.equal(Date.parse(r.body.punch.out) - Date.parse(r.body.punch.in), 9 * 3600_000);
  const month = new Date().toISOString().slice(0, 7);
  await call('/api/adjustments', { method: 'POST', jar: owner, body: { employeeId: ahmed.id, month, type: 'bonus', amount: 250 } });
  r = await call('/api/payroll?month=' + month, { jar: owner });
  const a = r.body.rows.find((x) => x.name === 'أحمد');
  assert.equal(a.bonuses, 250);
  assert.ok(a.present >= 1);
  const csv = await (await fetch(base + '/api/payroll.csv?month=' + month, { headers: { cookie: owner } })).text();
  assert.match(csv, /^\uFEFF?name,title,workdays/);
  assert.match(csv, /"أحمد"/);
});

test('a new personal link logs the old phone out; deactivating keeps history', async () => {
  await call(`/api/employees/${ahmed.id}/new-link`, { method: 'POST', jar: owner, body: {} });
  assert.equal((await call('/api/me', { jar: phone })).body.me, null);
  await call('/api/employees/' + mona.id, { method: 'DELETE', jar: owner, body: {} });
  assert.equal(app.data.employees.find((e) => e.id === mona.id).active, false);
  assert.ok(app.data.punches.some((p) => p.employeeId === mona.id));
  for (const p of ['/kiosk', '/me', '/e/x', '/k/ABC123']) assert.equal((await fetch(base + p)).status, 200, p);
  assert.equal((await fetch(base + '/qr.svg?path=/e/x')).status, 401, 'QR only for the owner');
});
