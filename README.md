# Hot Monitor — AI 热点监控系统

一个面向 AI 编程博主的多源热点监控工具，自动采集、AI 验证、多端通知。

## 功能

- **多源采集** — Twitter、Bing、Hacker News、Reddit、Google News、Bilibili
- **AI 验证** — DeepSeek 自动识别标题党和虚假信息，0-10 评分
- **定时调度** — 每 30 分钟自动抓取所有活跃关键词
- **浏览器推送** — 新热点实时通知
- **邮件通知** — 可配置 SMTP 发送邮件
- **搜索筛选** — 按关键词 / 数据源 / 内容搜索
- **互动数据显示** — Twitter 阅读/赞/转发，HN/Reddit 票/评

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | Express + TypeScript |
| 存储 | JSON 文件 |
| AI | DeepSeek v4-flash API (OpenAI SDK 兼容) |
| Twitter | TwitterAPI.io |
| 定时 | node-cron |
| 通知 | Web Notification API + Nodemailer |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量 (.env)
cp .env.example .env
# 编辑 .env 填入:
#   DEEPSEEK_API_KEY=sk-xxx
#   TWITTERAPI_IO_KEY=xxx

# 启动开发环境
npm run dev
# 前端: http://localhost:5173
# 后端: http://localhost:3001
```

## 项目结构

```
hot-monitor/
├── client/                     # React 前端
│   └── src/
│       ├── pages/
│       │   └── Dashboard.tsx   # 主页面
│       └── components/
│           ├── TopicCard.tsx   # 热点卡片
│           ├── KeywordManager.tsx
│           ├── NotificationPanel.tsx
│           ├── TickerTape.tsx
│           └── ui/             # Aceternity UI 组件
├── server/                     # Express 后端
│   └── src/
│       ├── index.ts            # 入口
│       ├── db.ts               # 数据层 (JSON 文件)
│       ├── routes/             # API 路由
│       │   ├── topics.ts
│       │   ├── keywords.ts
│       │   ├── notifications.ts
│       │   └── config.ts
│       └── services/
│           ├── twitter.ts      # Twitter 数据源
│           ├── scraper.ts      # 网页爬虫
│           ├── verifier.ts     # DeepSeek AI 验证
│           ├── scheduler.ts    # 定时调度
│           └── notifier.ts     # 推送通知
└── package.json
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/topics` | 热点列表（search/source_type/keyword_id 筛选）
| POST | `/api/topics/fetch` | 手动触发抓取
| GET | `/api/keywords` | 关键词列表
| POST | `/api/keywords` | 添加关键词
| PUT | `/api/keywords/:id` | 更新关键词
| DELETE | `/api/keywords/:id` | 删除关键词
| GET | `/api/notifications` | 通知列表
| GET/PUT | `/api/config` | 配置管理
| GET | `/api/health` | 健康检查

## Agent Skill

独立的 CLI 工具可用于 Agent 环境：[hot-monitor-skills](https://github.com/kukudejin-123/hot-monitor-skills)

## License

MIT
