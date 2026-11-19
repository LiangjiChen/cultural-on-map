const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.5;
const CONTENT_X = MARGIN;
const CONTENT_Y = MARGIN;
const CONTENT_W = SLIDE_W - 2 * MARGIN;
const CONTENT_H = SLIDE_H - 2 * MARGIN;
const CENTER_X = SLIDE_W / 2;

const C = {
  primary: "183B45",
  primary2: "285866",
  secondary: "B64A32",
  accent: "D2A64E",
  bg: "F7F2E8",
  card: "EEE6D7",
  cardLight: "FBF8F1",
  text: "293638",
  muted: "6E7774",
  border: "D9CFBC",
  white: "FFFFFF",
  paleBlue: "DCE8E7",
  paleRed: "F0DDD3",
  paleGold: "F1E6C9",
};
const FONT_TITLE = "Noto Serif CJK SC";
const FONT_BODY = "Noto Sans CJK SC";

// Container system: relative positioning, z-ordering and text shrink protection.
function parseImageDimensions(path) {
  const match = path.match(/_(\d+)x(\d+)\.(png|jpg|jpeg|gif|webp)$/i);
  return match ? { width: parseInt(match[1]), height: parseInt(match[2]) } : null;
}
function calculateScaledImageOpts(opts) {
  const { path, w: targetW, h: targetH, x = 0, y = 0, ...rest } = opts;
  if (!path || !targetW || !targetH) return opts;
  const dims = parseImageDimensions(path);
  if (!dims) return opts;
  const imgAspect = dims.width / dims.height;
  const targetAspect = targetW / targetH;
  let scaledW, scaledH, offsetX = 0, offsetY = 0;
  if (imgAspect > targetAspect) {
    scaledW = targetW; scaledH = targetW / imgAspect;
    offsetY = (targetH - scaledH) / 2;
  } else {
    scaledH = targetH; scaledW = targetH * imgAspect;
    offsetX = (targetW - scaledW) / 2;
  }
  return { path, x: x + offsetX, y: y + offsetY, w: scaledW, h: scaledH, ...rest };
}
function createVirtualNode(type, data, parentX = 0, parentY = 0) {
  const opts = data.opts || {};
  const node = { type, data, absX: parentX + (opts.x || 0), absY: parentY + (opts.y || 0), w: opts.w || 0, h: opts.h || 0, children: [] };
  node.addShape = function(shapeType, opts = {}) { const child = createVirtualNode("shape", { shapeType, opts }, node.absX, node.absY); node.children.push(child); return child; };
  node.addText = function(text, opts = {}) {
    const safeOpts = { fit: "shrink", ...opts };
    const bulletRe = /^(?:[•◦⁃∙·●○–—]\s*|\-\s+)/;
    if (Array.isArray(text)) {
      text = text.map(item => item && item.options && item.options.bullet && typeof item.text === "string" ? { ...item, text: item.text.replace(bulletRe, "") } : item);
    }
    const child = createVirtualNode("text", { text, opts: safeOpts }, node.absX, node.absY);
    node.children.push(child); return child;
  };
  node.addImage = function(opts = {}) { const child = createVirtualNode("image", { opts: calculateScaledImageOpts(opts) }, node.absX, node.absY); node.children.push(child); return child; };
  node.addTable = function(tableData, opts = {}) { const child = createVirtualNode("table", { tableData, opts }, node.absX, node.absY); node.children.push(child); return child; };
  return node;
}
function flattenNode(node, realSlide) {
  const absOpts = { ...node.data.opts, x: node.absX, y: node.absY };
  if (node.type === "shape") realSlide.addShape(node.data.shapeType, absOpts);
  else if (node.type === "text") realSlide.addText(node.data.text, absOpts);
  else if (node.type === "image") realSlide.addImage(absOpts);
  else if (node.type === "table") realSlide.addTable(node.data.tableData, absOpts);
  node.children.forEach(child => flattenNode(child, realSlide));
}
const originalAddSlide = pres.addSlide.bind(pres);
pres.addSlide = function(options) {
  const realSlide = originalAddSlide(options);
  return {
    children: [], _realSlide: realSlide,
    set background(val) { realSlide.background = val; },
    get background() { return realSlide.background; },
    addShape(shapeType, opts = {}) { const node = createVirtualNode("shape", { shapeType, opts }, 0, 0); this.children.push(node); return node; },
    addText(text, opts = {}) { const node = createVirtualNode("text", { text, opts: { fit: "shrink", ...opts } }, 0, 0); this.children.push(node); return node; },
    addImage(opts = {}) { const node = createVirtualNode("image", { opts: calculateScaledImageOpts(opts) }, 0, 0); this.children.push(node); return node; },
    addTable(tableData, opts = {}) { const node = createVirtualNode("table", { tableData, opts }, 0, 0); this.children.push(node); return node; },
    addChart(chartType, data, opts = {}) { realSlide.addChart(chartType, data, opts); },
    render() { this.children.forEach(child => flattenNode(child, realSlide)); },
  };
};

