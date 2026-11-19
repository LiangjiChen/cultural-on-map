const pptxgen = require("pptxgenjs");

// ============================================================
// SLIDE DIMENSIONS
// ============================================================
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.5;
const CONTENT_X = MARGIN;
const CONTENT_Y = MARGIN;
const CONTENT_W = SLIDE_W - 2 * MARGIN;
const CONTENT_H = SLIDE_H - 2 * MARGIN;
const CENTER_X = SLIDE_W / 2;

// ============================================================
// COLOR PALETTE - 中国风 · 藏青朱砂
// ============================================================
const C = {
  primary: "1a3a4a",    // 藏青
  secondary: "c8402a",  // 朱砂
  accent: "d4a849",     // 金色
  bg: "f5f1e8",         // 米白
  bgCard: "ede8dc",     // 卡片底
  text: "2c2c2c",       // 正文
  textLight: "6b6b6b",  // 次要文字
  white: "ffffff",
  lightBorder: "d4cfc0",
};

// ============================================================
// CONTAINER SYSTEM WITH TEXT OVERFLOW PROTECTION
// ============================================================
function parseImageDimensions(path) {
  const match = path.match(/_(\d+)x(\d+)\.(png|jpg|jpeg|gif|webp)$/i);
  if (match) return { width: parseInt(match[1]), height: parseInt(match[2]) };
  return null;
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
  node.addShape = function(shapeType, opts = {}) { const child = createVirtualNode('shape', { shapeType, opts }, node.absX, node.absY); node.children.push(child); return child; };
  node.addText = function(text, opts = {}) {
    const safeOpts = { fit: "shrink", ...opts };
    const bulletRe = /^(?:[•◦⁃∙·●○–—]\s*|\-\s+)/;
    if (Array.isArray(text)) {
      text = text.map(item => {
        if (item && item.options && item.options.bullet && typeof item.text === 'string') {
          return { ...item, text: item.text.replace(bulletRe, '') };
        }
        return item;
      });
    }
    const child = createVirtualNode('text', { text, opts: safeOpts }, node.absX, node.absY);
    node.children.push(child); return child;
  };
  node.addImage = function(opts = {}) { const scaledOpts = calculateScaledImageOpts(opts); const child = createVirtualNode('image', { opts: scaledOpts }, node.absX, node.absY); node.children.push(child); return child; };
  node.addTable = function(tableData, opts = {}) { const child = createVirtualNode('table', { tableData, opts }, node.absX, node.absY); node.children.push(child); return child; };
  return node;
}
function flattenNode(node, realSlide, pres) {
  const absOpts = { ...node.data.opts, x: node.absX, y: node.absY };
  if (node.type === 'shape') realSlide.addShape(node.data.shapeType, absOpts);
  else if (node.type === 'text') realSlide.addText(node.data.text, absOpts);
  else if (node.type === 'image') realSlide.addImage(absOpts);
  else if (node.type === 'table') realSlide.addTable(node.data.tableData, absOpts);
  node.children.forEach(child => flattenNode(child, realSlide, pres));
}
const originalAddSlide = pres.addSlide.bind(pres);
pres.addSlide = function(options) {
  const realSlide = originalAddSlide(options);
  const virtualSlide = {
    children: [], _realSlide: realSlide,
    set background(val) { realSlide.background = val; },
    get background() { return realSlide.background; },
    addShape: function(shapeType, opts = {}) { const node = createVirtualNode('shape', { shapeType, opts }, 0, 0); this.children.push(node); return node; },
    addText: function(text, opts = {}) { const safeOpts = { fit: "shrink", ...opts }; const node = createVirtualNode('text', { text, opts: safeOpts }, 0, 0); this.children.push(node); return node; },
    addImage: function(opts = {}) { const scaledOpts = calculateScaledImageOpts(opts); const node = createVirtualNode('image', { opts: scaledOpts }, node.absX, node.absY); this.children.push(node); return node; },
    addTable: function(tableData, opts = {}) { const node = createVirtualNode('table', { tableData, opts }, 0, 0); this.children.push(node); return node; },
    addChart: function(chartType, data, opts = {}) { realSlide.addChart(chartType, data, opts); },
    render: function() { this.children.forEach(child => flattenNode(child, realSlide, pres)); }
  };
  return virtualSlide;
};
// ============================================================
// HELPER FUNCTIONS
// ============================================================
const FONT_TITLE = "SimSun";
const FONT_BODY = "Noto Sans CJK SC";

function addSlideTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: CONTENT_X, y: CONTENT_Y, w: CONTENT_W, h: 0.6,
    fontSize: 28, bold: true, color: C.primary, fontFace: FONT_TITLE,
    charSpacing: 1.5,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: CONTENT_X, y: CONTENT_Y + 0.55, w: CONTENT_W, h: 0.35,
      fontSize: 14, color: C.textLight, fontFace: FONT_BODY,
    });
  }
  // accent line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: CONTENT_X, y: CONTENT_Y + (subtitle ? 0.95 : 0.65), w: 0.8, h: 0.04,
    fill: { color: C.secondary },
  });
}

function addBulletList(slide, items, x, y, w, opts = {}) {
  const { fontSize = 14, color = C.text, lineSpacing = 28, bulletColor = C.secondary } = opts;
  const textItems = items.map(item => ({
    text: item,
    options: {
      fontSize, color, fontFace: FONT_BODY,
      bullet: { code: "2022", color: bulletColor },
      lineSpacing,
    }
  }));
  slide.addText(textItems, { x, y, w, h: items.length * (lineSpacing / 72) + 0.2, valign: "top" });
}

function addCard(slide, x, y, w, h, title, body, opts = {}) {
  const { bgColor = C.bgCard, titleColor = C.primary, bodyColor = C.text, titleSize = 16, bodySize = 12, icon } = opts;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: bgColor }, line: { color: C.lightBorder, width: 0.5 },
    rectRadius: 0.08,
  });
  let tx = x + 0.2;
  if (icon) {
    slide.addText(icon, { x: x + 0.15, y: y + 0.15, w: 0.4, h: 0.4, fontSize: 20, align: "center" });
    tx = x + 0.55;
  }
  slide.addText(title, {
    x: tx, y: y + 0.15, w: w - (tx - x) - 0.15, h: 0.35,
    fontSize: titleSize, bold: true, color: titleColor, fontFace: FONT_TITLE,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.55, w: w - 0.4, h: h - 0.7,
    fontSize: bodySize, color: bodyColor, fontFace: FONT_BODY, valign: "top",
    lineSpacing: bodySize * 1.8,
  });
}

// ============================================================
// SLIDE 1: COVER
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.primary };

  // decorative top border
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SLIDE_W, h: 0.06, fill: { color: C.accent } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: SLIDE_H - 0.06, w: SLIDE_W, h: 0.06, fill: { color: C.accent } });

  // main title
  slide.addText("诗词山河", {
    x: 0, y: 1.2, w: SLIDE_W, h: 1.2,
    fontSize: 54, bold: true, color: C.white, fontFace: FONT_TITLE,
    align: "center", charSpacing: 4,
  });

  // subtitle
  slide.addText("地图上的诗词 · 开发分享", {
    x: 0, y: 2.4, w: SLIDE_W, h: 0.6,
    fontSize: 24, color: C.accent, fontFace: FONT_TITLE,
    align: "center", charSpacing: 2,
  });

  // description
  slide.addText("从一句话需求到六百首诗词的山河画卷", {
    x: 0, y: 3.2, w: SLIDE_W, h: 0.4,
    fontSize: 14, color: "a0b4c0", fontFace: FONT_BODY,
    align: "center",
  });

  // bottom info
  slide.addText("分享 + 讨论 · 60分钟", {
    x: 0, y: 4.3, w: SLIDE_W, h: 0.3,
    fontSize: 12, color: "8098a8", fontFace: FONT_BODY, align: "center",
  });

  slide.render();
}

