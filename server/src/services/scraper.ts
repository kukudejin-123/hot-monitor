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
 * 多源聚合搜索 — 稳定源优先
 */
export async function scrapeSearch(keyword: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  const engines = [
    { name: "bing",       fn: () => scrapeBing(keyword) },
    { name: "bing-news",  fn: () => scrapeBingNews(keyword) },
    { name: "hackernews", fn: () => scrapeHackerNews(keyword) },
    { name: "reddit",     fn: () => scrapeReddit(keyword) },
    { name: "google-news", fn: () => scrapeGoogleNewsRSS(keyword) },
    { name: "bilibili",   fn: () => scrapeBilibili(keyword) },
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
  $("div.news-card, article, .newsitem").each((_, el) => {
    const title = $(el).find("a.title, .title, h3 a").text().trim();
    const snippet = $(el).find(".snippet, .description").text().trim();
    const href = $(el).find("a.title, .title, h3 a").attr("href");
    if (title && href && title.length > 10 && title.length < 200) {
      results.push({ title, snippet, url: href, source: "bing-news" });
    }
  });
  return results.slice(0, 10);
}

// ─── Hacker News (Algolia API) ────────────────────────

async function scrapeHackerNews(query: string): Promise<ScrapedItem[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`;
  const res = await axios.get(url, { timeout: 10000 });
  const hits = res.data?.hits || [];
  return hits.map((h: any) => ({
    title: h.title || "",
    snippet: `${h.points || 0} points · ${h.num_comments || 0} comments`,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: "hackernews",
  }));
}

// ─── Reddit ───────────────────────────────────────────

const REDDIT_SUBS = ["MachineLearning", "artificial", "singularity"];

async function scrapeReddit(keyword: string): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const query = keyword.toLowerCase();

  for (const sub of REDDIT_SUBS) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=10&restrict_sr=on`;
      const res = await axios.get(url, {
        headers: { "User-Agent": `${UA} (by /u/hotmonitor)` },
        timeout: 10000,
      });
      const posts = res.data?.data?.children || [];
      for (const p of posts) {
        const d = p.data;
        if (!d.title) continue;

        // 按关键词简单匹配
        const titleLower = d.title.toLowerCase();
        const selftext = (d.selftext || "").toLowerCase();
        if (!titleLower.includes(query) && !selftext.includes(query)) continue;

        results.push({
          title: d.title,
          snippet: `r/${d.subreddit} · ${d.score} upvotes · ${d.num_comments} comments`,
          url: `https://www.reddit.com${d.permalink}`,
          source: "reddit",
        });
      }
    } catch {
      // 静默跳过
    }
  }

  return results.slice(0, 15);
}

// ─── Google News RSS ──────────────────────────────────

async function scrapeGoogleNewsRSS(keyword: string): Promise<ScrapedItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
    const res = await axios.get(url, {
      headers: { "User-Agent": UA },
      timeout: 10000,
    });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const results: ScrapedItem[] = [];

    $("item").each((_, el) => {
      const title = $(el).find("title").text().trim();
      const link = $(el).find("link").text().trim();
      const description = $(el).find("description").text().trim();
      const source = $(el).find("source").text().trim();

      // 提取纯文本（去掉 HTML）
      const plainText = description.replace(/<[^>]+>/g, "").slice(0, 200);

      if (title && link) {
        results.push({
          title,
          snippet: source ? `${source} · ${plainText}` : plainText,
          url: link,
          source: "google-news",
        });
      }
    });

    return results.slice(0, 15);
  } catch {
    return [];
  }
}

// ─── B站 (Bilibili) ───────────────────────────────────

async function scrapeBilibili(keyword: string): Promise<ScrapedItem[]> {
  try {
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1`;
    const res = await axios.get(url, {
      headers: { "User-Agent": UA, Referer: "https://www.bilibili.com/" },
      timeout: 10000,
    });
    const list = res.data?.data?.result || [];
    return list.slice(0, 10).map((v: any) => ({
      title: v.title?.replace(/<[^>]+>/g, "") || "",
      snippet: `${v.author || ""} · 播放 ${v.play || 0}`,
      url: `https://www.bilibili.com/video/${v.bvid || v.aid}`,
      source: "bilibili",
    }));
  } catch {
    return [];
  }
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