function addHeader(slide, section, title, minutes, page) {
  slide.background = { color: C.bg };
  slide.addText(section, { x: CONTENT_X, y: 0.34, w: 5.8, h: 0.25, fontSize: 10.5, bold: true, color: C.secondary, fontFace: FONT_BODY, charSpacing: 1.2 });
  slide.addText(title, { x: CONTENT_X, y: 0.68, w: 7.8, h: 0.55, fontSize: 28, bold: true, color: C.primary, fontFace: FONT_TITLE, charSpacing: 1 });
  slide.addShape(pres.shapes.RECTANGLE, { x: 8.35, y: 0.42, w: 1.15, h: 0.38, fill: { color: C.paleRed }, line: { color: C.paleRed } });
  slide.addText(minutes, { x: 8.35, y: 0.48, w: 1.15, h: 0.22, fontSize: 11, bold: true, align: "center", color: C.secondary, fontFace: FONT_BODY });
  slide.addText(String(page).padStart(2, "0"), { x: 9.1, y: 5.18, w: 0.4, h: 0.18, fontSize: 9, color: C.muted, fontFace: FONT_BODY, align: "right" });
}
function addCard(slide, x, y, w, h, title, body, opts = {}) {
  const fill = opts.fill || C.cardLight;
  const accent = opts.accent || C.secondary;
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: opts.line || C.border, width: 0.7 } });
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.055, h, fill: { color: accent }, line: { color: accent } });
  slide.addText(title, { x: x + 0.2, y: y + 0.16, w: w - 0.38, h: 0.34, fontSize: opts.titleSize || 16, bold: true, color: opts.titleColor || C.primary, fontFace: FONT_TITLE });
  slide.addText(body, { x: x + 0.2, y: y + 0.61, w: w - 0.4, h: h - 0.76, fontSize: opts.bodySize || 13.5, color: opts.bodyColor || C.text, fontFace: FONT_BODY, valign: "top", lineSpacing: opts.lineSpacing || 22, breakLine: false });
}
function addPill(slide, text, x, y, w, opts = {}) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.38, fill: { color: opts.fill || C.paleGold }, line: { color: opts.fill || C.paleGold } });
  slide.addText(text, { x: x + 0.06, y: y + 0.075, w: w - 0.12, h: 0.22, fontSize: opts.fontSize || 11.5, bold: true, align: "center", color: opts.color || C.primary, fontFace: FONT_BODY });
}
function addArrow(slide, x, y, w = 0.36) {
  slide.addShape(pres.shapes.RIGHT_ARROW, { x, y, w, h: 0.25, fill: { color: C.accent }, line: { color: C.accent } });
}
function addNumberCircle(slide, text, x, y, d = 0.42, fill = C.secondary) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  slide.addText(text, { x, y: y + 0.055, w: d, h: d - 0.1, fontSize: 14, bold: true, align: "center", color: C.white, fontFace: FONT_BODY });
}
function drawMap(slide, x, y, w, h, realistic = false) {
  const path = realistic ? "/workspace/ppt-share/assets/map_reference_1200x700.png" : "/workspace/ppt-share/assets/map_thematic_1200x700.png";
  slide.addImage({ path, x, y, w, h });
}

// 1. Cover
{
  const slide = pres.addSlide();
  slide.background = { color: C.primary };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: SLIDE_H, fill: { color: C.accent }, line: { color: C.accent } });
  slide.addShape(pres.shapes.OVAL, { x: 7.25, y: 0.65, w: 2.1, h: 2.1, fill: { color: C.primary2, transparency: 20 }, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pres.shapes.OVAL, { x: 7.75, y: 1.15, w: 1.1, h: 1.1, fill: { color: C.secondary, transparency: 5 }, line: { color: C.secondary } });
  slide.addText("诗", { x: 7.75, y: 1.35, w: 1.1, h: 0.6, fontSize: 34, bold: true, align: "center", color: C.white, fontFace: FONT_TITLE });
  slide.addText("一场关于诗词、地理与 AI 的科普分享", { x: 0.75, y: 0.72, w: 6.4, h: 0.3, fontSize: 13, color: C.accent, fontFace: FONT_BODY, charSpacing: 1.2 });
  slide.addText("诗词山河", { x: 0.72, y: 1.35, w: 6.5, h: 0.9, fontSize: 46, bold: true, color: C.white, fontFace: FONT_TITLE, charSpacing: 3 });
  slide.addText("让每一首诗，回到它诞生的山河之间", { x: 0.75, y: 2.48, w: 7.6, h: 0.45, fontSize: 21, color: "E8DDC5", fontFace: FONT_TITLE, charSpacing: 0.8 });
  slide.addText("从一句需求，到 600 首唐宋诗词的可探索地图", { x: 0.75, y: 3.17, w: 7.7, h: 0.35, fontSize: 14, color: "B9CCCE", fontFace: FONT_BODY });
  addPill(slide, "600 首诗词", 0.75, 3.88, 1.55, { fill: C.primary2, color: C.white });
  addPill(slide, "39 个历史区域", 2.48, 3.88, 1.85, { fill: C.primary2, color: C.white });
  addPill(slide, "4 个开发日", 4.51, 3.88, 1.55, { fill: C.primary2, color: C.white });
  slide.addText("40 分钟分享  +  20 分钟提问", { x: 0.75, y: 4.77, w: 4.8, h: 0.3, fontSize: 13, bold: true, color: C.accent, fontFace: FONT_BODY });
  slide.render();
}

