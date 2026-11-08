// main.js — 入口：路由 / 导航 / 全局搜索 / 备份还原 / 到期通知
import { load, save, exportJSON, replaceAll } from './store.js';
import { esc, toast, bindModal, download, daysUntil, today } from './util.js';
import * as dashboard from './modules/dashboard.js';
import * as todo from './modules/todo.js';
import * as templates from './modules/templates.js';
import * as policies from './modules/policies.js';
import * as contracts from './modules/contracts.js';
import * as assets from './modules/assets.js';
import * as expenses from './modules/expenses.js';
import * as logistics from './modules/logistics.js';
import * as activities from './modules/activities.js';
import * as misc from './modules/misc.js';

const MODULES = [
  { hash: '#/dashboard', name: '工作看板', ico: '📊', mod: dashboard },
  { hash: '#/todo', name: '待办事项', ico: '✅', mod: todo },
  { hash: '#/templates', name: '模板中心', ico: '📝', mod: templates },
  { hash: '#/policies', name: '制度管理', ico: '📜', mod: policies },
  { hash: '#/contracts', name: '档案管理', ico: '🗂', mod: contracts },
  { hash: '#/assets', name: '固定资产', ico: '💻', mod: assets },
  { hash: '#/expenses', name: '费用台账', ico: '💰', mod: expenses },
  { hash: '#/logistics', name: '后勤管理', ico: '🍚', mod: logistics },
  { hash: '#/activities', name: '员工活动/福利', ico: '🎉', mod: activities },
  { hash: '#/misc', name: '其他行政事务', ico: '📌', mod: misc },
];

// ===== 路由 =====
function route() {
  const h = location.hash || '#/dashboard';
  const m = MODULES.find(x => x.hash === h) || MODULES[0];
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.hash === m.hash));
  const view = document.getElementById('view');
  view.scrollTop = 0; window.scrollTo(0, 0);
  m.mod.render(view);
}

function buildNav() {
  document.getElementById('nav').innerHTML = MODULES.map(m =>
    `<div class="nav-item" data-hash="${m.hash}"><span class="ico">${m.ico}</span><span class="txt">${m.name}</span></div>`).join('');
  document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => { location.hash = n.dataset.hash; });
}

// ===== 全局搜索 (Ctrl+K) =====
function buildIndex() {
  const s = load();
  const idx = [];
  const push = (arr, hash, label, sub) => arr.forEach(x => idx.push({ hash, label: label(x), sub: sub ? sub(x) : '' }));
  push(s.todos, '#/todo', x => x.title, x => '待办');
  push(s.templates, '#/templates', x => x.name + ' ' + x.content, x => '模板 · ' + x.category);
  push(s.policies, '#/policies', x => x.name + ' ' + x.content, x => '制度 · ' + x.category);
  push(s.contracts, '#/contracts', x => x.name + ' ' + x.party + ' ' + x.no, x => '合同');
  push(s.assets, '#/assets', x => x.name + ' ' + x.no + ' ' + x.owner, x => '资产 · ' + x.category);
  push(s.expenses, '#/expenses', x => x.title + ' ' + x.category, x => '费用 · ¥' + x.amount);
  push(s.logistics.maintenance, '#/logistics', x => x.item + ' ' + (x.note || ''), () => '后勤 · 设备维护');
  push(s.logistics.emergency, '#/logistics', x => x.title + ' ' + x.content, () => '后勤 · 应急预案');
  push(s.activities, '#/activities', x => x.name + ' ' + (x.note || ''), x => '活动 · ' + x.type);
  push(s.misc, '#/misc', x => x.title + ' ' + x.content, () => '杂项');
  return idx;
}

function openSearch() {
  const mask = document.getElementById('searchModal');
  mask.classList.remove('hidden');
  const input = document.getElementById('searchInput');
  input.value = ''; doSearch('');
  input.focus();
}
function closeSearch() { document.getElementById('searchModal').classList.add('hidden'); }