// ============================================================
// SLIDE 2: TABLE OF CONTENTS
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "目录", "CONTENTS");

  const items = [
    { num: "01", title: "项目背景与目标", desc: "从需求到产品定位" },
    { num: "02", title: "技术栈与工具", desc: "React · Vite · Trae AI" },
    { num: "03", title: "关键开发步骤", desc: "数据建设 → 地图 → 交互 → 优化" },
    { num: "04", title: "部署与上线", desc: "Vercel + Traesite 双平台" },
    { num: "05", title: "挑战与解决", desc: "真实疆域、标签避让、移动端" },
    { num: "06", title: "总结与讨论", desc: "经验沉淀 · Q&A" },
  ];

  const startY = 1.55;
  const rowH = 0.5;
  items.forEach((item, i) => {
    const y = startY + i * rowH;
    // number
    slide.addText(item.num, {
      x: CONTENT_X + 0.2, y, w: 0.6, h: 0.4,
      fontSize: 20, bold: true, color: C.accent, fontFace: FONT_TITLE,
    });
    // title
    slide.addText(item.title, {
      x: CONTENT_X + 0.9, y, w: 3, h: 0.4,
      fontSize: 18, bold: true, color: C.primary, fontFace: FONT_TITLE,
    });
    // desc
    slide.addText(item.desc, {
      x: CONTENT_X + 4.2, y: y + 0.03, w: 4, h: 0.35,
      fontSize: 13, color: C.textLight, fontFace: FONT_BODY,
    });
  });

  slide.addText("时间建议：背景与工具 8′ · 关键步骤 20′ · 部署与挑战 7′ · 成果与总结 5′ · 讨论 20′", {
    x: CONTENT_X + 0.2, y: 4.72, w: CONTENT_W - 0.4, h: 0.32,
    fontSize: 11, color: C.secondary, fontFace: FONT_BODY, bold: true,
  });

  slide.render();
}

// ============================================================
// SLIDE 3: PROJECT BACKGROUND
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "项目背景与目标", "BACKGROUND & GOALS");

  // left: origin
  addCard(slide, CONTENT_X, 1.6, 4.2, 1.8, "一句话需求", "\"地图上的唐诗\"\n展示唐朝十五道地图，收录300首诗\n点击聚合点查看Top5，支持详情和分页", { titleSize: 18, bodySize: 13 });

  // right: evolution
  addCard(slide, CONTENT_X + 4.6, 1.6, 4.2, 1.8, "持续演进", "→ 新增宋词300首 + 北宋二十四路\n→ 真实疆域地图 + 双地图切换\n→ 移动端适配 + 手势交互\n→ 都护府虚线边界叠加", { titleSize: 18, bodySize: 13 });

  // bottom: product positioning
  slide.addShape(pres.shapes.RECTANGLE, {
    x: CONTENT_X, y: 3.7, w: CONTENT_W, h: 1.3,
    fill: { color: C.primary }, rectRadius: 0.08,
  });
  slide.addText("产品定位", {
    x: CONTENT_X + 0.3, y: 3.85, w: 2, h: 0.3,
    fontSize: 14, bold: true, color: C.accent, fontFace: FONT_BODY,
  });
  slide.addText("诗词山河 —— 一个以地图为载体、以诗词为内容的交互式文化探索应用。\n让每一首诗回到它诞生的山河之间。", {
    x: CONTENT_X + 0.3, y: 4.15, w: CONTENT_W - 0.6, h: 0.7,
    fontSize: 15, color: C.white, fontFace: FONT_BODY, lineSpacing: 24,
  });

  slide.render();
}

