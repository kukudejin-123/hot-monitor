import cron from "node-cron";
import { getAllKeywords, insertTopic, getConfigValue, getNewTopics, markTopicsNotified } from "../db.js";
import { searchTweets, getTrends } from "./twitter.js";
import { scrapeSearch } from "./scraper.js";
import { verifyContent, verifyHotTopic } from "./verifier.js";
import { sendNotifications } from "./notifier.js";

let cronJob: cron.ScheduledTask | null = null;

export function startScheduler() {
  const interval = Number(getConfigValue("fetch_interval_min")) || 30;

  cronJob = cron.schedule(`*/${interval} * * * *`, async () => {
    console.log(`[Scheduler] Running fetch cycle (every ${interval} min)...`);
    try {
      await fetchAllSources();
      console.log("[Scheduler] Fetch cycle complete.");
    } catch (e: any) {
      console.error("[Scheduler] Error:", e.message);
    }
  });

  console.log(`[Scheduler] Started, every ${interval} minutes.`);
}

export function stopScheduler() {
  cronJob?.stop();
}

export async function fetchAllSources() {
  const keywords = getAllKeywords().filter((k) => k.active === 1);
  const results = { twitter: 0, web: 0, verified: 0, errors: 0 };

  for (const kw of keywords) {
    try {
      const tweets = await searchTweets(kw.word);
      for (const tweet of tweets.slice(0, 10)) {
        const ai = await verifyContent(kw.word, tweet.text.slice(0, 100), tweet.text);
        if (ai.relevant && ai.score >= getThreshold()) {
          const inserted = insertTopic({
            title: tweet.text.slice(0, 200),
            summary: tweet.text,
            source_url: tweet.url,
            source_type: "twitter",
            keyword_id: kw.id,
            ai_score: ai.score,
            ai_reason: ai.reason,
            verified: 1,
            engagement: { views: tweet.views, likes: tweet.likes, retweets: tweet.retweets },
          });
          if (inserted) results.verified++;
        }
        results.twitter++;
      }
    } catch (e: any) {
      console.error(`[Scheduler] Twitter error for "${kw.word}":`, e.message);
      results.errors++;
    }

    try {
      const webItems = await scrapeSearch(kw.word);
      for (const item of webItems.slice(0, 10)) {
        const ai = await verifyContent(kw.word, item.title, item.snippet);
        if (ai.relevant && ai.score >= getThreshold()) {
          const inserted = insertTopic({
            title: item.title,
            summary: item.snippet,
            source_url: item.url,
            source_type: item.source,
            keyword_id: kw.id,
            ai_score: ai.score,
            ai_reason: ai.reason,
            verified: 1,
            engagement: item.engagement || null,
          });
          if (inserted) results.verified++;
        }
        results.web++;
      }
    } catch (e: any) {
      console.error(`[Scheduler] Web error for "${kw.word}":`, e.message);
      results.errors++;
    }
  }

  // Fetch Twitter trends
  try {
    const trends = await getTrends();
    for (const trend of trends.slice(0, 20)) {
      const ai = await verifyHotTopic(trend, `Twitter 趋势话题: ${trend}`);
      if (ai.relevant && ai.score >= getThreshold()) {
        insertTopic({
          title: trend,
          summary: `Twitter 趋势: ${trend}`,
          source_url: "",
          source_type: "twitter",
          keyword_id: null,
          ai_score: ai.score,
          ai_reason: ai.reason,
          verified: 1,
        });
        results.verified++;
      }
    }
  } catch (e: any) {
    console.error("[Scheduler] Trends error:", e.message);
  }

  await sendNotifications();
  return results;
}

function getThreshold(): number {
  return Number(getConfigValue("ai_score_threshold")) || 6;
}
