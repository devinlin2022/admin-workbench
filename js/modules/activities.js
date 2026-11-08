// activities.js — 员工活动/福利：节日福利采购 · 周年庆 · 生日会 · 团建 · 体检
import { load, save, uid } from '../store.js';
import { esc, fmtMoney, formModal, toast, today, daysUntil } from '../util.js';

const TYPES = ['节日福利', '周年庆', '生日会', '团建', '体检', '其他'];
const STATUS = ['待启动', '筹备中', '已完成', '已取消'];
const ST_BADGE = { 待启动: 'b-gray', 筹备中: 'b-amber', 已完成: 'b-green', 已取消: 'b-brick' };

const FIELDS = (x) => [
  { key: 'name', label: '活动名称', value: x?.name },
  { key: 'type', label: '类型', type: 'select', options: TYPES, value: x?.type || '节日福利' },
  { key: 'date', label: '举办/执行日期', type: 'date', value: x?.date || today() },
  { key: 'budget', label: '预算（元）', type: 'number', value: x?.budget },
  { key: 'status', label: '状态', type: 'select', options: STATUS, value: x?.status || '待启动' },
  { key: 'note', label: '方案/备注', type: 'textarea', value: x?.note },
];

export function render(root) {
  const s = load();
  const list = [...s.activities].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const upcoming = list.filter(a => a.status !== '已完成' && a.status !== '已取消' && daysUntil(a.date) !== null && daysUntil(a.date) >= 0);
  const budgetSum = upcoming.reduce((t, a) => t + Number(a.budget || 0), 0);

  root.innerHTML = `
    <div class="page-head">
      <h2>员工活动 / 福利</h2><span class="desc">节日福利采购 · 周年庆 · 生日会 · 团建 · 体检</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="addBtn">＋ 新建活动</button>
    </div>
    <div class="grid-3" style="margin-bottom:16px">
      <div class="card"><div class="stat-label">进行中 / 待启动</div><div class="stat-num">${upcoming.length}</div></div>
      <div class="card"><div class="stat-label">近 30 天将举办</div><div class="stat-num" style="color:var(--amber)">${upcoming.filter(a => daysUntil(a.date) <= 30).length}</div></div>
      <div class="card"><div class="stat-label">待执行预算合计</div><div class="stat-num">${fmtMoney(budgetSum)}</div></div>
    </div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr>
        <th>活动</th><th>类型</th><th>日期</th><th>倒计时</th><th>预算</th><th>状态</th><th>备注</th><th style="width:110px">操作</th>
      </tr></thead><tbody>${list.map(a => {
        const n = daysUntil(a.date);
        return `<tr>
        <td><b>${esc(a.name)}</b></td>
        <td><span class="tag-chip">${esc(a.type)}</span></td>
        <td class="muted">${esc(a.date)}</td>
        <td>${n === null ? '—' : n < 0 ? `<span class="muted">已结束 ${-n} 天</span>` : n === 0 ? '<span class="badge b-brick">今天</span>' : n <= 30 ? `<span class="badge b-amber">${n} 天</span>` : `<span class="badge b-green">${n} 天</span>`}</td>
        <td class="money">${fmtMoney(a.budget)}</td>
        <td><span class="badge ${ST_BADGE[a.status]}">${esc(a.status)}</span></td>
        <td class="muted" style="max-width:200px">${esc(a.note)}</td>
        <td>
          <button class="link-btn" data-edit="${a.id}">编辑</button>
          <button class="link-btn" style="color:var(--brick)" data-del="${a.id}">删除</button>
        </td></tr>`; }).join('')}</tbody></table>` : '<div class="empty">暂无活动安排</div>'}
    </div>`;

  const edit = (x) => formModal(x ? '编辑活动' : '新建活动', FIELDS(x), (d) => {
    if (!d.name) return;
    if (x) Object.assign(x, d); else s.activities.push({ id: uid(), ...d });
    save(); render(root); toast('已保存');
  });
  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(s.activities.find(a => a.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该活动？')) return;
    s.activities = s.activities.filter(a => a.id !== b.dataset.del); save(); render(root);
  });
}
