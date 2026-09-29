/**
 * CryptoCanvas · 密码画布
 * 将 SHA-256 哈希值转化为独一无二的生成艺术
 *
 * 核心原理：
 * 1. 用户输入任意文本
 * 2. 使用 Web Crypto API 计算 SHA-256 哈希
 * 3. 将 256 位哈希值分解为多个参数，驱动生成艺术
 * 4. 雪崩效应确保微小输入变化产生完全不同的画作
 */

// ============================================
// 核心模块
// ============================================

const CryptoCanvas = (() => {
  'use strict';

  // ---- DOM 引用 ----
  const $ = (id) => document.getElementById(id);
  const inputText = $('inputText');
  const generateBtn = $('generateBtn');
  const randomBtn = $('randomBtn');
  const saveBtn = $('saveBtn');
  const modeBtn = $('modeBtn');
  const exportBtn = $('exportBtn');
  const hashOutput = $('hashOutput');
  const inputLength = $('inputLength');
  const hashLength = $('hashLength');
  const seedDisplay = $('seedDisplay');
  const canvas = $('artCanvas');
  const ctx = canvas.getContext('2d');
  const emptyState = $('emptyState');
  const canvasWrapper = $('canvasWrapper');

  // ---- 状态 ----
  let currentHash = '';
  let currentMode = 0; // 0: 几何抽象, 1: 流体有机, 2: 分形树, 3: 万花筒
  const MODES = ['几何抽象', '流体有机', '分形树', '万花筒'];
  let animationId = null;
  let isAnimating = false;

  // ============================================
  // 哈希计算
  // ============================================

  /**
   * 使用 Web Crypto API 计算 SHA-256 哈希
   */
  async function computeHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { hashArray, hashHex };
  }

  /**
   * 从哈希数组中提取确定性随机数
   * 使用线性同余方法确保确定性
   */
  function seededRandom(hashArray, index) {
    // 使用哈希中的多个字节生成种子
    const seed = (
      (hashArray[index % hashArray.length] << 16) |
      (hashArray[(index + 1) % hashArray.length] << 8) |
      hashArray[(index + 2) % hashArray.length]
    ) / 0xFFFFFF;
    return seed;
  }

  /**
   * 从哈希中提取一个范围在 [min, max] 的确定性值
   */
  function hashRange(hashArray, index, min, max) {
    return min + seededRandom(hashArray, index) * (max - min);
  }

  /**
   * 从哈希中提取一个整数
   */
  function hashInt(hashArray, index, min, max) {
    return Math.floor(hashRange(hashArray, index, min, max + 1));
  }

  /**
   * 从哈希中提取颜色
   */
  function hashColor(hashArray, index, alpha = 1) {
    const r = hashInt(hashArray, index, 0, 255);
    const g = hashInt(hashArray, index + 3, 0, 255);
    const b = hashInt(hashArray, index + 6, 0, 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 从哈希中提取 HSL 颜色
   */
  function hashHSL(hashArray, index, s = 70, l = 55, a = 1) {
    const h = hashRange(hashArray, index, 0, 360);
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }

  // ============================================
  // 画布设置
  // ============================================

  function setupCanvas() {
    const rect = canvasWrapper.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height || 600);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    ctx.scale(dpr, dpr);
    return size;
  }

  // ============================================
  // 绘制模式 0: 几何抽象
  // ============================================

  function drawGeometric(hashArray, size) {
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.45;

    // 背景
    const bgHue = hashRange(hashArray, 0, 200, 280);
    ctx.fillStyle = `hsl(${bgHue}, 30%, 8%)`;
    ctx.fillRect(0, 0, size, size);

    // 同心圆层
    const layers = hashInt(hashArray, 1, 3, 8);
    for (let i = 0; i < layers; i++) {
      const r = maxR * (1 - i / (layers + 1));
      const hue = hashRange(hashArray, 10 + i * 5, 0, 360);
      const sat = hashRange(hashArray, 20 + i * 5, 50, 90);
      const light = hashRange(hashArray, 30 + i * 5, 40, 70);
      const alpha = hashRange(hashArray, 40 + i * 5, 0.3, 0.8);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
      ctx.lineWidth = hashRange(hashArray, 50 + i * 5, 1, 8);
      ctx.stroke();
    }

    // 多边形
    const polyCount = hashInt(hashArray, 60, 3, 12);
    for (let i = 0; i < polyCount; i++) {
      const sides = hashInt(hashArray, 70 + i * 10, 3, 12);
      const rot = hashRange(hashArray, 71 + i * 10, 0, Math.PI * 2);
      const r = maxR * hashRange(hashArray, 72 + i * 10, 0.2, 0.9);
      const hue = hashRange(hashArray, 73 + i * 10, 0, 360);
      const alpha = hashRange(hashArray, 74 + i * 10, 0.1, 0.4);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      ctx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 1.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 线条网络
    const lineCount = hashInt(hashArray, 80, 5, 20);
    for (let i = 0; i < lineCount; i++) {
      const x1 = hashRange(hashArray, 90 + i * 10, 0, size);
      const y1 = hashRange(hashArray, 91 + i * 10, 0, size);
      const x2 = hashRange(hashArray, 92 + i * 10, 0, size);
      const y2 = hashRange(hashArray, 93 + i * 10, 0, size);
      const hue = hashRange(hashArray, 94 + i * 10, 0, 360);
      const alpha = hashRange(hashArray, 95 + i * 10, 0.05, 0.2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${alpha})`;
      ctx.lineWidth = hashRange(hashArray, 96 + i * 10, 0.5, 2);
      ctx.stroke();
    }
  }

  // ============================================
  // 绘制模式 1: 流体有机
  // ============================================

  function drawFluid(hashArray, size) {
    // 背景
    const bgHue = hashRange(hashArray, 0, 160, 300);
    ctx.fillStyle = `hsl(${bgHue}, 40%, 5%)`;
    ctx.fillRect(0, 0, size, size);

    // 流体曲线层
    const layers = hashInt(hashArray, 1, 3, 8);
    for (let l = 0; l < layers; l++) {
      const points = hashInt(hashArray, 5 + l * 10, 4, 12);
      const hue = hashRange(hashArray, 6 + l * 10, 0, 360);
      const alpha = hashRange(hashArray, 7 + l * 10, 0.15, 0.5);
      const lineW = hashRange(hashArray, 8 + l * 10, 2, 12);

      // 生成控制点
      const pts = [];
      for (let i = 0; i < points; i++) {
        pts.push({
          x: hashRange(hashArray, 10 + l * 10 + i * 3, 0, size),
          y: hashRange(hashArray, 11 + l * 10 + i * 3, 0, size)
        });
      }

      // 绘制贝塞尔曲线
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 填充流体区域
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.closePath();
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha * 0.3})`;
      ctx.fill();
    }

    // 粒子效果
    const particleCount = hashInt(hashArray, 50, 30, 120);
    for (let i = 0; i < particleCount; i++) {
      const x = hashRange(hashArray, 60 + i * 5, 0, size);
      const y = hashRange(hashArray, 61 + i * 5, 0, size);
      const r = hashRange(hashArray, 62 + i * 5, 1, 4);
      const hue = hashRange(hashArray, 63 + i * 5, 0, 360);
      const alpha = hashRange(hashArray, 64 + i * 5, 0.3, 0.8);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
      ctx.fill();
    }
  }

  // ============================================
  // 绘制模式 2: 分形树
  // ============================================

  function drawFractal(hashArray, size) {
    // 背景
    const bgHue = hashRange(hashArray, 0, 200, 280);
    ctx.fillStyle = `hsl(${bgHue}, 30%, 5%)`;
    ctx.fillRect(0, 0, size, size);

    const branchAngle = hashRange(hashArray, 1, 15, 45) * Math.PI / 180;
    const branchRatio = hashRange(hashArray, 2, 0.5, 0.8);
    const depth = hashInt(hashArray, 3, 6, 12);
    const hueBase = hashRange(hashArray, 4, 0, 360);
    const hueSpread = hashRange(hashArray, 5, 20, 60);

    function drawBranch(x, y, length, angle, d) {
      if (d <= 0 || length < 2) return;

      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      const hue = (hueBase + d * hueSpread / depth) % 360;
      const light = 30 + (depth - d) * 5;
      const alpha = 0.3 + (depth - d) * 0.07;
      const lineW = d * 1.5;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `hsla(${hue}, 80%, ${light}%, ${alpha})`;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 叶子
      if (d <= 2) {
        ctx.beginPath();
        ctx.arc(endX, endY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(hue + 40) % 360}, 90%, 60%, 0.6)`;
        ctx.fill();
      }

      const newLength = length * branchRatio;
      const angleOffset = branchAngle * (0.5 + seededRandom(hashArray, d * 10) * 0.5);

      drawBranch(endX, endY, newLength, angle - angleOffset, d - 1);
      drawBranch(endX, endY, newLength, angle + angleOffset, d - 1);

      // 有时分三叉
      if (seededRandom(hashArray, d * 10 + 5) > 0.6) {
        drawBranch(endX, endY, newLength, angle, d - 1);
      }
    }

    const startX = size / 2;
    const startY = size * 0.9;
    const trunkLen = size * hashRange(hashArray, 6, 0.25, 0.35);

    drawBranch(startX, startY, trunkLen, -Math.PI / 2, depth);
  }

  // ============================================
  // 绘制模式 3: 万花筒
  // ============================================

  function drawKaleidoscope(hashArray, size) {
    const cx = size / 2;
    const cy = size / 2;

    // 背景
    const bgHue = hashRange(hashArray, 0, 0, 360);
    ctx.fillStyle = `hsl(${bgHue}, 40%, 5%)`;
    ctx.fillRect(0, 0, size, size);

    const segments = hashInt(hashArray, 1, 4, 12);
    const angleStep = (Math.PI * 2) / segments;
    const layers = hashInt(hashArray, 2, 2, 6);

    for (let l = 0; l < layers; l++) {
      const r = (size * 0.45) * (1 - l / (layers + 1));
      const hue = hashRange(hashArray, 10 + l * 10, 0, 360);
      const sat = hashRange(hashArray, 11 + l * 10, 60, 90);
      const light = hashRange(hashArray, 12 + l * 10, 40, 70);
      const alpha = hashRange(hashArray, 13 + l * 10, 0.2, 0.6);

      for (let s = 0; s < segments; s++) {
        const startAngle = s * angleStep;
        const endAngle = startAngle + angleStep;

        // 扇形
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();

        const segHue = (hue + s * (360 / segments)) % 360;
        ctx.fillStyle = `hsla(${segHue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${segHue}, 80%, 70%, ${alpha * 1.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 内部装饰
        if (l % 2 === 0) {
          const midAngle = startAngle + angleStep / 2;
          const innerR = r * 0.6;
          const dotX = cx + Math.cos(midAngle) * innerR;
          const dotY = cy + Math.sin(midAngle) * innerR;
          const dotR = r * hashRange(hashArray, 20 + s * 5, 0.05, 0.15);

          ctx.beginPath();
          ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${(segHue + 180) % 360}, 90%, 70%, ${alpha * 0.8})`;
          ctx.fill();
        }
      }
    }

    // 中心圆
    const centerR = size * hashRange(hashArray, 30, 0.03, 0.08);
    const centerHue = hashRange(hashArray, 31, 0, 360);
    ctx.beginPath();
    ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${centerHue}, 80%, 60%)`;
    ctx.fill();
  }

  // ============================================
  // 主渲染函数
  // ============================================

  const RENDERERS = [drawGeometric, drawFluid, drawFractal, drawKaleidoscope];

  async function render(text) {
    if (!text || text.trim() === '') {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    const { hashArray, hashHex } = await computeHash(text);
    currentHash = hashHex;

    // 更新 UI
    hashOutput.textContent = hashHex;
    inputLength.textContent = text.length;
    hashLength.textContent = hashHex.length;

    const shortHash = hashHex.substring(0, 8) + '...';
    seedDisplay.textContent = `#${shortHash}`;

    // 设置画布
    const size = setupCanvas();

    // 渲染当前模式
    RENDERERS[currentMode](hashArray, size);
  }

  // ============================================
  // 动画效果
  // ============================================

  function animateModeSwitch() {
    if (animationId) cancelAnimationFrame(animationId);

    const text = inputText.value.trim();
    if (!text) return;

    let progress = 0;
    const duration = 30; // frames

    function fade() {
      progress++;
      const alpha = Math.max(0, 1 - progress / duration);
      canvas.style.opacity = alpha;

      if (progress < duration) {
        animationId = requestAnimationFrame(fade);
      } else {
        canvas.style.opacity = 0;
        render(text).then(() => {
          progress = 0;
          function fadeIn() {
            progress++;
            const alpha = Math.min(1, progress / (duration / 2));
            canvas.style.opacity = alpha;
            if (progress < duration / 2) {
              animationId = requestAnimationFrame(fadeIn);
            } else {
              canvas.style.opacity = 1;
              animationId = null;
            }
          }
          animationId = requestAnimationFrame(fadeIn);
        });
      }
    }

    animationId = requestAnimationFrame(fade);
  }

  // ============================================
  // 事件绑定
  // ============================================

  // 生成按钮
  generateBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (text) {
      render(text);
    } else {
      inputText.focus();
    }
  });

  // 回车键生成
  inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateBtn.click();
    }
  });

  // 随机输入
  randomBtn.addEventListener('click', () => {
    const adjectives = ['量子', '混沌', '加密', '奇异', '深邃', '无限', '隐秘', '玄妙', '极光', '星云', '暗影', '流光', '幻境', '虚空', '熵增'];
    const nouns = ['密码', '哈希', '算法', '分形', '矩阵', '维度', '奇点', '回声', '脉冲', '漩涡', '晶体', '星尘', '梦境', '深渊', '回响'];
    const separators = ['·', '—', '~', '_', ''];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const sep = separators[Math.floor(Math.random() * separators.length)];
    const num = Math.floor(Math.random() * 9999);

    const randomText = `${adj}${sep}${noun} #${num}`;
    inputText.value = randomText;
    render(randomText);
  });

  // 切换风格
  modeBtn.addEventListener('click', () => {
    currentMode = (currentMode + 1) % MODES.length;
    modeBtn.textContent = `🎨 ${MODES[currentMode]}`;
    animateModeSwitch();
  });

  // 导出 PNG
  exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `cryptocanvas-${currentHash.substring(0, 8) || 'unknown'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // 保存到本地存储
  saveBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) return;

    const saved = JSON.parse(localStorage.getItem('cryptocanvas_saved') || '[]');
    saved.unshift({
      text,
      hash: currentHash,
      mode: currentMode,
      timestamp: Date.now()
    });

    // 只保留最近 20 条
    if (saved.length > 20) saved.length = 20;
    localStorage.setItem('cryptocanvas_saved', JSON.stringify(saved));

    // 反馈
    saveBtn.textContent = '✅ 已保存';
    setTimeout(() => {
      saveBtn.innerHTML = '💾 保存';
    }, 1500);
  });

  // 窗口大小变化
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const text = inputText.value.trim();
      if (text) render(text);
    }, 300);
  });

  // ============================================
  // 初始化
  // ============================================

  function init() {
    // 设置初始模式标签
    modeBtn.textContent = `🎨 ${MODES[currentMode]}`;

    // 自动生成默认文本
    render(inputText.value);

    console.log('🔐 CryptoCanvas 已初始化');
    console.log('📐 当前模式:', MODES[currentMode]);
    console.log('💡 提示: 修改输入文本，观察雪崩效应！');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

  // 返回公共 API
  return {
    render,
    setMode: (mode) => {
      if (mode >= 0 && mode < MODES.length) {
        currentMode = mode;
        modeBtn.textContent = `🎨 ${MODES[currentMode]}`;
        animateModeSwitch();
      }
    },
    getHash: () => currentHash,
    getMode: () => currentMode,
    MODES
  };
})();