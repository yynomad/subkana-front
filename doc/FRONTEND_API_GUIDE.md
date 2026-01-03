# 前端 API 集成指南

本文档为前端开发者提供完整的 API 接入说明。

## 📚 目录

- [API 概览](#api-概览)
- [接口详情](#接口详情)
- [TypeScript 类型定义](#typescript-类型定义)
- [使用示例](#使用示例)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

---

## API 概览

### 基础信息

| 属性 | 值 |
|------|-----|
| Base URL | `http://localhost:8000` |
| API 版本 | `v1` |
| 前缀 | `/api/v1` |
| 数据格式 | JSON |
| 编码 | UTF-8 |

### 可用端点

| 方法 | 端点 | 描述 |
|------|------|------|
| `GET` | `/api/v1/health` | 健康检查 |
| `POST` | `/api/v1/analyze` | 分析日语句子 |

### CORS 配置

服务默认允许所有来源，支持：
- 所有 HTTP 方法
- 所有请求头
- 凭证传递

---

## 接口详情

### 1. 健康检查 `/api/v1/health`

检查服务状态和组件初始化情况。

**请求**

```http
GET /api/v1/health
```

**响应**

```json
{
  "status": "ok",
  "components": {
    "tokenizer": true,
    "grammar_engine": true,
    "vocabulary_mapper": true
  },
  "analysis_service": true
}
```

**字段说明**

| 字段 | 类型 | 描述 |
|------|------|------|
| `status` | `string` | 服务状态：`"ok"` 或 `"degraded"` |
| `components.tokenizer` | `boolean` | MeCab 分词器是否可用 |
| `components.grammar_engine` | `boolean` | 语法匹配引擎是否可用 |
| `components.vocabulary_mapper` | `boolean` | 词汇映射器是否可用 |
| `analysis_service` | `boolean` | 分析服务是否完全可用 |

---

### 2. 句子分析 `/api/v1/analyze`

分析日语句子，返回语法模式和词汇等级。

**请求**

```http
POST /api/v1/analyze
Content-Type: application/json

{
  "sentence": "勉強しています"
}
```

**请求参数**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `sentence` | `string` | ✓ | 要分析的日语句子（至少1个字符） |

**响应**

```json
{
  "sentence": "勉強しています",
  "grammar_patterns": [
    {
      "id": "n5_teimasu",
      "name": "〜ています",
      "level": "N5",
      "meaning": "正在……；……着（状态持续）",
      "structure": ["し", "て", "い", "ます"],
      "span": {
        "start": 2,
        "end": 7
      },
      "matched_tokens": [1, 2, 3, 4]
    }
  ],
  "tokens": [
    {
      "surface": "勉強",
      "lemma": "勉強",
      "pos": "名詞",
      "conj": "*",
      "jlpt_level": "N5"
    },
    {
      "surface": "し",
      "lemma": "する",
      "pos": "動詞",
      "conj": "連用形",
      "jlpt_level": "N5"
    },
    {
      "surface": "て",
      "lemma": "て",
      "pos": "助詞",
      "conj": "*",
      "jlpt_level": null
    },
    {
      "surface": "い",
      "lemma": "いる",
      "pos": "動詞",
      "conj": "連用形",
      "jlpt_level": null
    },
    {
      "surface": "ます",
      "lemma": "ます",
      "pos": "助動詞",
      "conj": "基本形",
      "jlpt_level": null
    }
  ]
}
```

**响应字段说明**

#### 顶层字段

| 字段 | 类型 | 描述 |
|------|------|------|
| `sentence` | `string` | 原始输入句子 |
| `grammar_patterns` | `GrammarPattern[]` | 识别到的语法模式列表 |
| `tokens` | `Token[]` | 词汇分析结果列表 |

#### GrammarPattern 对象

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | `string` | 语法规则唯一标识符（如 `"n5_teimasu"`） |
| `name` | `string` | 语法名称（如 `"〜ています"`） |
| `level` | `string` | JLPT 等级（`"N1"` - `"N5"`） |
| `meaning` | `string` | 中文释义 |
| `structure` | `string[]` | 匹配到的词汇表面形式列表 |
| `span.start` | `number` | 在原句中的起始字符位置 |
| `span.end` | `number` | 在原句中的结束字符位置 |
| `matched_tokens` | `number[]` | 匹配的 token 索引列表 |

#### Token 对象

| 字段 | 类型 | 描述 |
|------|------|------|
| `surface` | `string` | 表面形式（原文中的实际字符） |
| `lemma` | `string` | 词干/原形 |
| `pos` | `string` | 词性（日语，如 `"動詞"`、`"名詞"`） |
| `conj` | `string` | 活用形（如 `"連用形"`、`"未然形"`），无活用时为 `"*"` |
| `jlpt_level` | `string \| null` | JLPT 等级，未找到时为 `null` |

---

## TypeScript 类型定义

将以下类型定义复制到你的项目中：

```typescript
// types/japanese-analysis.ts

/**
 * 分析请求
 */
export interface AnalyzeRequest {
  sentence: string;
}

/**
 * 分析响应
 */
export interface AnalyzeResponse {
  sentence: string;
  grammar_patterns: GrammarPattern[];
  tokens: Token[];
}

/**
 * 语法模式
 */
export interface GrammarPattern {
  /** 语法规则ID */
  id: string;
  /** 语法名称 */
  name: string;
  /** JLPT等级 (N1-N5) */
  level: JLPTLevel;
  /** 中文释义 */
  meaning: string;
  /** 匹配的词汇表面形式 */
  structure: string[];
  /** 在原句中的位置 */
  span: {
    start: number;
    end: number;
  };
  /** 匹配的token索引 */
  matched_tokens: number[];
}

/**
 * 词汇Token
 */
export interface Token {
  /** 表面形式（原文） */
  surface: string;
  /** 词干/原形 */
  lemma: string;
  /** 词性（日语） */
  pos: string;
  /** 活用形 */
  conj: string;
  /** JLPT等级，未知时为null */
  jlpt_level: JLPTLevel | null;
}

/**
 * JLPT等级
 */
export type JLPTLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

/**
 * 健康检查响应
 */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  components: {
    tokenizer: boolean;
    grammar_engine: boolean;
    vocabulary_mapper: boolean;
  };
  analysis_service: boolean;
}

/**
 * API错误响应
 */
export interface APIError {
  detail: string;
}
```

---

## 使用示例

### 1. 基础封装（TypeScript）

```typescript
// api/japanese-analysis.ts

import type { 
  AnalyzeRequest, 
  AnalyzeResponse, 
  HealthResponse 
} from '../types/japanese-analysis';

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * 日语分析 API 客户端
 */
export class JapaneseAnalysisAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * 健康检查
   */
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * 分析日语句子
   */
  async analyze(sentence: string): Promise<AnalyzeResponse> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sentence }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Analysis failed: ${response.status}`);
    }

    return response.json();
  }
}

