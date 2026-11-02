/* Hader owner dashboard */
(function () {
  'use strict';
  const STR = {
    ar: {
      overview: 'النهارده', employees: 'الموظفين', log: 'سجل الحضور', leaves: 'الإجازات', payroll: 'المرتبات', settings: 'الإعدادات', kiosk: 'شاشة الحضور ↗', logout: 'خروج', lang: 'English',
      setupTitle: 'أهلاً بيك في حاضر', setupLead: 'حضور وانصراف الموظفين بكود QR بيتغير كل دقيقة، وإجازات، ومرتبات محسوبة لوحدها.', biz: 'اسم الشركة', password: 'كلمة السر', pwHint: '8 حروف على الأقل', start: 'ابدأ', loginTitle: 'تسجيل الدخول', login: 'دخول',
      s_in: 'موجود', s_out: 'انصرف', s_absent: 'غايب', s_leave: 'إجازة', s_off: 'يوم راحة', s_expected: 'لسه مجاش', late: 'متأخر', min: 'د', since: 'من', total: 'الموظفين', pendingLeaves: 'طلبات إجازة مستنية', recent: 'آخر حركة', checkin: 'حضور', checkout: 'انصراف',
      howTitle: 'إزاي تبدأ', how: ['ضيف الموظفين، وكل واحد بياخد رابط شخصي ورقم سري', 'افتح «شاشة الحضور» على تابلت عند الباب واضغط «استخدم الجهاز ده»', 'الموظف يفتح رابطه مرة واحدة على موبايله، وبعد كده يمسح الكود اللي على الشاشة', 'آخر الشهر افتح «المرتبات»: الغياب والتأخير والإضافي محسوبين'],
      name: 'الاسم', phone: 'الموبايل', title: 'الوظيفة', salary: 'المرتب الشهري', pin: 'الرقم السري', shift: 'الشيفت', shiftStart: 'من', shiftEnd: 'لحد', workDays: 'أيام الشغل', default: 'زي الإعدادات العامة', add: 'إضافة موظف', save: 'حفظ', del: 'إيقاف', saved: 'اتحفظ ✓', link: 'الرابط الشخصي', newLink: 'رابط جديد', linkHelp: 'ابعت الرابط ده للموظف أو خليه يمسح الكود. بيفتحه مرة واحدة على موبايله.', close: 'إغلاق', edit: 'تعديل', inactive: 'موقوف', wa: 'ابعته واتساب', waMsg: 'أهلاً {n}، ده رابط الحضور بتاعك في {b}. افتحه مرة واحدة على موبايلك: {u}',
      day: 'اليوم', in: 'حضور', out: 'انصراف', hours: 'ساعات', via: 'بـ', note: 'ملاحظة', open: 'لسه جوه', manual: 'إضافة يدوي', edited: 'متعدّل', noPunches: 'مفيش حضور في اليوم ده.', employee: 'الموظف', all: 'الكل',
      from: 'من', to: 'لحد', type: 'النوع', reason: 'السبب', status: 'الحالة', approve: 'موافقة', reject: 'رفض', t_annual: 'سنوية', t_sick: 'مرضي', t_unpaid: 'بدون مرتب', t_other: 'أخرى', st_pending: 'مستني', st_approved: 'مقبولة', st_rejected: 'مرفوضة', addLeave: 'إضافة إجازة', noLeaves: 'مفيش طلبات إجازة.', days: 'يوم',
      month: 'الشهر', present: 'حضور', absentD: 'غياب', lateM: 'تأخير (د)', worked: 'ساعات', overtime: 'إضافي (س)', deductionsC: 'خصومات', additions: 'إضافات', net: 'الصافي', totalNet: 'إجمالي المرتبات', exportCsv: 'تصدير CSV', slip: 'قسيمة', adjust: 'مكافأة / خصم / سلفة', a_bonus: 'مكافأة', a_deduction: 'خصم', a_advance: 'سلفة', amount: 'المبلغ', print: 'اطبع',
      basic: 'المرتب', absenceDed: 'خصم الغياب', lateDed: 'خصم التأخير', otPay: 'الإضافي', bonuses: 'مكافآت', deductions: 'خصومات', advances: 'سلف', workdays: 'أيام شغل', leaveDays: 'إجازات', missing: 'نسي يسجل انصراف',
      general: 'عام', tz: 'المنطقة الزمنية', currency: 'العملة', rules: 'قواعد الحساب', grace: 'سماح التأخير (دقيقة)', monthDays: 'أيام الشهر لحساب اليومية', deductLate: 'اخصم التأخير', deductAbsence: 'اخصم الغياب', payOvertime: 'احسب الإضافي', otRate: 'معامل الإضافي', allowPin: 'اسمح بالحضور بالرقم السري على الشاشة', ttl: 'الكود بيتغير كل (ثانية)', kioskReset: 'اقفل كل شاشات الحضور', kioskResetDone: 'كل الشاشات محتاجة تتربط تاني', pwTitle: 'تغيير كلمة السر', current: 'الحالية', next: 'الجديدة', change: 'تغيير',
      wd: ['أحد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت'],
    },
    en: {
      overview: 'Today', employees: 'Employees', log: 'Attendance log', leaves: 'Leave', payroll: 'Payroll', settings: 'Settings', kiosk: 'Kiosk screen ↗', logout: 'Sign out', lang: 'العربية',
      setupTitle: 'Welcome to Hader', setupLead: 'Staff check in and out with a QR code that changes every minute. Leave requests, and payroll that adds itself up.', biz: 'Company name', password: 'Password', pwHint: 'At least 8 characters', start: 'Get started', loginTitle: 'Sign in', login: 'Sign in',
      s_in: 'In', s_out: 'Left', s_absent: 'Absent', s_leave: 'On leave', s_off: 'Day off', s_expected: 'Not in yet', late: 'Late', min: 'm', since: 'since', total: 'Employees', pendingLeaves: 'Leave requests waiting', recent: 'Latest activity', checkin: 'In', checkout: 'Out',
      howTitle: 'How to start', how: ['Add your employees; each gets a personal link and a PIN', 'Open the “Kiosk screen” on a tablet by the door and press “Use this device”', 'Employees open their link once on their phone, then scan the code on the screen', 'At month end open “Payroll”: absences, lateness and overtime are counted'],
      name: 'Name', phone: 'Mobile', title: 'Job title', salary: 'Monthly salary', pin: 'PIN', shift: 'Shift', shiftStart: 'From', shiftEnd: 'To', workDays: 'Work days', default: 'Same as general settings', add: 'Add employee', save: 'Save', del: 'Deactivate', saved: 'Saved ✓', link: 'Personal link', newLink: 'New link', linkHelp: 'Send this link to the employee or let them scan the code. They open it once on their phone.', close: 'Close', edit: 'Edit', inactive: 'Inactive', wa: 'Send on WhatsApp', waMsg: 'Hi {n}, this is your attendance link at {b}. Open it once on your phone: {u}',
      day: 'Day', in: 'In', out: 'Out', hours: 'Hours', via: 'via', note: 'Note', open: 'Still in', manual: 'Add manually', edited: 'edited', noPunches: 'No attendance on this day.', employee: 'Employee', all: 'All',
      from: 'From', to: 'To', type: 'Type', reason: 'Reason', status: 'Status', approve: 'Approve', reject: 'Reject', t_annual: 'Annual', t_sick: 'Sick', t_unpaid: 'Unpaid', t_other: 'Other', st_pending: 'Waiting', st_approved: 'Approved', st_rejected: 'Rejected', addLeave: 'Add leave', noLeaves: 'No leave requests.', days: 'days',
      month: 'Month', present: 'Present', absentD: 'Absent', lateM: 'Late (min)', worked: 'Hours', overtime: 'Overtime (h)', deductionsC: 'Deductions', additions: 'Additions', net: 'Net', totalNet: 'Total payroll', exportCsv: 'Export CSV', slip: 'Payslip', adjust: 'Bonus / deduction / advance', a_bonus: 'Bonus', a_deduction: 'Deduction', a_advance: 'Advance', amount: 'Amount', print: 'Print',
      basic: 'Salary', absenceDed: 'Absence deduction', lateDed: 'Lateness deduction', otPay: 'Overtime', bonuses: 'Bonuses', deductions: 'Deductions', advances: 'Advances', workdays: 'Work days', leaveDays: 'Leave days', missing: 'Forgot to check out',
      general: 'General', tz: 'Time zone', currency: 'Currency', rules: 'Pay rules', grace: 'Grace period (minutes)', monthDays: 'Days per month for the day rate', deductLate: 'Deduct lateness', deductAbsence: 'Deduct absences', payOvertime: 'Pay overtime', otRate: 'Overtime multiplier', allowPin: 'Allow check-in with a PIN on the kiosk', ttl: 'Code changes every (seconds)', kioskReset: 'Sign out every kiosk', kioskResetDone: 'Every kiosk must be set up again', pwTitle: 'Change password', current: 'Current', next: 'New', change: 'Change',
      wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
  };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
  let lang = get('hader_lang') || 'ar';
  const t = (k) => STR[lang][k] ?? k;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  let session = null, settings = null, refreshTimer = null;
  async function api(p, opts = {}) {
    const res = await fetch(p, { method: opts.method || 'GET', headers: opts.body !== undefined ? { 'content-type': 'application/json' } : {}, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && p !== '/api/login' && p !== '/api/password') { boot(); throw new Error(data.error); }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
  const toast = (m) => { const el = $('#toast'); el.textContent = m; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); };
  const loc = () => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB');
  const time = (iso) => (iso ? new Date(iso).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit', timeZone: settings?.timezone || undefined }) : '—');
  const hm = (iso) => (iso ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: settings?.timezone || undefined }).format(new Date(iso)) : '');
  const money = (n) => Number(n || 0).toLocaleString(loc(), { maximumFractionDigits: 2 }) + ' ' + esc(settings?.currency || '');
  const thisMonth = () => new Date().toISOString().slice(0, 7);
  const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: settings?.timezone || undefined }).format(new Date());
  const statePill = (s) => `<span class="pill ${{ in: 'good', out: '', absent: 'bad', leave: 'warn', off: 'off', expected: 'off' }[s]}">${t('s_' + s)}</span>`;
  function dialog(html) {
    const d = document.createElement('dialog');
    d.innerHTML = html;
    document.body.appendChild(d);
    d.showModal();
    d.addEventListener('close', () => d.remove());
    $$('[data-close]', d).forEach((b) => (b.onclick = () => d.close()));
    return d;
  }

  async function boot() {
    clearInterval(refreshTimer);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    session = await api('/api/session').catch(() => ({}));
    if (session.needsSetup) return auth(true);
    if (!session.authed) return auth(false);
    settings = (await api('/api/settings')).settings;
    shell(); route();
  }
  function auth(setup) {
    app.innerHTML = `<div class="auth"><form class="card" id="f"><div class="brand"><img src="favicon.svg" alt="">Hader <span class="muted small">حاضر</span></div>
      <h1>${setup ? t('setupTitle') : t('loginTitle')}</h1>${setup ? `<p class="muted">${t('setupLead')}</p><label class="field" for="b">${t('biz')}<input type="text" id="b"></label>` : ''}
      <label class="field" for="pw">${t('password')} ${setup ? `<span class="hint">${t('pwHint')}</span>` : ''}<input type="password" id="pw" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
      ${setup && session.setupTokenRequired ? `<label class="field" for="st">Setup token<input type="password" id="st" class="ltr"></label>` : ''}
      <div class="err" id="err"></div><div class="row"><button class="btn primary" type="submit">${setup ? t('start') : t('login')}</button><span class="spacer"></span><button class="btn sm" type="button" id="lb">${t('lang')}</button></div></form></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; set('hader_lang', lang); boot(); };
    $('#f').onsubmit = async (e) => {
      e.preventDefault();
      try {
        if (setup) await api('/api/setup', { method: 'POST', body: { businessName: $('#b').value, password: $('#pw').value, lang, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, setupToken: $('#st')?.value } });
        else await api('/api/login', { method: 'POST', body: { password: $('#pw').value } });
        location.hash = '#overview'; boot();
      } catch (err) { $('#err').textContent = err.message; }
    };
  }
  const PAGES = ['overview', 'employees', 'log', 'leaves', 'payroll', 'settings'];
  function shell() {
    const nav = PAGES.map((p) => `<a class="nav" href="#${p}" data-page="${p}">${t(p)}${p === 'leaves' ? ' <span class="badge" id="lv" hidden></span>' : ''}</a>`).join('');
    app.innerHTML = `<div class="shell"><nav class="rail no-print"><div class="brand"><img src="favicon.svg" alt="">Hader</div>${nav}<a class="nav" href="/kiosk" target="_blank" rel="noopener">${t('kiosk')}</a>
      <div class="rail-foot"><button class="nav" id="lb" type="button">${t('lang')}</button><button class="nav" id="lo" type="button">${t('logout')}</button></div></nav>
      <nav class="mobile-nav no-print">${PAGES.filter((p) => p !== 'settings').map((p) => `<a class="nav" href="#${p}" data-page="${p}">${t(p)}</a>`).join('')}</nav><main class="main" id="main"></main></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; set('hader_lang', lang); boot(); };
    $('#lo').onclick = async () => { await api('/api/logout', { method: 'POST', body: {} }); boot(); };
  }
  const page = () => (PAGES.includes(location.hash.slice(1).split('/')[0]) ? location.hash.slice(1).split('/')[0] : 'overview');
  function route() {
    clearInterval(refreshTimer);
    $$('.nav[data-page]').forEach((a) => a.setAttribute('aria-current', a.dataset.page === page() ? 'page' : 'false'));
    ({ overview: pOverview, employees: pEmployees, log: pLog, leaves: pLeaves, payroll: pPayroll, settings: pSettings }[page()])($('#main'));
  }
  window.addEventListener('hashchange', () => session?.authed && route());
  const setBadge = (n) => { const b = $('#lv'); if (b) { b.textContent = n; b.hidden = !n; } };

  async function pOverview(main) {
    const o = await api('/api/overview');
    setBadge(o.pendingLeaves);
    const c = o.counts;
    main.innerHTML = `<div class="page">
      <div class="page-head"><div><h1>${esc(settings.businessName || 'Hader')}</h1><p>${esc(o.today)}</p></div><a class="btn primary" href="/kiosk" target="_blank" rel="noopener">${t('kiosk')}</a></div>
      <div class="grid4">
        <div class="card stat"><b>${c.in}<small class="muted"> / ${c.total}</small></b><span>${t('s_in')}</span></div>
        <div class="card stat ${c.late ? 'alert' : ''}"><b>${c.late}</b><span>${t('late')}</span></div>
        <div class="card stat ${c.absent ? 'alert' : ''}"><b>${c.absent}</b><span>${t('s_absent')} · ${t('s_expected')} ${c.expected}</span></div>
        <div class="card stat"><b>${c.leave}</b><span>${t('s_leave')}${o.pendingLeaves ? ` · <a href="#leaves">${o.pendingLeaves} ${t('pendingLeaves')}</a>` : ''}</span></div>
      </div>
      ${o.employees.length ? `<div class="people">${o.employees.map((e) => `<div class="card person"><div class="row"><b>${esc(e.name)}</b>${statePill(e.state)}</div>
        <span class="small muted">${esc(e.title)} · ${esc(e.shift)}</span>
        <span class="small">${e.firstIn ? `${t('in')} ${time(e.firstIn)}` : ''}${e.lastOut ? ` · ${t('out')} ${time(e.lastOut)}` : ''}${e.lateBy ? ` · <b style="color:var(--bad)">${t('late')} ${e.lateBy}${t('min')}</b>` : ''}${e.leaveType ? t('t_' + e.leaveType) : ''}</span></div>`).join('')}</div>` : ''}
      ${o.recent.length ? `<section class="card"><h2>${t('recent')}</h2>${o.recent.map((r) => `<div class="row small"><b>${esc(r.name)}</b><span class="pill ${r.action === 'in' ? 'good' : ''}">${t(r.action === 'in' ? 'checkin' : 'checkout')}</span><span class="muted">${time(r.at)}</span></div>`).join('')}</section>` : ''}
      <section class="card"><h2>${t('howTitle')}</h2><ol class="checklist">${t('how').map((x, i) => `<li><span class="check">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol></section>
    </div>`;
    refreshTimer = setInterval(() => { if (page() === 'overview' && !document.hidden && !$('dialog')) pOverview(main).catch(() => {}); }, 30000);
  }

  const daysPicker = (sel, name) => `<div class="days">${[6, 0, 1, 2, 3, 4, 5].map((d) => `<label><input type="checkbox" name="${name}" value="${d}" ${sel && sel.includes(d) ? 'checked' : ''}>${t('wd')[d]}</label>`).join('')}</div>`;

  async function pEmployees(main) {
    const { employees } = await api('/api/employees');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('employees')}</h1><button class="btn primary" id="add" type="button">+ ${t('add')}</button></div>
      <div class="table-wrap"><table><thead><tr><th>${t('name')}</th><th>${t('shift')}</th><th>${t('salary')}</th><th>${t('pin')}</th><th></th></tr></thead><tbody>
      ${employees.map((e) => `<tr${e.active ? '' : ' style="opacity:.55"'}><td><b>${esc(e.name)}</b>${e.active ? '' : ` <span class="pill off">${t('inactive')}</span>`}<br><span class="small muted">${esc(e.title)}</span> <span class="small muted mono" dir="ltr">${esc(e.phone)}</span></td>
        <td class="small">${esc(e.shiftStart || settings.shiftStart)}–${esc(e.shiftEnd || settings.shiftEnd)}${e.workDays ? `<br>${e.workDays.map((d) => t('wd')[d]).join('، ')}` : ''}</td><td class="num">${money(e.salary)}</td><td class="mono">${esc(e.pin)}</td>
        <td><div class="row" style="gap:6px"><button class="btn sm" data-link="${e.id}">${t('link')}</button><button class="btn sm" data-edit="${e.id}">${t('edit')}</button></div></td></tr>`).join('')}
      </tbody></table></div></div>`;
    const form = (e) => {
      const d = dialog(`<form method="dialog" id="ef" class="stack" style="min-width:min(560px,86vw)"><h2>${e ? esc(e.name) : t('add')}</h2>
        <div class="grid2"><label class="field">${t('name')}<input type="text" name="name" value="${esc(e?.name || '')}" required></label><label class="field">${t('title')}<input type="text" name="title" value="${esc(e?.title || '')}"></label></div>
        <div class="grid2"><label class="field">${t('phone')}<input type="tel" name="phone" class="ltr" value="${esc(e?.phone || '')}"></label><label class="field">${t('salary')}<input type="number" name="salary" min="0" step="any" value="${e?.salary ?? ''}"></label></div>
        <div class="grid2"><label class="field">${t('shiftStart')} <span class="hint">${t('default')}</span><input type="time" name="shiftStart" value="${esc(e?.shiftStart || '')}"></label><label class="field">${t('shiftEnd')}<input type="time" name="shiftEnd" value="${esc(e?.shiftEnd || '')}"></label></div>
        <fieldset style="border:0;padding:0"><legend class="small">${t('workDays')} <span class="hint muted">(${t('default')})</span></legend>${daysPicker(e?.workDays, 'wd')}</fieldset>
        ${e ? `<label class="field">${t('pin')}<input type="text" name="pin" class="ltr" inputmode="numeric" value="${esc(e.pin)}"></label>` : ''}
        <div class="err" id="ee"></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button>${e && e.active ? `<button class="btn danger" type="button" id="deact">${t('del')}</button>` : ''}<span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`);
      const f = $('#ef', d);
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        const wd = $$('input[name=wd]:checked', f).map((x) => Number(x.value));
        const body = { name: f.name.value, title: f.title.value, phone: f.phone.value, salary: Number(f.salary.value || 0), shiftStart: f.shiftStart.value, shiftEnd: f.shiftEnd.value, workDays: wd.length ? wd : null, ...(f.pin ? { pin: f.pin.value } : {}) };
        if (e && !e.active) body.active = true;
        try {
          if (e) await api('/api/employees/' + e.id, { method: 'PUT', body });
          else await api('/api/employees', { method: 'POST', body });
          d.close(); toast(t('saved')); pEmployees(main);
        } catch (err) { $('#ee', d).textContent = err.message; }
      };
      const da = $('#deact', d);
      if (da) da.onclick = async () => { await api('/api/employees/' + e.id, { method: 'DELETE', body: {} }); d.close(); pEmployees(main); };
    };
    $('#add').onclick = () => form(null);
    $$('[data-edit]', main).forEach((b) => (b.onclick = () => form(employees.find((x) => x.id === b.dataset.edit))));
    $$('[data-link]', main).forEach((b) => (b.onclick = () => {
      const e = employees.find((x) => x.id === b.dataset.link);
      const url = location.origin + e.link;
      const wa = e.phone ? `https://wa.me/${e.phone.replace(/\D/g, '').replace(/^0(?=1)/, '20')}?text=${encodeURIComponent(t('waMsg').replace('{n}', e.name).replace('{b}', settings.businessName).replace('{u}', url))}` : '';
      const d = dialog(`<div class="qrbox"><h2>${esc(e.name)}</h2><img src="/qr.svg?path=${encodeURIComponent(e.link)}" alt="QR"><p class="small">${t('linkHelp')}</p><span class="mono small" dir="ltr" style="word-break:break-all">${esc(url)}</span>
        <div class="row">${wa ? `<a class="btn primary" href="${wa}" target="_blank" rel="noopener">${t('wa')}</a>` : ''}<button class="btn" type="button" id="nl">${t('newLink')}</button><button class="btn" type="button" data-close>${t('close')}</button></div></div>`);
      $('#nl', d).onclick = async () => { await api(`/api/employees/${e.id}/new-link`, { method: 'POST', body: {} }); d.close(); pEmployees(main); };
    }));
  }

  async function pLog(main, q = {}) {
    const day = q.day || todayStr();
    const [{ punches }, { employees }] = await Promise.all([api('/api/punches?' + new URLSearchParams(q.employeeId ? { employeeId: q.employeeId, month: q.month || day.slice(0, 7) } : { day })), api('/api/employees')]);
    const dur = (x) => (x.out ? Math.round((Date.parse(x.out) - Date.parse(x.in)) / 360000) / 10 : '');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('log')}</h1><div class="row">
        <select id="emp" aria-label="${t('employee')}"><option value="">${t('all')}</option>${employees.map((e) => `<option value="${e.id}" ${q.employeeId === e.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
        ${q.employeeId ? `<input type="month" id="mo" value="${esc(q.month || day.slice(0, 7))}">` : `<input type="date" id="d" value="${esc(day)}">`}<button class="btn primary" id="man" type="button">+ ${t('manual')}</button></div></div>
      ${punches.length ? `<div class="table-wrap"><table><thead><tr><th>${t('employee')}</th><th>${t('day')}</th><th>${t('in')}</th><th>${t('out')}</th><th>${t('hours')}</th><th></th></tr></thead><tbody>
      ${punches.map((x) => `<tr><td><b>${esc(x.name)}</b></td><td class="small">${esc(x.day)}</td><td>${time(x.in)} <span class="small muted">${esc(x.via)}</span></td><td>${x.out ? time(x.out) : x.open ? `<span class="pill good">${t('open')}</span>` : `<span class="pill warn">${t('missing')}</span>`}</td><td class="num">${dur(x)}</td>
        <td><div class="row" style="gap:6px">${x.edited ? `<span class="small muted">${t('edited')}</span>` : ''}${x.note ? `<span class="small muted">${esc(x.note)}</span>` : ''}<button class="btn sm" data-e="${x.id}">${t('edit')}</button></div></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${t('noPunches')}</div>`}</div>`;
    const go = () => pLog(main, { employeeId: $('#emp').value, day: $('#d')?.value || day, month: $('#mo')?.value });
    $('#emp').onchange = go;
    if ($('#d')) $('#d').onchange = go;
    if ($('#mo')) $('#mo').onchange = go;
    const edit = (x) => {
      const d = dialog(`<form id="pf" class="stack" style="min-width:min(460px,86vw)"><h2>${x ? esc(x.name) + ' · ' + esc(x.day) : t('manual')}</h2>
        ${x ? '' : `<label class="field">${t('employee')}<select name="emp">${employees.filter((e) => e.active).map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></label><label class="field">${t('day')}<input type="date" name="day" value="${esc(day)}"></label>`}
        <div class="grid2"><label class="field">${t('in')}<input type="time" name="in" value="${x ? hm(x.in) : esc(settings.shiftStart)}" required></label><label class="field">${t('out')}<input type="time" name="out" value="${x ? hm(x.out) : esc(settings.shiftEnd)}"></label></div>
        <label class="field">${t('note')}<input type="text" name="note" value="${esc(x?.note || '')}"></label><div class="err" id="pe"></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button>${x ? `<button class="btn danger" type="button" id="pd">✕</button>` : ''}<span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`);
      const f = $('#pf', d);
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        try {
          if (x) await api('/api/punches/' + x.id, { method: 'PUT', body: { in: f.in.value, out: f.out.value, note: f.note.value } });
          else await api('/api/punches', { method: 'POST', body: { employeeId: f.emp.value, day: f.day.value, in: f.in.value, out: f.out.value, note: f.note.value } });
          d.close(); go();
        } catch (err) { $('#pe', d).textContent = err.message; }
      };
      if ($('#pd', d)) $('#pd', d).onclick = async () => { await api('/api/punches/' + x.id, { method: 'DELETE', body: {} }); d.close(); go(); };
    };
    $('#man').onclick = () => edit(null);
    $$('[data-e]', main).forEach((b) => (b.onclick = () => edit(punches.find((x) => x.id === b.dataset.e))));
  }

  async function pLeaves(main) {
    const [{ leaves }, { employees }] = await Promise.all([api('/api/leaves'), api('/api/employees')]);
    setBadge(leaves.filter((l) => l.status === 'pending').length);
    const types = ['annual', 'sick', 'unpaid', 'other'];
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('leaves')}</h1></div>
      ${leaves.length ? `<div class="table-wrap"><table><thead><tr><th>${t('employee')}</th><th>${t('from')} – ${t('to')}</th><th>${t('type')}</th><th>${t('reason')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
      ${leaves.map((l) => `<tr><td><b>${esc(l.name)}</b></td><td class="small">${esc(l.from)}${l.to !== l.from ? ' → ' + esc(l.to) : ''} <span class="muted">(${l.days} ${t('days')})</span></td><td>${t('t_' + l.type)}</td><td class="small">${esc(l.reason)}</td>
        <td><span class="pill ${{ pending: 'warn', approved: 'good', rejected: 'bad' }[l.status]}">${t('st_' + l.status)}</span></td>
        <td><div class="row" style="gap:6px">${l.status !== 'approved' ? `<button class="btn sm primary" data-s="approved" data-id="${l.id}">${t('approve')}</button>` : ''}${l.status !== 'rejected' ? `<button class="btn sm" data-s="rejected" data-id="${l.id}">${t('reject')}</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${t('noLeaves')}</div>`}
      <form class="card" id="lf" style="max-width:720px"><h2>${t('addLeave')}</h2><div class="grid4">
        <label class="field">${t('employee')}<select name="emp">${employees.filter((e) => e.active).map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></label>
        <label class="field">${t('from')}<input type="date" name="from" value="${todayStr()}" required></label><label class="field">${t('to')}<input type="date" name="to" value="${todayStr()}"></label>
        <label class="field">${t('type')}<select name="type">${types.map((x) => `<option value="${x}">${t('t_' + x)}</option>`).join('')}</select></label></div>
        <label class="field">${t('reason')}<input type="text" name="reason"></label><div class="row"><button class="btn primary" type="submit">${t('save')}</button></div></form></div>`;
    $$('[data-s]', main).forEach((b) => (b.onclick = async () => { await api('/api/leaves/' + b.dataset.id, { method: 'PUT', body: { status: b.dataset.s } }); pLeaves(main); }));
    const f = $('#lf');
    f.onsubmit = async (e) => { e.preventDefault(); try { await api('/api/leaves', { method: 'POST', body: { employeeId: f.emp.value, from: f.from.value, to: f.to.value, type: f.type.value, reason: f.reason.value } }); toast(t('saved')); pLeaves(main); } catch (err) { toast(err.message); } };
  }

  async function pPayroll(main, month) {
    const r = await api('/api/payroll' + (month ? '?month=' + month : ''));
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('payroll')}</h1><div class="row"><input type="month" id="mo" value="${esc(r.month)}" aria-label="${t('month')}"><a class="btn" href="/api/payroll.csv?month=${esc(r.month)}">${t('exportCsv')}</a></div></div>
      <div class="grid4"><div class="card stat"><b>${money(r.total)}</b><span>${t('totalNet')}</span></div></div>
      <div class="table-wrap"><table><thead><tr><th>${t('employee')}</th><th>${t('present')}</th><th>${t('absentD')}</th><th>${t('lateM')}</th><th>${t('worked')}</th><th>${t('overtime')}</th><th>${t('basic')}</th><th>${t('deductionsC')}</th><th>${t('additions')}</th><th>${t('net')}</th><th></th></tr></thead><tbody>
      ${r.rows.map((x) => `<tr><td><b>${esc(x.name)}</b><br><span class="small muted">${esc(x.title)}</span></td><td class="num">${x.present}/${x.workdays}</td><td class="num">${x.absent ? `<b style="color:var(--bad)">${x.absent}</b>` : 0}${x.leaveDays ? ` <span class="small muted">+${x.leaveDays} ${t('s_leave')}</span>` : ''}</td><td class="num">${x.lateMinutes}</td><td class="num">${x.workedHours}</td><td class="num">${x.overtimeHours}</td>
        <td class="num">${money(x.salary)}</td><td class="num" style="color:var(--bad)">${money(x.absenceDeduction + x.lateDeduction + x.deductions + x.advances)}</td><td class="num" style="color:var(--good)">${money(x.overtimePay + x.bonuses)}</td><td class="num"><b>${money(x.net)}</b></td>
        <td><button class="btn sm" data-slip="${x.id}">${t('slip')}</button></td></tr>`).join('')}
      </tbody></table></div>
      <form class="card" id="af" style="max-width:720px"><h2>${t('adjust')}</h2><div class="grid4">
        <label class="field">${t('employee')}<select name="emp">${r.rows.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
        <label class="field">${t('type')}<select name="type">${['bonus', 'deduction', 'advance'].map((x) => `<option value="${x}">${t('a_' + x)}</option>`).join('')}</select></label>
        <label class="field">${t('amount')}<input type="number" name="amount" min="0" step="any" required></label><label class="field">${t('note')}<input type="text" name="note"></label></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button></div>
        ${r.adjustments.length ? `<div class="stack small">${r.adjustments.map((a) => `<div class="row"><b>${esc(a.name)}</b><span>${t('a_' + a.type)}</span><span>${money(a.amount)}</span><span class="muted">${esc(a.note)}</span><button class="btn sm" type="button" data-adel="${a.id}">✕</button></div>`).join('')}</div>` : ''}</form></div>`;
    $('#mo').onchange = () => pPayroll(main, $('#mo').value);
    const f = $('#af');
    f.onsubmit = async (e) => { e.preventDefault(); try { await api('/api/adjustments', { method: 'POST', body: { employeeId: f.emp.value, month: r.month, type: f.type.value, amount: Number(f.amount.value), note: f.note.value } }); pPayroll(main, r.month); } catch (err) { toast(err.message); } };
    $$('[data-adel]', main).forEach((b) => (b.onclick = async () => { await api('/api/adjustments/' + b.dataset.adel, { method: 'DELETE', body: {} }); pPayroll(main, r.month); }));
    $$('[data-slip]', main).forEach((b) => (b.onclick = () => {
      const x = r.rows.find((y) => y.id === b.dataset.slip);
      const line = (k, v, cls = '') => `<tr><td>${t(k)}</td><td class="num ${cls}">${v}</td></tr>`;
      const d = dialog(`<div class="slip stack"><div class="row"><h2 style="margin:0">${esc(settings.businessName)} · ${t('slip')}</h2><span class="spacer"></span><span class="mono">${esc(r.month)}</span></div>
        <p style="margin:0"><b>${esc(x.name)}</b> · ${esc(x.title)}</p>
        <table><tbody>${line('workdays', x.workdays)}${line('present', x.present)}${line('absentD', x.absent)}${line('leaveDays', x.leaveDays)}${line('lateM', x.lateMinutes)}${line('worked', x.workedHours)}${line('overtime', x.overtimeHours)}${x.missingOut ? line('missing', x.missingOut) : ''}</tbody></table>
        <table><tbody>${line('basic', money(x.salary))}${x.absenceDeduction ? line('absenceDed', '− ' + money(x.absenceDeduction)) : ''}${x.lateDeduction ? line('lateDed', '− ' + money(x.lateDeduction)) : ''}${x.overtimePay ? line('otPay', '+ ' + money(x.overtimePay)) : ''}${x.bonuses ? line('bonuses', '+ ' + money(x.bonuses)) : ''}${x.deductions ? line('deductions', '− ' + money(x.deductions)) : ''}${x.advances ? line('advances', '− ' + money(x.advances)) : ''}
        <tr><td><b>${t('net')}</b></td><td class="num"><b>${money(x.net)}</b></td></tr></tbody></table>
        <div class="row no-print"><button class="btn primary" type="button" id="pp">${t('print')}</button><span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></div>`);
      $('#pp', d).onclick = () => window.print();
    }));
  }

  async function pSettings(main) {
    const { settings: s, timezone } = await api('/api/settings');
    settings = s;
    const sw = (id, on, label) => `<label class="row" for="${id}" style="justify-content:space-between">${label}<span class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}></span></label>`;
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('settings')}</h1></div>
      <form class="card" id="sf" style="max-width:760px"><h2>${t('general')}</h2>
        <div class="grid2"><label class="field" for="b">${t('biz')}<input type="text" id="b" value="${esc(s.businessName)}"></label><label class="field" for="cu">${t('currency')}<input type="text" id="cu" value="${esc(s.currency)}"></label></div>
        <div class="grid2"><label class="field" for="tz">${t('tz')}<input type="text" id="tz" class="ltr" value="${esc(s.timezone || timezone)}"></label></div>
        <h2>${t('shift')}</h2>
        <div class="grid4"><label class="field" for="ss">${t('shiftStart')}<input type="time" id="ss" value="${esc(s.shiftStart)}"></label><label class="field" for="se">${t('shiftEnd')}<input type="time" id="se" value="${esc(s.shiftEnd)}"></label><label class="field" for="gr">${t('grace')}<input type="number" id="gr" min="0" max="120" value="${s.graceMinutes}"></label></div>
        <fieldset style="border:0;padding:0"><legend class="small">${t('workDays')}</legend>${daysPicker(s.workDays, 'swd')}</fieldset>
        <h2>${t('rules')}</h2>
        ${sw('dl', s.deductLate, t('deductLate'))}${sw('da', s.deductAbsence, t('deductAbsence'))}${sw('po', s.payOvertime, t('payOvertime'))}
        <div class="grid4"><label class="field" for="md">${t('monthDays')}<input type="number" id="md" min="20" max="31" value="${s.monthDays}"></label><label class="field" for="or">${t('otRate')}<input type="number" id="or" min="1" max="5" step="0.25" value="${s.overtimeRate}"></label></div>
        <h2>${t('kiosk').replace(' ↗', '')}</h2>
        ${sw('ap', s.allowPin, t('allowPin'))}
        <div class="grid4"><label class="field" for="tt">${t('ttl')}<input type="number" id="tt" min="20" max="600" value="${s.codeTtlSeconds}"></label></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button><span class="spacer"></span><button class="btn danger" type="button" id="kr">${t('kioskReset')}</button></div></form>
      <form class="card" id="pf" style="max-width:480px"><h2>${t('pwTitle')}</h2><label class="field" for="pc">${t('current')}<input type="password" id="pc" autocomplete="current-password"></label><label class="field" for="pn">${t('next')}<input type="password" id="pn" autocomplete="new-password"></label><div class="err" id="pe"></div><div class="row"><button class="btn primary" type="submit">${t('change')}</button></div></form>
      <p class="muted small">Hader · ${esc(session.version)} · MIT</p></div>`;
    $('#sf').onsubmit = async (e) => {
      e.preventDefault();
      try {
        settings = (await api('/api/settings', { method: 'PUT', body: { settings: { businessName: $('#b').value, currency: $('#cu').value, timezone: $('#tz').value, shiftStart: $('#ss').value, shiftEnd: $('#se').value, graceMinutes: Number($('#gr').value), workDays: $$('input[name=swd]:checked').map((x) => Number(x.value)), deductLate: $('#dl').checked, deductAbsence: $('#da').checked, payOvertime: $('#po').checked, monthDays: Number($('#md').value), overtimeRate: Number($('#or').value), allowPin: $('#ap').checked, codeTtlSeconds: Number($('#tt').value) } } })).settings;
        toast(t('saved'));
      } catch (err) { toast(err.message); }
    };
    $('#kr').onclick = async () => { await api('/api/kiosk/reset', { method: 'POST', body: {} }); toast(t('kioskResetDone')); };
    $('#pf').onsubmit = async (e) => { e.preventDefault(); try { await api('/api/password', { method: 'POST', body: { current: $('#pc').value, next: $('#pn').value } }); toast(t('saved')); } catch (err) { $('#pe').textContent = err.message; } };
  }
  boot();
})();
