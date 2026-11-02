// Hader server: staff attendance with a rotating QR (or PIN) at the entrance, leave requests and monthly payroll.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { hashPassword, verifyPassword, createSession, checkSession, parseCookies, RateLimiter } from './auth.js';
import { send, readJson, clientIp, originOf, serveStatic, cookie, VERSION } from './http.js';
import { demoConfig, resetData } from './demo-mode.js';
import { buildDemo } from './demo-data.js';
import { monthReport, localParts, toMin, zonedToUtc, addDays } from './payroll.js';

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const randCode = (n) => [...crypto.randomBytes(n)].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');

export function defaultData() {
  return {
    version: 1,
    meta: { secret: crypto.randomBytes(32).toString('hex'), createdAt: new Date().toISOString() },
    admin: null,
    settings: {
      businessName: '',
      lang: 'ar',
      timezone: '',
      currency: 'جنيه',
      workDays: [6, 0, 1, 2, 3, 4], // Saturday to Thursday
      shiftStart: '09:00',
      shiftEnd: '17:00',
      graceMinutes: 15,
      monthDays: 30, // day rate = salary / monthDays
      deductLate: true,
      deductAbsence: true,
      payOvertime: false,
      overtimeRate: 1.5,
      allowPin: true, // employees may punch with their PIN on the kiosk
      codeTtlSeconds: 60,
      kioskKey: crypto.randomBytes(16).toString('hex'), // rotate to sign out every kiosk
    },
    employees: [], // { id, token, name, phone, title, pin, salary, shiftStart, shiftEnd, workDays, active, createdAt }
    punches: [], // { id, employeeId, day, in, out, via, note, edited }
    leaves: [], // { id, employeeId, from, to, type, reason, status, createdAt, decidedAt }
    adjustments: [], // { id, employeeId, month, type: bonus|deduction|advance, amount, note, at }
    codes: [], // kiosk codes: { code, expiresAt }
  };
}

const clean = (s, n = 120) => String(s ?? '').trim().slice(0, n);
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const isTime = (s) => /^\d{1,2}:\d{2}$/.test(String(s || ''));
export const LEAVE_TYPES = ['annual', 'sick', 'unpaid', 'other'];

