/**
 * Subkana 日语分析 API - TypeScript 类型定义
 * 
 * 使用方法：将此文件复制到你的前端项目中
 */

// ============================================================================
// 请求类型
// ============================================================================

/**
 * 分析请求
 */
export interface AnalyzeRequest {
  /** 要分析的日语句子（必填，至少1个字符） */
  sentence: string;
}

// ============================================================================
// 响应类型
// ============================================================================

/**
 * 分析响应
 */
export interface AnalyzeResponse {
  /** 原始输入句子 */
  sentence: string;
  /** 识别到的语法模式列表 */
  grammar_patterns: GrammarPattern[];
  /** 词汇分析结果列表 */
  tokens: Token[];
}

/**
 * 语法模式
 */
export interface GrammarPattern {
  /** 语法规则唯一标识符（如 "n5_teimasu"） */
  id: string;
  /** 语法名称（如 "〜ています"） */
  name: string;
  /** JLPT 等级 */
  level: JLPTLevel;
  /** 中文释义 */
  meaning: string;
  /** 匹配的词汇表面形式列表 */
  structure: string[];
  /** 在原句中的字符位置 */
  span: Span;
  /** 匹配的 token 索引列表 */
  matched_tokens: number[];
}

/**
 * 词汇 Token
 */
export interface Token {
  /** 表面形式（原文中的实际字符） */
  surface: string;
  /** 词干/原形 */
  lemma: string;
  /** 词性（日语，如 "動詞"、"名詞"、"助詞"） */
  pos: string;
  /** 活用形（如 "連用形"、"未然形"），无活用时为 "*" */
  conj: string;
  /** JLPT 等级，未找到时为 null */
  jlpt_level: JLPTLevel | null;
}

/**
 * 位置范围
 */
export interface Span {
  /** 起始字符位置（从0开始） */
  start: number;
  /** 结束字符位置 */
  end: number;
}

/**
 * JLPT 等级
 */
export type JLPTLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

/**
 * 健康检查响应
 */
export interface HealthResponse {
  /** 服务状态 */
  status: 'ok' | 'degraded';
  /** 组件状态 */
  components: {
    /** MeCab 分词器是否可用 */
    tokenizer: boolean;
    /** 语法匹配引擎是否可用 */
    grammar_engine: boolean;
    /** 词汇映射器是否可用 */
    vocabulary_mapper: boolean;
  };
  /** 分析服务是否完全可用 */
  analysis_service: boolean;
}

/**
 * API 错误响应
 */
export interface APIError {
  /** 错误详情 */
  detail: string;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 日语词性映射（日语 -> 中文）
 */
export const POS_MAP: Record<string, string> = {
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
};

/**
 * JLPT 等级颜色配置
 */
export const LEVEL_COLORS: Record<JLPTLevel, string> = {
  N5: '#4CAF50', // 绿色 - 初级
  N4: '#8BC34A', // 浅绿
  N3: '#FFC107', // 黄色 - 中级
  N2: '#FF9800', // 橙色
  N1: '#F44336', // 红色 - 高级
};

/**
 * JLPT 等级难度描述
 */
export const LEVEL_DESCRIPTIONS: Record<JLPTLevel, string> = {
  N5: '入门级',
  N4: '基础级',
  N3: '中级',
  N2: '中高级',
  N1: '高级',
};

// ============================================================================
// API 客户端
// ============================================================================

/**
 * 日语分析 API 客户端配置
 */
export interface APIClientConfig {
  /** API 基础 URL */
  baseUrl?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
}

/**
 * 创建 API 客户端
 * 
 * @example
 * ```typescript
 * const api = createAPIClient({ baseUrl: 'http://localhost:8000' });
 * const result = await api.analyze('勉強しています');
 * ```
 */
export function createAPIClient(config: APIClientConfig = {}) {
  const baseUrl = config.baseUrl || 'http://localhost:8000';
  const timeout = config.timeout || 10000;

  return {
    /**
     * 健康检查
     */
    async health(): Promise<HealthResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${baseUrl}/api/v1/health`, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        return response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },

    /**
     * 分析日语句子
     */
    async analyze(sentence: string): Promise<AnalyzeResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${baseUrl}/api/v1/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sentence }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error: APIError = await response.json();
          throw new Error(error.detail || `Analysis failed: ${response.status}`);
        }

        return response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 检测文本是否包含日语字符
 */
export function containsJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

/**
 * 获取 JLPT 等级的颜色
 */
export function getLevelColor(level: JLPTLevel | null): string {
  return level ? LEVEL_COLORS[level] : '#999999';
}

/**
 * 获取词性的中文名称
 */
export function getPosName(pos: string): string {
  return POS_MAP[pos] || pos;
}

/**
 * 高亮语法模式
 * 
 * @param sentence 原句子
 * @param patterns 语法模式列表
 * @returns 带 HTML 标记的字符串
 */
export function highlightPatterns(
  sentence: string,
  patterns: GrammarPattern[]
): string {
  if (!patterns.length) return sentence;

  // 按位置倒序排序，从后往前替换避免索引偏移
  const sorted = [...patterns].sort((a, b) => b.span.start - a.span.start);

  let result = sentence;
  for (const pattern of sorted) {
    const before = result.slice(0, pattern.span.start);
    const match = result.slice(pattern.span.start, pattern.span.end);
    const after = result.slice(pattern.span.end);

    result = `${before}<mark class="grammar-${pattern.level.toLowerCase()}" data-grammar-id="${pattern.id}" title="${pattern.name}: ${pattern.meaning}">${match}</mark>${after}`;
  }

  return result;
}

/**
 * 将 Token 列表转换为带注音的 HTML
 * 
 * @param tokens Token 列表
 * @returns 带 ruby 标签的 HTML 字符串
 */
export function tokensToRuby(tokens: Token[]): string {
  return tokens
    .map((token) => {
      const levelClass = token.jlpt_level
        ? `level-${token.jlpt_level.toLowerCase()}`
        : '';
      return `<span class="token ${levelClass}" data-lemma="${token.lemma}" data-pos="${token.pos}">${token.surface}</span>`;
    })
    .join('');
}

