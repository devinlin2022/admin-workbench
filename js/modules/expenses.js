// expenses.js — 费用台账：明细 / 汇总 / 类别排行 / 月度趋势 + 数据分析 + Excel 导出
import { load, save, uid } from '../store.js';
import { esc, fmtMoney, formModal, toast, today } from '../util.js';

const CATS = ['办公用品', '餐饮招待', '差旅', '维修', '福利', '房租物业', '其他'];
const CAT_COLORS = { 办公用品: '#1E5BFF', 餐饮招待: '#C08A2E', 差旅: '#2F6B52', 维修: '#B4432F', 福利: '#F2CF4D', 房租物业: '#6b655c', 其他: '#98928a' };

let charts = [];

const FIELDS = (x) => [
  { key: 'date', label: '日期', type: 'date', value: x?.date || today() },
  { key: 'category', label: '类别', type: 'select', options: CATS, value: x?.category || '办公用品' },
  { key: 'title', label: '事由', value: x?.title },
  { key: 'amount', label: '金额（元）', type: 'number', value: x?.amount },
  { key: 'reimb', label: '报销状态', type: 'select', options: ['待报销', '已报销'], value: x?.reimb || '待报销' },
  { key: 'voucher', label: '凭证附件本地路径', value: x?.voucher },
];

function monthKey(d) { return d.slice(0, 7); }

function exportXlsx(s) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    s.expenses.map(e => ({ 日期: e.date, 类别: e.category, 事由: e.title, 金额: e.amount, 报销状态: e.reimb }))), '台账明细');
  const byCat = {};
  s.expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ 类别: k, 金额: v }))), '类别汇总');
  const byMonth = {};
  s.expenses.forEach(e => { const k = monthKey(e.date); byMonth[k] = (byMonth[k] || 0) + Number(e.amount || 0); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    Object.entries(byMonth).sort().map(([k, v]) => ({ 月份: k, 金额: v }))), '月度汇总');
  XLSX.writeFile(wb, `费用台账_${today()}.xlsx`);
}

function renderCharts(s) {
  charts.forEach(c => c.destroy()); charts = [];
  if (!window.Chart) return;

  // 类别排行
  const byCat = {};
  s.expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0));
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const c1 = document.getElementById('chartCat');
  if (c1 && catEntries.length) {
    charts.push(new Chart(c1, {
      type: 'bar',
      data: { labels: catEntries.map(x => x[0]), datasets: [{ data: catEntries.map(x => x[1]), backgroundColor: catEntries.map(x => CAT_COLORS[x[0]] || '#98928a'), borderRadius: 6 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { family: 'Consolas' } } } }, maintainAspectRatio: false },
    }));
  }

  // 月度趋势（近 12 个月）
  const byMonth = {};
  s.expenses.forEach(e => { const k = monthKey(e.date); byMonth[k] = (byMonth[k] || 0) + Number(e.amount || 0); });
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(d.toISOString().slice(0, 7)); }
  const c2 = document.getElementById('chartMonth');
  if (c2) {
    charts.push(new Chart(c2, {
      type: 'line',
      data: { labels: months, datasets: [{ label: '月度费用', data: months.map(m => byMonth[m] || 0), borderColor: '#1E5BFF', backgroundColor: 'rgba(30,91,255,.08)', fill: true, tension: .35, pointBackgroundColor: '#F2CF4D', pointBorderColor: '#d9b32a' }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { family: 'Consolas' } } } }, maintainAspectRatio: false },
    }));
  }
}

function analysisText(s) {
  const now = new Date();
  const thisM = now.toISOString().slice(0, 7);
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevM = prevD.toISOString().slice(0, 7);
  const sum = (m) => s.expenses.filter(e => monthKey(e.date) === m).reduce((t, e) => t + Number(e.amount || 0), 0);
  const a = sum(thisM), b = sum(prevM);
  const out = [];
  if (b > 0) {
    const r = (a - b) / b * 100;
    out.push(`本月费用 ${fmtMoney(a)}，环比上月（${fmtMoney(b)}）${r >= 0 ? '上升' : '下降'} ${Math.abs(r).toFixed(1)}%。`);
  } else if (a > 0) out.push(`本月费用 ${fmtMoney(a)}（上月无记录）。`);
  const byCat = {};
  s.expenses.filter(e => monthKey(e.date) === thisM).forEach(e => byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0));
  const top = Object.entries(byCat).sort((x, y) => y[1] - x[1])[0];
  if (top) out.push(`本月最大支出类别为「${top[0]}」，共 ${fmtMoney(top[1])}，占本月 ${a ? (top[1] / a * 100).toFixed(0) : 0}%。`);
  const pending = s.expenses.filter(e => e.reimb === '待报销').reduce((t, e) => t + Number(e.amount || 0), 0);
  if (pending > 0) out.push(`⚠️ 尚有 ${fmtMoney(pending)} 待报销，建议尽快提交财务。`);
  return out.length ? out.map(t => `<div class="radar-item"><span>📈</span><span>${esc(t)}</span></div>`).join('') : '<div class="empty">暂无足够数据进行分析</div>';
}

