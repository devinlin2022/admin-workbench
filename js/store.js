// store.js — localStorage 主存储 + 种子数据
const KEY = 'admin-workbench-v1';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const dstr = (offset) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

function seed() {
  return {
    settings: { rssUrl: '', notifyOn: false, remindDays: 30 },
    rooms: [
      { id: uid(), name: '大会议室 A（12人）', status: 'free', next: '' },
      { id: uid(), name: '小会议室 B（6人）', status: 'busy', next: '进行中 · 部门周会' },
      { id: uid(), name: '洽谈室 C（4人）', status: 'free', next: '' },
    ],
    todos: [
      { id: uid(), title: '提交本月行政费用汇总给财务', priority: 'high', status: 'doing', due: dstr(0), repeat: 'monthly', created: dstr(-3) },
      { id: uid(), title: '确认中秋福利供应商报价', priority: 'high', status: 'todo', due: dstr(2), repeat: 'none', created: dstr(-1) },
      { id: uid(), title: '更换 3 楼打印机硒鼓', priority: 'mid', status: 'todo', due: dstr(1), repeat: 'none', created: dstr(-1) },
      { id: uid(), title: '更新前台来访登记表模板', priority: 'low', status: 'done', due: dstr(-1), repeat: 'none', created: dstr(-5) },
    ],
    templates: [
      { id: uid(), name: '会议通知', category: '通知', updated: dstr(-10), content: '# 会议通知\n\n**会议主题**：{主题}\n**时间**：{日期} {时间}\n**地点**：{会议室}\n**参会人**：{名单}\n\n## 议程\n1. {议题一}\n2. {议题二}\n\n请提前 5 分钟到场，手机静音。\n\n行政部\n{日期}', versions: [] },
      { id: uid(), name: '放假通知', category: '通知', updated: dstr(-10), content: '# 放假通知\n\n各位同事：\n\n根据国家法定节假日安排，结合公司实际情况，现将 **{节日}** 放假安排通知如下：\n\n- 放假时间：{起止日期}，共 {N} 天\n- 调休上班：{调休日期}\n\n请各部门提前做好工作安排，离开前关闭电源、锁好门窗。\n\n行政部\n{日期}', versions: [] },
      { id: uid(), name: '会议纪要', category: '纪要', updated: dstr(-10), content: '# 会议纪要\n\n- **会议主题**：{主题}\n- **时间**：{日期}\n- **地点**：{地点}\n- **主持**：{主持人}\n- **记录**：{记录人}\n\n## 决议事项\n| 事项 | 负责人 | 完成时限 |\n|---|---|---|\n| {事项} | {负责人} | {时限} |\n\n## 待跟进\n- [ ] {跟进事项}', versions: [] },
      { id: uid(), name: '行政月报', category: '报告', updated: dstr(-10), content: '# 行政月报（{月份}）\n\n## 一、本月工作\n1. {工作项}\n\n## 二、费用概况\n- 行政费用合计：¥{金额}\n- 主要支出：{类别}\n\n## 三、下月计划\n1. {计划项}', versions: [] },
    ],
    policies: [
      { id: uid(), name: '印章管理制度', category: '综合管理', updated: dstr(-30), content: '# 印章管理制度\n\n## 1. 印章保管\n公章、合同章由行政部专人保管，存放于带锁保险柜。\n\n## 2. 用印流程\n1. 申请人填写《用印申请表》\n2. 部门负责人审批\n3. 行政部复核文件内容\n4. 用印并登记台账\n\n## 3. 禁止事项\n- 严禁在空白纸张、空白合同上用印\n- 严禁携带印章外出（特殊情况需总经理书面批准）', versions: [] },
      { id: uid(), name: '保洁管理制度', category: '后勤', updated: dstr(-30), content: '# 保洁管理制度\n\n## 1. 清洁频次\n- 办公区地面：每日 1 次\n- 会议室：每次使用后\n- 卫生间：每日 2 次\n- 地毯深度清洁：每季度 1 次\n\n## 2. 检查标准\n桌面无积灰、地面无污渍、垃圾日产日清。', versions: [] },
      { id: uid(), name: '前台管理制度', category: '综合管理', updated: dstr(-30), content: '# 前台管理制度\n\n## 1. 来访接待\n来访登记 → 电话确认 → 发放访客证 → 引导至会议室。\n\n## 2. 快递收发\n快递统一前台签收，登记后通知收件人，当日未取件需二次提醒。\n\n## 3. 仪容仪表\n着装整洁，使用礼貌用语。', versions: [] },
    ],
    contracts: [
      { id: uid(), name: '办公场地租赁合同', party: 'XX 物业管理有限公司', no: 'HT-2025-001', category: '场地', signDate: dstr(-350), endDate: dstr(15), amount: 360000, attachment: '', note: '年付，到期前需谈续约' },
      { id: uid(), name: '绿植养护服务合同', party: 'XX 园艺公司', no: 'HT-2025-014', category: '后勤服务', signDate: dstr(-180), endDate: dstr(185), amount: 12000, attachment: '', note: '' },
      { id: uid(), name: '饮用水供应合同', party: 'XX 水业', no: 'HT-2025-021', category: '后勤服务', signDate: dstr(-400), endDate: dstr(-35), amount: 6000, attachment: '', note: '已到期，待续签' },
    ],
    assets: [
      { id: uid(), no: 'ZC-PC-001', name: 'ThinkPad X1', category: '电脑', spec: 'i7/16G/512G', buyDate: dstr(-400), price: 8999, owner: '张三', location: '3楼工位A12', status: '在用' },
      { id: uid(), no: 'ZC-JJ-015', name: '人体工学椅', category: '桌椅', spec: '黑色网布', buyDate: dstr(-500), price: 1280, owner: '公共', location: '会议室A', status: '在用' },
      { id: uid(), no: 'ZC-CL-001', name: '别克GL8 公务车', category: '车辆', spec: '2023款', buyDate: dstr(-700), price: 269900, owner: '行政部', location: 'B2车位-018', status: '在用' },
    ],
    expenses: [
      { id: uid(), date: dstr(-70), category: '办公用品', amount: 860, title: '打印纸/笔/本', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-62), category: '餐饮招待', amount: 1280, title: '客户来访用餐', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-48), category: '维修', amount: 450, title: '空调加氟', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-40), category: '办公用品', amount: 1120, title: '硒鼓×4', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-33), category: '福利', amount: 3600, title: '月度生日会蛋糕及礼品', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-25), category: '差旅', amount: 2140, title: '展会考察高铁住宿', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-16), category: '餐饮招待', amount: 760, title: '部门聚餐补贴', reimb: '已报销', voucher: '' },
      { id: uid(), date: dstr(-9), category: '办公用品', amount: 540, title: '文件柜锁具更换', reimb: '待报销', voucher: '' },
      { id: uid(), date: dstr(-4), category: '维修', amount: 980, title: '玻璃门合页维修', reimb: '待报销', voucher: '' },
      { id: uid(), date: dstr(-1), category: '福利', amount: 1500, title: '员工体检预约定金', reimb: '待报销', voucher: '' },
    ],
    logistics: {
      canteen: [
        { id: uid(), date: dstr(0), meal: '午餐', menu: '红烧排骨/清炒时蔬/紫菜蛋花汤', supplier: 'XX 餐饮', cost: 18 },
        { id: uid(), date: dstr(1), meal: '午餐', menu: '宫保鸡丁/蒜蓉西兰花/番茄蛋汤', supplier: 'XX 餐饮', cost: 18 },
      ],
      maintenance: [
        { id: uid(), item: '3楼中央空调', type: '保养', reportDate: dstr(-10), status: '已完成', nextDate: dstr(80), note: '季度保养' },
        { id: uid(), item: '前台玻璃门', type: '报修', reportDate: dstr(-4), status: '维修中', nextDate: '', note: '合页损坏，已联系师傅' },
      ],
      emergency: [
        { id: uid(), title: '消防安全应急预案', content: '火警发现 → 拨打 119 → 通知行政负责人 → 组织疏散至楼下集合点 → 清点人数。', contacts: '行政负责人：张三 13800000000；物业：0755-12345678', drillDate: dstr(-60) },
      ],
    },
    activities: [
      { id: uid(), name: '中秋福利采购', type: '节日福利', date: dstr(20), budget: 15000, status: '筹备中', note: '月饼+水果，人均 300' },
      { id: uid(), name: '11月员工生日会', type: '生日会', date: dstr(18), budget: 2000, status: '待启动', note: '11 月寿星 6 人' },
      { id: uid(), name: '年度体检', type: '体检', date: dstr(40), budget: 30000, status: '待启动', note: '对比两家体检机构报价' },
    ],
    misc: [
      { id: uid(), title: '名片印制', content: '新员工 3 人名片待印制，对接 XX 印刷。', created: dstr(-2) },
    ],
    notified: {},
  };
}

let state = null;

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : seed();
  } catch { state = seed(); }
  save();
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.error('存储失败（可能超出 localStorage 容量）', e); }
}

export function replaceAll(data) {
  state = data; save();
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export { dstr };
