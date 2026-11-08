// logistics.js — 后勤管理：食堂管理 / 设施设备维护 / 应急预案
import { load, save, uid } from '../store.js';
import { esc, fmtMoney, formModal, toast, today, dueBadge } from '../util.js';

let tab = 'canteen';

const TABS = [['canteen', '🍚 食堂管理'], ['maintenance', '🔧 设施设备维护'], ['emergency', '🚨 应急预案']];

const FIELDSETS = {
  canteen: (x) => [
    { key: 'date', label: '日期', type: 'date', value: x?.date || today() },
    { key: 'meal', label: '餐次', type: 'select', options: ['早餐', '午餐', '晚餐'], value: x?.meal || '午餐' },
    { key: 'menu', label: '菜单', value: x?.menu },
    { key: 'supplier', label: '供应商', value: x?.supplier },
    { key: 'cost', label: '人均成本（元）', type: 'number', value: x?.cost },
  ],
  maintenance: (x) => [
    { key: 'item', label: '设施设备', value: x?.item },
    { key: 'type', label: '类型', type: 'select', options: ['报修', '保养', '巡检'], value: x?.type || '报修' },
    { key: 'reportDate', label: '登记日期', type: 'date', value: x?.reportDate || today() },
    { key: 'status', label: '进度', type: 'select', options: ['待处理', '维修中', '已完成'], value: x?.status || '待处理' },
    { key: 'nextDate', label: '下次保养/年检日期（可选，用于到期提醒）', type: 'date', value: x?.nextDate },
    { key: 'note', label: '备注', value: x?.note },
  ],
  emergency: (x) => [
    { key: 'title', label: '预案名称', value: x?.title },
    { key: 'content', label: '处置流程', type: 'textarea', value: x?.content },
    { key: 'contacts', label: '紧急联系人清单', type: 'textarea', value: x?.contacts },
    { key: 'drillDate', label: '上次演练日期', type: 'date', value: x?.drillDate },
  ],
};

const TABLES = {
  canteen: {
    head: ['日期', '餐次', '菜单', '供应商', '人均成本'],
    row: (x) => `<td class="muted">${esc(x.date)}</td><td><span class="tag-chip">${esc(x.meal)}</span></td><td>${esc(x.menu)}</td><td class="muted">${esc(x.supplier)}</td><td class="money">${fmtMoney(x.cost)}</td>`,
  },
  maintenance: {
    head: ['设施设备', '类型', '登记日期', '进度', '下次保养/年检', '备注'],
    row: (x) => `<td><b>${esc(x.item)}</b></td><td><span class="tag-chip">${esc(x.type)}</span></td><td class="muted">${esc(x.reportDate)}</td>
      <td><span class="badge ${x.status === '已完成' ? 'b-green' : x.status === '维修中' ? 'b-amber' : 'b-brick'}">${esc(x.status)}</span></td>
      <td>${x.nextDate ? dueBadge(x.nextDate) : '<span class="muted">—</span>'}</td><td class="muted">${esc(x.note)}</td>`,
  },
  emergency: {
    head: ['预案名称', '处置流程', '紧急联系人', '上次演练'],
    row: (x) => `<td><b>${esc(x.title)}</b></td><td style="max-width:280px;white-space:pre-wrap">${esc(x.content)}</td><td style="max-width:220px;white-space:pre-wrap" class="muted">${esc(x.contacts)}</td><td class="muted">${esc(x.drillDate || '—')}</td>`,
  },
};

export function render(root) {
  const s = load();
  const list = s.logistics[tab] || (s.logistics[tab] = []);
  const T = TABLES[tab];

  root.innerHTML = `
    <div class="page-head">
      <h2>后勤管理</h2><span class="desc">食堂 · 设施设备维护 · 应急预案</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="addBtn">＋ 新增记录</button>
    </div>
    <div class="tabs">${TABS.map(([k, v]) => `<button class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr>${T.head.map(h => `<th>${h}</th>`).join('')}<th style="width:110px">操作</th></tr></thead>
      <tbody>${list.map(x => `<tr>${T.row(x)}<td>
        <button class="link-btn" data-edit="${x.id}">编辑</button>
        <button class="link-btn" style="color:var(--brick)" data-del="${x.id}">删除</button></td></tr>`).join('')}</tbody></table>`
      : '<div class="empty">暂无记录</div>'}
    </div>`;

  root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(root); });
  const edit = (x) => formModal(x ? '编辑记录' : '新增记录', FIELDSETS[tab](x), (d) => {
    if (x) Object.assign(x, d); else list.push({ id: uid(), ...d });
    save(); render(root); toast('已保存');
  });
  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(list.find(x => x.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该记录？')) return;
    s.logistics[tab] = list.filter(x => x.id !== b.dataset.del); save(); render(root);
  });
}
