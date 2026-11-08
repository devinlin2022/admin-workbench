// dashboard.js — 工作看板：日历(农历/节假日) + 今日待办 + 会议室状态 + 行政资讯 + 到期雷达
import { load, save } from '../store.js';
import { esc, today, daysUntil, fmtMoney } from '../util.js';

let calOffset = 0; // 相对当前月的偏移

function lunarInfo(y, m, d) {
  try {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const fest = lunar.getFestivals().concat(solar.getFestivals());
    if (fest.length) return { text: fest[0], fest: true };
    return { text: lunar.getDayInChinese() === '初一' ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese(), fest: false };
  } catch { return { text: '', fest: false }; }
}

// 2026 年法定节假日安排（国办 2025-11-04 发布，vendor 库未内置 2026 数据，此处覆盖补充）
const HOLIDAYS_2026 = {};
[
  ['元旦节', '2026-01-01', '2026-01-03', 0], ['元旦节调休', '2026-01-04', '2026-01-04', 1],
  ['春节', '2026-02-15', '2026-02-23', 0], ['春节调休', '2026-02-14', '2026-02-14', 1], ['春节调休', '2026-02-28', '2026-02-28', 1],
  ['清明节', '2026-04-04', '2026-04-06', 0],
  ['劳动节', '2026-05-01', '2026-05-05', 0], ['劳动节调休', '2026-05-09', '2026-05-09', 1],
  ['端午节', '2026-06-19', '2026-06-21', 0],
  ['中秋节', '2026-09-25', '2026-09-27', 0],
  ['国庆节', '2026-10-01', '2026-10-07', 0], ['国庆节调休', '2026-09-20', '2026-09-20', 1], ['国庆节调休', '2026-10-10', '2026-10-10', 1],
].forEach(([name, from, to, work]) => {
  const d = new Date(from), end = new Date(to);
  while (d <= end) { HOLIDAYS_2026[d.toISOString().slice(0, 10)] = { name, work }; d.setDate(d.getDate() + 1); }
});

function holidayInfo(y, m, d) {
  const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (HOLIDAYS_2026[ds]) { const h = HOLIDAYS_2026[ds]; return { getName: () => h.name, isWork: () => !!h.work }; }
  try { return HolidayUtil.getHoliday(y, m, d); } catch { return null; }
}

function renderCalendar() {
  const base = new Date();
  base.setMonth(base.getMonth() + calOffset, 1);
  const y = base.getFullYear(), m = base.getMonth(); // 0-based
  const first = new Date(y, m, 1);
  const startDay = first.getDay(); // 0=Sun
  const daysIn = new Date(y, m + 1, 0).getDate();
  const daysPrev = new Date(y, m, 0).getDate();
  const t = today();

  let cells = '';
  for (let i = startDay - 1; i >= 0; i--) {
    cells += `<div class="cal-cell other"><div class="d">${daysPrev - i}</div><div class="l"></div></div>`;
  }
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const li = lunarInfo(y, m + 1, d);
    const hol = holidayInfo(y, m + 1, d);
    const wd = new Date(y, m, d).getDay();
    const cls = ['cal-cell'];
    if (ds === t) cls.push('today');
    if (hol && !hol.isWork()) cls.push('holiday');
    if (wd === 0 || wd === 6) cls.push('weekend');
    const ltext = hol ? (hol.isWork() ? '班·' + hol.getName().replace(/节.*/, '节') : hol.getName()) : li.text;
    cells += `<div class="${cls.join(' ')}"><div class="d">${d}</div><div class="l">${esc(ltext)}</div></div>`;
  }
  const total = startDay + daysIn;
  const tail = (7 - total % 7) % 7;
  for (let d = 1; d <= tail; d++) {
    cells += `<div class="cal-cell other"><div class="d">${d}</div><div class="l"></div></div>`;
  }

  const wdHead = ['日', '一', '二', '三', '四', '五', '六'].map(w => `<div class="cal-wd">${w}</div>`).join('');
  return `
    <div class="cal-head">
      <button class="btn btn-sm" id="calPrev">‹</button>
      <span class="m">${y} 年 ${m + 1} 月</span>
      <button class="btn btn-sm" id="calNext">›</button>
      <button class="btn btn-sm btn-ghost" id="calToday">回到今天</button>
    </div>
    <div class="cal-grid">${wdHead}${cells}</div>`;
}

