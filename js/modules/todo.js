// todo.js — 待办事项：优先级标签 / 进度跟踪 / 自动化提醒 / 重复任务
import { load, save, uid, dstr } from '../store.js';
import { esc, today, daysUntil, formModal, toast } from '../util.js';

const PRI = { high: ['高', 'b-brick'], mid: ['中', 'b-amber'], low: ['低', 'b-green'] };
const ST = { todo: ['未开始', 'b-gray'], doing: ['进行中', 'b-blue'], done: ['已完成', 'b-green'] };
const NEXT = { todo: 'doing', doing: 'done', done: 'todo' };
const RPT = { none: '不重复', weekly: '每周', monthly: '每月' };

let filter = 'all';

export function render(root) {
  const s = load();
  const list = s.todos
    .filter(x => filter === 'all' || x.status === filter)
    .sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.due || '9999').localeCompare(b.due || '9999'));

  root.innerHTML = `
    <div class="page-head">
      <h2>待办事项</h2><span class="desc">今日待办 · 进度跟踪 · 优先级 · 自动化提醒</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="addBtn">＋ 新建待办</button>
    </div>
    <div class="tabs">
      ${[['all', '全部'], ['todo', '未开始'], ['doing', '进行中'], ['done', '已完成']].map(([k, v]) =>
        `<button class="tab ${filter === k ? 'active' : ''}" data-f="${k}">${v}（${k === 'all' ? s.todos.length : s.todos.filter(x => x.status === k).length}）</button>`).join('')}
    </div>
    <div class="card">
      ${list.length ? `<table class="tbl"><thead><tr>
        <th style="width:36px"></th><th>事项</th><th>优先级</th><th>状态</th><th>截止</th><th>重复</th><th style="width:130px">操作</th>
      </tr></thead><tbody>${list.map(x => {
        const over = x.status !== 'done' && x.due && daysUntil(x.due) < 0;
        return `<tr>
          <td><input type="checkbox" class="chk" data-done="${x.id}" ${x.status === 'done' ? 'checked' : ''}></td>
          <td style="${x.status === 'done' ? 'text-decoration:line-through;color:var(--ink-3)' : ''}">${esc(x.title)}</td>
          <td><span class="badge ${PRI[x.priority]?.[1] || 'b-gray'}">${PRI[x.priority]?.[0] || '中'}</span></td>
          <td><button class="link-btn" data-stage="${x.id}" title="点击切换状态"><span class="badge ${ST[x.status]?.[1]}">${ST[x.status]?.[0]}</span></button></td>
          <td class="${over ? '' : 'muted'}" style="${over ? 'color:var(--brick);font-weight:600' : ''}">${esc(x.due || '—')}${x.due === today() ? ' ·今天' : ''}</td>
          <td class="muted">${RPT[x.repeat] || '不重复'}</td>
          <td>
            <button class="link-btn" data-edit="${x.id}">编辑</button>
            <button class="link-btn" style="color:var(--brick)" data-del="${x.id}">删除</button>
          </td>
        </tr>`; }).join('')}</tbody></table>` : '<div class="empty">暂无待办，点右上角「新建待办」开始</div>'}
    </div>`;

  root.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; render(root); });

  const edit = (x) => formModal(x ? '编辑待办' : '新建待办', [
    { key: 'title', label: '事项', value: x?.title },
    { key: 'priority', label: '优先级', type: 'select', options: ['high', 'mid', 'low'], value: x?.priority || 'mid' },
    { key: 'due', label: '截止日期', type: 'date', value: x?.due || dstr(0) },
    { key: 'repeat', label: '重复', type: 'select', options: ['none', 'weekly', 'monthly'], value: x?.repeat || 'none' },
  ], (data) => {
    if (x) Object.assign(x, data);
    else s.todos.push({ id: uid(), status: 'todo', created: today(), ...data });
    save(); render(root); toast('已保存');
  });

  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(s.todos.find(x => x.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该待办？')) return;
    s.todos = s.todos.filter(x => x.id !== b.dataset.del); save(); render(root);
  });
  root.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => {
    const x = s.todos.find(v => v.id === b.dataset.stage);
    x.status = NEXT[x.status]; save(); render(root);
  });
  root.querySelectorAll('[data-done]').forEach(c => c.onchange = () => {
    const x = s.todos.find(v => v.id === c.dataset.done);
    const wasDone = x.status === 'done';
    x.status = c.checked ? 'done' : 'todo';
    // 重复任务：完成时自动生成下一期
    if (!wasDone && c.checked && x.repeat && x.repeat !== 'none' && x.due) {
      const d = new Date(x.due);
      if (x.repeat === 'weekly') d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1);
      s.todos.push({ ...x, id: uid(), status: 'todo', due: d.toISOString().slice(0, 10), created: today() });
      toast('已完成，并自动生成下一期重复任务');
    }
    save(); render(root);
  });
}
