import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: number;
  topic_id: number;
  type: string;
  message: string;
  sent: number;
  topic_title: string | null;
  source_url: string | null;
  created_at: string;
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emailConfig, setEmailConfig] = useState({
    email_to: "",
    email_smtp_host: "smtp.gmail.com",
    email_smtp_port: "587",
    email_smtp_user: "",
    email_smtp_pass: "",
  });
  const [saving, setSaving] = useState(false);
  const [browserEnabled, setBrowserEnabled] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=30");
      setNotifications(await res.json());
    } catch (e) {
      console.error("load notifications error", e);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((config) => {
        setEmailConfig((prev) => ({ ...prev, ...config }));
      })
      .catch(console.error);
  }, []);

  function enableBrowserNotifications() {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        setBrowserEnabled(perm === "granted");
        if (perm === "granted") {
          new Notification("🔥 热点监控已就绪", {
            body: "当发现新热点时会自动推送通知",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>",
          });
        }
      });
    }
  }

  // Browser push for new notifications
  useEffect(() => {
    if (!browserEnabled || notifications.length === 0) return;
    const latest = notifications[0];
    if (
      latest.type === "browser" &&
      new Date(latest.created_at).getTime() > Date.now() - 60000
    ) {
      new Notification("🔥 热点监控", {
        body: latest.message,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>",
      });
    }
  }, [notifications, browserEnabled]);

  async function saveEmailConfig() {
    setSaving(true);
    try {
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(emailConfig)) {
        cleaned[k] = String(v || "");
      }
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      alert("邮件配置已保存");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-lg font-semibold text-neon-purple font-mono mb-4">
        🔔 通知中心
      </h2>

      {/* Browser notification */}
      <div className="mb-4 p-3 rounded border border-dark-border bg-dark-surface">
        <p className="text-sm text-text-primary mb-2">🌐 浏览器推送通知</p>
        {browserEnabled ? (
          <span className="text-xs text-neon-green font-mono">✓ 已启用</span>
        ) : (
          <button
            onClick={enableBrowserNotifications}
            className="text-xs px-3 py-1 rounded bg-neon-purple/10 border border-neon-purple/30 text-neon-purple font-mono hover:bg-neon-purple/20 transition-colors"
          >
            启用浏览器通知
          </button>
        )}
      </div>

      {/* Email config */}
      <div className="mb-4 p-3 rounded border border-dark-border bg-dark-surface space-y-2">
        <p className="text-sm text-text-primary">📧 邮件通知配置</p>
        <input
          type="email"
          placeholder="接收通知的邮箱"
          value={emailConfig.email_to}
          onChange={(e) => setEmailConfig((c) => ({ ...c, email_to: e.target.value }))}
          className="terminal-input w-full px-2 py-1 rounded text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="SMTP 服务器"
            value={emailConfig.email_smtp_host}
            onChange={(e) => setEmailConfig((c) => ({ ...c, email_smtp_host: e.target.value }))}
            className="terminal-input px-2 py-1 rounded text-xs"
          />
          <input
            type="text"
            placeholder="端口"
            value={emailConfig.email_smtp_port}
            onChange={(e) => setEmailConfig((c) => ({ ...c, email_smtp_port: e.target.value }))}
            className="terminal-input px-2 py-1 rounded text-xs"
          />
        </div>
        <input
          type="text"
          placeholder="SMTP 用户名"
          value={emailConfig.email_smtp_user}
          onChange={(e) => setEmailConfig((c) => ({ ...c, email_smtp_user: e.target.value }))}
          className="terminal-input w-full px-2 py-1 rounded text-xs"
        />
        <input
          type="password"
          placeholder="SMTP 密码/授权码"
          value={emailConfig.email_smtp_pass}
          onChange={(e) => setEmailConfig((c) => ({ ...c, email_smtp_pass: e.target.value }))}
          className="terminal-input w-full px-2 py-1 rounded text-xs"
        />
        <button
          onClick={saveEmailConfig}
          disabled={saving}
          className="px-3 py-1 rounded bg-neon-purple/10 border border-neon-purple/30 text-neon-purple font-mono text-xs hover:bg-neon-purple/20 transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存邮件配置"}
        </button>
      </div>

      {/* Notification history */}
      <div>
        <p className="text-sm text-text-secondary mb-2 font-mono">
          通知历史 ({notifications.length})
        </p>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="text-xs text-text-secondary text-center py-4 font-mono">
              {'> '}暂无通知记录
            </p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-2 p-1.5 rounded text-xs border border-transparent hover:border-dark-border transition-colors"
            >
              <span className="text-neon-cyan font-mono flex-shrink-0">
                {n.type === "browser" ? "🔔" : "📧"}
              </span>
              <span className="text-text-primary truncate flex-1">
                {n.message}
              </span>
              <span className="text-text-secondary flex-shrink-0">
                {new Date(n.created_at).toLocaleTimeString("zh-CN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