// 导出单例
export const japaneseAPI = new JapaneseAnalysisAPI();
```

### 2. React Hook 示例

```typescript
// hooks/useJapaneseAnalysis.ts

import { useState, useCallback } from 'react';
import { japaneseAPI } from '../api/japanese-analysis';
import type { AnalyzeResponse } from '../types/japanese-analysis';

interface UseJapaneseAnalysisReturn {
  result: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
  analyze: (sentence: string) => Promise<void>;
  clear: () => void;
}

export function useJapaneseAnalysis(): UseJapaneseAnalysisReturn {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (sentence: string) => {
    if (!sentence.trim()) {
      setError('请输入日语句子');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await japaneseAPI.analyze(sentence);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, clear };
}
```

### 3. React 组件示例

```tsx
// components/SentenceAnalyzer.tsx

import React, { useState } from 'react';
import { useJapaneseAnalysis } from '../hooks/useJapaneseAnalysis';

// JLPT 等级颜色映射
const LEVEL_COLORS: Record<string, string> = {
  N5: '#4CAF50', // 绿色 - 初级
  N4: '#8BC34A', // 浅绿
  N3: '#FFC107', // 黄色 - 中级
  N2: '#FF9800', // 橙色
  N1: '#F44336', // 红色 - 高级
};

export function SentenceAnalyzer() {
  const [input, setInput] = useState('');
  const { result, loading, error, analyze } = useJapaneseAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyze(input);
  };

  return (
    <div className="analyzer">
      {/* 输入表单 */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入日语句子，如：勉強しています"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? '分析中...' : '分析'}
        </button>
      </form>

      {/* 错误提示 */}
      {error && <div className="error">{error}</div>}

      {/* 分析结果 */}
      {result && (
        <div className="result">
          {/* 语法模式 */}
          <section>
            <h3>识别到的语法 ({result.grammar_patterns.length})</h3>
            {result.grammar_patterns.map((pattern) => (
              <div 
                key={pattern.id} 
                className="grammar-pattern"
                style={{ borderLeftColor: LEVEL_COLORS[pattern.level] }}
              >
                <span className="level">{pattern.level}</span>
                <span className="name">{pattern.name}</span>
                <span className="meaning">{pattern.meaning}</span>
              </div>
            ))}
          </section>

          {/* 词汇分析 */}
          <section>
            <h3>词汇分析 ({result.tokens.length})</h3>
            <div className="tokens">
              {result.tokens.map((token, index) => (
                <div 
                  key={index} 
                  className="token"
                  style={{ 
                    backgroundColor: token.jlpt_level 
                      ? LEVEL_COLORS[token.jlpt_level] + '20' 
                      : '#f0f0f0' 
                  }}
                >
                  <div className="surface">{token.surface}</div>
                  <div className="lemma">({token.lemma})</div>
                  <div className="pos">{token.pos}</div>
                  {token.jlpt_level && (
                    <div 
                      className="jlpt"
                      style={{ color: LEVEL_COLORS[token.jlpt_level] }}
                    >
                      {token.jlpt_level}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
```

### 4. Chrome 扩展示例（Content Script）

```javascript
// content.js - YouTube 字幕解析

const API_URL = 'http://localhost:8000/api/v1';

/**
 * 分析日语句子
 */
async function analyzeJapanese(sentence) {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence })
    });
    
    if (!response.ok) throw new Error('API 请求失败');
    return await response.json();
  } catch (error) {
    console.error('分析失败:', error);
    return null;
  }
}

/**
 * 为字幕添加分析结果
 */
async function enhanceSubtitle(subtitleElement) {
  const text = subtitleElement.textContent;
  if (!text || !isJapanese(text)) return;
  
  const result = await analyzeJapanese(text);
  if (!result) return;
  
  // 创建增强后的字幕
  const enhanced = createEnhancedSubtitle(result);
  subtitleElement.appendChild(enhanced);
}

/**
 * 检测是否为日语
 */
function isJapanese(text) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

/**
 * 创建增强字幕 UI
 */
function createEnhancedSubtitle(result) {
  const container = document.createElement('div');
  container.className = 'subkana-enhanced';
  
  // 显示语法提示
  result.grammar_patterns.forEach(pattern => {
    const tip = document.createElement('span');
    tip.className = `grammar-tip level-${pattern.level.toLowerCase()}`;
    tip.textContent = `${pattern.name}: ${pattern.meaning}`;
    container.appendChild(tip);
  });
  
  // 显示词汇等级
  result.tokens.forEach(token => {
    if (token.jlpt_level) {
      const word = document.createElement('span');
      word.className = `word level-${token.jlpt_level.toLowerCase()}`;
      word.textContent = token.surface;
      word.title = `${token.lemma} - ${token.jlpt_level}`;
      container.appendChild(word);
    }
  });
  
  return container;
}

// 监听字幕变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.classList?.contains('ytp-caption-segment')) {
        enhanceSubtitle(node);
      }
    });
  });
});

