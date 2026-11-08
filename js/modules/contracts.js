// contracts.js — 档案管理·合同：分类 / 到期提醒 / 搜索 / 附件路径引用
import { load, save, uid } from '../store.js';
import { esc, dueBadge, fmtMoney, formModal, toast, today } from '../util.js';

let kw = '', curCat = '全部';

const FIELDS = (x) => [
  { key: 'name', label: '合同名称', value: x?.name },
  { key: 'party', label: '相对方', value: x?.party },
  { key: 'no', label: '合同编号', value: x?.no },
  { key: 'category', label: '分类', type: 'select', options: ['场地', '后勤服务', '采购', '人事', '其他'], value: x?.category || '其他' },
  { key: 'signDate', label: '签订日期', type: 'date', value: x?.signDate || today() },
  { key: 'endDate', label: '到期日期', type: 'date', value: x?.endDate },
  { key: 'amount', label: '金额（元）', type: 'number', value: x?.amount },
  { key: 'attachment', label: '附件本地路径（只记路径，不存文件）', value: x?.attachment },
  { key: 'note', label: '备注', value: x?.note },
];

export function render(root) {
  const s = load();
  const cats = ['全部', ...new Set(s.contracts.map(c => c.category))];
  const list = s.contracts.filter(c =>
    (curCat === '全部' || c.category === curCat) &&
    (!kw || (c.name + c.party + c.no + c.category).toLowerCase().includes(kw.toLowerCase())))
    .sort((a, b) => (a.endDate || '9999').localeCompare(b.endDate || '9999'));

  root.innerHTML = `
    <div class="page-head">
      <h2>档案管理 · 合同</h2><span class="desc">分类 · 搜索 · 到期自动提醒</span>
      <div class="spacer"></div>
      <input id="kw" placeholder="搜索名称/相对方/编号" value="${esc(kw)}" style="background:#fbf9f5;border:1px solid var(--line);border-radius:8px;padding:7px 12px;width:220px">
      <button class="btn btn-primary" id="addBtn">＋ 登记合同</button>
    </div>
    <div class="tabs">${cats.map(c => `<button class="tab ${curCat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr>
        <th>合同名称</th><th>相对方</th><th>编号</th><th>分类</th><th>金额</th><th>到期日</th><th>状态</th><th>附件</th><th style="width:110px">操作</th>
      </tr></thead><tbody>${list.map(c => `<tr>
        <td><b>${esc(c.name)}</b>${c.note ? `<div class="muted">${esc(c.note)}</div>` : ''}</td>
        <td>${esc(c.party)}</td>
        <td class="muted">${esc(c.no)}</td>
        <td><span class="tag-chip">${esc(c.category)}</span></td>
        <td class="money">${fmtMoney(c.amount)}</td>
        <td class="muted">${esc(c.endDate || '—')}</td>
        <td>${dueBadge(c.endDate)}</td>
        <td>${c.attachment ? `<span class="badge b-blue" title="${esc(c.attachment)}">📎 路径</span>` : '<span class="muted">—</span>'}</td>
        <td>
          <button class="link-btn" data-edit="${c.id}">编辑</button>
          <button class="link-btn" style="color:var(--brick)" data-del="${c.id}">删除</button>
        </td></tr>`).join('')}</tbody></table>` : '<div class="empty">没有匹配的合同</div>'}
    </div>`;

  root.querySelector('#kw').oninput = (e) => { kw = e.target.value; render(root); root.querySelector('#kw').focus(); };
  root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { curCat = b.dataset.cat; render(root); });

  const edit = (x) => formModal(x ? '编辑合同' : '登记合同', FIELDS(x), (d) => {
    if (!d.name) return;
    if (x) Object.assign(x, d); else s.contracts.push({ id: uid(), ...d });
    save(); render(root); toast('已保存');
  });
  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(s.contracts.find(c => c.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该合同档案？')) return;
    s.contracts = s.contracts.filter(c => c.id !== b.dataset.del); save(); render(root);
  });
}
