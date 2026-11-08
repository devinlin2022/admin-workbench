// policies.js — 制度管理：分类浏览 + 全文搜索 + Markdown 在线查看/编辑
import { load, save, uid } from '../store.js';
import { esc, md, openModal, formModal, toast, today } from '../util.js';

let kw = '', curCat = '全部';

export function render(root) {
  const s = load();
  const cats = ['全部', ...new Set(s.policies.map(p => p.category))];
  const list = s.policies.filter(p =>
    (curCat === '全部' || p.category === curCat) &&
    (!kw || (p.name + p.content).toLowerCase().includes(kw.toLowerCase())));

  root.innerHTML = `
    <div class="page-head">
      <h2>制度管理</h2><span class="desc">印章 · 保洁 · 前台等内部制度</span>
      <div class="spacer"></div>
      <input id="kw" placeholder="搜索制度名称/内容" value="${esc(kw)}" style="background:#fbf9f5;border:1px solid var(--line);border-radius:8px;padding:7px 12px;width:220px">
      <button class="btn btn-primary" id="addBtn">＋ 新增制度</button>
    </div>
    <div class="tabs">${cats.map(c => `<button class="tab ${curCat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr><th>制度名称</th><th>分类</th><th>更新日期</th><th style="width:150px">操作</th></tr></thead>
      <tbody>${list.map(p => `<tr>
        <td><b>${esc(p.name)}</b></td>
        <td><span class="tag-chip">${esc(p.category)}</span></td>
        <td class="muted">${esc(p.updated)}</td>
        <td>
          <button class="link-btn" data-view="${p.id}">查看</button>
          <button class="link-btn" data-edit="${p.id}">编辑</button>
          <button class="link-btn" style="color:var(--brick)" data-del="${p.id}">删除</button>
        </td></tr>`).join('')}</tbody></table>` : '<div class="empty">没有匹配的制度</div>'}
    </div>`;

  root.querySelector('#kw').oninput = (e) => { kw = e.target.value; render(root); root.querySelector('#kw').focus(); };
  root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { curCat = b.dataset.cat; render(root); });

  root.querySelector('#addBtn').onclick = () => formModal('新增制度', [
    { key: 'name', label: '制度名称' },
    { key: 'category', label: '分类', value: '综合管理' },
  ], (d) => {
    if (!d.name) return;
    s.policies.push({ id: uid(), name: d.name, category: d.category || '综合管理', updated: today(), content: '# ' + d.name + '\n\n', versions: [] });
    save(); render(root);
  });

  const view = (p, editing) => {
    openModal(editing ? `编辑：${p.name}` : p.name, editing ? `
      <textarea id="polEditor" style="width:100%;min-height:380px;font-family:var(--mono);font-size:13px;background:#fbf9f5;border:1px solid var(--line);border-radius:8px;padding:10px">${esc(p.content)}</textarea>
      <div style="text-align:right;margin-top:10px"><button class="btn btn-primary" id="polSave">保存</button></div>` :
      `<div class="md-body">${md(p.content)}</div>
       <div class="muted" style="margin-top:14px">分类：${esc(p.category)} · 更新于 ${esc(p.updated)}</div>`);
    if (editing) document.getElementById('polSave').onclick = () => {
      p.versions = p.versions || [];
      p.versions.unshift({ content: p.content, savedAt: p.updated });
      p.content = document.getElementById('polEditor').value;
      p.updated = today(); save(); toast('已保存'); render(root);
      view(p, false);
    };
  };

  root.querySelectorAll('[data-view]').forEach(b => b.onclick = () => view(s.policies.find(p => p.id === b.dataset.view), false));
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => view(s.policies.find(p => p.id === b.dataset.edit), true));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该制度？')) return;
    s.policies = s.policies.filter(p => p.id !== b.dataset.del); save(); render(root);
  });
}
