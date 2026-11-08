// misc.js — 其他行政事务：杂项备忘（快递/名片/工位/饮用水/绿植等）
import { load, save, uid } from '../store.js';
import { esc, formModal, toast, today } from '../util.js';

export function render(root) {
  const s = load();
  const list = [...s.misc].sort((a, b) => (b.created || '').localeCompare(a.created || ''));

  root.innerHTML = `
    <div class="page-head">
      <h2>其他行政事务</h2><span class="desc">未归类的杂项：快递、名片、工位、饮用水、绿植……</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="addBtn">＋ 记一条</button>
    </div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr><th style="width:180px">事项</th><th>内容</th><th style="width:110px">记录日期</th><th style="width:110px">操作</th></tr></thead>
      <tbody>${list.map(x => `<tr>
        <td><b>${esc(x.title)}</b></td>
        <td style="white-space:pre-wrap">${esc(x.content)}</td>
        <td class="muted">${esc(x.created)}</td>
        <td>
          <button class="link-btn" data-edit="${x.id}">编辑</button>
          <button class="link-btn" style="color:var(--brick)" data-del="${x.id}">删除</button>
        </td></tr>`).join('')}</tbody></table>` : '<div class="empty">暂无杂项记录</div>'}
    </div>`;

  const edit = (x) => formModal(x ? '编辑' : '记一条', [
    { key: 'title', label: '事项', value: x?.title },
    { key: 'content', label: '内容', type: 'textarea', value: x?.content },
  ], (d) => {
    if (!d.title) return;
    if (x) Object.assign(x, d); else s.misc.push({ id: uid(), created: today(), ...d });
    save(); render(root); toast('已保存');
  });
  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(s.misc.find(x => x.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除？')) return;
    s.misc = s.misc.filter(x => x.id !== b.dataset.del); save(); render(root);
  });
}
