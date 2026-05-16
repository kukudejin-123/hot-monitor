import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data.json");

interface DBData {
  keywords: any[];
  topics: any[];
  notifications: any[];
  config: Record<string, string>;
  _id_counter: number;
}

const defaults: DBData = {
  keywords: [],
  topics: [],
  notifications: [],
  config: {
    email_to: "",
    email_smtp_host: "smtp.gmail.com",
    email_smtp_port: "587",
    email_smtp_user: "",
    email_smtp_pass: "",
    fetch_interval_min: "30",
    ai_score_threshold: "6",
  },
  _id_counter: 1,
};

function read(): DBData {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaults, null, 2));
      return JSON.parse(JSON.stringify(defaults));
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(defaults));
  }
}

function write(data: DBData) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(data: DBData): number {
  return data._id_counter++;
}

// ---- Keywords ----

export function getAllKeywords() {
  const db = read();
  return db.keywords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function insertKeyword(word: string, category: string) {
  const db = read();
  const existing = db.keywords.find((k) => k.word === word && k.active === 1);
  if (existing) return null;
  const kw = {
    id: nextId(db),
    word,
    category: category || "general",
    active: 1,
    created_at: new Date().toISOString(),
  };
  db.keywords.push(kw);
  write(db);
  return kw;
}

export function updateKeyword(id: number, updates: { word?: string; category?: string; active?: number }) {
  const db = read();
  const kw = db.keywords.find((k) => k.id === id);
  if (!kw) return null;
  if (updates.word !== undefined) kw.word = updates.word;
  if (updates.category !== undefined) kw.category = updates.category;
  if (updates.active !== undefined) kw.active = updates.active;
  write(db);
  return kw;
}

export function deleteKeyword(id: number) {
  const db = read();
  db.keywords = db.keywords.filter((k) => k.id !== id);
  write(db);
}

// ---- Topics ----

export function getTopics(opts: {
  page?: number;
  limit?: number;
  keyword_id?: number;
  verified?: number;
}) {
  const db = read();
  const { page = 1, limit = 20, keyword_id, verified } = opts;
  let list = [...db.topics];

  if (keyword_id !== undefined) list = list.filter((t) => t.keyword_id === keyword_id);
  if (verified !== undefined) list = list.filter((t) => t.verified === verified);

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  // Attach keyword word
  const topics = paged.map((t) => {
    const kw = db.keywords.find((k) => k.id === t.keyword_id);
    return { ...t, keyword_word: kw?.word || null };
  });

  return { topics, total, page, limit };
}

export function insertTopic(topic: {
  title: string;
  summary?: string;
  source_url?: string;
  source_type?: string;
  keyword_id?: number | null;
  ai_score?: number;
  ai_reason?: string;
  verified?: number;
}) {
  const db = read();
  // Check duplicate by URL
  if (topic.source_url) {
    const dup = db.topics.find((t) => t.source_url === topic.source_url);
    if (dup) return null;
  }
  const t = {
    id: nextId(db),
    title: topic.title,
    summary: topic.summary || "",
    source_url: topic.source_url || "",
    source_type: topic.source_type || "web",
    keyword_id: topic.keyword_id || null,
    ai_score: topic.ai_score || 0,
    ai_reason: topic.ai_reason || "",
    verified: topic.verified ?? 1,
    is_new: 1,
    created_at: new Date().toISOString(),
  };
  db.topics.push(t);
  write(db);
  return t;
}

export function markTopicRead(id: number) {
  const db = read();
  const t = db.topics.find((t) => t.id === id);
  if (t) {
    t.is_new = 0;
    write(db);
  }
}

export function markTopicsNotified(ids: number[]) {
  const db = read();
  for (const t of db.topics) {
    if (ids.includes(t.id)) t.is_new = 0;
  }
  write(db);
}

export function getNewTopics() {
  const db = read();
  return db.topics
    .filter((t) => t.is_new === 1 && t.verified === 1)
    .map((t) => {
      const kw = db.keywords.find((k) => k.id === t.keyword_id);
      return { ...t, keyword_word: kw?.word || null };
    });
}

// ---- Notifications ----

export function getAllNotifications(limit: number = 50) {
  const db = read();
  return db.notifications
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map((n) => {
      const t = db.topics.find((t) => t.id === n.topic_id);
      return { ...n, topic_title: t?.title || null, source_url: t?.source_url || null };
    });
}

export function insertNotification(notif: {
  topic_id: number;
  type: string;
  message: string;
  sent?: number;
}) {
  const db = read();
  const n = {
    id: nextId(db),
    topic_id: notif.topic_id,
    type: notif.type,
    message: notif.message,
    sent: notif.sent ?? 0,
    created_at: new Date().toISOString(),
  };
  db.notifications.push(n);
  write(db);
  return n;
}

export function clearNotifications() {
  const db = read();
  db.notifications = [];
  write(db);
}

// ---- Config ----

export function getConfig(): Record<string, string> {
  const db = read();
  return { ...db.config };
}

export function updateConfig(updates: Record<string, string>) {
  const db = read();
  for (const [key, value] of Object.entries(updates)) {
    db.config[key] = String(value);
  }
  write(db);
}

export function getConfigValue(key: string): string {
  const db = read();
  return db.config[key] || "";
}
