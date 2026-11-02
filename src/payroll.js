// Time helpers and the monthly attendance + payroll report.

/** Local calendar parts of a moment in a time zone. */
export function localParts(ts, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  const minutes = Number(p.hour) * 60 + Number(p.minute);
  return { date: `${p.year}-${p.month}-${p.day}`, month: `${p.year}-${p.month}`, minutes, hm: `${p.hour}:${p.minute}`, weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
export const toMin = (hm) => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + (m || 0); };
export const weekdayOf = (date) => new Date(date + 'T12:00:00Z').getUTCDay();
const round2 = (n) => Math.round(n * 100) / 100;

/** The UTC moment when the clock in `tz` shows `hm` on `day` (two passes handle daylight saving). */
export function zonedToUtc(day, hm, tz) {
  const want = Date.parse(`${day}T00:00:00Z`) + toMin(hm) * 60_000;
  let guess = want;
  for (let i = 0; i < 2; i++) {
    const L = localParts(guess, tz);
    const seen = Date.parse(`${L.date}T00:00:00Z`) + L.minutes * 60_000;
    guess += want - seen;
  }
  return guess;
}

export function addDays(day, n) { return new Date(Date.parse(day + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }

/**
 * Attendance and pay for one employee and one month.
 * Days are counted up to today; today counts as absent only after the shift has ended.
 */
export function monthReport({ employee, month, settings, punches, leaves, adjustments, schedule, tz, now = Date.now() }) {
  const start = toMin(schedule.start);
  let shiftLen = toMin(schedule.end) - start;
  if (shiftLen <= 0) shiftLen += 1440;
  const today = localParts(now, tz);
  const first = `${month}-01`;
  const daysInMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const joined = employee.createdAt ? localParts(Date.parse(employee.createdAt), tz).date : first;

  let workdays = 0, present = 0, absent = 0, leaveDays = 0, unpaidDays = 0, lateDays = 0, lateMinutes = 0, workedMinutes = 0, overtimeMinutes = 0, missingOut = 0;
  const days = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = addDays(first, i);
    if (d > today.date) break;
    if (d < joined) continue;
    const workday = schedule.days.includes(weekdayOf(d));
    if (workday) workdays += 1;
    const mine = punches.filter((p) => p.day === d).sort((a, b) => a.in.localeCompare(b.in));
    const leave = leaves.find((l) => l.from <= d && l.to >= d);
    const row = { date: d, workday, state: '', in: mine[0]?.in || null, out: mine.filter((p) => p.out).at(-1)?.out || null, late: 0, worked: 0 };
    if (mine.length) {
      present += 1;
      row.state = 'present';
      const late = localParts(Date.parse(mine[0].in), tz).minutes - start;
      if (workday && late > settings.graceMinutes) { lateDays += 1; lateMinutes += late; row.late = late; }
      for (const p of mine) {
        if (p.out) row.worked += Math.max(0, (Date.parse(p.out) - Date.parse(p.in)) / 60_000);
        else if (d === today.date && !p.closed) row.worked += Math.max(0, (now - Date.parse(p.in)) / 60_000);
        else missingOut += 1;
      }
      row.worked = Math.round(row.worked);
      workedMinutes += row.worked;
      // A few minutes past the end of the shift are not overtime: it starts after the grace period.
      const extra = workday ? row.worked - shiftLen : row.worked;
      if (extra > settings.graceMinutes) overtimeMinutes += extra;
    } else if (leave) {
      row.state = workday ? 'leave' : 'off';
      if (workday) { leaveDays += 1; if (leave.type === 'unpaid') unpaidDays += 1; }
    } else if (workday) {
      const shiftOver = d < today.date || today.minutes > start + shiftLen;
      row.state = shiftOver ? 'absent' : 'expected';
      if (shiftOver) absent += 1;
    } else row.state = 'off';
    days.push(row);
  }

  // Joined during this month: the salary covers only the days since joining.
  const salary = joined > first && joined.startsWith(month) ? round2((employee.salary * (daysInMonth - Number(joined.slice(8)) + 1)) / daysInMonth) : Number(employee.salary) || 0;
  const dayRate = (Number(employee.salary) || 0) / (settings.monthDays || 30);
  const minuteRate = dayRate / shiftLen;
  const absenceDeduction = round2(((settings.deductAbsence ? absent : 0) + unpaidDays) * dayRate);
  const lateDeduction = round2(settings.deductLate ? lateMinutes * minuteRate : 0);
  const overtimePay = round2(settings.payOvertime ? overtimeMinutes * minuteRate * (settings.overtimeRate || 1) : 0);
  const sum = (type) => round2(adjustments.filter((a) => a.type === type).reduce((s, a) => s + a.amount, 0));
  const bonuses = sum('bonus'), deductions = sum('deduction'), advances = sum('advance');
  const net = round2(salary - absenceDeduction - lateDeduction + overtimePay + bonuses - deductions - advances);
  return {
    month, workdays, present, absent, leaveDays, unpaidDays, lateDays, lateMinutes, missingOut,
    workedHours: Math.round(workedMinutes / 6) / 10, overtimeHours: Math.round(overtimeMinutes / 6) / 10,
    salary, dayRate: round2(dayRate), absenceDeduction, lateDeduction, overtimePay, bonuses, deductions, advances, net, days,
  };
}
