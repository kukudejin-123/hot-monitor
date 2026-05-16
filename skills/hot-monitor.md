# Hot Monitor — AI 热点监控技能

## 概述

Hot Monitor 是一个多源 AI 热点监控系统，支持从 Twitter 和网页搜索引擎自动采集热点内容，利用 DeepSeek AI 进行真实性验证和相关性评分，并通过浏览器推送和邮件发送通知。

## 触发条件

当用户说出以下关键词时激活此技能：
- "热点监控"、"监控热点"、"查看热点"、"最新热点"
- "添加监控关键词"、"新增关键词"、"监控 XXX"
- "抓取热点"、"立即抓取"、"刷新热点"
- "热点通知"、"通知设置"
- "AI 领域有什么新消息"、"最近有什么 AI 新闻"

## 可用操作

### 1. 添加监控关键词

向监控系统添加新的关键词，系统会定时搜索该关键词相关内容。

```
POST http://localhost:3001/api/keywords
Content-Type: application/json

{"word": "关键词", "category": "ai_model"}
```

可选分类：`general`（通用）、`ai_model`（大模型）、`ai_tool`（AI工具）、`ai_product`（AI产品）、`ai_paper`（AI论文）

### 2. 查询已监控的关键词

```
GET http://localhost:3001/api/keywords
```

### 3. 删除/暂停关键词

```
DELETE http://localhost:3001/api/keywords/:id
PUT http://localhost:3001/api/keywords/:id
{"active": 0}
```

### 4. 获取热点列表

```
GET http://localhost:3001/api/topics?page=1&limit=20&verified=1
```

返回结果包含：
- `title`: 热点标题
- `summary`: 摘要
- `source_url`: 来源链接
- `source_type`: 来源类型（twitter/web）
- `keyword_word`: 关联的关键词
- `ai_score`: AI 评分（0-10）
- `ai_reason`: AI 判断理由
- `created_at`: 发现时间

### 5. 手动触发抓取

```
POST http://localhost:3001/api/topics/fetch
```

### 6. 查看通知历史

```
GET http://localhost:3001/api/notifications?limit=50
```

### 7. 配置通知方式

```
GET http://localhost:3001/api/config
PUT http://localhost:3001/api/config
{"email_to": "user@example.com", "email_smtp_host": "smtp.gmail.com", ...}
```

## 工作流程

1. 用户添加关键词（如 "DeepSeek V4"、"Claude 4.7"）
2. 系统每 30 分钟自动从多个数据源搜索：
   - **Twitter (X)**: 通过 TwitterAPI.io 搜索最新推文
   - **Web**: 通过 DuckDuckGo + Bing 搜索引擎爬虫
3. 每条内容送给 DeepSeek AI 进行验证：
   - 判断是否真正与关键词相关
   - 识别标题党/假新闻/广告
   - 给出 0-10 分相关性评分
4. 评分 ≥ 6 的内容入库并标记为已验证
5. 新热点触发浏览器推送通知 + 邮件通知（如已配置）
6. 前端页面实时展示热点流

## 辅助命令（在项目内使用）

```bash
# 启动服务
npm run dev:server
npm run dev:client

# 查看数据
cat server/data.json | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log('Keywords:', j.keywords.length); console.log('Topics:', j.topics.length);"
```

## 技术架构

- **后端**: Express + TypeScript（localhost:3001）
- **前端**: React + Vite + Tailwind CSS（localhost:5173）
- **存储**: JSON 文件持久化（server/data.json）
- **AI 验证**: DeepSeek V4 Pro API
- **Twitter 数据源**: TwitterAPI.io
- **网页数据源**: DuckDuckGo + Bing（cheerio 爬虫）
- **定时任务**: node-cron（每 30 分钟）