// 启动观察
observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});
```

### 5. Vue 3 组合式 API 示例

```typescript
// composables/useJapaneseAnalysis.ts

import { ref, computed } from 'vue';
import type { AnalyzeResponse, GrammarPattern, Token } from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export function useJapaneseAnalysis() {
  const result = ref<AnalyzeResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const grammarPatterns = computed(() => result.value?.grammar_patterns || []);
  const tokens = computed(() => result.value?.tokens || []);
  const hasResult = computed(() => result.value !== null);

  // 分析句子
  async function analyze(sentence: string) {
    if (!sentence.trim()) {
      error.value = '请输入句子';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '分析失败');
      }

      result.value = await response.json();
    } catch (e) {
      error.value = e instanceof Error ? e.message : '未知错误';
      result.value = null;
    } finally {
      loading.value = false;
    }
  }

  // 清除结果
  function clear() {
    result.value = null;
    error.value = null;
  }

  // 获取词汇的 JLPT 等级颜色
  function getLevelColor(level: string | null): string {
    const colors: Record<string, string> = {
      N5: '#4CAF50',
      N4: '#8BC34A',
      N3: '#FFC107',
      N2: '#FF9800',
      N1: '#F44336',
    };
    return level ? colors[level] || '#999' : '#999';
  }

  return {
    result,
    loading,
    error,
    grammarPatterns,
    tokens,
    hasResult,
    analyze,
    clear,
    getLevelColor,
  };
}
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 描述 | 处理建议 |
|--------|------|----------|
| `200` | 成功 | 正常处理响应 |
| `400` | 请求无效 | 检查请求参数 |
| `500` | 服务器错误 | 重试或报告错误 |