function radarHTML(s) {
  const items = [];
  s.contracts.forEach(c => {
    const n = daysUntil(c.endDate);
    if (n !== null && n <= 30) items.push({ label: `合同「${c.name}」`, n, link: '#/contracts', badge: n < 0 ? 'b-brick' : 'b-amber', text: n < 0 ? `已到期 ${-n} 天` : (n === 0 ? '今天到期' : `${n} 天后到期`) });
  });
  s.todos.filter(x => x.status !== 'done').forEach(x => {
    const n = daysUntil(x.due);
    if (n !== null && n <= 1) items.push({ label: `待办「${x.title}」`, n, link: '#/todo', badge: n < 0 ? 'b-brick' : 'b-amber', text: n < 0 ? `已逾期 ${-n} 天` : (n === 0 ? '今天截止' : '明天截止') });
  });
  (s.logistics.maintenance || []).forEach(x => {
    const n = daysUntil(x.nextDate);
    if (n !== null && n <= 30) items.push({ label: `设备保养「${x.item}」`, n, link: '#/logistics', badge: n < 0 ? 'b-brick' : 'b-amber', text: n < 0 ? `已超期 ${-n} 天` : `${n} 天后到期` });
  });
  s.activities.forEach(a => {
    const n = daysUntil(a.date);
    if (n !== null && n >= 0 && n <= 30 && a.status !== '已完成') items.push({ label: `活动「${a.name}」`, n, link: '#/activities', badge: 'b-amber', text: n === 0 ? '就是今天' : `${n} 天后举办` });
  });
  items.sort((a, b) => a.n - b.n);
  if (!items.length) return '<div class="empty">未来 30 天没有临近到期事项 🎉</div>';
  return items.map(i => `<div class="radar-item"><span class="badge ${i.badge}">${i.text}</span><span>${esc(i.label)}</span><a class="link-btn" style="margin-left:auto" href="${i.link}">去处理 →</a></div>`).join('');
}

function todoMiniHTML(s) {
  const t = today();
  const list = s.todos.filter(x => x.status !== 'done' && (!x.due || x.due <= t)).slice(0, 8);
  if (!list.length) return '<div class="empty">今日暂无待办</div>';
  return `<div class="todo-mini">${list.map(x => `
    <label class="t-item ${x.status === 'done' ? 'done' : ''}">
      <input type="checkbox" class="chk" data-todo="${x.id}">
      <span>${esc(x.title)}</span>
      <span class="due">${x.due === t ? '今天' : esc(x.due)}</span>
    </label>`).join('')}</div>
    <div style="margin-top:8px"><a class="link-btn" href="#/todo">查看全部待办 →</a></div>`;
}

function roomsHTML(s) {
  return `<div class="room-list">${s.rooms.map(r => `
    <div class="room-item">
      <span class="badge ${r.status === 'free' ? 'b-green' : 'b-brick'}">${r.status === 'free' ? '空闲' : '使用中'}</span>
      <span class="name">${esc(r.name)}</span>
      <span class="next">${esc(r.next || (r.status === 'free' ? '现在可预约' : ''))}</span>
      <button class="link-btn" data-room="${r.id}">${r.status === 'free' ? '登记使用' : '释放'}</button>
    </div>`).join('')}</div>
    <div class="muted" style="margin-top:8px">会议室状态为手工登记。如需对接企业微信/飞书日历，可在后续版本接入 API。</div>`;
}