// ============================================================
// SLIDE 4: TECH STACK
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "技术栈与工具", "TECH STACK & TOOLS");

  const stacks = [
    { icon: "⚛️", title: "前端框架", items: "React 19\nTypeScript 5.7\nVite 6" },
    { icon: "🗺️", title: "地图与可视化", items: "SVG 矢量地图\nPyProj (Albers投影)\nShapely (几何计算)" },
    { icon: "🎨", title: "UI 与样式", items: "Lucide React 图标\n原生 CSS (响应式)\n安全区适配" },
    { icon: "🚀", title: "部署与运维", items: "Vercel (生产环境)\nTraesite (国内镜像)\nTinyURL 短链" },
  ];

  const cardW = (CONTENT_W - 0.6) / 4;
  stacks.forEach((s, i) => {
    const x = CONTENT_X + i * (cardW + 0.2);
    addCard(slide, x, 1.7, cardW, 2.8, s.title, s.items, {
      icon: s.icon, titleSize: 14, bodySize: 12,
    });
  });

  // bottom: dev tool
  slide.addShape(pres.shapes.RECTANGLE, {
    x: CONTENT_X, y: 4.7, w: CONTENT_W, h: 0.5,
    fill: { color: C.bgCard }, rectRadius: 0.06,
  });
  slide.addText("🤖 开发方式：Trae AI 辅助开发 —— 自然语言描述需求，AI 生成代码并迭代优化", {
    x: CONTENT_X + 0.2, y: 4.78, w: CONTENT_W - 0.4, h: 0.35,
    fontSize: 13, color: C.primary, fontFace: FONT_BODY,
  });

  slide.render();
}

// ============================================================
// SLIDE 5: ARCHITECTURE
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "整体架构", "ARCHITECTURE");

  // Architecture diagram using native shapes
  const layers = [
    { label: "App.tsx (入口 + 状态管理)", color: C.primary, textColor: C.white, y: 1.7 },
    { label: "TangMap / SongMap (SVG地图)", color: "2a5a6a", textColor: C.white, y: 2.4 },
    { label: "RegionPanel (区域Top5) | PoemLibrary (全量诗库)", color: "3a7a8a", textColor: C.white, y: 3.1 },
    { label: "PoemModal (详情弹窗) | HelpModal | AboutModal", color: "4a9aaa", textColor: C.white, y: 3.8 },
    { label: "数据层: poems.ts (300唐诗) | songPoems.ts (300宋词) | regions.ts | mapGeometry.ts", color: C.bgCard, textColor: C.text, y: 4.5 },
  ];

  layers.forEach((layer, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: CONTENT_X + 0.5, y: layer.y, w: CONTENT_W - 1, h: 0.5,
      fill: { color: layer.color }, rectRadius: 0.06,
    });
    slide.addText(layer.label, {
      x: CONTENT_X + 0.7, y: layer.y + 0.08, w: CONTENT_W - 1.4, h: 0.35,
      fontSize: 12, color: layer.textColor, fontFace: FONT_BODY,
    });
    // arrow
    if (i < layers.length - 1) {
      slide.addShape(pres.shapes.DOWN_ARROW, {
        x: CENTER_X - 0.1, y: layer.y + 0.52, w: 0.2, h: 0.15,
        fill: { color: C.accent },
      });
    }
  });

  slide.render();
}

// ============================================================
// SLIDE 6: STEP 1 - DATA
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "Step 1: 数据建设", "DATA CONSTRUCTION");

  // Left: Tang data
  addCard(slide, CONTENT_X, 1.7, 4.2, 1.5, "唐诗 300 首", "按十五道归类\n每首含：标题/作者/正文/解释/地理注\n数据来源：chinese-poetry (GitHub开源)", { titleSize: 16, bodySize: 12 });

  // Right: Song data
  addCard(slide, CONTENT_X + 4.6, 1.7, 4.2, 1.5, "宋词 300 首", "按北宋二十四路归类\n同结构：标题/作者/正文/解释/地理注\n6个数据文件合并", { titleSize: 16, bodySize: 12 });

  // Bottom: region data
  addCard(slide, CONTENT_X, 3.4, CONTENT_W, 1.5, "行政区划数据", "唐：十五道（京畿道、河南道、陇右道、江南东道等）\n宋：二十四路（京畿路、两浙路、河东路、成都府路等）\n每条含：名称 / 治所 / 今属地 / 描述 / SVG路径 / 中心坐标", { titleSize: 16, bodySize: 11 });

  slide.render();
}

