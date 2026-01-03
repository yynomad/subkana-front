# API 快速参考

## 🚀 快速开始

### Base URL
```
http://localhost:8000
```

### 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/api/v1/health` | 健康检查 |
| `POST` | `/api/v1/analyze` | 分析日语句子 |

---

## 📝 分析句子

### 请求

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{"sentence": "勉強しています"}'
```

### 请求体

```json
{
  "sentence": "要分析的日语句子"
}
```

### 响应

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
      "span": { "start": 2, "end": 7 },
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
    }
  ]
}
```

---

## 📊 字段说明

### GrammarPattern

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 语法规则ID |
| `name` | string | 语法名称（日语） |
| `level` | string | JLPT等级 (N1-N5) |
| `meaning` | string | 中文释义 |
| `structure` | string[] | 匹配的词汇列表 |
| `span.start` | number | 起始字符位置 |
| `span.end` | number | 结束字符位置 |
| `matched_tokens` | number[] | 匹配的token索引 |

### Token

| 字段 | 类型 | 说明 |
|------|------|------|
| `surface` | string | 表面形式（原文） |
| `lemma` | string | 词干/原形 |
| `pos` | string | 词性（日语） |
| `conj` | string | 活用形 |
| `jlpt_level` | string \| null | JLPT等级 |

---

## 🎨 JLPT 等级颜色

```javascript
const LEVEL_COLORS = {
  N5: '#4CAF50',  // 绿色 - 入门
  N4: '#8BC34A',  // 浅绿 - 基础
  N3: '#FFC107',  // 黄色 - 中级
  N2: '#FF9800',  // 橙色 - 中高级
  N1: '#F44336',  // 红色 - 高级
};
```

---

## 🔧 JavaScript 示例

### 基础请求

```javascript
async function analyze(sentence) {
  const response = await fetch('http://localhost:8000/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence })
  });
  return response.json();
}

// 使用
const result = await analyze('日本語を勉強しています');
console.log(result.grammar_patterns);
console.log(result.tokens);
```

### React Hook

```javascript
function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (sentence) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, analyze };
}
```

---

## 📄 TypeScript 类型

```typescript
interface AnalyzeResponse {
  sentence: string;
  grammar_patterns: GrammarPattern[];
  tokens: Token[];
}

interface GrammarPattern {
  id: string;
  name: string;
  level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
  meaning: string;
  structure: string[];
  span: { start: number; end: number };
  matched_tokens: number[];
}

interface Token {
  surface: string;
  lemma: string;
  pos: string;
  conj: string;
  jlpt_level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | null;
}
```

---

## ⚠️ 错误处理

### 错误响应

```json
{
  "detail": "错误信息"
}
```

### 状态码

| 码 | 说明 |
|-----|------|
| 200 | 成功 |
| 400 | 请求无效 |
| 500 | 服务器错误 |

---

## 📚 更多信息

- 完整文档: `docs/FRONTEND_API_GUIDE.md`
- TypeScript 类型: `docs/frontend-types.ts`
- API 文档: http://localhost:8000/docs

