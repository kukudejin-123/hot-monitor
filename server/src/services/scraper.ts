import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * 多源聚合搜索 — 8 个信息源并行采集
 */
export async function scrapeSearch(keyword: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  const engines = [
    { name: "bing",       fn: () => scrapeBing(keyword) },
    { name: "bing-news",  fn: () => scrapeBingNews(keyword) },
    { name: "google",     fn: () => scrapeGoogle(keyword) },
    { name: "duckduckgo", fn: () => scrapeDuckDuckGo(keyword) },
    { name: "hackernews", fn: () => scrapeHackerNews(keyword) },
    { name: "sogou",      fn: () => scrapeSogou(keyword) },
    { name: "bilibili",   fn: () => scrapeBilibili(keyword) },
    { name: "weibo",      fn: () => scrapeWeibo(keyword) },
  ];

  for (const engine of engines) {
    try {
      const results = await engine.fn();
      items.push(...results);
    } catch (e: any) {
      console.error(`[Scraper] ${engine.name} error:`, e.message);
    }
  }

  return dedupByUrl(items);
}

// ─── Bing ────────────────────────────────────────────

async function scrapeBing(query: string): Promise<ScrapedItem[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  const res = await axios.get(url, {
    headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
    timeout: 10000,
  });
  const $ = cheerio.load(res.data);
  const results: ScrapedItem[] = [];
  $("li.b_algo").each((_, el) => {
    const title = $(el).find("h2 a").text().trim();
    const snippet = $(el).find(".b_caption p, .b_lineclamp2").text().trim();
    const href = $(el).find("h2 a").attr("href");
    if (title && href) results.push({ title, snippet, url: href, source: "bing" });
  });
  return results;
}

async function scrapeBingNews(query: string): Promise<ScrapedItem[]> {
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&qft=interval%3d%227%22`;
  const res = await axios.get(url, {
    headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
    timeout: 10000,
  });
  const $ = cheerio.load(res.data);
  const results: ScrapedItem[] = [];
  $("div.news-card, article, .newsitem, a[href^='http']").each((_, el) => {
    const title = $(el).find("a.title, .title, h3 a").text().trim() || $(el).text().trim();
    const snippet = $(el).find(".snippet, .description").text().trim();
    const href = $(el).find("a.title, .title, h3 a").attr("href") || $(el).attr("href");
    if (title && href && title.length > 10 && title.length < 200) {
      results.push({ title, snippet, url: href, source: "bing-news" });
    }
  });
  return results.slice(0, 10);
}

// ─── Google ───────────────────────────────────────────

async function scrapeGoogle(query: string): Promise<ScrapedItem[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbs=qdr:w&hl=zh-CN&num=10`;
  const res = await axios.get(url, {
    headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
    timeout: 12000,
  });
  const $ = cheerio.load(res.data);
  const results: ScrapedItem[] = [];
  $("div.g, div[data-sokoban-container]").each((_, el) => {
    const title = $(el).find("h3").text().trim();
    const snippet = $(el).find("div[data-sncf], span.aCOpRe, div.VwiC3b").text().trim();
    const href = $(el).find("a[href^='http']").first().attr("href");
    if (title && href && href.startsWith("http")) {
      results.push({ title, snippet, url: href, source: "google" });
    }
  });
  return results.slice(0, 10);
}

// ─── DuckDuckGo ───────────────────────────────────────

async function scrapeDuckDuckGo(query: string): Promise<ScrapedItem[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await axios.get(url, {
    headers: { "User-Agent": UA },
    timeout: 10000,
  });
  const $ = cheerio.load(res.data);
  const results: ScrapedItem[] = [];
  $(".result").each((_, el) => {
    const title = $(el).find(".result__title a, .result__a").text().trim();
    const snippet = $(el).find(".result__snippet").text().trim();
    const href = $(el).find(".result__title a, .result__a").attr("href");
    if (title && href) results.push({ title, snippet, url: href, source: "duckduckgo" });
  });
  return results;
}

// ─── Hacker News (Algolia API) ────────────────────────

async function scrapeHackerNews(query: string): Promise<ScrapedItem[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`;
  const res = await axios.get(url, { timeout: 10000 });
  const hits = res.data?.hits || [];
  return hits.map((h: any) => ({
    title: h.title || "",
    snippet: h.story_text || h.comment_text || `HN | ${h.points} points | ${h.num_comments} comments`,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: "hackernews",
  }));
}

// ─── 搜狗 ─────────────────────────────────────────────

async function scrapeSogou(query: string): Promise<ScrapedItem[]> {
  const url = `https://www.sogou.com/web?query=${encodeURIComponent(query)}`;
  const res = await axios.get(url, {
    headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
    timeout: 10000,
  });
  const $ = cheerio.load(res.data);
  const results: ScrapedItem[] = [];
  $(".results .rb, .vrwrap").each((_, el) => {
    const title = $(el).find("h3 a, .vr-title").text().trim();
    const snippet = $(el).find(".str-text, .star-wiki, .space-txt").text().trim();
    const href = $(el).find("h3 a, .vr-title").attr("href");
    if (title && href) results.push({ title, snippet, url: href, source: "sogou" });
  });
  return results.slice(0, 10);
}

// ─── B站 (Bilibili) ───────────────────────────────────

async function scrapeBilibili(keyword: string): Promise<ScrapedItem[]> {
  const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1`;
  const res = await axios.get(url, {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.bilibili.com/",
    },
    timeout: 10000,
  });
  const list = res.data?.data?.result || [];
  return list.slice(0, 10).map((v: any) => ({
    title: v.title?.replace(/<[^>]+>/g, "") || "",
    snippet: `${v.author || ""} · 播放 ${v.play || 0}`,
    url: `https://www.bilibili.com/video/${v.bvid || v.aid}`,
    source: "bilibili",
  }));
}

// ─── 微博 ────────────────────────────────────────────

async function scrapeWeibo(keyword: string): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  // 1. 微博搜索
  try {
    const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`;
    const res = await axios.get(url, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      timeout: 10000,
    });
    const $ = cheerio.load(res.data);
    $(".card-wrap").each((_, el) => {
      const title = $(el).find(".txt").text().trim().replace(/\s+/g, " ").slice(0, 200);
      const href = $(el).find("a[href*='weibo.com']").attr("href");
      if (title && href) {
        results.push({ title, snippet: "", url: `https:${href}`, source: "weibo" });
      }
    });
  } catch {
    // 微博反爬严格，静默失败
  }

  // 2. 微博热搜 — 仅当关键词属于通用 AI 范围时拉取
  try {
    const hotUrl = "https://s.weibo.com/top/summary";
    const res = await axios.get(hotUrl, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      timeout: 10000,
    });
    const $ = cheerio.load(res.data);
    $("#pl_top_realtimehot table tbody tr").each((_, el) => {
      const title = $(el).find(".td-02 a").text().trim();
      const href = $(el).find(".td-02 a").attr("href");
      const count = $(el).find(".td-02 span").text().trim();
      if (title && href && title.length > 1 && title.length < 100) {
        results.push({
          title,
          snippet: count ? `热搜热度: ${count}` : "",
          url: `https://s.weibo.com${href}`,
          source: "weibo-hot",
        });
      }
    });
  } catch {
    // 静默失败
  }

  return results.slice(0, 10);
}

// ─── 去重 ─────────────────────────────────────────────

function dedupByUrl(items: ScrapedItem[]): ScrapedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
