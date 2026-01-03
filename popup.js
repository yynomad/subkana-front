// 日语学习助手 - 配置页面逻辑

// 默认设置
const defaultSettings = {
  apiUrl: 'http://localhost:8000/api/v1',
  autoAnalyze: true,
  levelFilters: ['N5', 'N4', 'N3', 'N2', 'N1'],
  theme: 'dark'
};

// DOM 元素
const form = document.getElementById('settings-form');
const apiUrlInput = document.getElementById('api-url');
const autoAnalyzeCheckbox = document.getElementById('auto-analyze');
const levelFilters = document.querySelectorAll('.level-filter');
const themeOptions = document.querySelectorAll('.theme-option');
const testApiBtn = document.getElementById('test-api');
const statusDiv = document.getElementById('status');

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(defaultSettings);

    apiUrlInput.value = result.apiUrl;
    autoAnalyzeCheckbox.checked = result.autoAnalyze;

    // 设置等级过滤
    levelFilters.forEach(filter => {
      const level = filter.dataset.level;
      if (result.levelFilters.includes(level)) {
        filter.classList.add('selected');
      } else {
        filter.classList.remove('selected');
      }
    });

    // 设置主题
    themeOptions.forEach(option => {
      if (option.dataset.theme === result.theme) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });

  } catch (error) {
    console.error('加载设置失败:', error);
    showStatus('加载设置失败', 'error');
  }
}

// 保存设置
async function saveSettings() {
  try {
    const settings = {
      apiUrl: apiUrlInput.value.trim(),
      autoAnalyze: autoAnalyzeCheckbox.checked,
      levelFilters: Array.from(levelFilters)
        .filter(filter => filter.classList.contains('selected'))
        .map(filter => filter.dataset.level),
      theme: document.querySelector('.theme-option.selected').dataset.theme
    };

    await chrome.storage.sync.set(settings);
    showStatus('设置已保存', 'success');

    // 通知内容脚本设置已更新
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'settingsUpdated', settings });
    }

  } catch (error) {
    console.error('保存设置失败:', error);
    showStatus('保存设置失败', 'error');
  }
}

// 测试 API 连接
async function testApiConnection() {
  const apiUrl = apiUrlInput.value.trim();

  if (!apiUrl) {
    showStatus('请输入 API 地址', 'error');
    return;
  }

  testApiBtn.disabled = true;
  testApiBtn.textContent = '测试中...';

  try {
    const response = await fetch(`${apiUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sentence: 'こんにちは'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.sentence) {
        showStatus('API 连接成功', 'success');
      } else {
        showStatus('API 响应格式错误', 'error');
      }
    } else {
      showStatus(`API 连接失败 (${response.status})`, 'error');
    }

  } catch (error) {
    console.error('API 测试失败:', error);
    showStatus('API 连接失败: ' + error.message, 'error');
  } finally {
    testApiBtn.disabled = false;
    testApiBtn.textContent = '测试连接';
  }
}

// 显示状态消息
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  // 3秒后自动隐藏
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// 事件监听器
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveSettings();
});

testApiBtn.addEventListener('click', testApiConnection);

// 等级过滤选择
levelFilters.forEach(filter => {
  filter.addEventListener('click', () => {
    filter.classList.toggle('selected');
  });
});

// 主题选择
themeOptions.forEach(option => {
  option.addEventListener('click', () => {
    themeOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
  });
});

// 页面加载时读取设置
document.addEventListener('DOMContentLoaded', loadSettings);
