import axios from "axios";

const API_KEY = process.env.TWITTERAPI_IO_KEY || "";
const BASE_URL = "https://api.twitterapi.io";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "X-API-Key": API_KEY },
  timeout: 15000,
});

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
      params: {
        query,
        queryType: "Latest",
      },
    });
    const tweets = response.data?.tweets || response.data?.data || [];
    return tweets.map((t: any) => ({
      id: t.id || t.tweet_id || "",
      text: t.text || t.full_text || t.content || "",
      url: t.url || (t.id ? `https://x.com/i/status/${t.id}` : ""),
      author: t.author?.userName || t.author?.screen_name || t.user?.screen_name || "unknown",
      created_at: t.createdAt || t.created_at || t.timestamp || "",
    }));
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
