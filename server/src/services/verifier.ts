import OpenAI from "openai";

const API_KEY = process.env.DEEPSEEK_API_KEY || "";

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

export interface VerifyResult {
  relevant: boolean;
  score: number;
  reason: string;
}

export async function verifyContent(
  keyword: string,
  title: string,
  snippet: string
): Promise<VerifyResult> {
  const prompt = `你是一个 AI 热点内容审核助手。请判断以下内容是否与关键词"${keyword}"真正相关。

判断标准：
1. 内容是否确实在讨论该关键词所指的主题（而非仅仅提到这个词）
2. 是否为标题党/营销号水文/虚假新闻
3. 信息的可信度和价值

标题：${title}
摘要：${snippet}

请返回严格的 JSON 格式（不要包含 markdown 代码块标记）：
{"relevant": true或false, "score": 0到10的整数, "reason": "简短中文理由，不超过50字"}

只有 score >= 6 时才设置 relevant 为 true。`;

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content || "";
    return parseAIResponse(raw);
  } catch (e: any) {
    console.error("[Verifier] DeepSeek error:", e.message);
    return { relevant: false, score: 0, reason: `AI 验证失败: ${e.message}` };
  }
}

export async function verifyHotTopic(
  title: string,
  snippet: string
): Promise<VerifyResult & { category: string }> {
  const prompt = `你是一个 AI 领域热点识别助手。请判断以下内容是否属于真正的 AI/技术热点。

判断标准：
1. 是否与 AI（大模型、编程工具、开源发布、论文、产品更新等）相关
2. 是否具有新闻价值或行业影响力
3. 是否为广告、水文、标题党

标题：${title}
摘要：${snippet}

请返回严格的 JSON 格式（不要包含 markdown 代码块标记）：
{"relevant": true或false, "score": 0到10的整数, "reason": "简短中文理由，不超过50字", "category": "分类如: '大模型','AI编程','AI产品','AI开源','AI论文','其他'"}`;

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content || "";
    const result = parseAIResponse(raw);
    return { ...result, category: (result as any).category || "其他" };
  } catch (e: any) {
    console.error("[Verifier] DeepSeek error:", e.message);
    return { relevant: false, score: 0, reason: `AI 验证失败: ${e.message}`, category: "其他" };
  }
}

function parseAIResponse(raw: string): any {
  try {
    let json = raw.trim();
    if (json.startsWith("```")) {
      json = json.replace(/```(\w+)?/g, "").trim();
    }
    return JSON.parse(json);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    return { relevant: false, score: 0, reason: "AI 返回解析失败" };
  }
}
