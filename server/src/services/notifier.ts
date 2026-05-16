import nodemailer from "nodemailer";
import { getNewTopics, markTopicsNotified, insertNotification, getConfig } from "../db.js";

export async function sendNotifications() {
  const newTopics = getNewTopics();
  if (newTopics.length === 0) return;

  const config = getConfig();
  const notifiedIds: number[] = [];

  for (const topic of newTopics) {
    // Browser notification record
    insertNotification({
      topic_id: topic.id,
      type: "browser",
      message: `🔥 [${topic.keyword_word || "热点"}] ${topic.title}`,
    });

    // Email notification
    if (config.email_to && config.email_smtp_user) {
      try {
        await sendEmail(topic, config);
        insertNotification({
          topic_id: topic.id,
          type: "email",
          message: `邮件已发送: ${topic.title}`,
          sent: 1,
        });
      } catch (e: any) {
        console.error("[Notifier] Email error:", e.message);
        insertNotification({
          topic_id: topic.id,
          type: "email",
          message: `邮件发送失败: ${e.message}`,
        });
      }
    }

    notifiedIds.push(topic.id);
  }

  markTopicsNotified(notifiedIds);
}

async function sendEmail(topic: any, config: Record<string, string>) {
  const transporter = nodemailer.createTransport({
    host: config.email_smtp_host,
    port: Number(config.email_smtp_port) || 587,
    secure: false,
    auth: {
      user: config.email_smtp_user,
      pass: config.email_smtp_pass,
    },
  });

  await transporter.sendMail({
    from: config.email_smtp_user,
    to: config.email_to,
    subject: `🔥 热点监控: ${topic.title.slice(0, 50)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00ff88;">🔥 新的热点</h2>
        <h3>${topic.title}</h3>
        <p>${topic.summary || ""}</p>
        <p>AI 相关性评分: <strong>${topic.ai_score}/10</strong></p>
        <p>AI 判断: ${topic.ai_reason || "无"}</p>
        ${topic.source_url ? `<p><a href="${topic.source_url}">查看来源 →</a></p>` : ""}
      </div>
    `,
  });
}
