// 日语学习助手 - 内容脚本

// 全局变量
let settings = {
  apiUrl: 'http://localhost:8000/api/v1',
  autoAnalyze: true,
  levelFilters: ['N5', 'N4', 'N3', 'N2', 'N1'],
  theme: 'dark'
};

let analysisCache = new Map(); // 缓存分析结果

// JLPT 等级颜色映射
const JLPT_COLORS = {
  'N5': '#4caf50',
  'N4': '#2196f3',
  'N3': '#ffeb3b',
  'N2': '#ff9800',
  'N1': '#f44336'
};

// 日语词性映射（日语 -> 中文）
const POS_MAP = {
  '動詞': '动词',
  '名詞': '名词',
  '形容詞': '形容词',
  '副詞': '副词',
  '助詞': '助词',
  '助動詞': '助动词',
  '接続詞': '连词',
  '感動詞': '感叹词',
  '連体詞': '连体词',
  '記号': '符号',
  '補助記号': '符号'
};

// JLPT 等级难度描述
const LEVEL_DESCRIPTIONS = {
  'N5': '入门级',
  'N4': '基础级',
  'N3': '中级',
  'N2': '中高级',
  'N1': '高级'
};

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(settings);
    settings = { ...settings, ...result };
    console.log('设置已加载:', settings);
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 保存设置到缓存
function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  console.log('设置已更新:', settings);
}

// API 调用封装
async function callAnalyzeAPI(sentence) {
  console.log('[SubKana] 准备调用API，句子:', sentence);
  
  // 检查缓存
  if (analysisCache.has(sentence)) {
    console.log('[SubKana] 使用缓存结果');
    return analysisCache.get(sentence);
  }

  const apiEndpoint = `${settings.apiUrl}/analyze`;
  console.log('[SubKana] 调用API:', apiEndpoint);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sentence })
    });

    console.log('[SubKana] API 响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('[SubKana] API 返回数据:', data);

    // 缓存结果
    analysisCache.set(sentence, data);

    return data;
  } catch (error) {
    console.error('[SubKana] API 调用失败:', error);
    throw error;
  }
}

// 检查是否在 YouTube 上
function isYouTube() {
  return window.location.hostname.includes('youtube.com');
}

// YouTube 字幕监听器
class YouTubeSubtitleListener {
  constructor(callback) {
    this.callback = callback;
    this.lastSubtitle = '';
    this.observer = null;
    this.checkInterval = null;
  }

  start() {
    // 使用 MutationObserver 监听字幕变化
    this.observer = new MutationObserver(() => {
      this.checkSubtitle();
    });

    // 监听整个文档的变化
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // 同时使用定时器检查，确保不遗漏
    this.checkInterval = setInterval(() => {
      this.checkSubtitle();
    }, 200);

    // 立即检查一次
    this.checkSubtitle();
  }

