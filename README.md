# 行政工作台（Admin Workbench）

一人多岗行政的个人工作台 · 网页版 · 纯前端 · 数据本机存储。

## 功能模块

| 模块 | 说明 |
|---|---|
| 📊 工作看板 | 日历（农历/法定节假日）、今日待办、会议室实时状态、行政资讯、到期雷达 |
| ✅ 待办事项 | 优先级标签、进度跟踪、重复任务、浏览器到期提醒 |
| 📝 模板中心 | 会议/放假通知、会议纪要、月报模板，Markdown 在线编辑 + 版本管理 |
| 📜 制度管理 | 印章/保洁/前台等制度，分类 + 全文搜索 |
| 🗂 档案管理 | 合同台账，分类、搜索、到期提醒、附件路径引用 |
| 💻 固定资产 | 电脑/桌椅/车辆台账，筛选、Excel 多 Sheet 导出 |
| 💰 费用台账 | 明细、汇总、类别排行、月度趋势图、环比分析 |
| 🍚 后勤管理 | 食堂管理、设施设备维护、应急预案 |
| 🎉 员工活动/福利 | 节日福利采购、周年庆、生日会、团建、体检 |
| 📌 其他行政事务 | 杂项备忘 |

全局：`Ctrl+K` 全局搜索 · 一键 JSON 备份/还原 · 浏览器原生到期通知。

## 技术栈

纯 HTML + CSS + 原生 ES Modules，**无构建工具**。依赖已本地化到 `vendor/`：

- [lunar-javascript](https://github.com/6tail/lunar-javascript) — 农历/法定节假日
- [Chart.js](https://www.chartjs.org/) — 图表
- [marked](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify) — Markdown 渲染与净化
- [SheetJS](https://sheetjs.com/) — xlsx 多 Sheet 导出

数据存储：localStorage（约 5MB 上限，请定期使用顶栏「备份」导出 JSON）。

## 本地运行

ES Modules 需要通过 HTTP 协议访问（双击 index.html 会因浏览器安全策略失败）：

```bash
cd admin-workbench
python -m http.server 8080
# 打开 http://localhost:8080
```

或用 VS Code 的 Live Server 插件直接打开。

## 在线访问

通过 GitHub Pages 部署：`https://<用户名>.github.io/<仓库名>/`

> 注意：GitHub Pages 是公开静态托管，页面本身无登录。所有数据保存在**访问者自己浏览器**的 localStorage，不会上传到服务器。
