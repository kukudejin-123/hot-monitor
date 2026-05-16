# 热点监控系统 — 技术方案

## 技术选型

| 层 | 技术 | 理由 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS | 快速开发，响应式，独特设计 |
| 后端 | Node.js + Express + TypeScript | 轻量，前后端统一 |
| AI 服务 | DeepSeek API (deepseek-v4-pro) | OpenAI 兼容，性价比高 |
| 数据存储 | SQLite (better-sqlite3) | 零配置，单文件 |
| 定时任务 | node-cron | 轻量级 cron |
| 邮件 | nodemailer | SMTP 发送 |
| Twitter | TwitterAPI.io (X-API-Key 认证) | 无需 OAuth，简单 |
| 网页爬虫 | cheerio + axios | HTML 解析 |

## 架构图

```
┌─────────────────────────────────────────────────┐
│                    Frontend (React)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 关键词管理│ │ 热点流   │ │ 通知设置          │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│         ↕ REST API        ↕ WebSocket            │
├─────────────────────────────────────────────────┤
│                 Backend (Express)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Routes   │ │ Scheduler│ │ AI Verifier      │ │
│  │ /api/*   │ │ 30min    │ │ DeepSeek         │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Twitter  │ │ Web Scrap│ │ Notifications    │ │
│  │ Fetcher  │ │ Fetcher  │ │ Push + Email     │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│         ↕ SQLite (better-sqlite3)                │
└─────────────────────────────────────────────────┘
```

## 数据模型

```sql
-- 关键词
CREATE TABLE keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 热点/话题
CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  source_type TEXT,  -- 'twitter' | 'web'
  keyword_id INTEGER,
  ai_score REAL,     -- DeepSeek 评分 0-10
  ai_reason TEXT,    -- AI 判断理由
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (keyword_id) REFERENCES keywords(id)
);

-- 通知记录
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER,
  type TEXT,  -- 'browser' | 'email'
  message TEXT,
  sent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- 配置
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/keywords | 获取所有关键词 |
| POST | /api/keywords | 添加关键词 |
| DELETE | /api/keywords/:id | 删除关键词 |
| PUT | /api/keywords/:id | 更新关键词 |
| GET | /api/topics | 获取热点列表（支持分页、筛选） |
| POST | /api/fetch | 手动触发一次热点抓取 |
| GET | /api/notifications | 获取通知历史 |
| PUT | /api/config | 更新配置（邮箱等） |
| GET | /api/config | 获取配置 |
| GET | /api/stats | 获取统计数据 |

## AI 识别流程

```
1. 从 Twitter/Web 获取原始内容列表
2. 去重（基于 URL + 标题相似度）
3. 对每条内容调用 DeepSeek：
   Prompt: "判断以下内容是否与关键词"{keyword}"真正相关，
   是否为标题党/假新闻/广告。给出 0-10 的相关性评分。
   返回 JSON: {relevant: bool, score: number, reason: string}"
4. score >= 6 的内容入库
5. 新入库内容触发通知
```

## DeepSeek API 对接

- Base URL: `https://api.deepseek.com/v1`
- Model: `deepseek-v4-pro`
- Auth: `Authorization: Bearer sk-xxx`
- SDK: 直接使用 `openai` npm 包（完全兼容）
- 参数: `temperature=1.0, top_p=1.0`（DeepSeek 推荐值）

## TwitterAPI.io 对接

- Base URL: `https://api.twitterapi.io`
- Auth: `X-API-Key: new1_xxx`（请求头）
- 注意：**不支持 CORS**，必须从后端调用
- 主要端点：
  - `/twitter/tweet/advanced_search?query=xxx&queryType=Latest`
  - `/twitter/trends`（获取趋势）

## 前端设计方向

**风格：Cyberpunk Terminal**
- 深色背景 + 霓虹色强调（青/紫/绿）
- 等宽字体混合现代无衬线
- 新热点出现时 glitch 动画效果
- 卡片带有玻璃拟态（glassmorphism）
- 顶部实时跑马灯显示最新热点
- 响应式：桌面三栏 → 平板两栏 → 手机单栏
- 粒子背景动效

## 开发步骤

1. **项目骨架**：monorepo 初始化，前后端项目搭建
2. **后端核心**：数据库初始化 + DeepSeek 集成 + Twitter + 爬虫
3. **后端调度**：定时任务 + 通知系统
4. **前端页面**：热点展示 + 关键词管理 + 通知设置
5. **联调测试**：前后端对接，功能验证
6. **Agent Skills**：封装为 Claude Code Skill
