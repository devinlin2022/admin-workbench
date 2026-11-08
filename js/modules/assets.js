// assets.js — 固定资产台账：电脑/桌椅/车辆 + 筛选 + Excel 导出
import { load, save, uid } from '../store.js';
import { esc, fmtMoney, formModal, toast, today, download } from '../util.js';

let fCat = '全部', fStatus = '全部';

const FIELDS = (x) => [
  { key: 'no', label: '资产编号', value: x?.no },
  { key: 'name', label: '资产名称', value: x?.name },
  { key: 'category', label: '类别', type: 'select', options: ['电脑', '桌椅', '车辆', '设备', '其他'], value: x?.category || '电脑' },
  { key: 'spec', label: '规格型号', value: x?.spec },
  { key: 'buyDate', label: '购入日期', type: 'date', value: x?.buyDate || today() },
  { key: 'price', label: '原值（元）', type: 'number', value: x?.price },
  { key: 'owner', label: '使用人/部门', value: x?.owner },
  { key: 'location', label: '存放位置', value: x?.location },
  { key: 'status', label: '状态', type: 'select', options: ['在用', '闲置', '维修', '报废'], value: x?.status || '在用' },
];

function exportXlsx(s) {
  const rows = s.assets.map(a => ({
    资产编号: a.no, 名称: a.name, 类别: a.category, 规格: a.spec,
    购入日期: a.buyDate, 原值: a.price, 使用人: a.owner, 位置: a.location, 状态: a.status,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '固定资产台账');
  const total = s.assets.reduce((t, a) => t + (Number(a.price) || 0), 0);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    { 项目: '资产总数', 值: s.assets.length }, { 项目: '资产原值合计（元）', 值: total },
  ]), '汇总');
  XLSX.writeFile(wb, `固定资产台账_${today()}.xlsx`);
}

export function render(root) {
  const s = load();
  const cats = ['全部', ...new Set(s.assets.map(a => a.category))];
  const list = s.assets.filter(a =>
    (fCat === '全部' || a.category === fCat) && (fStatus === '全部' || a.status === fStatus));
  const total = list.reduce((t, a) => t + Number(a.price || 0), 0);

  root.innerHTML = `
    <div class="page-head">
      <h2>固定资产管理</h2><span class="desc">电脑 · 桌椅 · 车辆台账</span>
      <div class="spacer"></div>
      <button class="btn" id="expBtn">📊 导出 Excel</button>
      <button class="btn btn-primary" id="addBtn">＋ 登记资产</button>
    </div>
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card"><div class="stat-label">资产总数</div><div class="stat-num">${s.assets.length}</div></div>
      <div class="card"><div class="stat-label">在用</div><div class="stat-num" style="color:var(--green)">${s.assets.filter(a => a.status === '在用').length}</div></div>
      <div class="card"><div class="stat-label">闲置/维修</div><div class="stat-num" style="color:var(--amber)">${s.assets.filter(a => a.status === '闲置' || a.status === '维修').length}</div></div>
      <div class="card"><div class="stat-label">原值合计（当前筛选）</div><div class="stat-num">${fmtMoney(total)}</div></div>
    </div>
    <div class="form-row">
      <select id="fCat">${cats.map(c => `<option ${fCat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <select id="fStatus">${['全部', '在用', '闲置', '维修', '报废'].map(v => `<option ${fStatus === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr>
        <th>编号</th><th>名称</th><th>类别</th><th>规格</th><th>购入日期</th><th>原值</th><th>使用人</th><th>位置</th><th>状态</th><th style="width:110px">操作</th>
      </tr></thead><tbody>${list.map(a => `<tr>
        <td class="muted">${esc(a.no)}</td>
        <td><b>${esc(a.name)}</b></td>
        <td><span class="tag-chip">${esc(a.category)}</span></td>
        <td class="muted">${esc(a.spec)}</td>
        <td class="muted">${esc(a.buyDate)}</td>
        <td class="money">${fmtMoney(a.price)}</td>
        <td>${esc(a.owner)}</td>
        <td class="muted">${esc(a.location)}</td>
        <td><span class="badge ${a.status === '在用' ? 'b-green' : a.status === '报废' ? 'b-brick' : 'b-amber'}">${esc(a.status)}</span></td>
        <td>
          <button class="link-btn" data-edit="${a.id}">编辑</button>
          <button class="link-btn" style="color:var(--brick)" data-del="${a.id}">删除</button>
        </td></tr>`).join('')}</tbody></table>` : '<div class="empty">当前筛选下暂无资产</div>'}
    </div>`;

  root.querySelector('#fCat').onchange = (e) => { fCat = e.target.value; render(root); };
  root.querySelector('#fStatus').onchange = (e) => { fStatus = e.target.value; render(root); };
  root.querySelector('#expBtn').onclick = () => { try { exportXlsx(s); } catch (e) { toast('导出失败：' + e.message); } };

  const edit = (x) => formModal(x ? '编辑资产' : '登记资产', FIELDS(x), (d) => {
    if (!d.name) return;
    if (x) Object.assign(x, d); else s.assets.push({ id: uid(), ...d });
    save(); render(root); toast('已保存');
  });
  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(s.assets.find(a => a.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该资产？')) return;
    s.assets = s.assets.filter(a => a.id !== b.dataset.del); save(); render(root);
  });
}