// 2. Agenda
{
  const slide = pres.addSlide();
  addHeader(slide, "分享路线", "今天，我们沿着四个问题前进", "1 分钟", 2);
  const items = [
    ["01", "为什么做？", "诗词为什么需要一张地图\n先看看最终成品", "第 3—4 页", C.paleRed],
    ["02", "怎样做出来？", "时间线、工具分工\n以及五个关键步骤", "第 5—12 页", C.paleGold],
    ["03", "如何上线与迭代？", "发布到互联网\n在使用反馈中持续修正", "第 13—14 页", C.paleBlue],
    ["04", "带来什么启发？", "数字人文的价值\n应用场景与开放讨论", "第 15—16 页", C.card],
  ];
  items.forEach((it, i) => {
    const x = CONTENT_X + (i % 2) * 4.6;
    const y = 1.48 + Math.floor(i / 2) * 1.55;
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.4, h: 1.32, fill: { color: it[4] }, line: { color: C.border, width: 0.6 } });
    slide.addText(it[0], { x: x + 0.2, y: y + 0.18, w: 0.55, h: 0.4, fontSize: 23, bold: true, color: C.secondary, fontFace: FONT_TITLE });
    slide.addText(it[1], { x: x + 0.88, y: y + 0.18, w: 2.9, h: 0.35, fontSize: 17, bold: true, color: C.primary, fontFace: FONT_TITLE });
    slide.addText(it[2], { x: x + 0.88, y: y + 0.61, w: 2.85, h: 0.52, fontSize: 12.5, color: C.text, fontFace: FONT_BODY, lineSpacing: 19 });
    slide.addText(it[3], { x: x + 3.0, y: y + 0.96, w: 1.2, h: 0.2, fontSize: 9.5, color: C.muted, fontFace: FONT_BODY, align: "right" });
  });
  slide.addText("分享 40 分钟", { x: 1.0, y: 4.73, w: 2.1, h: 0.3, fontSize: 14, bold: true, color: C.primary, fontFace: FONT_BODY, align: "center" });
  addArrow(slide, 3.35, 4.75, 0.55);
  slide.addText("提问与讨论 20 分钟", { x: 4.2, y: 4.73, w: 2.8, h: 0.3, fontSize: 14, bold: true, color: C.secondary, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 3. Why
{
  const slide = pres.addSlide();
  addHeader(slide, "01 为什么做", "读诗时，我们也在读一段旅程", "3 分钟", 3);
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.48, w: 4.15, h: 3.25, fill: { color: C.primary }, line: { color: C.primary } });
  slide.addText("故人西辞黄鹤楼，\n烟花三月下扬州。", { x: 0.85, y: 2.0, w: 3.45, h: 1.15, fontSize: 25, bold: true, color: C.white, fontFace: FONT_TITLE, breakLine: false, lineSpacing: 39, charSpacing: 1 });
  slide.addText("—— 李白《黄鹤楼送孟浩然之广陵》", { x: 0.85, y: 3.45, w: 3.35, h: 0.3, fontSize: 11.5, color: "D7C9AA", fontFace: FONT_BODY });
  slide.addText("诗里有地名，地名背后是空间、距离与人生。", { x: 0.85, y: 4.08, w: 3.25, h: 0.42, fontSize: 13, color: "D9E4E3", fontFace: FONT_BODY });
  const qs = [
    ["在哪里？", "黄鹤楼与扬州，在地图上相距多远？"],
    ["怎样走？", "从武昌到扬州，为什么顺江而下？"],
    ["还有什么？", "同一片山河，还留下过哪些诗词？"],
  ];
  qs.forEach((q, i) => addCard(slide, 4.95, 1.48 + i * 1.02, 4.55, 0.86, q[0], q[1], { bodySize: 12.5, titleSize: 15, lineSpacing: 18, accent: i === 1 ? C.accent : C.secondary }));
  slide.addText("项目的起点：把“阅读一首诗”，变成“探索一方山河”。", { x: 4.98, y: 4.63, w: 4.45, h: 0.32, fontSize: 14, bold: true, color: C.secondary, fontFace: FONT_BODY });
  slide.render();
}