### 错误响应格式

```json
{
  "detail": "句子不能为空"
}
```

### 错误处理示例

```typescript
async function safeAnalyze(sentence: string) {
  try {
    const response = await fetch('/api/v1/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`请求无效: ${error.detail}`);
        case 500:
          throw new Error(`服务器错误: ${error.detail}`);
        default:
          throw new Error(`请求失败: ${response.status}`);
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('网络错误，请检查连接');
    }
    throw error;
  }
}
```

---

## 最佳实践

### 1. 防抖处理

对于实时输入场景，建议使用防抖：

```typescript
import { debounce } from 'lodash';

const debouncedAnalyze = debounce(async (sentence: string) => {
  const result = await japaneseAPI.analyze(sentence);
  // 处理结果
}, 300);

// 用户输入时调用
input.addEventListener('input', (e) => {
  debouncedAnalyze(e.target.value);
});
```

### 2. 缓存结果

对于相同句子，建议缓存结果：

```typescript
const cache = new Map<string, AnalyzeResponse>();

async function analyzeWithCache(sentence: string) {
  if (cache.has(sentence)) {
    return cache.get(sentence)!;
  }
  
  const result = await japaneseAPI.analyze(sentence);
  cache.set(sentence, result);
  return result;
}
```

### 3. 高亮显示语法

利用 `span` 字段高亮显示匹配的语法：

```typescript
function highlightGrammar(
  sentence: string, 
  patterns: GrammarPattern[]
): string {
  // 按位置排序（避免重叠问题）
  const sorted = [...patterns].sort((a, b) => b.span.start - a.span.start);
  
  let result = sentence;
  sorted.forEach(pattern => {
    const before = result.slice(0, pattern.span.start);
    const match = result.slice(pattern.span.start, pattern.span.end);
    const after = result.slice(pattern.span.end);
    
    result = `${before}<mark class="grammar-${pattern.level}">${match}</mark>${after}`;
  });
  
  return result;
}
```

### 4. JLPT 等级样式

推荐的 CSS 样式：

```css
/* JLPT 等级颜色 */
.level-n5 { --level-color: #4CAF50; }
.level-n4 { --level-color: #8BC34A; }
.level-n3 { --level-color: #FFC107; }
.level-n2 { --level-color: #FF9800; }
.level-n1 { --level-color: #F44336; }

/* 语法高亮 */
.grammar-highlight {
  background: linear-gradient(
    to bottom,
    transparent 60%,
    var(--level-color, #ccc) 60%
  );
}

/* 词汇标签 */
.token-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--level-color, #eee);
  color: white;
  font-size: 12px;
}

/* 悬停提示 */
.token-tooltip {
  position: relative;
  cursor: help;
}

.token-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: #333;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.token-tooltip:hover::after {
  opacity: 1;
}
```

---

## 常见问题

### Q: 为什么某些词的 `jlpt_level` 为 `null`？

A: 可能原因：
1. 该词不在词库中（如助词、助动词等常见词）
2. MeCab 分词后的 lemma 与词库不完全匹配
3. 该词确实没有 JLPT 等级（非 JLPT 词汇）

### Q: 如何处理长句子？

A: 建议：
1. 客户端做长度限制（如 500 字符）
2. 长句子可能包含多个语法模式，注意处理 `grammar_patterns` 数组
3. 考虑添加加载状态提示

### Q: 如何区分相同语法的不同用法？

A: 通过 `id` 字段区分，例如：
- `n4_souda_hearsay` - 传闻用法
- `n4_souda_appearance` - 样态用法

### Q: API 响应时间？

A: 典型响应时间：
- 短句子（< 20字）：50-100ms
- 中等句子（20-50字）：100-200ms
- 长句子（> 50字）：200-500ms

---

## API 文档

访问以下地址查看交互式 API 文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 联系支持

如有问题，请查看：
- 项目 README.md
- SYSTEM_READY.md
- 或提交 Issue

