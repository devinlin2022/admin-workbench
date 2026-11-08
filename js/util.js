// util.js — 通用工具
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const today = () => new Date().toISOString().slice(0, 10);

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const a = new Date(today()), b = new Date(dateStr);
  return Math.round((b - a) / 86400000);
}

export function dueBadge(dateStr) {
  const n = daysUntil(dateStr);
  if (n === null) return '<span class="badge b-gray">未设置</span>';
  if (n < 0) return `<span class="badge b-brick">已到期 ${-n} 天</span>`;
  if (n === 0) return '<span class="badge b-brick">今天到期</span>';
  if (n <= 30) return `<span class="badge b-amber">${n} 天后到期</span>`;
  return `<span class="badge b-green">${n} 天后到期</span>`;
}

export const fmtMoney = (n) => '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 2200);
}

export function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modal').classList.remove('hidden');
}
export function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

export function bindModal() {
  document.getElementById('modalClose').onclick = closeModal;
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
}

// 通用表单弹窗：fields = [{key,label,type:'text'|'date'|'number'|'select'|'textarea',options,value}]
export function formModal(title, fields, onSubmit) {
  const body = fields.map(f => {
    const v = f.value ?? '';
    let input;
    if (f.type === 'select') {
      input = `<select name="${f.key}">${f.options.map(o => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea name="${f.key}">${esc(v)}</textarea>`;
    } else {
      input = `<input type="${f.type || 'text'}" name="${f.key}" value="${esc(v)}">`;
    }
    return `<div class="field"><label>${esc(f.label)}</label>${input}</div>`;
  }).join('') + `<div style="text-align:right;margin-top:8px"><button class="btn" id="fmCancel">取消</button> <button class="btn btn-primary" id="fmOk">保存</button></div>`;
  openModal(title, body);
  document.getElementById('fmCancel').onclick = closeModal;
  document.getElementById('fmOk').onclick = () => {
    const data = {};
    fields.forEach(f => {
      const el = document.querySelector(`#modalBody [name="${f.key}"]`);
      data[f.key] = f.type === 'number' ? Number(el.value || 0) : el.value.trim();
    });
    closeModal();
    onSubmit(data);
  };
}

export const md = (text) => DOMPurify.sanitize(marked.parse(text || ''));

export function download(filename, content, mime = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
