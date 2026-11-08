// templates.js — 模板中心：Markdown 在线编辑 + 版本管理 + 分类存档
import { load, save, uid } from '../store.js';
import { esc, md, formModal, toast, download, today, openModal, closeModal } from '../util.js';

let curCat = '全部', curId = null;

export function render(root) {
  const s = load();
  const cats = ['全部', ...new Set(s.templates.map(t => t.category))];
  const list = s.templates.filter(t => curCat === '全部' || t.category === curCat);
  if (!curId && list.length) curId = list[0].id;
  if (curId && !list.find(t => t.id === curId)) curId = list[0]?.id || null;
  const cur = s.templates.find(t => t.id === curId);

  root.innerHTML = `
    <div class="page-head">
      <h2>模板中心</h2><span class="desc">通知 · 纪要 · 月报，在线编辑与版本管理</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="addBtn">＋ 新建模板</button>
    </div>
    <div class="dash-grid">
      <div class="col" style="max-width:280px">
        <div class="card">
          <div class="tabs" style="flex-wrap:wrap">${cats.map(c => `<button class="tab ${curCat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
          ${list.map(t => `
            <div class="sr-item ${t.id === curId ? 'sel' : ''}" data-open="${t.id}" style="border-radius:8px">
              <span>📄 ${esc(t.name)}</span><span class="from">${esc(t.updated)}</span>
            </div>`).join('') || '<div class="empty">该分类暂无模板</div>'}
        </div>
      </div>
      <div class="col">
        ${cur ? `
        <div class="card">
          <div class="card-title">${esc(cur.name)}
            <span class="tag-chip">${esc(cur.category)}</span>
            <span class="right">
              更新于 ${esc(cur.updated)} · ${cur.versions.length} 个历史版本
              <button class="link-btn" id="verBtn">历史版本</button>
              <button class="link-btn" id="expBtn">导出 .md</button>
              <button class="link-btn" style="color:var(--brick)" id="delBtn">删除</button>
            </span>
          </div>
          <div class="editor-wrap">
            <textarea id="tplEditor" placeholder="支持 Markdown 语法，{花括号} 为占位符">${esc(cur.content)}</textarea>
            <div class="md-body card" style="margin:0;overflow:auto" id="tplPreview"></div>
          </div>
          <div style="text-align:right;margin-top:12px">
            <button class="btn btn-primary" id="saveBtn">保存新版本</button>
          </div>
        </div>` : '<div class="card"><div class="empty">选择左侧模板开始编辑</div></div>'}
      </div>
    </div>`;

  root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { curCat = b.dataset.cat; curId = null; render(root); });
  root.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { curId = b.dataset.open; render(root); });

  root.querySelector('#addBtn').onclick = () => formModal('新建模板', [
    { key: 'name', label: '模板名称' },
    { key: 'category', label: '分类', value: '通知' },
  ], (d) => {
    if (!d.name) return;
    const t = { id: uid(), name: d.name, category: d.category || '未分类', updated: today(), content: '# ' + d.name + '\n\n', versions: [] };
    s.templates.push(t); curId = t.id; save(); render(root);
  });

  if (!cur) return;
  const editor = root.querySelector('#tplEditor');
  const preview = root.querySelector('#tplPreview');
  const sync = () => { preview.innerHTML = md(editor.value); };
  editor.addEventListener('input', sync); sync();

  root.querySelector('#saveBtn').onclick = () => {
    if (editor.value !== cur.content) {
      cur.versions.unshift({ content: cur.content, savedAt: cur.updated });
      cur.content = editor.value; cur.updated = today();
      save(); render(root); toast('已保存为新版本');
    } else toast('内容无变化');
  };
  root.querySelector('#expBtn').onclick = () => download(`${cur.name}.md`, cur.content, 'text/markdown');
  root.querySelector('#delBtn').onclick = () => {
    if (!confirm(`确认删除模板「${cur.name}」？`)) return;
    s.templates = s.templates.filter(t => t.id !== cur.id); curId = null; save(); render(root);
  };
  root.querySelector('#verBtn').onclick = () => {
    if (!cur.versions.length) return toast('暂无历史版本');
    const body = cur.versions.map((v, i) => `
      <div class="card" style="margin-bottom:10px">
        <div class="card-title">版本 ${cur.versions.length - i} <span class="right">保存于 ${esc(v.savedAt)} <button class="link-btn" data-restore="${i}">回滚到此版本</button></span></div>
        <pre style="white-space:pre-wrap;font-size:12.5px;color:var(--ink-2);max-height:180px;overflow:auto">${esc(v.content.slice(0, 500))}${v.content.length > 500 ? '…' : ''}</pre>
      </div>`).join('');
    openModal(`「${cur.name}」历史版本`, body);
    document.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => {
      cur.versions.unshift({ content: cur.content, savedAt: cur.updated });
      cur.content = cur.versions.splice(Number(b.dataset.restore) + 1, 1)[0].content;
      cur.updated = today(); save(); closeModal(); render(root); toast('已回滚');
    });
  };
}