// ============================================================
// SLIDE 7: STEP 2 - MAP
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "Step 2: 地图实现", "MAP IMPLEMENTATION");

  const steps = [
    { num: "①", title: "原地图", desc: "手工绘制SVG路径\n十五道区块式边界\n简洁明了" },
    { num: "②", title: "真实疆域", desc: "阿里云GeoJSON数据\nShapely几何清洗\nAlbers等积投影" },
    { num: "③", title: "标签避让", desc: "碰撞检测算法\n候选位置贪心布局\n引线标注" },
    { num: "④", title: "双地图切换", desc: "专题地图 ↔ 对照地图\n共享状态管理\n都护府虚线叠加" },
  ];

  const cardW = (CONTENT_W - 0.6) / 4;
  steps.forEach((s, i) => {
    const x = CONTENT_X + i * (cardW + 0.2);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.8, w: cardW, h: 2.5,
      fill: { color: C.bgCard }, rectRadius: 0.08,
      line: { color: C.lightBorder, width: 0.5 },
    });
    slide.addText(s.num, {
      x: x + 0.15, y: 1.95, w: 0.5, h: 0.5,
      fontSize: 28, color: C.accent, fontFace: FONT_TITLE,
    });
    slide.addText(s.title, {
      x: x + 0.15, y: 2.45, w: cardW - 0.3, h: 0.35,
      fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE,
    });
    slide.addText(s.desc, {
      x: x + 0.15, y: 2.85, w: cardW - 0.3, h: 1.2,
      fontSize: 12, color: C.text, fontFace: FONT_BODY, lineSpacing: 20,
    });
  });

  slide.render();
}

// ============================================================
// SLIDE 8: STEP 3 - INTERACTION
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "Step 3: 核心交互", "CORE INTERACTIONS");

  // Flow diagram
  const flow = [
    { label: "点击聚合点", x: 0.5 },
    { label: "区域Top5面板", x: 2.3 },
    { label: "诗词详情弹窗", x: 4.3 },
    { label: "复制/关闭", x: 6.3 },
  ];

  flow.forEach((f, i) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: CONTENT_X + f.x, y: 1.8, w: 1.5, h: 0.6,
      fill: { color: C.primary }, rectRadius: 0.1,
    });
    slide.addText(f.label, {
      x: CONTENT_X + f.x, y: 1.9, w: 1.5, h: 0.4,
      fontSize: 12, bold: true, color: C.white, align: "center", fontFace: FONT_BODY,
    });
    if (i < flow.length - 1) {
      slide.addShape(pres.shapes.RIGHT_ARROW, {
        x: CONTENT_X + f.x + 1.55, y: 1.95, w: 0.2, h: 0.25,
        fill: { color: C.accent },
      });
    }
  });

  // Interaction details
  const interactions = [
    { title: "聚合点交互", desc: "大小随诗词数量变化\n点击展开区域面板\n键盘可访问 (Tab + Enter)" },
    { title: "诗词详情", desc: "标题/作者/正文/解释/地理小笺\n一键复制诗文\n三击关闭 + 手机滑动关闭" },
    { title: "全量诗库", desc: "搜索 + 区域筛选\n分页：10/20/30/50首\n移动端自适应" },
  ];

  interactions.forEach((item, i) => {
    addCard(slide, CONTENT_X + i * 3, 2.8, 2.8, 2.2, item.title, item.desc, { titleSize: 14, bodySize: 11 });
  });

  slide.render();
}

// ============================================================
// SLIDE 9: STEP 4 - MAP EVOLUTION
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "Step 4: 地图演进", "MAP EVOLUTION");

  // Timeline
  const timeline = [
    { phase: "V1", title: "区块式原地图", desc: "手工SVG路径\n十五道边界清晰\n适合教学展示", color: "4a9aaa" },
    { phase: "V2", title: "真实疆域地图", desc: "GeoJSON数据驱动\nAlbers投影\n山河标注 + 标签避让", color: "2a7a8a" },
    { phase: "V3", title: "双地图 + 都护府", desc: "专题地图 ↔ 对照地图\n洛阳中心视野\n安西/北庭虚线叠加", color: C.primary },
  ];

  timeline.forEach((t, i) => {
    const x = CONTENT_X + i * 3;
    // phase badge
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.8, y: 1.7, w: 0.6, h: 0.6,
      fill: { color: t.color },
    });
    slide.addText(t.phase, {
      x: x + 0.8, y: 1.78, w: 0.6, h: 0.4,
      fontSize: 16, bold: true, color: C.white, align: "center", fontFace: FONT_TITLE,
    });
    // connecting line
    if (i < timeline.length - 1) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: x + 1.45, y: 1.95, w: 1.3, h: 0.03,
        fill: { color: C.accent },
      });
    }
    // content
    slide.addText(t.title, {
      x, y: 2.5, w: 2.8, h: 0.35,
      fontSize: 16, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center",
    });
    slide.addText(t.desc, {
      x: x + 0.2, y: 2.9, w: 2.4, h: 1.5,
      fontSize: 12, color: C.text, fontFace: FONT_BODY, align: "center", lineSpacing: 20,
    });
  });

  slide.render();
}

