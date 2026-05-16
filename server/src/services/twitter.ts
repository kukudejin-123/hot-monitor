import axios from "axios";

const API_KEY = process.env.TWITTERAPI_IO_KEY || "";
const BASE_URL = "https://api.twitterapi.io";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "X-API-Key": API_KEY },
  timeout: 15000,
});

// 质量阈值
const MIN_LIKES = 50;
const MIN_RETWEETS = 20;
const MIN_VIEWS = 2000;

export interface Tweet {
  id: string;
  text: string;
  url: string;
  author: string;
  created_at: string;
}

export async function searchTweets(query: string): Promise<Tweet[]> {
  try {
    const response = await client.get("/twitter/tweet/advanced_search", {
      params: { query, queryType: "Latest" },
    });
    const raw = response.data?.tweets || response.data?.data || [];

    // 过滤 + 去重作者
    const seenAuthors = new Set<string>();
    const filtered: Tweet[] = [];

    for (const t of raw) {
      // 只要原创推文，排除回复
      if (t.isReply) continue;
      // 排除转推（retweeted_tweet 存在表示这是转推）
      if (t.retweeted_tweet) continue;
      // 互动阈值
      const likes = t.likeCount ?? 0;
      const rts = t.retweetCount ?? 0;
      const views = t.viewCount ?? 0;
      if (likes < MIN_LIKES || rts < MIN_RETWEETS || views < MIN_VIEWS) continue;
      // 文本不能是空或开头即 @
      const text = (t.text || "").trim();
      if (!text || text.startsWith("@")) continue;

      const authorName = t.author?.userName || t.author?.screen_name || "unknown";
      // 同一作者只取一条
      if (seenAuthors.has(authorName)) continue;
      seenAuthors.add(authorName);

      filtered.push({
        id: t.id || "",
        text: text,
        url: t.url || (t.id ? `https://x.com/i/status/${t.id}` : ""),
        author: authorName,
        created_at: t.createdAt || t.created_at || "",
      });
    }

    console.log(`[Twitter] "${query}": ${raw.length} raw → ${filtered.length} filtered`);
    return filtered;
  } catch (e: any) {
    console.error("[Twitter] search error:", e.message);
    return [];
  }
}

export async function getTrends(): Promise<string[]> {
  try {
    const response = await client.get("/twitter/trends");
    const trends = response.data?.trends || response.data?.data || response.data || [];
    if (Array.isArray(trends)) {
      return trends.map((t: any) => t.name || t.trend_name || t.title || t).filter(Boolean);
    }
    return [];
  } catch (e: any) {
    console.error("[Twitter] trends error:", e.message);
    return [];
  }
}