export function createApp({ dataDir, setupToken = process.env.SETUP_TOKEN || '', env = process.env } = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'hader.json');
  const def = defaultData();
  const loaded = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const data = loaded ? { ...def, ...loaded, settings: { ...def.settings, ...loaded.settings } } : def;
  let timer;
  const flush = () => { clearTimeout(timer); fs.writeFileSync(file + '.tmp', JSON.stringify(data)); fs.renameSync(file + '.tmp', file); };
  const save = () => { clearTimeout(timer); timer = setTimeout(flush, 200); };
  if (!loaded) flush();
  // DEMO_MODE=true: a public showcase with sample data that resets on a timer.
  const demo = demoConfig(env);
  const resetDemo = () => { resetData(data, () => buildDemo(demo), demo); flush(); };
  let demoTimer = null;
  if (demo) { resetDemo(); demoTimer = setInterval(resetDemo, demo.resetMinutes * 60_000); demoTimer.unref?.(); }

  const tz = () => data.settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const loginLimiter = new RateLimiter(10, 15 * 60_000);
  const pinLimiter = new RateLimiter(12, 15 * 60_000);
  const punchLimiter = new RateLimiter(30, 60 * 60_000);

  const hashFor = (uid) => (uid === 'owner' ? data.admin?.hash : uid === 'kiosk' ? data.settings.kioskKey : null);
  const isOwner = (req) => checkSession(data.meta.secret, parseCookies(req.headers.cookie).hader_session, hashFor) === 'owner';
  const isKiosk = (req) => checkSession(data.meta.secret, parseCookies(req.headers.cookie).hader_kiosk, hashFor) === 'kiosk';
  const ownerCookie = (req) => cookie(req, 'hader_session', createSession(data.meta.secret, data.admin.hash), 30 * 86400);
  const meOf = (req) => {
    const token = parseCookies(req.headers.cookie).hader_me;
    return token ? data.employees.find((e) => e.token === token && e.active !== false) || null : null;
  };

  const employee = (id) => data.employees.find((e) => e.id === id);
  const schedule = (e) => ({ start: e.shiftStart || data.settings.shiftStart, end: e.shiftEnd || data.settings.shiftEnd, days: Array.isArray(e.workDays) && e.workDays.length ? e.workDays : data.settings.workDays });

  // A punch left open for 20+ hours is a forgotten check-out: it is closed without hours.
  const isOpen = (p) => !p.out && !p.closed && Date.now() - Date.parse(p.in) < 20 * 3600_000;

  /** Check in, or check out if there is an open punch. Two scans within 2 minutes count once. */
  function punch(e, via) {
    const now = new Date();
    const mine = data.punches.filter((p) => p.employeeId === e.id);
    const last = mine.reduce((a, p) => (!a || (p.out || p.in) > (a.out || a.in) ? p : a), null);
    if (last && now - Date.parse(last.out || last.in) < 120_000) return { action: 'duplicate', punch: last };
    const open = mine.find(isOpen);
    if (open) {
      open.out = now.toISOString();
      open.viaOut = via;
      save();
      return { action: 'out', punch: open };
    }
    for (const p of mine) if (!p.out && !p.closed) p.closed = true;
    const p = { id: crypto.randomUUID(), employeeId: e.id, day: localParts(now, tz()).date, in: now.toISOString(), out: null, via, note: '', edited: false };
    data.punches.push(p);
    if (data.punches.length > 200_000) data.punches.splice(0, 20_000);
    save();
    return { action: 'in', punch: p };
  }

  function todayStatus(e, now = Date.now()) {
    const L = localParts(now, tz());
    const sch = schedule(e);
    const mine = data.punches.filter((p) => p.employeeId === e.id && p.day === L.date).sort((a, b) => a.in.localeCompare(b.in));
    const leave = data.leaves.find((l) => l.employeeId === e.id && l.status === 'approved' && l.from <= L.date && l.to >= L.date);
    const workday = sch.days.includes(L.weekday);
    const first = mine[0];
    const lateBy = first ? Math.max(0, localParts(Date.parse(first.in), tz()).minutes - toMin(sch.start)) : 0;
    let state;
    if (mine.some(isOpen)) state = 'in';
    else if (mine.length) state = 'out';
    else if (leave) state = 'leave';
    else if (!workday) state = 'off';
    else if (L.minutes > toMin(sch.start) + data.settings.graceMinutes) state = 'absent';
    else state = 'expected';
    return {
      state, firstIn: first?.in || null, lastOut: mine.filter((p) => p.out).at(-1)?.out || null,
      late: first ? lateBy > data.settings.graceMinutes : state === 'absent', lateBy: first && lateBy > data.settings.graceMinutes ? lateBy : 0,
      leaveType: leave?.type || null, shift: `${sch.start}–${sch.end}`,
    };
  }

  const report = (e, month) => monthReport({ employee: e, month, settings: data.settings, punches: data.punches.filter((p) => p.employeeId === e.id), leaves: data.leaves.filter((l) => l.employeeId === e.id && l.status === 'approved'), adjustments: data.adjustments.filter((a) => a.employeeId === e.id && a.month === month), schedule: schedule(e), tz: tz(), now: Date.now() });
  const empView = (e) => ({ id: e.id, name: e.name, phone: e.phone, title: e.title, pin: e.pin, salary: e.salary, shiftStart: e.shiftStart, shiftEnd: e.shiftEnd, workDays: e.workDays, active: e.active, createdAt: e.createdAt, link: `/e/${e.token}` });
  const punchView = (p) => ({ ...p, name: employee(p.employeeId)?.name || '—', open: isOpen(p) });
  const thisMonth = () => localParts(Date.now(), tz()).month;

  function newKioskCode() {
    const now = Date.now();
    data.codes = data.codes.filter((c) => c.expiresAt > now - 30_000);
    const c = { code: randCode(6), expiresAt: now + data.settings.codeTtlSeconds * 1000 };
    data.codes.push(c);
    save();
    return c;
  }
  const codeValid = (code) => { const c = data.codes.find((x) => x.code === String(code || '').toUpperCase()); return Boolean(c && c.expiresAt + 15_000 > Date.now()); };
  const uniquePin = (pin, exceptId) => !data.employees.some((e) => e.id !== exceptId && e.active !== false && e.pin === pin);
  function freePin() { for (;;) { const p = String(crypto.randomInt(1000, 10000)); if (uniquePin(p)) return p; } }

  // ---------- routes ----------
  async function route(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const method = req.method;
    let m;

    if (p === '/health') return send(res, 200, { ok: true, version: VERSION });

    if (method === 'GET') {
      if (p === '/' || p === '/index.html') return serveStatic(res, 'index.html');
      if (p === '/kiosk') return serveStatic(res, 'kiosk.html');
      if (/^\/e\/[\w-]+$/.test(p) || /^\/k\/[A-Z0-9]+$/i.test(p) || p === '/me') return serveStatic(res, 'me.html');
      if (/^\/[\w.-]+\.(js|css|svg|png|ico)$/.test(p) && p !== '/qr.svg') return serveStatic(res, p.slice(1));
      if (p === '/qr.svg') {
        if (!isOwner(req)) return send(res, 401, 'Sign in');
        const target = String(url.searchParams.get('path') || '/');
        if (!/^\/[\w\-/?=&.]*$/.test(target)) return send(res, 400, 'Bad path');
        const svg = await QRCode.toString(originOf(req) + target, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
        return send(res, 200, svg, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' });
      }
      if (p === '/manifest.webmanifest') {
        return send(res, 200, JSON.stringify({ name: `${data.settings.businessName || 'Hader'}`, short_name: 'Hader', start_url: '/me', display: 'standalone', background_color: '#ffffff', theme_color: '#4338CA', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }] }), { 'content-type': 'application/manifest+json' });
      }
    }

    // ----- employee (personal link + QR scan) -----
    if (p === '/api/me/link' && method === 'POST') {
      const body = await readJson(req);
      const e = data.employees.find((x) => x.token === String(body.token || '') && x.active !== false);
      if (!e) return send(res, 404, { error: 'not_found' });
      return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'hader_me', e.token, 400 * 86400) });
    }
    if (p === '/api/me' && method === 'GET') {
      const e = meOf(req);
      if (!e) return send(res, 200, { me: null, businessName: data.settings.businessName, lang: data.settings.lang });
      const r = report(e, thisMonth());
      const mine = data.punches.filter((x) => x.employeeId === e.id).sort((a, b) => b.in.localeCompare(a.in)).slice(0, 14);
      return send(res, 200, {
        businessName: data.settings.businessName, lang: data.settings.lang, currency: data.settings.currency, tz: tz(),
        me: { name: e.name, title: e.title, shift: schedule(e) }, today: todayStatus(e),
        month: { month: r.month, present: r.present, absent: r.absent, lateMinutes: r.lateMinutes, lateDays: r.lateDays, workedHours: r.workedHours, leaveDays: r.leaveDays, overtimeHours: r.overtimeHours },
        punches: mine.map((x) => ({ day: x.day, in: x.in, out: x.out, open: isOpen(x) })),
        leaves: data.leaves.filter((l) => l.employeeId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
      });
    }
    if (p === '/api/me/punch' && method === 'POST') {
      const e = meOf(req);
      if (!e) return send(res, 401, { error: 'no_link' });
      if (!punchLimiter.allow('me:' + e.id)) return send(res, 429, { error: 'too_many' });
      const body = await readJson(req);
      if (!codeValid(body.code)) return send(res, 400, { error: 'expired' });
      const r = punch(e, 'qr');
      return send(res, 200, { action: r.action, at: r.action === 'out' ? r.punch.out : r.punch.in, today: todayStatus(e) });
    }
    if (p === '/api/me/leave' && method === 'POST') {
      const e = meOf(req);
      if (!e) return send(res, 401, { error: 'no_link' });
      const body = await readJson(req);
      if (!isDay(body.from) || !isDay(body.to || body.from) || (body.to || body.from) < body.from) return send(res, 400, { error: 'bad_dates' });
      if (data.leaves.filter((l) => l.employeeId === e.id && l.status === 'pending').length >= 10) return send(res, 429, { error: 'too_many' });
      const l = { id: crypto.randomUUID(), employeeId: e.id, from: body.from, to: body.to || body.from, type: LEAVE_TYPES.includes(body.type) ? body.type : 'annual', reason: clean(body.reason, 300), status: 'pending', createdAt: new Date().toISOString(), decidedAt: null };
      data.leaves.push(l);
      save();
      return send(res, 200, { leave: l });
    }

    // ----- kiosk (a tablet at the entrance) -----
    if (p === '/api/kiosk/state' && method === 'GET') return send(res, 200, { kiosk: isKiosk(req), owner: isOwner(req), businessName: data.settings.businessName, lang: data.settings.lang, allowPin: data.settings.allowPin });
    if (p === '/api/kiosk/pair' && method === 'POST') {
      if (!isOwner(req)) return send(res, 401, { error: 'Sign in as the owner first' });
      return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'hader_kiosk', createSession(data.meta.secret, data.settings.kioskKey, 'kiosk'), 365 * 86400) });
    }
    if (p === '/api/kiosk/code' && method === 'POST') {
      if (!isKiosk(req)) return send(res, 401, { error: 'not_paired' });
      const c = newKioskCode();
      const svg = await QRCode.toString(`${originOf(req)}/k/${c.code}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
      return send(res, 200, { code: c.code, expiresAt: new Date(c.expiresAt).toISOString(), svg, recent: recentPunches() });
    }
    if (p === '/api/kiosk/pin' && method === 'POST') {
      if (!isKiosk(req)) return send(res, 401, { error: 'not_paired' });
      if (!data.settings.allowPin) return send(res, 403, { error: 'pin_off' });
      if (!pinLimiter.allow(clientIp(req))) return send(res, 429, { error: 'too_many' });
      const body = await readJson(req);
      const pin = String(body.pin || '');
      const e = /^\d{4,6}$/.test(pin) ? data.employees.find((x) => x.active !== false && x.pin === pin) : null;
      if (!e) return send(res, 401, { error: 'wrong_pin' });
      const r = punch(e, 'pin');
      return send(res, 200, { name: e.name, action: r.action, at: r.action === 'out' ? r.punch.out : r.punch.in, late: todayStatus(e).lateBy });
    }

    // ----- owner sign-in -----
    if (demo && method === 'POST' && (p === '/api/setup' || p === '/api/password')) return send(res, 403, { error: 'Not available in the demo' });
    if (p === '/api/session' && method === 'GET') return send(res, 200, { needsSetup: !data.admin, authed: isOwner(req), setupTokenRequired: Boolean(setupToken), version: VERSION, timezone: tz(), demo: demo ? { password: demo.password, resetMinutes: demo.resetMinutes } : null });
    if (p === '/api/setup' && method === 'POST') {
      if (data.admin) return send(res, 409, { error: 'Already set up' });
      const body = await readJson(req);
      if (setupToken && body.setupToken !== setupToken) return send(res, 403, { error: 'Wrong setup token' });
      if (String(body.password || '').length < 8) return send(res, 400, { error: 'Password must be at least 8 characters' });
      data.admin = hashPassword(String(body.password));
      data.settings.businessName = clean(body.businessName, 80);
      if (body.lang === 'en') Object.assign(data.settings, { lang: 'en', currency: 'USD', workDays: [1, 2, 3, 4, 5] });
      if (body.timezone) data.settings.timezone = clean(body.timezone, 60);
      flush();
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    if (p === '/api/login' && method === 'POST') {
      if (!loginLimiter.allow(clientIp(req))) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const body = await readJson(req);
      if (!verifyPassword(String(body.password || ''), data.admin)) return send(res, 401, { error: 'Wrong password' });
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    if (p === '/api/logout' && method === 'POST') return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'hader_session', '', 0) });

    if (p.startsWith('/api/')) {
      if (!isOwner(req)) return send(res, 401, { error: 'Not signed in' });
      if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Send JSON' });
      return ownerApi(req, res, url, p, method);
    }
    return send(res, 404, 'Not found');
  }

  function recentPunches() {
    const since = Date.now() - 15 * 60_000;
    const ev = [];
    for (const p of data.punches) {
      if (Date.parse(p.in) >= since) ev.push({ name: employee(p.employeeId)?.name || '', action: 'in', at: p.in });
      if (p.out && Date.parse(p.out) >= since) ev.push({ name: employee(p.employeeId)?.name || '', action: 'out', at: p.out });
    }
    return ev.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  }

  async function ownerApi(req, res, url, p, method) {
    let m;
    if (p === '/api/overview' && method === 'GET') {
      const list = data.employees.filter((e) => e.active !== false).map((e) => ({ id: e.id, name: e.name, title: e.title, ...todayStatus(e) }));
      const count = (s) => list.filter((x) => x.state === s).length;
      return send(res, 200, {
        today: localParts(Date.now(), tz()).date, employees: list,
        counts: { total: list.length, in: count('in'), out: count('out'), absent: count('absent'), leave: count('leave'), off: count('off'), expected: count('expected'), late: list.filter((x) => x.lateBy > 0).length },
        pendingLeaves: data.leaves.filter((l) => l.status === 'pending').length,
        recent: recentPunches(),
      });
    }

    // ----- employees -----
    if (p === '/api/employees' && method === 'GET') return send(res, 200, { employees: data.employees.map(empView) });
    if (p === '/api/employees' && method === 'POST') {
      const body = await readJson(req);
      const e = { id: crypto.randomUUID(), token: crypto.randomBytes(18).toString('base64url'), name: '', phone: '', title: '', pin: freePin(), salary: 0, shiftStart: '', shiftEnd: '', workDays: null, active: true, createdAt: new Date().toISOString() };
      const err = applyEmployee(e, body);
      if (err) return send(res, 400, { error: err });
      if (!e.name) return send(res, 400, { error: 'Name is required' });
      data.employees.push(e);
      save();
      return send(res, 200, { employee: empView(e) });
    }
    if ((m = p.match(/^\/api\/employees\/([\w-]+)$/))) {
      const e = employee(m[1]);
      if (!e) return send(res, 404, { error: 'Employee not found' });
      if (method === 'PUT') {
        const err = applyEmployee(e, await readJson(req));
        if (err) return send(res, 400, { error: err });
        save();
        return send(res, 200, { employee: empView(e) });
      }
      if (method === 'DELETE') {
        // Keep the history for payroll: deleting only deactivates.
        e.active = false;
        save();
        return send(res, 200, { ok: true });
      }
    }
    if ((m = p.match(/^\/api\/employees\/([\w-]+)\/new-link$/)) && method === 'POST') {
      const e = employee(m[1]);
      if (!e) return send(res, 404, { error: 'Employee not found' });
      e.token = crypto.randomBytes(18).toString('base64url');
      save();
      return send(res, 200, { employee: empView(e) });
    }

    // ----- attendance log -----
    if (p === '/api/punches' && method === 'GET') {
      const day = url.searchParams.get('day');
      const emp = url.searchParams.get('employeeId');
      const month = url.searchParams.get('month');
      let list = data.punches;
      if (isDay(day)) list = list.filter((x) => x.day === day);
      if (emp) list = list.filter((x) => x.employeeId === emp);
      if (/^\d{4}-\d{2}$/.test(month || '')) list = list.filter((x) => x.day.startsWith(month));
      return send(res, 200, { punches: [...list].sort((a, b) => b.in.localeCompare(a.in)).slice(0, 1000).map(punchView) });
    }
    if (p === '/api/punches' && method === 'POST') {
      const body = await readJson(req);
      const e = employee(body.employeeId);
      if (!e || !isDay(body.day) || !isTime(body.in)) return send(res, 400, { error: 'employee, day and check-in time are required' });
      const x = { id: crypto.randomUUID(), employeeId: e.id, day: body.day, in: '', out: null, via: 'admin', note: clean(body.note, 200), edited: true };
      const err = setTimes(x, body.day, body.in, body.out);
      if (err) return send(res, 400, { error: err });
      data.punches.push(x);
      save();
      return send(res, 200, { punch: punchView(x) });
    }
    if ((m = p.match(/^\/api\/punches\/([\w-]+)$/))) {
      const x = data.punches.find((y) => y.id === m[1]);
      if (!x) return send(res, 404, { error: 'Not found' });
      if (method === 'PUT') {
        const body = await readJson(req);
        const err = setTimes(x, x.day, body.in || localParts(Date.parse(x.in), tz()).hm, body.out === undefined ? (x.out ? localParts(Date.parse(x.out), tz()).hm : '') : body.out);
        if (err) return send(res, 400, { error: err });
        if (typeof body.note === 'string') x.note = clean(body.note, 200);
        x.edited = true;
        save();
        return send(res, 200, { punch: punchView(x) });
      }
      if (method === 'DELETE') { data.punches = data.punches.filter((y) => y.id !== x.id); save(); return send(res, 200, { ok: true }); }
    }

    // ----- leave -----
    if (p === '/api/leaves' && method === 'GET') return send(res, 200, { leaves: [...data.leaves].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500).map((l) => ({ ...l, name: employee(l.employeeId)?.name || '—', days: daysBetween(l.from, l.to) })) });
    if (p === '/api/leaves' && method === 'POST') {
      const body = await readJson(req);
      const e = employee(body.employeeId);
      if (!e || !isDay(body.from) || !isDay(body.to || body.from) || (body.to || body.from) < body.from) return send(res, 400, { error: 'employee and dates are required' });
      const l = { id: crypto.randomUUID(), employeeId: e.id, from: body.from, to: body.to || body.from, type: LEAVE_TYPES.includes(body.type) ? body.type : 'annual', reason: clean(body.reason, 300), status: 'approved', createdAt: new Date().toISOString(), decidedAt: new Date().toISOString() };
      data.leaves.push(l);
      save();
      return send(res, 200, { leave: l });
    }
    if ((m = p.match(/^\/api\/leaves\/([\w-]+)$/))) {
      const l = data.leaves.find((x) => x.id === m[1]);
      if (!l) return send(res, 404, { error: 'Not found' });
      if (method === 'PUT') {
        const body = await readJson(req);
        if (['approved', 'rejected', 'pending'].includes(body.status)) { l.status = body.status; l.decidedAt = new Date().toISOString(); }
        if (LEAVE_TYPES.includes(body.type)) l.type = body.type;
        save();
        return send(res, 200, { leave: l });
      }
      if (method === 'DELETE') { data.leaves = data.leaves.filter((x) => x.id !== l.id); save(); return send(res, 200, { ok: true }); }
    }

    // ----- payroll -----
    if (p === '/api/payroll' && method === 'GET') {
      const month = /^\d{4}-\d{2}$/.test(url.searchParams.get('month') || '') ? url.searchParams.get('month') : thisMonth();
      const rows = data.employees.filter((e) => e.active !== false || data.punches.some((x) => x.employeeId === e.id && x.day.startsWith(month))).map((e) => ({ id: e.id, name: e.name, title: e.title, ...report(e, month) }));
      const total = Math.round(rows.reduce((s, r) => s + r.net, 0) * 100) / 100;
      return send(res, 200, { month, currency: data.settings.currency, rows, total, adjustments: data.adjustments.filter((a) => a.month === month).map((a) => ({ ...a, name: employee(a.employeeId)?.name || '—' })) });
    }
    if (p === '/api/payroll.csv' && method === 'GET') {
      const month = /^\d{4}-\d{2}$/.test(url.searchParams.get('month') || '') ? url.searchParams.get('month') : thisMonth();
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const head = ['name', 'title', 'workdays', 'present', 'absent', 'leave_days', 'unpaid_leave_days', 'late_minutes', 'worked_hours', 'overtime_hours', 'salary', 'absence_deduction', 'late_deduction', 'overtime_pay', 'bonuses', 'deductions', 'advances', 'net'];
      const rows = [head.join(',')];
      for (const e of data.employees) {
        const r = report(e, month);
        if (e.active === false && !r.present) continue;
        rows.push([e.name, e.title, r.workdays, r.present, r.absent, r.leaveDays, r.unpaidDays, r.lateMinutes, r.workedHours, r.overtimeHours, r.salary, r.absenceDeduction, r.lateDeduction, r.overtimePay, r.bonuses, r.deductions, r.advances, r.net].map(q).join(','));
      }
      return send(res, 200, '﻿' + rows.join('\n'), { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="hader-payroll-${month}.csv"` });
    }
    if (p === '/api/adjustments' && method === 'POST') {
      const body = await readJson(req);
      const e = employee(body.employeeId);
      const amount = Math.round(Number(body.amount) * 100) / 100;
      if (!e || !(amount > 0) || !/^\d{4}-\d{2}$/.test(body.month || '') || !['bonus', 'deduction', 'advance'].includes(body.type)) return send(res, 400, { error: 'employee, month, type and amount are required' });
      const a = { id: crypto.randomUUID(), employeeId: e.id, month: body.month, type: body.type, amount, note: clean(body.note, 200), at: new Date().toISOString() };
      data.adjustments.push(a);
      save();
      return send(res, 200, { adjustment: a });
    }
    if ((m = p.match(/^\/api\/adjustments\/([\w-]+)$/)) && method === 'DELETE') {
      data.adjustments = data.adjustments.filter((x) => x.id !== m[1]);
      save();
      return send(res, 200, { ok: true });
    }

    // ----- settings -----
    if (p === '/api/settings' && method === 'GET') { const { kioskKey, ...s } = data.settings; return send(res, 200, { settings: s, timezone: tz() }); }
    if (p === '/api/settings' && method === 'PUT') {
      const b = (await readJson(req)).settings || {};
      const s = data.settings;
      for (const k of ['businessName', 'timezone', 'currency']) if (typeof b[k] === 'string') s[k] = clean(b[k], 80);
      if (b.lang === 'ar' || b.lang === 'en') s.lang = b.lang;
      if (Array.isArray(b.workDays)) s.workDays = [...new Set(b.workDays.map(Number).filter((d) => d >= 0 && d <= 6))];
      if (isTime(b.shiftStart)) s.shiftStart = b.shiftStart.padStart(5, '0');
      if (isTime(b.shiftEnd)) s.shiftEnd = b.shiftEnd.padStart(5, '0');
      if (b.graceMinutes != null) s.graceMinutes = Math.min(120, Math.max(0, Number(b.graceMinutes) || 0));
      if (b.monthDays != null) s.monthDays = Math.min(31, Math.max(20, Number(b.monthDays) || 30));
      if (b.overtimeRate != null) s.overtimeRate = Math.min(5, Math.max(1, Number(b.overtimeRate) || 1));
      if (b.codeTtlSeconds != null) s.codeTtlSeconds = Math.min(600, Math.max(20, Number(b.codeTtlSeconds) || 60));
      for (const k of ['deductLate', 'deductAbsence', 'payOvertime', 'allowPin']) if (typeof b[k] === 'boolean') s[k] = b[k];
      save();
      const { kioskKey, ...out } = s;
      return send(res, 200, { settings: out });
    }
    if (p === '/api/kiosk/reset' && method === 'POST') {
      data.settings.kioskKey = crypto.randomBytes(16).toString('hex');
      save();
      return send(res, 200, { ok: true });
    }
    if (p === '/api/password' && method === 'POST') {
      const body = await readJson(req);
      if (!verifyPassword(String(body.current || ''), data.admin)) return send(res, 401, { error: 'Current password is wrong' });
      if (String(body.next || '').length < 8) return send(res, 400, { error: 'New password must be at least 8 characters' });
      data.admin = hashPassword(String(body.next));
      flush();
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    return send(res, 404, { error: 'Not found' });
  }

  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5) + 1; }

  /** Sets punch times from local HH:MM on a local day. A check-out earlier than check-in is the next day (night shift). */
  function setTimes(x, day, inHm, outHm) {
    if (!isTime(inHm) || (outHm && !isTime(outHm))) return 'Use HH:MM times';
    x.in = new Date(zonedToUtc(day, inHm, tz())).toISOString();
    x.out = outHm ? new Date(zonedToUtc(toMin(outHm) <= toMin(inHm) ? addDays(day, 1) : day, outHm, tz())).toISOString() : null;
    x.day = day;
    x.closed = false;
    return null;
  }

  function applyEmployee(e, b) {
    if (typeof b.name === 'string') e.name = clean(b.name, 80);
    if (typeof b.phone === 'string') e.phone = clean(b.phone, 30);
    if (typeof b.title === 'string') e.title = clean(b.title, 80);
    if (b.salary != null) e.salary = Math.max(0, Math.round(Number(b.salary) * 100) / 100 || 0);
    if (b.shiftStart !== undefined) e.shiftStart = isTime(b.shiftStart) ? b.shiftStart.padStart(5, '0') : '';
    if (b.shiftEnd !== undefined) e.shiftEnd = isTime(b.shiftEnd) ? b.shiftEnd.padStart(5, '0') : '';
    if (b.workDays !== undefined) e.workDays = Array.isArray(b.workDays) && b.workDays.length ? [...new Set(b.workDays.map(Number).filter((d) => d >= 0 && d <= 6))] : null;
    if (typeof b.active === 'boolean') e.active = b.active;
    if (b.pin !== undefined && String(b.pin) !== e.pin) {
      const pin = String(b.pin);
      if (!/^\d{4,6}$/.test(pin)) return 'PIN must be 4 to 6 digits';
      if (!uniquePin(pin, e.id)) return 'Another employee has this PIN';
      e.pin = pin;
    }
    return null;
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((err) => {
      const status = err.status || 500;
      if (status === 500) console.error('[http]', err);
      if (!res.headersSent) send(res, status, { error: status === 500 ? 'Internal error' : err.message });
    });
  });

  return {
    resetDemo,
    server,
    data,
    punch,
    report,
    async start(port) {
      await new Promise((r) => server.listen(port, r));
      return server.address().port;
    },
    async stop() {
      clearInterval(demoTimer);
      flush();
      await new Promise((r) => server.close(r));
    },
  };
}