// ============================================================
// SLIDE 10: STEP 5 - UX OPTIMIZATION
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "Step 5: 体验优化", "UX OPTIMIZATION");

  const optimizations = [
    { icon: "📱", title: "移动端适配", items: ["响应式布局 + 安全区", "Tab切换不滚动", "搜索框居中拉宽"] },
    { icon: "👆", title: "手势交互", items: ["左右滑动关闭详情", "三击关闭（桌面端）", "touch-action: pan-y"] },
    { icon: "🔍", title: "可读性", items: ["两轮字体放大", "标签碰撞避让", "引线标注系统"] },
    { icon: "♿", title: "无障碍", items: ["键盘导航支持", "aria-label 标注", "焦点管理"] },
  ];

  const cardW = (CONTENT_W - 0.6) / 4;
  optimizations.forEach((o, i) => {
    const x = CONTENT_X + i * (cardW + 0.2);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.8, w: cardW, h: 3,
      fill: { color: C.bgCard }, rectRadius: 0.08,
      line: { color: C.lightBorder, width: 0.5 },
    });
    slide.addText(o.icon, {
      x: x + 0.15, y: 1.95, w: 0.5, h: 0.5, fontSize: 28,
    });
    slide.addText(o.title, {
      x: x + 0.15, y: 2.5, w: cardW - 0.3, h: 0.35,
      fontSize: 15, bold: true, color: C.primary, fontFace: FONT_TITLE,
    });
    addBulletList(slide, o.items, x + 0.15, 2.95, cardW - 0.3, { fontSize: 11, lineSpacing: 22 });
  });

  slide.render();
}

// ============================================================
// SLIDE 11: DEPLOYMENT
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "部署与上线", "DEPLOYMENT");

  // Vercel
  addCard(slide, CONTENT_X, 1.7, 4.2, 1.8, "Vercel (生产环境)", "• 静态站点托管 (dist/)\n• 自动构建 + CDN加速\n• 生产地址: cultural-on-map.vercel.app\n• 多次部署迭代", { titleSize: 16, bodySize: 12 });

  // Traesite
  addCard(slide, CONTENT_X + 4.6, 1.7, 4.2, 1.8, "Traesite (国内镜像)", "• 同步部署静态产物\n• 国内访问优化\n• 公开访问权限\n• 部署ID追踪", { titleSize: 16, bodySize: 12 });

  // Short link
  slide.addShape(pres.shapes.RECTANGLE, {
    x: CONTENT_X, y: 3.8, w: CONTENT_W, h: 0.8,
    fill: { color: C.primary }, rectRadius: 0.08,
  });
  slide.addText("🔗 短链入口", {
    x: CONTENT_X + 0.3, y: 3.9, w: 2, h: 0.3,
    fontSize: 14, bold: true, color: C.accent, fontFace: FONT_BODY,
  });
  slide.addText("tinyurl.com/cultural-on-map  →  自动跳转至 Traesite", {
    x: CONTENT_X + 0.3, y: 4.2, w: CONTENT_W - 0.6, h: 0.3,
    fontSize: 14, color: C.white, fontFace: FONT_BODY,
  });

  slide.render();
}