// 4. Product journey
{
  const slide = pres.addSlide();
  addHeader(slide, "01 为什么做", "先看成品：一张可以点、可以读、可以搜的地图", "4 分钟", 4);
  drawMap(slide, 0.5, 1.48, 5.15, 3.48, false);
  slide.addText("唐诗 / 宋词", { x: 0.72, y: 1.67, w: 1.4, h: 0.25, fontSize: 12, bold: true, color: C.primary, fontFace: FONT_BODY });
  slide.addShape(pres.shapes.RECTANGLE, { x: 3.65, y: 1.65, w: 1.72, h: 0.34, fill: { color: C.cardLight }, line: { color: C.border, width: 0.6 } });
  slide.addText("搜索诗名、作者或地点", { x: 3.75, y: 1.73, w: 1.52, h: 0.18, fontSize: 8.5, color: C.muted, fontFace: FONT_BODY });
  const steps = [
    ["1", "选择时代", "唐诗三百首 / 宋词三百首"],
    ["2", "点击圆点", "查看该区域热度最高的五首"],
    ["3", "进入详情", "读全文、浅解与地理小笺"],
    ["4", "继续探索", "搜索、筛选、分页或切换地图"],
  ];
  steps.forEach((s, i) => {
    const y = 1.5 + i * 0.84;
    addNumberCircle(slide, s[0], 6.02, y, 0.4, i === 3 ? C.accent : C.secondary);
    slide.addText(s[1], { x: 6.58, y: y - 0.01, w: 2.75, h: 0.27, fontSize: 15, bold: true, color: C.primary, fontFace: FONT_TITLE });
    slide.addText(s[2], { x: 6.58, y: y + 0.35, w: 2.75, h: 0.25, fontSize: 11.5, color: C.muted, fontFace: FONT_BODY });
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.93, y: 4.72, w: 3.57, h: 0.34, fill: { color: C.paleRed }, line: { color: C.paleRed } });
  slide.addText("核心不是“看地图”，而是“沿地图读诗”。", { x: 6.05, y: 4.79, w: 3.33, h: 0.2, fontSize: 11.5, bold: true, color: C.secondary, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 5. Timeline
{
  const slide = pres.addSlide();
  addHeader(slide, "02 怎样做出来", "开发时间线：四个开发日，持续迭代", "3 分钟", 5);
  slide.addShape(pres.shapes.LINE, { x: 1.2, y: 2.74, w: 7.6, h: 0, line: { color: C.accent, width: 2 } });
  const milestones = [
    ["11 月 15 日", "初版上线", "唐诗 300 首\n盛唐十五道\n区域聚合点与前五\n全量诗库与分页"],
    ["11 月 16 日", "扩展与移动适配", "新增宋词 300 首\n北宋二十四路\n唐宋切换\n手机手势与防跳屏"],
    ["11 月 17 日", "体验集中完善", "专题 / 对照地图\n三击关闭与使用指南\n滚动提示\n零收录区域也可见"],
    ["11 月 18 日", "历史边界补充", "研究都护府体系\n叠加安西、北庭\n虚线边界与标注\n同步更新线上版本"],
  ];
  milestones.forEach((m, i) => {
    const x = 0.52 + i * 2.28;
    slide.addText(m[0], { x, y: 1.5, w: 2.05, h: 0.28, fontSize: 13, bold: true, color: C.secondary, fontFace: FONT_BODY, align: "center" });
    slide.addText(m[1], { x, y: 1.9, w: 2.05, h: 0.35, fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addShape(pres.shapes.OVAL, { x: x + 0.89, y: 2.56, w: 0.28, h: 0.28, fill: { color: i === 3 ? C.secondary : C.primary }, line: { color: C.bg, width: 2 } });
    slide.addText(m[2], { x: x + 0.1, y: 3.1, w: 1.85, h: 1.28, fontSize: 12, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 20 });
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 1.05, y: 4.62, w: 7.9, h: 0.42, fill: { color: C.paleGold }, line: { color: C.paleGold } });
  slide.addText("节奏不是“一次做完”，而是“先能用，再好读，再更准确”。", { x: 1.25, y: 4.71, w: 7.5, h: 0.24, fontSize: 13, bold: true, color: C.primary, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 6. Roles
{
  const slide = pres.addSlide();
  addHeader(slide, "02 怎样做出来", "不是 AI 独自完成，而是四方协作", "2 分钟", 6);
  const roles = [
    ["人", "提出方向", "决定做什么\n判断好不好\n核验历史与体验", C.paleRed],
    ["AI", "加速实现", "生成网页与脚本\n根据反馈修改\n协助排查问题", C.paleGold],
    ["源", "开放数据", "开源诗词文本\n公开地理数据\n历史区划研究", C.paleBlue],
    ["网", "发布传播", "浏览器呈现\nTraesite 上线\n链接便捷分享", C.card],
  ];
  roles.forEach((r, i) => {
    const x = 0.5 + i * 2.28;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 1.55, w: 2.08, h: 2.85, fill: { color: r[3] }, line: { color: C.border, width: 0.6 } });
    slide.addShape(pres.shapes.OVAL, { x: x + 0.62, y: 1.83, w: 0.84, h: 0.84, fill: { color: i === 1 ? C.secondary : C.primary }, line: { color: i === 1 ? C.secondary : C.primary } });
    slide.addText(r[0], { x: x + 0.62, y: 2.02, w: 0.84, h: 0.4, fontSize: 23, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center" });
    slide.addText(r[1], { x: x + 0.18, y: 2.93, w: 1.72, h: 0.35, fontSize: 17, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(r[2], { x: x + 0.18, y: 3.42, w: 1.72, h: 0.76, fontSize: 12, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 19 });
  });
  slide.addText("AI 降低实现门槛；人仍然负责问题、审美、事实与取舍。", { x: 1.0, y: 4.72, w: 8.0, h: 0.3, fontSize: 14, bold: true, color: C.secondary, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 7. Tools
{
  const slide = pres.addSlide();
  addHeader(slide, "02 怎样做出来", "用了哪些工具？把它们翻译成大白话", "3 分钟", 7);
  const cols = [0.5, 2.9, 6.2];
  const widths = [2.4, 3.3, 3.3];
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.45, w: 9, h: 0.42, fill: { color: C.primary }, line: { color: C.primary } });
  ["工具", "白话解释", "在项目里做什么"].forEach((t, i) => {
    slide.addText(t, { x: cols[i] + 0.15, y: 1.55, w: widths[i] - 0.3, h: 0.23, fontSize: 12.5, bold: true, color: C.white, fontFace: FONT_BODY });
  });
  const rows = [
    ["Trae AI", "对话式开发伙伴", "生成页面、修改功能、协助排错"],
    ["React + TypeScript", "网页积木 + 拼写检查", "组织页面结构，提前发现差错"],
    ["SVG", "可无限放大的数字地图", "绘制区域、圆点、边界与地名"],
    ["Python + Shapely + PyProj", "地理数据整理与坐标换算", "清洗疆域数据，生成可用地图"],
    ["Traesite", "网站发布与访问", "发布网站，提供统一访问入口"],
  ];
  rows.forEach((r, i) => {
    const y = 1.93 + i * 0.59;
    const fill = i % 2 === 0 ? C.cardLight : C.card;
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 9, h: 0.53, fill: { color: fill }, line: { color: C.border, width: 0.4 } });
    r.forEach((t, j) => {
      slide.addText(t, { x: cols[j] + 0.15, y: y + 0.13, w: widths[j] - 0.3, h: 0.29, fontSize: j === 0 ? (i === 4 ? 10 : 11.5) : 12, bold: j === 0, color: j === 0 ? C.primary : C.text, fontFace: FONT_BODY });
    });
  });
  slide.addText("另有 Git 记录每次修改，像“修订历史”一样便于追踪与回溯。", { x: 0.72, y: 4.91, w: 8.55, h: 0.24, fontSize: 11.5, color: C.muted, fontFace: FONT_BODY });
  slide.render();
}

// 8. Data
{
  const slide = pres.addSlide();
  addHeader(slide, "02 关键步骤 · 一", "先把诗词整理好：内容准确，才有后面的地图", "3 分钟", 8);
  const stats = [["600", "首唐宋诗词"], ["39", "个历史区域"], ["6", "类核心信息"]];
  stats.forEach((s, i) => {
    const x = 0.5 + i * 1.8;
    slide.addText(s[0], { x, y: 1.5, w: 1.55, h: 0.65, fontSize: 35, bold: true, color: i === 0 ? C.secondary : C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(s[1], { x, y: 2.18, w: 1.55, h: 0.28, fontSize: 12.5, color: C.muted, fontFace: FONT_BODY, align: "center" });
  });
  addCard(slide, 6.05, 1.48, 3.45, 1.22, "每首作品包含什么？", "标题、作者、正文、浅解\n地理位置、区域归属", { fill: C.paleGold, bodySize: 12.5, lineSpacing: 20 });
  const flow = [["收集文本", "开源诗词库"], ["补充解释", "浅解与地理小笺"], ["建立关联", "唐诗归十五道\n宋词归二十四路"]];
  flow.forEach((f, i) => {
    const x = 0.5 + i * 3.05;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 3.0, w: 2.65, h: 1.0, fill: { color: i === 1 ? C.paleRed : C.cardLight }, line: { color: C.border, width: 0.7 } });
    slide.addText(f[0], { x: x + 0.15, y: 3.16, w: 2.35, h: 0.28, fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(f[1], { x: x + 0.15, y: 3.55, w: 2.35, h: 0.3, fontSize: 11.5, color: C.muted, fontFace: FONT_BODY, align: "center" });
    if (i < 2) addArrow(slide, x + 2.72, 3.37, 0.26);
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 9, h: 0.55, fill: { color: C.primary }, line: { color: C.primary } });
  slide.addText("数据原则：开源文本没有可靠创作年份，就不凭空猜测、不强行补齐。", { x: 0.78, y: 4.55, w: 8.45, h: 0.26, fontSize: 13, bold: true, color: C.white, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 9. Map construction
{
  const slide = pres.addSlide();
  addHeader(slide, "02 关键步骤 · 二", "再把历史画成地图：先研究，再绘制", "4 分钟", 9);
  const steps = [
    ["1", "查史料", "明确唐代十五道\n北宋二十四路"],
    ["2", "定区域", "记录治所、今属地\n与历史说明"],
    ["3", "画边界", "用 SVG 描绘\n可缩放的区域"],
    ["4", "放地名", "自动避让重叠\n必要时加引线"],
    ["5", "连诗词", "让每个区域\n连接对应作品"],
  ];
  steps.forEach((s, i) => {
    const x = 0.5 + i * 1.82;
    addNumberCircle(slide, s[0], x + 0.57, 1.52, 0.5, i === 4 ? C.secondary : C.primary);
    slide.addText(s[1], { x, y: 2.2, w: 1.64, h: 0.35, fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(s[2], { x, y: 2.72, w: 1.64, h: 0.68, fontSize: 11.5, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 19 });
    if (i < 4) addArrow(slide, x + 1.58, 1.67, 0.25);
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.73, w: 4.3, h: 1.08, fill: { color: C.paleBlue }, line: { color: C.border, width: 0.6 } });
  slide.addText("为什么要研究都护府？", { x: 0.72, y: 3.91, w: 3.85, h: 0.3, fontSize: 15, bold: true, color: C.primary, fontFace: FONT_TITLE });
  slide.addText("十五道之外还有都护府等体系；轮台、安西等地名与边塞诗密切相关。", { x: 0.72, y: 4.32, w: 3.85, h: 0.34, fontSize: 11.5, color: C.text, fontFace: FONT_BODY });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.05, y: 3.73, w: 4.45, h: 1.08, fill: { color: C.paleRed }, line: { color: C.border, width: 0.6 } });
  slide.addText("地图不是装饰，而是知识的索引", { x: 5.28, y: 3.96, w: 4.0, h: 0.34, fontSize: 17, bold: true, color: C.secondary, fontFace: FONT_TITLE, align: "center" });
  slide.addText("区域、地名与诗词彼此连接，才能支持探索。", { x: 5.28, y: 4.4, w: 4.0, h: 0.25, fontSize: 11.5, color: C.text, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 10. Interaction
{
  const slide = pres.addSlide();
  addHeader(slide, "02 关键步骤 · 三", "让地图真正好用：从圆点到一首完整的诗", "3 分钟", 10);
  const flow = [
    ["圆点", "大小表示\n收录数量"],
    ["区域前五", "先看最有代表性\n或热度高的作品"],
    ["诗词详情", "全文、浅解\n地理小笺"],
    ["继续发现", "搜索、筛选\n分页与复制"],
  ];
  flow.forEach((f, i) => {
    const x = 0.5 + i * 2.28;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 1.55, w: 2.0, h: 2.05, fill: { color: i === 2 ? C.paleRed : C.cardLight }, line: { color: C.border, width: 0.7 } });
    if (i === 0) {
      slide.addShape(pres.shapes.OVAL, { x: x + 0.65, y: 1.86, w: 0.7, h: 0.7, fill: { color: C.secondary }, line: { color: C.secondary } });
      slide.addText("32", { x: x + 0.65, y: 2.04, w: 0.7, h: 0.3, fontSize: 17, bold: true, color: C.white, fontFace: FONT_BODY, align: "center" });
    } else addNumberCircle(slide, String(i + 1), x + 0.75, 1.91, 0.5, i === 2 ? C.secondary : C.primary);
    slide.addText(f[0], { x: x + 0.15, y: 2.77, w: 1.7, h: 0.32, fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(f[1], { x: x + 0.15, y: 3.1, w: 1.7, h: 0.45, fontSize: 11.5, color: C.muted, fontFace: FONT_BODY, align: "center", lineSpacing: 16 });
    if (i < 3) addArrow(slide, x + 2.03, 2.35, 0.22);
  });
  addCard(slide, 0.5, 3.95, 4.3, 0.9, "为“0 首”也保留位置", "河东路暂无收录，也显示名称、0 和一个小点。", { titleSize: 14, bodySize: 11.5, lineSpacing: 17, fill: C.paleGold });
  addCard(slide, 5.05, 3.95, 4.45, 0.9, "让不同人都能操作", "支持键盘导航，并兼顾电脑点击与手机手势。", { titleSize: 14, bodySize: 11.5, lineSpacing: 17, fill: C.paleBlue });
  slide.render();
}

// 11. Two maps
{
  const slide = pres.addSlide();
  addHeader(slide, "02 关键步骤 · 四", "为什么保留两种地图？因为用途不同", "3 分钟", 11);
  addPill(slide, "专题地图 · 看清楚分区", 1.35, 1.45, 2.55, { fill: C.primary, color: C.white });
  addPill(slide, "对照地图 · 对照真实轮廓", 6.02, 1.45, 2.72, { fill: C.secondary, color: C.white });
  drawMap(slide, 0.5, 1.98, 4.25, 2.0, false);
  drawMap(slide, 5.25, 1.98, 4.25, 2.0, true);
  slide.addText("区块清楚、关系直观\n适合课堂讲解与快速查找", { x: 0.85, y: 4.15, w: 3.55, h: 0.58, fontSize: 13, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 21 });
  slide.addText("疆域更接近历史地理\n适合对照山河位置与都护府", { x: 5.6, y: 4.15, w: 3.55, h: 0.58, fontSize: 13, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 21 });
  slide.addText("不是新地图替代旧地图，而是让不同阅读需求都有入口。", { x: 1.0, y: 4.88, w: 8.0, h: 0.25, fontSize: 13, bold: true, color: C.secondary, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 12. Mobile
{
  const slide = pres.addSlide();
  addHeader(slide, "02 关键步骤 · 五", "最后照顾每一个使用细节，尤其是手机", "3 分钟", 12);
  const cards = [
    ["看得清", "两轮放大字体\n搜索结果适配小屏\n按钮保留足够空间", "字", C.paleRed],
    ["划得顺", "左右滑动关闭详情\n避免误回退整个页面\n切换诗集不再跳屏", "划", C.paleGold],
    ["找得到", "地图放大后有滚动提示\n三击关闭配有文字说明\n帮助页采用同样逻辑", "找", C.paleBlue],
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 3.05;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 2.75, h: 3.35, fill: { color: c[3] }, line: { color: C.border, width: 0.7 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: x + 0.82, y: 1.78, w: 1.12, h: 1.45, fill: { color: C.cardLight }, line: { color: C.primary, width: 1.5 } });
    slide.addShape(pres.shapes.OVAL, { x: x + 1.25, y: 2.08, w: 0.26, h: 0.26, fill: { color: C.secondary }, line: { color: C.secondary } });
    slide.addText(c[2], { x: x + 0.96, y: 2.48, w: 0.84, h: 0.38, fontSize: 20, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(c[0], { x: x + 0.2, y: 3.47, w: 2.35, h: 0.36, fontSize: 18, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(c[1], { x: x + 0.22, y: 3.97, w: 2.31, h: 0.68, fontSize: 11.5, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 19 });
  });
  slide.render();
}

// 13. Publish
{
  const slide = pres.addSlide();
  addHeader(slide, "03 如何上线与迭代", "从电脑里的项目，到任何人都能打开的网页", "2 分钟", 13);
  const steps = [["本地完成", "页面与数据"], ["构建网页", "生成发布文件"], ["Traesite 发布", "traesite.cn"], ["在线分享", "统一访问入口"]];
  steps.forEach((s, i) => {
    const x = 0.5 + i * 2.28;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 1.55, w: 2.0, h: 1.35, fill: { color: i === 2 ? C.paleRed : C.cardLight }, line: { color: C.border, width: 0.7 } });
    addNumberCircle(slide, String(i + 1), x + 0.16, 1.75, 0.38, i === 3 ? C.secondary : C.primary);
    slide.addText(s[0], { x: x + 0.18, y: 2.2, w: 1.64, h: 0.3, fontSize: 15, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center" });
    slide.addText(s[1], { x: x + 0.18, y: 2.56, w: 1.64, h: 0.22, fontSize: 10.5, color: C.muted, fontFace: FONT_BODY, align: "center" });
    if (i < 3) addArrow(slide, x + 2.03, 2.05, 0.22);
  });
  addCard(slide, 0.5, 3.25, 4.3, 1.42, "访问平台", "Traesite：37k39efxx9ty2kvgaxg.traesite.cn\n每次功能更新后重新构建并同步发布", { bodySize: 11, lineSpacing: 19, fill: C.paleBlue });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.05, y: 3.25, w: 4.45, h: 1.42, fill: { color: C.primary }, line: { color: C.primary } });
  slide.addText("Traesite 访问地址", { x: 5.35, y: 3.49, w: 3.85, h: 0.3, fontSize: 15, bold: true, color: C.accent, fontFace: FONT_TITLE, align: "center" });
  slide.addText("37k39efxx9ty2kvgaxg.traesite.cn", { x: 5.3, y: 4.03, w: 3.95, h: 0.3, fontSize: 13, bold: true, color: C.white, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 14. Challenges
{
  const slide = pres.addSlide();
  addHeader(slide, "03 如何上线与迭代", "四个真实难题：答案都来自试用、反馈与修正", "3 分钟", 14);
  const challenges = [
    ["地名挤在一起", "像安排座位一样自动避让，仍放不下就加引线。", "标签重叠 → 自动布局"],
    ["古今地图难兼顾", "同时保留专题与对照地图，不用一种视图包打天下。", "历史口径 → 双地图"],
    ["手机滑动会误回退", "识别滑动方向，把关闭动作限制在诗词详情页。", "手势冲突 → 精细处理"],
    ["原始数据缺少年份", "查证开源数据后不猜测、不编造，停止无可靠来源的补充。", "信息缺失 → 守住事实"],
  ];
  challenges.forEach((c, i) => {
    const x = 0.5 + (i % 2) * 4.6;
    const y = 1.48 + Math.floor(i / 2) * 1.7;
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.4, h: 1.45, fill: { color: i === 3 ? C.paleRed : C.cardLight }, line: { color: C.border, width: 0.7 } });
    slide.addText(c[2], { x: x + 0.2, y: y + 0.16, w: 3.95, h: 0.23, fontSize: 10.5, bold: true, color: C.secondary, fontFace: FONT_BODY });
    slide.addText(c[0], { x: x + 0.2, y: y + 0.5, w: 3.95, h: 0.32, fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE });
    slide.addText(c[1], { x: x + 0.2, y: y + 0.94, w: 3.95, h: 0.34, fontSize: 11.5, color: C.text, fontFace: FONT_BODY });
  });
  slide.addText("关键经验：AI 可以加速修改，但“什么是对的”仍需要人来判断。", { x: 0.85, y: 4.93, w: 8.3, h: 0.25, fontSize: 13, bold: true, color: C.secondary, fontFace: FONT_BODY, align: "center" });
  slide.render();
}

// 15. Value
{
  const slide = pres.addSlide();
  addHeader(slide, "04 价值与讨论", "这个项目带来的，不只是一个网页", "2 分钟", 15);
  const lessons = [
    ["从想法到原型", "AI 降低了实现门槛，非工程专业也能参与数字产品创造。"],
    ["从文本到空间", "诗词、历史与地理结合后，知识变得可定位、可比较、可探索。"],
    ["从完成到好用", "真正决定体验的，是一次次试用、反馈和对细节的坚持。"],
  ];
  lessons.forEach((l, i) => {
    const y = 1.48 + i * 1.06;
    addNumberCircle(slide, String(i + 1), 0.55, y + 0.08, 0.42, i === 1 ? C.accent : C.secondary);
    slide.addText(l[0], { x: 1.15, y, w: 3.85, h: 0.32, fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE });
    slide.addText(l[1], { x: 1.15, y: y + 0.42, w: 3.85, h: 0.43, fontSize: 11.5, color: C.text, fontFace: FONT_BODY });
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.35, y: 1.48, w: 4.15, h: 3.2, fill: { color: C.primary }, line: { color: C.primary } });
  slide.addText("它可以用在哪里？", { x: 5.65, y: 1.75, w: 3.55, h: 0.36, fontSize: 18, bold: true, color: C.accent, fontFace: FONT_TITLE, align: "center" });
  const scenes = [["课堂教学", "把诗放进地图讲"], ["文化展陈", "让观众自主探索"], ["旅行阅读", "带着诗词看山河"], ["亲子共学", "从地点激发好奇"]];
  scenes.forEach((s, i) => {
    const x = 5.65 + (i % 2) * 1.8;
    const y = 2.4 + Math.floor(i / 2) * 0.95;
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.62, h: 0.76, fill: { color: C.primary2 }, line: { color: "567681", width: 0.6 } });
    slide.addText(s[0], { x: x + 0.1, y: y + 0.12, w: 1.42, h: 0.23, fontSize: 12.5, bold: true, color: C.white, fontFace: FONT_BODY, align: "center" });
    slide.addText(s[1], { x: x + 0.1, y: y + 0.43, w: 1.42, h: 0.19, fontSize: 9.5, color: "D7E3E2", fontFace: FONT_BODY, align: "center" });
  });
  slide.addText("技术把入口做轻，文化把内容做深。", { x: 0.65, y: 4.9, w: 8.7, h: 0.28, fontSize: 15, bold: true, color: C.secondary, fontFace: FONT_TITLE, align: "center" });
  slide.render();
}

// 16. Q&A
{
  const slide = pres.addSlide();
  slide.background = { color: C.primary };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SLIDE_W, h: 0.08, fill: { color: C.accent }, line: { color: C.accent } });
  slide.addText("谢谢聆听", { x: 0.65, y: 0.72, w: 4.4, h: 0.7, fontSize: 36, bold: true, color: C.white, fontFace: FONT_TITLE, charSpacing: 2 });
  slide.addText("提问与讨论 · 20 分钟", { x: 0.68, y: 1.58, w: 4.2, h: 0.35, fontSize: 18, color: C.accent, fontFace: FONT_BODY });
  const prompts = [
    "如果用于课堂或展览，你最想增加什么？",
    "你更想沿着诗人的足迹，还是沿着城市读诗？",
    "AI 参与文化产品，应守住哪些事实与表达边界？",
  ];
  prompts.forEach((p, i) => {
    addNumberCircle(slide, String(i + 1), 0.72, 2.32 + i * 0.7, 0.36, C.secondary);
    slide.addText(p, { x: 1.25, y: 2.34 + i * 0.7, w: 6.9, h: 0.32, fontSize: 14, color: "E4ECEA", fontFace: FONT_BODY });
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 6.55, y: 0.78, w: 2.75, h: 1.1, fill: { color: C.primary2 }, line: { color: "567681", width: 0.7 } });
  slide.addText("Traesite 访问地址", { x: 6.77, y: 0.98, w: 2.3, h: 0.23, fontSize: 11, color: "C7D7D6", fontFace: FONT_BODY, align: "center" });
  slide.addText("37k39efxx9ty2kvgaxg.\ntraesite.cn", { x: 6.77, y: 1.3, w: 2.3, h: 0.42, fontSize: 13, bold: true, color: C.white, fontFace: FONT_BODY, align: "center", lineSpacing: 18 });
  slide.addText("诗词山河 · 让每一首诗回到它诞生的山河之间", { x: 0.68, y: 4.85, w: 8.65, h: 0.28, fontSize: 13, color: "AFC4C5", fontFace: FONT_TITLE });
  slide.render();
}

const outputPath = "/workspace/ppt-share/诗词山河-科普分享.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("PPT saved to:", outputPath);
}).catch(err => {
  console.error("Error:", err);
  process.exitCode = 1;
});
