import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthReport, zonedToUtc, localParts } from '../src/payroll.js';

const settings = { graceMinutes: 15, monthDays: 30, deductLate: true, deductAbsence: true, payOvertime: true, overtimeRate: 1.5 };
const schedule = { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }; // Mon–Fri, 8 hours
const tz = 'Africa/Cairo';
const at = (day, hm) => new Date(zonedToUtc(day, hm, tz)).toISOString();

test('zonedToUtc gives the moment the local clock shows that time', () => {
  const iso = at('2026-07-15', '09:00');
  assert.equal(localParts(Date.parse(iso), tz).hm, '09:00');
  assert.equal(localParts(Date.parse(at('2026-01-15', '23:30')), tz).date, '2026-01-15');
});

test('a month: present, late, absent, unpaid leave, overtime, adjustments', () => {
  // June 2026: Mon 1 … Fri 5, Mon 8 … Fri 12 (report cut at 12 June evening).
  const punches = [
    { day: '2026-06-01', in: at('2026-06-01', '09:05'), out: at('2026-06-01', '17:00') }, // within grace
    { day: '2026-06-02', in: at('2026-06-02', '09:40'), out: at('2026-06-02', '17:00') }, // 40 min late
    { day: '2026-06-03', in: at('2026-06-03', '09:00'), out: at('2026-06-03', '19:00') }, // 2h overtime
    // 4th: absent
    { day: '2026-06-05', in: at('2026-06-05', '09:00'), out: at('2026-06-05', '17:00') },
    { day: '2026-06-06', in: at('2026-06-06', '10:00'), out: at('2026-06-06', '13:00') }, // Saturday: all overtime
    // 8th: unpaid leave, 9th: sick leave
    { day: '2026-06-10', in: at('2026-06-10', '09:00'), out: null, closed: true }, // forgot to check out
    { day: '2026-06-11', in: at('2026-06-11', '09:00'), out: at('2026-06-11', '17:00') },
    { day: '2026-06-12', in: at('2026-06-12', '09:00'), out: at('2026-06-12', '17:00') },
  ];
  const leaves = [{ from: '2026-06-08', to: '2026-06-08', type: 'unpaid' }, { from: '2026-06-09', to: '2026-06-09', type: 'sick' }];
  const adjustments = [{ type: 'bonus', amount: 500 }, { type: 'advance', amount: 1000 }];
  const r = monthReport({ employee: { salary: 9000, createdAt: '2026-01-01T00:00:00Z' }, month: '2026-06', settings, punches, leaves, adjustments, schedule, tz, now: Date.parse(at('2026-06-12', '20:00')) });
  assert.equal(r.workdays, 10);
  assert.equal(r.present, 8);
  assert.equal(r.absent, 1);
  assert.equal(r.leaveDays, 2);
  assert.equal(r.unpaidDays, 1);
  assert.equal(r.lateDays, 1);
  assert.equal(r.lateMinutes, 40);
  assert.equal(r.missingOut, 1);
  assert.equal(r.overtimeHours, 5, '2h on Wednesday + 3h on Saturday');
  // Day rate 300, minute rate 300/480 = 0.625
  assert.equal(r.absenceDeduction, 600, 'one absence + one unpaid day');
  assert.equal(r.lateDeduction, 25);
  assert.equal(r.overtimePay, 281.25, '300 min × 0.625 × 1.5');
  assert.equal(r.net, 9000 - 600 - 25 + 281.25 + 500 - 1000);
});

test('today is not absent before the shift ends; joining mid-month pro-rates the salary', () => {
  const r = monthReport({ employee: { salary: 3000, createdAt: at('2026-06-16', '08:00') }, month: '2026-06', settings: { ...settings, payOvertime: false }, punches: [], leaves: [], adjustments: [], schedule, tz, now: Date.parse(at('2026-06-16', '12:00')) });
  assert.equal(r.absent, 0);
  assert.equal(r.salary, 1500, '15 of 30 days');
});