// ============================================================
// SLIDE 12: DEV TOOLS
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "开发工具：Trae AI", "AI-ASSISTED DEVELOPMENT");

  // Center description
  slide.addText("整个项目通过 Trae AI 辅助开发完成，用自然语言描述需求，AI 生成代码并迭代优化", {
    x: CONTENT_X, y: 1.6, w: CONTENT_W, h: 0.5,
    fontSize: 16, color: C.text, fontFace: FONT_BODY, align: "center",
  });

  const tools = [
    { icon: "💬", title: "自然语言驱动", desc: "\"帮我做一个地图上的唐诗\"\n→ 自动生成完整项目" },
    { icon: "🔄", title: "迭代式开发", desc: "\"字体放大一点\"\n\"新增宋词300首\"\n→ 精准修改，不破坏已有功能" },
    { icon: "🗺️", title: "数据生成", desc: "Python脚本生成地图几何\nShapely清洗 + Albers投影\n→ 自动化数据处理" },
    { icon: "🚀", title: "一键部署", desc: "\"部署到Vercel和Traesite\"\n→ 自动构建 + 上传 + 上线" },
  ];

  const cardW = (CONTENT_W - 0.6) / 4;
  tools.forEach((t, i) => {
    const x = CONTENT_X + i * (cardW + 0.2);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.3, w: cardW, h: 2.5,
      fill: { color: C.bgCard }, rectRadius: 0.08,
      line: { color: C.lightBorder, width: 0.5 },
    });
    slide.addText(t.icon, { x: x + 0.15, y: 2.45, w: 0.5, h: 0.5, fontSize: 28 });
    slide.addText(t.title, {
      x: x + 0.15, y: 3, w: cardW - 0.3, h: 0.35,
      fontSize: 14, bold: true, color: C.primary, fontFace: FONT_TITLE,
    });
    slide.addText(t.desc, {
      x: x + 0.15, y: 3.4, w: cardW - 0.3, h: 1.2,
      fontSize: 11, color: C.text, fontFace: FONT_BODY, lineSpacing: 18,
    });
  });

  slide.render();
}

// ============================================================
// SLIDE 13: CHALLENGES
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "挑战与解决", "CHALLENGES & SOLUTIONS");

  const challenges = [
    { problem: "标签重叠", solution: "碰撞检测 + 贪心布局\n候选位置算法 + 引线标注", icon: "🏷️" },
    { problem: "真实疆域", solution: "GeoJSON → Shapely清洗\nAlbers等积投影转换", icon: "🗺️" },
    { problem: "移动端回退", solution: "touch-action: pan-y\npreventDefault 拦截\n手势识别阈值控制", icon: "📱" },
    { problem: "宋地图ID不一致", solution: "jingnanbei ↔ jingxibei\n几何映射别名兼容", icon: "🔗" },
  ];

  challenges.forEach((c, i) => {
    const y = 1.7 + i * 1;
    // icon
    slide.addText(c.icon, { x: CONTENT_X, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 24 });
    // problem
    slide.addText(c.problem, {
      x: CONTENT_X + 0.6, y, w: 2.5, h: 0.35,
      fontSize: 16, bold: true, color: C.secondary, fontFace: FONT_TITLE,
    });
    // arrow
    slide.addText("→", {
      x: CONTENT_X + 3.2, y, w: 0.4, h: 0.35,
      fontSize: 18, color: C.accent, align: "center",
    });
    // solution
    slide.addText(c.solution, {
      x: CONTENT_X + 3.8, y, w: 5, h: 0.8,
      fontSize: 12, color: C.text, fontFace: FONT_BODY, lineSpacing: 20,
    });
  });

  slide.render();
}