  checkSubtitle() {
    // YouTube 字幕选择器
    const selectors = [
      '.ytp-caption-segment',
      '.caption-segment',
      '[data-layer="caption"] span',
      '.ytp-caption-segment-line',
      '.ytp-caption-window-bottom span',
      '.ytp-caption-window .ytp-caption-segment'
    ];

    let subtitleText = '';

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        subtitleText = Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter(text => text && /[一-鿿ぁ-んァ-ヶ]/.test(text))
          .join(' ');
        if (subtitleText) break;
      }
    }

    // 如果字幕文本发生变化，触发回调
    if (subtitleText && subtitleText !== this.lastSubtitle) {
      this.lastSubtitle = subtitleText;
      this.callback(subtitleText);
    } else if (!subtitleText && this.lastSubtitle) {
      // 字幕消失
      this.lastSubtitle = '';
      this.callback('');
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// 弹窗 UI 渲染器
class PopupRenderer {
  constructor() {
    this.bubble = null;
    this.currentTarget = null;
    this.hoverTimeout = null;
    this.createBubble();
  }

  createBubble() {
    if (this.bubble) return;

    // 创建弹窗容器
    this.bubble = document.createElement('div');
    this.bubble.id = 'jp-learning-assistant-bubble';
    this.bubble.style.cssText = `
      display: none;
      position: fixed;
      background: ${settings.theme === 'dark' ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
      color: ${settings.theme === 'dark' ? '#fff' : '#333'};
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
      max-width: 500px;
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid ${settings.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      backdrop-filter: blur(10px);
      transition: opacity 0.2s ease;
      pointer-events: auto;
    `;
    this.bubble.setAttribute('data-theme', settings.theme);

    // 添加到页面
    document.body.appendChild(this.bubble);

    // 鼠标移入弹窗时保持显示
    this.bubble.addEventListener('mouseenter', () => {
      // 保持显示
    });

    // 鼠标移出弹窗时隐藏
    this.bubble.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  show(x, y, target) {
    if (!this.bubble) return;
    
    this.currentTarget = target;
    
    // 先设置位置（使用临时可见性来测量）
    this.bubble.style.visibility = 'hidden';
    this.bubble.style.display = 'block';
    this.bubble.style.opacity = '0';
    
    // 临时设置位置以测量尺寸
    this.bubble.style.left = `${x + 15}px`;
    this.bubble.style.top = `${y - 10}px`;
    
    // 计算位置，确保不超出视窗
    const rect = this.bubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalX = x + 15; // 默认显示在鼠标右侧
    let finalY = y - 10; // 稍微上移
    
    // 如果右侧空间不足，显示在左侧
    if (finalX + rect.width > viewportWidth) {
      finalX = x - rect.width - 15;
    }
    
    // 如果下方空间不足，向上调整
    if (finalY + rect.height > viewportHeight) {
      finalY = viewportHeight - rect.height - 10;
    }
    
    // 确保不超出左边界
    if (finalX < 10) {
      finalX = 10;
    }
    
    // 确保不超出上边界
    if (finalY < 10) {
      finalY = 10;
    }
    
    this.bubble.style.left = `${finalX}px`;
    this.bubble.style.top = `${finalY}px`;
    this.bubble.style.visibility = 'visible';
    
    // 淡入动画
    requestAnimationFrame(() => {
      this.bubble.style.opacity = '1';
    });
  }

  hide() {
    if (!this.bubble) return;
    
    this.bubble.style.opacity = '0';
    setTimeout(() => {
      if (this.bubble) {
        this.bubble.style.display = 'none';
      }
      this.currentTarget = null;
    }, 200);
  }

  showLoading() {
    if (!this.bubble) return;
    this.bubble.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div class="loading-spinner" style="display: inline-block; width: 20px; height: 20px; border: 2px solid #ccc; border-top: 2px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;"></div>
        <div>分析中...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  showError(error) {
    if (!this.bubble) return;
    this.bubble.innerHTML = `
      <div style="color: #ff6b6b; text-align: center; padding: 20px;">
        <div style="font-size: 16px; margin-bottom: 8px;">⚠️ 分析失败</div>
        <div style="font-size: 12px; color: #888;">${error.message}</div>
      </div>
    `;
  }

  renderAnalysis(data, sentence) {
    if (!this.bubble) return;

    const filteredGrammar = data.grammar_patterns.filter(pattern =>
      settings.levelFilters.includes(pattern.level)
    );

    // 过滤掉标点符号和根据等级过滤单词
    const filteredTokens = data.tokens.filter(token => {
      // 过滤掉标点符号（通常词性包含punct、symbol等）
      if (token.pos && (token.pos.includes('punct') || token.pos.includes('symbol') || token.pos === '補助記号' || token.pos === '記号')) {
        return false;
      }
      // 根据JLPT等级过滤
      return !token.jlpt_level || settings.levelFilters.includes(token.jlpt_level);
    });

    // 高亮语法模式的句子
    const highlightedSentence = this.highlightGrammarPatterns(sentence, filteredGrammar);

    this.bubble.innerHTML = `
      <div class="analysis-content">
        <div class="original-sentence" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${settings.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">原文</div>
          <div style="font-size: 18px; font-weight: 500; line-height: 1.6;">${highlightedSentence}</div>
        </div>

        ${filteredGrammar.length > 0 ? `
          <div class="grammar-section" style="margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #4a90e2;">📝 句型分析</div>
            ${filteredGrammar.map(pattern => `
              <div class="grammar-item" style="margin-bottom: 12px; padding: 12px; background: ${settings.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; border-radius: 8px; border-left: 3px solid ${JLPT_COLORS[pattern.level] || '#666'};">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-weight: 600; font-size: 15px;">${pattern.name}</span>
                  <span style="background: ${JLPT_COLORS[pattern.level] || '#666'}; color: ${pattern.level === 'N3' ? '#333' : 'white'}; padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 500;">${pattern.level}</span>
                  <span style="font-size: 11px; color: #888;">${LEVEL_DESCRIPTIONS[pattern.level] || ''}</span>
                </div>
                <div style="color: ${settings.theme === 'dark' ? '#aaa' : '#666'}; font-size: 14px; margin-bottom: 8px;">${pattern.meaning}</div>
                <div style="font-size: 12px; color: #888;">
                  <span style="color: ${settings.theme === 'dark' ? '#666' : '#999'};">匹配:</span> 
                  <span style="font-family: 'Hiragino Sans', sans-serif;">${pattern.structure.join(' + ')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${filteredTokens.length > 0 ? `
          <div class="vocabulary-section">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #4a90e2;">🔤 词汇分析</div>
            <div class="token-grid" style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${filteredTokens.map(token => {
                const levelColor = JLPT_COLORS[token.jlpt_level] || '#666';
                const posName = POS_MAP[token.pos] || token.pos || '';
                const hasLemma = token.lemma && token.lemma !== token.surface && token.lemma !== '*';
                const hasConj = token.conj && token.conj !== '*';
                const hasReading = token.reading && token.reading !== '*';
                const hasMeaning = token.meaning && token.meaning !== '*';
                const hasRomaji = token.romaji && token.romaji !== '*';
                
                return `
                <div class="token-item" style="
                  padding: 10px 12px; 
                  background: ${settings.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}; 
                  border-radius: 8px; 
                  border-left: 3px solid ${levelColor};
                  min-width: 80px;
                  transition: all 0.2s ease;
                  cursor: default;
                " 
                onmouseenter="this.style.background='${settings.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                onmouseleave="this.style.background='${settings.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}'; this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                >
                  <!-- 第一行：单词 + 读音 -->
                  <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px;">
                    <span style="font-weight: 600; font-size: 16px; font-family: 'Hiragino Sans', sans-serif;">${token.surface}</span>
                    ${hasReading ? `<span style="font-size: 12px; color: ${settings.theme === 'dark' ? '#aaa' : '#666'};">【${token.reading}】</span>` : ''}
                  </div>
                  
                  <!-- 第二行：原形（如果不同） -->
                  ${hasLemma ? `
                    <div style="font-size: 11px; color: ${settings.theme === 'dark' ? '#888' : '#777'}; margin-bottom: 4px;">
                      原形: ${token.lemma}
                    </div>
                  ` : ''}
                  
                  <!-- 第三行：释义 -->
                  ${hasMeaning ? `
                    <div style="font-size: 12px; color: ${settings.theme === 'dark' ? '#ccc' : '#444'}; margin-bottom: 6px; line-height: 1.3;">
                      ${token.meaning}
                    </div>
                  ` : ''}
                  
                  <!-- 第四行：词性、活用、等级 -->
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${posName ? `<span style="font-size: 10px; color: ${settings.theme === 'dark' ? '#999' : '#666'}; background: ${settings.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; padding: 2px 6px; border-radius: 3px;">${posName}</span>` : ''}
                    ${hasConj ? `<span style="font-size: 10px; color: ${settings.theme === 'dark' ? '#888' : '#777'}; background: ${settings.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}; padding: 2px 5px; border-radius: 3px;">${token.conj}</span>` : ''}
                    ${token.jlpt_level ? `<span style="font-size: 10px; font-weight: 600; color: ${levelColor}; background: ${levelColor}20; padding: 2px 6px; border-radius: 3px;">${token.jlpt_level}</span>` : ''}
                  </div>
                  
                  <!-- 第五行：罗马音（可选显示） -->
                  ${hasRomaji ? `
                    <div style="font-size: 10px; color: ${settings.theme === 'dark' ? '#666' : '#999'}; margin-top: 4px; font-style: italic;">
                      ${token.romaji}
                    </div>
                  ` : ''}
                </div>
              `}).join('')}
            </div>
          </div>
        ` : ''}

        ${filteredGrammar.length === 0 && filteredTokens.length === 0 ? `
          <div style="text-align: center; padding: 20px; color: #888;">
            <div style="font-size: 14px;">未找到匹配的语法或词汇</div>
            <div style="font-size: 12px; margin-top: 4px;">请检查等级过滤设置</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 高亮语法模式
  highlightGrammarPatterns(sentence, patterns) {
    if (!patterns || patterns.length === 0) return sentence;

    // 按位置倒序排序，从后往前替换避免索引偏移
    const sorted = [...patterns].sort((a, b) => b.span.start - a.span.start);

    let result = sentence;
    for (const pattern of sorted) {
      const before = result.slice(0, pattern.span.start);
      const match = result.slice(pattern.span.start, pattern.span.end);
      const after = result.slice(pattern.span.end);
      
      const levelColor = JLPT_COLORS[pattern.level] || '#666';
      
      result = `${before}<mark style="
        background: linear-gradient(to bottom, transparent 60%, ${levelColor}40 60%);
        padding: 0 2px;
        border-radius: 2px;
        cursor: help;
      " title="${pattern.name}: ${pattern.meaning}">${match}</mark>${after}`;
    }

    return result;
  }

  updateTheme() {
    if (!this.bubble) return;
    this.bubble.style.background = settings.theme === 'dark' ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    this.bubble.style.color = settings.theme === 'dark' ? '#fff' : '#333';
    this.bubble.style.borderColor = settings.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    this.bubble.setAttribute('data-theme', settings.theme);
  }
}

// 主控制器
class JapaneseLearningAssistant {
  constructor() {
    this.renderer = new PopupRenderer();
    this.subtitleObserver = null;
    this.hoverTimeout = null;
    this.currentHoverElement = null;
    this.debouncedAnalyze = this.debounce(this.analyzeSentence.bind(this), 500);
  }

  async init() {
    // 监听来自 popup 的设置更新
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'settingsUpdated') {
        updateSettings(message.settings);
        this.renderer.updateTheme();
      }
    });

    // 开始监听字幕元素
    this.observeSubtitles();
    
    // 定期检查新的字幕元素（因为YouTube动态加载）
    setInterval(() => {
      this.attachHoverListeners();
    }, 1000);
    
    // 立即执行一次
    this.attachHoverListeners();
  }

  // 监听字幕元素的变化
  observeSubtitles() {
    this.subtitleObserver = new MutationObserver(() => {
      this.attachHoverListeners();
    });

    this.subtitleObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

    // 为字幕元素添加 hover 事件监听
    attachHoverListeners() {
      if (!settings.autoAnalyze) return;
  
      // YouTube 字幕选择器
      const selectors = [
        '.ytp-caption-segment',
        '.caption-segment',
        '[data-layer="caption"] span',
        '.ytp-caption-segment-line',
        '.ytp-caption-window-bottom span',
        '.ytp-caption-window .ytp-caption-segment'
      ];
  
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // 检查是否已经添加过监听器
          if (element.dataset.jpAssistantAttached) return;
          
          // 更严格的检查：确保元素在字幕窗口内
          const isInCaptionWindow = element.closest('.ytp-caption-window-container') || 
                                     element.closest('.ytp-caption-window') ||
                                     element.closest('[data-layer="caption"]');
          if (!isInCaptionWindow) return;
          
          // 提取字幕文本
          const subtitleText = element.textContent?.trim();
          // 更严格的验证：必须包含日语字符，且长度合理（避免匹配到单个字符或过长文本）
          if (!subtitleText || 
              !/[一-鿿ぁ-んァ-ヶ]/.test(subtitleText) ||
              subtitleText.length < 2 ||
              subtitleText.length > 200) return;
          
          element.dataset.jpAssistantAttached = 'true';
  
          // 添加 hover 样式
          element.style.cursor = 'help';
          element.style.transition = 'background-color 0.2s';
  
          // 鼠标进入事件
          element.addEventListener('mouseenter', (e) => {
            // 再次验证：确保元素仍然在字幕区域内
            const stillInCaption = element.closest('.ytp-caption-window-container') || 
                                   element.closest('.ytp-caption-window') ||
                                   element.closest('[data-layer="caption"]');
            if (!stillInCaption) return;
            
            this.currentHoverElement = element;
            element.style.backgroundColor = 'rgba(74, 144, 226, 0.2)';
            
            // 延迟显示弹窗，避免鼠标快速划过时频繁触发
            this.hoverTimeout = setTimeout(() => {
              // 再次检查元素是否仍然有效
              if (!document.contains(element)) return;
              
              const rect = element.getBoundingClientRect();
              // 确保元素可见
              if (rect.width === 0 || rect.height === 0) return;
              
              const x = rect.left + rect.width / 2;
              const y = rect.top;
              this.renderer.show(x, y, element);
              this.analyzeSentence(subtitleText);
            }, 300);
          });
  
          // 鼠标离开事件
          element.addEventListener('mouseleave', (e) => {
            element.style.backgroundColor = '';
            
            if (this.hoverTimeout) {
              clearTimeout(this.hoverTimeout);
              this.hoverTimeout = null;
            }
            
            // 检查鼠标是否移动到弹窗上
            const relatedTarget = e.relatedTarget;
            if (relatedTarget && this.renderer.bubble && this.renderer.bubble.contains(relatedTarget)) {
              // 鼠标移动到弹窗上，保持显示
              return;
            }
            
            // 延迟隐藏，给用户时间移动到弹窗
            setTimeout(() => {
              // 再次检查鼠标是否在弹窗上
              if (this.renderer.bubble && !this.renderer.bubble.matches(':hover')) {
                this.currentHoverElement = null;
                this.renderer.hide();
              }
            }, 200);
          });
        });
      });
    }

  async analyzeSentence(sentence) {
    console.log('[SubKana] analyzeSentence 被调用，句子:', sentence);
    
    if (!sentence || !/[一-鿿ぁ-んァ-ヶ]/.test(sentence)) {
      console.log('[SubKana] 句子不包含日语字符，跳过分析');
      return;
    }

    try {
      this.renderer.showLoading();

      console.log('[SubKana] 开始调用 API...');
      const data = await callAnalyzeAPI(sentence);
      console.log('[SubKana] API 调用完成，结果:', data);

      // 获取当前鼠标位置来更新弹窗位置
      if (this.currentHoverElement) {
        const rect = this.currentHoverElement.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        this.renderer.show(x, y, this.currentHoverElement);
      }

      this.renderer.renderAnalysis(data, sentence);

    } catch (error) {
      console.error('[SubKana] 分析句子失败:', error);
      this.renderer.showError(error);
    }
  }

  debounce(func, wait) {
    let timeout;
    const debounced = (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
  }

  destroy() {
    if (this.subtitleObserver) {
      this.subtitleObserver.disconnect();
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }
}

// 主程序初始化
async function init() {
  // 只在 YouTube 上运行
  if (!isYouTube()) {
    console.log('日语学习助手：当前不在 YouTube 上，跳过初始化');
    return;
  }

  await loadSettings();

  const assistant = new JapaneseLearningAssistant();
  await assistant.init();

  console.log('日语学习助手已启动');
  console.log('当前页面:', window.location.href);
}

// 页面加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