function doSearch(kw) {
  const box = document.getElementById('searchResults');
  const idx = buildIndex();
  const hit = kw ? idx.filter(i => i.label.toLowerCase().includes(kw.toLowerCase())).slice(0, 20) : idx.slice(0, 10);
  box.innerHTML = hit.length
    ? hit.map((i, n) => `<div class="sr-item ${n === 0 ? 'sel' : ''}" data-hash="${i.hash}"><span>${esc(i.label.slice(0, 60))}</span><span class="from">${esc(i.sub)}</span></div>`).join('')
    : '<div class="empty">没有匹配结果</div>';
  box.querySelectorAll('.sr-item').forEach(el => el.onclick = () => { location.hash = el.dataset.hash; closeSearch(); });
}

// ===== 到期提醒（浏览器原生通知）=====
function collectDue() {
  const s = load();
  const days = s.settings.remindDays ?? 30;
  const due = [];
  s.contracts.forEach(c => { const n = daysUntil(c.endDate); if (n !== null && n <= days) due.push(`合同「${c.name}」${n < 0 ? '已到期 ' + (-n) + ' 天' : n + ' 天后到期'}`); });
  s.todos.filter(x => x.status !== 'done').forEach(x => { const n = daysUntil(x.due); if (n !== null && n <= 0) due.push(`待办「${x.title}」${n < 0 ? '已逾期 ' + (-n) + ' 天' : '今天截止'}`); });
  (s.logistics.maintenance || []).forEach(x => { const n = daysUntil(x.nextDate); if (n !== null && n <= days) due.push(`设备「${x.item}」保养${n < 0 ? '已超期' : n + ' 天后到期'}`); });
  return due;
}

async function notifyCheck() {
  const s = load();
  if (!s.settings.notifyOn || !('Notification' in window) || Notification.permission !== 'granted') return;
  const key = today();
  const due = collectDue();
  const fresh = due.filter(d => !s.notified[key + d]);
  if (!fresh.length) return;
  fresh.forEach(d => { s.notified[key + d] = 1; new Notification('行政工作台 · 到期提醒', { body: d }); });
  save();
}

async function toggleNotify() {
  const s = load();
  if (!('Notification' in window)) return toast('当前浏览器不支持通知');
  if (!s.settings.notifyOn) {
    const p = await Notification.requestPermission();
    if (p !== 'granted') return toast('通知权限被拒绝');
    s.settings.notifyOn = true; save(); toast('已开启到期提醒'); notifyCheck();
  } else {
    s.settings.notifyOn = false; save(); toast('已关闭到期提醒');
  }
  syncNotifyBtn();
}

function syncNotifyBtn() {
  const s = load();
  document.getElementById('notifyBtn').textContent = s.settings.notifyOn ? '🔔 提醒已开' : '🔕 提醒已关';
}

// ===== 备份 / 还原 =====
function bindBackup() {
  document.getElementById('exportBtn').onclick = () => {
    download(`行政工作台备份_${today()}.json`, exportJSON());
    toast('备份文件已下载');
  };
  const fileInput = document.getElementById('importFile');
  document.getElementById('importBtn').onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const f = fileInput.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.todos || !data.contracts) throw new Error('不是有效的备份文件');
        if (!confirm('还原将覆盖当前全部数据，确认继续？')) return;
        replaceAll(data); toast('还原成功'); route();
      } catch (e) { toast('还原失败：' + e.message); }
      fileInput.value = '';
    };
    r.readAsText(f);
  };
}

// ===== 启动 =====
bindModal();
buildNav();
buildIndex();
bindBackup();
syncNotifyBtn();

document.getElementById('searchBtn').onclick = openSearch;
document.getElementById('searchModal').addEventListener('click', e => { if (e.target.id === 'searchModal') closeSearch(); });
document.getElementById('searchInput').addEventListener('input', e => doSearch(e.target.value.trim()));
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { const first = document.querySelector('#searchResults .sr-item'); if (first) first.click(); }
  if (e.key === 'Escape') closeSearch();
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

window.addEventListener('hashchange', route);
route();
notifyCheck();
setInterval(notifyCheck, 60000);