// ============================================================
// SLIDE 14: RESULTS
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "成果展示", "RESULTS");

  // Stats
  const stats = [
    { num: "600", label: "首诗词", sub: "唐诗300 + 宋词300" },
    { num: "39", label: "个行政区", sub: "唐15道 + 宋24路" },
    { num: "2", label: "种地图", sub: "专题地图 + 对照地图" },
    { num: "2", label: "个平台", sub: "Vercel + Traesite" },
  ];

  stats.forEach((s, i) => {
    const x = CONTENT_X + i * 2.2;
    slide.addText(s.num, {
      x, y: 1.8, w: 2, h: 0.8,
      fontSize: 48, bold: true, color: C.accent, fontFace: FONT_TITLE, align: "center",
    });
    slide.addText(s.label, {
      x, y: 2.6, w: 2, h: 0.35,
      fontSize: 18, bold: true, color: C.primary, fontFace: FONT_TITLE, align: "center",
    });
    slide.addText(s.sub, {
      x, y: 2.95, w: 2, h: 0.3,
      fontSize: 12, color: C.textLight, fontFace: FONT_BODY, align: "center",
    });
  });

  // Features
  slide.addShape(pres.shapes.RECTANGLE, {
    x: CONTENT_X, y: 3.6, w: CONTENT_W, h: 1.4,
    fill: { color: C.bgCard }, rectRadius: 0.08,
  });
  slide.addText("核心功能", {
    x: CONTENT_X + 0.2, y: 3.7, w: 2, h: 0.3,
    fontSize: 14, bold: true, color: C.primary, fontFace: FONT_TITLE,
  });
  const features = "✅ 地图聚合点 + 区域Top5    ✅ 诗词详情 + 一键复制    ✅ 全量诗库 + 搜索筛选\n✅ 双地图切换 + 都护府叠加    ✅ 移动端手势 + 三击关闭    ✅ 使用指南 + 更新日志";
  slide.addText(features, {
    x: CONTENT_X + 0.2, y: 4.05, w: CONTENT_W - 0.4, h: 0.8,
    fontSize: 12, color: C.text, fontFace: FONT_BODY, lineSpacing: 24,
  });

  slide.render();
}

// ============================================================
// SLIDE 15: SUMMARY
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };
  addSlideTitle(slide, "总结与展望", "SUMMARY & OUTLOOK");

  // Left: what we learned
  addCard(slide, CONTENT_X, 1.7, 4.2, 2.8, "经验沉淀", "• AI辅助开发效率极高，从需求到上线\n• 数据质量决定产品体验上限\n• 地图可视化需要算法支撑（标签避让）\n• 移动端手势需要精细的事件处理\n• 双平台部署保障访问稳定性", { titleSize: 16, bodySize: 12 });

  // Right: future
  addCard(slide, CONTENT_X + 4.6, 1.7, 4.2, 2.8, "未来方向", "• 持续校订诗词与地理数据\n• 诗人行旅路线图\n• 诗词朗诵音频\n• 用户收藏与分享\n• 更多朝代（元曲/明清诗）", { titleSize: 16, bodySize: 12 });

  slide.render();
}

// ============================================================
// SLIDE 16: Q&A
// ============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.primary };

  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SLIDE_W, h: 0.06, fill: { color: C.accent } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: SLIDE_H - 0.06, w: SLIDE_W, h: 0.06, fill: { color: C.accent } });

  slide.addText("谢谢", {
    x: 0, y: 1.5, w: SLIDE_W, h: 1,
    fontSize: 48, bold: true, color: C.white, fontFace: FONT_TITLE,
    align: "center", charSpacing: 6,
  });

  slide.addText("Q & A · 讨论环节（20分钟）", {
    x: 0, y: 2.6, w: SLIDE_W, h: 0.5,
    fontSize: 20, color: C.accent, fontFace: FONT_BODY, align: "center",
  });

  slide.addText("诗词山河 · 让每一首诗回到它诞生的山河之间", {
    x: 0, y: 3.5, w: SLIDE_W, h: 0.4,
    fontSize: 14, color: "a0b4c0", fontFace: FONT_BODY, align: "center",
  });

  slide.addText("tinyurl.com/cultural-on-map", {
    x: 0, y: 4.2, w: SLIDE_W, h: 0.3,
    fontSize: 12, color: "8098a8", fontFace: FONT_BODY, align: "center",
  });

  slide.render();
}

// ============================================================
// WRITE FILE
// ============================================================
const outputPath = "/workspace/ppt-share/诗词山河-开发分享.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("PPT saved to:", outputPath);
}).catch(err => {
  console.error("Error:", err);
});