export function render(root) {
  const s = load();
  const thisM = today().slice(0, 7);
  const monthSum = s.expenses.filter(e => monthKey(e.date) === thisM).reduce((t, e) => t + Number(e.amount || 0), 0);
  const totalSum = s.expenses.reduce((t, e) => t + Number(e.amount || 0), 0);
  const pending = s.expenses.filter(e => e.reimb === '待报销').length;
  const list = [...s.expenses].sort((a, b) => b.date.localeCompare(a.date));

  root.innerHTML = `
    <div class="page-head">
      <h2>费用台账</h2><span class="desc">明细 · 汇总 · 类别排行 · 月度趋势</span>
      <div class="spacer"></div>
      <button class="btn" id="expBtn">📊 导出 Excel（多 Sheet）</button>
      <button class="btn btn-primary" id="addBtn">＋ 记一笔</button>
    </div>
    <div class="grid-3" style="margin-bottom:16px">
      <div class="card"><div class="stat-label">本月费用（${thisM}）</div><div class="stat-num">${fmtMoney(monthSum)}</div></div>
      <div class="card"><div class="stat-label">累计费用</div><div class="stat-num">${fmtMoney(totalSum)}</div></div>
      <div class="card"><div class="stat-label">待报销笔数</div><div class="stat-num" style="color:${pending ? 'var(--amber)' : 'var(--green)'}">${pending}</div></div>
    </div>
    <div class="grid-2" style="margin-bottom:16px">
      <div class="card"><div class="card-title">费用类别排行</div><div class="chart-box"><canvas id="chartCat"></canvas></div></div>
      <div class="card"><div class="card-title">月度费用趋势（近 12 个月）</div><div class="chart-box"><canvas id="chartMonth"></canvas></div></div>
    </div>
    <div class="card" style="margin-bottom:16px"><div class="card-title">数据分析</div>${analysisText(s)}</div>
    <div class="card">
      <div class="card-title">台账明细</div>
      ${list.length ? `<table class="tbl"><thead><tr>
        <th>日期</th><th>类别</th><th>事由</th><th style="text-align:right">金额</th><th>报销状态</th><th>凭证</th><th style="width:110px">操作</th>
      </tr></thead><tbody>${list.map(e => `<tr>
        <td class="muted">${esc(e.date)}</td>
        <td><span class="tag-chip">${esc(e.category)}</span></td>
        <td>${esc(e.title)}</td>
        <td class="money">${fmtMoney(e.amount)}</td>
        <td><span class="badge ${e.reimb === '已报销' ? 'b-green' : 'b-amber'}">${esc(e.reimb)}</span></td>
        <td>${e.voucher ? `<span class="badge b-blue" title="${esc(e.voucher)}">📎 路径</span>` : '<span class="muted">—</span>'}</td>
        <td>
          <button class="link-btn" data-edit="${e.id}">编辑</button>
          <button class="link-btn" style="color:var(--brick)" data-del="${e.id}">删除</button>
        </td></tr>`).join('')}</tbody></table>` : '<div class="empty">暂无费用记录</div>'}
    </div>`;

  renderCharts(s);
  root.querySelector('#expBtn').onclick = () => { try { exportXlsx(s); } catch (e) { toast('导出失败：' + e.message); } };
  const edit = (x) => formModal(x ? '编辑费用' : '记一笔', FIELDS(x), (d) => {
    if (!d.title) return;
    if (x) Object.assign(x, d); else s.expenses.push({ id: uid(), ...d });
    save(); render(root); toast('已保存');
  });
  root.querySelector('#addBtn').onclick = () => edit(null);
  root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(s.expenses.find(e => e.id === b.dataset.edit)));
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('确认删除该笔费用？')) return;
    s.expenses = s.expenses.filter(e => e.id !== b.dataset.del); save(); render(root);
  });
}
