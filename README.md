# 日语学习助手

一个 Chrome 浏览器扩展，用于在观看日语视频时实时分析字幕中的句型和单词等级，帮助日语学习者更好地理解和学习日语。

## 功能特性

- **智能句型分析**：自动识别日语句型并显示 JLPT 等级
- **单词等级标注**：显示每个单词的词性、活用形和 JLPT 等级
- **高亮显示**：在原始字幕中高亮匹配的句型部分
- **多平台支持**：支持 YouTube、Netflix、Bilibili、Niconico 等视频平台
- **自定义设置**：可配置 API 地址、自动分析开关、等级过滤等
- **现代化 UI**：支持深色/浅色主题，响应式设计
- **性能优化**：智能缓存、去抖处理、防抖机制

## 安装方法

### 手动安装
1. 下载或克隆此仓库
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启"开发者模式"（右上角切换）
4. 点击"加载已解压的扩展程序"
5. 选择 `subkana-front` 目录
6. 扩展安装完成

### 配置后端 API
1. 安装完成后，点击扩展图标打开设置页面
2. 配置后端 API 地址（默认为 `http://localhost:8000`）
3. 点击"测试连接"验证 API 是否可用
4. 保存设置

## 使用方法

1. 访问支持的视频网站（如 YouTube）
2. 播放包含日语字幕的视频
3. 将鼠标悬停在日语字幕上（或点击固定显示）
4. 查看弹出的分析结果：
   - 句型信息（名称、等级、含义、结构分解）
   - 单词信息（词干、词性、活用形、等级）
   - 高亮显示的句型匹配部分

## 技术架构

- **Manifest V3**：使用最新的 Chrome 扩展标准
- **Content Script**：注入到视频页面进行字幕检测和 UI 渲染
- **Background Service Worker**：处理 API 调用和数据缓存
- **Chrome Storage API**：保存用户配置
- **现代化 CSS**：支持动画、响应式布局

### 文件结构
```
extension/
├── manifest.json          # 扩展配置
├── content.js            # 主要逻辑（字幕检测、API 调用、UI 渲染）
├── popup.html            # 配置弹窗页面
├── popup.js              # 配置页面逻辑
├── style.css             # 样式文件
├── tiny_segmenter.js     # 分词库（备用）
└── README.md            # 说明文档
```

## 后端 API 要求

扩展需要连接到后端 API 进行句型和单词分析：

**接口地址**：`POST /analyze`

**请求格式**：
```json
{
  "sentence": "行かなければなりません"
}
```

**响应格式**：
```json
{
  "sentence": "行かなければなりません",
  "grammar_patterns": [
    {
      "id": "n4_nakereba_narimasen",
      "name": "〜なければなりません",
      "level": "N4",
      "meaning": "必须……（敬语）",
      "structure": ["行か", "なければ", "なりません"],
      "span": {
        "start": 0,
        "end": 9
      },
      "matched_tokens": [0, 1, 2, 3, 4, 5]
    }
  ],
  "tokens": [
    {
      "surface": "行か",
      "lemma": "行く",
      "pos": "動詞",
      "conj": "未然形",
      "jlpt_level": "N5"
    }
  ]
}
```

## 支持的视频平台

- ✅ YouTube
- ✅ Netflix
- ✅ Bilibili
- ✅ Niconico
- ✅ 其他通用视频网站

## 自定义设置

通过扩展弹窗可以配置：

- **API 地址**：自定义后端服务地址
- **自动分析**：是否在鼠标悬停时自动触发分析
- **等级过滤**：选择要显示的 JLPT 等级（N5-N1）
- **主题选择**：深色/浅色主题

## 开发调试

### 测试页面
打开 `test.html` 文件进行功能测试：
- 直接在浏览器中打开测试句子
- 验证 API 连接和数据解析
- 检查 UI 显示效果

### 调试命令
在控制台中使用以下命令：
```javascript
// 测试分词
window.testTokenize('こんにちは世界')

// 查看调试信息
window.jpTokenizerDebug()

// 检查 API 文件
window.checkTinySegmenterFiles()
```

## 故障排除

- **扩展不工作**：确认已重新加载扩展
- **无弹窗显示**：检查视频是否开启了日语字幕
- **分析失败**：验证网络连接和 API 地址配置
- **显示异常**：尝试切换主题或清除浏览器缓存

## 版本历史

- **v1.0**：初始版本，支持基础句型分析和单词标注

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License