async function loadNews(s) {
  const box = document.getElementById('newsList');
  const fallback = () => {
    box.innerHTML = `
      <a class="news-item" href="https://www.gov.cn/zhengce/zuixin/" target="_blank" rel="noopener"><span class="badge b-blue tag">政策</span><span>最新政策发布（中国政府网）</span><span class="time">官方</span></a>
      <a class="news-item" href="http://www.mohrss.gov.cn/" target="_blank" rel="noopener"><span class="badge b-blue tag">社保</span><span>人力资源和社会保障部 · 社保公积金政策</span><span class="time">官方</span></a>
      <a class="news-item" href="https://www.chinatax.gov.cn/" target="_blank" rel="noopener"><span class="badge b-blue tag">税务</span><span>国家税务总局 · 最新税费政策</span><span class="time">官方</span></a>
      <div class="muted" style="padding:6px">💡 点右上角「⚙ 订阅源」填入 RSS 地址（如行政类公众号/资讯站的 feed），即可自动拉取最新行政资讯。</div>`;
  };
  if (!s.settings.rssUrl) { fallback(); return; }
  try {
    const r = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(s.settings.rssUrl));
    const j = await r.json();
    if (j.status !== 'ok') throw 0;
    box.innerHTML = j.items.slice(0, 8).map(it => `
      <a class="news-item" href="${esc(it.link)}" target="_blank" rel="noopener"><span class="badge b-blue tag">资讯</span><span>${esc(it.title)}</span><span class="time">${esc((it.pubDate || '').slice(0, 10))}</span></a>`).join('');
  } catch { fallback(); }
}

export function render(root) {
  const s = load();
  root.innerHTML = `
    <div class="page-head"><h2>工作看板</h2><span class="desc">${today()} · 今天也要元气满满</span></div>
    <div class="dash-grid">
      <div class="col">
        <div class="card"><div class="card-title">📅 日历 <span class="right">农历 · 法定节假日</span></div>${renderCalendar()}</div>
        <div class="card"><div class="card-title">⚡ 到期雷达 <span class="right">未来 30 天合同 / 保养 / 活动 / 逾期待办</span></div>${radarHTML(s)}</div>
      </div>
      <div class="col">
        <div class="card"><div class="card-title">✅ 今日待办</div>${todoMiniHTML(s)}</div>
        <div class="card"><div class="card-title">🚪 会议室实时状态</div>${roomsHTML(s)}</div>
        <div class="card"><div class="card-title">📰 行政资讯 <span class="right"><button class="link-btn" id="rssCfg">⚙ 订阅源</button></span></div><div class="news-list" id="newsList"><div class="empty">加载中…</div></div></div>
      </div>
    </div>`;

  root.querySelector('#calPrev').onclick = () => { calOffset--; render(root); };
  root.querySelector('#calNext').onclick = () => { calOffset++; render(root); };
  root.querySelector('#calToday').onclick = () => { calOffset = 0; render(root); };

  root.querySelectorAll('[data-todo]').forEach(chk => chk.onchange = () => {
    const t = s.todos.find(x => x.id === chk.dataset.todo);
    if (t) { t.status = 'done'; save(); render(root); }
  });

  root.querySelectorAll('[data-room]').forEach(btn => btn.onclick = () => {
    const r = s.rooms.find(x => x.id === btn.dataset.room);
    if (!r) return;
    if (r.status === 'free') {
      const next = prompt('登记使用事由（如：项目评审 14:00-15:00）', '');
      if (next !== null) { r.status = 'busy'; r.next = '进行中 · ' + (next || '临时会议'); }
    } else { r.status = 'free'; r.next = ''; }
    save(); render(root);
  });

  root.querySelector('#rssCfg').onclick = () => {
    const v = prompt('填写 RSS 订阅地址（留空则使用默认官方政策入口）：', s.settings.rssUrl || '');
    if (v === null) return;
    s.settings.rssUrl = v.trim(); save(); toast(s.settings.rssUrl ? '已保存订阅源，正在拉取…' : '已清空订阅源');
    loadNews(s);
  };

  loadNews(s);
}
