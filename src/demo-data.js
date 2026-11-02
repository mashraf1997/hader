import crypto from 'node:crypto';
import { defaultData } from './app.js';
import { localParts, zonedToUtc, addDays, weekdayOf } from './payroll.js';

// A small company with six people and six weeks of history: lateness, an absence, leave and a bonus.
export function buildDemo(demo) {
  const d = defaultData();
  const ar = demo.lang === 'ar';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  Object.assign(d.settings, { businessName: ar ? 'شركة النيل للتوريدات' : 'Nile Supplies', lang: demo.lang, currency: ar ? 'جنيه' : 'USD', timezone: tz, payOvertime: true }, ar ? {} : { workDays: [1, 2, 3, 4, 5] });
  const people = ar
    ? [['أحمد سمير', 'مدير مبيعات', 14000, '1111'], ['منى خالد', 'محاسبة', 11000, '2222'], ['كريم عادل', 'مندوب', 8000, '3333'], ['سارة حسن', 'خدمة عملاء', 7500, '4444'], ['يوسف علي', 'مخازن', 7000, '5555'], ['نور محمود', 'استقبال', 6500, '6666']]
    : [['Ahmed Samir', 'Sales manager', 1400, '1111'], ['Mona Khaled', 'Accountant', 1100, '2222'], ['Karim Adel', 'Sales rep', 800, '3333'], ['Sara Hassan', 'Customer care', 750, '4444'], ['Youssef Ali', 'Warehouse', 700, '5555'], ['Nour Mahmoud', 'Reception', 650, '6666']];
  const start = new Date(Date.now() - 60 * 864e5).toISOString();
  const emps = people.map(([name, title, salary, pin], i) => {
    const e = { id: crypto.randomUUID(), token: 'demo-employee-' + (i + 1), name, phone: '0100' + (2000000 + i * 1111), title, pin, salary, shiftStart: i === 4 ? '08:00' : '', shiftEnd: i === 4 ? '16:00' : '', workDays: null, active: true, createdAt: start };
    d.employees.push(e);
    return e;
  });
  const today = localParts(Date.now(), tz);
  const at = (day, min) => new Date(zonedToUtc(day, `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`, tz)).toISOString();
  const push = (e, day, inMin, outMin, via = 'qr') => d.punches.push({ id: crypto.randomUUID(), employeeId: e.id, day, in: at(day, inMin), out: outMin == null ? null : at(day, outMin), via, note: '', edited: false });
  const workDays = d.settings.workDays;
  // History: 21 days back, deterministic variety.
  for (let back = 45; back >= 1; back--) {
    const day = addDays(today.date, -back);
    if (!workDays.includes(weekdayOf(day))) continue;
    emps.forEach((e, i) => {
      if (i === 2 && back === 6) return; // one absence
      if (i === 3 && (back === 9 || back === 10)) return; // covered by leave
      const base = e.shiftStart ? 480 : 540;
      const late = (i * 7 + back * 3) % 11 === 0 ? 25 + i * 3 : (i + back) % 5 === 0 ? 8 : 0;
      const stay = (i + back) % 6 === 0 ? 75 : 0; // some overtime
      push(e, day, base - 5 + late + (i % 3), base + 480 + stay - (i % 2) * 4, i % 2 ? 'pin' : 'qr');
    });
  }
  // Today: shift has started for most.
  const nowMin = today.minutes;
  if (workDays.includes(today.weekday) && nowMin > 520) {
    push(emps[0], today.date, 532, null);
    push(emps[1], today.date, 541, null, 'pin');
    push(emps[2], today.date, Math.min(nowMin - 5, 578), null); // late
    push(emps[4], today.date, 476, nowMin > 970 ? 962 : null);
    // emps[3] is on leave today; emps[5] has not come in.
  }
  const leave = (e, from, to, type, status, reason) => d.leaves.push({ id: crypto.randomUUID(), employeeId: e.id, from, to, type, reason, status, createdAt: new Date(Date.now() - 12 * 864e5).toISOString(), decidedAt: status === 'pending' ? null : new Date().toISOString() });
  leave(emps[3], addDays(today.date, -10), addDays(today.date, -9), 'sick', 'approved', ar ? 'دور برد' : 'Flu');
  leave(emps[3], today.date, today.date, 'annual', 'approved', ar ? 'مشوار عائلي' : 'Family errand');
  leave(emps[1], addDays(today.date, 5), addDays(today.date, 7), 'annual', 'pending', ar ? 'سفر' : 'Travel');
  leave(emps[5], addDays(today.date, 2), addDays(today.date, 2), 'unpaid', 'pending', ar ? 'امتحان' : 'Exam');
  d.adjustments.push(
    { id: crypto.randomUUID(), employeeId: emps[0].id, month: today.month, type: 'bonus', amount: ar ? 1500 : 150, note: ar ? 'تارجت المبيعات' : 'Sales target', at: new Date().toISOString() },
    { id: crypto.randomUUID(), employeeId: emps[4].id, month: today.month, type: 'advance', amount: ar ? 1000 : 100, note: ar ? 'سلفة' : 'Advance', at: new Date().toISOString() },
  );
  return d;
}
